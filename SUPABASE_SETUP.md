# Supabase Integration Step-by-Step Guide for Sangram (Keam-Pro)

This guide will walk you through setting up Supabase as your backend for authentication and database management.

## 1. Create a Supabase Project

1.  Go to [Supabase](https://supabase.com/) and sign in.
2.  Click **"New Project"**.
3.  Enter a name for your project (e.g., `Sangram`).
4.  Set a database password (save this somewhere safe!).
5.  Select a region close to your users (e.g., Mumbai for India).
6.  Click **"Create new project"**.

## 2. Generate Supabase Keys

1.  Once your project is created (it takes a minute), go to **Project Settings** (cog icon at the bottom left).
2.  Navigate to the **API** tab.
3.  Find the **Project URL** and copy it.
4.  Find the **anon public** key and copy it.

## 3. Update Environment Variables

1.  Create a file named `.env.local` in the root of your project (`/home/thameem/Desktop/100x/projects/keam-pro/.env.local`).
2.  Add the following lines, replacing `YOUR_URL` and `YOUR_ANON_KEY` with the values you copied:

```env
NEXT_PUBLIC_SUPABASE_URL=YOUR_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY
```

## 4. Set Up Authentication in Supabase

1.  In your Supabase dashboard, go to the **Authentication** tab (shield icon).
2.  Select **Settings**.
3.  Under **Email Auth**, ensure "Enable Email Signup" is **ON**.
4.  (Optional) Under **External OAuth Providers**, enable Google if you want Google Login. You will need to get a Client ID and Secret from the Google Cloud Console.

## 5. Using Supabase in Your App

I have already installed the `@supabase/supabase-js` library. To use it:

1.  Create a Supabase client utility. Create a new file `src/lib/supabase.ts`:

```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseKey)
```

2.  Update your Login page (`src/app/(auth)/login/page.tsx`) to use this client for authentication.

## 6. Create Database Tables

Go to the **Table Editor** (table icon) in Supabase and create tables.

### Example: Users Profile Table

1.  Create a new table named `profiles`.
2.  Columns:
    *   `id`: uuid (Primary Key, link to `auth.users.id`)
    *   `full_name`: text
    *   `email`: text
    *   `avatar_url`: text
    *   `role`: text (default: 'student')
    *   `subscription_status`: text (default: 'free')

### Example: Mock Tests Table

1.  Create a table named `mock_tests`.
2.  Columns:
    *   `id`: uuid (Primary Key)
    *   `title`: text
    *   `subject`: text
    *   `difficulty`: text
    *   `duration_minutes`: int4
    *   `questions`: jsonb (store question array here for simplicity, or create a separate questions table)

## 7. Next Steps

- Replace the mock login logic in `src/app/(auth)/login/page.tsx` with `supabase.auth.signInWithPassword`.
- Replace the mock data fetching in `src/app/dashboard/page.tsx` with `supabase.from('your_table').select('*')`.

---

**Need help with specific code for login or data fetching? Just ask!**
