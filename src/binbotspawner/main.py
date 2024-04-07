import functions_framework
import os
import requests
import logging
import time
import asyncio
import aiohttp
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
    def __init__(self, alias, phone, council, streetAddress, postCode, doc_id, base_url):
        self.alias = alias
        self.phone = phone
        self.council = council
        self.streetAddress = streetAddress
        self.postCode = postCode
        self.doc_id = doc_id
        self.url = self.get_url(base_url)

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
            user = cls(data["first_name"], data["phone"], data["council"], data["street_address"], data["post_code"], doc.id, base_url)
            users.append(user)
        
        print(f"\t Loaded {len(users)} users")
        return users

    def __str__(self):
        """Custom to string func for the BBUser class. Used for debugging / logging.
        Returns:
            _type_: _description_
        """
        return f"User: {self.alias} - {self.council} - {self.streetAddress} - {self.postCode}"

class BBSpawner():
    def __init__(self):
        self.base_url = "https://europe-west2-bin-bot-364810.cloudfunctions.net/binbot-scraper"
        self.users = BBUser.load_users(self.base_url)
        self.api_key = os.environ.get("API_KEY")
    
    async def fetch_url(self, session, user):
        """Asnyc function used to fetch the URL for a user.

        Args:
            session (aiohttp.session): Aiohttp session to make the request in
            user (BBuser): User to make the request for.

        Raises:
            Exception: If something goes wrong with the request.

        Returns:
            task: A task that needs to be awaited to get the response.
        """
        async with session.get(user.url, headers={"x-api-key": self.api_key}, ssl=False) as response:
            if response.status != 200:
                try:
                    js = await response.json()
                    error = js.get("errors")
                    raise Exception(f"Failed to fetch URL for {user.alias}: {error}")
                except Exception as e:
                    raise Exception(f"Failed to fetch URL: {user.url}. Error: {e}")
            else:
                return user, await response.json()

    async def fetch_all_urls(self):
        """Function to take a list of users and fetch the URL for each of them.

        Returns:
            dict: A dictionary of the user and the response from the URL.
        """
        async with aiohttp.ClientSession() as session:
            tasks = [self.fetch_url(session, user) for user in self.users]
            responses = await asyncio.gather(*tasks)
            return {user: response for user, response in responses}

    async def refresh_cache(self):
        """Refresh the cache for all users in the system.
        """
        errors = []
        db = firestore.Client()
        collection_ref = db.collection('bbusers')
        try:
            user_responses = await self.fetch_all_urls()
            # Do something with user_responses
            for user, response in user_responses.items():
                try:
                    doc_ref = collection_ref.document(user.doc_id)
                    doc_ref.update({'bin_data': json.dumps(response['result']), 'cache_updated_on': firestore.SERVER_TIMESTAMP})
                except Exception as e:
                    errors.append(e)

        except Exception as e:
            errors.append(e)
            print(f"Error: {e}")

        print(f"Updated cache for {len(self.users) - len(errors)} users")
        print(f"Errors: {errors}")

    def refresh_cache_sync(self):
        """ Call the refresh cache function synchronously."""
        asyncio.run(self.refresh_cache())
        

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
    bbs = BBSpawner()

    if path == "/refreshcache":
        bbs.refresh_cache_sync()
        return "Cache Updated", 200
    else:
        return "Invalid Path", 404


if __name__ == "__main__":
    print("Starting BBSpawner Locally...")
    load_dotenv()
    bbs = BBSpawner()
    start_time = time.time()
    bbs.refresh_cache_sync()
    end_time = time.time()
    print(f"Time taken: {end_time - start_time} seconds")
    