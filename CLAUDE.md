# CLAUDE.md — Outsy AI Project Context

## Overview
Outsy AI is a multi-language place recommendation app. Users save favorite places (restaurants, bars, cafés, hotels, activities, destinations), pin places to try later, follow friends, and get AI-powered personalized recommendations based on their taste profile and nearby Google Places.

## Tech Stack
- **Frontend**: React (single-file SPA in `src/App.jsx`, ~4900 lines), Vite
- **Backend**: Vercel serverless functions (`api/places.js`, `api/delete-account.js`)
- **Database**: Supabase (PostgreSQL + Auth + Storage)
- **APIs**: Google Places API (New), Anthropic Claude API (AI recommendations)
- **Deployment**: Vercel at `outsy-ai.vercel.app`
- **Git**: `https://github.com/babbou1978/mon-carnet-voyage.git` (branch: main)

## Project Structure
```
src/
  App.jsx          — Main app (~4900 lines, all components)
  Auth.jsx         — Auth component (login/signup)
  supabase.js      — Supabase client init
  main.jsx         — React entry point
api/
  places.js        — Google Places API proxy (nearby, details, autocomplete, geocode, verify, mood text search)
  delete-account.js — Account deletion (service role)
public/
  manifest.json    — PWA manifest
  index.html       — HTML with meta tags
  icon-192.png, icon-512.png, apple-touch-icon.png — PWA icons
```

## Environment Variables
```
VITE_SUPABASE_URL          — Supabase project URL
VITE_SUPABASE_ANON_KEY     — Supabase anon key
VITE_GOOGLE_MAPS_KEY       — Google Maps JS API key (frontend)
GOOGLE_PLACES_KEY          — Google Places API key (backend, in Vercel env)
ANTHROPIC_API_KEY           — Claude API key (used in frontend via Anthropic API)
SUPABASE_SERVICE_ROLE_KEY  — For delete-account endpoint
```

## Database Schema (Supabase)

### profiles
```sql
user_id       uuid PRIMARY KEY REFERENCES auth.users(id)
email         text
first_name    text
last_name     text
username      text UNIQUE          — @username, 3-20 chars, [a-z0-9_.]
is_private    boolean DEFAULT false
avatar_url    text                  — Supabase Storage 'avatars' bucket
```

### memories (favorites + pins)
```sql
id            bigint PRIMARY KEY
user_id       uuid REFERENCES auth.users(id)
ts            bigint                — timestamp
name          text
type          text                  — Restaurant, Bar, Café, Hôtel, Activité, Destination
price         text                  — €, €€, €€€
cuisine       text
activity_type text
city          text
country       text
address       text
rating        integer               — 1-5 (0 for pins)
likeTags      text[]
dislikeTags   text[]
why           text                  — free-text positive review
dislike       text                  — free-text negative review
kidsf         boolean               — kids friendly
google_place_id text
lat           double precision
lng           double precision
is_pin        boolean DEFAULT false — true = pin (to try later), false = favorite
pin_note      text                  — optional note on pins
```

### preferences
```sql
user_id       uuid PRIMARY KEY
language      text                  — fr, en, es, de, it, pt, nl
theme         text                  — light, dark
nbrecos       text                  — 5, 10, 20
cities        text                  — JSON array of preferred cities
```

### friendships (follow system, Instagram-style)
```sql
id            bigint PRIMARY KEY
requester_id  uuid                  — who sent the follow request
addressee_id  uuid                  — who receives it
status        text                  — pending, accepted, blocked
created_at    timestamp
```

### Supabase Storage
- Bucket `avatars` — public read, user-scoped write

## Languages (7)
French (fr), English (en), Spanish (es), German (de), Italian (it), Portuguese (pt), Dutch (nl)

All translations are in the `TRANSLATIONS` object in App.jsx. When adding a new i18n key, add it to ALL 7 language blocks.

## Themes
- `light` — cream/gold palette
- `dark` — dark background, gold accents

Both defined in `THEMES` object. All components receive `COLORS` prop.

## Key Components (all in App.jsx)

### TravelAgent
Main app component. Manages all state: session, preferences, memories, pins, friends, AI recos, nearby places.

### PlaceSheet
Full-screen place details overlay. Photos, actions (call/website/directions/reserve), features, friends who've been, reviews. Swipe on photos navigates photos, swipe on content navigates between places. Opens when clicking any place name.

### MemoryForm
Add/edit favorite form. Place search with Google autocomplete, type selector, budget, cuisine/activity type, rating, like/dislike tags, kids friendly toggle.

### MemoryCard
Card displaying a favorite or pin. Shows name, cuisine badge, rating stars, price, address, Maps link, friend badge.

### CardActions
Action buttons on cards: distance badge, friend badge (FriendsBadge), edit/add/pin buttons.

### GoogleMap
Google Maps integration showing hearts (red), pins (blue), AI recos (gold), popular places (green), user position (purple). Layer toggles in legend.

### FriendsBadge
Round badge showing friend count, dropdown with pseudo + rating + link to friend's review.

### PlaceSearch / RecoPlaceSearch
Google Places Autocomplete wrappers.

### OpeningHoursWidget
Collapsible opening hours display with open/closed status.

## Tabs Structure
```
✨ RECO | ❤️ FAVORIS | 📌 PINS | + AJOUTER | 👥 AMIS
```

Profile is in ☰ hamburger menu (top-right) → overlay panel.

## Reco Tab Structure
Sticky sub-nav in header: `📍 ❤️7 📌1 ✨5 🔥8` (jump links)

Section order:
1. **📍 Localisation & paramètres** — GPS/manual location, radius slider, type selector (Restaurant/Bar/Café/Hôtel/Activité/Destination), mood input, result count (5/10/20)
2. **Map** — All markers
3. **❤️ Coups de cœur** — User's favorites matching type + location
4. **📌 Pins** — User's pins matching type + proximity (uses `recoPins`)
5. **✨ Reco AI** — Claude AI recommendations
6. **🔥 Lieux populaires** — Google nearby places

## Pins System
- Stored in `memories` table with `is_pin: true`
- No rating (not visited yet), but has pin_note
- Displayed like favorites (same card format, Maps link, cuisine badge)
- Enriched with friend data (`enrichedPins`)
- Filtered by type + proximity (`recoPins`) — single source for Map + Reco
- Excluded from AI candidates and Popular display
- Auto-geocoded on load if missing lat/lng (via Google Place Details or Geocode API)
- Auto-deleted when converting to favorite (handleAdd checks for matching pin)
- Can be created from: Reco cards (📌 button), friend favorites, Pins tab PlaceSearch, pin modal

## AI Prompt System
- Type-specific guidance (Restaurant, Bar, Café, Hôtel, Activité, Destination)
- User favorites included with sub-type (cuisine/activity_type) and ratings
- Candidate list includes: type, features, editorialSummary
- Mood is a HARD FILTER (not a preference)
- Pins are BOOSTed if they appear in candidates
- Cross-type comparisons forbidden (escape game ≠ museum)

## Google Places API (api/places.js)
Actions: `nearby`, `details`, `autocomplete`, `geocode`, `verify`, `mood` (text search)

### Nearby search strategy
- Double pass: POPULARITY (20 results) + DISTANCE (10 results) for primary type
- Cross-type filtering (restaurants excluded from Bar results and vice versa)
- Closed places filtered (CLOSED_PERMANENTLY, CLOSED_TEMPORARILY)
- Activity blacklist (60+ parasitic types: salons, gyms, schools, etc.)
- Features extracted: outdoorSeating, liveMusic, servesCocktails, goodForChildren, etc.
- Rooftop detection from reviews/editorialSummary
- Mood filtering on client side (`placeMatchesMood` function with synonym dictionary)

### Details endpoint
Returns: photos (up to 8, as URLs), website, phone, hours, reviews, features, Google Maps URL.

## Sticky Header Architecture
```
Header (sticky, top:0, z-index:10)
  ├── Logo + hamburger menu
  ├── Tabs
  └── Sub-nav (only in Reco tab)
Section titles (sticky, top:138px, z-index:5) — inside reco-block containers
```
Section titles are scoped to their `.reco-block` parent so they disappear when scrolled past.

## Onboarding
6-step wizard (step 0 = profile: photo, name, @username, language, theme). Username is mandatory with validation (format + uniqueness check vs DB). Scrollable on mobile.

## Follow System
Instagram-style: public profiles = auto-accept, private profiles = pending approval. Search by @username or first/last name.

## Known Issues / Pending
- apple-touch-icon.png shows "Download error" in console
- Custom SMTP for emails requires a custom domain (~10€/year)
- Sticky positioning values may need fine-tuning per device

## Important Patterns
- All hooks (useState, useEffect, useRef) MUST be at the top of TravelAgent component — React error #310 if called conditionally
- When adding new state, add it with the other useState declarations (around line 2050-2080)
- `typeMatches()` function (line ~31) handles type matching including Activité → multiple Google types
- `enrichedPins` = pins + friend data, `recoPins` = enrichedPins filtered by type + proximity
- `moodFilteredNearby` = nearby places filtered by mood — single source for Map + list
- `alreadyVisited` set = favorites + friend names + pin names — used to exclude from AI + Popular

## Common Operations

### Adding a new i18n key
Add to all 7 language blocks in TRANSLATIONS (fr ~line 103, es ~193, de ~252, it ~311, pt ~370, nl ~429, en ~488).

### Adding a new field to memories
1. Add column: `ALTER TABLE memories ADD COLUMN IF NOT EXISTS new_field type;`
2. Add to all 4 save paths in App.jsx (insert, update, handleAdd, handleUpdate)
3. Strip from Supabase insert if not a real column (like activityType → activity_type mapping)

### Deploying
```bash
git add -A && git commit -m "description" && git push
```
Vercel auto-deploys from main branch.
