# Documentație Tehnică — Carly

## 1. Modelarea Problemei

Carly rezolvă problema gestionării flotelor de vehicule personale și de afaceri. Utilizatorii trebuie să urmărească simultan mai multe documente cu date de expirare (asigurare, ITP, rovinieta), istoricul de mentenanță și costurile asociate, pe trei platforme: web, desktop și mobil.

### Domeniul problemei

```
┌─────────────────────────────────────────────────┐
│                  UTILIZATOR                     │
│  - Deține 1..N vehicule                         │
│  - Fiecare vehicul are 1..3 documente           │
│  - Fiecare vehicul are 0..N înregistrări service│
│  - Fiecare vehicul are 0..N fișiere uploadate  │
└─────────────────────────────────────────────────┘
```

**Entitățile principale:**
- **Utilizator** — cont cu email/parolă, autentificat prin Supabase Auth
- **Vehicul** — entitatea centrală (6 tipuri: car, motorcycle, scooter, truck, bus, trailer)
- **Document** — fișier PDF/imagine asociat unui vehicul
- **Jurnal mentenanță** — înregistrare service cu dată, cost, kilometraj
- **Brand / Model** — metadata partajată (tabele de referință)

---

## 2. Arhitectura Generală

### 2.1 Structura Monorepo (npm workspaces)

```
Carly/
├── client/       → Web (React 19 + Vite 7 + TailwindCSS 4)
├── electron/     → Desktop (Electron 33 + node-cron)
├── mobile/       → iOS/Android (React Native 0.81 + Expo 54)
├── package.json  → Workspace root
└── tsconfig.json → TypeScript base config
```

Avantajele monorepo-ului:
- Un singur `npm install` instalează toate dependențele
- Tipurile TypeScript pot fi partajate
- Versionare unificată

### 2.2 Diagrama Arhitecturală

```
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   Browser    │  │   Electron   │  │  Expo Go /   │
│  (Web SPA)   │  │  (Desktop)   │  │  Apk/IPA     │
│  Vite+React  │  │  Electron+   │  │  React Native│
│              │  │  React build │  │              │
└──────┬───────┘  └──────┬───────┘  └──────┬───────┘
       │                 │                 │
       └─────────────────┼─────────────────┘
                         │  HTTPS / Supabase JS SDK
                 ┌───────▼────────┐
                 │   SUPABASE     │
                 │   (BaaS)       │
                 ├────────────────┤
                 │ Auth (JWT)     │
                 │ PostgreSQL DB  │
                 │ Storage (S3)   │
                 │ Row Level Sec. │
                 └────────────────┘
```

---

## 3. Baza de Date — Modelare

### 3.1 Schema Entitate-Relație

```
[auth.users] ──1──< [vehicles] >──1──< [car_documents]
                         │
                         └──────────< [maintenance_logs]

[brands] ──1──< [models]
(metadata partajata, citita de toti utilizatorii)
```

### 3.2 Tabelele și Câmpurile

#### Tabelul `vehicles`
| Coloană | Tip | Constrângere | Descriere |
|---|---|---|---|
| `id` | uuid | PK, default gen_random_uuid() | Identificator unic |
| `user_id` | uuid | FK → auth.users, NOT NULL | Proprietarul vehiculului |
| `type` | text | NOT NULL | car/motorcycle/scooter/truck/bus/trailer |
| `make` | text | NOT NULL | Marca (ex: BMW, Dacia) |
| `model` | text | NOT NULL | Modelul (ex: 320d, Logan) |
| `year` | integer | NOT NULL | Anul fabricației |
| `license_plate` | text | UNIQUE | Număr înmatriculare (NULL ptr scutere) |
| `vin` | text | UNIQUE, NULLABLE | Vehicle Identification Number |
| `color` | text | NOT NULL | Culoarea vehiculului |
| `insurance_expiry` | date | NULLABLE | Data expirare asigurare |
| `itp_expiry` | date | NULLABLE | Data expirare ITP |
| `rovinieta_expiry` | date | NULLABLE | Data expirare rovinieta |
| `trailer_type` | text | NULLABLE | Tip remorcă (doar pentru trailer) |
| `weight_capacity` | integer | NULLABLE | Capacitate kg (truck/trailer) |
| `passenger_capacity` | integer | NULLABLE | Nr. locuri (bus) |
| `created_at` | timestamptz | default now() | Data creării |

#### Tabelul `car_documents`
| Coloană | Tip | Descriere |
|---|---|---|
| `id` | uuid | PK |
| `car_id` | uuid | FK → vehicles |
| `name` | text | Denumirea documentului |
| `file_path` | text | Path în Supabase Storage |
| `file_type` | text | insurance/itp/rovinieta/other |
| `created_at` | timestamptz | Data uploadului |

#### Tabelul `maintenance_logs`
| Coloană | Tip | Descriere |
|---|---|---|
| `id` | uuid | PK |
| `car_id` | uuid | FK → vehicles |
| `service_date` | date | Data service-ului |
| `description` | text | Descrierea lucrării |
| `cost` | numeric | Costul în RON |
| `odometer` | integer | Kilometrajul la service |
| `notes` | text | Note suplimentare |

#### Tabelele `brands` și `models` (metadata)
```
brands: id, name, type (car/motorcycle/...), created_at
models: id, brand_id (FK→brands), name, created_at
```

### 3.3 Row Level Security (RLS)

Supabase aplică politici RLS la nivel de bază de date:

```sql
-- Vehiculele: utilizatorul vede doar propriile vehicule
CREATE POLICY "Users see own vehicles"
ON vehicles FOR ALL
USING (auth.uid() = user_id);

-- Documentele: accesibile doar dacă vehiculul aparține userului
CREATE POLICY "Users see own documents"
ON car_documents FOR ALL
USING (
  car_id IN (
    SELECT id FROM vehicles WHERE user_id = auth.uid()
  )
);

-- Branduri: citire publică (metadata partajată)
CREATE POLICY "Public read brands"
ON brands FOR SELECT
USING (true);
```

---

## 4. Frontend Web (React + Vite)

### 4.1 Structura Componentelor

```
App.tsx (MemoryRouter + AuthProvider + ThemeProvider)
│
├── /login           → Login.tsx
└── ProtectedRoute
    └── Layout
        ├── /              → Dashboard.tsx
        │   ├── StatsCard.tsx
        │   ├── AlertBanner.tsx
        │   └── VehicleCard.tsx
        ├── /vehicle/:id   → VehicleDetails.tsx
        │   ├── VehicleForm.tsx (edit)
        │   ├── MaintenanceLogs.tsx
        │   └── DocumentManager.tsx
        ├── /alerts        → Alerts.tsx
        ├── /notifications → Notifications.tsx
        └── /profile       → Profile.tsx
```

### 4.2 Stratul de Servicii

Toate apelurile către Supabase sunt centralizate în `services/`:

```typescript
// services/supabase.ts — instanța singleton a clientului
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

// services/vehicleService.ts — CRUD vehicule
export const vehicleService = {
  getVehicles(), addVehicle(), updateVehicle(),
  deleteVehicle(), getBrands(), getModels()
}

// services/documentService.ts — upload/download fișiere
// services/maintenanceService.ts — jurnal service
```

### 4.3 Gestionarea Stării cu React Context

Aplicația folosește două contexte globale:

**AuthContext** — starea sesiunii utilizatorului:
```typescript
// Ascultă schimbările de sesiune în timp real
supabase.auth.onAuthStateChange((_event, session) => {
  setSession(session)
  setUser(session?.user ?? null)
})
```

**ThemeContext** — tema vizuală (light/dark):
- Web: fixat pe `light` mode
- Mobile: fixat pe `dark` mode (OLED efficiency)

### 4.4 Rutarea cu MemoryRouter

Aplicația folosește `MemoryRouter` (nu `BrowserRouter`) deoarece rulează și în Electron unde fișierele sunt servite prin `file://` protocol — nu există un server HTTP care să gestioneze rutele URL.

### 4.5 Componenta VehicleForm — Logică Complexă

Formularul de vehicule este cel mai complex component (430 linii). Implementează un **wizard în 2 pași**:

**Pasul 1** — Selectarea tipului:
```
[Mașină] [Motocicletă] [Camion] [Remorcă] [Scuter] [Autobuz]
```

**Pasul 2** — Câmpuri condiționale per tip:

```typescript
// Câmpurile ITP și Rovinieta sunt ascunse pentru scutere
{formData.type !== 'scooter' && (
  <input type="date" /> // ITP
  <input type="date" /> // Rovinieta
)}

// Câmpurile specifice remorcii
{formData.type === 'trailer' && (
  <input placeholder="Tip remorcă" />
  <input type="number" placeholder="Capacitate kg" />
)}

// Câmpul specific autobuzului
{formData.type === 'bus' && (
  <input type="number" placeholder="Capacitate pasageri" />
)}
```

**Selecția ierarhică Marcă → Model:**
```typescript
// 1. La schimbarea tipului → fetch branduri filtrate
useEffect(() => {
  vehicleService.getBrands(formData.type).then(setBrands)
}, [formData.type])

// 2. La selectarea brandului → fetch modele
useEffect(() => {
  const brand = brands.find(b => b.name === formData.make)
  if (brand) vehicleService.getModels(brand.id).then(setModels)
}, [formData.make, brands])

// 3. Fallback manual dacă marca nu există în DB
{isCustomBrand ? (
  <input placeholder="Introduceți marca manual" />
) : (
  <select>
    <option value="OTHER">+ Scrie manual</option>
    {brands.map(b => <option>{b.name}</option>)}
  </select>
)}
```

---

## 5. Backend: Supabase BaaS

### 5.1 De ce fără backend custom

Aplicația nu are un server Express/NestJS propriu. Supabase acoperă toate nevoile:

| Nevoie | Soluție Supabase |
|---|---|
| Autentificare | `supabase.auth.signInWithPassword()` |
| CRUD date | `supabase.from('vehicles').select()` |
| Securitate | Row Level Security (PostgreSQL) |
| Fișiere | `supabase.storage.from('car-docs').upload()` |
| Timp real | `supabase.channel().on('postgres_changes', ...)` |

### 5.2 Sanitizarea Datelor în vehicleService

Un aspect critic al serviciului este sanitizarea datelor înainte de inserare:

```typescript
async addVehicle(vehicle: VehicleInsert) {
  const isScooter = vehicle.type === 'scooter'

  const sanitizedVehicle = {
    ...vehicle,
    // String-uri goale → null (evită constraint violations)
    insurance_expiry: vehicle.insurance_expiry || null,
    // Scuterele nu au ITP/Rovinieta
    itp_expiry: isScooter ? null : (vehicle.itp_expiry || null),
    rovinieta_expiry: isScooter ? null : (vehicle.rovinieta_expiry || null),
    // VIN unic — string gol ar cauza unique constraint error
    vin: vehicle.vin || null,
    // Scuterele nu au nr. înmatriculare — 'N/A' satisface NOT NULL
    license_plate: isScooter ? 'N/A' : vehicle.license_plate,
  }

  // Ștergem cheile null pentru a evita erori "column does not exist"
  // pe scheme de DB care nu au încă coloana migrată
  if (sanitizedVehicle.trailer_type === null)
    delete sanitizedVehicle.trailer_type
  if (sanitizedVehicle.weight_capacity === null)
    delete sanitizedVehicle.weight_capacity

  return supabase.from('vehicles').insert([sanitizedVehicle]).select().single()
}
```

### 5.3 Upload Documente

```typescript
async uploadDocument(vehicleId: string, file: File, name: string, type: string) {
  const ext = file.name.split('.').pop()
  const path = `${vehicleId}/${Date.now()}.${ext}`

  // 1. Upload fișier în Storage
  const { error: uploadError } = await supabase.storage
    .from('car-docs')
    .upload(path, file)

  // 2. Înregistrare metadata în DB
  const { data } = await supabase
    .from('car_documents')
    .insert([{ car_id: vehicleId, name, file_path: path, file_type: type }])
    .select().single()

  return data
}
```

---

## 6. Desktop: Electron

### 6.1 Arhitectura Proceselor Electron

```
Main Process (main.js — Node.js)
│
├── BrowserWindow → încarcă React app (dev: localhost:5173, prod: dist/index.html)
├── Tray → icon în system tray Windows
├── node-cron → task scheduler zilnic
├── ipcMain → comunicare cu renderer
└── Supabase client → verificări background

Renderer Process (React App)
│
└── ipcRenderer → trimite/primește config de la Main
```

### 6.2 Auto-detecția Credențialelor Supabase

Electron citește automat `.env.local` al clientului web:

```javascript
function autoDetectSupabaseCredentials() {
  const envPath = path.join(__dirname, '..', 'client', '.env.local')
  const envContent = fs.readFileSync(envPath, 'utf-8')

  const urlMatch = envContent.match(/VITE_(?:PUBLIC_)?SUPABASE_URL=(.+)/)
  const keyMatch = envContent.match(/VITE_(?:PUBLIC_)?SUPABASE_ANON_KEY=(.+)/)

  if (urlMatch && keyMatch) {
    config.supabaseUrl = urlMatch[1].trim()
    config.supabaseKey = keyMatch[1].trim()
    saveConfig(config) // persists în notification-config.json
  }
}
```

Pattern **DRY**: un singur fișier `.env.local` configurează atât web-ul cât și desktop-ul.

### 6.3 Cron Job — Verificare Zilnică Expirări

```javascript
function scheduleCron() {
  const [hours, minutes] = config.time.split(':').map(Number) // default "09:00"
  const cronExpr = `${minutes} ${hours} * * *`

  cronTask = cron.schedule(cronExpr, () => {
    checkExpirationsBackground()
  }, { timezone: 'Europe/Bucharest' })
}

async function checkExpirationsBackground() {
  const { data: vehicles } = await supabase.from('vehicles').select('*')

  vehicles.forEach(vehicle => {
    const days = Math.ceil(
      (new Date(vehicle.insurance_expiry) - new Date()) / 86400000
    )
    if (days < 0) {
      new Notification({ title: '🚨 Document expirat!', ... }).show()
    } else if (days <= 7) {
      new Notification({ title: '⚠️ Expiră curând', ... }).show()
    }
  })
}
```

### 6.4 System Tray

```javascript
function createTray() {
  tray = new Tray(path.join(__dirname, 'icon.png'))
  const menu = Menu.buildFromTemplate([
    { label: 'Open Carly', click: () => mainWindow.show() },
    { label: 'Check Now', click: () => checkExpirationsBackground() },
    { type: 'separator' },
    { label: 'Quit', click: () => app.quit() }
  ])
  tray.setContextMenu(menu)
  // Double-click → deschide fereastra
  tray.on('double-click', () => mainWindow.show())
}
```

### 6.5 IPC Communication (Main ↔ Renderer)

```javascript
// Main process — expune API-ul de configurare
ipcMain.handle('get-notification-config', () => loadConfig())
ipcMain.handle('set-notification-config', (_event, newConfig) => {
  saveConfig({ ...loadConfig(), ...newConfig })
  scheduleCron() // restart cu noile setări
})
```

---

## 7. Aplicația Mobilă (React Native + Expo)

### 7.1 Structura Navigației

```
AppNavigator (NavigationContainer)
│
├── [no session] → LoginScreen
└── [session]
    ├── Stack: Main (TabNavigator)
    │   ├── Tab: DashboardScreen (Garaj)
    │   ├── Tab: NotificationsScreen (Alerte)
    │   └── Tab: ProfileScreen (Profil)
    ├── Stack: VehicleDetailsScreen (slide_from_right)
    ├── Stack: AddVehicleScreen (modal, slide_from_bottom)
    └── Stack: MaintenanceLogsScreen (slide_from_right)
```

### 7.2 Diferențe față de versiunea Web

| Aspect | Web | Mobile |
|---|---|---|
| Router | `MemoryRouter` | `@react-navigation` Stack+Tab |
| Storage sesiune | `localStorage` | `AsyncStorage` |
| Notificări | Browser Notification API | `expo-notifications` |
| Date picker | `<input type="date">` | `@react-native-community/datetimepicker` |
| Fișiere | HTML File API | `expo-document-picker` |
| Temă | Light mode | Dark mode |
| Grafice | `recharts` | `react-native-chart-kit` |

### 7.3 Serviciul de Notificări Push Locale

```typescript
export const notificationService = {
  async scheduleNotificationsForAllVehicles() {
    // Anulăm toate pentru a evita duplicate la re-sync
    await Notifications.cancelAllScheduledNotificationsAsync()

    const vehicles = await vehicleService.getVehicles()

    for (const vehicle of vehicles) {
      for (const check of ['insurance_expiry', 'itp_expiry', 'rovinieta_expiry']) {
        if (!vehicle[check]) continue

        const expiryDate = new Date(vehicle[check])
        expiryDate.setHours(9, 0, 0, 0) // livrare la 09:00 local

        // Reminder 7 zile înainte
        const reminder7 = new Date(expiryDate)
        reminder7.setDate(reminder7.getDate() - 7)

        if (reminder7 > new Date()) {
          await Notifications.scheduleNotificationAsync({
            content: { title: `Expirare ⚠️`, body: `Expiră în 7 zile!` },
            trigger: {
              type: SchedulableTriggerInputTypes.TIME_INTERVAL,
              seconds: Math.floor((reminder7 - Date.now()) / 1000)
            }
          })
        }
      }
    }
  }
}
```

### 7.4 Supabase pe Mobile — AsyncStorage

```typescript
// mobile/src/services/supabase.ts
import AsyncStorage from '@react-native-async-storage/async-storage'
import 'react-native-url-polyfill/auto' // URL API nu există nativ în RN

export const supabase = createClient(url, key, {
  auth: {
    storage: AsyncStorage,     // Sesiunea persistată local (nu localStorage)
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // Nu există URL-uri în mobile
  }
})
```

### 7.5 Date Picker Cross-Platform (iOS vs Android)

```typescript
// iOS: picker în Modal cu buton "Gata"
Platform.OS === 'ios' ? (
  <Modal visible={true} transparent animationType="slide">
    <DateTimePicker display="spinner" textColor={colors.black} ... />
  </Modal>
) : (
  // Android: picker nativ care se închide automat la selecție
  <DateTimePicker display="default" onChange={(e, date) => {
    setDatePickerField(null) // închide
    // aplică data
  }} />
)
```

---

## 8. Sistemul de Notificări Multi-Canal

| Canal | Platformă | Trigger | Implementare |
|---|---|---|---|
| **Toast in-app** | Web, Desktop | La login | `sonner` — toast persistent cu buton Ignoră |
| **Native OS** | Web, Desktop | La login | `window.Notification` / `new Notification()` Electron |
| **Push local** | Mobile | La adăugare vehicul | `expo-notifications` — programat cu TIME_INTERVAL |
| **Background cron** | Desktop | Zilnic 09:00 | `node-cron` cu timezone Europe/Bucharest |

### Fluxul NotificationManager (Web/Desktop)

```typescript
export default function NotificationManager() {
  const hasCheckedRef = useRef(false) // evită verificări duplicate

  useEffect(() => {
    if (!user || hasCheckedRef.current) return
    checkExpirations()
    hasCheckedRef.current = true
  }, [user]) // rulează o singură dată la login

  // Componenta nu randează nimic — pură logică de side-effect
  return null
}
```

---

## 9. TypeScript — Modelarea Tipurilor

```typescript
// Tipul union pentru tipurile de vehicule
export type VehicleType = 'car' | 'motorcycle' | 'truck' | 'trailer' | 'scooter' | 'bus'

// Entitatea principală
export type Vehicle = {
  id: string
  user_id: string
  type: VehicleType
  make: string; model: string; year: number; color: string
  license_plate: string | null
  vin: string | null
  insurance_expiry?: string | null
  itp_expiry?: string | null
  rovinieta_expiry?: string | null
  // Câmpuri opționale specifice tipului
  trailer_type?: string | null
  weight_capacity?: number | null
  passenger_capacity?: number | null
}

// Derivate prin utilitare TypeScript (fără duplicare)
export type VehicleFormData = Omit<Vehicle, 'id' | 'created_at' | 'user_id'>
export type VehicleInsert  = Omit<Vehicle, 'id' | 'created_at'>
export type VehicleUpdate  = Partial<VehicleFormData>
```

Folosirea `Omit<>` și `Partial<>` elimină duplicarea — toate tipurile derivă din `Vehicle`.

---

## 10. Workflow Dezvoltare și Testare

### 10.1 Mediul de Dezvoltare

```bash
# Instalare (monorepo — o singură comandă)
npm install

# Web (HMR instant cu Vite)
npm run dev:client         # → http://localhost:5173

# Desktop (Electron conectat la dev server)
npm run dev:electron       # → Fereastra Electron

# Mobile (Expo Go pe telefon)
cd mobile && npx expo start  # → Scanează QR cu Expo Go
```

### 10.2 Build și Distribuție

```bash
# Build web (TypeScript check + Vite bundle)
npm run build:client       # → client/dist/

# Packagere desktop (electron-builder)
cd electron && npm run dist  # → .exe installer

# Build mobile (EAS Cloud Build — Expo)
cd mobile && eas build --platform android
```

### 10.3 Variabile de Mediu

```bash
# client/.env.local (singurul fișier de config necesar)
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJ...

# Electron citește automat acest fișier (auto-detect pattern)
# Mobile folosește aceleași valori hardcodate în supabase.ts
```

### 10.4 Testarea Aplicației

| Metodă | Tool | Acoperire |
|---|---|---|
| **Manual Web** | Browser DevTools | UI, network, auth flows |
| **Manual Mobile** | Expo Go pe dispozitiv fizic | Touch, notificări, date picker |
| **Manual Desktop** | Electron dev mode | Tray, cron, notificări OS |
| **TypeScript** | `tsc --noEmit` | Verificare statică la build |
| **Lint** | ESLint + typescript-eslint | Calitatea codului |

---

## 11. Decizii de Design Remarcabile

### 11.1 MemoryRouter vs BrowserRouter
Aplicația web folosește `MemoryRouter` deoarece rulează și în Electron (protocol `file://`). `BrowserRouter` necesită server HTTP pentru navigare. Soluția este transparentă — același build funcționează în browser și în Electron.

### 11.2 License plate "N/A" pentru scutere
Scuterele sub 50cc nu necesită înmatriculare, dar coloana `license_plate` din DB are constrângerea `NOT NULL`. Soluția: valoarea sentinel `'N/A'` satisface constrângerea fără a schimba schema DB.

### 11.3 Ștergerea cheilor null din payload
```typescript
// Prevenire eroare "column does not exist" pentru coloane adăugate ulterior
if (sanitizedVehicle.trailer_type === null)
  delete (sanitizedVehicle as any).trailer_type
```
Coloanele `trailer_type`, `weight_capacity`, `passenger_capacity` au fost adăugate printr-o migrație ulterioară. Ștergând cheia din obiect (vs. trimiterea `null`), evităm erorile pe instanțe DB neactualizate.

### 11.4 hasCheckedRef pentru notificări
```typescript
const hasCheckedRef = useRef(false)
// Previne re-verificarea notificărilor la fiecare re-render
// useRef nu cauzează re-render, spre deosebire de useState
```

### 11.5 Tema Dark pe Mobile vs Light pe Web
- **Web/Desktop**: Light mode — aspect profesional, lizibilitate pe monitoare
- **Mobile**: Dark mode — economie baterie OLED, confort vizual nocturn
Implementat prin `theme.ts` pe mobile cu valorile de culoare inversate.

---

## 12. Posibile Îmbunătățiri

| Prioritate | Îmbunătățire | Descriere |
|---|---|---|
| 🔴 Critică | Context Isolation Electron | Activare `contextIsolation: true` cu preload.js |
| 🟡 Înaltă | React Query | Înlocuire `useState+useEffect` cu caching automat |
| 🟡 Înaltă | Teste automatizate | Vitest (unit) + Playwright (E2E) |
| 🟡 Înaltă | CI/CD | GitHub Actions: lint + build + deploy Vercel |
| 🟢 Medie | Dark mode web | ThemeContext există — toggle dezactivat |
| 🟢 Medie | EmailJS alerts | Dependența instalată, neintegrată |
| 🟢 Medie | Lazy loading | React.lazy() + Suspense pentru bundle mai mic |
| 🔵 Viitor | Multi-user fleet | Roluri: admin/driver/mechanic |
| 🔵 Viitor | API RAR | Verificare automată stare ITP din registrul RAR |

---

## 13. Concluzii și Propuneri de Viitor

### 13.1 Concluzii

Proiectul **Carly** reprezintă o implementare de succes a unei arhitecturi software moderne, cross-platform (Web, Desktop, Mobile), construite în jurul unui backend unificat de tip BaaS (Backend-as-a-Service - Supabase). Analizând structura și procesul de dezvoltare, putem formula următoarele concluzii cheie:

1. **Eficiența Monorepo (npm workspaces):** Organizarea proiectului sub formă de monorepo a redus semnificativ efortul de configurare și management al dependențelor. Deși codul este separat pe platforme, utilizarea unei baze de date comune și a aceluiași limbaj (TypeScript/JavaScript) creează un mediu de dezvoltare coeziv.
2. **Backend-less ca Avantaj Competitiv:** Utilizarea Supabase a eliminat complet necesitatea dezvoltării și întreținerii unui API server tradițional (Node.js/Express/NestJS). Row Level Security (RLS) din PostgreSQL s-a dovedit a fi un mecanism robust și extrem de sigur de autorizare a datelor direct la nivelul bazei de date.
3. **Adaptabilitate UX/UI per Platformă:** Proiectul nu a făcut compromisuri în ceea ce privește designul specific fiecărui mediu:
   - **Web:** O aplicație SPA curată și rapidă (Vite) optimizată pentru productivitate.
   - **Desktop:** O integrare nativă (Electron) care rulează optim în fundal cu remindere prin cron-jobs și tray icon dedicat.
   - **Mobile:** O experiență fluidă cu temă dark (OLED friendly) creată prin React Native și Expo, integrând notificări locale bazate pe planificări.
4. **Calitatea Codului:** Integrarea TypeScript pe toate nivelurile, utilizarea tipurilor derivate (`Omit`, `Partial`) și sanitizarea strictă a datelor în serviciile client asigură un cod robust și ușor de refactorizat.

### 13.2 Propuneri de Viitor (Roadmap de Dezvoltare)

Pentru a aduce aplicația Carly la un nivel de producție comercială (Enterprise Ready), se propun următoarele direcții de dezvoltare structurate pe 4 piloni:

#### A. Arhitectură și Calitatea Codului (Engineering Excellence)
- **Crearea unui pachet `shared`:** Extragerea interfețelor, tipurilor TypeScript, constantelor și a helperilor matematici/de dată (cum ar fi calculul zilelor până la expirare) într-un workspace comun `packages/shared`, pentru a fi importate atât de clientul web, cât și de aplicația de mobil și Electron (respectarea principiului DRY).
- **Izolarea contextului în Electron:** Trecerea de la `contextIsolation: false` la `contextIsolation: true` și implementarea unui `preload.js` securizat. Aceasta este o măsură critică pentru securitatea aplicației desktop.
- **Tranziția către React Query (TanStack Query):** Înlocuirea logicii manuale de fetch din `useEffect` cu React Query pentru a beneficia de caching automat, invalidare inteligentă a datelor la mutații, reîncercări automate în caz de erori de rețea și o sincronizare impecabilă a stării UI.

#### B. Funcționalități noi (Product Roadmap)
- **Integrarea API-ului RAR (Registrul Auto Român):** Implementarea unei verificări automate prin numărul de înmatriculare sau VIN pentru a prelua automat starea ITP, scutind utilizatorul de completarea manuală a datelor de expirare.
- **Managementul flotelor multi-utilizator (Fleet Management):** Extinderea bazei de date cu concepte de "Organizație" și "Roluri" (Admin, Manager, Șofer, Mecanic), permițând delegarea vehiculelor și vizualizarea istoricului de mentenanță de către mai mulți angajați.
- **Rapoarte Financiare și Export Date:** Adăugarea unui modul de analiză a costurilor care să permită exportarea istoricului de service în formate CSV/Excel și PDF pentru contabilitate.
- **Planificare personalizată a alertelor:** Oferirea posibilității utilizatorilor de a alege intervalele de notificare (de ex. cu 30, 14, 7, 3 și 1 zi înainte de expirare), alături de suport multi-canal extins (Email prin EmailJS, SMS sau mesaje Push prin Supabase Edge Functions).

#### C. Asigurarea Calității și Automatizare (QA & DevOps)
- **Acoperire prin Testare:** Scriere de teste unitare cu Vitest pentru logica de sanitizare și manipulare a datelor, respectiv teste E2E cu Playwright pentru fluxurile critice de login și adăugare vehicul.
- **Automatizarea fluxului de livrare (CI/CD):** Configurarea de GitHub Actions pentru rularea automată a linterelor și a testelor la fiecare Pull Request. Integrarea build-urilor automate pentru aplicația web (pe Vercel/Netlify), compilarea kiturilor desktop (.exe/.dmg) și generarea de build-uri mobile prin intermediul Expo Application Services (EAS).

