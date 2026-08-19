# Carly — Documentație Tehnică a Proiectului

## 1. Prezentare Generală

**Carly** este o aplicație cross-platform de gestionare a vehiculelor personale, concepută pentru a ajuta utilizatorii să urmărească flotele de vehicule, datele de expirare ale documentelor (asigurare, ITP, rovinieta), istoricul de mentenanță și costurile asociate. Aplicația funcționează pe trei platforme: **Web**, **Desktop (Windows)** și **Mobile (Android/iOS)**.

### Principalele Funcționalități
| Funcționalitate | Descriere |
|---|---|
| **Autentificare** | Sistem complet de login/signup cu email și parolă |
| **Dashboard** | Vizualizare centralizată a tuturor vehiculelor cu statistici în timp real |
| **Gestionare vehicule** | CRUD complet — adăugare, editare, ștergere vehicule (mașini, motociclete, scutere, camioane, autobuze, remorci) |
| **Monitorizare documente** | Urmărirea expirării asigurării, ITP-ului și rovinieta |
| **Upload documente** | Încărcare și gestionare fișiere (PDF, imagini) pentru fiecare vehicul |
| **Istoric mentenanță** | Jurnalizarea operațiunilor de service cu cost, kilometraj și note |
| **Notificări multi-canal** | Alerte în aplicație (toast), notificări native OS, notificări push mobile |
| **Profil utilizator** | Gestionarea datelor contului |
| **Temă vizuală** | Sistem de teme (light/dark) cu design modern |

---

## 2. Arhitectura Proiectului

### 2.1 Structura Monorepo

Proiectul este organizat ca un **monorepo** folosind mecanismul de **npm workspaces**, ceea ce permite gestionarea centralizată a dependențelor. S-a ales această abordare pentru:

- **Partajarea codului**: Tipurile TypeScript și logica de business pot fi reutilizate
- **Gestionarea simplificată**: O singură comandă `npm install` la rădăcină instalează dependențele pentru toate sub-proiectele
- **Versionare unificată**: Toate componentele evoluează împreună într-un singur repository

```
Carly/
├── client/          → Aplicația web (React + Vite)
├── electron/        → Shell-ul desktop (Electron)
├── mobile/          → Aplicația mobilă (React Native + Expo)
├── package.json     → Configurare monorepo (workspaces)
└── tsconfig.json    → Configurare TypeScript de bază
```

### 2.2 Diagrama Arhitecturală

```
┌─────────────────────────────────────────────────────────┐
│                    UTILIZATOR                           │
└─────────┬───────────────┬──────────────┬────────────────┘
          │               │              │
    ┌─────▼─────┐  ┌──────▼──────┐ ┌─────▼─────┐
    │  Browser  │  │  Desktop    │ │  Mobile   │
    │  (Web)    │  │  (Electron) │ │  (Expo)   │
    │  Vite +   │  │  Electron + │ │  React    │
    │  React    │  │  Vite build │ │  Native   │
    └─────┬─────┘  └──────┬──────┘ └─────┬─────┘
          │               │              │
          └───────────────┼──────────────┘
                          │
                   ┌──────▼──────┐
                   │  Supabase   │
                   │  (BaaS)     │
                   ├─────────────┤
                   │ • Auth      │
                   │ • Database  │
                   │  (Postgres) │
                   │ • Storage   │
                   │ • RLS       │
                   └─────────────┘
```

---

## 3. Stiva Tehnologică — Alegeri și Justificări

### 3.1 Frontend Web: React + Vite + TypeScript

| Tehnologie | Versiune | De ce a fost aleasă |
|---|---|---|
| **React** | 19.2 | Biblioteca UI de referință pentru aplicații SPA. Ecosistemul vast, componentele reutilizabile și modelul declarativ de randare fac React ideal pentru o aplicație cu interfață complexă și multe stări. |
| **Vite** | 7.2 | Build tool de generație nouă care oferă **Hot Module Replacement (HMR)** instantaneu și timpi de build extrem de rapizi (de 10-100x mai rapid decât Webpack). A fost ales în locul Create React App (depreciat) pentru performanță superioară în dezvoltare. |
| **TypeScript** | 5.9 | Superset tipizat al JavaScript care elimină o mare categorie de bug-uri la compilare, nu la runtime. Oferă autocomplete inteligent, refactoring sigur și documentație „vie" prin tipuri. |

### 3.2 Stilizare: TailwindCSS

| Tehnologie | Versiune | De ce a fost aleasă |
|---|---|---|
| **TailwindCSS** | 4.1 | Framework CSS utility-first care elimină necesitatea fișierelor CSS separate. Motivația alegerii: (1) **Viteză de dezvoltare** — clasele utilitare permit prototipare rapidă direct în JSX; (2) **Consistența** — sistemul de design tokens integrat (culori, spații, font-uri) asigură un design uniform; (3) **Performanță** — în producție, CSS-ul nefolosit este eliminat automat (tree-shaking). |
| **tailwind-merge** | 3.4 | Utilitar care rezolvă conflictele dintre clasele Tailwind duplicate (ex: `px-4 px-6` → `px-6`). |
| **clsx** | 2.1 | Utilitar pentru compunerea condițională a claselor CSS (ex: clasa `active` aplicată doar dacă o condiție este adevărată). |

### 3.3 Librării UI și Utilități

| Librărie | Scop | De ce a fost aleasă |
|---|---|---|
| **lucide-react** | Iconițe SVG | Set de ~1500 iconițe consistente, ușoare și complet personalizabile. Mai modernă și mai bine întreținută decât alte alternative (Heroicons, Font Awesome). |
| **framer-motion** | Animații | Motor de animații declarativ pentru React. Permite tranziții fluide, gesturi și animații complexe cu un API intuitiv (`animate`, `whileHover`, `layout`). |
| **sonner** | Notificări toast | Sistem de toast-uri modern, elegant și minimal. Ales pentru designul estetic superior față de react-toastify și API-ul simplu. |
| **recharts** | Grafice | Librărie de grafice construită pe D3.js dar cu API React-nativ. Aleasă pentru graficele de costuri din dashboard. |
| **react-router-dom** | Rutare | Standard de facto pentru rutare în React SPA. Se utilizează `MemoryRouter` (nu `BrowserRouter`) deoarece aplicația rulează și în Electron, unde nu există un server HTTP clasic. |

### 3.4 Backend: Supabase (BaaS)

| Serviciu | Utilizare | De ce a fost ales |
|---|---|---|
| **Supabase** | Auth, DB, Storage | Ales ca alternativă open-source la Firebase. Motivația principală: (1) **Bază de date PostgreSQL reală** — relații, JOIN-uri, funcții SQL native (vs. NoSQL la Firebase); (2) **Row Level Security (RLS)** — securitate la nivel de rând, fiecare utilizator vede doar vehiculele proprii; (3) **Auth integrat** — email/password, OAuth, fără server custom; (4) **Storage** — bucket-uri S3-like pentru documente; (5) **Tier gratuit generos** — ideal pentru proiecte educaționale. |

**De ce nu un backend custom (Express/NestJS)?**
- Nu era necesar un server custom deoarece Supabase acoperă integral nevoile aplicației (auth, CRUD, storage)
- Elimină complexitatea operațională (hosting, SSL, scalare)
- RLS din PostgreSQL oferă securitate fără middleware custom
- Reduce codebase-ul la half: nu există foldere `backend/`, `controllers/`, `middleware/`

### 3.5 Desktop: Electron

| Tehnologie | Versiune | De ce a fost aleasă |
|---|---|---|
| **Electron** | 33.2 | Framework care permite împachetarea aplicațiilor web ca aplicații desktop native. Ales pentru: (1) **Reutilizarea codului** — aceeași aplicație React Web rulează nativ pe Windows/macOS/Linux; (2) **Acces la API-uri native** — notificări OS, system tray, acces la sistem de fișiere; (3) **Distribuție simplă** — folosind `electron-builder` se generează un executabil `.exe`; (4) **Funcționalități exclusive** — cron jobs pentru verificări periodice ale expirărilor, tray icon persistent. |
| **node-cron** | 4.2 | Scheduler de taskuri bazat pe sintaxa cron Unix. Permite programarea verificărilor automate de expirare la o oră specificată zilnic (implicit 09:00 EET). |
| **electron-builder** | 25.1 | Pachetizare și distribuție. Generează instalatoare native pentru fiecare platformă. |

**Funcționalități exclusive ale versiunii Desktop:**
- **System Tray** — aplicația rămâne activă în tray-ul Windows, cu meniu contextual (Open, Check Now, Quit)
- **Background Cron** — verificare automată zilnică a expirărilor, chiar dacă fereastra este minimizată
- **Notificări native OS** — Windows toast notifications cu icon-ul aplicației
- **Auto-detecție credențiale** — Electron detectează automat datele Supabase din `.env.local` al clientului

### 3.6 Mobile: React Native + Expo

| Tehnologie | Versiune | De ce a fost aleasă |
|---|---|---|
| **React Native** | 0.81 | Permite scrierea aplicațiilor mobile native folosind React. Ales pentru (1) **Reutilizarea cunoștințelor** — aceeași paradigmă React ca pe web; (2) **Performanță nativă** — bridge-ul compilat oferă performanță apropiată de aplicațiile native Swift/Kotlin. |
| **Expo** | 54 | Platformă de dezvoltare care simplifică dramatic workflow-ul React Native. Motivația: (1) **Zero configurare nativă** — fără Xcode/Android Studio pentru dezvoltare; (2) **OTA Updates** — actualizări fără re-publicare pe store; (3) **Expo Go** — testare instantanee pe dispozitiv fizic prin scanarea unui QR code. |
| **expo-notifications** | 0.32 | Sistem de notificări push locale. Aleasă pentru a programa remindere 7 zile și 1 zi înainte de expirarea documentelor, cu delivery la ora 09:00 local. |
| **expo-document-picker** | 14.0 | Permite selectarea fișierelor de pe dispozitiv (PDF, imagini) pentru upload-ul documentelor vehiculelor. |
| **@react-navigation** | 7.x | Standard de facto pentru navigație în React Native. Oferă stack navigation (ierarhic), bottom tabs (taburi de jos) și deep linking. |
| **react-native-chart-kit** | 6.12 | Grafice native pentru vizualizarea costurilor de mentenanță pe dispozitive mobile. |

**De ce Expo în loc de React Native CLI pur?**
- Setup mult mai rapid (minutes vs. hours)
- Nu necesită configurare Gradle/CocoaPods
- Managed workflow: Expo gestionează dependențele native automat
- Ideal pentru proiecte educaționale unde viteza de dezvoltare este prioritară

---

## 4. Baza de Date — Schema și Design

### 4.1 Tabele Principale

```
┌──────────────┐     ┌───────────────────┐     ┌──────────────────┐
│   brands     │     │     vehicles      │     │  car_documents   │
├──────────────┤     ├───────────────────┤     ├──────────────────┤
│ id (PK)      │     │ id (PK)           │     │ id (PK)          │
│ name         │◄────│ make              │     │ car_id (FK)      │──┐
│ type         │     │ model             │     │ name             │  │
│ created_at   │     │ type              │     │ file_path        │  │
└──────────────┘     │ year              │     │ file_type        │  │
                     │ license_plate     │     │ created_at       │  │
┌──────────────┐     │ vin               │     └──────────────────┘  │
│   models     │     │ color             │                           │
├──────────────┤     │ user_id (FK)      │     ┌──────────────────┐  │
│ id (PK)      │     │ insurance_expiry  │     │ maintenance_logs │  │
│ brand_id(FK) │     │ itp_expiry        │     ├──────────────────┤  │
│ name         │     │ rovinieta_expiry  │     │ id (PK)          │  │
│ created_at   │     │ trailer_type      │     │ car_id (FK)      │──┘
└──────────────┘     │ weight_capacity   │     │ service_date     │
                     │ passenger_capacity│     │ description      │
                     │ created_at        │     │ cost             │
                     └───────────────────┘     │ odometer         │
                                               │ notes            │
                                               │ created_at       │
                                               └──────────────────┘
```

### 4.2 Tipuri de Vehicule Suportate

Aplicația suportă **6 tipuri de vehicule**, fiecare cu câmpuri condiționale:

| Tip | Câmpuri specifice | Note |
|---|---|---|
| `car` | Toate câmpurile standard | Tipul implicit |
| `motorcycle` | Toate câmpurile standard | — |
| `scooter` | Fără `license_plate`, `itp_expiry`, `rovinieta_expiry` | Scuterele sub 50cc nu necesită aceste documente |
| `truck` | `weight_capacity` | Capacitate de încărcare |
| `bus` | `passenger_capacity` | Număr de locuri |
| `trailer` | `trailer_type`, `weight_capacity` | Tip remorcă + capacitate |

### 4.3 Row Level Security (RLS)

Supabase aplică **RLS** pe fiecare tabel, garantând că:
- Un utilizator poate vedea/modifica **doar vehiculele proprii** (filtrat prin `user_id = auth.uid()`)
- Tabelele `brands` și `models` au politici de **acces public read** (metadata partajată)
- Bucket-ul de stocare `car-docs` permite upload doar utilizatorilor autentificați

---

## 5. Fluxuri Cheie ale Aplicației

### 5.1 Autentificare

```
Utilizator → Login Page → Supabase Auth
                          ├── signInWithPassword()
                          └── signUp() → Email de confirmare
                               │
                          AuthContext (React Context)
                               │
                          ProtectedRoute → Dashboard
```

- **AuthContext** ascultă `onAuthStateChange` pentru a detecta automat login-urile/logout-urile
- **ProtectedRoute** redirecționează utilizatorii neautentificați către `/login`
- Sesiunea este persistată automat de SDK-ul Supabase (localStorage pe web, AsyncStorage pe mobile)

### 5.2 Notificări Multi-Canal

Aplicația implementează un **sistem de notificări pe 3 niveluri**, adaptat fiecărei platforme:

| Canal | Platform | Implementare |
|---|---|---|
| **Toast in-app** | Web, Desktop | Sonner — toast-uri colorate (error/warning) cu buton de dismiss |
| **Native OS** | Web, Desktop | Browser Notification API / Electron Notification |
| **Push local** | Mobile | `expo-notifications` — programate la 7 zile și 1 zi înainte de expirare |
| **Background cron** | Desktop | `node-cron` — verificare zilnică la 09:00 EET, chiar dacă app-ul e minimizat |

### 5.3 Upload Documente

```
Utilizator selectează fișier
    │
    ▼
documentService.uploadDocument()
    │
    ├── 1. Upload → Supabase Storage (bucket: car-docs)
    │       Path: {vehicleId}/{timestamp}.{ext}
    │
    └── 2. Insert → Tabel car_documents
            (car_id, name, file_path, file_type)
```

---

## 6. Particularități de Design

### 6.1 Folosirea `MemoryRouter` în loc de `BrowserRouter`

Aplicația web folosește `MemoryRouter` din react-router-dom. Aceasta este o **decizie deliberată** motivată de faptul că aplicația web rulează și în Electron, unde fișierele sunt servite prin protocolul `file://`. `BrowserRouter` ar necesita un server HTTP care să gestioneze rutele, dar Electron încarcă un fișier HTML static. `MemoryRouter` stochează rutele în memorie, funcționând identic pe web și desktop.

### 6.2 Sanitizarea datelor la nivelul vehicleService

Funcțiile `addVehicle()` și `updateVehicle()` conțin logică extensivă de sanitizare:
- **Stringuri goale → null**: Previne inserarea de string-uri goale în câmpuri opționale (VIN, trailer_type)
- **Câmpuri condiționale per tip**: Scuterele nu trimit `itp_expiry` / `rovinieta_expiry`
- **License plate "N/A"**: Scuterele folosesc valoarea „N/A" pentru a satisface constrângerea NOT NULL din baza de date
- **Ștergerea cheilor null**: Câmpuri ca `weight_capacity` sunt șterse din payload dacă sunt null, pentru a evita erori „column does not exist" pe scheme vechi

### 6.3 Tema Dark pe Mobile vs. Light pe Web

- **Web**: Tema este fixată pe `light` (ThemeProvider întotdeauna aplică clasa `light`)
- **Mobile**: Tema este fixată pe `dark` (culorile din `theme.ts` sunt inversate: `white → #0F172A`, `black → #F8FAFC`)

Această diferențiere a fost o decizie de design: dark mode este mai potrivit pe ecranele mobile OLED (economisire baterie, confort vizual), în timp ce light mode oferă un aspect mai profesional pe web/desktop.

### 6.4 Auto-detecția credențialelor Supabase în Electron

Procesul main al Electron citește automat fișierul `.env.local` al clientului web și extrage `VITE_SUPABASE_URL` și `VITE_SUPABASE_ANON_KEY`, eliminând necesitatea configurării manuale duplicate. Aceasta demonstrează un pattern DRY (Don't Repeat Yourself) la nivel de configurare cross-platform.

---

## 7. Structura Detaliată a Fișierelor

### 7.1 Client (Web)

```
client/src/
├── App.tsx                     → Routerul principal + provideri de context
├── main.tsx                    → Punct de intrare React
├── index.css                   → Stiluri globale
├── context/
│   ├── AuthContext.tsx          → Provider de autentificare (session, user, signOut)
│   └── ThemeContext.tsx         → Provider de temă (light/dark)
├── pages/
│   ├── Login.tsx               → Pagina de autentificare/înregistrare
│   ├── Dashboard.tsx           → Pagina principală cu lista vehiculelor
│   ├── VehicleDetails.tsx      → Detalii vehicul individual
│   ├── Alerts.tsx              → Lista alertelor de expirare
│   ├── Notifications.tsx       → Centrul de notificări
│   └── Profile.tsx             → Profil utilizator
├── components/
│   ├── VehicleForm.tsx         → Formular complex de adăugare/editare vehicul
│   ├── DocumentManager.tsx     → Manager de documente uploadate
│   ├── MaintenanceLogs.tsx     → Istoric de mentenanță
│   ├── NotificationManager.tsx → Verificator automat de expirări
│   ├── ProtectedRoute.tsx      → Guard de rută autentificată
│   ├── CostChart.tsx           → Grafic de costuri (Recharts)
│   ├── Dashboard/
│   │   ├── AlertBanner.tsx     → Banner de alertă pe dashboard
│   │   ├── StatsCard.tsx       → Card de statistici
│   │   └── VehicleCard.tsx     → Card de vehicul în grid
│   └── Layout/
│       └── Layout.tsx          → Layout general (sidebar/navbar)
├── services/
│   ├── supabase.ts             → Instanța client Supabase
│   ├── vehicleService.ts       → CRUD vehicule + fetch brands/models
│   ├── documentService.ts      → Upload/download/delete documente
│   └── maintenanceService.ts   → CRUD jurnal mentenanță
└── types/
    └── vehicle.ts              → Tipuri TypeScript (Vehicle, Brand, Model, etc.)
```

### 7.2 Mobile

```
mobile/src/
├── context/
│   └── AuthContext.tsx          → Provider autentificare (similar cu web)
├── navigation/
│   └── AppNavigator.tsx         → Stack + Tab navigation
├── screens/
│   ├── LoginScreen.tsx          → Ecran login
│   ├── DashboardScreen.tsx      → Dashboard mobil
│   ├── VehicleDetailsScreen.tsx → Detalii vehicul
│   ├── AddVehicleScreen.tsx     → Formular adăugare vehicul
│   ├── MaintenanceLogsScreen.tsx→ Istoric service
│   ├── NotificationsScreen.tsx  → Notificări
│   └── ProfileScreen.tsx       → Profil
├── services/
│   ├── supabase.ts             → Client Supabase (AsyncStorage)
│   ├── vehicleService.ts       → CRUD vehicule
│   ├── documentService.ts      → Documente
│   ├── maintenanceService.ts   → Mentenanță
│   └── notificationService.ts  → Push notifications locale
├── types/
│   └── vehicle.ts              → Tipuri TypeScript
└── theme.ts                    → Design tokens (culori, spații, fonturi)
```

### 7.3 Electron (Desktop)

```
electron/
├── main.js                     → Procesul principal Electron
│   ├── Config management       → Citire/scriere notification-config.json
│   ├── Supabase check          → Verificare expirări din background
│   ├── Cron scheduler          → Programare verificări zilnice
│   ├── IPC handlers            → Comunicare cu renderer process
│   ├── Window management       → Creare fereastră, dev/prod mode
│   ├── System Tray             → Icon tray + meniu contextual
│   └── Auto-detect credentials → Citire .env.local
├── package.json                → Configurare electron-builder
└── icon.png                    → Iconița aplicației
```

---

## 8. Cum se Rulează Proiectul

### Precondiții
- Node.js ≥ 18
- npm ≥ 9
- Cont Supabase cu un proiect configurat

### Pași de instalare

```bash
# 1. Clonare și instalare dependențe (monorepo)
cd Carly
npm install

# 2. Configurare variabile de mediu
cp client/.env.example client/.env.local
# Editează .env.local cu URL-ul și cheia Supabase

# 3. Rulare web (mod dezvoltare)
npm run dev:client
# → Deschide http://localhost:5173

# 4. Rulare desktop (mod dezvoltare)
npm run dev:electron
# → Deschide fereastra Electron (conectată la Vite dev server)

# 5. Rulare mobile
cd mobile
npx expo start
# → Scanează QR code-ul cu Expo Go pe telefon
```

---

## 9. Posibile Îmbunătățiri

### 9.1 Securitate

| Îmbunătățire | Descriere | Prioritate |
|---|---|---|
| **Context Isolation în Electron** | Momentan `contextIsolation: false` este folosit pentru simplitate. Într-o aplicație de producție, ar trebui activat `contextIsolation: true` cu un fișier `preload.js` care expune un API limitat prin `contextBridge`. | 🔴 Critică |
| **Validare pe server** | Adăugarea de **Database Functions** sau **Edge Functions** în Supabase pentru validarea datelor pe server, nu doar pe client. | 🟡 Înaltă |
| **Rate limiting** | Implementarea de rate limiting pe operațiunile de autentificare pentru a preveni atacuri brute-force. | 🟡 Înaltă |

### 9.2 Funcționalitate

| Îmbunătățire | Descriere | Prioritate |
|---|---|---|
| **Dark Mode pe Web** | ThemeContext există deja dar este dezactivat (`toggleTheme` este gol). Implementarea completă ar necesita doar deblocarea toggle-ului și testarea tuturor componentelor. | 🟢 Medie |
| **Email alerts (EmailJS)** | Dependența `@emailjs/browser` este instalată dar nu este utilizată în codul curent. Ar putea fi integrată pentru a trimite email-uri de alertă cu 7/30 zile înainte de expirare. | 🟢 Medie |
| **Rapoarte și export** | Generarea de rapoarte PDF cu istoricul de mentenanță și costurile per vehicul. Export CSV pentru integrare cu software contabil. | 🟢 Medie |
| **Multi-user / fleet management** | Suport pentru conturi de companie cu roluri (admin, driver, mechanic) și vehicule partajate. | 🔵 Viitor |
| **Integrare API extern** | Conectare la API-uri precum RAR (Registrul Auto Român) pentru verificarea automată a stării ITP sau la baze de date de piese auto. | 🔵 Viitor |
| **Reminder-e configurabile** | Permisiunea utilizatorului de a configura cu câte zile înainte dorește să fie notificat (momentan hardcodat la 7 și 1 zi). | 🟢 Medie |

### 9.3 Performanță și Scalabilitate

| Îmbunătățire | Descriere | Prioritate |
|---|---|---|
| **Caching (React Query)** | Înlocuirea pattern-ului manual `useState + useEffect` cu `@tanstack/react-query` pentru caching, deduplicare request-uri, stale-while-revalidate și infinite scroll. | 🟡 Înaltă |
| **Optimistic updates** | Actualizări optimiste ale UI-ului (afișare modificare instant, revert dacă serverul returnează eroare) pentru o experiență mai rapidă. | 🟢 Medie |
| **Lazy loading** | Încărcarea paginilor prin `React.lazy()` + `Suspense` pentru a reduce bundle-ul inițial. | 🟢 Medie |
| **Service Worker** | Adăugarea unui PWA service worker pentru funcționalitate offline pe web. | 🔵 Viitor |

### 9.4 Calitatea Codului

| Îmbunătățire | Descriere | Prioritate |
|---|---|---|
| **Eliminare debug logs** | Codul conține multiple `console.log('[VehicleService]...')` și `console.log('--- DEBUG ENV VARS ---')` care ar trebui eliminate sau înlocuite cu un logger configurable. | 🟡 Înaltă |
| **Cod partajat web ↔ mobile** | Crearea unui pachet `shared/` în monorepo cu tipurile, constantele și logica de business comuna (calcul zile rămase, formatare vehicul, etc.). | 🟢 Medie |
| **Teste unitare și E2E** | Adăugarea de teste cu Vitest (unit) și Playwright/Cypress (E2E) pentru fluxurile critice (login, adăugare vehicul, notificări). | 🟡 Înaltă |
| **Internationalizare (i18n)** | Mutarea textelor hardcodate în română într-un sistem de traduceri (react-i18next) pentru suport multi-limbă. | 🔵 Viitor |
| **Storybook** | Documentarea vizuală a componentelor UI într-un Storybook pentru mentenabilitate pe termen lung. | 🔵 Viitor |

### 9.5 DevOps și Deployment

| Îmbunătățire | Descriere | Prioritate |
|---|---|---|
| **CI/CD Pipeline** | GitHub Actions pentru lint, teste, build automat și deploy pe Vercel/Netlify la fiecare push. | 🟡 Înaltă |
| **Auto-update Electron** | Implementarea `electron-updater` pentru actualizări automate ale aplicației desktop fără re-download manual. | 🟢 Medie |
| **Publicare pe stores** | Pregătirea aplicației mobile pentru App Store (iOS) și Google Play (Android) cu EAS Build de la Expo. | 🔵 Viitor |

---

## 10. Concluzii și Propuneri de Viitor

### 10.1 Concluzii Generale

Proiectul **Carly** demonstrează succesul unei arhitecturi software moderne, cross-platform (Web, Desktop, Mobile), concepută în jurul unui singur backend unificat ca serviciu (BaaS — Supabase) și integrată elegant într-o structură de tip monorepo (npm workspaces).

Alegerile tehnologice au permis atingerea unor obiective esențiale:
- **Eficiență în dezvoltare:** Utilizarea Vite și Expo managed workflow a asigurat feedback vizual instant în timpul scrierii codului și a redus la minimum configurările native specifice fiecărui sistem de operare.
- **Backend simplificat și sigur:** Datorită Supabase, s-a evitat scrierea unui API propriu. Securitatea datelor este delegată în siguranță bazei de date prin politici Row Level Security (RLS) bazate pe utilizatorul autentificat.
- **Design personalizat și modern:** Aplicația îmbină flexibilitatea interfețelor web rapide cu funcționalitățile native specifice platformelor (cron jobs și tray icon pe desktop, notificări programate local pe mobil).
- **Robusteză prin TypeScript:** Tipizarea statică a redus considerabil bug-urile în producție și a facilitat refactorizarea sigură.

### 10.2 Direcții de Dezvoltare Viitoare

Pentru a transforma prototipul actual într-un produs robust de nivel comercial, sunt propuse următoarele direcții de dezvoltare structurate pe categorii:

#### 📂 Îmbunătățirea Arhitecturii & DRY
- **Pachet Partajat (`shared`):** Extragerea tipurilor TypeScript comune, a constantelor globale și a funcțiilor utilitare (ex. calculul zilelor de expirare) într-un workspace separat `packages/shared`, pentru a fi consumat direct de clienții Web, Desktop și Mobile.
- **Securizarea Electron:** Activarea izolării contextului (`contextIsolation: true`) și implementarea unui script `preload.js` securizat pentru a bloca expunerea directă a Node.js în procesul renderer.
- **Sincronizarea Stării (React Query):** Migrarea apelurilor manuale API din `useState` și `useEffect` către `@tanstack/react-query` pentru caching inteligent și sincronizare automată.

#### ✨ Funcționalități Noi (Roadmap)
- **Integrare Automată API RAR:** Verificarea automată a stării ITP a vehiculelor din România prin interogarea directă a serviciilor oficiale pe baza numărului de înmatriculare sau a seriei de șasiu (VIN).
- **Management de Flotă (Fleet Management):** Suport pentru conturi corporate sau grupuri de utilizatori (Organizație) cu definirea de roluri specifice (Administrator, Manager, Șofer, Mecanic).
- **Notificări personalizabile & Multi-Canal:** Permiterea utilizatorului să își configureze exact momentele în care primește alerte și integrarea notificărilor prin email (EmailJS) sau SMS.
- **Rapoarte de Mentenanță:** Generarea de statistici detaliate sub formă de grafice interactive și exportarea istoricului de mentenanță și costuri în format PDF sau CSV pentru evidență personală sau contabilă.

#### ⚙️ Testare și Automatizare (CI/CD)
- **Implementarea Testelor:** Acoperirea codului cu teste unitare (Vitest) și teste E2E (Playwright pentru Web/Desktop, respectiv Detox pentru Mobile).
- **Pipeline CI/CD (GitHub Actions):** Automatizarea validărilor de cod (lint + check), a rulării testelor și a build-urilor automate pentru deploiere rapidă pe Vercel (Web), realizarea kiturilor executabile (Desktop) și a build-urilor în EAS (Mobile).
