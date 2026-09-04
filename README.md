# Carly — Vehicle Management & Expiration Tracking Ecosystem

[![React](https://img.shields.io/badge/React-19.1-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![React Native](https://img.shields.io/badge/React%20Native-0.81-61DAFB?logo=react&logoColor=black)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-54.0-000020?logo=expo&logoColor=white)](https://expo.dev/)
[![Electron](https://img.shields.io/badge/Electron-33.2-47848F?logo=electron&logoColor=white)](https://www.electronjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-4.1-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL%20%7C%20Auth%20%7C%20Storage-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com/)

**Carly** is a modern, cross-platform vehicle lifecycle and compliance tracking platform. It simplifies vehicle ownership by centralizing multi-vehicle specifications, digital documents, and maintenance logs while actively preventing missed renewal deadlines through proactive background alerts.


## Key Features

 **Multi-Vehicle Support**: Manage cars, motorcycles, trucks, trailers, scooters, and buses with granular details (VIN, plate, color, capacity, specs).
 **Automated Expiration Tracking**: Proactively monitors **Insurance (RCA)**, **Technical Inspections (ITP)**, and **Road Vignettes (Rovinieta)** with visual status badges (Valid, Expiring Soon, Expired).
- **Multi-Channel Proactive Alerts**:
  - **Desktop (Electron)**: Background `node-cron` daemon runs in the system tray and triggers native OS alerts.
  - **Mobile (Expo)**: Local push notifications scheduled on-device via `expo-notifications`.
- **Cloud Document Archiving**: Upload and store digital copies of inspection certificates, insurance policies, and receipts securely in Supabase Storage with signed temporary URLs.
- **Service & Maintenance Logs**: Log repairs, oil changes, parts replacements, and odometer readings.
- **Cost & Expense Analytics**: Interactive charts powered by `Recharts` (Web) and `react-native-chart-kit` (Mobile) to track maintenance spending over time.
- **Multi-Tenant Security**: User authentication via Supabase Auth (JWT) and database-level data isolation with PostgreSQL **Row Level Security (RLS)**.

---

## Architecture & Technology Stack

Carly is structured as a unified **Monorepo** managed with `npm workspaces`:

| Platform / Layer | Technologies | Role & Key Libraries |
| :--- | :--- | :--- |
| **Web Client** | `React 19`, `TypeScript`, `Vite 7`, `Tailwind CSS 4` | Responsive SPA with `react-router-dom`, `framer-motion`, `recharts`, `sonner`, `lucide-react` |
| **Desktop App** | `Electron 33`, `Node.js` | Native desktop wrapper with system tray integration, `node-cron` background checks, and `electron-builder` |
| **Mobile App** | `React Native 0.81`, `Expo SDK 54`, `TypeScript` | Native iOS & Android apps with `react-navigation v7`, `expo-notifications`, `expo-document-picker`, `AsyncStorage` |
| **Backend (BaaS)** | `Supabase` (`PostgreSQL`, `GoTrue`, `S3 Storage`) | Relational database, JWT authentication, file storage buckets (`car-docs`), and RLS security policies |



## Repository Structure

```text
carly/
├── client/                 # Web SPA (React 19 + Vite + Tailwind CSS v4)
│   ├── src/
│   │   ├── components/     # UI components (modals, forms, navigation)
│   │   ├── pages/          # Dashboard, VehicleDetails, Alerts, Profile, Login
│   │   ├── services/       # Supabase API clients (vehicles, documents, maintenance)
│   │   └── types/          # Shared TypeScript domain models
├── electron/               # Desktop App (Electron 33)
│   ├── main.js             # Main process, system tray, & node-cron background task
│   └── package.json        # Electron build & packaging config
├── mobile/                 # Mobile App (React Native + Expo SDK 54)
│   ├── src/
│   │   ├── screens/        # Dashboard, AddVehicle, VehicleDetails, Maintenance, etc.
│   │   ├── navigation/     # Bottom tabs & stack navigators
│   │   └── services/       # Supabase & notifications clients
├── tech_stack_diagram.md   # Detailed architecture diagrams
├── package.json            # Monorepo workspaces configuration
└── README.md

