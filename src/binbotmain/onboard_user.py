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


def load_config():
    """Load the config file for the BinBot system. This is used to store the user data and other system settings.

    Returns:
        dict: The loaded yaml congif file as a dictionary.
    """
    with open("./config/config.yaml", "r") as f:
        config = yaml.safe_load(f)
    return config

def convert_to_e164(phone_number):
    # Parse the phone number
    parsed_number = phonenumbers.parse(phone_number, "GB")

    # Check if the number is valid
    if not phonenumbers.is_valid_number(parsed_number):
        raise ValueError("Invalid phone number")

    # Format the number as E.164
    return phonenumbers.format_number(parsed_number, phonenumbers.PhoneNumberFormat.E164)

def gcp_upload():
    try:
        command = "gcloud functions deploy binbot-main --gen2 --region=europe-west2 --runtime=python311 --source=../..//src/binbotmain/ --entry-point=main --trigger-http"

        # Run the command with subprocess.run()
        result = subprocess.run(command, shell=True, check=True, capture_output=True)

        # Get the exit code
        exit_code = result.returncode

        # Get the output (stdout and stderr)
        output = result.stdout.decode('utf-8').strip()

        # Return the exit code and output
        return exit_code, output
    except subprocess.CalledProcessError as e:
        # If the command fails, capture the error message
        error_message = e.stderr.decode('utf-8').strip()
        return e.returncode, error_message


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
        print(f"Alias: {alias}")
        print(f"Phone Number: {phone_number}")
        print(f"Street Address: {street_addres}")
        print(f"Post Code: {post_code}")
        print(f"Council: {council}")
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
                print("Getting data from API...")
                resp = requests.get(url_with_params, headers={"x-api-key": os.getenv("API_KEY")})
            # Catch any errors and log them...
            except Exception as e:
                return False, str(e)
            # Check the response code...
            if resp.status_code == 200:
                # Response was good...
                bin_data = resp.json()['result']
                pprint.pprint(bin_data)
                print("Data received from API.. looks good!")
                return True, None
            else:
                # Handle any errors from the API.
                print(resp.text)
                print("Error Getting data from API...")
                return False, resp.text
        else:
            return False
       

    all_good, errors = check_user_info()

    if not all_good:
        print(f"There was an error with the user data. Please try again. {errors}")
        sys.exit(1)
    
    # Save the user data to a file...
    current_config = load_config()
    new_user = {
        "alias": alias,
        "phone": phone_number,
        "streetAddress": street_addres,
        "postCode": post_code,
        "council": council
    }
    current_config["users"].append(new_user)
    with open("./config/config.yaml", "w") as f:
        yaml.dump(current_config, f)
    
    print("User added to config, uploading to GCP...")
    exit_code, output = gcp_upload()

    # Check the exit code
    if exit_code == 0:
        print("Gcp uploaded.")
    else:
        print("Command failed with exit code:", exit_code)
        print("Error message:", output)

    message = "🤖 Hello there I'm BinBot! 🎉\n\nWelcome aboard! You've been successfully set up to receive reminders about when to put the bins out. 🗑️✨\n\nFrom now on, you'll receive an automatic text the night before the bins will be collected. 📱🌙 Additionally, you can always text 'WHEN' at any time to get the latest collection information. 📆💬\n\nAnd hey, it might be a good idea to save this number in your contacts, so you never miss out on any important reminders!\n\nIf you ever have any questions or need assistance, feel free to reach out. Happy binning! 🚮🌟"
    print(f"Sending welcome message to user... {phone_number}")
    resp = twilio_client.messages.create(
        to=phone_number,
        from_="+447488892773",
        body=message
    )
    print(resp)


if __name__ == "__main__":
    main()


    