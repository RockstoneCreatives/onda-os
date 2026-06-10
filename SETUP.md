# Onda OS Setup Guide

## 1. Create Database Schema

Go to your Supabase dashboard: https://supabase.com/dashboard/project/xqyktmvouaqryrcbmnvc/sql

Click "New Query" and paste the entire SQL from `lib/supabase/migrations.ts` into the editor, then click "Run".

This creates:
- `wines` table (106 wines from Excel)
- `menus` table (menus Juan creates)
- `menu_sections` table (auto-grouped wine categories)
- `menu_items` table (wines within each section)

## 2. Import Wine Data

```bash
# Install dependencies
pip install pandas openpyxl supabase

# Set the service role key as environment variable
export SUPABASE_SERVICE_ROLE_KEY="<your service role key>"

# Run the import script
python scripts/init_db.py
```

This reads `ONDA - Master Wine List NEW.xlsx` and imports all 106 active wines into the `wines` table.

## 3. Run Development Server

```bash
npm run dev
```

Open http://localhost:3000 in your browser.

## 4. Next Steps

- Implement wine list view page
- Implement menu builder
- Implement PDF generation
- Deploy to Vercel
