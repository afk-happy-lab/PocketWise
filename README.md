# PocketWise
Track. Split. Plan. Spend Smarter.

Status: Phase 1 (login/signup, navigation, database schema, group maths). Other tabs are placeholders.

## Run it
1. Install Node.js (LTS) from nodejs.org
2. In this folder run:
   npm install
   npx expo install --fix
3. Create a free project at supabase.com. In its SQL Editor, paste and run `supabase/migrations/001_schema.sql`
4. Copy `.env.example` to `.env` and fill in your Supabase URL and anon key (Project Settings > API)
5. Run: npx expo start
6. Install "Expo Go" on your Android phone and scan the QR code (phone and PC on the same Wi-Fi)

## Test the money logic


Never commit `.env` (already in .gitignore).
