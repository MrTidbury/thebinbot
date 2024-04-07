import functions_framework
import os
import requests
import yaml
import logging
import json
from urllib.parse import urlencode
from markupsafe import escape
from dotenv import load_dotenv
from datetime import datetime, timedelta
from twilio.rest import Client
from twilio.twiml.messaging_response import MessagingResponse
from google.cloud import firestore
from google.protobuf import timestamp_pb2


class BBUser:
    """Class used for managing user data for the BinBot system. This was put in place 
    to make it easier to migrate to a DB in the future.
    """
    def __init__(self, alias, phone, council, streetAddress, postCode, bin_data, cache_updated_on, base_url):
        self.alias = alias
        self.phone = phone
        self.council = council
        self.streetAddress = streetAddress
        self.postCode = postCode
        self.bin_data = self.parse_bin_data(bin_data)
        self.cache_updated_on = cache_updated_on
        self.url = self.get_url(base_url)

    def parse_bin_data(self, bin_data):
        """Used to parse the bin data from the json string we store
        in the firestore database.

        Args:
            bin_data (str): String of json data to parse.

        Returns:
            dict: Parsed and sorted bin data.
        """
        parsed_bin_data = {}
        bin_data = json.loads(bin_data)
        for key, value in bin_data.items():
            if value:
                parsed_bin_data[key] = datetime.fromisoformat(value[:-1])
            else:
                parsed_bin_data[key] = None
        # Sort the data by date...
        sorted_dates = sorted(parsed_bin_data.items(), key=lambda x: x[1])
        # Return the sorted data...
        return sorted_dates

    def get_url(self, base_url):
        """Helper function to generate the URL for the user to get their bin data.

        Args:
            base_url (str): The base url of the scraper function to get the bin data.

        Returns:
            string: A fully formed URL with the user data as query parameters.
        """
        url = f"{base_url}/{self.council}"
        params = {
            "streetAddress": self.streetAddress,
            "postCode": self.postCode,
        }
        url_with_params = url + "?" + urlencode(params)
        return url_with_params
    
    @classmethod
    def load_users(cls, base_url):
        """Load the users from firestore, and return them as a list of BBUser objects.

        Returns:
            list[BBUser]: A list of BBUsers loaded from firestore.
        """

        print("Loading users from firestore...")
        db = firestore.Client()
        collection_ref = db.collection('bbusers')

        # Retrieve all documents in the collection
        docs = collection_ref.stream()

        users = []
        for doc in docs:
            data = doc.to_dict()
            user = cls(data["first_name"], data["phone"], data["council"], data["street_address"], data["post_code"], data['bin_data'], data['cache_updated_on'], base_url)
            users.append(user)
        
        print(f"\t Loaded {len(users)} users")
        return users

    def __str__(self):
        """Custom to string func for the BBUser class. Used for debugging / logging.
        Returns:
            _type_: _description_
        """
        return f"User: {self.alias} - {self.council} - {self.streetAddress} - {self.postCode}"


class BinBot:
    """Bin bot main class. This class is used to manage the main functionality of the BinBot system. This system is used in 2 main ways, 
    the first is to send daily reminders to users about their upcoming bin collections. The second is to process incoming messages from users
    and respond to them with the relevant information.
    """
    def __init__(self, safe_run=False, local=False):
        self.FORCE_SEND = True
        self.local = local
        self.ONLY_RUN_FOR_JACK = True
        self.api_key = os.environ.get("API_KEY")
        self.twilio_auth = os.environ.get("TWILIO_AUTH")
        self.twilio_sid = os.environ.get("TWILIO_SID")
        self.twilio_sender = os.environ.get("TWILIO_SENDER")
        self.safe_run = safe_run
        self.scraper_url = "https://europe-west2-bin-bot-364810.cloudfunctions.net/binbot-scraper"
        self.users = BBUser.load_users(self.scraper_url)
        self.twilio_client = Client(self.twilio_sid, self.twilio_auth)
        self.siren_unicode = "\U0001F6A8"
        self.robot_unicode = "\U0001F916"
        print("BinBot initialising...")
        print(f"SAFE RUN: {self.safe_run}")
        print(f"Loaded {len(self.users)} users")
        print("BinBot initialised")
        pass
    

    def sms_me_error(self, message):
        """Function used to send me an SMS when an error occurs. This is used for debugging and monitoring the system."""
        if self.local:
            print(f"SMS ME ERROR: {message}")
        else:
            return self.twilio_client.messages.create(to="+447788591799",from_=self.twilio_sender,body=f"BinBotError: {message}")

    def check_cache_age(self, user):
        """Function to check the age on a cache. If the cache is older than 5 days we will skip this user and not send them a reminder.

        Args:
            user (BBuser): User to check the cache on

        Returns:
            bool: True if the cache is up to date, False if the cache is out of date.
        """
        cache_last_updated = user.cache_updated_on
        # If the cache was updated today, skip this user...
        current_time = datetime.now()
        # Convert Firestore timestamp to epoch time (milliseconds)
        firestore_epoch_time = cache_last_updated.timestamp() * 1000
        # Convert current time to epoch time (milliseconds)
        current_epoch_time = current_time.timestamp() * 1000
        # Calculate the difference
        difference = current_epoch_time - firestore_epoch_time
        if difference > 5 * 24 * 60 * 60 * 1000:
            self.sms_me_error(f"Cache is out of date for user: {user.alias}")
            return False
        return True

    def daily_triger(self):
        """This is the function that is called when this script is run by the daily trigger. This function will loop through the users
        and call out to get the latest bin data for each user. It will then process the data and send reminders if needed (if the collection date is tommorow)
        """
        logging.info("Running Daily trigger...")
        # Loop through the users...
        for user in self.users:
            try:
                if self.ONLY_RUN_FOR_JACK:
                    if user.alias != "Jack":
                        continue
                # Add this to the log to help with debugging...
                print(f"\t Running for user: {user.alias}")
                # Get the bin data for the user...

                bin_data = user.bin_data
                cache_ok = self.check_cache_age(user)
                if not cache_ok:
                    continue

                # Process the bin data for the user...
                self.process_bin_data_for_reminders(user, bin_data) 
            except Exception as e:
                self.sms_me_error(f"Error processing user: {user.alias} - {e}")
         
        return

    def process_bin_data_for_reminders(self, user, bin_data):
        """This function looks at the data from the API and works out if we need to send a message to the user. If we do, we will send a message to the user using
        the Twilio API.

        Args:
            user (BBUser): The user object to send the message to.
            bin_data (dict): The parsed bin data for the user.
        """
        # Work out which bins to send reminders for...
        send_reminders = {}
        for bin_type, bin_date in bin_data:
            # Used for testing only, will force send reminders for all bins...
            if self.FORCE_SEND:
                send_reminders[bin_type] = True
            else:
                # Defult to false normally, this will be overriden if the date is tommorow...
                send_reminders[bin_type] = False
        # Compare the bin dates to tommorow to see if we need to send reminders...
        tommorow = datetime.now() + timedelta(days=1)
        for bin_type, bin_date in bin_data:
            if bin_date is not None:
                if bin_date.date() == tommorow.date():
                    send_reminders[bin_type] = True
        # if we need to send any reminders then send them...
        if any(send_reminders.values()):
            message = f"{self.siren_unicode} Reminder {self.siren_unicode} \n The following bins are due for collection tommorow:\n\n"
            for bin_type, send in send_reminders.items():
                if send:
                    message += f"-  {bin_type}\n"
            message += f"\nRemember: you can reply 'WHEN' at anytime to see a list of your upcoming collections \n\n - {self.robot_unicode} TheBinBot"
            print(f"Sending message to {user.alias}")
            self.twilio_client.messages.create(
                to=user.phone,
                from_=self.twilio_sender,
                body=message
            )
        return

    def process_incomeing_message(self, from_number, body):
    def process_incomeing_message(self, from_number, body):
        """THis function is triggered when an incoming message is recieved by the Twilio webhook. This function will process the message and send a response to the user.

        Args:
            from_number (string): The phone number the message was sent from.
            body (string): The body of the incoming message.
        """
        # Load the message and user data...
        print("Processing incoming message")
        # Finf the user by looking up the phone number...
        user = None
        for user in self.users:
            if user.phone == from_number:
                user = user
                break
        # Log these...
        print(f"User: {user.alias}")
        print(f"Body: {body}")
        # User not found, send a message to let them know...
        if not user:
            message = f"Sorry, looks like I don't know you. Please contact Jack to add you to the system \n\n - {self.robot_unicode} TheBinBot"
            self.twilio_client.messages.create(
                to=from_number,
                from_=self.twilio_sender,
                body=message
            )
            return
        # Senfing WHEN will trigger us to send them the next collections...
        if body.lower() == "when":
            # Get the bin data for the user...
            bin_data = user.bin_data
            cache_ok = self.check_cache_age(user)
            # Cache is out of date, send the user a message to let them know...
            if not cache_ok:
                self.twilio_client.messages.create(
                    to=from_number,
                    from_=self.twilio_sender,
                    body="Sorry, I couldn't get the data for you. Please try again later. If the problem persists please contact Jack."
                )
                return

            # Data returned, send the user the data...
            message = f"Hot off the press, here are your next collections:\n\n"
            # Loop through the data and build the message...
            print(bin_data)
            for bin_type, bin_date in bin_data:
                if bin_date is not None:
                    message += f"- {bin_type}: {bin_date.strftime('%A %d %B')}\n"
                else:
                    message += f"- {bin_type} - No data available\n"
            message += f"\n\n- {self.robot_unicode} TheBinBot"
            # Send the message...
            self.twilio_client.messages.create(
                to=from_number,
                from_=self.twilio_sender,
                body=message
            )
            return
        else:
            # Not a recongised command, send the user a help message...
            message = f"Sorry, I didn't understand that. Im still learning but currently you can ask me the following \n \n - WHEN: gets the latest bin collection dates for you \n\n - {self.robot_unicode} TheBinBot"
            self.twilio_client.messages.create(
                to=from_number,
                from_=self.twilio_sender,
                body=message
            )
        return

# This is the main entry point for the function. This is the function that will be called by the cloud function.
@functions_framework.http
def main(request):
    # Set up the logging...
    import google.cloud.logging
    client = google.cloud.logging.Client()
    client.setup_logging()
    # Load the request data...
    request_json = request.get_json(silent=True)
    request_args = request.args
    path = request.path
    #   Log the request path...
    print(f"Request path: {path}")
    # This is the path the cron job will hit to trigger the daily reminders...
    if path == "/dailytrigger":
        # Create a new instance of the BinBot class...
        binbot = BinBot()
        # Check the API key is present and correct...
        if 'x-api-key' not in request.headers or request.headers['x-api-key'] != binbot.api_key:
            return 'Forbidden: API key is missing or invalid', 403
        else:
            # Trigger the daily reminders...
            binbot.daily_triger()
            return 'OK', 200
    # This is the path the Twilio webhook will hit to process incoming messages...
    elif path == "/twiliowebhook":
        # Create a new instance of the BinBot class...
        binbot = BinBot()
        # Load up the incoming message data...
        request_json = request.get_json(silent=True)
        body = request.values.get('Body', None)
        body = body.strip().lower()
        from_number = request.values.get('From', None)
        # Trigger the bot to process the incoming message...
        binbot.process_incomeing_message(from_number, body)
        resp = MessagingResponse()
        return str(resp), 200
    else:
        # No path found, return a 404...
        return 'Not Found', 404

if __name__ == "__main__":
    # When run locally this is the entry point...
    print("Running locally")
    # Load the .env file...
    load_dotenv()
    # Create a new class and trigger the daily reminders...
    bb = BinBot(safe_run=True, local=True)
    bb.daily_triger()



