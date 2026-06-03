# 02240370_SWE201_Assignment4# Order Pulse (Expo SDK 54)

Order Pulse is a task/event-driven mobile app that tracks delivery orders and sends local + remote push notifications. It demonstrates practical notification flows such as scheduled reminders and server-triggered order updates.

## App name and short description
- App name: Order Pulse
- Short description: Track live delivery orders, schedule reminders, and receive push updates.

## Domain and main user scenario
- Domain: Order status updates (food delivery, supplies, etc.)
- Scenario: Users track active orders and receive reminders or status updates at the right time.

## Notification types implemented
- Local reminders: Scheduled per order using a selected date/time.
- Remote push: Triggered from the backend to one or more registered devices.

## Foreground, background, and tapped handling
- Foreground: Shows an in-app toast banner with title/body.
- Background/closed: Notification appears in the system tray.
- Tapped: Navigates to the related order detail and preloads order info from payload.

## Backend details
- Technology: Node.js + Express
- Service: Expo push notification HTTP API

## Main endpoints
- `GET http://localhost:4000/health` - Health check and token count
- `POST http://localhost:4000/tokens` - Store Expo push token
- `POST http://localhost:4000/notify` - Send a notification to one or more tokens

All POST endpoints require the `x-api-key` header if `API_KEY` is set.

## Setup instructions

### Install dependencies
```
npm install
```

### Environment configuration
Create a `.env` file at the project root:
```
EXPO_PUBLIC_API_BASE_URL=http://localhost:4000
EXPO_PUBLIC_API_KEY=change-me
EXPO_PUBLIC_PROJECT_ID=
```

Create a `.env` file in `backend/`:
```
PORT=4000
API_KEY=change-me
```

### Run the Expo app
```
npm run start
```

Use Expo Go on a physical device for local notifications. Remote push notifications require a development build.

#### Development build (required for remote push)
```
npx expo prebuild
npx expo run:android
```

Then launch the dev client and scan the QR code from `npm run start`.

### Run the backend
```
cd backend
npm install
npm start
```

### Example request
```
curl -X POST http://localhost:4000/notify \
  -H "Content-Type: application/json" \
  -H "x-api-key: change-me" \
  -d '{
    "title": "Order update",
    "body": "Your order is arriving soon.",
    "data": { "orderId": "order-1" }
  }'
```

## Screenshots
![Permissions screen](/notification-app/assets/screenshots/1.jpeg)
![Permissions screen (alternate)](/notification-app/assets/screenshots/2.jpeg)
![Orders list/detail](/notification-app/assets/screenshots/3.jpeg)
![Notification tray](/notification-app/assets/screenshots/4.jpeg)
![Notification tray (alternate)](/notification-app/assets/screenshots/5.jpeg)
## Notes and limitations
- Tested with Expo Go (Android) for local notifications. Remote push requires a dev build.
- iOS requires a physical device for push notifications.
- `EXPO_PUBLIC_PROJECT_ID` can be set from your Expo project for push tokens.
- Backend stores tokens in `backend/data/tokens.json` for demo purposes.
