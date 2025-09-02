<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1vuSdy1UrZv2HTy1ySCkdqYWf3MOeY_uP

## Run Locally

**Prerequisites:**  Node.js

1. Install dependencies:
   `npm install`
2. Set the `VITE_GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key (per usare l'AI in locale)
3. Run the app:
   `npm run dev`

---

# Supabase Migration Plan

## Steps to transition app data management to Supabase

1. Set up Supabase project and tables for:
   - Staff
   - Teams
   - Shift Definitions
   - Scheduled Shifts
   - Absences

2. Replace mock data and local state with Supabase queries/mutations in hooks/useShiftData.ts.

3. Refactor authentication to use Supabase Auth instead of mockAuthenticateUser.

4. Update all CRUD operations to interact with Supabase.

5. Test all features to ensure correct data flow and persistence.

6. Document Supabase integration and update deployment instructions.
