# 🚇 MetroMates

**Connect while you commute.** MetroMates is a real-time social networking app for metro travelers — find fellow commuters on your route, swipe to connect, and chat in real time.

> This is NOT a dating app. It's a social networking and commute companion platform.

---

## ✨ Features

- 📱 **Google Authentication** via Firebase (one-tap sign-in)
- 🗺️ **Metro Route Sessions** — enter your commute, auto-expire in 45 mins
- ❤️ **Tinder-style Swipe** — swipe right to like, left to skip
- 🚇 **Mutual Match System** — both users must like each other
- 💬 **Real-time Chat** — powered by Firestore live listeners
- 👤 **Full Profile** — photo, bio, interests, gender
- 🛡️ **Safety** — block, report, same-gender mode
- 🌙 **Dark Mode First** — premium minimal design

---

## 🚀 Quick Start

### 1. Clone & Install

```bash
git clone https://github.com/yourname/metromatess
cd metromatess
npm install
```

### 2. Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project
3. Enable these services:
   - **Authentication** → Google sign-in method (enable it, add your support email)
   - **Firestore Database** → Start in production mode
   - **Storage** → Start in production mode
4. Go to Project Settings → Web App → Register app
5. Copy your Firebase config

### 3. Environment Variables

```bash
cp .env.example .env.local
```

Fill in your Firebase config values in `.env.local`:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
```

### 4. Firestore Indexes

Deploy indexes from Firebase CLI:

```bash
npm install -g firebase-tools
firebase login
firebase use --add  # select your project
firebase deploy --only firestore:indexes
firebase deploy --only firestore:rules
firebase deploy --only storage
```

Or manually create composite indexes in Firebase Console for:
- `sessions`: `active` ASC + `expiresAt` DESC
- `matches`: `users` ARRAY_CONTAINS + `createdAt` DESC
- `messages`: `matchId` ASC + `timestamp` ASC

### 5. Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 🌐 Deploy to Vercel

### Option A: One-click Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

1. Import your GitHub repo
2. Add all `NEXT_PUBLIC_FIREBASE_*` environment variables
3. Deploy!

### Option B: Vercel CLI

```bash
npm install -g vercel
vercel login
vercel --prod
```

Add environment variables in Vercel Dashboard → Settings → Environment Variables.

### Firebase Phone Auth for Production

In Firebase Console → Authentication → Settings → Authorized Domains:
- Add your Vercel domain: `your-app.vercel.app`
- Add custom domain if applicable

---

## 📁 Project Structure

```
metromatess/
├── src/
│   ├── app/
│   │   ├── auth/
│   │   │   ├── login/page.tsx       # Phone OTP login
│   │   │   ├── verify/page.tsx      # OTP verification
│   │   │   └── onboarding/page.tsx  # Profile setup
│   │   ├── home/page.tsx            # Dashboard
│   │   ├── travel/page.tsx          # Set metro route
│   │   ├── swipe/page.tsx           # Tinder-style cards
│   │   ├── matches/page.tsx         # Match list
│   │   ├── chat/[id]/page.tsx       # Real-time chat
│   │   ├── profile/page.tsx         # Edit profile
│   │   ├── layout.tsx
│   │   ├── page.tsx                 # Auth redirect
│   │   └── globals.css
│   ├── components/
│   │   └── layout/
│   │       ├── AuthProvider.tsx
│   │       └── BottomNav.tsx
│   ├── hooks/
│   │   └── useAuth.ts               # Auth state hook
│   ├── lib/
│   │   ├── firebase.ts              # Firebase init
│   │   ├── auth.ts                  # Auth helpers
│   │   ├── firestore.ts             # DB helpers
│   │   ├── storage.ts               # File upload
│   │   └── utils.ts                 # cn utility
│   ├── store/
│   │   └── index.ts                 # Zustand store
│   └── types/
│       └── index.ts                 # TypeScript types
├── firestore.rules
├── firestore.indexes.json
├── storage.rules
├── firebase.json
├── vercel.json
├── .env.example
└── package.json
```

---

## 🗃️ Firestore Schema

### `users/{uid}`
```
uid: string
phone: string
name: string
age: number
gender: "male" | "female" | "non-binary" | "prefer-not-to-say"
bio: string
interests: string[]
photoURL: string
onboardingCompleted: boolean
createdAt: Timestamp
blockedUsers: string[]
sameGenderMode: boolean
```

### `sessions/{sessionId}`
```
userId: string
from: string
to: string
active: boolean
timestamp: Timestamp
expiresAt: Timestamp    // +45 mins
userName: string
userPhoto: string | null
```

### `likes/{likeId}`
```
fromUserId: string
toUserId: string
timestamp: Timestamp
```

### `matches/{matchId}`
```
users: [uid1, uid2]
userDetails: { [uid]: { name, photoURL, phone } }
createdAt: Timestamp
lastMessage: string
lastMessageAt: Timestamp
```

### `messages/{messageId}`
```
matchId: string
senderId: string
senderName: string
text: string
timestamp: Timestamp
read: boolean
```

### `reports/{reportId}`
```
reporterId: string
reportedUserId: string
reason: string
description: string
timestamp: Timestamp
```

---

## 🛡️ Safety

- Block users permanently
- Report users with reasons
- Same-gender mode (show only same gender)
- No exact location sharing
- Session auto-expires in 45 minutes
- Firestore security rules protect all data

---

## 🎨 Tech Stack

| Tech | Purpose |
|------|---------|
| Next.js 15 | App Router framework |
| TypeScript | Type safety |
| Tailwind CSS | Styling |
| Firebase Auth | Phone OTP |
| Firestore | Real-time database |
| Firebase Storage | Profile photos |
| Framer Motion | Animations |
| react-tinder-card | Swipe cards |
| Zustand | State management |
| react-hot-toast | Notifications |

---

## 📝 Notes

- Google sign-in requires your domain to be in Firebase Authorized Domains before deploying
- On localhost, `localhost` is automatically authorized — no extra setup needed
- Sessions expire automatically after 45 minutes
- The app is mobile-first (max-width: 480px centered)

---

Built with ❤️ for commuters everywhere.
