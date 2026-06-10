# Onda OS - Project Context

## Overview
Wine inventory and menu generation system for Onda and De Kade restaurants. Phase 1 MVP enables Juan to:
1. View 106 wines in a searchable, filterable interface
2. Build menus by selecting wines (auto-grouped by style → country)
3. Generate print-ready PDFs

**Owner**: Juan Melchor (juan@onda.bar)  
**Dev Contact**: Claude AI via Claude Code  
**Deployed**: Vercel (ready when user requests)

## Technical Stack
- **Frontend**: Next.js 14 (App Router) + React + TypeScript + Tailwind CSS
- **Backend**: Supabase PostgreSQL + Auth (REST API, no SDK)
- **Database**: Supabase with 106 wines, Row Level Security enabled
- **Auth**: Direct HTTP calls to Supabase auth endpoint, JWT stored in localStorage
- **PDF**: Browser print dialog (generatePDF function opens HTML in new window)

## Critical Architecture Notes

### Why Direct REST API Instead of Supabase SDK
The project uses direct HTTP calls to Supabase REST endpoints rather than the JS SDK because:
- Cookie-based auth with middleware caused complexity
- Direct HTTP calls are simpler for this MVP
- All pages handle auth client-side via localStorage token
- Pattern: Extract `access_token` from localStorage, pass as Bearer token in Authorization header

### Authentication Pattern
```typescript
const token = localStorage.getItem('supabase.auth.token')
const { access_token } = JSON.parse(token)
const response = await fetch(endpoint, {
  headers: {
    apikey: API_KEY,
    Authorization: `Bearer ${access_token}`,
  }
})
```

### API Request Headers (Critical)
All POST requests to create records MUST include `Prefer: 'return=representation'` header to get the created record back (needed to extract IDs for follow-up requests):
```typescript
headers: {
  'Content-Type': 'application/json',
  apikey: API_KEY,
  Authorization: `Bearer ${access_token}`,
  Prefer: 'return=representation', // ← MUST HAVE
}
```

## Database Schema
- **wines**: 106 active records (colour_style, region, country, producer, name, vintage, grapes, btg, prices, status)
- **menus**: User-created menus (title, created_at)
- **menu_sections**: Wine groups within menus (menu_id, name, sort_order)
- **menu_items**: Individual wines in sections (section_id, wine_id, sort_order)

All tables have RLS policies requiring `auth.role() = 'authenticated'`.

## File Structure
```
app/
  page.tsx                     # Wine list with filters
  login/page.tsx              # Login form
  menu/
    new/page.tsx              # Create menu (wine selection + auto-grouping)
    [id]/page.tsx             # Menu detail view
    [id]/pdf/page.tsx         # PDF preview (browser print)
components/
  wine-list-client.tsx        # Wine filtering + table
  footer.tsx                  # "Built by AI Kobey" footer (all pages)
lib/
  supabase/
    client.ts                 # Supabase client config + TypeScript types
    migrations.ts             # Database schema SQL
middleware.ts                 # Simplified - allows all requests (auth client-side)
.env.local                    # Supabase URL and keys
```

## Known Issues / Edge Cases
1. **Wine data has null regions** - Some wines have null region field; handled in display
2. **No edit/delete for wines** - Phase 1 scope is read-only
3. **No undo/history for menus** - Once created, menus are persisted
4. **PDF styling** - Uses browser print dialog; print margins/scaling user-controlled
5. **No drag-and-drop reordering** - Menu items ordered by sort_order but not reorderable in UI

## Testing the App

### Manual Test Flow
1. Go to http://localhost:3000/login
2. Pre-filled credentials: juan@onda.bar / OndaOS2025!Secure
3. Click "Create Menu" button
4. Select at least one wine (try filtering first)
5. Set menu title, click "Create Menu"
6. Should redirect to /menu/[id] with created menu
7. Click "Download PDF" to open print preview

### API Test (with curl)
```bash
# Get auth token
TOKEN=$(curl -s -X POST "https://xqyktmvouaqryrcbmnvc.supabase.co/auth/v1/token?grant_type=password" \
  -H "Content-Type: application/json" \
  -H "apikey: <ANON_KEY>" \
  -d '{"email":"juan@onda.bar","password":"OndaOS2025!Secure"}' | jq -r '.access_token')

# Fetch wines
curl -s "https://xqyktmvouaqryrcbmnvc.supabase.co/rest/v1/wines?status=eq.Active&limit=10" \
  -H "apikey: <ANON_KEY>" \
  -H "Authorization: Bearer ${TOKEN}"
```

## Troubleshooting

### "Unauthorized" errors on menu creation
→ Check that Bearer token is being extracted correctly from localStorage JSON  
→ Verify `Prefer: 'return=representation'` header is present on POST requests

### Menu created but can't fetch it
→ Check that menu_id is correctly extracted from response (response is array, not object)  
→ Verify RLS policies are set (should allow authenticated users)

### Wine list shows "No wines found"
→ Check that token is being passed in Authorization header  
→ Verify wines are marked as status='Active'

### PDF doesn't open
→ Check browser popup blocker isn't blocking window.open()  
→ PDF generation uses browser print dialog, not server-side rendering

## Development Notes

### Adding New Pages
1. Create file in `app/path/page.tsx`
2. Check for auth token at mount: `const token = localStorage.getItem('supabase.auth.token')`
3. If no token, redirect: `router.push('/login')`
4. Footer component automatically appears (in layout)

### Modifying Wine Data
- Wine data is imported via Python script (one-time, not needed again)
- To reimport: Run `python3 scripts/init_db.py` (requires .xlsx file)
- To manually edit: Use Supabase dashboard → Editor

### Deployment to Vercel
```bash
git push origin main
# Vercel auto-deploys
# Set env vars in Vercel dashboard:
#   NEXT_PUBLIC_SUPABASE_URL
#   NEXT_PUBLIC_SUPABASE_ANON_KEY
#   SUPABASE_SERVICE_ROLE_KEY
```

## Next Steps (Phase 2+)
- [ ] Add/edit/archive wines via UI
- [ ] Bottle inventory tracking
- [ ] Drag-and-drop menu reordering
- [ ] Google Drive export
- [ ] De Kade restaurant (multi-tenant)
- [ ] Supplier catalogue import
- [ ] AI sommelier chat
- [ ] Staff contracts
- [ ] Financial dashboard

## Credentials & Keys
- **Supabase Project**: xqyktmvouaqryrcbmnvc
- **Login Email**: juan@onda.bar
- **Login Password**: OndaOS2025!Secure
- **Test Wine**: Marcel Lapierre - Morgon 2024 (Red, France)
- **Branding Link**: https://www.aikobey.com
