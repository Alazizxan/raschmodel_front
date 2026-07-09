# RashModel — Milliy Sertifikat Test Tizimi

**Rasch IRT** asosida ishlovchi milliy sertifikat test boshqaruv tizimi.

## Tech Stack

- **Frontend**: React 18 + Vite + React Router v6
- **Styling**: Custom CSS (Dark mode, Glassmorphism)
- **API**: Fetch-based client (`/src/api/client.js`)

## Tezkor Ishga Tushirish

### 1. Node.js O'rnatish (agar yo'q bo'lsa)

```powershell
# PowerShell (Admin) da:
.\setup.ps1
```

yoki [nodejs.org](https://nodejs.org) dan yuklab oling.

### 2. Dependencies O'rnatish

```bash
npm install
```

### 3. Development Server

```bash
npm run dev
```

> 🌐 **http://localhost:5173** da ochiladi

## Backend Sozlash

`.env` faylida backend manzilini kiriting:

```env
VITE_API_URL=http://localhost:8000
```

> Vite dev serveri `/tests` va `/students` so'rovlarini avtomatik `localhost:8000` ga proxylaydi.

## Sahifalar

| Sahifa | Yo'l | Tavsif |
|--------|------|--------|
| Dashboard | `/` | Barcha testlar ro'yxati |
| Test Yaratish | `/create-test` | Yangi test |
| Javob Kaliti | `/answer-key/:id` | Savol kalitlari |
| Talabalar | `/students/:id` | Javob kiritish |
| Natijalar | `/results/:id` | Natijalar jadvali |

## Fan Konfiguratsiyasi

```
Matematika/Fizika/Kimyo:  1-32 oddiy, 33-35 kengaytirilgan, 36-45 yozma
Ona tili/Adabiyot:        1-32 oddiy, 33-35 kengaytirilgan, 36-44 yozma, 45 insho
```

## Production Build

```bash
npm run build
# dist/ papkasiga build qilinadi
```
