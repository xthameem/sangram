# Deployment Guide to Vercel

Since your project is located in a subdirectory (`projects/keam-pro`) of your main repository, follow these steps to deploy correctly.

## 1. Push Your Code to GitHub

First, ensure all your changes are committed and pushed to your GitHub repository.

```bash
git add .
git commit -m "Update Keam-Pro: Add dark mode, profile analytics, and daily challenges"
git push
```

## 2. Import Project in Vercel

1.  Go to [Vercel Dashboard](https://vercel.com/dashboard).
2.  Click **"Add New..."** -> **"Project"**.
3.  Import your Git repository (e.g., `100x`).

## 3. Configure Project Settings (Crucial Step!)

Since `keam-pro` is not in the root of your repo, you must tell Vercel where to find it.

1.  In the "Configure Project" screen, look for **"Root Directory"**.
2.  Click **"Edit"**.
3.  Select `projects/keam-pro` (or type it in).
4.  **Framework Preset**: Ensure it says `Next.js`.
5.  **Build Command**: Should be `next build` (default).
6.  **Install Command**: Should be `npm install` (default).

## 4. Environment Variables

Don't forget to add your Supabase keys here!

1.  Expand the **"Environment Variables"** section.
2.  Add the following keys from your `.env.local` file:
    *   `NEXT_PUBLIC_SUPABASE_URL`
    *   `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## 5. Deploy

Click **"Deploy"**. Vercel will build your project and give you a live URL (e.g., `keam-pro.vercel.app`).

---

**Troubleshooting:**
*   If the build fails saying it can't find `package.json`, double-check the **Root Directory** setting.
*   If styles are missing, ensure `tailwind.config.ts` (or `globals.css`) is correctly picking up files.
