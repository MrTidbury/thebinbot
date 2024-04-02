
markdown
Copy code
# TheBinBot

TheBinBot is a system designed to send automated reminders to users via text messages. It leverages Twilio for sending messages and allows users to interact with the bot by responding to the messages.

## Languages
- Python
- NodeJS

## Architecture
- GCP Cloud Functions

## Functionality
- Sends automated reminders to users via text messages
- Allows users to respond to the bot and interact with it such as for asking for updated readme

## System Overview

### Cloud Components

- **Cloud SQL**
  - **Runs on:** GCP Cloud SQL
  - **Functionality:** Serves as the primary database, responsible for storing user information and cached bin data retrieved from the `binbot_scraper` cloud function.

- **Cloud PubSub**
  - **Runs on:** GCP Cloud PubSub
  - **Functionality:** Acts as a message broker facilitating communication between various components within the system. It primarily connects the `binbot_spawner` and `binbot_scraper` components.

### Core System Components

- **BinBot Main**
  - **Runs on:** GCP Cloud Function (Python 3.11)
  - **Functionality:** Responds to incoming HTTP requests on two main endpoints:
    - `/dailytrigger`: Iterates through the user database to determine if text reminders need to be sent based on cached bin data.
    - `/twiliowebhook`: Handles incoming messages from Twilio and responds to recognized commands.

- **BinBot Spawner**
  - **Runs on:** GCP Cloud Function (Python 3.11)
  - **Functionality:** Triggered via HTTP requests, iterates through the user database, and publishes messages to the `binbot.cache.update` Cloud PubSub topic, prompting an update of users' bin data in the database.

- **BinBot Scraper**
  - **Runs on:** GCP Cloud Function (Node.js 20)
  - **Functionality:** Listens for incoming requests on a Cloud PubSub topic. Upon receiving a request, extracts user information and utilizes scraper modules to fetch fresh bin data from council websites. The retrieved data is then stored in the database. If unsuccessful, the message is re-queued up to five times before being published to the Dead Letter Queue (`binbot.cache.update.failed`).
