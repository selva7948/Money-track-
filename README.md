# Expense Tracker — Deploy & APK Steps

## Step 1: Upload to GitHub
1. Go to github.com, sign in (create free account if needed)
2. Click "+" (top right) → New repository
3. Name it `expense-tracker`, keep it Public, click Create
4. Click "uploading an existing file" link on the empty repo page
5. Drag ALL these files/folders into the upload box (keep folder structure: src/, public/, package.json, vite.config.js, index.html, .gitignore)
6. Commit the upload

## Step 2: Deploy to Vercel (free)
1. Go to vercel.com, sign in with GitHub
2. Click "Add New" → "Project"
3. Import your `expense-tracker` repo
4. Leave all settings default (Vercel auto-detects Vite) → Click Deploy
5. Wait ~1 min → you'll get a live URL like `expense-tracker-yourname.vercel.app`

## Step 3: Convert to APK
1. Go to pwabuilder.com
2. Paste your Vercel URL
3. Click "Start"
4. Once it scans, go to the "Android" package option
5. Click "Generate Package" → Download the APK
6. Transfer APK to your phone, enable "Install from unknown sources", install it

## Notes
- Data is stored locally in the browser (localStorage). Use the in-app Backup/Restore
  (Settings icon, top right) to export/import your data as a JSON file — especially
  before uninstalling or switching phones.
- This is a PWA-wrapped APK — it works offline once loaded, and shows as a real app icon.
