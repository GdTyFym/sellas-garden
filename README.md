# BirthdaySurprise

## Local development
1) Copy `.env.example` to `.env.local` and fill the Supabase keys.
2) Run `npm install`
3) Run `npm run dev`

See `SUPABASE_SETUP.md` for the full Supabase setup steps (Auth + SQL + redirect URL).

## Asset optimization
- Run `npm run assets:optimize` to generate `public/flowers/*.avif` (quality 52) and `public/flowers/*.webp` (quality 82) from the PNGs.
- Run `npm run assets:audit` to report total size for `public/flowers` and `public/audio`.
- Optional audio: if you add `public/audio/bgm.opus`, the app will prefer it and fall back to `bgm.mp3` automatically.
  - Example (ffmpeg): `ffmpeg -i public/audio/bgm.mp3 -c:a libopus -b:a 96k public/audio/bgm.opus`
- Removed the unused `public/Pre-flowers/` folder.
