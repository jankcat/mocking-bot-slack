# mocking-bot-slack

## About

- Listens for :mocking: reaction on messages, responds by mocking the message.
- Example emoji is included in this repo (see: `mocking.png`).
- Only responds to the first mocking reaction and reacts with mocking itself after a user does, to prevent repeat mockings
- The message must be a user text message, not a bot message, image, URL, or server message.
- Ignores messages over a day old
- Ignores messages that are just valid URLs, as per https://github.com/ogt/valid-url

## Example

![ExAmPlE](https://raw.githubusercontent.com/jankcat/mocking-bot-discord/master/example.png)

## Usage

Add by visiting: https://beefcakes.club:8443/

## Roll-your-own

1. Clone the repo
2. Have docker and docker-compose installed and good-to-go
3. `export SLACK_CLIENT_ID=YOUR_CLIENT_ID`
4. `export SLACK_CLIENT_SECRET=YOUR_CLIENT_SECRET`
5. Modify index.js to use your own callback URL
6. Make sure your bot has these scopes: `['bot', 'channels:history', 'chat:write:bot', 'reactions:read']`
7. `docker-compose up -d`
