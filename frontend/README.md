# Meat Billing POS Frontend

Expo React Native client for the Billing System. The app supports:

- first admin registration on fresh installs
- shared login flow for admin and shop users
- admin dashboard for shops, sales, payments, bills, and audit logs
- shop bootstrap flow with required daily price setup
- counter billing cart and exact-payment checkout
- receipt preview after a settled backend response

## Stack

- Expo 54
- React Native with TypeScript
- React Navigation
- Zustand
- React Hook Form
- NativeWind
- Axios

## Project Layout

```text
frontend/
├── src/
│   ├── api/
│   ├── components/
│   ├── constants/
│   ├── hooks/
│   ├── navigation/
│   ├── screens/
│   ├── store/
│   ├── types/
│   └── utils/
├── App.tsx
├── app.json
├── global.css
├── package.json
└── README.md
```

## Prerequisites

- Node.js `18+`
- npm
- Running backend API on port `8000` or another reachable URL
- Android emulator, iOS simulator, Expo Go, or browser

## Install

```bash
npm install
```

## Run

### Android Emulator

```bash
npx expo start --android
```

Default backend target: `http://10.0.2.2:8000`

### iOS Simulator

```bash
npx expo start --ios
```

Default backend target: `http://127.0.0.1:8000`

### Local Web

```bash
npx expo start --web
```

Default backend target: `http://127.0.0.1:8000`

### Physical Device On The Same Wi-Fi

```bash
EXPO_PUBLIC_API_BASE_URL=http://192.168.1.20:8000 npx expo start --lan
```

Replace `192.168.1.20` with your computer's LAN IP.

### Physical Device Through Expo Tunnel

Expo tunnel mode does not expose the backend. Start Expo with a public backend URL:

```bash
EXPO_PUBLIC_API_BASE_URL=https://your-backend-tunnel.example.com npx expo start --tunnel
```

## API Base URL Logic

The frontend resolves the API host from `src/constants/config.ts`.

- If `EXPO_PUBLIC_API_BASE_URL` is set, that value is used.
- If the env value contains `0.0.0.0`, the app rewrites it to a reachable runtime host.
- Without an env override, Android uses `10.0.2.2`, iOS uses `127.0.0.1`, and web uses the current browser host when possible.
- Expo tunnel hosts are intentionally not treated as backend hosts.

Current local `.env` example:

```env
EXPO_PUBLIC_API_BASE_URL=http://127.0.0.1:8000
```

## App Flow

### Auth

- `Login` screen supports both admin and shop sign-in.
- `Create Admin` works only until the first admin already exists in the backend.
- Auth state is persisted locally and restored on app launch.

### Admin Experience

- create shop accounts
- view shop status and enable or disable access
- monitor total sales, cash totals, and UPI totals
- inspect recent bills
- inspect audit logs

### Shop Experience

- fetch shop bootstrap data after login
- set or update today's prices for every active item
- add items to the cart using kg or unit rules
- split payment between cash and UPI
- complete checkout only when payment exactly matches the total
- preview receipt text after a successful bill

## Scripts

```bash
npm run start
npm run android
npm run ios
npm run web
npm run lint
npm run typecheck
```

## Notes

- The app uses a single navigator that switches between auth, admin, and shop flows based on the stored session.
- If today's price sheet is missing, shop users are redirected to the daily price screen before billing.
- Changing today's prices from the billing screen clears the current cart to keep prices consistent for the next bill.
- Receipt rendering is currently an in-app preview, not a physical printer flow.
