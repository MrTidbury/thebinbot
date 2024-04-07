import vobject
from dotenv import load_dotenv
from twilio.rest import Client
import os
import pprint
import sys
from urllib.parse import urlencode
import requests
import yaml
import phonenumbers
import subprocess
from google.cloud import firestore
from google.protobuf import timestamp_pb2
import datetime

def new():
    # Create a client object

    config = load_config()

    db = firestore.Client()

    # Reference to the collection
    collection_ref = db.collection('bbusers')

    for user in config["users"]:
        user = {
            "bin_data": {},
            "post_code": user["postCode"],
            "street_address": user["streetAddress"],
            "phone": user["phone"],
            "council": user["council"],
            "first_name": user['alias'],
            "username": user['alias'].lower(),
            "remind_on": 18,
            "cached_on": firestore.SERVER_TIMESTAMP
        }
        time_stamp, doc_ref = collection_ref.add(user)
        print(doc_ref)
        print(f'Added document with ID: {doc_ref.id}')



    # Retrieve all documents in the collection
    docs = collection_ref.stream()

    # Iterate over the documents and print them
    for doc in docs:
        print(f'{doc.id} => {doc.to_dict()}')

def convert_to_e164(phone_number):
    # Parse the phone number
    parsed_number = phonenumbers.parse(phone_number, "GB")

    # Check if the number is valid
    if not phonenumbers.is_valid_number(parsed_number):
        raise ValueError("Invalid phone number")

    # Format the number as E.164
    return phonenumbers.format_number(parsed_number, phonenumbers.PhoneNumberFormat.E164)


def main():
    load_dotenv()
    twilio_sid = os.getenv("TWILIO_SID")
    twilio_auth = os.getenv("TWILIO_AUTH")
    twilio_client = Client(twilio_sid, twilio_auth)

    print("ADDING NEW USER TO BINBOT")
    alias = input("Enter user alias: > ")
    phone_number = input("Enter user phone number: > ")
    street_addres = input("Enter user street adress: > ")
    post_code = input("Enter user postcode: > ")
    council = input("Enter user council: > ")

    try:
        phone_number = convert_to_e164(phone_number)
    except ValueError as e:
        print(f"Invalid phone number: {e}")
        sys.exit(1)


    def check_user_info():
        print("\n")
        print("=====================================")
        print(f"Alias: {alias}")
        print(f"Phone Number: {phone_number}")
        print(f"Street Address: {street_addres}")
        print(f"Post Code: {post_code}")
        print(f"Council: {council}")
        print("=====================================")
        print("\n")
        confirm = input("Is this information correct? (y/n): > ")
        
        
        if confirm.lower() == "y":
             # Work out if this all works...
            url = f"https://europe-west2-bin-bot-364810.cloudfunctions.net/binbot-scraper/{council}"
            params = {
                "streetAddress": street_addres,
                "postCode": post_code,
            }
            url_with_params = url + "?" + urlencode(params)
            try:
                print("Checking user data with API...")
                resp = requests.get(url_with_params, headers={"x-api-key": os.getenv("API_KEY")})
            # Catch any errors and log them...
            except Exception as e:
                return False, str(e)
            # Check the response code...
            if resp.status_code == 200:
                # Response was good...
                bin_data = resp.json()['result']
                print("\t Data received from API.. looks good!")
                return True, None
            else:
                # Handle any errors from the API.
                print(resp.text)
                print("\t Error Getting data from API...")
                return False, resp.text
        else:
            return False
       
    all_good, errors = check_user_info()

    if not all_good:
        print(f"There was an error with the user data. Please try again. {errors}")
        sys.exit(1)
    
    new_user = {
        "bin_data": None,
        "cache_updated_on": None,
        "first_name": alias,
        "username": alias.lower(),
        "phone": phone_number,
        "street_address": street_addres,
        "post_code": post_code,
        "council": council
    }


    db = firestore.Client()
    # Reference to the collection
    print("Adding user to firestore...")
    collection_ref = db.collection('bbusers')
    time_stamp, doc_ref = collection_ref.add(new_user)
    print(f'\t Added document with ID: {doc_ref.id}')
    print("User added to config, updating cache...")

    # Update the cache
    url = f"https://europe-west2-bin-bot-364810.cloudfunctions.net/binbot-spawner/refreshcache"
    resp = requests.get(url, headers={"x-api-key": os.getenv("API_KEY")})
    print("\t Cache updated!")
    message = "🤖 Hello there I'm BinBot! 🎉\n\nWelcome aboard! You've been successfully set up to receive reminders about when to put the bins out. 🗑️✨\n\nFrom now on, you'll receive an automatic text the night before the bins will be collected. 📱🌙 Additionally, you can always text 'WHEN' at any time to get the latest collection information. 📆💬\n\nAnd hey, it might be a good idea to save this number in your contacts, so you never miss out on any important reminders!\n\nIf you ever have any questions or need assistance, feel free to reach out. Happy binning! 🚮🌟"
    print(f"Sending welcome message to user... {phone_number}")
    try:
        resp = twilio_client.messages.create(
            to=phone_number,
            from_="+447488892773",
            body=message
        )
        print("\t Message sent!")
    except Exception as e:
        print(f"Error sending message: {e}")


if __name__ == "__main__":
    main()


    