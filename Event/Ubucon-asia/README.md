# Guess the Mascot Event

This module implements a "Guess the Mascot" event for Discord servers, where users try to guess the secret mascot animal.

## Features

- **Intelligent Message Monitoring**: Real-time message analysis with anti-scraping protection
- **Advanced Animal Detection**: Uses Wikipedia API + local fallback list for animal verification
- **Rate Limiting**: Built-in request throttling to prevent API bans
- **Smart Logging**: Color-coded embeds with message context links
- **Error Resilience**: Automatic fallback to local animal list when APIs are unavailable
- **User Feedback**: Temporary notifications for deleted messages

## Setup

1. Install the required package:

   ```
   npm install botanic-zoo-api
   ```

2. Configure the event by editing the `Event/event.json` file:

   ```json
   {
     "UbuconAsia2025": "YOUR_LOGGING_CHANNEL_ID",
     "Channel_id": "YOUR_MONITORED_CHANNEL_ID"
   }
   ```

   - `UbuconAsia2025`: The channel ID where valid messages will be logged
   - `Channel_id`: The channel ID that will be monitored for mascot guesses

3. The event will be automatically loaded when the bot starts.

## How It Works

1. Users send messages in the monitored channel
2. Messages containing animal keywords are allowed
3. Messages without animal keywords are deleted
4. All valid animal messages are logged in the designated channel
5. When a user correctly guesses the secret mascot, it's noted in the logs

## Animal Keywords

The system recognizes many animal keywords, including:

- Common animals: lion, tiger, bear, elephant, etc.
- Pets: cat, dog, bird, fish, etc.
- Many other animals from the animal kingdom

## Customization

You can customize the event by editing the `Event/Ubucon-asia/Guess.js` file:

- `INCORRECT_GUESS_EMOJI`: The emoji used for valid animal messages that are not the correct mascot
- `CORRECT_GUESS_EMOJI`: The emoji used when a user correctly guesses the mascot
- `MASCOT`: The secret mascot that users need to guess
- `ANIMAL_KEYWORDS`: The list of valid animal keywords
