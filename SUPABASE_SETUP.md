# Supabase Setup

1) Create a Supabase project and grab the project URL + anon key.
2) In Supabase Auth > Providers, enable **Email**.
3) In Auth > URL Configuration, set:
   - Site URL: `http://localhost:3000`
   - Redirect URLs: `http://localhost:3000/*`
4) Open SQL Editor, paste and run `supabase/schema.sql`.
5) Copy `.env.example` to `.env.local` and fill:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Optional:
- Set `NEXT_PUBLIC_GARDEN_PUBLIC=false` to protect `/garden` behind login.
