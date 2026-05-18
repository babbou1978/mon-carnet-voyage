import { useState, useEffect, useLayoutEffect, useRef, useCallback } from "react";
import { APP_VERSION, BUILD_DATE } from "./version.js";
import { supabase } from "./supabase.js";
import Auth from "./Auth.jsx";

const TYPES = ["Restaurant", "Bar", "Café", "Hôtel", "Activité", "Destination"];
const PRICES = ["€", "€€", "€€€"];
const TYPE_ICONS = { "Restaurant": "🍽️", "Bar": "🍷", "Café": "☕", "Hôtel": "🏨", "Activité": "🎯", "Destination": "🗺️" };
const getTypeIcon = (type) => {
  if (!type) return "🍽️";
  const first = type.split(",")[0].trim();
  return TYPE_ICONS[first] || "🍽️";
};
const GOOGLE_TYPE_MAP = { restaurant: "Restaurant", cafe: "Café", coffee_shop: "Café", tea_house: "Café", bakery: "Café", bar: "Bar", night_club: "Bar", wine_bar: "Bar", cocktail_bar: "Bar", lodging: "Hôtel", hotel: "Hôtel", tourist_attraction: "Activité", historical_landmark: "Destination", national_park: "Destination", museum: "Activité", art_gallery: "Activité", park: "Activité", playground: "Activité", amusement_park: "Activité", performing_arts_theater: "Activité", miniature_golf_course: "Activité", golf_course: "Activité", bowling_alley: "Activité", gym: "Activité", spa: "Activité", zoo: "Activité", aquarium: "Activité", stadium: "Activité", movie_theater: "Activité", library: "Activité", casino: "Activité", ski_resort: "Activité", water_park: "Activité", campground: "Activité", entertainment: "Activité", escape_room: "Activité", video_arcade: "Activité", theme_park: "Activité", trampoline_park: "Activité", fitness_center: "Activité", concert_hall: "Activité", comedy_club: "Activité", live_music_venue: "Activité", ice_skating_rink: "Activité", swimming_pool: "Activité", botanical_garden: "Activité", hiking_area: "Activité", marina: "Activité", dog_park: "Activité", skateboard_park: "Activité", food: "Restaurant" };

const ONBOARD_TOUR = {
  fr:{onboardWelcome:"Bienvenue sur Outsy AI !",onboardWelcomeSub:"Configurons votre profil en 30 secondes.",onboardNext:"Suivant →",onboardBack:"Retour",onboardFinish:"C'est parti ! 🚀",onboardDone:"✓ Profil créé !",onboardSkip:"Passer et terminer",onboardCities:"Vos villes préférées",onboardCitiesSub:"Où allez-vous le plus souvent ? Ça aide notre IA. (optionnel)",onboardCitiesPlaceholder:"ex: Londres, Paris, New York, Tokyo...",onboardResultsSub:"Choisissez le nombre de résultats à afficher et votre budget habituel. (optionnel)",onboardLikesSub:"Sélectionnez ce qui compte pour vous (optionnel)",onboardDislikesSub:"Sélectionnez ce que vous préférez éviter (optionnel)",onboardNotesSub:"Autre chose qui aide nos recommandations ? Régime, allergies, style... (optionnel)",onboardNotesPlaceholder:"ex: Je suis végétarien, je préfère les endroits calmes, je voyage avec des enfants...",tourRecoDesc:"Trouvez les meilleurs lieux autour de vous. Lieux populaires Google + recommandations IA personnalisées.",tourReco:"Recommandations",tourFav:"Favoris",tourAdd:"Ajouter",tourFriends:"Abonnements",tourProfile:"Profil",tourFavDesc:"Tous vos coups de cœur, notés et détaillés. Filtrez par type, prix, note.",tourAddDesc:"Enregistrez un lieu en quelques secondes. Recherche Google intégrée avec auto-complétion.",tourFriendsDesc:"Suivez des utilisateurs et découvrez leurs coups de cœur. Leurs favoris enrichissent vos recommandations.",tourProfileDesc:"Personnalisez vos préférences pour des recommandations sur mesure.",tourNext:"Suivant →",tourStart:"C'est parti ! 🎉",tourSkip:"Passer le tour",onboardReady:"Vous êtes prêt(e) !",onboardReadySub:"Votre profil est configuré. Faisons un tour rapide de l'app, puis vous pourrez commencer à explorer !"},
  en:{onboardWelcome:"Welcome to Outsy AI!",onboardWelcomeSub:"Let's set up your profile in 30 seconds.",onboardNext:"Next →",onboardBack:"Back",onboardFinish:"Let's go! 🚀",onboardDone:"✓ Profile created!",onboardSkip:"Skip & finish",onboardCities:"Your favorite cities",onboardCitiesSub:"Where do you go most often? This helps our AI. (optional)",onboardCitiesPlaceholder:"e.g. London, Paris, New York, Tokyo...",onboardResultsSub:"Choose how many results to display and your usual budget. (optional)",onboardLikesSub:"Select what matters to you (optional)",onboardDislikesSub:"Select what you prefer to skip (optional)",onboardNotesSub:"Anything else that helps us recommend better? Diet, allergies, style... (optional)",onboardNotesPlaceholder:"e.g. I'm vegetarian, I prefer quiet places, I travel with kids...",tourRecoDesc:"Find the best places around you. Google popular places + personalized AI recommendations.",tourReco:"Recommendations",tourFav:"Favorites",tourAdd:"Add",tourFriends:"Following",tourProfile:"Profile",tourFavDesc:"All your favorites, rated and detailed. Filter by type, price, rating.",tourAddDesc:"Save a place in seconds. Integrated Google search with autocomplete.",tourFriendsDesc:"Follow users and discover their favorites. Their picks enrich your recommendations.",tourProfileDesc:"Customize your preferences for tailored recommendations.",tourNext:"Next →",tourStart:"Let's go! 🎉",tourSkip:"Skip tour",onboardReady:"You're all set!",onboardReadySub:"Your profile is ready. Let's take a quick tour of the app, then you can start exploring!"},
  es:{onboardWelcome:"¡Bienvenido a Outsy AI!",onboardWelcomeSub:"Configuremos tu perfil en 30 segundos.",onboardNext:"Siguiente →",onboardBack:"Volver",onboardFinish:"¡Vamos! 🚀",onboardDone:"✓ ¡Perfil creado!",onboardSkip:"Saltar y terminar",onboardCities:"Tus ciudades favoritas",onboardCitiesSub:"¿A dónde vas más a menudo? (opcional)",onboardCitiesPlaceholder:"ej: Londres, París, Nueva York...",onboardResultsSub:"Elige cuántos resultados mostrar y tu presupuesto habitual. (opcional)",onboardLikesSub:"Selecciona lo que te importa (opcional)",onboardDislikesSub:"Selecciona lo que prefieres evitar (opcional)",onboardNotesSub:"¿Algo más para mejores recomendaciones? (opcional)",onboardNotesPlaceholder:"ej: Soy vegetariano, prefiero lugares tranquilos...",tourRecoDesc:"Encuentra los mejores lugares cerca de ti.",tourReco:"Recomendaciones",tourFav:"Favoritos",tourAdd:"Añadir",tourFriends:"Seguidos",tourProfile:"Perfil",tourFavDesc:"Todos tus favoritos, valorados y detallados.",tourAddDesc:"Guarda un lugar en segundos.",tourFriendsDesc:"Sigue a usuarios y descubre sus favoritos.",tourProfileDesc:"Personaliza tus preferencias.",tourNext:"Siguiente →",tourStart:"¡Vamos! 🎉",tourSkip:"Saltar tour",onboardReady:"¡Todo listo!",onboardReadySub:"Tu perfil está listo. Hagamos un tour rápido y podrás empezar a explorar."},
  de:{onboardWelcome:"Willkommen bei Outsy AI!",onboardWelcomeSub:"Richte dein Profil in 30 Sekunden ein.",onboardNext:"Weiter →",onboardBack:"Zurück",onboardFinish:"Los geht's! 🚀",onboardDone:"✓ Profil erstellt!",onboardSkip:"Überspringen",onboardCities:"Deine Lieblingsstädte",onboardCitiesSub:"Wo bist du am häufigsten? (optional)",onboardCitiesPlaceholder:"z.B. London, Paris, New York...",onboardResultsSub:"Wähle die Anzahl der Ergebnisse und dein übliches Budget. (optional)",onboardLikesSub:"Was ist dir wichtig? (optional)",onboardDislikesSub:"Was meidest du lieber? (optional)",onboardNotesSub:"Sonstiges für bessere Empfehlungen? (optional)",onboardNotesPlaceholder:"z.B. Vegetarier, mag ruhige Orte...",tourRecoDesc:"Finde die besten Orte in deiner Nähe.",tourReco:"Empfehlungen",tourFav:"Favoriten",tourAdd:"Hinzufügen",tourFriends:"Folge ich",tourProfile:"Profil",tourFavDesc:"Alle deine Favoriten, bewertet und detailliert.",tourAddDesc:"Speichere einen Ort in Sekunden.",tourFriendsDesc:"Folge Nutzern und entdecke ihre Favoriten.",tourProfileDesc:"Passe deine Vorlieben an.",tourNext:"Weiter →",tourStart:"Los geht's! 🎉",tourSkip:"Tour überspringen",onboardReady:"Alles bereit!",onboardReadySub:"Dein Profil ist fertig. Lass uns einen kurzen Rundgang machen!"},
  it:{onboardWelcome:"Benvenuto su Outsy AI!",onboardWelcomeSub:"Configuriamo il tuo profilo in 30 secondi.",onboardNext:"Avanti →",onboardBack:"Indietro",onboardFinish:"Andiamo! 🚀",onboardDone:"✓ Profilo creato!",onboardSkip:"Salta e termina",onboardCities:"Le tue città preferite",onboardCitiesSub:"Dove vai più spesso? (facoltativo)",onboardCitiesPlaceholder:"es: Londra, Parigi, New York...",onboardResultsSub:"Scegli quanti risultati mostrare e il tuo budget abituale. (facoltativo)",onboardLikesSub:"Cosa ti importa? (facoltativo)",onboardDislikesSub:"Cosa preferisci evitare? (facoltativo)",onboardNotesSub:"Qualcos'altro per raccomandazioni migliori? (facoltativo)",onboardNotesPlaceholder:"es: Vegetariano, preferisco posti tranquilli...",tourRecoDesc:"Trova i migliori posti vicino a te.",tourReco:"Raccomandazioni",tourFav:"Preferiti",tourAdd:"Aggiungi",tourFriends:"Seguiti",tourProfile:"Profilo",tourFavDesc:"Tutti i tuoi preferiti.",tourAddDesc:"Salva un luogo in pochi secondi.",tourFriendsDesc:"Segui utenti e scopri i loro preferiti.",tourProfileDesc:"Personalizza le tue preferenze.",tourNext:"Avanti →",tourStart:"Andiamo! 🎉",tourSkip:"Salta il tour",onboardReady:"Tutto pronto!",onboardReadySub:"Il tuo profilo è pronto. Facciamo un tour rapido dell'app!"},
  pt:{onboardWelcome:"Bem-vindo ao Outsy AI!",onboardWelcomeSub:"Vamos configurar o seu perfil em 30 segundos.",onboardNext:"Seguinte →",onboardBack:"Voltar",onboardFinish:"Vamos! 🚀",onboardDone:"✓ Perfil criado!",onboardSkip:"Saltar e terminar",onboardCities:"As suas cidades preferidas",onboardCitiesSub:"Onde vai mais vezes? (opcional)",onboardCitiesPlaceholder:"ex: Londres, Paris, Nova Iorque...",onboardResultsSub:"Escolha quantos resultados mostrar e o seu orçamento habitual. (opcional)",onboardLikesSub:"O que lhe importa? (opcional)",onboardDislikesSub:"O que prefere evitar? (opcional)",onboardNotesSub:"Mais alguma coisa? (opcional)",onboardNotesPlaceholder:"ex: Vegetariano, prefiro lugares calmos...",tourRecoDesc:"Encontre os melhores lugares perto de si.",tourReco:"Recomendações",tourFav:"Favoritos",tourAdd:"Adicionar",tourFriends:"Seguidos",tourProfile:"Perfil",tourFavDesc:"Todos os seus favoritos.",tourAddDesc:"Guarde um lugar em segundos.",tourFriendsDesc:"Siga utilizadores e descubra os seus favoritos.",tourProfileDesc:"Personalize as suas preferências.",tourNext:"Seguinte →",tourStart:"Vamos! 🎉",tourSkip:"Saltar tour",onboardReady:"Tudo pronto!",onboardReadySub:"O seu perfil está configurado. Vamos fazer um tour rápido!"},
  nl:{onboardWelcome:"Welkom bij Outsy AI!",onboardWelcomeSub:"Stel je profiel in in 30 seconden.",onboardNext:"Volgende →",onboardBack:"Terug",onboardFinish:"Laten we gaan! 🚀",onboardDone:"✓ Profiel aangemaakt!",onboardSkip:"Overslaan",onboardCities:"Jouw favoriete steden",onboardCitiesSub:"Waar ga je het vaakst? (optioneel)",onboardCitiesPlaceholder:"bijv. Londen, Parijs, New York...",onboardResultsSub:"Kies hoeveel resultaten je wilt zien en je gebruikelijke budget. (optioneel)",onboardLikesSub:"Wat is belangrijk voor jou? (optioneel)",onboardDislikesSub:"Wat vermijd je liever? (optioneel)",onboardNotesSub:"Nog iets voor betere aanbevelingen? (optioneel)",onboardNotesPlaceholder:"bijv. Vegetariër, hou van rustige plekken...",tourRecoDesc:"Vind de beste plekken bij jou in de buurt.",tourReco:"Aanbevelingen",tourFav:"Favorieten",tourAdd:"Toevoegen",tourFriends:"Volgend",tourProfile:"Profiel",tourFavDesc:"Al je favorieten.",tourAddDesc:"Sla een plek op in seconden.",tourFriendsDesc:"Volg gebruikers en ontdek hun favorieten.",tourProfileDesc:"Pas je voorkeuren aan.",tourNext:"Volgende →",tourStart:"Laten we gaan! 🎉",tourSkip:"Tour overslaan",onboardReady:"Alles klaar!",onboardReadySub:"Je profiel is ingesteld. Laten we een snelle rondleiding doen!"},
};
const PRICE_MAP = { PRICE_LEVEL_FREE: "€", PRICE_LEVEL_INEXPENSIVE: "€", PRICE_LEVEL_MODERATE: "€€", PRICE_LEVEL_EXPENSIVE: "€€€", PRICE_LEVEL_VERY_EXPENSIVE: "€€€" };
const normalizePrice = (p) => p === "€€€€" ? "€€€" : p; // Migrate old 4-level to 3-level
const DISTANCE_STEPS = [100, 500, 1000, 2000, 5000, 10000];
const ALL = "__ALL__"; // Internal constant for "all" filter - language independent

// Browser detection (for GPS permission help). Returns a stable key like
// 'ios_chrome' / 'android_firefox' / 'desktop_safari'. The instructions for
// re-enabling location differ per browser, so we tell the user the exact
// path rather than a generic 'check your settings'.
const detectBrowser = () => {
  if (typeof navigator === "undefined") return "unknown";
  const ua = navigator.userAgent || "";
  const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  if (isIOS) {
    if (/CriOS/.test(ua)) return "ios_chrome";
    if (/FxiOS/.test(ua)) return "ios_firefox";
    if (/EdgiOS/.test(ua)) return "ios_edge";
    return "ios_safari";
  }
  if (/Android/.test(ua)) {
    if (/Chrome/.test(ua)) return "android_chrome";
    if (/Firefox/.test(ua)) return "android_firefox";
    return "android_other";
  }
  if (/Edg/.test(ua)) return "desktop_edge";
  if (/Chrome/.test(ua)) return "desktop_chrome";
  if (/Firefox/.test(ua)) return "desktop_firefox";
  if (/Safari/.test(ua)) return "desktop_safari";
  return "unknown";
};

const GPS_INSTRUCTIONS_FR = {
  ios_safari: "Réglages iPhone → Confidentialité → Service de localisation → Safari → Pendant l'utilisation",
  ios_chrome: "Réglages iPhone → Chrome → Position → Pendant l'utilisation",
  ios_firefox: "Réglages iPhone → Firefox → Position → Autoriser",
  ios_edge: "Réglages iPhone → Edge → Position → Autoriser",
  android_chrome: "Touche 🔒 à gauche de l'URL → Autorisations du site → Position → Autoriser",
  android_firefox: "Menu ⋮ → Paramètres → Permissions des sites → Position",
  android_other: "Réglages Android → Apps → Ton navigateur → Autorisations → Position",
  desktop_chrome: "Clique 🔒 à gauche de l'URL → Position → Autoriser",
  desktop_safari: "Safari → Réglages → Sites web → Position → Autoriser",
  desktop_firefox: "Clique 🔒 à gauche de l'URL → Permissions → Position",
  desktop_edge: "Clique 🔒 à gauche de l'URL → Autorisations → Position",
  unknown: "Active la localisation dans les réglages de ton navigateur",
};

const MIC_INSTRUCTIONS_FR = {
  ios_safari: "Réglages iPhone → Confidentialité → Microphone → Safari → Activer",
  ios_chrome: "Réglages iPhone → Chrome → Microphone → Activer",
  ios_firefox: "Réglages iPhone → Firefox → Microphone → Activer",
  ios_edge: "Réglages iPhone → Edge → Microphone → Activer",
  android_chrome: "Touche 🔒 à gauche de l'URL → Autorisations du site → Microphone → Autoriser",
  android_firefox: "Menu ⋮ → Paramètres → Permissions des sites → Microphone",
  android_other: "Réglages Android → Apps → Ton navigateur → Autorisations → Microphone",
  desktop_chrome: "Clique 🔒 à gauche de l'URL → Microphone → Autoriser",
  desktop_safari: "Safari → Réglages → Sites web → Microphone → Autoriser",
  desktop_firefox: "Clique 🔒 à gauche de l'URL → Permissions → Microphone",
  desktop_edge: "Clique 🔒 à gauche de l'URL → Autorisations → Microphone",
  unknown: "Active le microphone dans les réglages de ton navigateur",
};

// Legacy compatibility: "Bar / Café" matches both "Bar" and "Café"
// Support comma-separated multi-types: "Restaurant,Bar" matches both "Restaurant" and "Bar"
const typeMatches = (memType, filterType) => {
  if (filterType === ALL) return true;
  if (!memType) return false;
  const types = memType.split(",").map(t => t.trim());
  return types.includes(filterType);
};
const DISTANCE_LABELS = ["100m", "500m", "1km", "2km", "5km", "10km"];

// ---------- Taste profile ----------
// Derives a compact, structured taste profile from the user's favorites and
// the friend favorites they have access to. Sent to the AI prompt so Claude
// can anchor each recommendation in a real preference instead of hallucinating
// generic links. Avoid forcing weak connections — only include strong signals.
function buildTasteProfile(memories, friendMemories, recoType) {
  const ownFavs = (memories||[]).filter(m => !m.is_pin && m.rating >= 3);
  const top = (recoType ? ownFavs.filter(m => typeMatches(m.type, recoType)) : ownFavs);
  // Top cuisines / sub-types weighted by rating
  const cuisineCount = new Map();
  top.forEach(m => {
    const c = m.cuisine || m.activity_type;
    if (!c) return;
    const cur = cuisineCount.get(c) || { sum: 0, n: 0 };
    cuisineCount.set(c, { sum: cur.sum + m.rating, n: cur.n + 1 });
  });
  const topCuisines = [...cuisineCount.entries()]
    .map(([c, v]) => ({ name: c, avg: v.sum / v.n, count: v.n }))
    .sort((a, b) => b.count - a.count || b.avg - a.avg)
    .slice(0, 5);
  // Avoided cuisines (low-rated favorites)
  const lowRated = (memories||[]).filter(m => !m.is_pin && m.rating > 0 && m.rating < 3);
  const avoided = [...new Set(lowRated.map(m => m.cuisine || m.activity_type).filter(Boolean))].slice(0, 5);
  // Price comfort zone (modal price)
  const priceCount = new Map();
  ownFavs.forEach(m => { if (m.price) priceCount.set(m.price, (priceCount.get(m.price) || 0) + 1); });
  const priceComfort = [...priceCount.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || null;
  // Friend anchors — friend-loved places (≥4★) in the search type
  const friendAnchors = (friendMemories || [])
    .filter(m => !m.is_pin && m.rating >= 4 && (!recoType || typeMatches(m.type, recoType)))
    .slice(0, 6)
    .map(m => ({ name: m.name, friend: m.friendName, cuisine: m.cuisine || m.activity_type || null, rating: m.rating }));
  return { topCuisines, avoided, priceComfort, friendAnchors };
}

// ---------- Fit tags ----------
// Visual grammar shared by every card (favorites, pins, AI recos, popular).
// Each card surfaces 1-3 short reasons why it fits the current context.
// Tags are computed from objective criteria — no AI scoring, no hallucinated
// numbers. Order: mood → taste → friends → pinned → near → rep.
const FIT_TAG_META = {
  mood:    { icon: "🎯", color: "#7e6fff" },
  taste:   { icon: "❤️", color: "#d4869b" },
  friends: { icon: "👥", color: "#5c9b8a" },
  pinned:  { icon: "📌", color: "#6b8cce" },
  near:    { icon: "📍", color: "#b89a2a" },
  rep:     { icon: "🔥", color: "#c87a2a" },
  context: { icon: "✨", color: "#9a8a6f" },
};
const FIT_TAG_ORDER = ["mood", "taste", "friends", "pinned", "near", "rep", "context"];

const FIT_TAG_LABELS = {
  fr: { mood: "Envie", taste: "Goûts", friends: "Amis", pinned: "Pinné", near: "Tout près", rep: "Réputé", context: "" },
  en: { mood: "Vibe", taste: "Tastes", friends: "Friends", pinned: "Pinned", near: "Close by", rep: "Top-rated", context: "" },
  es: { mood: "Vibra", taste: "Gustos", friends: "Amigos", pinned: "Fijado", near: "Cerca", rep: "Top", context: "" },
  de: { mood: "Stimmung", taste: "Geschmack", friends: "Freunde", pinned: "Gemerkt", near: "Nah", rep: "Top", context: "" },
  it: { mood: "Vibe", taste: "Gusti", friends: "Amici", pinned: "Salvato", near: "Vicino", rep: "Top", context: "" },
  pt: { mood: "Vibe", taste: "Gostos", friends: "Amigos", pinned: "Guardado", near: "Perto", rep: "Top", context: "" },
  nl: { mood: "Sfeer", taste: "Smaak", friends: "Vrienden", pinned: "Bewaard", near: "Dichtbij", rep: "Top", context: "" },
};

// Threshold for "🔥 Réputé". Calibratable — start lenient enough to surface
// great places in less-touristy neighborhoods, tight enough to mean something.
const REP_MIN_RATING = 4.6;
const REP_MIN_REVIEWS = 100;

// Computes the visual fit tags for any card. ctx provides the search context.
// Each tag carries an optional `hint` shown on hover or in the place sheet.
//   ctx = { mood, recoType, searchRadius, friendNames: Set, pinNames: Set, ownNames: Set,
//           tasteCuisines: Set, source: 'favorite'|'pin'|'ai'|'popular',
//           aiSignals?: Array<{kind, label}> }
function computeFitTags(item, ctx, lang = "fr") {
  const labels = FIT_TAG_LABELS[lang] || FIT_TAG_LABELS.fr;
  const tags = [];
  const nameLower = (item.name || "").toLowerCase();
  // 1. AI signals override / supplement client-side ones (mood + taste anchors come from Claude).
  // "context" is intentionally excluded — it's a catch-all that adds no info,
  // and the objective context (proximity, reputation) is covered by client-side
  // tags computed below.
  const aiKinds = new Set();
  if (ctx.aiSignals) {
    ctx.aiSignals.forEach(s => {
      if (s.kind && ["mood", "taste", "friends"].includes(s.kind)) {
        if (aiKinds.has(s.kind)) return;
        aiKinds.add(s.kind);
        tags.push({ kind: s.kind, label: labels[s.kind] || s.kind, hint: s.label || null });
      }
    });
  }
  // 2. Mood — client only computes if AI didn't already (favorites/pins/popular)
  if (ctx.source !== "ai" && ctx.mood && itemMatchesMood(item, ctx.mood) && !aiKinds.has("mood")) {
    tags.push({ kind: "mood", label: labels.mood, hint: ctx.mood });
  }
  // 3. Taste — favorites are taste by definition; for popular, infer from cuisine match
  if (ctx.source === "favorite" && !aiKinds.has("taste")) {
    tags.push({ kind: "taste", label: labels.taste, hint: null });
  } else if (ctx.source === "popular" && ctx.tasteCuisines && item.cuisine && ctx.tasteCuisines.has((item.cuisine || "").toLowerCase()) && !aiKinds.has("taste")) {
    tags.push({ kind: "taste", label: labels.taste, hint: item.cuisine });
  }
  // 4. Friends — a friend has been there
  if (!aiKinds.has("friends") && ctx.friendNames && ctx.friendNames.has(nameLower)) {
    tags.push({ kind: "friends", label: labels.friends, hint: null });
  }
  // 5. Pinned — already in user's pin list (only flag on non-pin sources)
  if (ctx.source !== "pin" && ctx.pinNames && ctx.pinNames.has(nameLower)) {
    tags.push({ kind: "pinned", label: labels.pinned, hint: null });
  } else if (ctx.source === "pin") {
    tags.push({ kind: "pinned", label: labels.pinned, hint: null });
  }
  // 6. Near — within half the search radius
  const dist = item._dist != null ? item._dist : (item.distanceKm != null ? item.distanceKm * 1000 : null);
  if (dist != null && ctx.searchRadius && dist <= ctx.searchRadius / 2) {
    tags.push({ kind: "near", label: labels.near, hint: dist >= 1000 ? `${(dist/1000).toFixed(1)}km` : `${Math.round(dist)}m` });
  }
  // 7. Rep — high Google rating with enough reviews
  const gRating = item.googleRating || item.rating;
  const gReviews = item.userRatingCount || 0;
  // For favorites, item.rating is the user's own 1-5 — skip rep signal in that case.
  const isUserRating = ctx.source === "favorite" || ctx.source === "pin";
  if (!isUserRating && gRating >= REP_MIN_RATING && gReviews >= REP_MIN_REVIEWS) {
    tags.push({ kind: "rep", label: labels.rep, hint: `${gRating}★ · ${gReviews} avis` });
  }
  // Sort by canonical order, dedup by kind, cap at 3
  const seen = new Set();
  return tags
    .sort((a, b) => FIT_TAG_ORDER.indexOf(a.kind) - FIT_TAG_ORDER.indexOf(b.kind))
    .filter(t => { if (seen.has(t.kind)) return false; seen.add(t.kind); return true; })
    .slice(0, 3);
}

// Parses Google Places addressComponents into structured fields. Falls back
// to a naive comma split of formattedAddress when components are missing.
// Used both by PlaceSearch (autocomplete picks) and by the nearby transform
// so saving a popular reco gets a clean city/country instead of a garbled
// "London W1U 6PT" mash-up.
function parseAddress(components, formattedAddress) {
  components = components || [];
  let city = components.find(c=>c.types?.includes("locality"))?.longText ||
             components.find(c=>c.types?.includes("postal_town"))?.longText ||
             components.find(c=>c.types?.includes("administrative_area_level_2"))?.longText ||
             "";
  if (!city) {
    const fa = formattedAddress || "";
    const parts = fa.split(",").map(s => s.trim()).filter(Boolean);
    if (parts.length >= 2) {
      const cityPart = parts[parts.length - 2] || "";
      // Strip postal-code-like tokens (FR / US digits, UK outward/inward)
      const tokens = cityPart.split(/\s+/).filter(w =>
        !/^\d+$/.test(w) &&
        !/^[A-Z]{1,2}\d[A-Z\d]?$/i.test(w) &&
        !/^\d[A-Z]{2}$/i.test(w)
      );
      city = tokens.join(" ");
    }
  }
  const country = components.find(c=>c.types?.includes("country"))?.longText ||
                  (formattedAddress || "").split(",").pop()?.trim() ||
                  "";
  const streetNumber = components.find(c=>c.types?.includes("street_number"))?.longText || "";
  const route = components.find(c=>c.types?.includes("route"))?.longText || "";
  const postalCode = components.find(c=>c.types?.includes("postal_code"))?.longText || "";
  const streetAddress = [streetNumber, route, postalCode].filter(Boolean).join(" ") || "";
  return { city, country, streetAddress };
}

// Lightweight mood matcher for client-side tags on non-AI cards. Mirrors the
// keyword logic used server-side but stays permissive — false positives are
// fine here (it's a hint, not a hard filter).
function itemMatchesMood(item, mood) {
  if (!mood) return false;
  const m = mood.toLowerCase();
  const features = (item.features || []).map(f => f.toLowerCase()).join(" ");
  const text = `${item.editorialSummary || ""} ${item.topReview || ""} ${item.cuisine || ""} ${item.why || ""}`.toLowerCase();
  const hay = `${features} ${text}`;
  // Crude synonyms — keep tight so we don't over-flag
  const syns = {
    rooftop: ["rooftop", "terrasse", "terrace", "outdoor"],
    terrasse: ["terrasse", "terrace", "outdoor", "rooftop"],
    speakeasy: ["speakeasy", "hidden", "secret", "caché"],
    romantique: ["romantic", "romantique", "intimate"],
    "live music": ["live music", "concert"],
    brunch: ["brunch"],
    cocktail: ["cocktail"],
    kids: ["kids", "enfants", "family", "famille"],
  };
  for (const [k, vs] of Object.entries(syns)) {
    if (m.includes(k) && vs.some(v => hay.includes(v))) return true;
  }
  // Fallback: raw mood string appears verbatim in features or text
  return hay.includes(m);
}

const LIKES_BY_TYPE_LANG = {
  fr: { "Restaurant":["Ambiance chaleureuse","Cuisine locale","Terrasse agréable","Service attentionné","Cadre original","Cave à vins","Produits frais","Vue exceptionnelle","Rapport qualité/prix"],"Bar":["Ambiance chaleureuse","Terrasse agréable","Bonne sélection de cocktails","Service attentionné","Cadre original","Musique agréable","Vue exceptionnelle","Rapport qualité/prix"],"Café":["Ambiance chaleureuse","Terrasse agréable","Bon café","Pâtisseries maison","Cadre original","Calme pour travailler","Brunch savoureux","Rapport qualité/prix"],"Hôtel":["Chambre spacieuse","Petit-déjeuner inclus","Piscine","Spa","Vue exceptionnelle","Personnel attentionné","Rapport qualité/prix","Calme","Emplacement idéal"],"Destination":["Paysages exceptionnels","Culture locale","Peu touristique","Gastronomie","Architecture","Nature","Art","Vie nocturne","Accessibilité"],"Activité":["Expérience unique","Bien organisé","Guide excellent","Rapport qualité/prix","Vue exceptionnelle","Originalité","Accessibilité"] },
  en: { "Restaurant":["Warm atmosphere","Local cuisine","Pleasant terrace","Attentive service","Original setting","Wine cellar","Fresh produce","Exceptional view","Value for money"],"Bar":["Warm atmosphere","Pleasant terrace","Good cocktail selection","Attentive service","Original setting","Pleasant music","Exceptional view","Value for money"],"Café":["Warm atmosphere","Pleasant terrace","Great coffee","Homemade pastries","Original setting","Quiet for working","Tasty brunch","Value for money"],"Hôtel":["Spacious room","Breakfast included","Pool","Spa","Exceptional view","Attentive staff","Value for money","Quiet","Ideal location"],"Destination":["Exceptional scenery","Local culture","Off the beaten track","Gastronomy","Architecture","Nature","Art","Nightlife","Accessibility"],"Activité":["Unique experience","Well organized","Excellent guide","Value for money","Exceptional view","Originality","Accessibility"] },
  es: { "Restaurant":["Ambiente cálido","Cocina local","Terraza agradable","Servicio atento","Ambiente original","Bodega","Productos frescos","Vista excepcional","Buena relación calidad-precio","Apto para niños"],"Bar":["Ambiente cálido","Terraza agradable","Buena selección de cócteles","Servicio atento","Ambiente original","Música agradable","Vista excepcional","Buena relación calidad-precio"],"Café":["Ambiente cálido","Terraza agradable","Buen café","Repostería casera","Ambiente original","Tranquilo para trabajar","Brunch sabroso","Buena relación calidad-precio"],"Hôtel":["Habitación amplia","Desayuno incluido","Piscina","Spa","Vista excepcional","Personal atento","Buena relación calidad-precio","Apto para niños","Tranquilo","Ubicación ideal"],"Destination":["Paisajes excepcionales","Cultura local","Poco turístico","Gastronomía","Arquitectura","Naturaleza","Arte","Vida nocturna","Apto para niños","Accesibilidad"],"Activité":["Experiencia única","Bien organizado","Excelente guía","Buena relación calidad-precio","Apto para niños","Vista excepcional","Originalidad","Accesibilidad"] },
  de: { "Restaurant":["Gemütliche Atmosphäre","Lokale Küche","Angenehme Terrasse","Aufmerksamer Service","Originelles Ambiente","Weinkeller","Frische Produkte","Außergewöhnliche Aussicht","Preis-Leistung","Kinderfreundlich"],"Bar":["Gemütliche Atmosphäre","Angenehme Terrasse","Gute Cocktailauswahl","Aufmerksamer Service","Originelles Ambiente","Angenehme Musik","Außergewöhnliche Aussicht","Preis-Leistung"],"Café":["Gemütliche Atmosphäre","Angenehme Terrasse","Guter Kaffee","Hausgemachte Gebäck","Originelles Ambiente","Ruhig zum Arbeiten","Leckerer Brunch","Preis-Leistung"],"Hôtel":["Geräumiges Zimmer","Frühstück inklusive","Pool","Spa","Außergewöhnliche Aussicht","Aufmerksames Personal","Preis-Leistung","Kinderfreundlich","Ruhig","Ideale Lage"],"Destination":["Außergewöhnliche Landschaft","Lokale Kultur","Abseits des Trubels","Gastronomie","Architektur","Natur","Kunst","Nachtleben","Kinderfreundlich","Barrierefreiheit"],"Activité":["Einzigartiges Erlebnis","Gut organisiert","Ausgezeichneter Guide","Preis-Leistung","Kinderfreundlich","Außergewöhnliche Aussicht","Originalität","Barrierefreiheit"] },
  it: { "Restaurant":["Atmosfera accogliente","Cucina locale","Terrazza piacevole","Servizio attento","Ambiente originale","Cantina","Prodotti freschi","Vista eccezionale","Rapporto qualità/prezzo","Adatto ai bambini"],"Bar":["Atmosfera accogliente","Terrazza piacevole","Buona selezione cocktail","Servizio attento","Ambiente originale","Musica piacevole","Vista eccezionale","Rapporto qualità/prezzo"],"Café":["Atmosfera accogliente","Terrazza piacevole","Buon caffè","Pasticceria artigianale","Ambiente originale","Tranquillo per lavorare","Brunch gustoso","Rapporto qualità/prezzo"],"Hôtel":["Camera spaziosa","Colazione inclusa","Piscina","Spa","Vista eccezionale","Personale attento","Rapporto qualità/prezzo","Adatto ai bambini","Tranquillo","Posizione ideale"],"Destination":["Paesaggi eccezionali","Cultura locale","Fuori dai sentieri battuti","Gastronomia","Architettura","Natura","Arte","Vita notturna","Adatto ai bambini","Accessibilità"],"Activité":["Esperienza unica","Ben organizzato","Guida eccellente","Rapporto qualità/prezzo","Adatto ai bambini","Vista eccezionale","Originalità","Accessibilità"] },
  pt: { "Restaurant":["Ambiente acolhedor","Cozinha local","Esplanada agradável","Serviço atento","Ambiente original","Adega","Produtos frescos","Vista excecional","Boa relação qualidade/preço","Adequado para crianças"],"Bar":["Ambiente acolhedor","Esplanada agradável","Boa seleção de cocktails","Serviço atento","Ambiente original","Música agradável","Vista excecional","Boa relação qualidade/preço"],"Café":["Ambiente acolhedor","Esplanada agradável","Bom café","Pastelaria caseira","Ambiente original","Sossegado para trabalhar","Brunch saboroso","Boa relação qualidade/preço"],"Hôtel":["Quarto espaçoso","Pequeno-almoço incluído","Piscina","Spa","Vista excecional","Pessoal atento","Boa relação qualidade/preço","Adequado para crianças","Sossegado","Localização ideal"],"Destination":["Paisagens excecionais","Cultura local","Fora dos circuitos turísticos","Gastronomia","Arquitetura","Natureza","Arte","Vida noturna","Adequado para crianças","Acessibilidade"],"Activité":["Experiência única","Bem organizado","Guia excelente","Boa relação qualidade/preço","Adequado para crianças","Vista excecional","Originalidade","Acessibilidade"] },
  nl: { "Restaurant":["Warme sfeer","Lokale keuken","Prettig terras","Attente bediening","Originele setting","Wijnkelder","Verse producten","Uitzonderlijk uitzicht","Prijs-kwaliteit","Kindvriendelijk"],"Bar":["Warme sfeer","Prettig terras","Goede cocktailselectie","Attente bediening","Originele setting","Prettige muziek","Uitzonderlijk uitzicht","Prijs-kwaliteit"],"Café":["Warme sfeer","Prettig terras","Goede koffie","Huisgemaakt gebak","Originele setting","Rustig om te werken","Lekker brunch","Prijs-kwaliteit"],"Hôtel":["Ruime kamer","Ontbijt inbegrepen","Zwembad","Spa","Uitzonderlijk uitzicht","Attent personeel","Prijs-kwaliteit","Kindvriendelijk","Rustig","Ideale ligging"],"Destination":["Uitzonderlijk landschap","Lokale cultuur","Onontdekt","Gastronomie","Architectuur","Natuur","Kunst","Nachtleven","Kindvriendelijk","Toegankelijkheid"],"Activité":["Unieke ervaring","Goed georganiseerd","Uitstekende gids","Prijs-kwaliteit","Kindvriendelijk","Uitzonderlijk uitzicht","Originaliteit","Toegankelijkheid"] },
};
const DISLIKES_BY_TYPE_LANG = {
  fr: { "Restaurant":["Trop bruyant","Service lent","Portions trop petites","Trop touristique","Prix excessif","Trop bondé","Service froid","Mauvaise localisation"],"Bar":["Trop bruyant","Service lent","Trop bondé","Prix excessif","Service froid","Mauvaise ambiance"],"Café":["Trop bruyant","Service lent","Trop bondé","Prix excessif","Café médiocre","Manque de choix"],"Hôtel":["Chambre trop petite","Bruit","Wi-Fi mauvais","Ménage insuffisant","Check-in tardif","Prix excessif","Emplacement mauvais"],"Destination":["Trop touristique","Foules","Manque de sécurité","Peu de transports","Trop cher","Peu d'activités"],"Activité":["Trop touristique","Mal organisé","Prix excessif","Trop long","Guide décevant","Trop de monde"] },
  en: { "Restaurant":["Too noisy","Slow service","Small portions","Too touristy","Overpriced","Too crowded","Cold service","Bad location"],"Bar":["Too noisy","Slow service","Too crowded","Overpriced","Cold service","Bad ambiance"],"Café":["Too noisy","Slow service","Too crowded","Overpriced","Mediocre coffee","Lack of choice"],"Hôtel":["Room too small","Noise","Bad Wi-Fi","Poor cleaning","Late check-in","Overpriced","Bad location"],"Destination":["Too touristy","Crowds","Safety concerns","Poor transport","Too expensive","Few activities"],"Activité":["Too touristy","Poorly organized","Overpriced","Too long","Disappointing guide","Too crowded"] },
  es: { "Restaurant":["Demasiado ruidoso","Servicio lento","Porciones pequeñas","Demasiado turístico","Precio excesivo","Demasiado lleno","Servicio frío","Mala ubicación"],"Bar":["Demasiado ruidoso","Servicio lento","Demasiado lleno","Precio excesivo","Servicio frío","Mala ambiente"],"Café":["Demasiado ruidoso","Servicio lento","Demasiado lleno","Precio excesivo","Café mediocre","Poca variedad"],"Hôtel":["Habitación pequeña","Ruido","Mal Wi-Fi","Limpieza deficiente","Check-in tardío","Precio excesivo","Mala ubicación"],"Destination":["Demasiado turístico","Multitudes","Inseguridad","Poco transporte","Demasiado caro","Pocas actividades"],"Activité":["Demasiado turístico","Mal organizado","Precio excesivo","Demasiado largo","Guía decepcionante","Demasiada gente"] },
  de: { "Restaurant":["Zu laut","Langsamer Service","Kleine Portionen","Zu touristisch","Überteuert","Zu voll","Kalter Service","Schlechte Lage"],"Bar":["Zu laut","Langsamer Service","Zu voll","Zu teuer","Kalter Service","Schlechte Stimmung"],"Café":["Zu laut","Langsamer Service","Zu voll","Zu teuer","Mittelmäßiger Kaffee","Wenig Auswahl"],"Hôtel":["Zimmer zu klein","Lärm","Schlechtes WLAN","Mangelhafte Reinigung","Später Check-in","Überteuert","Schlechte Lage"],"Destination":["Zu touristisch","Massen","Sicherheitsprobleme","Schlechter Transport","Zu teuer","Wenig Aktivitäten"],"Activité":["Zu touristisch","Schlecht organisiert","Überteuert","Zu lang","Enttäuschender Guide","Zu viele Menschen"] },
  it: { "Restaurant":["Troppo rumoroso","Servizio lento","Porzioni piccole","Troppo turistico","Prezzo eccessivo","Troppo affollato","Servizio freddo","Posizione pessima"],"Bar":["Troppo rumoroso","Servizio lento","Troppo affollato","Prezzo eccessivo","Servizio freddo","Cattiva atmosfera"],"Café":["Troppo rumoroso","Servizio lento","Troppo affollato","Prezzo eccessivo","Caffè mediocre","Poca scelta"],"Hôtel":["Camera troppo piccola","Rumore","Wi-Fi pessimo","Pulizia insufficiente","Check-in tardivo","Prezzo eccessivo","Posizione pessima"],"Destination":["Troppo turistico","Folle","Scarsa sicurezza","Pochi trasporti","Troppo caro","Poche attività"],"Activité":["Troppo turistico","Mal organizzato","Prezzo eccessivo","Troppo lungo","Guida deludente","Troppa gente"] },
  pt: { "Restaurant":["Muito barulhento","Serviço lento","Porções pequenas","Muito turístico","Preço excessivo","Muito cheio","Serviço frio","Má localização"],"Bar":["Muito barulhento","Serviço lento","Muito cheio","Preço excessivo","Serviço frio","Mau ambiente"],"Café":["Muito barulhento","Serviço lento","Muito cheio","Preço excessivo","Café medíocre","Pouca variedade"],"Hôtel":["Quarto pequeno","Barulho","Wi-Fi fraco","Limpeza insuficiente","Check-in tardio","Preço excessivo","Má localização"],"Destination":["Muito turístico","Multidões","Falta de segurança","Poucos transportes","Muito caro","Poucas atividades"],"Activité":["Muito turístico","Mal organizado","Preço excessivo","Muito longo","Guia dececionante","Demasiadas pessoas"] },
  nl: { "Restaurant":["Te luidruchtig","Trage bediening","Kleine porties","Te toeristisch","Te duur","Te druk","Koude bediening","Slechte locatie"],"Bar":["Te luid","Trage bediening","Te druk","Te duur","Koude bediening","Slechte sfeer"],"Café":["Te luid","Trage bediening","Te druk","Te duur","Matige koffie","Weinig keuze"],"Hôtel":["Kamer te klein","Lawaai","Slecht Wi-Fi","Gebrekkige schoonmaak","Late check-in","Te duur","Slechte locatie"],"Destination":["Te toeristisch","Drukte","Veiligheidsproblemen","Weinig transport","Te duur","Weinig activiteiten"],"Activité":["Te toeristisch","Slecht georganiseerd","Te duur","Te lang","Teleurstellende gids","Te druk"] },
};
const PREFS_LOVES_BY_LANG = {
  fr:["Cuisine authentique","Endroits intimistes","Découvertes locales","Vins naturels","Petits producteurs","Terrasses","Architecture","Nature","Art et culture","Gastronomie"],
  en:["Authentic cuisine","Intimate places","Local discoveries","Natural wines","Small producers","Terraces","Architecture","Nature","Art & culture","Gastronomy"],
  es:["Cocina auténtica","Lugares íntimos","Descubrimientos locales","Vinos naturales","Pequeños productores","Terrazas","Arquitectura","Naturaleza","Arte y cultura","Gastronomía","Apto para niños"],
  de:["Authentische Küche","Intime Orte","Lokale Entdeckungen","Naturweine","Kleine Produzenten","Terrassen","Architektur","Natur","Kunst & Kultur","Gastronomie","Kinderfreundlich"],
  it:["Cucina autentica","Luoghi intimi","Scoperte locali","Vini naturali","Piccoli produttori","Terrazze","Architettura","Natura","Arte e cultura","Gastronomia","Adatto ai bambini"],
  pt:["Cozinha autêntica","Lugares íntimos","Descobertas locais","Vinhos naturais","Pequenos produtores","Esplanadas","Arquitetura","Natureza","Arte e cultura","Gastronomia","Adequado para crianças"],
  nl:["Authentieke keuken","Intieme plekken","Lokale ontdekkingen","Natuurwijnen","Kleine producenten","Terrassen","Architectuur","Natuur","Kunst & cultuur","Gastronomie","Kindvriendelijk"],
};
const PREFS_HATES_BY_LANG = {
  fr:["Chaînes de restaurants","Endroits bruyants","Cuisine épicée","Menus touristiques","Grandes surfaces","Foules","Cuisine industrielle"],
  en:["Restaurant chains","Noisy places","Spicy food","Tourist menus","Shopping malls","Crowds","Industrial food"],
  es:["Cadenas de restaurantes","Lugares ruidosos","Comida picante","Menús turísticos","Grandes superficies","Multitudes","Comida industrial"],
  de:["Restaurantketten","Laute Orte","Scharfes Essen","Touristenmenüs","Einkaufszentren","Menschenmassen","Industrieessen"],
  it:["Catene di ristoranti","Luoghi rumorosi","Cibo piccante","Menu turistici","Centri commerciali","Folle","Cibo industriale"],
  pt:["Cadeias de restaurantes","Lugares barulhentos","Comida picante","Menus turísticos","Centros comerciais","Multidões","Comida industrial"],
  nl:["Restaurantketens","Lawaaierige plekken","Gekruid eten","Touristenmenu's","Winkelcentra","Drukte","Industrieel voedsel"],
};
const TYPES_I18N = {
  fr:{"Restaurant":"Restaurant","Bar":"Bar","Café":"Café","Hôtel":"Hôtel","Activité":"Activité","Destination":"Destination"},
  en:{"Restaurant":"Restaurant","Bar":"Bar","Café":"Café","Hôtel":"Hotel","Activité":"Activity","Destination":"Destination"},
  es:{"Restaurant":"Restaurante","Bar":"Bar","Café":"Café","Hôtel":"Hotel","Activité":"Actividad","Destination":"Destino"},
  de:{"Restaurant":"Restaurant","Bar":"Bar","Café":"Café","Hôtel":"Hotel","Activité":"Aktivität","Destination":"Reiseziel"},
  it:{"Restaurant":"Ristorante","Bar":"Bar","Café":"Caffè","Hôtel":"Hotel","Activité":"Attività","Destination":"Destinazione"},
  pt:{"Restaurant":"Restaurante","Bar":"Bar","Café":"Café","Hôtel":"Hotel","Activité":"Atividade","Destination":"Destino"},
  nl:{"Restaurant":"Restaurant","Bar":"Bar","Café":"Café","Hôtel":"Hotel","Activité":"Activiteit","Destination":"Bestemming"},
};
// Keep these for backward compat (used in MemoryForm before lang is known)
const LIKES_BY_TYPE = LIKES_BY_TYPE_LANG.en;
const DISLIKES_BY_TYPE = DISLIKES_BY_TYPE_LANG.en;
const PREFS_LOVES_OPTIONS = PREFS_LOVES_BY_LANG.en;
const PREFS_HATES_OPTIONS = PREFS_HATES_BY_LANG.en;


const LANGUAGES = [
  { code: "fr", label: "Français" },
  { code: "en", label: "English" },
  { code: "es", label: "Español" },
  { code: "de", label: "Deutsch" },
  { code: "it", label: "Italiano" },
  { code: "pt", label: "Português" },
  { code: "nl", label: "Nederlands" },
];


const TRANSLATIONS = {
  fr: {
    appTagline: "Save & Share places you love. Discover more.",
    tabReco: "✨ Reco", tabFavorites: "❤️ Favoris", tabAdd: "+ Ajouter", tabFriends: "👥 Amis", tabPins: "Pins", tabProfile: "Profil", pinsDesc: "Lieux à essayer. Ils seront recommandés si pertinents.", pinsEmpty: "Aucun pin. Utilisez 📌 sur les recommandations.", pinSaved: "Épinglé !", pinAlready: "Déjà épinglé", pinAlreadyFav: "Déjà dans vos favoris", pinToFav: "Visité", pinNotePrompt: "Ajouter une note (optionnel) :", pinBtn: "Épingler", pinsRecoSub: "Lieux que vous souhaitez essayer", pinNotePlaceholder: "Ex: pour les enfants, idée de date...",
    logout: "Déconnexion",
    addPlace: "Nom du lieu", addType: "Type", addPrice: "Prix", addPriceManual: "manuel", addPriceNeeded: "à indiquer",
    priceCheap: "Bon marché", priceMid: "Intermédiaire", priceHigh: "Haut de gamme",
    addCity: "Ville", addCountry: "Pays",
    addRating: "Note globale", addKids: "👶 Kids friendly", addLiked: "Ce que j'ai aimé",
    addLikedSelect: "Sélectionner", addLikedPrecise: "Préciser", addDisliked: "Ce que j'ai moins aimé",
    addDislikedSelect: "Sélectionner", addDislikedPrecise: "Préciser",
    addSave: "Enregistrer", addUpdate: "Sauvegarder",
    addCuisine: "Cuisine", addActivityType: "Type d'activité", addActivityPlaceholder: "Ex: Musée, Parc, Spa, Spectacle...",
    filterType: "Type", filterPrice: "Prix", filterRating: "Note", filterKids: "👶 Kids friendly",
    filterFriends: "👥 Amis", filterAll: "Tous", filterMine: "Mes lieux", filterFriendsOnly: "Amis",
    searchPlaces: "Chercher par nom, ville...",
    nbRecosLabel: "Nombre de résultats (Favoris & AI)", nbRecos5: "5", nbRecos10: "10", nbRecos20: "20",
    emptyFavorites: "Aucun coup de cœur encore", emptyFavoritesSub: "Commencez par ajouter un lieu",
    emptyResults: "Aucun résultat", emptyResultsSub: "Essayez d'autres filtres",
    profileIdentity: "👤 Mon identité", profileFirstName: "Prénom", profileLastName: "Nom",
    prefCitiesLabel: "🏙️ Villes préférées", prefCitiesPlaceholder: "Ajouter une ville...", prefCitiesEmpty: "Aucune ville ajoutée", profileLanguage: "🌍 Langue préférée", profileLanguageLabel: "Langue de l'interface et des recommandations",
    profileLikes: "✨ Ce que j'aime", profileLikesSelect: "Sélectionner", profileLikesPrecise: "Préciser",
    profileBudget: "Budget habituel", profileBudgetNone: "Non renseigné",
    profileDislikes: "🚫 Ce que j'évite", profileDislikesSelect: "Sélectionner", profileDislikesPrecise: "Préciser",
    profileNotes: "📝 Notes libres", profileNotesLabel: "Autres infos", profileSave: "Sauvegarder mon profil", profileSaved: "✓ Profil enregistré",
    followRequests: "🔔 Demandes de suivi", followSearch: "🔍 Rechercher un utilisateur", followSearchPlaceholder: "@pseudo...",
    followSearchBtn: "Chercher", followingList: "Suivis", followersList: "Followers", followNone: "Vous ne suivez personne.",
    followPending: "⏳ En attente", followAlready: "Abonné", followSent: "Demande envoyée", followBtn: "Suivre", followBackBtn: "Suivre en retour",
    followAccept: "✓ Accepter", followDecline: "✕", followView: "Voir ❤️", followHeartTitle: "❤️ Coups de cœur de",
    followNoHeart: "n'a pas encore de coups de cœur.", followHearts: "coups de cœur",
    followUnfollow: "Se désabonner", followPrivate: "Compte privé", followPublic: "Compte public",
    errorUsernameRequired: "Le pseudo est obligatoire.", errorUsernameTaken: "Ce pseudo est déjà pris.", errorUsernameInvalid: "3-20 caractères, lettres, chiffres, _ ou . uniquement.", profilePhoto: "Photo", profileUsername: "Pseudo", profilePrivacy: "Confidentialité",
    recoLocation: "📍 Localisation & paramètres", recoRadius: "Rayon de recherche",
    recoMood: "Mood / envie", recoMoodPlaceholder: "Ex: rooftop, romantique, brunch...", recoMoodDictate: "Dicter mon envie", recoMoodStop: "Arrêter la dictée", recoMoodListening: "À l'écoute...", recoMoodNotSupported: "La dictée vocale n'est pas disponible dans ce navigateur. Essaie Chrome, Edge ou Safari mobile.", askOutsyHeadline: "Bonjour {name} ! Dis-moi ce que tu cherches, Outsy va t'aider", askOutsyPlaceholder: "Ex: Je cherche un restaurant rooftop avec mes collègues, à côté de moi", askOutsyDictate: "Dicter ma demande", askOutsyAnalyze: "✨ Analyser ma demande", askOutsyAnalyzing: "Analyse en cours...", askOutsyClear: "Effacer", recoType: "Type", recoPrice: "Prix", recoFind: "✨ Demander à Outsy AI", recoFindNearby: "Lieux populaires",
    recoLocating: "Localisation...", recoSearching: "Recherche en cours...",
    recoGPS: "📍 Ma position", recoManual: "✏️ Saisir", recoGPSLoading: "Récupération de votre position...",
    recoHearts: "❤️ Coups de cœur", recoHeartsNear: "Vos favoris & abonnements",
    recoInCarnet: "Dans votre carnet", recoNearby: "🔥 Lieux populaires à proximité", recoNearbySub: "Triés par note et distance",
    recoAI: "✨ Outsy AI", recoAISub: "10 recommandations triées par affinité",
    recoAddFav: "+ Ajouter à mes coups de cœur", recoMapsLink: "Maps →",
    recoNoHeart: "Aucun coup de cœur dans ce rayon. Ajoutez des lieux notés ≥ 4★ !",
    duplicateTitle: "📍 Lieu déjà existant", duplicateText: "est déjà dans vos coups de cœur. Mettre à jour ?",
    duplicateCancel: "Annuler", duplicateEdit: "Modifier l'existant", duplicateUpdate: "Mettre à jour",
    deleteTitle: "Supprimer", deleteText: "sera retiré de vos favoris.", deleteConfirm: "Supprimer",
    closedTitle: "⚠️ Établissements fermés", closedText: "Ces établissements semblent définitivement fermés. Voulez-vous les supprimer de vos Favoris ?", closedKeep: "Garder", closedRemove: "Supprimer", closedToast: "✓ Favoris supprimés",
    friendSaveLabel: "Modifier avant de sauvegarder",
    cancel: "Annuler",
    unsavedTitle: "Modifications non sauvegardées", unsavedText: "Vous avez des modifications non sauvegardées. Quitter sans sauvegarder ?", unsavedStay: "Continuer", unsavedLeave: "Quitter",
    mapYou: "Vous", mapFavorites: "Favoris", mapAIPicks: "Sélection AI", mapClose: "✕ Fermer", mapFullscreen: "⛶ Plein écran", mapTooltip: "Voir la fiche",
    matchLabel: "% affinité",
    gpsError: "Erreur de localisation",
    editBtn: "✏️ Éditer", hoursOpen: "Ouvert", hoursClosed: "Fermé",
    editTitle: "✏️ Modifier", toastSaved: "✓ Souvenir enregistré !", toastUpdated: "✓ Coup de cœur mis à jour !",
    toastAdded: "✓ Ajouté à vos coups de cœur !", toastFriend: "✓ Demande envoyée !", toastFriendAdded: "✓ Ami ajouté !",
    loading: "Chargement... ✈️", loginConnect: "Se connecter", loginCreate: "Créer mon compte",
    loginEmail: "Email", loginPassword: "Mot de passe", loginFirstName: "Prénom", loginLastName: "Nom",
    loginError: "Email ou mot de passe incorrect.", loginSignupError: "Erreur lors de l'inscription.",
    loginNameRequired: "Prénom et nom requis.", loginWelcome: "Bienvenue",
    profileTheme: "Thème", themeLight: "Clair", themeDark: "Sombre",
    resetPassword: "Réinitialiser le mot de passe",
    deleteAccount: "Supprimer mon compte", deleteAccountConfirm: "⚠️ Supprimer définitivement votre compte et toutes vos données ? Cette action est irréversible.", deleteAccountConfirm2: "Êtes-vous vraiment sûr(e) ? Tous vos favoris, amis et préférences seront supprimés.", deleteAccountDone: "Compte supprimé.",
  },
  es: {
    appTagline: "Save & Share places you love. Discover more.",
    tabReco: "✨ Reco", tabFavorites: "❤️ Favoritos", tabAdd: "+ Añadir", tabFriends: "👥 Amigos", tabPins: "Pins", tabProfile: "Perfil", pinsDesc: "Lugares por probar. Se recomendarán si son relevantes.", pinsEmpty: "Sin pins. Usa 📌 en las recomendaciones.", pinSaved: "¡Fijado!", pinAlready: "Ya fijado", pinAlreadyFav: "Ya en favoritos", pinToFav: "Visitado", pinNotePrompt: "Añadir nota (opcional):", pinBtn: "Fijar", pinsRecoSub: "Lugares que quieres probar", pinNotePlaceholder: "Ej: para los niños, idea de cita...",
    logout: "Cerrar sesión",
    addPlace: "Nombre del lugar", addType: "Tipo", addPrice: "Precio", addPriceManual: "manual", addPriceNeeded: "por indicar",
    priceCheap: "Económico", priceMid: "Intermedio", priceHigh: "Alta gama",
    addCity: "Ciudad", addCountry: "País",
    addRating: "Puntuación", addKids: "Apto para niños", addLiked: "Lo que me gustó",
    addLikedSelect: "Seleccionar", addLikedPrecise: "Añadir detalles", addDisliked: "Lo que no me gustó",
    addDislikedSelect: "Seleccionar", addDislikedPrecise: "Añadir detalles",
    addSave: "Guardar", addUpdate: "Actualizar",
    addCuisine: "Cocina", addActivityType: "Tipo de actividad", addActivityPlaceholder: "Ej: Museo, Parque, Spa, Espectáculo...",
    filterType: "Tipo", filterPrice: "Precio", filterRating: "Nota", filterKids: "👶 Niños",
    filterFriends: "👥 Amigos", filterAll: "Todos", filterMine: "Mis lugares", filterFriendsOnly: "Amigos",
    searchPlaces: "Buscar por nombre, ciudad...",
    nbRecosLabel: "Número de resultados (Favoritos & AI)", nbRecos5: "5", nbRecos10: "10", nbRecos20: "20",
    emptyFavorites: "Aún sin favoritos", emptyFavoritesSub: "Empieza añadiendo un lugar",
    emptyResults: "Sin resultados", emptyResultsSub: "Prueba otros filtros",
    profileIdentity: "👤 Mi identidad", profileFirstName: "Nombre", profileLastName: "Apellido",
    prefCitiesLabel: "🏙️ Ciudades preferidas", prefCitiesPlaceholder: "Añadir una ciudad...", prefCitiesEmpty: "Sin ciudades añadidas", profileLanguage: "🌍 Idioma preferido", profileLanguageLabel: "Idioma de la interfaz y recomendaciones",
    profileLikes: "✨ Lo que me gusta", profileLikesSelect: "Seleccionar", profileLikesPrecise: "Añadir detalles",
    profileBudget: "Presupuesto habitual", profileBudgetNone: "No especificado",
    profileDislikes: "🚫 Lo que evito", profileDislikesSelect: "Seleccionar", profileDislikesPrecise: "Añadir detalles",
    profileNotes: "📝 Notas libres", profileNotesLabel: "Otra info", profileSave: "Guardar perfil", profileSaved: "✓ Perfil guardado",
    followRequests: "🔔 Solicitudes de seguimiento", followSearch: "🔍 Buscar usuario", followSearchPlaceholder: "@usuario...",
    followSearchBtn: "Buscar", followingList: "Siguiendo", followersList: "Seguidores", followNone: "No sigues a nadie.",
    followPending: "⏳ Pendiente", followAlready: "Siguiendo", followSent: "Enviado", followBtn: "Seguir", followBackBtn: "Seguir de vuelta",
    followAccept: "✓ Aceptar", followDecline: "✕", followView: "Ver ❤️", followHeartTitle: "❤️ Favoritos de",
    followNoHeart: "aún no tiene favoritos.", followHearts: "favoritos",
    followUnfollow: "Dejar de seguir", followPrivate: "Cuenta privada", followPublic: "Cuenta pública",
    errorUsernameRequired: "El usuario es obligatorio.", errorUsernameTaken: "Este usuario ya está en uso.", errorUsernameInvalid: "3-20 caracteres, letras, números, _ o . solamente.", profilePhoto: "Foto", profileUsername: "Usuario", profilePrivacy: "Privacidad",
    recoLocation: "📍 Ubicación y ajustes", recoRadius: "Radio de búsqueda",
    recoMood: "Mood / preferencia", recoMoodPlaceholder: "Ej: terraza, romántico, brunch...", recoMoodDictate: "Dictar mi preferencia", recoMoodStop: "Detener la dictado", recoMoodListening: "Escuchando...", recoMoodNotSupported: "El dictado por voz no está disponible en este navegador. Prueba Chrome, Edge o Safari móvil.", askOutsyHeadline: "¡Hola {name}! Dime qué buscas y Outsy te ayudará", askOutsyPlaceholder: "Ej: Busco un restaurante con terraza cerca de mí, con compañeros de trabajo", askOutsyDictate: "Dictar mi solicitud", askOutsyAnalyze: "✨ Analizar mi solicitud", askOutsyAnalyzing: "Analizando...", askOutsyClear: "Borrar", recoType: "Tipo", recoPrice: "Precio", recoFind: "✨ Preguntar a Outsy AI", recoFindNearby: "Lugares populares",
    recoLocating: "Localizando...", recoSearching: "Buscando...",
    recoGPS: "📍 Mi ubicación", recoManual: "✏️ Introducir", recoGPSLoading: "Obteniendo tu ubicación...",
    recoHearts: "❤️ Favoritos", recoHeartsNear: "Tus favoritos y seguidos",
    recoInCarnet: "En tu colección", recoNearby: "🔥 Lugares populares cercanos", recoNearbySub: "Ordenados por valoración y distancia",
    recoAI: "✨ Outsy AI", recoAISub: "10 recomendaciones por afinidad",
    recoAddFav: "+ Añadir a favoritos", recoMapsLink: "Maps →",
    recoNoHeart: "Sin favoritos en esta zona. ¡Añade lugares con ≥ 4★!",
    duplicateTitle: "📍 Lugar ya existe", duplicateText: "ya está en tus favoritos. ¿Actualizar?",
    duplicateCancel: "Cancelar", duplicateUpdate: "Actualizar",
    deleteTitle: "Eliminar", deleteText: "se eliminará de tus favoritos.", deleteConfirm: "Eliminar",
    closedTitle: "⚠️ Establecimientos cerrados", closedText: "Estos establecimientos parecen cerrados permanentemente. ¿Eliminarlos de tus Favoritos?", closedKeep: "Conservar", closedRemove: "Eliminar", closedToast: "✓ Favoritos eliminados",
    friendSaveLabel: "Editar antes de guardar",
    cancel: "Cancelar",
    unsavedTitle: "Cambios sin guardar", unsavedText: "Tienes cambios sin guardar. ¿Salir sin guardar?", unsavedStay: "Seguir editando", unsavedLeave: "Salir", mapFavorites: "Favoritos", mapAIPicks: "Selección AI", mapClose: "✕ Cerrar", mapFullscreen: "⛶ Pantalla completa", mapTooltip: "Ver ficha",
    matchLabel: "% afinidad",
    gpsError: "Error de localización",
    editBtn: "✏️ Editar", hoursOpen: "Abierto", hoursClosed: "Cerrado",
    toastAdded: "✓ ¡Añadido a favoritos!", toastFriend: "✓ ¡Solicitud enviada!", toastFriendAdded: "✓ ¡Amigo añadido!",
    loading: "Cargando... ✈️", loginConnect: "Iniciar sesión", loginCreate: "Crear cuenta",
    loginEmail: "Email", loginPassword: "Contraseña", loginFirstName: "Nombre", loginLastName: "Apellido",
    loginError: "Email o contraseña incorrectos.", loginSignupError: "Error al registrarse.",
    loginNameRequired: "Nombre y apellido requeridos.", loginWelcome: "Bienvenido/a",
    profileTheme: "Tema", themeLight: "Claro", themeDark: "Oscuro",
    resetPassword: "Restablecer contraseña",
    deleteAccount: "Eliminar mi cuenta", deleteAccountConfirm: "⚠️ ¿Eliminar definitivamente tu cuenta y todos tus datos? Esta acción es irreversible.", deleteAccountConfirm2: "¿Estás seguro/a? Todos tus favoritos, amigos y preferencias serán eliminados.", deleteAccountDone: "Cuenta eliminada.",
  },
  de: {
    appTagline: "Save & Share places you love. Discover more.",
    tabReco: "✨ Reco", tabFavorites: "❤️ Favoriten", tabAdd: "+ Hinzufügen", tabFriends: "👥 Freunde", tabPins: "Pins", tabProfile: "Profil", pinsDesc: "Orte zum Ausprobieren. Werden empfohlen wenn relevant.", pinsEmpty: "Keine Pins. Nutze 📌 bei Empfehlungen.", pinSaved: "Gepinnt!", pinAlready: "Bereits gepinnt", pinAlreadyFav: "Bereits in Favoriten", pinToFav: "Besucht", pinNotePrompt: "Notiz hinzufügen (optional):", pinBtn: "Pinnen", pinsRecoSub: "Orte die du ausprobieren möchtest", pinNotePlaceholder: "z.B. für die Kinder, Date-Idee...",
    logout: "Abmelden",
    addPlace: "Ortsname", addType: "Typ", addPrice: "Preis", addPriceManual: "manuell", addPriceNeeded: "angeben",
    priceCheap: "Günstig", priceMid: "Mittel", priceHigh: "Gehoben",
    addCity: "Stadt", addCountry: "Land",
    addRating: "Gesamtbewertung", addKids: "Kinderfreundlich", addLiked: "Was mir gefiel",
    addLikedSelect: "Auswählen", addLikedPrecise: "Details hinzufügen", addDisliked: "Was mir nicht gefiel",
    addDislikedSelect: "Auswählen", addDislikedPrecise: "Details hinzufügen",
    addSave: "Speichern", addUpdate: "Aktualisieren",
    addCuisine: "Küche", addActivityType: "Art der Aktivität", addActivityPlaceholder: "z.B. Museum, Park, Spa, Show...",
    filterType: "Typ", filterPrice: "Preis", filterRating: "Bewertung", filterKids: "👶 Kinder",
    filterFriends: "👥 Freunde", filterAll: "Alle", filterMine: "Meine Orte", filterFriendsOnly: "Freunde",
    searchPlaces: "Nach Name, Stadt suchen...",
    nbRecosLabel: "Anzahl Ergebnisse (Favoriten & AI)", nbRecos5: "5", nbRecos10: "10", nbRecos20: "20",
    emptyFavorites: "Noch keine Favoriten", emptyFavoritesSub: "Füge einen Ort hinzu",
    emptyResults: "Keine Ergebnisse", emptyResultsSub: "Versuche andere Filter",
    profileIdentity: "👤 Meine Identität", profileFirstName: "Vorname", profileLastName: "Nachname",
    prefCitiesLabel: "🏙️ Bevorzugte Städte", prefCitiesPlaceholder: "Stadt hinzufügen...", prefCitiesEmpty: "Keine Städte hinzugefügt", profileLanguage: "🌍 Bevorzugte Sprache", profileLanguageLabel: "Sprache der Oberfläche und Empfehlungen",
    profileLikes: "✨ Was ich mag", profileLikesSelect: "Auswählen", profileLikesPrecise: "Details hinzufügen",
    profileBudget: "Übliches Budget", profileBudgetNone: "Nicht angegeben",
    profileDislikes: "🚫 Was ich meide", profileDislikesSelect: "Auswählen", profileDislikesPrecise: "Details hinzufügen",
    profileNotes: "📝 Freie Notizen", profileNotesLabel: "Weitere Infos", profileSave: "Profil speichern", profileSaved: "✓ Profil gespeichert",
    followRequests: "🔔 Follow-Anfragen", followSearch: "🔍 Benutzer suchen", followSearchPlaceholder: "@benutzername...",
    followSearchBtn: "Suchen", followingList: "Folge ich", followersList: "Follower", followNone: "Du folgst niemandem.",
    followPending: "⏳ Ausstehend", followAlready: "Folge ich", followSent: "Gesendet", followBtn: "Folgen", followBackBtn: "Zurückfolgen",
    followAccept: "✓ Annehmen", followDecline: "✕", followView: "Anzeigen ❤️", followHeartTitle: "❤️ Favoriten von",
    followNoHeart: "hat noch keine Favoriten.", followHearts: "Favoriten",
    followUnfollow: "Entfolgen", followPrivate: "Privates Konto", followPublic: "Öffentliches Konto",
    errorUsernameRequired: "Benutzername ist erforderlich.", errorUsernameTaken: "Dieser Benutzername ist bereits vergeben.", errorUsernameInvalid: "3-20 Zeichen, Buchstaben, Zahlen, _ oder . erlaubt.", profilePhoto: "Foto", profileUsername: "Benutzername", profilePrivacy: "Privatsphäre",
    recoLocation: "📍 Standort & Einstellungen", recoRadius: "Suchradius",
    recoMood: "Mood / Stimmung", recoMoodPlaceholder: "z.B. Dachterrasse, romantisch, Brunch...", recoMoodDictate: "Stimmung diktieren", recoMoodStop: "Diktat beenden", recoMoodListening: "Höre zu...", recoMoodNotSupported: "Die Sprachdiktierung ist in diesem Browser nicht verfügbar. Versuche Chrome, Edge oder mobiles Safari.", askOutsyHeadline: "Hallo {name}! Sag mir, wonach du suchst, und Outsy hilft dir", askOutsyPlaceholder: "z.B. Ich suche ein Rooftop-Restaurant in meiner Nähe, mit Kollegen", askOutsyDictate: "Anfrage diktieren", askOutsyAnalyze: "✨ Anfrage analysieren", askOutsyAnalyzing: "Wird analysiert...", askOutsyClear: "Löschen", recoType: "Typ", recoPrice: "Preis", recoFind: "✨ Outsy AI fragen", recoFindNearby: "Beliebte Orte",
    recoLocating: "Wird geortet...", recoSearching: "Suche läuft...",
    recoGPS: "📍 Mein Standort", recoManual: "✏️ Eingeben", recoGPSLoading: "Standort wird ermittelt...",
    recoHearts: "❤️ Favoriten", recoHeartsNear: "Deine Favoriten & Gefolgte",
    recoInCarnet: "In deiner Sammlung", recoNearby: "🔥 Beliebte Orte in der Nähe", recoNearbySub: "Sortiert nach Bewertung und Entfernung",
    recoAI: "✨ Outsy AI", recoAISub: "10 Empfehlungen nach Übereinstimmung",
    recoAddFav: "+ Zu Favoriten hinzufügen", recoMapsLink: "Maps →",
    recoNoHeart: "Keine Favoriten in diesem Bereich. Füge Orte mit ≥ 4★ hinzu!",
    duplicateTitle: "📍 Ort bereits vorhanden", duplicateText: "ist bereits in deinen Favoriten. Aktualisieren?",
    duplicateCancel: "Abbrechen", duplicateEdit: "Bestehenden bearbeiten", duplicateUpdate: "Aktualisieren",
    deleteTitle: "Löschen", deleteText: "wird aus deinen Favoriten entfernt.", deleteConfirm: "Löschen",
    closedTitle: "⚠️ Geschlossene Orte", closedText: "Diese Orte scheinen dauerhaft geschlossen. Aus Favoriten entfernen?", closedKeep: "Behalten", closedRemove: "Entfernen", closedToast: "✓ Favoriten entfernt",
    friendSaveLabel: "Vor dem Speichern bearbeiten",
    cancel: "Abbrechen",
    unsavedTitle: "Ungespeicherte Änderungen", unsavedText: "Du hast ungespeicherte Änderungen. Ohne Speichern verlassen?", unsavedStay: "Weiter bearbeiten", unsavedLeave: "Verlassen", mapFavorites: "Favoriten", mapAIPicks: "AI-Auswahl", mapClose: "✕ Schließen", mapFullscreen: "⛶ Vollbild", mapTooltip: "Details ansehen",
    matchLabel: "% Übereinstimmung",
    gpsError: "Standortfehler",
    editBtn: "✏️ Bearbeiten", hoursOpen: "Geöffnet", hoursClosed: "Geschlossen",
    toastAdded: "✓ Zu Favoriten hinzugefügt!", toastFriend: "✓ Anfrage gesendet!", toastFriendAdded: "✓ Freund hinzugefügt!",
    loading: "Laden... ✈️", loginConnect: "Anmelden", loginCreate: "Konto erstellen",
    loginEmail: "E-Mail", loginPassword: "Passwort", loginFirstName: "Vorname", loginLastName: "Nachname",
    loginError: "Falsche E-Mail oder falsches Passwort.", loginSignupError: "Fehler bei der Registrierung.",
    loginNameRequired: "Vor- und Nachname erforderlich.", loginWelcome: "Willkommen",
    profileTheme: "Design", themeLight: "Hell", themeDark: "Dunkel",
    resetPassword: "Passwort zurücksetzen",
    deleteAccount: "Mein Konto löschen", deleteAccountConfirm: "⚠️ Konto und alle Daten endgültig löschen? Diese Aktion kann nicht rückgängig gemacht werden.", deleteAccountConfirm2: "Bist du wirklich sicher? Alle Favoriten, Freunde und Einstellungen werden gelöscht.", deleteAccountDone: "Konto gelöscht.",
  },
  it: {
    appTagline: "Save & Share places you love. Discover more.",
    tabReco: "✨ Reco", tabFavorites: "❤️ Preferiti", tabAdd: "+ Aggiungi", tabFriends: "👥 Amici", tabPins: "Pins", tabProfile: "Profilo", pinsDesc: "Luoghi da provare. Saranno raccomandati se pertinenti.", pinsEmpty: "Nessun pin. Usa 📌 sui suggerimenti.", pinSaved: "Appuntato!", pinAlready: "Già appuntato", pinAlreadyFav: "Già nei preferiti", pinToFav: "Visitato", pinNotePrompt: "Aggiungi nota (opzionale):", pinBtn: "Appuntare", pinsRecoSub: "Luoghi che vuoi provare", pinNotePlaceholder: "Es: per i bambini, idea per un appuntamento...",
    logout: "Disconnetti",
    addPlace: "Nome del posto", addType: "Tipo", addPrice: "Prezzo", addPriceManual: "manuale", addPriceNeeded: "da indicare",
    priceCheap: "Economico", priceMid: "Medio", priceHigh: "Alta gamma",
    addCity: "Città", addCountry: "Paese",
    addRating: "Valutazione", addKids: "Adatto ai bambini", addLiked: "Cosa mi è piaciuto",
    addLikedSelect: "Seleziona", addLikedPrecise: "Aggiungi dettagli", addDisliked: "Cosa non mi è piaciuto",
    addDislikedSelect: "Seleziona", addDislikedPrecise: "Aggiungi dettagli",
    addSave: "Salva", addUpdate: "Aggiorna",
    addCuisine: "Cucina", addActivityType: "Tipo di attività", addActivityPlaceholder: "Es: Museo, Parco, Spa, Spettacolo...",
    filterType: "Tipo", filterPrice: "Prezzo", filterRating: "Valutazione", filterKids: "👶 Bambini",
    filterFriends: "👥 Amici", filterAll: "Tutti", filterMine: "I miei posti", filterFriendsOnly: "Amici",
    searchPlaces: "Cerca per nome, città...",
    nbRecosLabel: "Numero risultati (Preferiti & AI)", nbRecos5: "5", nbRecos10: "10", nbRecos20: "20",
    emptyFavorites: "Ancora nessun preferito", emptyFavoritesSub: "Inizia aggiungendo un posto",
    emptyResults: "Nessun risultato", emptyResultsSub: "Prova altri filtri",
    profileIdentity: "👤 La mia identità", profileFirstName: "Nome", profileLastName: "Cognome",
    prefCitiesLabel: "🏙️ Città preferite", prefCitiesPlaceholder: "Aggiungi una città...", prefCitiesEmpty: "Nessuna città aggiunta", profileLanguage: "🌍 Lingua preferita", profileLanguageLabel: "Lingua dell'interfaccia e delle raccomandazioni",
    profileLikes: "✨ Cosa mi piace", profileLikesSelect: "Seleziona", profileLikesPrecise: "Aggiungi dettagli",
    profileBudget: "Budget abituale", profileBudgetNone: "Non specificato",
    profileDislikes: "🚫 Cosa evito", profileDislikesSelect: "Seleziona", profileDislikesPrecise: "Aggiungi dettagli",
    profileNotes: "📝 Note libere", profileNotesLabel: "Altre info", profileSave: "Salva profilo", profileSaved: "✓ Profilo salvato",
    followRequests: "🔔 Richieste di follow", followSearch: "🔍 Cerca utente", followSearchPlaceholder: "@nomeutente...",
    followSearchBtn: "Cerca", followingList: "Seguiti", followersList: "Follower", followNone: "Non segui nessuno.",
    followPending: "⏳ In attesa", followAlready: "Segui già", followSent: "Inviato", followBtn: "Segui", followBackBtn: "Segui anche",
    followAccept: "✓ Accetta", followDecline: "✕", followView: "Vedi ❤️", followHeartTitle: "❤️ Preferiti di",
    followNoHeart: "non ha ancora preferiti.", followHearts: "preferiti",
    followUnfollow: "Smetti di seguire", followPrivate: "Account privato", followPublic: "Account pubblico",
    errorUsernameRequired: "Il nome utente è obbligatorio.", errorUsernameTaken: "Questo nome utente è già in uso.", errorUsernameInvalid: "3-20 caratteri, lettere, numeri, _ o . ammessi.", profilePhoto: "Foto", profileUsername: "Nome utente", profilePrivacy: "Privacy",
    recoLocation: "📍 Posizione & impostazioni", recoRadius: "Raggio di ricerca",
    recoMood: "Mood / desiderio", recoMoodPlaceholder: "Es: rooftop, romantico, brunch...", recoMoodDictate: "Detta il desiderio", recoMoodStop: "Ferma la dettatura", recoMoodListening: "In ascolto...", recoMoodNotSupported: "La dettatura vocale non è disponibile in questo browser. Prova Chrome, Edge o Safari mobile.", askOutsyHeadline: "Ciao {name}! Dimmi cosa cerchi e Outsy ti aiuterà", askOutsyPlaceholder: "Es: Cerco un ristorante rooftop vicino a me, con i colleghi", askOutsyDictate: "Detta la tua richiesta", askOutsyAnalyze: "✨ Analizza la mia richiesta", askOutsyAnalyzing: "Analisi in corso...", askOutsyClear: "Cancella", recoType: "Tipo", recoPrice: "Prezzo", recoFind: "✨ Chiedi a Outsy AI", recoFindNearby: "Posti popolari",
    recoLocating: "Localizzazione...", recoSearching: "Ricerca in corso...",
    recoGPS: "📍 La mia posizione", recoManual: "✏️ Inserisci", recoGPSLoading: "Recupero posizione...",
    recoHearts: "❤️ Preferiti", recoHeartsNear: "I tuoi preferiti e seguiti",
    recoInCarnet: "Nella tua collezione", recoNearby: "🔥 Posti popolari vicini", recoNearbySub: "Ordinati per valutazione e distanza",
    recoAI: "✨ Outsy AI", recoAISub: "10 raccomandazioni per affinità",
    recoAddFav: "+ Aggiungi ai preferiti", recoMapsLink: "Maps →",
    recoNoHeart: "Nessun preferito in quest'area. Aggiungi posti con ≥ 4★!",
    duplicateTitle: "📍 Posto già esistente", duplicateText: "è già nei tuoi preferiti. Aggiornare?",
    duplicateCancel: "Annulla", duplicateEdit: "Modifica esistente", duplicateUpdate: "Aggiorna",
    deleteTitle: "Elimina", deleteText: "verrà rimosso dai tuoi preferiti.", deleteConfirm: "Elimina",
    closedTitle: "⚠️ Posti chiusi", closedText: "Questi posti sembrano chiusi definitivamente. Rimuoverli dai Preferiti?", closedKeep: "Tieni", closedRemove: "Rimuovi", closedToast: "✓ Preferiti rimossi",
    friendSaveLabel: "Modifica prima di salvare",
    cancel: "Annulla",
    unsavedTitle: "Modifiche non salvate", unsavedText: "Hai modifiche non salvate. Uscire senza salvare?", unsavedStay: "Continua a modificare", unsavedLeave: "Esci", mapFavorites: "Preferiti", mapAIPicks: "Selezione AI", mapClose: "✕ Chiudi", mapFullscreen: "⛶ Schermo intero", mapTooltip: "Vedi scheda",
    matchLabel: "% affinità",
    gpsError: "Errore di localizzazione",
    editBtn: "✏️ Modifica", hoursOpen: "Aperto", hoursClosed: "Chiuso",
    toastAdded: "✓ Aggiunto ai preferiti!", toastFriend: "✓ Richiesta inviata!", toastFriendAdded: "✓ Amico aggiunto!",
    loading: "Caricamento... ✈️", loginConnect: "Accedi", loginCreate: "Crea account",
    loginEmail: "Email", loginPassword: "Password", loginFirstName: "Nome", loginLastName: "Cognome",
    loginError: "Email o password errati.", loginSignupError: "Errore durante la registrazione.",
    loginNameRequired: "Nome e cognome richiesti.", loginWelcome: "Benvenuto/a",
    profileTheme: "Tema", themeLight: "Chiaro", themeDark: "Scuro",
    resetPassword: "Reimposta password",
    deleteAccount: "Elimina il mio account", deleteAccountConfirm: "⚠️ Eliminare definitivamente il tuo account e tutti i dati? Questa azione è irreversibile.", deleteAccountConfirm2: "Sei davvero sicuro/a? Tutti i preferiti, amici e impostazioni verranno eliminati.", deleteAccountDone: "Account eliminato.",
  },
  pt: {
    appTagline: "Save & Share places you love. Discover more.",
    tabReco: "✨ Reco", tabFavorites: "❤️ Favoritos", tabAdd: "+ Adicionar", tabFriends: "👥 Amigos", tabPins: "Pins", tabProfile: "Perfil", pinsDesc: "Lugares para experimentar. Serão recomendados se relevantes.", pinsEmpty: "Sem pins. Use 📌 nas recomendações.", pinSaved: "Fixado!", pinAlready: "Já fixado", pinAlreadyFav: "Já nos favoritos", pinToFav: "Visitado", pinNotePrompt: "Adicionar nota (opcional):", pinBtn: "Fixar", pinsRecoSub: "Lugares que quer experimentar", pinNotePlaceholder: "Ex: para as crianças, ideia de encontro...",
    logout: "Sair",
    addPlace: "Nome do lugar", addType: "Tipo", addPrice: "Preço", addPriceManual: "manual", addPriceNeeded: "a indicar",
    priceCheap: "Económico", priceMid: "Intermédio", priceHigh: "Topo de gama",
    addCity: "Cidade", addCountry: "País",
    addRating: "Avaliação geral", addKids: "Adequado para crianças", addLiked: "O que gostei",
    addLikedSelect: "Selecionar", addLikedPrecise: "Adicionar detalhes", addDisliked: "O que não gostei",
    addDislikedSelect: "Selecionar", addDislikedPrecise: "Adicionar detalhes",
    addSave: "Guardar", addUpdate: "Atualizar",
    addCuisine: "Cozinha", addActivityType: "Tipo de atividade", addActivityPlaceholder: "Ex: Museu, Parque, Spa, Espetáculo...",
    filterType: "Tipo", filterPrice: "Preço", filterRating: "Avaliação", filterKids: "👶 Crianças",
    filterFriends: "👥 Amigos", filterAll: "Todos", filterMine: "Os meus lugares", filterFriendsOnly: "Amigos",
    searchPlaces: "Pesquisar por nome, cidade...",
    nbRecosLabel: "Número de resultados (Favoritos & AI)", nbRecos5: "5", nbRecos10: "10", nbRecos20: "20",
    emptyFavorites: "Ainda sem favoritos", emptyFavoritesSub: "Comece por adicionar um lugar",
    emptyResults: "Sem resultados", emptyResultsSub: "Tente outros filtros",
    profileIdentity: "👤 Minha identidade", profileFirstName: "Nome", profileLastName: "Apelido",
    prefCitiesLabel: "🏙️ Cidades preferidas", prefCitiesPlaceholder: "Adicionar uma cidade...", prefCitiesEmpty: "Sem cidades adicionadas", profileLanguage: "🌍 Idioma preferido", profileLanguageLabel: "Idioma da interface e recomendações",
    profileLikes: "✨ O que gosto", profileLikesSelect: "Selecionar", profileLikesPrecise: "Adicionar detalhes",
    profileBudget: "Orçamento habitual", profileBudgetNone: "Não especificado",
    profileDislikes: "🚫 O que evito", profileDislikesSelect: "Selecionar", profileDislikesPrecise: "Adicionar detalhes",
    profileNotes: "📝 Notas livres", profileNotesLabel: "Outras informações", profileSave: "Guardar perfil", profileSaved: "✓ Perfil guardado",
    followRequests: "🔔 Pedidos de seguir", followSearch: "🔍 Pesquisar utilizador", followSearchPlaceholder: "@utilizador...",
    followSearchBtn: "Pesquisar", followingList: "A seguir", followersList: "Seguidores", followNone: "Não segue ninguém.",
    followPending: "⏳ Pendente", followAlready: "A seguir", followSent: "Enviado", followBtn: "Seguir", followBackBtn: "Seguir de volta",
    followAccept: "✓ Aceitar", followDecline: "✕", followView: "Ver ❤️", followHeartTitle: "❤️ Favoritos de",
    followNoHeart: "ainda não tem favoritos.", followHearts: "favoritos",
    followUnfollow: "Deixar de seguir", followPrivate: "Conta privada", followPublic: "Conta pública",
    errorUsernameRequired: "O nome de utilizador é obrigatório.", errorUsernameTaken: "Este utilizador já está em uso.", errorUsernameInvalid: "3-20 caracteres, letras, números, _ ou . apenas.", profilePhoto: "Foto", profileUsername: "Utilizador", profilePrivacy: "Privacidade",
    recoLocation: "📍 Localização & definições", recoRadius: "Raio de pesquisa",
    recoMood: "Mood / desejo", recoMoodPlaceholder: "Ex: terraço, romântico, brunch...", recoMoodDictate: "Ditar o desejo", recoMoodStop: "Parar o ditado", recoMoodListening: "A ouvir...", recoMoodNotSupported: "O ditado por voz não está disponível neste navegador. Experimenta o Chrome, Edge ou Safari móvel.", askOutsyHeadline: "Olá {name}! Diz-me o que procuras e o Outsy vai ajudar-te", askOutsyPlaceholder: "Ex: Procuro um restaurante com esplanada perto de mim, com colegas", askOutsyDictate: "Ditar o pedido", askOutsyAnalyze: "✨ Analisar o meu pedido", askOutsyAnalyzing: "A analisar...", askOutsyClear: "Limpar", recoType: "Tipo", recoPrice: "Preço", recoFind: "✨ Perguntar ao Outsy AI", recoFindNearby: "Lugares populares",
    recoLocating: "A localizar...", recoSearching: "A pesquisar...",
    recoGPS: "📍 A minha posição", recoManual: "✏️ Introduzir", recoGPSLoading: "A obter posição...",
    recoHearts: "❤️ Favoritos", recoHeartsNear: "Os seus favoritos e seguidos",
    recoInCarnet: "Na sua coleção", recoNearby: "🔥 Lugares populares perto", recoNearbySub: "Ordenados por avaliação e distância",
    recoAI: "✨ Outsy AI", recoAISub: "10 recomendações por afinidade",
    recoAddFav: "+ Adicionar aos favoritos", recoMapsLink: "Maps →",
    recoNoHeart: "Sem favoritos nesta área. Adicione lugares com ≥ 4★!",
    duplicateTitle: "📍 Lugar já existe", duplicateText: "já está nos seus favoritos. Atualizar?",
    duplicateCancel: "Cancelar", duplicateEdit: "Editar existente", duplicateUpdate: "Atualizar",
    deleteTitle: "Eliminar", deleteText: "será removido dos seus favoritos.", deleteConfirm: "Eliminar",
    closedTitle: "⚠️ Estabelecimentos fechados", closedText: "Estes estabelecimentos parecem fechados definitivamente. Removê-los dos Favoritos?", closedKeep: "Manter", closedRemove: "Remover", closedToast: "✓ Favoritos removidos",
    friendSaveLabel: "Editar antes de guardar",
    cancel: "Cancelar",
    unsavedTitle: "Alterações não guardadas", unsavedText: "Tens alterações não guardadas. Sair sem guardar?", unsavedStay: "Continuar a editar", unsavedLeave: "Sair", mapFavorites: "Favoritos", mapAIPicks: "Seleção AI", mapClose: "✕ Fechar", mapFullscreen: "⛶ Ecrã inteiro", mapTooltip: "Ver ficha",
    matchLabel: "% afinidade",
    gpsError: "Erro de localização",
    editBtn: "✏️ Editar", hoursOpen: "Aberto", hoursClosed: "Fechado",
    toastAdded: "✓ Adicionado aos favoritos!", toastFriend: "✓ Pedido enviado!", toastFriendAdded: "✓ Amigo adicionado!",
    loading: "A carregar... ✈️", loginConnect: "Entrar", loginCreate: "Criar conta",
    loginEmail: "Email", loginPassword: "Palavra-passe", loginFirstName: "Nome", loginLastName: "Apelido",
    loginError: "Email ou palavra-passe incorretos.", loginSignupError: "Erro ao registar.",
    loginNameRequired: "Nome e apelido obrigatórios.", loginWelcome: "Bem-vindo/a",
    profileTheme: "Tema", themeLight: "Claro", themeDark: "Escuro",
    resetPassword: "Redefinir palavra-passe",
    deleteAccount: "Eliminar a minha conta", deleteAccountConfirm: "⚠️ Eliminar definitivamente a sua conta e todos os dados? Esta ação é irreversível.", deleteAccountConfirm2: "Tem a certeza? Todos os favoritos, amigos e preferências serão eliminados.", deleteAccountDone: "Conta eliminada.",
  },
  nl: {
    appTagline: "Save & Share places you love. Discover more.",
    tabReco: "✨ Reco", tabFavorites: "❤️ Favorieten", tabAdd: "+ Toevoegen", tabFriends: "👥 Vrienden", tabPins: "Pins", tabProfile: "Profiel", pinsDesc: "Plekken om te proberen. Worden aanbevolen indien relevant.", pinsEmpty: "Geen pins. Gebruik 📌 bij aanbevelingen.", pinSaved: "Gepind!", pinAlready: "Al gepind", pinAlreadyFav: "Al in favorieten", pinToFav: "Bezocht", pinNotePrompt: "Notitie toevoegen (optioneel):", pinBtn: "Pinnen", pinsRecoSub: "Plekken die je wilt proberen", pinNotePlaceholder: "Bijv. voor de kinderen, date-idee...",
    logout: "Uitloggen",
    addPlace: "Naam van de plek", addType: "Type", addPrice: "Prijs", addPriceManual: "handmatig", addPriceNeeded: "aan te geven",
    priceCheap: "Goedkoop", priceMid: "Gemiddeld", priceHigh: "Luxe",
    addCity: "Stad", addCountry: "Land",
    addRating: "Algemene beoordeling", addKids: "Kindvriendelijk", addLiked: "Wat ik leuk vond",
    addLikedSelect: "Selecteren", addLikedPrecise: "Details toevoegen", addDisliked: "Wat ik niet leuk vond",
    addDislikedSelect: "Selecteren", addDislikedPrecise: "Details toevoegen",
    addSave: "Opslaan", addUpdate: "Bijwerken",
    addCuisine: "Keuken", addActivityType: "Type activiteit", addActivityPlaceholder: "Bijv. Museum, Park, Spa, Show...",
    filterType: "Type", filterPrice: "Prijs", filterRating: "Beoordeling", filterKids: "👶 Kinderen",
    filterFriends: "👥 Vrienden", filterAll: "Alle", filterMine: "Mijn plekken", filterFriendsOnly: "Vrienden",
    searchPlaces: "Zoeken op naam, stad...",
    nbRecosLabel: "Aantal resultaten (Favorieten & AI)", nbRecos5: "5", nbRecos10: "10", nbRecos20: "20",
    emptyFavorites: "Nog geen favorieten", emptyFavoritesSub: "Begin met een plek toevoegen",
    emptyResults: "Geen resultaten", emptyResultsSub: "Probeer andere filters",
    profileIdentity: "👤 Mijn identiteit", profileFirstName: "Voornaam", profileLastName: "Achternaam",
    prefCitiesLabel: "🏙️ Voorkeurssteden", prefCitiesPlaceholder: "Stad toevoegen...", prefCitiesEmpty: "Geen steden toegevoegd", profileLanguage: "🌍 Voorkeurstaal", profileLanguageLabel: "Taal van de interface en aanbevelingen",
    profileLikes: "✨ Wat ik leuk vind", profileLikesSelect: "Selecteren", profileLikesPrecise: "Details toevoegen",
    profileBudget: "Gebruikelijk budget", profileBudgetNone: "Niet opgegeven",
    profileDislikes: "🚫 Wat ik vermijd", profileDislikesSelect: "Selecteren", profileDislikesPrecise: "Details toevoegen",
    profileNotes: "📝 Vrije notities", profileNotesLabel: "Andere info", profileSave: "Profiel opslaan", profileSaved: "✓ Profiel opgeslagen",
    followRequests: "🔔 Volgverzoeken", followSearch: "🔍 Gebruiker zoeken", followSearchPlaceholder: "@gebruikersnaam...",
    followSearchBtn: "Zoeken", followingList: "Volgend", followersList: "Volgers", followNone: "Je volgt niemand.",
    followPending: "⏳ In behandeling", followAlready: "Volgend", followSent: "Verzonden", followBtn: "Volgen", followBackBtn: "Terugvolgen",
    followAccept: "✓ Accepteren", followDecline: "✕", followView: "Bekijk ❤️", followHeartTitle: "❤️ Favorieten van",
    followNoHeart: "heeft nog geen favorieten.", followHearts: "favorieten",
    followUnfollow: "Ontvolgen", followPrivate: "Privéaccount", followPublic: "Openbaar account",
    errorUsernameRequired: "Gebruikersnaam is verplicht.", errorUsernameTaken: "Deze gebruikersnaam is al in gebruik.", errorUsernameInvalid: "3-20 tekens, letters, cijfers, _ of . toegestaan.", profilePhoto: "Foto", profileUsername: "Gebruikersnaam", profilePrivacy: "Privacy",
    recoLocation: "📍 Locatie & instellingen", recoRadius: "Zoekradius",
    recoMood: "Mood / stemming", recoMoodPlaceholder: "Bijv. dakterras, romantisch, brunch...", recoMoodDictate: "Stemming dicteren", recoMoodStop: "Dicteren stoppen", recoMoodListening: "Aan het luisteren...", recoMoodNotSupported: "Spraakdictee is niet beschikbaar in deze browser. Probeer Chrome, Edge of Safari op mobiel.", askOutsyHeadline: "Hallo {name}! Vertel me wat je zoekt en Outsy helpt je", askOutsyPlaceholder: "Bijv. Ik zoek een dakterras-restaurant in de buurt, met collega's", askOutsyDictate: "Verzoek dicteren", askOutsyAnalyze: "✨ Mijn verzoek analyseren", askOutsyAnalyzing: "Bezig met analyseren...", askOutsyClear: "Wissen", recoType: "Type", recoPrice: "Prijs", recoFind: "✨ Vraag Outsy AI", recoFindNearby: "Populaire plekken",
    recoLocating: "Locatie bepalen...", recoSearching: "Zoeken...",
    recoGPS: "📍 Mijn locatie", recoManual: "✏️ Invoeren", recoGPSLoading: "Locatie ophalen...",
    recoHearts: "❤️ Favorieten", recoHeartsNear: "Jouw favorieten & gevolgd",
    recoInCarnet: "In jouw collectie", recoNearby: "🔥 Populaire plekken in de buurt", recoNearbySub: "Gesorteerd op beoordeling en afstand",
    recoAI: "✨ Outsy AI", recoAISub: "10 aanbevelingen op basis van overeenkomst",
    recoAddFav: "+ Toevoegen aan favorieten", recoMapsLink: "Maps →",
    recoNoHeart: "Geen favorieten in dit gebied. Voeg plekken toe met ≥ 4★!",
    duplicateTitle: "📍 Plek bestaat al", duplicateText: "staat al in je favorieten. Bijwerken?",
    duplicateCancel: "Annuleren", duplicateEdit: "Bestaande bewerken", duplicateUpdate: "Bijwerken",
    deleteTitle: "Verwijderen", deleteText: "wordt verwijderd uit je favorieten.", deleteConfirm: "Verwijderen",
    closedTitle: "⚠️ Gesloten plekken", closedText: "Deze plekken lijken permanent gesloten. Verwijderen uit Favorieten?", closedKeep: "Bewaren", closedRemove: "Verwijderen", closedToast: "✓ Favorieten verwijderd",
    friendSaveLabel: "Bewerken voor opslaan",
    cancel: "Annuleren",
    unsavedTitle: "Niet-opgeslagen wijzigingen", unsavedText: "Je hebt niet-opgeslagen wijzigingen. Verlaten zonder opslaan?", unsavedStay: "Blijven bewerken", unsavedLeave: "Verlaten", mapFavorites: "Favorieten", mapAIPicks: "AI-keuze", mapClose: "✕ Sluiten", mapFullscreen: "⛶ Volledig scherm", mapTooltip: "Bekijk kaart",
    matchLabel: "% overeenkomst",
    gpsError: "Locatiefout",
    editBtn: "✏️ Bewerken", hoursOpen: "Open", hoursClosed: "Gesloten",
    toastAdded: "✓ Toegevoegd aan favorieten!", toastFriend: "✓ Verzoek verzonden!", toastFriendAdded: "✓ Vriend toegevoegd!",
    loading: "Laden... ✈️", loginConnect: "Inloggen", loginCreate: "Account aanmaken",
    loginEmail: "E-mail", loginPassword: "Wachtwoord", loginFirstName: "Voornaam", loginLastName: "Achternaam",
    loginError: "Onjuist e-mailadres of wachtwoord.", loginSignupError: "Fout bij registratie.",
    loginNameRequired: "Voor- en achternaam vereist.", loginWelcome: "Welkom",
    profileTheme: "Thema", themeLight: "Licht", themeDark: "Donker",
    resetPassword: "Wachtwoord herstellen",
    deleteAccount: "Mijn account verwijderen", deleteAccountConfirm: "⚠️ Account en alle gegevens definitief verwijderen? Dit kan niet ongedaan worden.", deleteAccountConfirm2: "Weet je het zeker? Alle favorieten, vrienden en voorkeuren worden verwijderd.", deleteAccountDone: "Account verwijderd.",
  },
  en: {
    appTagline: "Save & Share places you love. Discover more.",
    tabReco: "✨ Reco", tabFavorites: "❤️ Favorites", tabAdd: "+ Add", tabFriends: "👥 Friends", tabPins: "Pins", tabProfile: "Profile", pinsDesc: "Places to try. They'll be recommended when relevant.", pinsEmpty: "No pins yet. Use 📌 on recommendations.", pinSaved: "Pinned!", pinAlready: "Already pinned", pinAlreadyFav: "Already in favorites", pinToFav: "Visited", pinNotePrompt: "Add a note (optional):", pinBtn: "Pin", pinsRecoSub: "Places you want to try", pinNotePlaceholder: "E.g. for the kids, date night idea...",
    logout: "Sign out",
    addPlace: "Place name", addType: "Type", addPrice: "Price", addPriceManual: "manual", addPriceNeeded: "to specify",
    priceCheap: "Budget", priceMid: "Mid-range", priceHigh: "High-end",
    addCity: "City", addCountry: "Country",
    addRating: "Overall rating", addKids: "👶 Kids friendly", addLiked: "What I liked",
    addLikedSelect: "Select", addLikedPrecise: "Add details", addDisliked: "What I didn't like",
    addDislikedSelect: "Select", addDislikedPrecise: "Add details",
    addSave: "Save", addUpdate: "Update",
    addCuisine: "Cuisine", addActivityType: "Activity type", addActivityPlaceholder: "E.g. Museum, Park, Spa, Show...",
    filterType: "Type", filterPrice: "Price", filterRating: "Rating", filterKids: "👶 Kids friendly",
    filterFriends: "👥 Friends", filterAll: "All", filterMine: "My places", filterFriendsOnly: "Friends",
    searchPlaces: "Search by name, city...",
    nbRecosLabel: "Results limit (Favorites & AI)", nbRecos5: "5", nbRecos10: "10", nbRecos20: "20",
    emptyFavorites: "No favorites yet", emptyFavoritesSub: "Start by adding a place",
    emptyResults: "No results", emptyResultsSub: "Try different filters",
    profileIdentity: "👤 My identity", profileFirstName: "First name", profileLastName: "Last name",
    prefCitiesLabel: "🏙️ Preferred cities", prefCitiesPlaceholder: "Add a city...", prefCitiesEmpty: "No cities added yet", profileLanguage: "🌍 Preferred language", profileLanguageLabel: "Interface and recommendations language",
    profileLikes: "✨ What I like", profileLikesSelect: "Select", profileLikesPrecise: "Add details",
    profileBudget: "Usual budget", profileBudgetNone: "Not specified",
    profileDislikes: "🚫 What I avoid", profileDislikesSelect: "Select", profileDislikesPrecise: "Add details",
    profileNotes: "📝 Free notes", profileNotesLabel: "Other info", profileSave: "Save my profile", profileSaved: "✓ Profile saved",
    followRequests: "🔔 Follow requests", followSearch: "🔍 Search users", followSearchPlaceholder: "@username...",
    followSearchBtn: "Search", followingList: "Following", followersList: "Followers", followNone: "You're not following anyone.",
    followPending: "⏳ Pending", followAlready: "Following", followSent: "Requested", followBtn: "Follow", followBackBtn: "Follow back",
    followAccept: "✓ Accept", followDecline: "✕", followView: "View ❤️", followHeartTitle: "❤️ Favorites from",
    followNoHeart: "has no favorites yet.", followHearts: "favorites",
    followUnfollow: "Unfollow", followPrivate: "Private account", followPublic: "Public account",
    errorUsernameRequired: "Username is required.", errorUsernameTaken: "This username is already taken.", errorUsernameInvalid: "3-20 characters, letters, numbers, _ or . only.", profilePhoto: "Photo", profileUsername: "Username", profilePrivacy: "Privacy",
    recoLocation: "📍 Location & settings", recoRadius: "Search radius",
    recoMood: "Mood / vibe", recoMoodPlaceholder: "E.g. rooftop, romantic, brunch...", recoMoodDictate: "Dictate your vibe", recoMoodStop: "Stop dictation", recoMoodListening: "Listening...", recoMoodNotSupported: "Voice dictation is not available in this browser. Try Chrome, Edge or Safari on mobile.", askOutsyHeadline: "Hi {name}! Tell me what you're looking for and Outsy will help", askOutsyPlaceholder: "E.g. I'm looking for a rooftop restaurant near me, with colleagues", askOutsyDictate: "Dictate your request", askOutsyAnalyze: "✨ Analyze my request", askOutsyAnalyzing: "Analyzing...", askOutsyClear: "Clear", recoType: "Type", recoPrice: "Price", recoFind: "✨ Ask Outsy AI", recoFindNearby: "Popular places",
    recoLocating: "Locating...", recoSearching: "Searching...",
    recoGPS: "📍 My location", recoManual: "✏️ Enter", recoGPSLoading: "Getting your location...",
    recoHearts: "❤️ Favorites", recoHeartsNear: "Your favorites & following",
    recoInCarnet: "In your collection", recoNearby: "🔥 Popular nearby places", recoNearbySub: "Sorted by rating and distance",
    recoAI: "✨ Outsy AI", recoAISub: "10 recommendations ranked by match",
    recoAddFav: "+ Add to my favorites", recoMapsLink: "Maps →",
    recoNoHeart: "No favorites in this area. Add places with rating ≥ 4★!",
    duplicateTitle: "📍 Place already exists", duplicateText: "is already in your favorites. Update it?",
    duplicateCancel: "Cancel", duplicateEdit: "Edit existing", duplicateUpdate: "Update",
    deleteTitle: "Delete", deleteText: "will be removed from your favorites.", deleteConfirm: "Delete",
    closedTitle: "⚠️ Closed places", closedText: "These places appear to be permanently closed. Remove them from your Favorites?", closedKeep: "Keep", closedRemove: "Remove", closedToast: "✓ Favorites removed",
    friendSaveLabel: "Edit before saving",
    cancel: "Cancel",
    unsavedTitle: "Unsaved changes", unsavedText: "You have unsaved changes. Leave without saving?", unsavedStay: "Keep editing", unsavedLeave: "Leave", mapFavorites: "Favorites", mapAIPicks: "AI picks", mapClose: "✕ Close", mapFullscreen: "⛶ Fullscreen", mapTooltip: "View details",
    matchLabel: "% match",
    gpsError: "Location error",
    editBtn: "✏️ Edit", hoursOpen: "Open", hoursClosed: "Closed",
    editTitle: "✏️ Edit", toastSaved: "✓ Place saved!", toastUpdated: "✓ Favorite updated!",
    toastAdded: "✓ Added to favorites!", toastFriend: "✓ Request sent!", toastFriendAdded: "✓ Friend added!",
    loading: "Loading... ✈️", loginConnect: "Sign in", loginCreate: "Create account",
    loginEmail: "Email", loginPassword: "Password", loginFirstName: "First name", loginLastName: "Last name",
    loginError: "Incorrect email or password.", loginSignupError: "Error during registration.",
    loginNameRequired: "First and last name required.", loginWelcome: "Welcome",
    profileTheme: "Theme", themeLight: "Light", themeDark: "Dark",
    resetPassword: "Reset password",
    deleteAccount: "Delete my account", deleteAccountConfirm: "⚠️ Permanently delete your account and all data? This action cannot be undone.", deleteAccountConfirm2: "Are you really sure? All your favorites, friends and preferences will be deleted.", deleteAccountDone: "Account deleted.",
  },
};

function useT(language) {
  const base = TRANSLATIONS[language] || TRANSLATIONS["en"];
  const tour = ONBOARD_TOUR[language] || ONBOARD_TOUR["en"];
  return {...base, ...tour};
}



const THEMES = {
  dark:  { bg:"#0f0e0c", card:"#1a1814", border:"#2e2b25", accent:"#c9a84c", accentLight:"#e8c97a", text:"#f0ead8", muted:"#8a8070", tag:"#252219", dislike:"#8b3a3a", dislikeBg:"#3a1a1a", mapScheme:"DARK" },
  light: { bg:"#f9f7f4", card:"#ffffff", border:"#e5dfd5", accent:"#b8922a", accentLight:"#c9a84c", text:"#1a1410", muted:"#6a5a40", tag:"#f5f0e8", dislike:"#8b3a3a", dislikeBg:"#fce8e8", mapScheme:"LIGHT" },
};
const COLORS = THEMES.dark; // placeholder - overridden in TravelAgent

const getCSS = (COLORS) => `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=DM+Sans:wght@300;400;500&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: ${COLORS.bg}; color: ${COLORS.text}; font-family: 'DM Sans', sans-serif; min-height: 100vh; transition: background 0.3s, color 0.3s; }
  .app { max-width: 480px; margin: 0 auto; min-height: 100vh; display: flex; flex-direction: column; }
  .header { padding: 20px 24px 10px; border-bottom: 1px solid ${COLORS.border}; position: sticky; top: 0; background: ${COLORS.bg}; z-index: 10; }
  .header-top { display: flex; justify-content: space-between; align-items: center; }
  .header-logo { font-family: 'Cormorant Garamond', serif; font-size: 22px; font-weight: 300; letter-spacing: 0.05em; }
  .header-logo span { color: ${COLORS.accent}; font-style: italic; }
  .header-user { font-size: 11px; color: ${COLORS.muted}; letter-spacing: 0.08em; text-transform: uppercase; }
  .logout-btn { background: none; border: 1px solid ${COLORS.border}; color: ${COLORS.muted}; border-radius: 6px; padding: 5px 10px; font-size: 11px; cursor: pointer; font-family: 'DM Sans', sans-serif; transition: all 0.2s; }
  .logout-btn:hover { border-color: #e06060; color: #e06060; }
  .header-middle { display: flex; justify-content: space-between; align-items: center; margin-top: 4px; margin-bottom: 10px; }
  .tabs { display: flex; background: ${COLORS.card}; border-radius: 8px; padding: 3px; border: 1px solid ${COLORS.border}; }
  .tab { flex: 1; padding: 6px 2px; font-size: 9px; font-family: 'DM Sans', sans-serif; letter-spacing: 0.05em; text-transform: uppercase; background: none; border: none; color: ${COLORS.muted}; cursor: pointer; border-radius: 6px; transition: all 0.2s; font-weight: 500; }
  .tab.active { background: ${COLORS.accent}; color: ${COLORS.bg}; }
  .reco-subnav { display: flex; gap: 4px; justify-content: center; padding: 6px 0 2px; }
  .reco-subnav button { font-size: 9px; padding: 3px 8px; border-radius: 6px; border: 1px solid ${COLORS.border}; background: ${COLORS.card}; color: ${COLORS.muted}; cursor: pointer; font-family: 'DM Sans', sans-serif; font-weight: 600; letter-spacing: 0.05em; }
  .content { flex: 1; padding: 20px 24px; }
  .form-section { display: flex; flex-direction: column; gap: 14px; }
  .field { display: flex; flex-direction: column; gap: 6px; position: relative; }
  .field label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.15em; color: ${COLORS.muted}; font-weight: 500; }
  .field input, .field textarea, .field select { background: ${COLORS.card}; border: 1px solid ${COLORS.border}; border-radius: 8px; color: ${COLORS.text}; font-family: 'DM Sans', sans-serif; font-size: 16px; padding: 11px 14px; outline: none; transition: border-color 0.2s; width: 100%; }
  .field input:focus, .field textarea:focus { border-color: ${COLORS.accent}; }
  .field textarea { resize: none; min-height: 60px; line-height: 1.5; }
  .field select { cursor: pointer; appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%238a8070' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 14px center; padding-right: 36px; }
  .tags-row { display: flex; flex-wrap: wrap; gap: 6px; }
  .tag-pill { padding: 5px 10px; border-radius: 20px; font-size: 11px; cursor: pointer; transition: all 0.2s; font-family: 'DM Sans', sans-serif; border: 1px solid ${COLORS.border}; background: ${COLORS.tag}; color: ${COLORS.muted}; }
  .tag-pill.selected-like { background: ${COLORS.accent}22; border-color: ${COLORS.accent}; color: ${COLORS.accent}; }
  .tag-pill.selected-dislike { background: ${COLORS.dislikeBg}; border-color: ${COLORS.dislike}66; color: #d4869b; }
  .autocomplete-wrapper { position: relative; }
  .autocomplete-dropdown { position: absolute; top: 100%; left: 0; right: 0; z-index: 50; background: ${COLORS.card}; border: 1px solid ${COLORS.accent}44; border-radius: 8px; margin-top: 4px; overflow: hidden; box-shadow: 0 8px 24px rgba(0,0,0,0.4); }
  .autocomplete-item { padding: 11px 14px; cursor: pointer; transition: background 0.15s; border-bottom: 1px solid ${COLORS.border}; }
  .autocomplete-item:last-child { border-bottom: none; }
  .autocomplete-item:hover { background: ${COLORS.accent}18; }
  .autocomplete-main { font-size: 14px; color: ${COLORS.text}; }
  .autocomplete-sub { font-size: 11px; color: ${COLORS.muted}; margin-top: 2px; }
  .autocomplete-loading { padding: 11px 14px; font-size: 12px; color: ${COLORS.muted}; text-align: center; }
  .place-badge { font-size: 11px; color: ${COLORS.accent}; margin-top: 4px; }
  .price-selector { display: flex; gap: 8px; }
  .price-btn { flex: 1; padding: 8px 4px; background: ${COLORS.card}; border: 1px solid ${COLORS.border}; border-radius: 8px; color: ${COLORS.muted}; font-size: 13px; cursor: pointer; transition: all 0.2s; font-family: 'DM Sans', sans-serif; font-weight: 600; text-align: center; white-space: nowrap; line-height: 1.2; }
  .price-btn.selected { background: ${COLORS.accent}22; border-color: ${COLORS.accent}; color: ${COLORS.accent}; }
  .star-row { display: flex; gap: 8px; align-items: center; }
  .star { font-size: 24px; cursor: pointer; transition: all 0.15s; color: ${COLORS.border}; user-select: none; }
  .star.active { color: #c9a84c; transform: scale(1.1); }
  .star:hover { color: #e8c97a; }
  .row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .section-divider { display: flex; align-items: center; gap: 10px; margin: 2px 0; }
  .section-divider span { font-size: 10px; text-transform: uppercase; letter-spacing: 0.12em; color: ${COLORS.muted}; white-space: nowrap; }
  .section-divider::before, .section-divider::after { content: ''; flex: 1; height: 1px; background: ${COLORS.border}; }
  .kids-toggle { display: flex; align-items: center; gap: 10px; padding: 10px 14px; background: ${COLORS.card}; border: 1px solid ${COLORS.border}; border-radius: 8px; cursor: pointer; transition: border-color 0.2s; }
  .kids-toggle.on { border-color: ${COLORS.accent}; background: ${COLORS.accent}08; }
  .kids-toggle-label { font-size: 13px; color: ${COLORS.muted}; flex: 1; }
  .kids-toggle.on .kids-toggle-label { color: ${COLORS.text}; }
  .toggle-switch { width: 36px; height: 20px; background: ${COLORS.border}; border-radius: 20px; position: relative; transition: background 0.2s; }
  .kids-toggle.on .toggle-switch { background: ${COLORS.accent}; }
  .toggle-knob { position: absolute; top: 3px; left: 3px; width: 14px; height: 14px; background: white; border-radius: 50%; transition: transform 0.2s; }
  .kids-toggle.on .toggle-knob { transform: translateX(16px); }
  .save-btn { background: ${COLORS.accent}; color: ${COLORS.bg}; border: none; border-radius: 10px; padding: 14px; font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; cursor: pointer; margin-top: 4px; transition: all 0.2s; }
  .save-btn:hover { background: ${COLORS.accentLight}; }
  .save-btn:disabled { opacity: 0.5; cursor: not-allowed; }
  .filters-row { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 8px; align-items: center; }
  .filter-label { font-size: 10px; color: ${COLORS.muted}; text-transform: uppercase; letter-spacing: 0.1em; white-space: nowrap; }
  .filter-btn { padding: 5px 10px; border-radius: 20px; font-size: 11px; cursor: pointer; transition: all 0.2s; font-family: 'DM Sans', sans-serif; border: 1px solid ${COLORS.border}; background: ${COLORS.tag}; color: ${COLORS.muted}; }
  .filter-btn.active { background: ${COLORS.accent}22; border-color: ${COLORS.accent}; color: ${COLORS.accent}; }
  .memory-list { display: flex; flex-direction: column; gap: 12px; }
  .memory-card { background: ${COLORS.card}; border: 1px solid ${COLORS.border}; border-radius: 12px; padding: 16px; transition: border-color 0.2s; }
  .memory-card.friend-card { border-color: ${COLORS.accent}22; }
  .memory-card.friend-memory-card { border-color: ${COLORS.accent}22; }
  .memory-card:hover { border-color: ${COLORS.accent}44; }
  .memory-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 8px; margin-bottom: 6px; }
  .memory-name { font-family: 'Cormorant Garamond', serif; font-size: 19px; font-weight: 400; line-height: 1.2; }
  .memory-meta { display: flex; gap: 4px; align-items: center; flex-shrink: 0; justify-content: flex-end; }
  .badge { font-size: 10px; padding: 3px 7px; border-radius: 20px; background: ${COLORS.tag}; color: ${COLORS.muted}; letter-spacing: 0.06em; text-transform: uppercase; }
  .badge.price { color: ${COLORS.accent}; background: ${COLORS.accent}18; }
  .badge.stars { color: ${COLORS.accent}; background: ${COLORS.accent}18; font-size: 11px; }
  .badge.kids { color: ${COLORS.accent}; background: ${COLORS.accent}18; }
  .badge.friend { color: ${COLORS.accent}; background: ${COLORS.accent}12; font-style: italic; }
  .memory-location { font-size: 12px; color: ${COLORS.muted}; margin-bottom: 6px; }
  .memory-tags { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 5px; }
  .memory-tag { font-size: 10px; padding: 2px 8px; border-radius: 20px; background: ${COLORS.accent}12; color: ${COLORS.accent}; }
  .memory-tag.bad { background: ${COLORS.dislikeBg}; color: #d4869b; }
  .memory-why { font-size: 12px; color: #b8ad98; line-height: 1.5; font-style: italic; margin-top: 4px; }
  .memory-dislike { font-size: 12px; color: #d4869b; line-height: 1.4; margin-top: 4px; font-style: italic; }
  .memory-footer { display: flex; justify-content: space-between; align-items: center; margin-top: 10px; }
  .memory-date { font-size: 10px; color: ${COLORS.muted}; }
  .memory-actions { display: flex; gap: 4px; }
  .edit-btn { background: none; border: 1px solid ${COLORS.border}; color: ${COLORS.muted}; cursor: pointer; font-size: 11px; padding: 3px 8px; border-radius: 4px; transition: all 0.2s; font-family: 'DM Sans', sans-serif; }
  .edit-btn:hover { border-color: ${COLORS.accent}; color: ${COLORS.accent}; }
  .del-btn { background: none; border: none; color: ${COLORS.muted}; cursor: pointer; font-size: 13px; padding: 2px 6px; border-radius: 4px; transition: color 0.2s; }
  .del-btn:hover { color: #e06060; }
  .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.75); z-index: 100; display: flex; align-items: center; justify-content: center; padding: 20px; }
  .modal { background: ${COLORS.bg}; border: 1px solid ${COLORS.border}; border-radius: 16px; padding: 24px; width: 100%; max-width: 440px; max-height: 90vh; overflow-y: auto; display: flex; flex-direction: column; gap: 14px; }
  .modal-title { font-family: 'Cormorant Garamond', serif; font-size: 20px; font-style: italic; color: ${COLORS.accent}; }
  .modal-btn { flex: 1; padding: 12px; border-radius: 8px; font-family: 'DM Sans', sans-serif; font-size: 12px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; cursor: pointer; transition: all 0.2s; }
  .modal-btn.primary { background: ${COLORS.accent}; color: ${COLORS.bg}; border: none; }
  .modal-btn.primary:hover { background: ${COLORS.accentLight}; }
  .modal-btn.secondary { background: none; border: 1px solid ${COLORS.border}; color: ${COLORS.muted}; }
  .modal-btn.secondary:hover { border-color: ${COLORS.accent}; color: ${COLORS.accent}; }
  .alert-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.75); z-index: 200; display: flex; align-items: center; justify-content: center; padding: 20px; }
  .alert-box { background: ${COLORS.bg}; border: 1px solid ${COLORS.accent}44; border-radius: 16px; padding: 24px; width: 100%; max-width: 360px; display: flex; flex-direction: column; gap: 14px; }
  .alert-title { font-family: 'Cormorant Garamond', serif; font-size: 20px; color: ${COLORS.accent}; }
  .alert-text { font-size: 13px; color: ${COLORS.muted}; line-height: 1.5; }
  .alert-actions { display: flex; gap: 8px; }
  .prefs-section { display: flex; flex-direction: column; gap: 16px; }
  .prefs-card { background: ${COLORS.card}; border: 1px solid ${COLORS.border}; border-radius: 12px; padding: 18px; display: flex; flex-direction: column; gap: 12px; }
  .prefs-card-title { font-family: 'Cormorant Garamond', serif; font-size: 17px; font-style: italic; color: ${COLORS.accent}; }
  .prefs-card-title.bad { color: #d4869b; }
  .prefs-save-btn { background: none; border: 1px solid ${COLORS.accent}; color: ${COLORS.accent}; border-radius: 8px; padding: 11px; font-family: 'DM Sans', sans-serif; font-size: 12px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; cursor: pointer; transition: all 0.2s; }
  .prefs-save-btn:hover { background: ${COLORS.accent}22; }
  .prefs-saved { font-size: 11px; color: ${COLORS.accent}; text-align: center; }
  .friends-section { display: flex; flex-direction: column; gap: 16px; }
  .friend-search-row { display: flex; gap: 8px; }
  .friend-search-input { flex: 1; background: ${COLORS.card}; border: 1px solid ${COLORS.border}; border-radius: 8px; color: ${COLORS.text}; font-family: 'DM Sans', sans-serif; font-size: 14px; padding: 11px 14px; outline: none; }
  .friend-search-btn { padding: 11px 16px; background: ${COLORS.accent}; border: none; border-radius: 8px; color: ${COLORS.bg}; font-family: 'DM Sans', sans-serif; font-size: 12px; font-weight: 600; cursor: pointer; }
  .friend-card { background: ${COLORS.card}; border: 1px solid ${COLORS.border}; border-radius: 10px; padding: 14px 16px; display: flex; align-items: center; justify-content: space-between; gap: 12px; }
  .friend-info { display: flex; flex-direction: column; gap: 2px; }
  .friend-name { font-size: 14px; color: ${COLORS.text}; font-weight: 500; }
  .friend-email { font-size: 11px; color: ${COLORS.muted}; }
  .friend-action-btn { padding: 6px 12px; border-radius: 6px; font-family: 'DM Sans', sans-serif; font-size: 11px; font-weight: 600; cursor: pointer; transition: all 0.2s; border: none; }
  .friend-action-btn.add { background: ${COLORS.accent}; color: ${COLORS.bg}; }
  .friend-action-btn.accept { background: #2a4a2e; color: #7abf8a; }
  .friend-action-btn.decline { background: ${COLORS.dislikeBg}; color: #d4869b; margin-left: 4px; }
  .friend-action-btn.pending { background: ${COLORS.tag}; color: ${COLORS.muted}; cursor: default; }
  .friend-action-btn.view { background: none; border: 1px solid ${COLORS.accent}44; color: ${COLORS.accent}; }
  .friends-title { font-family: 'Cormorant Garamond', serif; font-size: 17px; font-style: italic; color: ${COLORS.accent}; }
  .empty-friends { text-align: center; padding: 30px; color: ${COLORS.muted}; font-size: 13px; }

  /* Friend memories panel */
  .friend-panel { background: ${COLORS.card}; border: 1px solid ${COLORS.accent}33; border-radius: 12px; padding: 16px; display: flex; flex-direction: column; gap: 12px; }
  .friend-panel-header { display: flex; justify-content: space-between; align-items: center; }
  .friend-panel-title { font-family: 'Cormorant Garamond', serif; font-size: 17px; color: ${COLORS.accent}; font-style: italic; }
  .friend-panel-close { background: none; border: none; color: ${COLORS.muted}; cursor: pointer; font-size: 16px; }

  /* RECO */
  .reco-section { display: flex; flex-direction: column; gap: 12px; margin-top: -8px; }
  .reco-location-card { background: ${COLORS.card}; border: 1px solid ${COLORS.accent}44; border-radius: 12px; padding: 16px; display: flex; flex-direction: column; gap: 12px; }
  .reco-location-title { font-family: 'Cormorant Garamond', serif; font-size: 16px; font-style: italic; color: ${COLORS.accent}; }
  .reco-block { display: flex; flex-direction: column; gap: 14px; position: relative; }
  .reco-block-title {
    font-family: 'Cormorant Garamond', serif; font-size: 20px; font-style: italic;
    color: ${COLORS.accent};
    padding: 10px 24px 8px; margin: 0 -24px;
    position: sticky; top: 138px; z-index: 5;
    background: ${COLORS.bg};
    border-bottom: 1px solid ${COLORS.border};
  }
  .reco-block.section-hearts .reco-block-title { color: #d4869b; border-bottom-color: #d4869b33; }
  .reco-block.section-nearby .reco-block-title { color: #7a9d7a; border-bottom-color: #7a9d7a33; }
  .reco-block.section-hearts .memory-card { border-color: #d4869b55; }
  .reco-block.section-ai .ai-reco-card { border-color: ${COLORS.accent}55; }
  .reco-block.section-nearby .ai-reco-card { border-color: #7a9d7a55; }
  .reco-block.section-pins .reco-block-title { color: #6b8cce; border-bottom-color: #6b8cce33; }
  .reco-block.section-pins .memory-card { border-color: #6b8cce55; }
  #reco-settings, #reco-hearts, #reco-pins, #reco-ai, #reco-popular { scroll-margin-top: 142px; }
  .reco-block-title span { font-size: 12px; font-style: normal; color: ${COLORS.muted}; font-family: 'DM Sans', sans-serif; margin-left: 8px; }
  .location-row { display: flex; gap: 8px; }
  .loc-btn { padding: 10px 14px; background: ${COLORS.bg}; border: 1px solid ${COLORS.border}; border-radius: 8px; color: ${COLORS.muted}; font-size: 12px; cursor: pointer; transition: all 0.2s; white-space: nowrap; font-family: 'DM Sans', sans-serif; }
  .loc-btn.active { border-color: ${COLORS.accent}; color: ${COLORS.accent}; }
  .reco-type-btn { padding: 7px 11px; background: ${COLORS.card}; border: 1px solid ${COLORS.border}; border-radius: 20px; color: ${COLORS.muted}; font-size: 12px; cursor: pointer; transition: all 0.2s; font-family: 'DM Sans', sans-serif; }
  .reco-type-btn.active { background: ${COLORS.accent}22; border-color: ${COLORS.accent}; color: ${COLORS.accent}; }
  .reco-btn { background: ${COLORS.card}; border: 1px solid ${COLORS.accent}; color: ${COLORS.accent}; border-radius: 10px; padding: 13px; font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; cursor: pointer; transition: all 0.2s; }
  .reco-btn:hover { background: ${COLORS.accent}22; }
  .reco-btn:disabled { opacity: 0.4; cursor: not-allowed; }

  /* Slider */
  .distance-slider-wrap { display: flex; flex-direction: column; gap: 8px; }
  .distance-slider-labels { display: flex; justify-content: space-between; }
  .distance-slider-label { font-size: 10px; color: ${COLORS.muted}; }
  .distance-slider-value { font-size: 13px; color: ${COLORS.accent}; font-weight: 600; text-align: center; }
  input[type=range] { -webkit-appearance: none; width: 100%; height: 4px; border-radius: 4px; background: ${COLORS.border}; outline: none; }
  input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; width: 20px; height: 20px; border-radius: 50%; background: ${COLORS.accent}; cursor: pointer; border: 2px solid ${COLORS.bg}; }
  input[type=range]::-moz-range-thumb { width: 20px; height: 20px; border-radius: 50%; background: ${COLORS.accent}; cursor: pointer; border: 2px solid ${COLORS.bg}; }

  /* AI Reco */
  .ai-reco-list { display: flex; flex-direction: column; gap: 16px; }
  .ai-reco-card { background: ${COLORS.card}; border: 1px solid ${COLORS.accent}33; border-radius: 12px; overflow: hidden; }
  .ai-reco-header { padding: 16px; display: flex; flex-direction: column; gap: 8px; }
  .ai-reco-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 8px; }
  .ai-reco-name { font-family: 'Cormorant Garamond', serif; font-size: 20px; font-weight: 400; color: ${COLORS.text}; }
  .ai-reco-rank { font-size: 28px; font-family: 'Cormorant Garamond', serif; color: ${COLORS.accent}; font-style: italic; font-weight: 500; }
  .ai-reco-meta { display: flex; gap: 6px; flex-wrap: wrap; }
  .ai-reco-address { font-size: 12px; color: ${COLORS.muted}; }
  .ai-reco-why { font-size: 13px; color: #b8ad98; line-height: 1.5; font-style: italic; }
  .ai-reco-tip { font-size: 12px; color: ${COLORS.accent}; line-height: 1.4; }
  .ai-reco-warning { font-size: 12px; color: #d4869b; line-height: 1.4; }
  .global-map-container { height: 240px; width: 100%; border-radius: 12px; overflow: hidden; border: 1px solid ${COLORS.border}; position: relative; }
  .thinking { display: flex; gap: 5px; justify-content: center; padding: 20px; }
  .dot { width: 7px; height: 7px; border-radius: 50%; background: ${COLORS.accent}; animation: bounce 1.2s infinite; }
  .dot:nth-child(2) { animation-delay: 0.2s; }
  .dot:nth-child(3) { animation-delay: 0.4s; }
  @keyframes bounce { 0%,80%,100%{opacity:.3;transform:scale(.8)}40%{opacity:1;transform:scale(1)} }
  .success-toast { position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%); background: ${COLORS.accent}; color: ${COLORS.bg}; color: #0f0e0c; padding: 10px 20px; border-radius: 20px; font-size: 13px; font-weight: 600; z-index: 300; animation: fadeInUp 0.3s ease, fadeOut 0.3s ease 1.7s forwards; }
  @keyframes fadeInUp { from{opacity:0;transform:translateX(-50%) translateY(10px)}to{opacity:1;transform:translateX(-50%) translateY(0)} }
  @keyframes fadeOut { to{opacity:0} }
  @keyframes moodPulse { 0%,100%{box-shadow:0 0 0 0 rgba(231,76,60,0.55)} 50%{box-shadow:0 0 0 8px rgba(231,76,60,0)} }
  .count-badge { display: inline-flex; align-items: center; justify-content: center; width: 17px; height: 17px; background: ${COLORS.accent}; color: #0f0e0c; border-radius: 50%; font-size: 10px; font-weight: 700; margin-left: 4px; }
  .notif-badge { display: inline-flex; align-items: center; justify-content: center; width: 17px; height: 17px; background: #e06060; color: white; border-radius: 50%; font-size: 10px; font-weight: 700; margin-left: 4px; }
  .empty { text-align: center; padding: 60px 20px; color: ${COLORS.muted}; }
  .empty-icon { font-size: 40px; margin-bottom: 12px; }
  .empty-text { font-family: 'Cormorant Garamond', serif; font-size: 18px; font-style: italic; }
  .empty-sub { font-size: 12px; margin-top: 6px; }
  .inline-input { background: ${COLORS.bg}; border: 1px solid ${COLORS.border}; border-radius: 8px; color: ${COLORS.text}; font-family: 'DM Sans', sans-serif; font-size: 16px; padding: 10px 14px; outline: none; width: 100%; margin-top: 0; transition: border-color 0.2s; }
  .inline-input:focus { border-color: ${COLORS.accent}; }
  .loading-overlay { text-align: center; padding: 40px 20px; color: ${COLORS.muted}; font-size: 13px; }
  .add-to-carnet-btn { display: flex; align-items: center; gap: 5px; background: none; border: 1px solid ${COLORS.accent}44; color: ${COLORS.accent}; border-radius: 6px; padding: 5px 12px; font-size: 11px; cursor: pointer; font-family: 'DM Sans', sans-serif; transition: all 0.2s; }
  .add-to-carnet-btn:hover { background: ${COLORS.accent}18; border-color: ${COLORS.accent}; }
  .nearby-card { background: ${COLORS.card}; border: 1px solid ${COLORS.border}; border-radius: 10px; padding: 14px; display: flex; flex-direction: column; gap: 6px; }
  .nearby-name { font-family: 'Cormorant Garamond', serif; font-size: 17px; }
  .nearby-meta { display: flex; gap: 6px; flex-wrap: wrap; }
  .nearby-address { font-size: 11px; color: ${COLORS.muted}; }
  .maps-link { font-size: 11px; color: ${COLORS.accent}; text-decoration: none; }
`;

function formatDate(ts) { return new Date(ts).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" }); }
function starsGoogle(r){if(!r)return null;const f=Math.floor(r),h=r-f>=0.3&&r-f<0.8,e=5-f-(h?1:0);return String.fromCharCode(9733).repeat(f)+(h?'½':'')+String.fromCharCode(9734).repeat(e)+' '+r.toFixed(1);}
function StarRating({ rating, size=13, emptyColor="#3a3520" }) {
  if (!rating) return null;
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    const fill = Math.min(1, Math.max(0, rating - (i-1)));
    const pct = Math.round(fill * 100);
    stars.push(
      <svg key={i} width={size} height={size} viewBox="0 0 20 20" style={{display:"inline-block",verticalAlign:"middle"}}>
        <defs>
          <linearGradient id={"sg"+i+Math.round(rating*10)}>
            <stop offset={pct+"%"} stopColor="#c9a84c"/>
            <stop offset={pct+"%"} stopColor={emptyColor}/>
          </linearGradient>
        </defs>
        <polygon points="10,1 12.9,7 19.5,7.6 14.5,12 16.2,18.5 10,15 3.8,18.5 5.5,12 0.5,7.6 7.1,7"
          fill={"url(#sg"+i+Math.round(rating*10)+")"}/>
      </svg>
    );
  }
  return <span style={{display:"inline-flex",alignItems:"center",gap:1}}>{stars}<span style={{fontSize:10,marginLeft:3,color:"#c9a84c"}}>{rating.toFixed(1)}</span></span>;
}
function starsLabel(n) { return "★".repeat(n) + "☆".repeat(5 - n); }

function StarPicker({ value, onChange }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="star-row">
      {[1,2,3,4,5].map(n => (
        <span key={n} className={`star ${(hover||value)>=n?"active":""}`}
          onClick={()=>onChange(n===value?0:n)} onMouseEnter={()=>setHover(n)} onMouseLeave={()=>setHover(0)}>★</span>
      ))}
      {value > 0 && <span style={{fontSize:12,color:COLORS.muted}}>{value}/5</span>}
    </div>
  );
}

function TagPicker({ options, selected, onChange, mode="like" }) {
  const toggle = (opt) => { const arr=selected||[]; onChange(arr.includes(opt)?arr.filter(x=>x!==opt):[...arr,opt]); };
  return (
    <div className="tags-row">
      {options.map(opt=>(
        <button key={opt} className={`tag-pill ${(selected||[]).includes(opt)?(mode==="like"?"selected-like":"selected-dislike"):""}`} onClick={()=>toggle(opt)}>{opt}</button>
      ))}
    </div>
  );
}

function KidsToggle({ value, onChange, t }) {
  return (
    <div className={`kids-toggle ${value?"on":""}`} onClick={()=>onChange(!value)}>
      <span className="kids-toggle-label">{t?.addKids||"👶 Kids friendly"}</span>
      <div className="toggle-switch"><div className="toggle-knob"/></div>
    </div>
  );
}

function DistanceSlider({ value, onChange }) {
  const idx = DISTANCE_STEPS.indexOf(value);
  return (
    <div className="distance-slider-wrap">
      <div className="distance-slider-value">{DISTANCE_LABELS[idx]}</div>
      <input type="range" min={0} max={DISTANCE_STEPS.length-1} value={idx} onChange={e=>onChange(DISTANCE_STEPS[parseInt(e.target.value)])} />
      <div className="distance-slider-labels">{DISTANCE_LABELS.map(l=><span key={l} className="distance-slider-label">{l}</span>)}</div>
    </div>
  );
}

function PlaceSearch({ onPlaceSelected, COLORS=THEMES.dark, cityOnly=false }) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const timerRef = useRef(null);
  const wrapperRef = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setShowDropdown(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const search = useCallback(async (val) => {
    if (val.length < 2) { setSuggestions([]); return; }
    setLoading(true);
    try {
      const cities = window._prefCities || [];
      // Search globally + one search per preferred city in parallel.
      // cityOnly restricts the autocomplete to localities / admin areas /
      // countries — used when the user is adding a Destination (a city or
      // country, not a POI).
      const queries = [
        fetch("/api/places", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ action:"autocomplete", input: val, cityOnly }) }).then(r=>r.json()).catch(()=>({suggestions:[]})),
        ...(cityOnly ? [] : cities.slice(0,3).map(city =>
          fetch("/api/places", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ action:"autocomplete", input: `${val} near ${city}` }) }).then(r=>r.json()).catch(()=>({suggestions:[]}))
        ))
      ];
      const results = await Promise.all(queries);
      // Merge: preferred cities first, then global, deduplicate by placeId
      const seen = new Set();
      const merged = [];
      // First add results from preferred cities (skip global index 0)
      for (let i = 1; i < results.length; i++) {
        for (const s of (results[i].suggestions||[]).slice(0,2)) {
          const id = s.placePrediction?.placeId||"";
          if (id && !seen.has(id)) { seen.add(id); merged.push(s); }
        }
      }
      // Then fill with global results
      for (const s of (results[0].suggestions||[])) {
        const id = s.placePrediction?.placeId||"";
        if (id && !seen.has(id)) { seen.add(id); merged.push(s); }
      }
      setSuggestions(merged.slice(0,7));
      setShowDropdown(true);
    } catch {}
    setLoading(false);
  }, []);

  const [activeIdx, setActiveIdx] = useState(-1);

  const handleKeyDown = (e) => {
    if (!showDropdown || !suggestions.length) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setActiveIdx(i=>Math.min(i+1, suggestions.length-1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActiveIdx(i=>Math.max(i-1, -1)); }
    else if (e.key === "Enter" && activeIdx >= 0) { e.preventDefault(); selectPlace(suggestions[activeIdx]); setActiveIdx(-1); }
    else if (e.key === "Escape") { setShowDropdown(false); setActiveIdx(-1); }
  };

  const handleInput = (e) => {
    const val = e.target.value;
    setQuery(val); setSelectedPlace(null);
    setActiveIdx(-1);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => search(val), 350);
  };

  const selectPlace = async (suggestion) => {
    const placeId = suggestion.placePrediction?.placeId;
    const mainText = suggestion.placePrediction?.structuredFormat?.mainText?.text || "";
    const secondaryText = suggestion.placePrediction?.structuredFormat?.secondaryText?.text || "";
    setQuery(mainText); setShowDropdown(false); setSuggestions([]);
    try {
      const res = await fetch("/api/places", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "details", placeId }) });
      const details = await res.json();
      const components = details.addressComponents||[];
      let city = components.find(c=>c.types?.includes("locality"))?.longText || components.find(c=>c.types?.includes("postal_town"))?.longText || components.find(c=>c.types?.includes("administrative_area_level_2"))?.longText || "";
      // Fallback: parse from formattedAddress when addressComponents are missing/incomplete
      // (e.g. for some Paris results where locality is empty)
      if (!city) {
        const fa = details.formattedAddress || secondaryText || "";
        const parts = fa.split(",").map(s=>s.trim()).filter(Boolean);
        if (parts.length >= 2) {
          const cityPart = parts[parts.length - 2] || "";
          // Drop tokens that look like postal codes
          // - pure digits ("75008", "10001")
          // - UK outward like "W1U", "SW1A", "E1"
          // - UK inward like "6RG", "1AA"
          const tokens = cityPart.split(/\s+/).filter(w =>
            !/^\d+$/.test(w) &&
            !/^[A-Z]{1,2}\d[A-Z\d]?$/i.test(w) &&
            !/^\d[A-Z]{2}$/i.test(w)
          );
          city = tokens.join(" ");
        }
      }
      const country = components.find(c=>c.types?.includes("country"))?.longText || secondaryText.split(",").pop()?.trim() || "";
      const streetNumber = components.find(c=>c.types?.includes("street_number"))?.longText || "";
      const route = components.find(c=>c.types?.includes("route"))?.longText || "";
      const postalCode = components.find(c=>c.types?.includes("postal_code"))?.longText || "";
      const streetAddress = [streetNumber, route, postalCode].filter(Boolean).join(" ") || details.formattedAddress || "";
      const googleTypes = details.types||[];
      // Detect all matching types from Google's types (deduplicated, ordered)
      const matchedTypes = new Set();
      for (const gt of [details.primaryType, ...googleTypes].filter(Boolean)) {
        if (GOOGLE_TYPE_MAP[gt]) matchedTypes.add(GOOGLE_TYPE_MAP[gt]);
      }
      const type = matchedTypes.size > 0 ? [...matchedTypes].join(",") : "Restaurant";
      const price = PRICE_MAP[details.priceLevel]||"";
      // Extract cuisine from Google types (primary first, then secondary)
      const allTypes = [details.primaryType, ...googleTypes].filter(Boolean);
      const cuisineKeywords = {
        italian:"Italian", japanese:"Japanese", chinese:"Chinese", french:"French",
        indian:"Indian", thai:"Thai", mexican:"Mexican", american:"American",
        greek:"Greek", spanish:"Spanish", mediterranean:"Mediterranean",
        british:"British", korean:"Korean", vietnamese:"Vietnamese",
        turkish:"Turkish", lebanese:"Lebanese", moroccan:"Moroccan",
        sushi:"Sushi", pizza:"Pizza", burger:"Burger", steak:"Steakhouse",
        seafood:"Seafood", vegetarian:"Vegetarian", vegan:"Vegan", bakery:"Bakery",
        wine_bar:"Wine bar", cocktail:"Cocktail bar", cafe:"Café",
        ramen:"Japanese", noodle:"Asian", brasserie:"Brasserie", bistro:"Bistro",
        kosher:"Kosher", halal:"Halal", israeli:"Israeli", kebab:"Kebab",
        tapas:"Tapas", barbecue:"Barbecue", bbq:"Barbecue", pasta:"Italian",
        asian_fusion:"Asian Fusion", fast_food:"Fast Food", sandwich:"Sandwich",
        dessert:"Dessert", ice_cream:"Ice Cream", breakfast:"Breakfast", brunch:"Brunch",
        african:"African", ethiopian:"Ethiopian", peruvian:"Peruvian",
        brazilian:"Brazilian", argentinian:"Argentinian", german:"German",
        portuguese:"Portuguese", irish:"Irish", fusion:"Fusion", tex_mex:"Tex-Mex",
        latin:"Latin", caribbean:"Caribbean", cajun:"Cajun", dim_sum:"Dim Sum",
        pho:"Vietnamese", curry:"Curry", tacos:"Mexican"
      };
      let cuisine = "";
      // Only extract cuisine for restaurant/bar/café types
      const isActivityType = type.includes("Activité") || type.includes("Destination");
      // Always try keyword-based cuisine extraction (works for "italian_restaurant" etc.)
      for (const gt of allTypes) {
        const key = Object.keys(cuisineKeywords).find(k=>gt.toLowerCase().includes(k));
        if (key) { cuisine = cuisineKeywords[key]; break; }
      }
      // Fallback to primaryTypeDisplayName ONLY if not an activity type
      // (avoids "Miniature golf course" as cuisine)
      if (!cuisine && !isActivityType && details.primaryTypeDisplayName) {
        const display = details.primaryTypeDisplayName?.text || details.primaryTypeDisplayName;
        if (typeof display === 'string') {
          const lower = display.toLowerCase().trim();
          const generic = ['restaurant','bar','café','cafe','hotel','lodging','attraction','museum','food'];
          if (!generic.includes(lower)) {
            cuisine = display.replace(/^restaurant\s+/i,'').replace(/\s+restaurant$/i,'').trim();
            cuisine = cuisine.charAt(0).toUpperCase() + cuisine.slice(1);
          }
        }
      }
      const googlePlaceId = placeId || "";
      const priceSource = details.priceLevel ? "google" : "";
      // Extract activityType for Activité/Destination
      let activityType = "";
      if (isActivityType) {
        // 1. Prefer Google's localized display name (already in user's language via languageCode)
        if (details.primaryTypeDisplayName) {
          const display = details.primaryTypeDisplayName?.text || details.primaryTypeDisplayName;
          if (typeof display === 'string') {
            const lower = display.toLowerCase().trim();
            const generic = ['restaurant','bar','café','cafe','hotel','lodging','food','établissement','establishment','point of interest','point d\'intérêt'];
            if (!generic.includes(lower)) {
              activityType = display.charAt(0).toUpperCase() + display.slice(1);
            }
          }
        }
        // 2. Fallback to keyword matching if Google didn't provide a useful display name
        if (!activityType) {
          const activityKeywords = {
            museum:"Museum", art_gallery:"Art Gallery", amusement_park:"Amusement Park",
            performing_arts_theater:"Theater", zoo:"Zoo", aquarium:"Aquarium",
            bowling_alley:"Bowling", gym:"Gym", spa:"Spa", stadium:"Stadium",
            national_park:"National Park", park:"Park", garden:"Garden",
            historical_landmark:"Historical Site", church:"Church", mosque:"Mosque",
            library:"Library", casino:"Casino", movie_theater:"Cinema",
            tourist_attraction:"Attraction", campground:"Campground", ski_resort:"Ski Resort",
            miniature_golf:"Mini Golf", golf_course:"Golf", bowling:"Bowling",
            escape_room:"Escape Room", karaoke:"Karaoke", water_park:"Water Park",
            theme_park:"Theme Park", trampoline_park:"Trampoline Park",
            video_arcade:"Arcade", entertainment:"Entertainment"
          };
          for (const gt of allTypes) {
            const key = Object.keys(activityKeywords).find(k=>gt.toLowerCase().includes(k));
            if (key) { activityType = activityKeywords[key]; break; }
          }
        }
      }
      const place = { name: mainText, city, country, type, price, priceSource, address: streetAddress, cuisine, activityType, googlePlaceId };
      setSelectedPlace(place); onPlaceSelected(place);
    } catch {
      const parts = secondaryText.split(",");
      onPlaceSelected({ name: mainText, city: parts[0]?.trim()||"", country: parts[parts.length-1]?.trim()||"", type: "Restaurant", price: "" });
    }
  };

  const clear = () => { setQuery(""); setSelectedPlace(null); setSuggestions([]); onPlaceSelected(null); };

  return (
    <div className="autocomplete-wrapper" ref={wrapperRef}>
      <div style={{position:"relative"}}>
        <input placeholder="Ex: Le Comptoir du Relais..." value={query} onChange={handleInput} onFocus={()=>suggestions.length>0&&setShowDropdown(true)}
          onKeyDown={handleKeyDown} style={{background:COLORS.card,border:`1px solid ${selectedPlace?COLORS.accent:COLORS.border}`,borderRadius:8,color:COLORS.text,fontFamily:"'DM Sans', sans-serif",fontSize:14,padding:"11px 14px",outline:"none",width:"100%",transition:"border-color 0.2s"}} />
        {selectedPlace && <button onClick={clear} style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",color:COLORS.muted,cursor:"pointer",fontSize:16}}>✕</button>}
      </div>
      {selectedPlace && <div className="place-badge">✓ {selectedPlace.city}{selectedPlace.country?`, ${selectedPlace.country}`:""} • {selectedPlace.type} • {selectedPlace.price}</div>}
      {showDropdown && (loading||suggestions.length>0) && (
        <div className="autocomplete-dropdown">
          {loading && <div className="autocomplete-loading">Recherche...</div>}
          {!loading && suggestions.map((s,i) => {
            const main = s.placePrediction?.structuredFormat?.mainText?.text||"";
            const secondary = s.placePrediction?.structuredFormat?.secondaryText?.text||"";
            return (
              <div key={i} className="autocomplete-item" onMouseDown={()=>selectPlace(s)} style={{background:i===activeIdx?COLORS.border:"transparent",borderRadius:4}}>
                <div className="autocomplete-main">📍 {main}</div>
                {secondary && <div className="autocomplete-sub">{secondary}</div>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const MAP_STYLES = [
  {elementType:"geometry",stylers:[{color:"#1a1814"}]},
  {elementType:"labels.text.fill",stylers:[{color:"#f0ead8"}]},
  {elementType:"labels.text.stroke",stylers:[{color:"#0f0e0c"}]},
  {featureType:"road",elementType:"geometry",stylers:[{color:"#2e2b25"}]},
  {featureType:"water",elementType:"geometry",stylers:[{color:"#0f0e0c"}]},
  {featureType:"poi",stylers:[{visibility:"off"}]},
];

function GoogleMap({ recommendations, userCoords, heartMemories, nearbyPlaces, pins=[], themeKey, COLORS, t={}, recoLimit }) {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const boundsRef = useRef(null);
  const markersRef = useRef({ hearts: [], ai: [], nearby: [], pins: [] });
  const [activePlace, setActivePlace] = useState(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [visible, setVisible] = useState({ hearts: true, ai: true, nearby: true, pins: true });

  // Limit nearby markers based on recoLimit (5/10/20)
  const nearbyLimit = parseInt(recoLimit) || 10;
  const nearbyToShow = (nearbyPlaces || []).slice(0, nearbyLimit);

  // ESC key: close popup first, then exit fullscreen
  useEffect(() => {
    const handler = (e) => {
      if (e.key !== "Escape") return;
      if (activePlace) { setActivePlace(null); return; }
      if (fullscreen) setFullscreen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [fullscreen, activePlace]);

  useEffect(() => {
    if (!mapRef.current) return;
    const hasContent = recommendations?.length || userCoords?.lat || heartMemories?.length || nearbyPlaces?.length;
    if (!hasContent) return;

    const loadMap = () => {
      if (!window.google) return;
      const bounds = new window.google.maps.LatLngBounds();
      const map = new window.google.maps.Map(mapRef.current, {
        zoom: 13, mapTypeControl: false, streetViewControl: false, fullscreenControl: false,
        mapId: "49c549e3ad4ad4323a538e40",
        colorScheme: COLORS.mapScheme || 'DARK',
      });
      mapInstance.current = map;
      boundsRef.current = bounds;
      markersRef.current = { hearts: [], ai: [], nearby: [] };
      const geocoder = new window.google.maps.Geocoder();
      let total = 0, done = 0;
      const checkFit = () => { done++; if (done >= total && !bounds.isEmpty()) map.fitBounds(bounds); };

      // User position - purple
      if (userCoords?.lat) {
        bounds.extend({ lat: userCoords.lat, lng: userCoords.lng });
        const pin = new window.google.maps.marker.PinElement({ background:"#8b5cf6", borderColor:"#ffffff", glyphColor:"#ffffff", scale:1.0 });
        new window.google.maps.marker.AdvancedMarkerElement({ position:{lat:userCoords.lat,lng:userCoords.lng}, map, zIndex:100, content:pin });
      }

      // Heart memories - red, numbered
      (heartMemories||[]).forEach((m, i) => {
        if (!m._lat && !m.city && !m.name) return;
        total++;
        const num = String(i+1);
        if (m._lat) {
          const pos = { lat: m._lat, lng: m._lng };
          const pin = new window.google.maps.marker.PinElement({ background:"#e05555", borderColor:"#0f0e0c", glyphColor:"#fff", glyphText:num, scale:1.0 });
          const marker = new window.google.maps.marker.AdvancedMarkerElement({ position:pos, map, title:m.name, content:pin });
          marker.addListener("gmp-click", () => setActivePlace({ ...m, markerType: "heart", idx: i+1 }));
          markersRef.current.hearts.push(marker);
          bounds.extend(pos);
          checkFit();
        } else {
          geocoder.geocode({ address: `${m.name} ${m.city||""} ${m.country||""}` }, (res, status) => {
            if (status === "OK" && res[0]) {
              const pos = res[0].geometry.location;
              const pin2 = new window.google.maps.marker.PinElement({ background:"#e05555", borderColor:"#0f0e0c", glyphColor:"#fff", glyphText:num, scale:1.0 });
              const marker = new window.google.maps.marker.AdvancedMarkerElement({ position:pos, map, title:m.name, content:pin2 });
              marker.addListener("gmp-click", () => setActivePlace({ ...m, markerType: "heart", idx: i+1 }));
              markersRef.current.hearts.push(marker);
              bounds.extend(pos);
            }
            checkFit();
          });
        }
      });

      // AI recommendations - gold, numbered
      (recommendations||[]).forEach((reco, i) => {
        if (!reco.address) return;
        total++;
        const setupMarker = (pos) => {
          const pinEl = new window.google.maps.marker.PinElement({ background:"#c9a84c", borderColor:"#0f0e0c", glyphColor:"#0f0e0c", glyphText:String(i+1), scale:1.0 });
          const marker = new window.google.maps.marker.AdvancedMarkerElement({ position:pos, map, title:reco.name, content:pinEl });
          marker.addListener("gmp-click", () => setActivePlace({ ...reco, markerType: "ai", idx: i+1 }));
          markersRef.current.ai.push(marker);
        };
        if (reco.lat && reco.lng) {
          const pos = { lat: reco.lat, lng: reco.lng };
          setupMarker(pos);
          bounds.extend(pos);
          checkFit();
        } else {
          geocoder.geocode({ address: reco.address }, (results, status) => {
            if (status === "OK" && results[0]) {
              const pos = results[0].geometry.location;
              setupMarker(pos);
              bounds.extend(pos);
            }
            checkFit();
          });
        }
      });

      // Nearby places - green, numbered, visible by default (same as hearts & AI)
      nearbyToShow.forEach((p, i) => {
        if (!p.lat || !p.lng) return;
        const pos = { lat: p.lat, lng: p.lng };
        const pinEl = new window.google.maps.marker.PinElement({ background:"#7a9d7a", borderColor:"#0f0e0c", glyphColor:"#fff", glyphText:String(i+1), scale:1.0 });
        const marker = new window.google.maps.marker.AdvancedMarkerElement({ position:pos, map, title:p.name, content:pinEl });
        marker.addListener("gmp-click", () => setActivePlace({ ...p, markerType: "nearby", idx: i+1 }));
        markersRef.current.nearby.push(marker);
        bounds.extend(pos);
      });

      // Pins — blue markers
      if (markersRef.current.pins) markersRef.current.pins.forEach(m => m.map = null);
      markersRef.current.pins = [];
      if (pins && pins.length > 0) {
        pins.forEach((p, i) => {
          const lat = p.lat || p.location?.latitude;
          const lng = p.lng || p.location?.longitude;
          if (!lat || !lng) return;
          const pos = { lat: parseFloat(lat), lng: parseFloat(lng) };
          try {
            const pinEl = new window.google.maps.marker.PinElement({ background:"#6b8cce", borderColor:"#fff", glyphColor:"#fff", glyphText:String(i+1), scale:0.9 });
            const marker = new window.google.maps.marker.AdvancedMarkerElement({ position:pos, map, title:p.name, content:pinEl });
            marker.addListener("gmp-click", () => setActivePlace({ ...p, markerType: "pin" }));
            markersRef.current.pins.push(marker);
            bounds.extend(pos);
          } catch(e) { console.warn("Pin marker error:", e); }
        });
      }

      if (total === 0 && !bounds.isEmpty()) map.fitBounds(bounds);
    };

    if (window.google) { loadMap(); }
    else {
      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_MAPS_KEY||""}&callback=initGoogleMap&loading=async&libraries=marker`;
      script.async = true;
      window.initGoogleMap = loadMap;
      document.head.appendChild(script);
    }
  }, [
    JSON.stringify(recommendations?.map(r=>r.name)),
    JSON.stringify(heartMemories?.map(m=>m.id)),
    JSON.stringify(nearbyToShow?.map(p=>p.name)),
    JSON.stringify(pins?.map(p=>p.id)),
    userCoords?.lat,
    userCoords?.lng
  ]);

  // Toggle marker visibility on legend click
  const toggleLayer = (layer) => {
    setVisible(v => {
      const newVal = !v[layer];
      const map = mapInstance.current;
      markersRef.current[layer]?.forEach(m => { m.map = newVal ? map : null; });
      return { ...v, [layer]: newVal };
    });
  };

  // Apply initial visibility
  useEffect(() => {
    if (!mapInstance.current) return;
    Object.entries(visible).forEach(([layer, isVisible]) => {
      markersRef.current[layer]?.forEach(m => { m.map = isVisible ? mapInstance.current : null; });
    });
  }, [visible.hearts, visible.ai, visible.nearby, visible.pins]);

  // Refit bounds when toggling fullscreen
  useEffect(() => {
    if (mapInstance.current && boundsRef.current && !boundsRef.current.isEmpty()) {
      setTimeout(() => mapInstance.current.fitBounds(boundsRef.current), 100);
    }
  }, [fullscreen]);

  const mapStyle = fullscreen
    ? { position:"fixed", inset:0, zIndex:500, background:COLORS.bg }
    : { position:"relative", borderRadius:12, overflow:"hidden", border:`1px solid ${COLORS.border}` };

  const ctrlBtnStyle = {
    background:COLORS.card, border:`1px solid ${COLORS.border}`,
    borderRadius:6, width:32, height:32, color:COLORS.text, cursor:"pointer", fontSize:14,
    fontFamily:"'DM Sans',sans-serif", display:"flex", alignItems:"center", justifyContent:"center",
    boxShadow:"0 2px 8px rgba(0,0,0,0.4)", padding:0
  };

  return (
    <div style={mapStyle}>
      <div key={themeKey} ref={mapRef} style={{ width:"100%", height: fullscreen ? "100vh" : "240px" }}/>

      {/* Top control bar — recenter + fullscreen */}
      <div style={{ position:"absolute", top:8, right:8, display:"flex", gap:6, zIndex:2 }}>
        <button onClick={() => {
          if (mapInstance.current && boundsRef.current && !boundsRef.current.isEmpty()) {
            mapInstance.current.fitBounds(boundsRef.current);
          }
        }} style={ctrlBtnStyle} title={t.mapRecenter||"Recenter"}>⊕</button>
        <button onClick={() => setFullscreen(f => !f)} style={ctrlBtnStyle} title={fullscreen ? (t.mapClose||"Close") : (t.mapFullscreen||"Fullscreen")}>
          {fullscreen ? "✕" : "⛶"}
        </button>
      </div>

      {/* Clickable legend — bottom left, away from controls */}
      <div style={{ position:"absolute", bottom:8, left:8, display:"flex", gap:5, flexWrap:"wrap", zIndex:1, maxWidth:"calc(100% - 16px)" }}>
        {userCoords?.lat && <span style={{fontSize:11,color:COLORS.text,background:`${COLORS.card}ee`,padding:"3px 8px",borderRadius:20,border:`1px solid ${COLORS.border}`}}>🟣 {t.mapYou||"You"}</span>}
        {(heartMemories||[]).length > 0 && <button onClick={()=>toggleLayer("hearts")} style={{fontSize:11,color:COLORS.text,background:`${COLORS.card}ee`,padding:"3px 8px",borderRadius:20,border:`1px solid ${COLORS.border}`,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",opacity:visible.hearts?1:0.45}}>🔴 {t.mapFavorites||"Favorites"}</button>}
        {(recommendations||[]).length > 0 && <button onClick={()=>toggleLayer("ai")} style={{fontSize:11,color:COLORS.text,background:`${COLORS.card}ee`,padding:"3px 8px",borderRadius:20,border:`1px solid ${COLORS.border}`,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",opacity:visible.ai?1:0.45}}>🟡 {t.mapAIPicks||"AI"}</button>}
        {(nearbyPlaces||[]).length > 0 && <button onClick={()=>toggleLayer("nearby")} style={{fontSize:11,color:COLORS.text,background:`${COLORS.card}ee`,padding:"3px 8px",borderRadius:20,border:`1px solid ${COLORS.border}`,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",opacity:visible.nearby?1:0.45}}>🟢 {t.mapNearby||"Popular"}</button>}
        {(pins||[]).length > 0 && <button onClick={()=>toggleLayer("pins")} style={{fontSize:11,color:COLORS.text,background:`${COLORS.card}ee`,padding:"3px 8px",borderRadius:20,border:`1px solid ${COLORS.border}`,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",opacity:visible.pins?1:0.45}}>🔵 Pins</button>}
      </div>

      {/* Place popup on click */}
      {activePlace && (
        <div style={{
          position:"absolute", bottom:48, left:8, right:8,
          background:COLORS.card, border:`1px solid ${activePlace.markerType==="heart"?"#e05555":activePlace.markerType==="nearby"?"#7a9d7a":"#c9a84c"}`,
          borderRadius:10, padding:"12px 14px", zIndex:20
        }}>
          <div style={{display:"flex", justifyContent:"space-between", alignItems:"flex-start"}}>
            <div style={{fontFamily:"'Cormorant Garamond',serif", fontSize:17, color:COLORS.text, flex:1, marginRight:8}}>
              {activePlace.idx && <span style={{color:activePlace.markerType==="heart"?"#e05555":activePlace.markerType==="nearby"?"#7a9d7a":COLORS.accent,marginRight:6}}>#{activePlace.idx}</span>}
              {activePlace.name}
            </div>
            <button onClick={() => setActivePlace(null)} style={{background:"none",border:"none",color:COLORS.muted,cursor:"pointer",fontSize:16}}>✕</button>
          </div>
          <div style={{fontSize:11,color:COLORS.muted,marginTop:3}}>
            {activePlace.address || [activePlace.city, activePlace.country].filter(Boolean).join(", ")}
          </div>
          {activePlace.why && <div style={{fontSize:12,color:"#b8ad98",fontStyle:"italic",marginTop:4}}>« {activePlace.why} »</div>}
          {activePlace.rating > 0 && <div style={{fontSize:12,color:"#e8c97a",marginTop:3}}>{"★".repeat(Math.round(activePlace.rating))}</div>}
          <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(activePlace.name+(activePlace.address?", "+activePlace.address:""))}`}
            target="_blank" rel="noopener noreferrer"
            style={{display:"inline-block",marginTop:8,fontSize:11,color:"#c9a84c",border:"1px solid #c9a84c44",padding:"3px 10px",borderRadius:6,textDecoration:"none"}}>
            Maps →
          </a>
        </div>
      )}
    </div>
  );
}




// Autocomplete spécial pour la localisation Reco — retourne aussi les coordonnées GPS
function RecoPlaceSearch({ onPlaceSelected, initialValue="", COLORS=THEMES.dark }) {
  const [query, setQuery] = useState(initialValue);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const timerRef = useRef(null);
  const wrapperRef = useRef(null);
  const firstSyncRef = useRef(true);
  // What was in localStorage when this component mounted. Lets us tell
  // "page load with a previously-saved location" (skip autocomplete) apart
  // from "parent set a fresh value before mount" (e.g. 'Ask Outsy' parser
  // flipped locMode to free and filled the address — should open autocomplete).
  const savedAtMountRef = useRef(typeof localStorage !== "undefined" ? (localStorage.getItem("outsy_freeLocation") || "") : "");

  useEffect(() => {
    const handler = (e) => { if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setShowDropdown(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const search = useCallback(async (val, cityOnly = false) => {
    if (val.length < 2) { setSuggestions([]); return; }
    setLoading(true);
    try {
      // When the search is for an explicit city query (typed by user or
      // injected by the 'Ask Outsy' parser), fetch BOTH a geo-restricted
      // result set AND the regular one in parallel. Geo results land at
      // the top so the city surfaces first; regular results fill in the
      // tail so the dropdown is never empty if the geo filter returns 0
      // (e.g. Google rejects the filter, or the query is unusual).
      if (cityOnly) {
        const [geoRes, regRes] = await Promise.all([
          fetch("/api/places", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ action:"autocomplete", input: val, cityOnly: true }) }).then(r=>r.json()).catch(()=>({suggestions:[]})),
          fetch("/api/places", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ action:"autocomplete", input: val }) }).then(r=>r.json()).catch(()=>({suggestions:[]})),
        ]);
        const seen = new Set();
        const merged = [];
        for (const s of (geoRes.suggestions || [])) {
          const id = s.placePrediction?.placeId || "";
          if (id && !seen.has(id)) { seen.add(id); merged.push(s); }
        }
        for (const s of (regRes.suggestions || [])) {
          const id = s.placePrediction?.placeId || "";
          if (id && !seen.has(id)) { seen.add(id); merged.push(s); }
        }
        setSuggestions(merged.slice(0,7));
        setShowDropdown(true);
        setLoading(false);
        return;
      }
      const cities = window._prefCities || [];
      // Search globally + one search per preferred city in parallel
      const queries = [
        fetch("/api/places", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ action:"autocomplete", input: val }) }).then(r=>r.json()).catch(()=>({suggestions:[]})),
        ...cities.slice(0,3).map(city =>
          fetch("/api/places", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ action:"autocomplete", input: `${val} near ${city}` }) }).then(r=>r.json()).catch(()=>({suggestions:[]}))
        )
      ];
      const results = await Promise.all(queries);
      // Merge: preferred cities first, then global, deduplicate by placeId
      const seen = new Set();
      const merged = [];
      // First add results from preferred cities (skip global index 0)
      for (let i = 1; i < results.length; i++) {
        for (const s of (results[i].suggestions||[]).slice(0,2)) {
          const id = s.placePrediction?.placeId||"";
          if (id && !seen.has(id)) { seen.add(id); merged.push(s); }
        }
      }
      // Then fill with global results
      for (const s of (results[0].suggestions||[])) {
        const id = s.placePrediction?.placeId||"";
        if (id && !seen.has(id)) { seen.add(id); merged.push(s); }
      }
      setSuggestions(merged.slice(0,7));
      setShowDropdown(true);
    } catch {}
    setLoading(false);
  }, []);

  // When the parent updates initialValue externally (e.g. 'Ask Outsy' parser
  // sets a city), sync the input AND trigger the Google autocomplete in
  // city-only mode so the city itself surfaces at the top. Skip the first
  // sync (mount) so the autocomplete dropdown doesn't open uninvited when
  // arriving on the page with a previously-saved free location.
  useEffect(() => {
    if (firstSyncRef.current) {
      firstSyncRef.current = false;
      // Only suppress the dropdown on first sync when this initialValue
      // matches the localStorage-saved value (i.e. real page load). When
      // the parent has *changed* the value before our mount (parser flow),
      // open the autocomplete just like a manual edit would.
      if (initialValue === savedAtMountRef.current) return;
      if (initialValue && initialValue.length >= 2) {
        search(initialValue, true);
      }
      return;
    }
    // When the parent's value echoes back what we just set internally
    // (typically after selectPlace updated query → onPlaceSelected →
    // parent setFreeLocation), don't rerun autocomplete — it would just
    // reopen the dropdown immediately after the user confirmed.
    if (initialValue === query) return;
    setQuery(initialValue);
    if (initialValue && initialValue.length >= 2) {
      search(initialValue, true);
    } else {
      setSuggestions([]);
      setShowDropdown(false);
    }
  }, [initialValue, search]);

  const [activeIdx, setActiveIdx] = useState(-1);

  const handleInput = (e) => {
    const val = e.target.value;
    setQuery(val); setSelected(null);
    if (!val) { onPlaceSelected(null); return; }
    onPlaceSelected({ address: val, lat: null, lng: null });
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => search(val), 350);
    setActiveIdx(-1);
  };

  const handleKeyDown = (e) => {
    if (e.key === "ArrowDown") { e.preventDefault(); if (!showDropdown&&suggestions.length>0) setShowDropdown(true); setActiveIdx(i=>Math.min(i+1, suggestions.length-1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActiveIdx(i=>Math.max(i-1, -1)); }
    else if (e.key === "Enter" && activeIdx >= 0) { e.preventDefault(); selectPlace(suggestions[activeIdx]); setActiveIdx(-1); }
    else if (e.key === "Escape") { setShowDropdown(false); setActiveIdx(-1); }
  };

  const selectPlace = async (suggestion) => {
    const placeId = suggestion.placePrediction?.placeId;
    const mainText = suggestion.placePrediction?.structuredFormat?.mainText?.text || "";
    const secondaryText = suggestion.placePrediction?.structuredFormat?.secondaryText?.text || "";
    const fullLabel = `${mainText}${secondaryText ? ", " + secondaryText : ""}`;
    setQuery(fullLabel); setShowDropdown(false); setSuggestions([]);

    try {
      // Récupérer les coords via details
      const res = await fetch("/api/places", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "details", placeId }) });
      const details = await res.json();
      const lat = details.location?.latitude;
      const lng = details.location?.longitude;
      if (lat && lng) {
        setSelected({ address: fullLabel, lat, lng });
        onPlaceSelected({ address: fullLabel, lat, lng });
        return;
      }
    } catch {}

    // Fallback: géocoder via l'API geocode
    try {
      const res = await fetch("/api/places", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "geocode", input: fullLabel }) });
      const data = await res.json();
      if (data.lat) {
        setSelected({ address: fullLabel, lat: data.lat, lng: data.lng });
        onPlaceSelected({ address: fullLabel, lat: data.lat, lng: data.lng });
        return;
      }
    } catch {}

    setSelected({ address: fullLabel, lat: null, lng: null });
    onPlaceSelected({ address: fullLabel, lat: null, lng: null });
  };

  const clear = () => { setQuery(""); setSelected(null); setSuggestions([]); onPlaceSelected(null); };

  return (
    <div className="autocomplete-wrapper" ref={wrapperRef}>
      <div style={{position:"relative"}}>
        <input
          placeholder="Ex: 10 Downing Street London, Tour Eiffel Paris..."
          value={query}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          onFocus={()=>suggestions.length>0&&setShowDropdown(true)}
          style={{background:COLORS.bg,border:`1px solid ${selected?COLORS.accent:COLORS.border}`,borderRadius:8,color:COLORS.text,fontFamily:"'DM Sans', sans-serif",fontSize:14,padding:"11px 14px",outline:"none",width:"100%",transition:"border-color 0.2s"}}
        />
        {selected&&<button onClick={clear} style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",color:COLORS.muted,cursor:"pointer",fontSize:16}}>✕</button>}
      </div>
      {selected&&<div style={{fontSize:11,color:COLORS.accent,marginTop:4}}>✓ {selected.lat?`Coordonnées : ${selected.lat.toFixed(4)}, ${selected.lng.toFixed(4)}`:"Adresse enregistrée"}</div>}
      {showDropdown&&(loading||suggestions.length>0)&&(
        <div className="autocomplete-dropdown">
          {loading&&<div className="autocomplete-loading">Recherche...</div>}
          {!loading&&suggestions.map((s,i)=>{
            const main=s.placePrediction?.structuredFormat?.mainText?.text||"";
            const secondary=s.placePrediction?.structuredFormat?.secondaryText?.text||"";
            return (
              <div key={i} className="autocomplete-item" onMouseDown={()=>selectPlace(s)} style={{background:i===activeIdx?COLORS.border:"transparent"}}>
                <div className="autocomplete-main">📍 {main}</div>
                {secondary&&<div className="autocomplete-sub">{secondary}</div>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const CUISINES = ["French","Italian","Japanese","Chinese","Indian","Thai","Mexican","Lebanese","Greek","Spanish","British","American","Mediterranean","Vietnamese","Korean","Turkish","Moroccan","Austrian","Belgian","Scandinavian","Peruvian","Argentine","Brazilian","Australian","Modern European","Fusion","Vegetarian","Seafood","Steakhouse","Sushi","Pizza","Burger","Bistro","Brasserie","Wine bar","Cocktail bar","Café","Bakery"];
const DEFAULT_FORM = { name:"",type:"Restaurant",price:"",city:"",country:"",rating:0,likeTags:[],dislikeTags:[],why:"",dislike:"",kidsf:false,cuisine:"",activityType:"",address:"" };
const DEFAULT_PREFS = { theme: "light", loves:"",hates:"",budget:"",notes:"",lovesTags:[],hatesTags:[],firstName:"",lastName:"",username:"",is_private:false,avatar_url:"",language:"en",nbrecos:"10",preferredCities:[] };

function MemoryForm({ initial, onSave, onCancel, isEdit=false, prefilled=false, t, lang="en", COLORS=THEMES.dark, onDuplicate, onDelete }) {
  // Migrate legacy data: if the memory was created with the old split
  // why / dislike fields, merge them into a single free note. why stays as
  // the unified field (DB column kept for backwards compatibility); dislike
  // is cleared on next save.
  const mergedInitial = (() => {
    const base = initial ? { ...initial, activityType: initial.activityType || initial.activity_type || "" } : DEFAULT_FORM;
    if (initial && initial.dislike && initial.dislike.trim()) {
      const joined = [initial.why, initial.dislike].filter(s => s && s.trim()).join("\n\n");
      return { ...base, why: joined, dislike: "" };
    }
    return base;
  })();
  const [form, setForm] = useState(mergedInitial);
  const [confirmClose, setConfirmClose] = useState(false);
  // Compare against the merged baseline, not the raw initial — otherwise a
  // legacy memory looks "dirty" the moment it's opened (merged why content
  // differs from the raw why field).
  const initialRef = useRef(JSON.stringify(mergedInitial));
  const isDirty = () => JSON.stringify(form) !== initialRef.current;

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key !== "Escape") return;
      if (!onCancel) return;
      if (!isDirty()) { onCancel(); return; }
      setConfirmClose(true);
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [form]); // eslint-disable-line
  const likesOptions = (LIKES_BY_TYPE_LANG[lang]||LIKES_BY_TYPE_LANG.en)[(form.type||"Restaurant").split(",")[0]]||(LIKES_BY_TYPE_LANG.en)["Restaurant"];
  const dislikesOptions = (DISLIKES_BY_TYPE_LANG[lang]||DISLIKES_BY_TYPE_LANG.en)[(form.type||"Restaurant").split(",")[0]]||(DISLIKES_BY_TYPE_LANG.en)["Restaurant"];
  const toggleType = (tp) => {
    setForm(f => {
      const current = (f.type||"Restaurant").split(",").map(t=>t.trim()).filter(Boolean);
      const has = current.includes(tp);
      let next;
      if (has && current.length > 1) {
        next = current.filter(t => t !== tp);
      } else if (!has) {
        next = [...current, tp];
      } else {
        return f; // can't remove last type
      }
      return {...f, type: next.join(",")};
    });
  };
  const handlePlaceSelected = (place) => {
    if (!place) { setForm(f=>({...f,name:"",city:"",country:"",type:"Restaurant",price:""})); return; }
    // If the user explicitly selected Destination type before searching, the
    // autocomplete was restricted to cities/countries — keep their chosen type
    // instead of overwriting it from the place details (which would map a
    // locality to something nonsensical).
    setForm(f=>({...f,name:place.name,city:place.city,country:place.country,address:place.address||"",type:f.type==="Destination"?"Destination":place.type,price:place.price,priceSource:place.priceSource||"",cuisine:place.cuisine||"",activityType:place.activityType||"",google_place_id:place.googlePlaceId||"",likeTags:[],dislikeTags:[]}));
    if (onDuplicate) onDuplicate(place.name);
  };
  return (
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      {(!isEdit&&!prefilled)?<div className="field"><label>{t?.addPlace||"Place name"}</label><PlaceSearch COLORS={COLORS} cityOnly={form.type==="Destination"} onPlaceSelected={handlePlaceSelected}/></div>
        :<div className="field"><label>{t?.addPlace||"Place name"}</label><input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} readOnly={prefilled&&!isEdit} style={prefilled&&!isEdit?{opacity:0.7,cursor:"default"}:{}}/></div>}
      {form.name && <>
        <div className="field"><label>{t?.addType||"Type"}</label>
          <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
            {TYPES.map(tp=>{
              const selected = (form.type||"").split(",").map(t=>t.trim()).includes(tp);
              return <button key={tp} type="button" onClick={()=>toggleType(tp)} style={{padding:"5px 10px",borderRadius:20,fontSize:11,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",border:`1px solid ${selected?COLORS.accent:COLORS.border}`,background:selected?`${COLORS.accent}22`:COLORS.tag,color:selected?COLORS.accent:COLORS.muted,fontWeight:selected?600:400}}>{TYPE_ICONS[tp]} {(TYPES_I18N[lang]||TYPES_I18N.en)[tp]||tp}</button>;
            })}
          </div>
        </div>
        {(form.type||"").split(",").some(t=>t.trim()==="Restaurant")&&(
          <div className="field"><label>{t?.addCuisine||"Cuisine"}</label><input value={form.cuisine||""} onChange={e=>setForm(f=>({...f,cuisine:e.target.value}))} placeholder="Ex: Italian, Japanese..."/></div>
        )}
        {(form.type||"").split(",").some(t=>t.trim()==="Activité")&&(
          <div className="field"><label>{t?.addActivityType||"Type d'activité"}</label><input value={form.activityType||""} onChange={e=>setForm(f=>({...f,activityType:e.target.value}))} placeholder={t?.addActivityPlaceholder||"Ex: Musée, Parc, Spa, Spectacle..."}/></div>
        )}
        <div className="field">
          <label>{t?.addPrice||"Prix"}
            {form.priceSource==="google"
              ? <span style={{fontSize:10,color:"#4a9",marginLeft:6,fontWeight:400}}>✓ Google</span>
              : form.price
                ? <span style={{fontSize:10,color:COLORS.muted,marginLeft:6,fontWeight:400}}>{t?.addPriceManual||"manuel"}</span>
                : <span style={{fontSize:10,color:"#d4869b",marginLeft:6,fontWeight:400}}>{t?.addPriceNeeded||"à indiquer"}</span>
            }
          </label>
          <div className="price-selector">
            {PRICES.map((p,i)=>{
              const labels = [t?.priceCheap||"Bon marché", t?.priceMid||"Intermédiaire", t?.priceHigh||"Haut de gamme"];
              return <button key={p} className={`price-btn ${form.price===p?"selected":""}`} onClick={()=>setForm(f=>({...f,price:p,priceSource:"manual"}))} title={labels[i]}>
                <div>{p}</div>
                <div style={{fontSize:9,fontWeight:400,marginTop:1,opacity:0.7}}>{labels[i]}</div>
              </button>;
            })}
          </div>
        </div>
        <div className="field"><label>{t?.addAddress||"Address"}</label><input placeholder="22 Harcourt Street" value={form.address||""} onChange={e=>setForm(f=>({...f,address:e.target.value}))}/></div>
        <div className="row-2">
          <div className="field"><label>{t?.addCity||"City"}</label><input placeholder="London" value={form.city} onChange={e=>setForm(f=>({...f,city:e.target.value}))}/></div>
          <div className="field"><label>{t?.addCountry||"Country"}</label><input placeholder="UK" value={form.country} onChange={e=>setForm(f=>({...f,country:e.target.value}))}/></div>
        </div>
        <div className="field"><label>{t?.addRating||"Rating"}</label><StarPicker value={form.rating} onChange={v=>setForm(f=>({...f,rating:v}))}/></div>
        <KidsToggle value={form.kidsf} onChange={v=>setForm(f=>({...f,kidsf:v}))} t={t}/>
        <div className="section-divider"><span>{t?.addLiked||"Liked"}</span></div>
        <div className="field"><TagPicker options={likesOptions} selected={form.likeTags} onChange={v=>setForm(f=>({...f,likeTags:v}))} mode="like"/></div>
        <div className="section-divider"><span>{t?.addDisliked||"Disliked"}</span></div>
        <div className="field"><TagPicker options={dislikesOptions} selected={form.dislikeTags} onChange={v=>setForm(f=>({...f,dislikeTags:v}))} mode="dislike"/></div>
        <div className="section-divider"><span>{t?.addNotes||"Notes libres"}</span></div>
        <div className="field"><textarea placeholder={t?.addNotesPlaceholder||"Ton ressenti — points forts, bémols, ambiance, anecdotes"} value={form.why||""} onChange={e=>setForm(f=>({...f,why:e.target.value}))} style={{textAlign:"justify",minHeight:80}}/></div>
        <div style={{display:"flex",gap:8,marginTop:4,alignItems:"center"}}>
          {isEdit&&onDelete&&<button onClick={onDelete} title={t?.deleteTitle||"Delete"} style={{background:COLORS.dislikeBg,border:`1px solid ${COLORS.dislike}66`,color:"#d4869b",borderRadius:"50%",width:38,height:38,cursor:"pointer",fontSize:16,display:"flex",alignItems:"center",justifyContent:"center",padding:0,fontFamily:"'DM Sans',sans-serif",flexShrink:0}}>🗑️</button>}
          {onCancel&&<button className="modal-btn secondary" onClick={onCancel}>{t?.duplicateCancel||"Cancel"}</button>}
          <button className="save-btn" style={{flex:1,margin:0}} onClick={()=>onSave(form)} disabled={!form.name.trim()}>{isEdit?(t?.addUpdate||"Update"):(t?.addSave||"Save")}</button>
        </div>
        {confirmClose&&(
          <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",zIndex:300,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
            <div style={{background:COLORS.bg,border:`1px solid ${COLORS.accent}44`,borderRadius:16,padding:24,maxWidth:320,width:"100%",display:"flex",flexDirection:"column",gap:14}}>
              <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:20,color:COLORS.accent}}>{t?.unsavedTitle||"Unsaved changes"}</div>
              <div style={{fontSize:13,color:COLORS.muted}}>{t?.unsavedText||"You have unsaved changes. Leave without saving?"}</div>
              <div style={{display:"flex",gap:8}}>
                <button className="modal-btn secondary" style={{flex:1}} onClick={()=>setConfirmClose(false)}>{t?.unsavedStay||"Keep editing"}</button>
                <button className="modal-btn primary" style={{flex:1,background:"#e06060",border:"none"}} onClick={()=>{setConfirmClose(false);onCancel();}}>{t?.unsavedLeave||"Leave"}</button>
              </div>
            </div>
          </div>
        )}
      </>}
    </div>
  );
}

function OpeningHoursWidget({ openNow, hours, lang="en", COLORS=THEMES.dark, t={} }) {
  const [expanded, setExpanded] = useState(false);

  const convertToFr = (line) => {
    if (!line) return line;
    const dayMaps = {
      fr: {"Monday":"Lundi","Tuesday":"Mardi","Wednesday":"Mercredi","Thursday":"Jeudi","Friday":"Vendredi","Saturday":"Samedi","Sunday":"Dimanche"},
      es: {"Monday":"Lunes","Tuesday":"Martes","Wednesday":"Miércoles","Thursday":"Jueves","Friday":"Viernes","Saturday":"Sábado","Sunday":"Domingo"},
      de: {"Monday":"Montag","Tuesday":"Dienstag","Wednesday":"Mittwoch","Thursday":"Donnerstag","Friday":"Freitag","Saturday":"Samstag","Sunday":"Sonntag"},
      it: {"Monday":"Lunedì","Tuesday":"Martedì","Wednesday":"Mercoledì","Thursday":"Giovedì","Friday":"Venerdì","Saturday":"Sabato","Sunday":"Domenica"},
      pt: {"Monday":"Segunda","Tuesday":"Terça","Wednesday":"Quarta","Thursday":"Quinta","Friday":"Sexta","Saturday":"Sábado","Sunday":"Domingo"},
      nl: {"Monday":"Maandag","Tuesday":"Dinsdag","Wednesday":"Woensdag","Thursday":"Donderdag","Friday":"Vrijdag","Saturday":"Zaterdag","Sunday":"Zondag"},
      en: {}
    };
    const dayMap = dayMaps[lang] || {};

    // Normalize unicode whitespace and dashes
    let out = line
      .replace(/\u202f/g, " ").replace(/\u00a0/g, " ")
      .replace(/\u2009/g, " ").replace(/\u2013/g, "–").replace(/\u2014/g, "–");

    // Translate day names
    Object.entries(dayMap).forEach(([en, local]) => { out = out.replace(en, local); });

    // Translate "Closed" in the time part
    const closedWord = {fr:"Fermé",en:"Closed",es:"Cerrado",de:"Geschlossen",it:"Chiuso",pt:"Fechado",nl:"Gesloten"}[lang]||"Closed";
    out = out.replace(/\bClosed\b/g, closedWord);

    // Split day label from time part
    const dayMatch = out.match(/^([^:]+):\s*(.*)/s);
    if (!dayMatch) return out;
    const dayPart = dayMatch[1];
    const timePart = dayMatch[2];

    // Convert a single time slot like "5:30 – 10:30 PM" or "5:30 PM – 10:30 PM"
    const convertSlot = (slot) => {
      const s = slot.trim();
      const hasInternalAMPM = /\d\s*[AP]M\s*[–\-]/i.test(s);
      const hasPMEnd = /\d\s*PM\s*$/i.test(s);
      const hasAMEnd = /\d\s*AM\s*$/i.test(s);
      if (!hasPMEnd && !hasAMEnd) return s; // already 24h
      if (hasInternalAMPM) {
        // Each time has its own AM/PM
        return s
          .replace(/(\d{1,2})(?::(\d{2}))?\s*AM/gi, (_, h, m) =>
            (h==="12"?"00":String(parseInt(h)).padStart(2,"0"))+":"+(m||"00"))
          .replace(/(\d{1,2})(?::(\d{2}))?\s*PM/gi, (_, h, m) =>
            (h==="12"?"12":String(parseInt(h)+12).padStart(2,"0"))+":"+(m||"00"))
          .replace(/\s*–\s*/g,"–");
      }
      // PM/AM only at end — apply to ALL times in slot
      const mer = hasPMEnd ? "PM" : "AM";
      return s.replace(/\s*[AP]M\s*$/i, "")
        .replace(/(\d{1,2})(?::(\d{2}))?/g, (_, h, m) =>
          mer==="AM"
            ? (h==="12"?"00":String(parseInt(h)).padStart(2,"0"))+":"+(m||"00")
            : (h==="12"?"12":String(parseInt(h)+12).padStart(2,"0"))+":"+(m||"00"))
        .replace(/\s*–\s*/g,"–").replace(/\s*-\s*/g,"–");
    };

    return dayPart + ": " + timePart.split(",").map(convertSlot).join(", ");
  };

  const getTodayLine = () => {
    if (!hours?.length) return null;
    const days = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
    const today = new Date().getDay();
    return hours.find(h => h.startsWith(days[today])) || null;
  };

  // Find next opening slot when currently closed
  const getNextOpenLabel = () => {
    if (!hours?.length) return null;
    const days = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
    const dayShort = {
      fr:["dim.","lun.","mar.","mer.","jeu.","ven.","sam."],
      en:["Sun.","Mon.","Tue.","Wed.","Thu.","Fri.","Sat."],
      es:["dom.","lun.","mar.","mié.","jue.","vie.","sáb."],
      de:["So.","Mo.","Di.","Mi.","Do.","Fr.","Sa."],
      it:["dom.","lun.","mar.","mer.","gio.","ven.","sab."],
      pt:["dom.","seg.","ter.","qua.","qui.","sex.","sáb."],
      nl:["zo.","ma.","di.","wo.","do.","vr.","za."],
    }[lang] || ["Sun.","Mon.","Tue.","Wed.","Thu.","Fri.","Sat."];
    const opensLabel = {fr:"Ouvre à",en:"Opens at",es:"Abre a",de:"Öffnet um",it:"Apre alle",pt:"Abre às",nl:"Opent om"}[lang]||"Opens at";

    const now = new Date();
    const todayIdx = now.getDay();

    // Check remaining slots today first, then next 6 days
    for (let offset = 0; offset <= 6; offset++) {
      const dayIdx = (todayIdx + offset) % 7;
      const dayLine = hours.find(h => h.startsWith(days[dayIdx]));
      if (!dayLine) continue;
      const converted = convertToFr(dayLine);
      const timePart = converted.split(": ").slice(1).join(": ");
      const closedLabel = {fr:"Fermé",en:"Closed",es:"Cerrado",de:"Geschlossen",it:"Chiuso",pt:"Fechado",nl:"Gesloten"}[lang]||"Closed";
      if (!timePart || timePart === closedLabel) continue;

      // Extract first opening time of this day
      const firstTime = timePart.split(",")[0].split("–")[0].trim();
      if (!firstTime) continue;

      // If today, check if this slot is still upcoming
      if (offset === 0) {
        const [hh, mm] = firstTime.split(":").map(Number);
        const slotMinutes = hh * 60 + (mm || 0);
        const nowMinutes = now.getHours() * 60 + now.getMinutes();

        // Also check if there's a later slot today
        const slots = timePart.split(",");
        const upcomingSlot = slots.find(slot => {
          const t = slot.split("–")[0].trim();
          const [sh, sm] = t.split(":").map(Number);
          return (sh * 60 + (sm||0)) > nowMinutes;
        });
        if (upcomingSlot) {
          const t = upcomingSlot.split("–")[0].trim();
          return `${opensLabel} ${t}`;
        }
        continue; // no upcoming slot today, try tomorrow
      }

      return `${opensLabel} ${firstTime} ${dayShort[dayIdx]}`;
    }
    return null;
  };

  const todayLine = getTodayLine();
  const todayTimes = todayLine ? convertToFr(todayLine).split(": ").slice(1).join(": ") : null;
  const nextOpenLabel = !openNow ? getNextOpenLabel() : null;

  // When open, find the current active slot only
  const getCurrentSlot = () => {
    if (!openNow || !todayTimes) return todayTimes;
    const now = new Date();
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    const slots = todayTimes.split(",").map(s => s.trim());
    const currentSlot = slots.find(slot => {
      const parts = slot.split("–");
      if (parts.length < 2) return false;
      const [sh, sm] = parts[0].trim().split(":").map(Number);
      const [eh, em] = parts[1].trim().split(":").map(Number);
      const start = sh * 60 + (sm || 0);
      const end = eh * 60 + (em || 0);
      const endAdj = end < start ? end + 24 * 60 : end; // handle midnight crossing
      return nowMinutes >= start && nowMinutes <= endAdj;
    });
    return currentSlot || slots[slots.length - 1]; // fallback to last slot
  };

  const openLabel = t.hoursOpen || {fr:"Ouvert",en:"Open",es:"Abierto",de:"Geöffnet",it:"Aperto",pt:"Aberto",nl:"Open"}[lang]||"Open";
  const closedLabel = t.hoursClosed || {fr:"Fermé",en:"Closed",es:"Cerrado",de:"Geschlossen",it:"Chiuso",pt:"Fechado",nl:"Gesloten"}[lang]||"Closed";
  const maybeTemp = !openNow && !hours?.length;
  const currentSlot = getCurrentSlot();
  const statusText = openNow
    ? `🟢 ${openLabel}${currentSlot && currentSlot!==closedLabel ? " · "+currentSlot : ""}`
    : maybeTemp
      ? `⚠️ ${{fr:'Fermé temporairement',en:'Possibly temporarily closed',es:'Posiblemente cerrado temporalmente',de:'Möglicherweise vorübergehend geschlossen',it:'Possibilmente chiuso temporaneamente',pt:'Possivelmente fechado temporariamente',nl:'Mogelijk tijdelijk gesloten'}[lang]||'Possibly temporarily closed'}`
      : `🔴 ${closedLabel}${nextOpenLabel ? " · "+nextOpenLabel : ""}`;

  return (
    <div style={{marginBottom:6}}>
      <div onClick={()=>hours?.length&&setExpanded(e=>!e)}
        style={{display:"inline-flex",alignItems:"center",gap:6,cursor:hours?.length?"pointer":"default"}}>
        <span style={{fontSize:11,
          color:openNow?"#5a9e6a":maybeTemp?"#b89a2a":"#c05050",
          background:openNow?"rgba(90,158,106,0.12)":maybeTemp?"rgba(184,154,42,0.12)":"rgba(192,80,80,0.12)",
          border:`1px solid ${openNow?"rgba(90,158,106,0.3)":maybeTemp?"rgba(184,154,42,0.3)":"rgba(192,80,80,0.3)"}`,
          padding:"3px 10px",borderRadius:20}}>
          {statusText}
        </span>
        {hours?.length&&<span style={{fontSize:10,color:COLORS.muted}}>{expanded?"▲":"▼"}</span>}
      </div>
      {expanded&&hours?.length&&(
        <div style={{marginTop:6,background:COLORS.card,border:`1px solid ${COLORS.border}`,borderRadius:8,
          padding:"8px 12px",fontSize:11,color:COLORS.muted,lineHeight:1.8}}>
          {hours.map((h,i)=>{
            const fr = convertToFr(h);
            const [day,...rest] = fr.split(": ");
            const slots = rest.join(": ").split(", ");
            return (
              <div key={i} style={{display:"flex",gap:8,marginBottom:2}}>
                <span style={{minWidth:100,color:COLORS.text,fontWeight:500,flexShrink:0}}>{day}</span>
                <span style={{display:"flex",flexDirection:"column",gap:1}}>
                  {slots.map((slot,j)=><span key={j}>{slot}</span>)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function FriendsBadge({ friends, friendsData=[], onViewFriend, onSaveFriend, COLORS=THEMES.dark, t={} }) {
  const [open, setOpen] = useState(false);
  const [dropPos, setDropPos] = useState({top:0, left:0});
  const ref = useRef(null);
  const badgeRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const clickHandler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const scrollHandler = () => setOpen(false);
    document.addEventListener("mousedown", clickHandler);
    window.addEventListener("scroll", scrollHandler, true);
    return () => {
      document.removeEventListener("mousedown", clickHandler);
      window.removeEventListener("scroll", scrollHandler, true);
    };
  }, [open]);

  const handleOpen = () => {
    if (open) { setOpen(false); return; }
    if (badgeRef.current) {
      const rect = badgeRef.current.getBoundingClientRect();
      // Find the parent card (memory-card or ai-reco-card) for left alignment
      let cardEl = badgeRef.current.closest(".memory-card") || badgeRef.current.closest(".ai-reco-card");
      const cardLeft = cardEl ? cardEl.getBoundingClientRect().left : rect.left;
      setDropPos({ top: rect.bottom + 6, left: cardLeft + 12 });
    }
    setOpen(true);
  };

  return (
    <div ref={ref} style={{position:"relative",display:"inline-flex",alignItems:"center"}}>
      <span ref={badgeRef} onClick={handleOpen}
        style={{fontSize:10,color:COLORS.accent,background:`${COLORS.accent}18`,border:`1px solid ${COLORS.accent}44`,borderRadius:"50%",
          width:26,height:26,display:"inline-flex",alignItems:"center",justifyContent:"center",
          fontFamily:"'DM Sans',sans-serif",cursor:"pointer",userSelect:"none",fontWeight:600}}>
        {friends.length}
      </span>
      {open&&(
        <div style={{position:"fixed",top:dropPos.top,left:dropPos.left,background:COLORS.card,border:`1px solid ${COLORS.border}`,
          borderRadius:10,padding:"8px 4px",zIndex:500,width:260,boxShadow:"0 4px 20px rgba(0,0,0,0.15)"}}>
          {friends.map((fname,i)=>{
            const fMem = friendsData.find(m=>m.friendName===fname);
            return (
              <div key={i} style={{padding:"6px 12px",borderBottom:i<friends.length-1?`1px solid ${COLORS.border}44`:"none"}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:8}}>
                  <span style={{fontSize:12,color:COLORS.text,fontWeight:500,flexShrink:1,minWidth:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{fname}</span>
                  <div style={{display:"flex",gap:6,alignItems:"center",flexShrink:0}}>
                    {fMem?.rating>0&&<span style={{fontSize:11,color:COLORS.muted}}>{fMem.rating}/5</span>}
                    {onViewFriend&&<span onClick={()=>{setOpen(false);onViewFriend(fname,fMem);}}
                      style={{fontSize:13,color:COLORS.accent,cursor:"pointer"}} title={t?.mapTooltip||"View"}>→</span>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Unified card actions block: distance + FriendsBadge + Edit/Add button
// Used in MemoryCard, AI cards, Nearby cards for consistent UX
function CardActions({ distance, friendsHave, myMem, onEdit, onAdd, onPin, COLORS, t={}, setFriendMemoryModal, addFriendToCarnet }) {
  const distLabel = distance != null
    ? (distance >= 1000 ? `${(distance/1000).toFixed(1)}km` : `${Math.round(distance)}m`)
    : null;

  return (
    <div style={{display:"flex",alignItems:"center",gap:6,marginLeft:8}}>
      {distLabel && (
        <span style={{fontSize:11,color:COLORS.muted,background:`${COLORS.accent}15`,border:`1px solid ${COLORS.accent}33`,borderRadius:20,padding:"2px 8px",whiteSpace:"nowrap",fontWeight:600}}>
          {distLabel}
        </span>
      )}
      {friendsHave && friendsHave.length > 0 && (
        <FriendsBadge
          friends={friendsHave.map(f=>f.friendName||f)}
          friendsData={friendsHave}
          onViewFriend={(name,fMem)=>{
            const mem = fMem || friendsHave.find(x=>x.friendName===name);
            if (mem && setFriendMemoryModal) setFriendMemoryModal({memory:mem,friendName:name});
          }}
          onSaveFriend={(fMem)=>addFriendToCarnet&&addFriendToCarnet(fMem)}
          COLORS={COLORS}
          t={t}
        />
      )}
      {myMem
        ? <button onClick={()=>onEdit(myMem)} title={t.editBtn||"Edit"} style={{background:COLORS.card,border:`1px solid ${COLORS.accent}`,color:COLORS.accent,borderRadius:"50%",width:30,height:30,cursor:"pointer",fontSize:13,display:"flex",alignItems:"center",justifyContent:"center",padding:0,fontFamily:"'DM Sans',sans-serif"}}>✏️</button>
        : <div style={{display:"flex",gap:4}}>
            {onPin && <button onClick={onPin} title={t.pinBtn||"Pin"} style={{background:COLORS.card,border:`1px solid ${COLORS.border}`,color:COLORS.muted,borderRadius:"50%",width:30,height:30,cursor:"pointer",fontSize:14,display:"flex",alignItems:"center",justifyContent:"center",padding:0}}>📌</button>}
            {onAdd && <button onClick={onAdd} title={t.recoAddFav||"Add"} style={{background:COLORS.card,border:`1px solid ${COLORS.accent}`,color:COLORS.accent,borderRadius:"50%",width:30,height:30,cursor:"pointer",fontSize:18,display:"flex",alignItems:"center",justifyContent:"center",padding:0,fontFamily:"'DM Sans',sans-serif",fontWeight:300}}>+</button>}
          </div>
      }
    </div>
  );
}

function FitTags({ tags, COLORS }) {
  if (!tags || tags.length === 0) return null;
  return (
    <div style={{display:"flex",gap:5,flexWrap:"wrap",alignItems:"center"}}>
      {tags.map((t,i)=>{
        const meta = FIT_TAG_META[t.kind] || FIT_TAG_META.context;
        return (
          <span key={i} title={t.hint || ""} style={{
            display:"inline-flex",alignItems:"center",gap:3,
            fontSize:10,padding:"2px 7px",borderRadius:20,
            background:`${meta.color}1c`,color:meta.color,border:`1px solid ${meta.color}40`,
            fontFamily:"'DM Sans',sans-serif",fontWeight:600,whiteSpace:"nowrap",
          }}>
            <span style={{fontSize:11}}>{meta.icon}</span>{t.label}
          </span>
        );
      })}
    </div>
  );
}

function MemoryCard({ m, onEdit, onDelete, onDeleteRequest, isMine, lang="en", onViewFriend, onSaveFriend, onPin, onOpen, COLORS=THEMES.dark, t={}, setFriendMemoryModal, addFriendToCarnet, memories=[], fitTags=null }) {
  // Compute displayed values: own data if isMine, friend averages otherwise
  const friendsWithData = (m.friendsData||[]);
  const displayRating = (() => {
    if (m.isMine && m.rating > 0) return m.rating;
    if (!m.isMine && friendsWithData.length > 0) {
      const rated = friendsWithData.filter(f => f.rating > 0);
      if (rated.length > 0) return rated.reduce((s,f) => s + f.rating, 0) / rated.length;
    }
    return m.rating > 0 ? m.rating : null;
  })();
  const displayPrice = (() => {
    if (m.isMine) return m.price;
    if (friendsWithData.length > 0) {
      const priced = friendsWithData.filter(f => f.price);
      if (priced.length > 0) {
        const avgEuros = priced.reduce((s,f) => s + (f.price||"").length, 0) / priced.length;
        const count = Math.max(1, Math.min(4, Math.round(avgEuros)));
        return "€".repeat(count);
      }
    }
    return m.price;
  })();
  const displayKids = (() => {
    if (m.isMine) return m.kidsf;
    if (friendsWithData.length > 0) {
      const kidsCount = friendsWithData.filter(f => f.kidsf).length;
      return kidsCount / friendsWithData.length >= 0.5;
    }
    return m.kidsf;
  })();

  return (
    <div className={`memory-card ${!isMine?"friend-memory-card":""}`}>
      <div className="memory-top">
        <div className="memory-name" onClick={onOpen} style={{cursor:onOpen?"pointer":"default"}}>{getTypeIcon(m.type)} {m.name}</div>
        <CardActions
          distance={m.distanceKm!=null ? m.distanceKm*1000 : null}
          friendsHave={m.friendsWhoHave?.length>0 ? (m.friendsData||m.friendsWhoHave) : null}
          myMem={isMine ? m : null}
          onEdit={onEdit}
          onAdd={!isMine && onSaveFriend ? ()=>onSaveFriend(m) : null}
          onPin={!isMine && onPin ? ()=>onPin(m) : null}
          COLORS={COLORS}
          t={t}
          setFriendMemoryModal={setFriendMemoryModal}
          addFriendToCarnet={addFriendToCarnet}
        />
      </div>
      <div className="memory-meta" style={{marginBottom:6,justifyContent:"flex-start",flexWrap:"wrap",gap:5}}>
        {m.cuisine&&<span className="badge">{m.cuisine}</span>}
        {displayRating>0&&<span className="badge stars"><StarRating rating={displayRating} size={11} emptyColor={COLORS.border}/></span>}
        {displayKids&&<span className="badge kids">👶</span>}
        {displayPrice&&<span className="badge price">{displayPrice}</span>}
      </div>
      {fitTags && fitTags.length>0 && <div style={{marginBottom:6}}><FitTags tags={fitTags} COLORS={COLORS}/></div>}
      {(m.address||m.city||m.country)&&<div className="memory-location">
        📍 {m.address||[m.city,m.country].filter(Boolean).join(", ")}
        <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(m.name+", "+(m.address||[m.city,m.country].filter(Boolean).join(", ")))}`}
          target="_blank" rel="noopener noreferrer"
          className="maps-link" style={{marginLeft:8}}>Maps →</a>
      </div>}
      {m.openNow!==undefined&&m.openNow!==null&&<OpeningHoursWidget openNow={m.openNow} hours={m.openingHours} lang={lang} COLORS={COLORS} t={t}/>}

      {(m.likeTags||[]).length>0&&<div className="memory-tags">{m.likeTags.map(t=><span key={t} className="memory-tag">👍 {t}</span>)}</div>}
      {(m.dislikeTags||[]).length>0&&<div className="memory-tags">{m.dislikeTags.map(t=><span key={t} className="memory-tag bad">👎 {t}</span>)}</div>}
      {(() => {
        // Unified free note. Legacy memories may still have content in
        // `dislike` until the user re-edits them — show both joined.
        const note = [m.why, m.dislike].filter(s => s && s.trim()).join("\n\n");
        return note ? <div className="memory-why" style={{whiteSpace:"pre-wrap",textAlign:"justify"}}>« {note} »</div> : null;
      })()}
    </div>
  );
}


function calcDistance(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

function CityPicker({ cities: citiesRaw, onChange, placeholder, empty, COLORS=THEMES.dark }) {
  const cities = citiesRaw || [];
  const [input, setInput] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showDrop, setShowDrop] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const timerRef = useRef(null);
  const wrapRef = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setShowDrop(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const search = async (val) => {
    if (!val) { setSuggestions([]); return; }
    try {
      const res = await fetch("/api/places", { method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ action:"autocomplete", input: val + " city" }) });
      const data = await res.json();
      const items = (data.suggestions||[]).map(s=>{
        const main = s.placePrediction?.structuredFormat?.mainText?.text||"";
        const secondary = s.placePrediction?.structuredFormat?.secondaryText?.text||"";
        return { label: secondary ? `${main}, ${secondary}` : main, name: main };
      }).filter(s=>s.name);
      setSuggestions(items.slice(0,5));
      setShowDrop(true);
      setActiveIdx(-1);
    } catch {}
  };

  const handleInput = (e) => {
    const val = e.target.value;
    setInput(val);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => search(val), 300);
  };

  const handleKeyDown = (e) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setActiveIdx(i=>Math.min(i+1,suggestions.length-1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActiveIdx(i=>Math.max(i-1,-1)); }
    else if (e.key === "Enter") { e.preventDefault(); if (activeIdx>=0) selectSuggestion(suggestions[activeIdx]); else add(); }
    else if (e.key === "Escape") setShowDrop(false);
  };

  const selectSuggestion = (s) => {
    if (!s.name || cities.includes(s.name)) return;
    onChange([...cities, s.name]);
    setInput(""); setSuggestions([]); setShowDrop(false);
  };

  const add = () => {
    const val = input.trim();
    if (!val || cities.includes(val)) return;
    onChange([...cities, val]);
    setInput(""); setSuggestions([]); setShowDrop(false);
  };

  const remove = (i) => onChange(cities.filter((_,idx)=>idx!==i));

  const moveUp = (i) => {
    if (i===0) return;
    const next = [...cities];
    [next[i-1], next[i]] = [next[i], next[i-1]];
    onChange(next);
  };

  const moveDown = (i) => {
    if (i===cities.length-1) return;
    const next = [...cities];
    [next[i], next[i+1]] = [next[i+1], next[i]];
    onChange(next);
  };

  return (
    <div>
      <div style={{position:"relative",marginBottom:8}} ref={wrapRef}>
        <div style={{display:"flex",gap:8}}>
          <input
            value={input}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            onFocus={()=>suggestions.length>0&&setShowDrop(true)}
            placeholder={placeholder}
            style={{flex:1,background:COLORS.card,border:`1px solid ${COLORS.border}`,borderRadius:8,color:COLORS.text,
              fontFamily:"'DM Sans',sans-serif",fontSize:13,padding:"9px 12px",outline:"none"}}
          />
          <button onClick={add} style={{background:`${COLORS.accent}22`,border:`1px solid ${COLORS.accent}`,borderRadius:8,
            padding:"9px 14px",color:COLORS.accent,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontSize:13,fontWeight:600}}>
            +
          </button>
        </div>
        {showDrop&&suggestions.length>0&&(
          <div style={{position:"absolute",top:"100%",left:0,right:0,background:COLORS.card,border:`1px solid ${COLORS.border}`,
            borderRadius:8,zIndex:100,overflow:"hidden",marginTop:4,boxShadow:"0 4px 16px rgba(0,0,0,0.4)"}}>
            {suggestions.map((s,i)=>(
              <div key={i} onMouseDown={()=>selectSuggestion(s)}
                style={{padding:"10px 14px",cursor:"pointer",fontSize:13,color:COLORS.text,
                  background:i===activeIdx?COLORS.border:"transparent",borderBottom:`1px solid ${COLORS.border}44`}}>
                📍 {s.label}
              </div>
            ))}
          </div>
        )}
      </div>
      {cities.length===0 ? (
        <div style={{fontSize:12,color:COLORS.muted,fontStyle:"italic"}}>{empty}</div>
      ) : (
        <div style={{display:"flex",flexDirection:"column",gap:4}}>
          {cities.map((city,i)=>(
            <div key={i} style={{display:"flex",alignItems:"center",gap:6,background:COLORS.tag,
              border:`1px solid ${COLORS.border}`,borderRadius:8,padding:"7px 10px"}}>
              <span style={{fontSize:11,color:COLORS.accent,fontWeight:700,minWidth:18}}>#{i+1}</span>
              <span style={{flex:1,fontSize:13,color:COLORS.text}}>{city}</span>
              <button onClick={()=>moveUp(i)} disabled={i===0}
                style={{background:"none",border:"none",color:i===0?COLORS.border:COLORS.muted,cursor:i===0?"default":"pointer",fontSize:14,padding:"0 4px"}}>▲</button>
              <button onClick={()=>moveDown(i)} disabled={i===cities.length-1}
                style={{background:"none",border:"none",color:i===cities.length-1?COLORS.border:COLORS.muted,cursor:i===cities.length-1?"default":"pointer",fontSize:14,padding:"0 4px"}}>▼</button>
              <button onClick={()=>remove(i)}
                style={{background:"none",border:"none",color:"#e06060",cursor:"pointer",fontSize:14,padding:"0 4px"}}>✕</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── PlaceCardBody: Single card content (photos + details) inside the carousel track ───
function PlaceCardBody({ place, isActive, isAdjacent, detailsCacheRef, lang, COLORS, t, friendMemories, memories, pins }) {
  const [details, setDetails] = useState(() => {
    const pid = place.google_place_id || place.id;
    return pid ? (detailsCacheRef.current.get(pid) || null) : null;
  });
  const [photoIdx, setPhotoIdx] = useState(0);
  const [loading, setLoading] = useState(() => {
    const pid = place.google_place_id || place.id;
    return pid && !detailsCacheRef.current.get(pid);
  });
  const [photoDragX, setPhotoDragX] = useState(0);
  const [photoDragging, setPhotoDragging] = useState(false);
  const photoTouchRef = useRef({ x: null, y: null, dir: null });
  // Trackpad horizontal swipe support — a Mac / Windows trackpad two-finger
  // horizontal gesture emits wheel events with deltaX. The ref is needed
  // for a native addEventListener with { passive: false }, otherwise we
  // can't preventDefault and the browser swallows the gesture as a
  // back/forward navigation. Cooldown prevents one swipe from skipping
  // multiple photos.
  const photoWheelCooldownRef = useRef(0);
  const photoContainerRef = useRef(null);

  // Fetch details: always for active/adjacent, otherwise only from cache
  useEffect(() => {
    const pid = place.google_place_id || place.id;
    if (!pid || pid === "NOT_FOUND") { setLoading(false); return; }
    const cached = detailsCacheRef.current.get(pid);
    if (cached) { setDetails(cached); setLoading(false); return; }
    if (!isActive && !isAdjacent) { setLoading(false); return; }
    setLoading(true);
    fetch("/api/places", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "details", placeId: pid, lang: lang || "en" })
    })
      .then(r => r.json())
      .then(d => {
        detailsCacheRef.current.set(pid, d);
        setDetails(d);
        setLoading(false);
        (d.photoUrls || []).slice(0, 3).forEach(url => { const img = new Image(); img.src = url; });
      })
      .catch(() => setLoading(false));
  }, [place.google_place_id, place.id, isActive, isAdjacent, lang]);

  // Preload neighboring photos when active
  useEffect(() => {
    if (!isActive) return;
    const photos = details?.photoUrls || [];
    [photoIdx - 1, photoIdx + 1, photoIdx + 2].forEach(i => {
      if (i < 0 || i >= photos.length) return;
      const img = new Image(); img.src = photos[i];
    });
  }, [details, photoIdx, isActive]);

  const onPhotoTouchStart = (e) => {
    photoTouchRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, dir: null };
    e.stopPropagation();
  };
  const onPhotoTouchMove = (e) => {
    const start = photoTouchRef.current;
    if (start.x === null) return;
    const dx = e.touches[0].clientX - start.x;
    const dy = e.touches[0].clientY - start.y;
    if (start.dir === null && (Math.abs(dx) > 8 || Math.abs(dy) > 8)) {
      start.dir = Math.abs(dx) > Math.abs(dy) ? "h" : "v";
    }
    if (start.dir === "h") {
      if (!photoDragging) setPhotoDragging(true);
      setPhotoDragX(dx);
      e.stopPropagation();
    }
  };
  const onPhotoTouchEnd = (e) => {
    const start = photoTouchRef.current;
    if (start.x === null) return;
    const dx = e.changedTouches[0].clientX - start.x;
    const photos = (details?.photoUrls || []);
    if (start.dir === "h" && Math.abs(dx) > 50) {
      if (dx < 0 && photoIdx < photos.length - 1) setPhotoIdx(i => i + 1);
      if (dx > 0 && photoIdx > 0) setPhotoIdx(i => i - 1);
    }
    setPhotoDragging(false);
    setPhotoDragX(0);
    photoTouchRef.current = { x: null, y: null, dir: null };
    e.stopPropagation();
  };

  const d = details || {};
  const photos = d.photoUrls || [];

  // Photo carousel wheel handler — translates horizontal trackpad swipe
  // into next/prev photo, scoped to the photo area only (the wheel never
  // navigates between place sheets when fired over a photo). preventDefault
  // is critical: without it, a Mac trackpad two-finger horizontal swipe is
  // hijacked by the browser as a back/forward gesture and the user leaves
  // the page. React's onWheel is passive by default — registering via
  // useEffect + addEventListener with { passive: false } is the only way
  // to make preventDefault actually work.
  useEffect(() => {
    const el = photoContainerRef.current;
    if (!el) return;
    const handler = (e) => {
      // Claim ANY wheel event with a meaningful horizontal component up
      // front. preventDefault on the very first event blocks the trackpad's
      // swipe-to-go-back gesture (the browser starts the back animation
      // on the first horizontal events, even before the magnitude crosses
      // our nav threshold). Lenient claim — deltaX > 5 and at least half
      // of deltaY — to catch the early frames of a horizontal gesture
      // where the trackpad is still calibrating direction.
      if (Math.abs(e.deltaX) < 5 || Math.abs(e.deltaX) < Math.abs(e.deltaY) * 0.5) return;
      e.preventDefault();
      e.stopPropagation();
      if (photos.length <= 1) return;
      if (Math.abs(e.deltaX) < 30) return;
      const now = Date.now();
      if (now < photoWheelCooldownRef.current) return;
      if (e.deltaX > 0 && photoIdx < photos.length - 1) {
        setPhotoIdx(i => i + 1);
        photoWheelCooldownRef.current = now + 350;
      } else if (e.deltaX < 0 && photoIdx > 0) {
        setPhotoIdx(i => i - 1);
        photoWheelCooldownRef.current = now + 350;
      }
    };
    el.addEventListener("wheel", handler, { passive: false });
    return () => el.removeEventListener("wheel", handler);
  }, [photos.length, photoIdx]);
  const name = d.displayName?.text || place.name;
  const address = d.formattedAddress || place.address || "";
  const rating = d.rating || place.rating;
  const reviewCount = d.userRatingCount || place.userRatingCount || 0;
  const price = place.price || (d.priceLevel ? "€".repeat(["","PRICE_LEVEL_FREE","PRICE_LEVEL_INEXPENSIVE","PRICE_LEVEL_MODERATE","PRICE_LEVEL_EXPENSIVE","PRICE_LEVEL_VERY_EXPENSIVE"].indexOf(d.priceLevel)) : "");
  const cuisine = place.cuisine || "";
  const phone = d.internationalPhoneNumber || d.nationalPhoneNumber;
  const website = d.websiteUri;
  const mapsUrl = d.googleMapsUri || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name + ", " + address)}`;
  const hours = d.currentOpeningHours?.weekdayDescriptions || d.regularOpeningHours?.weekdayDescriptions;
  const editorial = d.editorialSummary?.text || place.editorialSummary;
  const reviews = (d.reviews || []).slice(0, 3);
  const isOpen = d.currentOpeningHours?.openNow ?? d.regularOpeningHours?.openNow;

  const feats = [];
  if (d.outdoorSeating) feats.push("Terrace");
  if (d.liveMusic) feats.push("Live music");
  if (d.servesCocktails) feats.push("Cocktails");
  if (d.goodForChildren) feats.push("Kids friendly");
  if (d.goodForGroups) feats.push("Groups");
  if (d.servesVegetarianFood) feats.push("Vegetarian");
  if (d.allowsDogs) feats.push("Dog friendly");
  if (d.reservable) feats.push("Reservable");
  if (d.servesBrunch) feats.push("Brunch");

  const friendsHere = friendMemories.filter(fm => fm.name?.toLowerCase() === name?.toLowerCase());
  const myMem = memories.find(m => m.name?.toLowerCase() === name?.toLowerCase());
  const myPin = pins.find(p => p.name?.toLowerCase() === name?.toLowerCase());
  const typeIcon = TYPE_ICONS[place.type?.split(",")[0]?.trim()] || "📍";

  return (
    <div style={{height:"100%",overflowY:"auto",overflowX:"hidden",WebkitOverflowScrolling:"touch",overscrollBehaviorX:"none"}}>
      {/* Photo gallery — fixed-height carousel (no layout shift while loading) */}
      <div ref={photoContainerRef}
        style={{position:"relative",width:"100%",height:220,minHeight:220,maxHeight:220,flexShrink:0,overflow:"hidden",background:COLORS.card,touchAction:"pan-y",overscrollBehaviorX:"none"}}
        onTouchStart={photos.length>0?onPhotoTouchStart:undefined}
        onTouchMove={photos.length>0?onPhotoTouchMove:undefined}
        onTouchEnd={photos.length>0?onPhotoTouchEnd:undefined}>
        {photos.length > 0 ? (
          <>
            <div style={{
              display:"flex",
              height:"100%",
              width:`${photos.length * 100}%`,
              transform:`translate3d(calc(${-photoIdx * (100/photos.length)}% + ${photoDragX}px), 0, 0)`,
              transition: photoDragging ? "none" : "transform 0.32s cubic-bezier(0.22, 1, 0.36, 1)",
              willChange:"transform"
            }}>
              {photos.map((url, i) => (
                <div key={i} style={{flex:`0 0 ${100/photos.length}%`,height:"100%",background:"#000"}}>
                  <img src={url} alt="" loading={isActive ? "eager" : (isAdjacent && i === 0 ? "eager" : "lazy")} draggable="false"
                    style={{width:"100%",height:"100%",objectFit:"cover",display:"block",userSelect:"none",pointerEvents:"none"}}
                    onError={(e) => { e.target.style.opacity = 0; }}/>
                </div>
              ))}
            </div>
            {photos.length > 1 && (
              <div style={{position:"absolute",bottom:10,left:0,right:0,display:"flex",justifyContent:"center",gap:5,pointerEvents:"none"}}>
                {photos.map((_, i) => (
                  <button key={i} onClick={() => setPhotoIdx(i)}
                    style={{width:i===photoIdx?20:8,height:8,borderRadius:4,border:"none",background:i===photoIdx?"#fff":"#fff6",cursor:"pointer",transition:"width 0.25s ease, background 0.25s ease",pointerEvents:"auto"}}/>
                ))}
              </div>
            )}
            {photos.length > 1 && photoIdx > 0 && <button onClick={() => setPhotoIdx(i => i - 1)} style={{position:"absolute",left:8,top:"50%",transform:"translateY(-50%)",background:"#0005",border:"none",borderRadius:"50%",width:32,height:32,color:"#fff",fontSize:16,cursor:"pointer"}}>‹</button>}
            {photos.length > 1 && photoIdx < photos.length - 1 && <button onClick={() => setPhotoIdx(i => i + 1)} style={{position:"absolute",right:8,top:"50%",transform:"translateY(-50%)",background:"#0005",border:"none",borderRadius:"50%",width:32,height:32,color:"#fff",fontSize:16,cursor:"pointer"}}>›</button>}
          </>
        ) : (
          <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100%",fontSize:48,opacity:0.3}}>{typeIcon}</div>
        )}
      </div>

      {/* Content */}
      <div style={{background:COLORS.bg,marginTop:0,position:"relative",padding:"18px 20px 100px",minHeight:"50vh",borderTop:`1px solid ${COLORS.border}`}}>
        {loading && <div style={{textAlign:"center",padding:"20px 0",color:COLORS.muted,fontSize:13}}>Loading...</div>}
        <div style={{fontSize:22,fontFamily:"'Cormorant Garamond',serif",fontStyle:"italic",color:COLORS.text,fontWeight:600,lineHeight:1.2}}>
          {typeIcon} {name}
        </div>
        <div style={{display:"flex",gap:6,flexWrap:"wrap",marginTop:8,alignItems:"center"}}>
          {cuisine && <span style={{fontSize:10,padding:"3px 8px",borderRadius:6,background:`${COLORS.accent}15`,color:COLORS.accent,fontFamily:"'DM Sans',sans-serif",fontWeight:600,textTransform:"uppercase",letterSpacing:"0.05em"}}>{cuisine}</span>}
          {rating && <span style={{fontSize:12,color:COLORS.accent,fontFamily:"'DM Sans',sans-serif"}}>{"★".repeat(Math.round(rating))} {rating}</span>}
          {reviewCount > 0 && <span style={{fontSize:11,color:COLORS.muted}}>({reviewCount})</span>}
          {price && <span style={{fontSize:12,color:COLORS.muted,fontFamily:"'DM Sans',sans-serif"}}>{price}</span>}
        </div>
        {isOpen !== undefined && (
          <div style={{marginTop:8,fontSize:12,fontFamily:"'DM Sans',sans-serif",color:isOpen?"#5a9a5a":"#d4869b"}}>
            {isOpen ? "● " + (t.placeOpen || "Open") : "● " + (t.placeClosed || "Closed")}
          </div>
        )}
        <div style={{display:"flex",gap:8,marginTop:16,flexWrap:"wrap"}}>
          {phone && <a href={`tel:${phone}`} style={{flex:"1 1 70px",display:"flex",flexDirection:"column",alignItems:"center",gap:4,padding:"10px 8px",background:COLORS.card,border:`1px solid ${COLORS.border}`,borderRadius:10,textDecoration:"none",color:COLORS.text,fontSize:10,fontFamily:"'DM Sans',sans-serif"}}>
            <span style={{fontSize:18}}>📞</span>{t.placeCall||"Call"}
          </a>}
          {website && <a href={website} target="_blank" rel="noopener noreferrer" style={{flex:"1 1 70px",display:"flex",flexDirection:"column",alignItems:"center",gap:4,padding:"10px 8px",background:COLORS.card,border:`1px solid ${COLORS.border}`,borderRadius:10,textDecoration:"none",color:COLORS.text,fontSize:10,fontFamily:"'DM Sans',sans-serif"}}>
            <span style={{fontSize:18}}>🌐</span>{t.placeWebsite||"Website"}
          </a>}
          <a href={mapsUrl} target="_blank" rel="noopener noreferrer" style={{flex:"1 1 70px",display:"flex",flexDirection:"column",alignItems:"center",gap:4,padding:"10px 8px",background:COLORS.card,border:`1px solid ${COLORS.border}`,borderRadius:10,textDecoration:"none",color:COLORS.text,fontSize:10,fontFamily:"'DM Sans',sans-serif"}}>
            <span style={{fontSize:18}}>🗺️</span>{t.placeDirections||"Directions"}
          </a>
          {d.reservable && website && <a href={website} target="_blank" rel="noopener noreferrer" style={{flex:"1 1 70px",display:"flex",flexDirection:"column",alignItems:"center",gap:4,padding:"10px 8px",background:`${COLORS.accent}11`,border:`1px solid ${COLORS.accent}44`,borderRadius:10,textDecoration:"none",color:COLORS.accent,fontSize:10,fontFamily:"'DM Sans',sans-serif",fontWeight:600}}>
            <span style={{fontSize:18}}>📅</span>{t.placeReserve||"Reserve"}
          </a>}
        </div>
        {feats.length > 0 && (
          <div style={{display:"flex",gap:5,flexWrap:"wrap",marginTop:14}}>
            {feats.map((f, i) => <span key={i} style={{fontSize:10,padding:"3px 8px",borderRadius:10,background:`${COLORS.accent}11`,color:COLORS.accent,border:`1px solid ${COLORS.accent}22`,fontFamily:"'DM Sans',sans-serif"}}>✓ {f}</span>)}
          </div>
        )}
        {address && (
          <div style={{marginTop:14,fontSize:13,color:COLORS.muted,fontFamily:"'DM Sans',sans-serif"}}>
            📍 {address}
          </div>
        )}
        {hours && (
          <details style={{marginTop:14}}>
            <summary style={{fontSize:12,color:COLORS.accent,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontWeight:500}}>
              🕐 {t.placeHours||"Opening hours"}
            </summary>
            <div style={{marginTop:6,fontSize:12,color:COLORS.muted,fontFamily:"'DM Sans',sans-serif",lineHeight:1.8}}>
              {hours.map((h, i) => <div key={i}>{h}</div>)}
            </div>
          </details>
        )}
        {editorial && (
          <div style={{marginTop:16,padding:14,background:COLORS.card,borderRadius:10,border:`1px solid ${COLORS.border}`}}>
            <div style={{fontSize:13,fontStyle:"italic",color:COLORS.text,fontFamily:"'DM Sans',sans-serif",lineHeight:1.5}}>
              « {editorial} »
            </div>
          </div>
        )}
        {friendsHere.length > 0 && (
          <div style={{marginTop:16}}>
            <div style={{fontSize:11,textTransform:"uppercase",letterSpacing:"0.1em",color:COLORS.muted,fontFamily:"'DM Sans',sans-serif",fontWeight:600,marginBottom:8}}>
              👥 {t.placeFriends||"Friends who've been here"}
            </div>
            {friendsHere.map((fm, i) => (
              <div key={i} style={{padding:"8px 12px",background:COLORS.card,borderRadius:8,border:`1px solid ${COLORS.border}`,marginBottom:6,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <span style={{fontSize:13,color:COLORS.text,fontFamily:"'DM Sans',sans-serif"}}>{fm.friendName || "Friend"}</span>
                <div style={{display:"flex",gap:6,alignItems:"center"}}>
                  {fm.rating > 0 && <span style={{fontSize:12,color:COLORS.accent}}>{"★".repeat(fm.rating)} {fm.rating}/5</span>}
                  {fm.price && <span style={{fontSize:11,color:COLORS.muted}}>{fm.price}</span>}
                </div>
              </div>
            ))}
          </div>
        )}
        {myMem && (
          <div style={{marginTop:16,padding:12,background:`${COLORS.accent}08`,borderRadius:10,border:`1px solid ${COLORS.accent}33`}}>
            <div style={{fontSize:11,textTransform:"uppercase",color:COLORS.accent,fontWeight:600,marginBottom:4,fontFamily:"'DM Sans',sans-serif"}}>❤️ {t.placeMyReview||"My review"}</div>
            <div style={{fontSize:13,color:COLORS.text}}>{"★".repeat(myMem.rating||0)} {myMem.rating}/5</div>
            {myMem.why && <div style={{fontSize:12,color:COLORS.muted,marginTop:4}}>{myMem.why}</div>}
          </div>
        )}
        {myPin && !myMem && (
          <div style={{marginTop:16,padding:12,background:"#6b8cce08",borderRadius:10,border:"1px solid #6b8cce33"}}>
            <div style={{fontSize:11,textTransform:"uppercase",color:"#6b8cce",fontWeight:600,marginBottom:4,fontFamily:"'DM Sans',sans-serif"}}>📌 {t.placePinned||"Pinned"}</div>
            {myPin.pin_note && <div style={{fontSize:12,color:COLORS.muted,fontStyle:"italic"}}>{myPin.pin_note}</div>}
          </div>
        )}
        {reviews.length > 0 && (
          <div style={{marginTop:16}}>
            <div style={{fontSize:11,textTransform:"uppercase",letterSpacing:"0.1em",color:COLORS.muted,fontFamily:"'DM Sans',sans-serif",fontWeight:600,marginBottom:8}}>
              💬 {t.placeReviews||"Reviews"}
            </div>
            {reviews.map((rv, i) => (
              <div key={i} style={{padding:12,background:COLORS.card,borderRadius:8,border:`1px solid ${COLORS.border}`,marginBottom:8}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                  <span style={{fontSize:12,fontWeight:600,color:COLORS.text}}>{rv.authorAttribution?.displayName||"Anonymous"}</span>
                  {rv.rating && <span style={{fontSize:11,color:COLORS.accent}}>{"★".repeat(rv.rating)}</span>}
                </div>
                <div style={{fontSize:12,color:COLORS.muted,lineHeight:1.5}}>{(rv.text?.text||"").slice(0, 200)}{(rv.text?.text||"").length > 200 ? "..." : ""}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── PlaceSheet: Full place details overlay with photos, actions, reviews ───
function PlaceSheet({ place, list=[], index=0, onClose, onNavigate, COLORS, t={}, friendMemories=[], memories=[], pins=[], onAdd, onPin, onEdit }) {
  const [cardDragX, setCardDragX] = useState(0);
  const [cardDragging, setCardDragging] = useState(false);
  const trackRef = useRef(null);
  const cardTouchRef = useRef({ x: null, y: null, dir: null });
  const detailsCacheRef = useRef(new Map());
  // Trackpad horizontal swipe on the card body navigates between places
  // (same as the touch swipe on mobile). Threshold + cooldown ensure a tiny
  // accidental deltaX during vertical reading doesn't skip a place.
  const cardWheelCooldownRef = useRef(0);

  // ESC / arrows
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft" && index > 0) onNavigate(index - 1);
      if (e.key === "ArrowRight" && index < list.length - 1) onNavigate(index + 1);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [index, list.length]);

  // Lock the body scroll while the sheet is open, using the iOS-safe
  // pattern: freeze the body in place with position:fixed and offset
  // (overflow:hidden alone doesn't stop momentum scroll on Safari). We
  // also explicitly leave touch-action default so the carousel inside
  // the sheet can pan normally — setting touch-action:none on body was
  // visibly slowing / hiccuping the card carousel on AI / Popular tabs.
  useEffect(() => {
    const scrollY = window.scrollY;
    const prev = {
      overflow: document.body.style.overflow,
      position: document.body.style.position,
      top: document.body.style.top,
      width: document.body.style.width,
      overscrollBehaviorX: document.documentElement.style.overscrollBehaviorX,
    };
    document.body.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = "100%";
    // overscroll-behavior-x: none tells the browser not to use horizontal
    // overscroll as a navigation gesture (Mac trackpad swipe-back). Set on
    // <html> because Safari ignores it on <body> in some versions. Without
    // this the trackpad still triggers the back animation even though we
    // preventDefault on wheel — the gesture is partly handled at the OS
    // level before our handler sees it.
    document.documentElement.style.overscrollBehaviorX = "none";
    return () => {
      document.body.style.overflow = prev.overflow;
      document.body.style.position = prev.position;
      document.body.style.top = prev.top;
      document.body.style.width = prev.width;
      document.documentElement.style.overscrollBehaviorX = prev.overscrollBehaviorX;
      window.scrollTo(0, scrollY);
    };
  }, []);

  // Card swipe — track manager
  const onCardTouchStart = (e) => {
    cardTouchRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, dir: null };
    setCardDragX(0);
  };
  const finishCardSwipe = (changedX) => {
    const ct = cardTouchRef.current;
    cardTouchRef.current = { x: null, y: null, dir: null };
    setCardDragging(false);
    const dx = changedX === undefined || ct.x === null ? 0 : changedX - ct.x;
    if (ct.dir !== "h") { setCardDragX(0); return; }
    if (dx < -60 && index < list.length - 1) { setCardDragX(0); onNavigate(index + 1); }
    else if (dx > 60 && index > 0) { setCardDragX(0); onNavigate(index - 1); }
    else { setCardDragX(0); }
  };
  const onCardTouchEnd = (e) => {
    if (cardTouchRef.current.x === null) return;
    finishCardSwipe(e.changedTouches[0].clientX);
  };

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const onMove = (e) => {
      const ct = cardTouchRef.current;
      if (ct.x === null) return;
      const dx = e.touches[0].clientX - ct.x;
      const dy = e.touches[0].clientY - ct.y;
      if (ct.dir === null && (Math.abs(dx) > 10 || Math.abs(dy) > 10)) {
        ct.dir = Math.abs(dx) > Math.abs(dy) ? "h" : "v";
      }
      if (ct.dir === "h") {
        let damped = dx;
        if ((dx > 0 && index === 0) || (dx < 0 && index === list.length - 1)) damped = dx * 0.3;
        setCardDragging(true);
        setCardDragX(damped);
        e.preventDefault();
      }
    };
    const onCancel = () => finishCardSwipe(undefined);
    el.addEventListener("touchmove", onMove, { passive: false });
    el.addEventListener("touchcancel", onCancel);
    return () => {
      el.removeEventListener("touchmove", onMove);
      el.removeEventListener("touchcancel", onCancel);
    };
  }, [index, list.length]);

  // Trackpad horizontal wheel on the card track → next/previous place.
  // Native listener with { passive: false } so preventDefault actually
  // stops the browser back/forward gesture. Photo carousel listens
  // separately on its own ref and calls stopPropagation, so wheel on a
  // photo never reaches this handler.
  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const onWheel = (e) => {
      // Lenient horizontal claim — same logic as the photo handler so the
      // browser's swipe-back gesture is denied even on the early frames
      // of a fast swipe where the trackpad direction isn't crisp yet.
      if (Math.abs(e.deltaX) < 5 || Math.abs(e.deltaX) < Math.abs(e.deltaY) * 0.5) return;
      e.preventDefault();
      if (list.length <= 1) return;
      if (Math.abs(e.deltaX) < 30) return;
      const now = Date.now();
      if (now < cardWheelCooldownRef.current) return;
      if (e.deltaX > 0 && index < list.length - 1) {
        onNavigate(index + 1);
        cardWheelCooldownRef.current = now + 450;
      } else if (e.deltaX < 0 && index > 0) {
        onNavigate(index - 1);
        cardWheelCooldownRef.current = now + 450;
      }
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [index, list.length, onNavigate]);

  // Defensive reset on navigation
  useEffect(() => {
    setCardDragX(0);
    setCardDragging(false);
    cardTouchRef.current = { x: null, y: null, dir: null };
  }, [index]);

  const N = Math.max(list.length, 1);
  const currentPlace = list[index] || place;
  const currentName = currentPlace.name;
  const myMem = memories.find(m => m.name?.toLowerCase() === currentName?.toLowerCase());
  const myPin = pins.find(p => p.name?.toLowerCase() === currentName?.toLowerCase());

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",zIndex:500,display:"flex",justifyContent:"center"}}
      onClick={(e)=>{if(e.target===e.currentTarget)onClose();}}>
      <div style={{width:"100%",maxWidth:480,display:"flex",flexDirection:"column",overflow:"hidden",position:"relative",background:COLORS.bg}}>

      {/* Top bar */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 16px",flexShrink:0,background:COLORS.bg,borderBottom:`1px solid ${COLORS.border}`}}>
        <div style={{color:COLORS.muted,fontSize:12,fontFamily:"'DM Sans',sans-serif"}}>
          {list.length > 1 && `${index + 1} / ${list.length}`}
        </div>
        <div style={{display:"flex",gap:12}}>
          {list.length > 1 && <>
            <button onClick={() => index > 0 && onNavigate(index - 1)} disabled={index === 0}
              style={{background:"none",border:`1px solid ${COLORS.border}`,borderRadius:"50%",width:36,height:36,color:index===0?COLORS.muted:COLORS.text,fontSize:18,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",opacity:index===0?0.4:1}}>‹</button>
            <button onClick={() => index < list.length - 1 && onNavigate(index + 1)} disabled={index === list.length - 1}
              style={{background:"none",border:`1px solid ${COLORS.border}`,borderRadius:"50%",width:36,height:36,color:index===list.length-1?COLORS.muted:COLORS.text,fontSize:18,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",opacity:index===list.length-1?0.4:1}}>›</button>
          </>}
          <button onClick={onClose} style={{background:"none",border:`1px solid ${COLORS.border}`,borderRadius:"50%",width:36,height:36,color:COLORS.text,fontSize:18,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
        </div>
      </div>

      {/* Carousel track */}
      <div ref={trackRef} style={{flex:1,overflow:"hidden",position:"relative",overscrollBehaviorX:"none"}}
        onTouchStart={onCardTouchStart} onTouchEnd={onCardTouchEnd}>
        <div style={{
          display:"flex",
          height:"100%",
          width:`${N * 100}%`,
          transform:`translate3d(calc(${-index * (100/N)}% + ${cardDragX}px), 0, 0)`,
          transition: cardDragging ? "none" : "transform 0.32s cubic-bezier(0.22, 1, 0.36, 1)",
          willChange:"transform"
        }}>
          {list.map((p, i) => (
            <div key={(p.google_place_id||p.id||p.name||"")+"-"+i} style={{flex:`0 0 ${100/N}%`,height:"100%",minWidth:0}}>
              <PlaceCardBody
                place={p}
                isActive={i === index}
                isAdjacent={Math.abs(i - index) === 1}
                detailsCacheRef={detailsCacheRef}
                lang={t._lang || "en"}
                COLORS={COLORS} t={t}
                friendMemories={friendMemories} memories={memories} pins={pins}/>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom action bar — always two slots so the bar height is constant */}
      <div style={{position:"absolute",bottom:0,left:0,right:0,padding:"12px 20px",background:COLORS.bg,borderTop:`1px solid ${COLORS.border}`,display:"flex",gap:8}}>
        {/* Left slot: state indicator or pin action */}
        {myMem ? (
          <div style={{flex:1,padding:"12px",background:`${COLORS.accent}11`,border:`1px solid ${COLORS.accent}44`,borderRadius:10,color:COLORS.accent,fontSize:13,fontWeight:600,fontFamily:"'DM Sans',sans-serif",textAlign:"center",display:"flex",alignItems:"center",justifyContent:"center",lineHeight:1.2}}>
            ❤️ {t.placeInFavs||"In your favorites"}
          </div>
        ) : myPin ? (
          <div style={{flex:1,padding:"12px",background:"#6b8cce11",border:"1px solid #6b8cce44",borderRadius:10,color:"#6b8cce",fontSize:13,fontWeight:600,fontFamily:"'DM Sans',sans-serif",textAlign:"center",display:"flex",alignItems:"center",justifyContent:"center",lineHeight:1.2}}>
            📌 {t.placePinned||"Pinned"}
          </div>
        ) : onPin ? (
          <button onClick={() => onPin(currentPlace)}
            style={{flex:1,padding:"12px",background:"#6b8cce11",border:"1px solid #6b8cce44",borderRadius:10,color:"#6b8cce",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",lineHeight:1.2}}>
            📌 {t.pinBtn||"Pin"}
          </button>
        ) : <div style={{flex:1}}/>}

        {/* Right slot: edit if already a favorite, else add */}
        {myMem && onEdit ? (
          <button onClick={() => onEdit(myMem)}
            style={{flex:1,padding:"12px",background:COLORS.card,border:`1px solid ${COLORS.border}`,borderRadius:10,color:COLORS.text,fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",lineHeight:1.2}}>
            {t.editBtn||"✏️ Edit"}
          </button>
        ) : !myMem && onAdd ? (
          <button onClick={() => onAdd(currentPlace)}
            style={{flex:1,padding:"12px",background:`${COLORS.accent}11`,border:`1px solid ${COLORS.accent}44`,borderRadius:10,color:COLORS.accent,fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",lineHeight:1.2}}>
            {t.recoAddFav||"+ Add to my favorites"}
          </button>
        ) : <div style={{flex:1}}/>}
      </div>
      </div>
    </div>
  );
}

function TravelAgent() {
  const [session, setSession] = useState(undefined);
  const [themeKey, setThemeKey] = useState(() => {
    // Restore theme from localStorage immediately to avoid flash
    try {
      const keys = Object.keys(localStorage).filter(k => k.startsWith("outsy_cache_"));
      for (const k of keys) {
        const cached = JSON.parse(localStorage.getItem(k) || "{}");
        if (cached?.prefs?.theme) return cached.prefs.theme;
      }
    } catch {}
    return "light";
  });
  const COLORS = THEMES[themeKey] || THEMES.light; // eslint-disable-line

  // Sync browser theme-color meta tag with current theme
  useEffect(() => {
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', COLORS.bg);
  }, [themeKey]);
  const [showResetModal, setShowResetModal] = useState(false);
  const [tab, _setTab] = useState("reco");
  const [showMenu, setShowMenu] = useState(false);
  const [showProfilePanel, setShowProfilePanel] = useState(false);
  const [prevTab, setPrevTab] = useState("reco");
  const [pins, setPins] = useState([]);
  const scrollPositions = useRef({});

  const getPageScroll = () => {
    const el = document.scrollingElement || document.documentElement || document.body;
    return Math.max(el.scrollTop || 0, window.scrollY || 0);
  };
  const setPageScroll = (y) => {
    if (document.scrollingElement) document.scrollingElement.scrollTop = y;
    if (document.documentElement) document.documentElement.scrollTop = y;
    if (document.body) document.body.scrollTop = y;
    window.scrollTo(0, y);
  };

  // Pre-paint restore.
  useLayoutEffect(() => {
    const target = scrollPositions.current._next;
    if (target === null || target === undefined) return;
    scrollPositions.current._next = null;
    setPageScroll(target);
  }, [tab]);

  // Post-paint + staggered retries, in case async content / image loads /
  // sticky-header recompute drift us away from the saved target.
  useEffect(() => {
    const target = scrollPositions.current._lastTarget;
    if (target === null || target === undefined) return;
    setPageScroll(target);
    const t1 = setTimeout(() => setPageScroll(target), 0);
    const t2 = setTimeout(() => setPageScroll(target), 50);
    const t3 = setTimeout(() => setPageScroll(target), 150);
    const t4 = setTimeout(() => setPageScroll(target), 400);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
  }, [tab]);

  const setTab = (t) => {
    // Save current tab's scroll, queue the destination's saved scroll.
    scrollPositions.current[tab] = getPageScroll();
    const target = scrollPositions.current[t] ?? 0;
    scrollPositions.current._next = target;
    scrollPositions.current._lastTarget = target;
    _setTab(t);
  };
  const [memories, setMemories] = useState([]);
  const [friendMemories, setFriendMemories] = useState([]);
  const [friends, setFriends] = useState([]); // people I follow
  const [followers, setFollowers] = useState([]); // people who follow me
  const [followCounts, setFollowCounts] = useState({}); // {userId: {following, followers}}
  const [pendingIn, setPendingIn] = useState([]);
  const [pendingOut, setPendingOut] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [profile, setProfile] = useState(null);
  const [prefs, setPrefs] = useState(DEFAULT_PREFS);
  const t = useT(prefs.language || "en");
  const lang = prefs.language || "en";
  window._prefCities = prefs.preferredCities || [];
  const [prefsSaved, setPrefsSaved] = useState(false);
  const [toast, setToast] = useState("");
  const [loading, setLoading] = useState(true);
  const [editMemory, setEditMemory] = useState(null);
  const [duplicateAlert, setDuplicateAlert] = useState(null);
  const [formKey, setFormKey] = useState(0);
  useEffect(() => {
    if (tab === "add" && formKey > 0) window.scrollTo({top:0, behavior:"smooth"});
  }, [formKey]);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [duplicatesFound, setDuplicatesFound] = useState(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [showTour, setShowTour] = useState(false);
  const [tourStep, setTourStep] = useState(0);
  const [friendMemoryModal, setFriendMemoryModal] = useState(null);
  const [closedFavoritesAlert, setClosedFavoritesAlert] = useState([]); // [{id, name}] // {memory, friendName} // {id, name}
  const [recoToAdd, setRecoToAdd] = useState(null); // pre-filled form from reco
  const [viewingFriend, setViewingFriend] = useState(null); // { name, memories }

  // Filtres coups de coeur
  const [filterType, setFilterType] = useState(ALL);
  const [filterPrice, setFilterPrice] = useState(ALL);
  const [filterRating, setFilterRating] = useState(ALL);
  const [filterKids, setFilterKids] = useState(false);
  const [friendFilter, setFriendFilter] = useState("all"); // "all" | "mine" | "friends"
  const [memSearch, setMemSearch] = useState("");

  // Reco
  const [recoType, setRecoType] = useState("Restaurant");
  // Reset results when type changes
  useEffect(() => {
    setAiRecos([]);
    setNearbyPlaces([]);
    setHeartMemories([]);
  }, [recoType]);
  const [recoPrice, setRecoPrice] = useState(ALL);
  const [recoKids, setRecoKids] = useState(false);
  const [recoFriendFilter, setRecoFriendFilter] = useState("all"); // all | mine | friends
  const [distance, setDistance] = useState(1000);
  const [locMode, setLocMode] = useState(() => localStorage.getItem("outsy_locMode") || "free");
  const [freeLocation, setFreeLocation] = useState(() => localStorage.getItem("outsy_freeLocation") || "");
  const [gpsLocation, setGpsLocation] = useState(() => localStorage.getItem("outsy_gpsLocation") || "");
  const [gpsReady, setGpsReady] = useState(true); // false while GPS is loading
  const [gpsPermissionState, setGpsPermissionState] = useState("unknown"); // 'granted' | 'denied' | 'prompt' | 'unknown'
  const [gpsErrorCount, setGpsErrorCount] = useState(0);
  const [showGpsHelp, setShowGpsHelp] = useState(false);

  // Proactive permission check via the Permissions API. Lets us know up-front
  // (without firing getCurrentPosition) whether the user has previously
  // denied location, so we can show actionable instructions instead of a
  // mysterious 'Location error' after their tap.
  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.permissions) return;
    let permRef = null;
    navigator.permissions.query({ name: "geolocation" })
      .then(p => {
        permRef = p;
        setGpsPermissionState(p.state);
        p.onchange = () => setGpsPermissionState(p.state);
      })
      .catch(() => {});
    return () => { if (permRef) permRef.onchange = null; };
  }, []);

  // Same proactive check for microphone (Web Speech API dictation). Not all
  // browsers support querying 'microphone' via the Permissions API (notably
  // iOS Safari), so we fall back to detecting 'not-allowed' on the
  // SpeechRecognition error event below.
  const [micPermissionState, setMicPermissionState] = useState("unknown");
  const [showMicHelp, setShowMicHelp] = useState(false);
  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.permissions) return;
    let permRef = null;
    navigator.permissions.query({ name: "microphone" })
      .then(p => {
        permRef = p;
        setMicPermissionState(p.state);
        p.onchange = () => setMicPermissionState(p.state);
      })
      .catch(() => {}); // Not supported (Safari iOS) — we'll detect from SpeechRecognition errors instead
    return () => { if (permRef) permRef.onchange = null; };
  }, []);
  const [recoCoords, setRecoCoords] = useState(() => {
    try { const s = localStorage.getItem("outsy_recoCoords"); return s ? JSON.parse(s) : null; } catch { return null; }
  });
  const recoCoordsRef = useRef(null);
  const [geocoding, setGeocoding] = useState(false);
  const [heartMemories, setHeartMemories] = useState([]);
  const [closedPlaces, setClosedPlaces] = useState([]);
  const closedPlacesRef = useRef([]);
  const tempClosedRef = useRef(new Set());
  const [heartsLoaded, setHeartsLoaded] = useState(false);
  const [heartsKey, setHeartsKey] = useState(0);
  const [nearbyPlaces, setNearbyPlaces] = useState([]);
  const [showNearby, setShowNearby] = useState(false);
  const [heartLoading, setHeartLoading] = useState(false);
  const [aiRecos, setAiRecos] = useState([]);
  const [aiLoading, setAiLoading] = useState(false);
  const abortRef = useRef(null);
  const nbRecosRef = useRef(prefs.nbrecos || "10");
  const [recoLimit, setRecoLimit] = useState(prefs.nbrecos || "10");
  const [recoMood, setRecoMood] = useState("");
  const [recoMoodListening, setRecoMoodListening] = useState(false);
  const moodRecognitionRef = useRef(null);
  const moodFinalTranscriptRef = useRef("");
  const toggleMoodDictation = () => {
    const SR = typeof window !== "undefined" ? (window.SpeechRecognition || window.webkitSpeechRecognition) : null;
    if (!SR) {
      alert(t.recoMoodNotSupported || "La dictée vocale n'est pas disponible dans ce navigateur. Essaie Chrome, Edge ou Safari mobile.");
      return;
    }
    if (recoMoodListening && moodRecognitionRef.current) {
      try { moodRecognitionRef.current.stop(); } catch(_) {}
      return;
    }
    const langMap = { fr: "fr-FR", en: "en-US", es: "es-ES", de: "de-DE", it: "it-IT", pt: "pt-PT", nl: "nl-NL" };
    const rec = new SR();
    rec.lang = langMap[prefs.language] || "en-US";
    rec.interimResults = true;
    rec.continuous = false;
    rec.maxAlternatives = 1;
    moodFinalTranscriptRef.current = recoMood ? recoMood + " " : "";
    rec.onstart = () => setRecoMoodListening(true);
    rec.onresult = (event) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) moodFinalTranscriptRef.current += transcript + " ";
        else interim += transcript;
      }
      setRecoMood((moodFinalTranscriptRef.current + interim).replace(/\s+/g, " ").trim());
    };
    rec.onerror = (e) => {
      setRecoMoodListening(false);
      if (e && (e.error === "not-allowed" || e.error === "service-not-allowed")) {
        setMicPermissionState("denied");
        setShowMicHelp(true);
      }
    };
    rec.onend = () => { setRecoMoodListening(false); moodRecognitionRef.current = null; };
    moodRecognitionRef.current = rec;
    try { rec.start(); } catch(_) { setRecoMoodListening(false); }
  };

  // ── Ask Outsy: natural-language entry that pre-fills the form via Claude ──
  const [outsyQuery, setOutsyQuery] = useState("");
  const [outsyQueryListening, setOutsyQueryListening] = useState(false);
  const [analyzingIntent, setAnalyzingIntent] = useState(false);
  const outsyRecognitionRef = useRef(null);
  const outsyFinalTranscriptRef = useRef("");
  // Refs on the two auto-resizing textareas. We resize them whenever their
  // value changes — covers typing AND voice dictation (which mutates state
  // without firing onChange).
  const outsyTextareaRef = useRef(null);
  const moodTextareaRef = useRef(null);
  const autoSizeTextarea = (el) => {
    if (!el) return;
    el.style.height = "auto";
    el.style.height = el.scrollHeight + "px";
  };
  useEffect(() => { autoSizeTextarea(outsyTextareaRef.current); }, [outsyQuery]);
  useEffect(() => { autoSizeTextarea(moodTextareaRef.current); }, [recoMood]);
  const toggleOutsyDictation = () => {
    const SR = typeof window !== "undefined" ? (window.SpeechRecognition || window.webkitSpeechRecognition) : null;
    if (!SR) {
      alert(t.recoMoodNotSupported || "La dictée vocale n'est pas disponible dans ce navigateur. Essaie Chrome, Edge ou Safari mobile.");
      return;
    }
    if (outsyQueryListening && outsyRecognitionRef.current) {
      try { outsyRecognitionRef.current.stop(); } catch(_) {}
      return;
    }
    const langMap = { fr: "fr-FR", en: "en-US", es: "es-ES", de: "de-DE", it: "it-IT", pt: "pt-PT", nl: "nl-NL" };
    const rec = new SR();
    rec.lang = langMap[prefs.language] || "en-US";
    rec.interimResults = true;
    rec.continuous = false;
    rec.maxAlternatives = 1;
    outsyFinalTranscriptRef.current = outsyQuery ? outsyQuery + " " : "";
    rec.onstart = () => setOutsyQueryListening(true);
    rec.onresult = (event) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) outsyFinalTranscriptRef.current += transcript + " ";
        else interim += transcript;
      }
      setOutsyQuery((outsyFinalTranscriptRef.current + interim).replace(/\s+/g, " ").trim());
    };
    rec.onerror = (e) => {
      setOutsyQueryListening(false);
      if (e && (e.error === "not-allowed" || e.error === "service-not-allowed")) {
        setMicPermissionState("denied");
        setShowMicHelp(true);
      }
    };
    rec.onend = () => { setOutsyQueryListening(false); outsyRecognitionRef.current = null; };
    outsyRecognitionRef.current = rec;
    try { rec.start(); } catch(_) { setOutsyQueryListening(false); }
  };
  const handleAnalyzeQuery = async () => {
    const txt = outsyQuery.trim();
    if (!txt || analyzingIntent) return;
    setAnalyzingIntent(true);
    try {
      const res = await fetch("/api/parse-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: txt, language: prefs.language || "en" }),
      });
      const data = await res.json();
      if (!data.error) {
        // Reset the soft form fields first so the form reflects exactly the
        // current textarea content, never a leftover from a previous parse.
        // Type and location stay if the AI didn't mention them explicitly.
        setRecoMood("");
        setRecoKids(false);
        setRecoPrice(ALL);

        if (data.type) setRecoType(data.type);
        if (Array.isArray(data.moodKeywords) && data.moodKeywords.length > 0) {
          setRecoMood(data.moodKeywords.join(", "));
        }
        if (data.useCurrentLocation === true) {
          // Trigger the same flow as the manual 'Ma position' button so the
          // GPS is actually refreshed (was only setting locMode, GPS stayed
          // stale because gpsReady defaults to true).
          setLocMode("gps");
          setRecoCoords(null);
          recoCoordsRef.current = null;
          setGpsReady(false);
          getGPS();
        }
        if (data.city || data.locationText) {
          // If the user gave a precise address ("55 avenue Hoche, 75008 Paris"),
          // geocode THAT to land at the exact spot — not just the city centre.
          // Otherwise fall back to "city, country" (Springfield, Cambridge etc.
          // are ambiguous without the country).
          const preciseLocation = data.locationText
            ? (data.country ? `${data.locationText}, ${data.country}` : data.locationText)
            : (data.country ? `${data.city}, ${data.country}` : data.city);
          // What we show in the input: keep it readable (the precise version
          // if provided, otherwise the city).
          const labelForInput = data.locationText || (data.country ? `${data.city}, ${data.country}` : data.city);
          setLocMode("free");
          setFreeLocation(labelForInput);
          fetch("/api/places", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "geocode", input: preciseLocation }),
          })
            .then(r => r.json())
            .then(g => { if (g?.lat && g?.lng) { const c = { lat: g.lat, lng: g.lng }; setRecoCoords(c); recoCoordsRef.current = c; setHeartsKey(k => k + 1); } })
            .catch(() => {});
        }
        if (data.kidsFriendly === true) setRecoKids(true);
        else if (data.kidsFriendly === false) setRecoKids(false);
        if (data.priceRange) setRecoPrice(data.priceRange);
        // radiusKm comes in kilometres; the `distance` state is in metres.
        if (data.radiusKm) setDistance(Math.round(data.radiusKm * 1000));
        // Auto-launch the AI search after the form has been filled. We can't
        // call loadRecos() synchronously here because setState is batched —
        // loadRecos would read stale state. Flip a flag and let an effect
        // below pick it up once the new state (incl. async GPS / geocode)
        // has actually committed.
        setPendingAutoSearch(true);
      }
    } catch (_) {}
    setAnalyzingIntent(false);
  };

  // Flag set by handleAnalyzeQuery to trigger the AI search once the form
  // state (and especially the location coords) is ready.
  const [pendingAutoSearch, setPendingAutoSearch] = useState(false);
  useEffect(() => {
    if (!pendingAutoSearch) return;
    if (aiLoading || heartLoading) return; // search already in flight
    if (locMode === "gps" && !gpsReady) return; // wait for GPS to come back
    if (!recoCoords?.lat) return; // wait for coords (GPS or geocode)
    setPendingAutoSearch(false);
    loadRecos(false);
  }, [pendingAutoSearch, recoCoords, gpsReady, locMode, aiLoading, heartLoading]);
  const [usernameError, setUsernameError] = useState("");
  const [pinModal, setPinModal] = useState(null);
  const [placeSheet, setPlaceSheet] = useState(null); // {place, list, index}
  const [pendingPlaceSheet, setPendingPlaceSheet] = useState(null); // restored when add/pin/edit modal closes

  // When the user opens add/pin/edit from inside the place sheet, the sheet
  // is hidden while the modal is open. As soon as the modal closes, restore
  // the sheet at the same card.
  useEffect(() => {
    if (pendingPlaceSheet && !editMemory && !pinModal && !recoToAdd) {
      setPlaceSheet(pendingPlaceSheet);
      setPendingPlaceSheet(null);
    }
  }, [editMemory, pinModal, recoToAdd, pendingPlaceSheet]);

  // Shared mood matching function — used for Popular display, Map, and AI pre-filter
  const MOOD_SYNONYMS = {
    rooftop:["rooftop","roof terrace","toit-terrasse","toit terrasse","sur les toits","terrasse sur le toit","terrasse panoramique","dachterrasse","azotea"],
    terrasse:["outdoor seating","terrace","terrasse","patio","garden/patio","jardin"],
    terrace:["outdoor seating","terrace","terrasse","patio"],
    outdoor:["outdoor seating","terrace","terrasse","patio","garden/patio"],
    enfants:["kids friendly","kids menu","children","famille"],
    kids:["kids friendly","kids menu","children","family"],
    famille:["kids friendly","children","good for groups","family"],
    family:["kids friendly","children","good for groups","family"],
    groups:["good for groups","groupe","collègues"],
    romantic:["romantic","outdoor seating","cocktails","intimate","cozy","fireplace"],
    romantique:["romantic","outdoor seating","cocktails","intimate","cozy","cheminée","fireplace"],
    music:["live music","musique","jazz","dj","concert"],
    musique:["live music","musique","jazz","dj","concert"],
    jazz:["jazz","live music"],
    dj:["dj","dance floor","piste de danse"],
    danser:["dance floor","piste de danse","dj"],
    dance:["dance floor","piste de danse","dj"],
    cocktail:["cocktails"],
    cocktails:["cocktails"],
    wine:["wine"],
    vin:["wine"],
    biere:["beer"],
    beer:["beer"],
    café:["coffee"],
    coffee:["coffee"],
    brunch:["brunch"],
    breakfast:["breakfast","petit-déjeuner"],
    "petit-dejeuner":["breakfast"],
    vegan:["vegetarian options","vegan"],
    vegetarian:["vegetarian options","vegan"],
    végétarien:["vegetarian options","vegan"],
    chien:["dog friendly"],
    dog:["dog friendly"],
    speakeasy:["speakeasy","hidden","secret","souterrain"],
    pool:["pool","piscine","swimming pool"],
    piscine:["pool","piscine","swimming pool"],
    "vue mer":["sea view","ocean view","vue mer","vue sur la mer"],
    "sea view":["sea view","ocean view","vue mer"],
    "vue":["sea view","mountain view","river view","ocean view","vue mer","vue montagne"],
    "view":["sea view","mountain view","river view","ocean view","vue mer"],
    jardin:["garden/patio","garden","jardin"],
    garden:["garden/patio","garden","jardin"],
    cheminée:["fireplace","cheminée"],
    fireplace:["fireplace","cheminée"],
    michelin:["michelin"],
    reservable:["reservable"],
    parking:["free parking","paid parking","valet parking"],
    valet:["valet parking"],
    wheelchair:["wheelchair accessible"],
    accessible:["wheelchair accessible"],
    "non fumeur":["non fumeur","non-smoking"],
  };
  const placeMatchesMood = (p, mood) => {
    if (!mood) return true;
    const moodWords = mood.toLowerCase().split(/[\s,]+/).filter(w=>w.length>2);
    if (moodWords.length === 0) return true;
    // Build searchable text from every available data source. Works for both
    // Google Places results (features, editorialSummary, reviews) AND for the
    // user's own memories / pins (likeTags, why text, pin_note, cuisine).
    const name = (p.name||p.displayName?.text||"").toLowerCase();
    const feats = (p.features||[]).join(" ").toLowerCase();
    const desc = (p.editorialSummary||"").toLowerCase();
    const review = (p.topReview||"").toLowerCase();
    const allReviews = (p.reviews||[]).map(r=>(r.text?.text||"").toLowerCase()).join(" ");
    const likeTags = Array.isArray(p.likeTags) ? p.likeTags.join(" ").toLowerCase() : "";
    const why = (p.why||"").toLowerCase();
    const pinNote = (p.pin_note||"").toLowerCase();
    const cuisine = (p.cuisine||"").toLowerCase();
    const activityType = (p.activityType||p.activity_type||"").toLowerCase();
    // Translate structured boolean flags on user memories to mood keywords.
    // Without this, a place the user saved with the "kids friendly" toggle
    // (m.kidsf = true) wouldn't match a "kids friendly" search because
    // kidsf doesn't appear anywhere in the free-text fields.
    const flags = [
      p.kidsf ? "kids friendly kids family" : "",
    ].filter(Boolean).join(" ");
    const allText = `${name} ${feats} ${desc} ${review} ${allReviews} ${likeTags} ${why} ${pinNote} ${cuisine} ${activityType} ${flags}`;
    return moodWords.some(kw => {
      const syns = MOOD_SYNONYMS[kw];
      if (syns) return syns.some(s => allText.includes(s));
      return allText.includes(kw);
    });
  };

  // Mood-filtered nearby places — single source of truth for map + list.
  // 1) Distance filter: server-side locationBias is permissive (max(radius*1.5, 3km))
  //    so a great place just outside the chosen radius can still surface. But
  //    Google sometimes returns hits WAY outside (e.g. Galeries Lafayette Paris
  //    while user is in London) when the keyword match is strong. Hard-cap the
  //    distance to the AVERAGE of the user's chosen radius and the bias radius.
  // 2) Mood filter: keep only places whose features / reviews / editorial
  //    actually mention the mood keyword.
  // 3) Mood fallback: if the mood filter strips everything (Google didn't
  //    surface any matching place), show the full distance-filtered list.
  const moodFilteredNearby = (() => {
    if (!recoCoords?.lat) return recoMood ? nearbyPlaces.filter(p => placeMatchesMood(p, recoMood)) : nearbyPlaces;
    const biasRadius = Math.max(distance * 1.5, 3000); // mirrors server-side bias
    const maxDistance = (distance + biasRadius) / 2;
    const inRange = nearbyPlaces.filter(p => {
      if (!p.lat || !p.lng) return true; // keep places without coords (rare)
      const R = 6371, dLat = (recoCoords.lat - p.lat) * Math.PI/180, dLng = (recoCoords.lng - p.lng) * Math.PI/180;
      const a = Math.sin(dLat/2)**2 + Math.cos(p.lat*Math.PI/180)*Math.cos(recoCoords.lat*Math.PI/180)*Math.sin(dLng/2)**2;
      const dist = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)) * 1000; // metres
      return dist <= maxDistance;
    });
    if (!recoMood) return inRange;
    const filtered = inRange.filter(p => placeMatchesMood(p, recoMood));
    return filtered.length > 0 ? filtered : inRange;
  })();

  // Hearts / pins shown in the Reco tab also obey the mood filter. Same
  // function as for nearby places — a 'rooftop' search should only surface
  // the user's own rooftop favourites / pins, not all their restaurants.
  const heartsToShow = recoMood
    ? heartMemories.filter(m => placeMatchesMood(m, recoMood))
    : heartMemories;

  // Popular places shown in the UI = mood-filtered nearby MINUS anything
  // already surfaced as an AI reco / favourite / pin. Single source of truth
  // for the chip counter and the actual list rendered below.
  const popularToShow = (() => {
    const aiNames = new Set((aiRecos||[]).map(r=>(r.name||"").toLowerCase()));
    // Exclude every place the user already knows about:
    // - their own favourites (regardless of whether the current mood filter
    //   surfaces them in the Coups de cœur section — without this, a saved
    //   place that doesn't match the active mood reappears in Populaires
    //   with the edit pencil, which is confusing)
    // - friend favourites currently shown in heartsToShow
    // - pinned places
    const myMemNames = new Set((memories||[]).map(m=>(m.name||"").toLowerCase()));
    const heartNames = new Set((heartsToShow||[]).map(m=>(m.name||"").toLowerCase()));
    const pinNames = new Set((pins||[]).map(p=>(p.name||"").toLowerCase()));
    return moodFilteredNearby.filter(p => {
      const lower = (p.name||"").toLowerCase();
      return !aiNames.has(lower) && !myMemNames.has(lower) && !heartNames.has(lower) && !pinNames.has(lower);
    });
  })();

  // Enrich pins with friend data (same as heartMemories enrichment)
  const enrichedPins = pins.map(pin => {
    const key = pin.name?.toLowerCase().trim();
    const friendMatches = friendMemories.filter(fm => fm.name?.toLowerCase().trim() === key);
    return {
      ...pin,
      friendsWhoHave: friendMatches.map(fm => fm.friendName).filter(Boolean),
      friendsData: friendMatches
    };
  });

  // Pins filtered by type + proximity + mood — single source for Map + Reco
  const recoPins = (() => {
    const typed = enrichedPins.filter(p => typeMatches(p.type, recoType));
    let inRange;
    if (!recoCoords?.lat) {
      inRange = typed;
    } else {
      const loc = (locMode === "gps" ? gpsLocation : freeLocation || "").toLowerCase();
      inRange = typed.filter(p => {
        if (p.lat && p.lng) {
          const R = 6371, dLat = (recoCoords.lat - p.lat) * Math.PI/180, dLng = (recoCoords.lng - p.lng) * Math.PI/180;
          const a = Math.sin(dLat/2)**2 + Math.cos(p.lat*Math.PI/180)*Math.cos(recoCoords.lat*Math.PI/180)*Math.sin(dLng/2)**2;
          return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)) <= (distance / 1000);
        }
        if (p.city && loc) {
          const pc = p.city.toLowerCase(), sc = loc.split(",")[0].trim();
          if (pc.length > 2 && sc.length > 2 && !pc.includes(sc) && !sc.includes(pc)) return false;
        }
        return true;
      });
    }
    return recoMood ? inRange.filter(p => placeMatchesMood(p, recoMood)) : inRange;
  })();

  // Shared context for the FitTags grammar — recomputed each render but cheap
  // (Set operations on a few dozen names). Used by every card in the Reco tab
  // so favorites, pins, AI recos and popular all speak the same visual language.
  const fitCtx = (() => {
    const friendNames = new Set((friendMemories||[]).map(m => (m.name||"").toLowerCase()));
    const pinNames = new Set((pins||[]).map(p => (p.name||"").toLowerCase()));
    const ownNames = new Set((memories||[]).map(m => (m.name||"").toLowerCase()));
    const tasteCuisines = new Set(
      (memories||[])
        .filter(m => !m.is_pin && m.rating >= 4)
        .map(m => (m.cuisine || m.activity_type || "").toLowerCase())
        .filter(Boolean)
    );
    return { mood: recoMood, recoType, searchRadius: distance, friendNames, pinNames, ownNames, tasteCuisines };
  })();
  useEffect(() => {
    if (prefs.nbrecos) { setRecoLimit(prefs.nbrecos); nbRecosRef.current = prefs.nbrecos; }
  }, [prefs.nbrecos]);

  // Track email confirmation redirect to prevent auto-login race condition
  const isConfirmRedirect = useRef(false);

  useEffect(() => {
    // Check hash BEFORE Supabase processes it
    const hash = window.location.hash;
    if (hash.includes("type=signup") || hash.includes("type=email")) {
      isConfirmRedirect.current = true;
      // Signal Auth.jsx to show confirmation message (hash will be cleaned before Auth mounts)
      try { sessionStorage.setItem("outsy_email_confirmed", "1"); } catch {}
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (isConfirmRedirect.current) {
        // Email confirmation redirect — sign out and don't set session
        supabase.auth.signOut();
        window.history.replaceState(null, '', window.location.pathname);
        return;
      }
      setSession(session);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (isConfirmRedirect.current) {
        // Ignore all events until sign out completes
        if (_event === "SIGNED_OUT") {
          isConfirmRedirect.current = false;
          setSession(null); // Show login page
        }
        return;
      }
      setSession(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Init ref from localStorage
  useEffect(() => {
    try {
      const s = localStorage.getItem("outsy_recoCoords");
      if (s) recoCoordsRef.current = JSON.parse(s);
    } catch {}
  }, []);

  useEffect(() => {
    if (!session) return;
    const userId = session.user.id;
    const cacheKey = `outsy_cache_${userId}`;

    // Show cached data instantly
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const { profile: p, memories: m, prefs: pr } = JSON.parse(cached);
        if (p) setProfile(p);
        if (m) setMemories(m);
        if (pr) { setPrefs({ ...DEFAULT_PREFS, ...pr, firstName: p?.first_name || "", lastName: p?.last_name || "", username: p?.username || "", is_private: p?.is_private || false, avatar_url: p?.avatar_url || "" }); if (pr.theme) setThemeKey(pr.theme); }
        setLoading(false); // Show UI immediately with cached data
      }
    } catch {}

    // Then refresh from Supabase in background
    const load = async () => {
      // Force Supabase client to sync its internal auth state (prevents 401 race on first write)
      const { data: { session: freshSession } } = await supabase.auth.getSession();
      if (!freshSession) return;
      if (!localStorage.getItem(cacheKey)) setLoading(true);
      const { data: prof } = await supabase.from('profiles').select('*').eq('user_id', userId).maybeSingle();
      if (prof) {
        setProfile(prof);
        // Sync profile name with auth metadata if they differ (e.g. after account recreation)
        const meta = session.user.user_metadata || {};
        if (meta.first_name && meta.first_name !== prof.first_name) {
          const updated = {...prof, first_name: meta.first_name, last_name: meta.last_name || prof.last_name};
          await supabase.from('profiles').update({first_name: updated.first_name, last_name: updated.last_name}).eq('user_id', userId);
          setProfile(updated);
        }
      } else {
        // Auto-create profile on first login using auth metadata (source of truth from signup)
        const meta = session.user.user_metadata || {};
        const email = session.user.email || "";
        const firstName = meta.first_name || email.split("@")[0] || "";
        const lastName = meta.last_name || "";
        const uname = meta.username || "";
        const newProfile = { user_id: userId, first_name: firstName, last_name: lastName, email, username: uname || null };
        const { error: upsertErr } = await supabase.from('profiles').upsert(newProfile);
        if (upsertErr) {
          // Retry once after a brief delay (auth token race condition)
          console.warn('Profile upsert failed, retrying...', upsertErr.message);
          await new Promise(r => setTimeout(r, 500));
          await supabase.from('profiles').upsert(newProfile);
        }
        setProfile(newProfile);
        // Also sync prefs name
        setPrefs(p => ({...p, firstName, lastName}));

        // New account detected — clear stale localStorage flags from any previous account
        // This ensures onboarding + tour will trigger fresh
        localStorage.removeItem("outsy_onboarding_done");
        localStorage.removeItem("outsy_tour_done");
        localStorage.removeItem("outsy_enrich_tried");
        // Clear any old caches (different user IDs)
        Object.keys(localStorage).filter(k => k.startsWith("outsy_cache_") && k !== cacheKey).forEach(k => localStorage.removeItem(k));
      }
      const { data: mems } = await supabase.from('memories').select('*').eq('user_id', userId).order('ts', { ascending: false });
      if (mems) {
        // Auto-migrate legacy "Bar / Café" to "Bar" or "Café"
        const cafeWords = ['café','cafe','coffee','bakery','tea','pâtisserie','patisserie','brunch','boulangerie'];
        const toMigrate = mems.filter(m => m.type === "Bar / Café");
        if (toMigrate.length > 0) {
          for (const m of toMigrate) {
            const nameLower = (m.name||"").toLowerCase();
            const cuisineLower = (m.cuisine||"").toLowerCase();
            const isCafe = cafeWords.some(w => nameLower.includes(w) || cuisineLower.includes(w));
            const newType = isCafe ? "Café" : "Bar";
            m.type = newType;
            supabase.from('memories').update({type: newType}).eq('id', m.id).eq('user_id', userId);
          }
        }
        setMemories(mems.filter(m => !m.is_pin));
        const loadedPins = mems.filter(m => m.is_pin);
        setPins(loadedPins);
        
        // Backfill lat/lng for pins missing coordinates
        const pinsToGeocode = loadedPins.filter(p => !p.lat && !p.lng && (p.google_place_id || p.address || p.city));
        if (pinsToGeocode.length > 0) {
          Promise.all(pinsToGeocode.map(async pin => {
            try {
              let lat, lng;
              if (pin.google_place_id) {
                // Use Place Details (most accurate)
                const res = await fetch("/api/places", { method: "POST", headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ action: "details", placeId: pin.google_place_id }) });
                const details = await res.json();
                if (details.location) { lat = details.location.latitude; lng = details.location.longitude; }
              }
              if (!lat && (pin.address || pin.city)) {
                // Fallback: geocode by address
                const query = pin.name + ", " + (pin.address || [pin.city, pin.country].filter(Boolean).join(", "));
                const res = await fetch("/api/places", { method: "POST", headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ action: "geocode", input: query }) });
                const geo = await res.json();
                if (geo.lat) { lat = geo.lat; lng = geo.lng; }
              }
              if (lat && lng) {
                await supabase.from('memories').update({ lat, lng }).eq('id', pin.id).eq('user_id', userId);
                return { ...pin, lat, lng };
              }
            } catch(e) { console.warn("Pin geocode error:", pin.name, e); }
            return pin;
          })).then(updated => {
            setPins(prev => prev.map(p => updated.find(u => u.id === p.id) || p));
          });
        }
      }

      // Detect duplicates by name (case-insensitive, trimmed)
      if (mems && mems.length > 0) {
        const groups = new Map();
        mems.forEach(m => {
          const key = m.name?.toLowerCase().trim();
          if (!key) return;
          if (!groups.has(key)) groups.set(key, []);
          groups.get(key).push(m);
        });
        const dups = [...groups.values()].filter(g => g.length > 1);
        if (dups.length > 0) setDuplicatesFound(dups);
      }

      // Auto-enrich memories missing google_place_id/address/cuisine - one-time per place
      if (mems && mems.length > 0) {
        const triedSet = new Set(JSON.parse(localStorage.getItem("outsy_enrich_tried") || "[]"));
        const toEnrich = mems.filter(m =>
          (!m.google_place_id || !m.address || !m.cuisine) &&
          m.google_place_id !== "NOT_FOUND" &&
          !triedSet.has(`${m.id}`)
        );
        if (toEnrich.length > 0) {
          // Fetch user lang first (don't rely on `pref` declared later)
          const userLang = (prefs && prefs.language) || 'en';
          (async () => {
            try {
              // Batch verify - up to 30 places at once. Build query with city/country for better matching.
              const batch = toEnrich.slice(0, 30);
              const r = await fetch('/api/places', {
                method: 'POST', headers: {'Content-Type':'application/json'},
                body: JSON.stringify({
                  action: 'verify',
                  places: batch.map(m => ({
                    name: m.name,
                    address: [m.address, m.city, m.country].filter(Boolean).join(', '),
                    googlePlaceId: (m.google_place_id&&m.google_place_id!=="NOT_FOUND")?m.google_place_id:''
                  })),
                  lang: userLang
                })
              });
              const data = await r.json();
              const verifyMap = {};
              (data.results||[]).forEach(v => { verifyMap[v.name.toLowerCase()] = v; });
              const newlyTried = new Set(triedSet);
              for (const m of batch) {
                const v = verifyMap[m.name.toLowerCase()];
                newlyTried.add(`${m.id}`); // mark as tried regardless of success
                if (!v || !v.placeId) {
                  // No result from Google - mark NOT_FOUND so we don't retry
                  if (!m.google_place_id) {
                    await supabase.from('memories').update({google_place_id:"NOT_FOUND"}).eq('id',m.id).eq('user_id',userId);
                    setMemories(prev => prev.map(x => x.id===m.id ? {...x,google_place_id:"NOT_FOUND"} : x));
                  }
                  continue;
                }
                const updates = {};
                if (!m.google_place_id) updates.google_place_id = v.placeId;
                if (!m.address && v.address) updates.address = v.address;
                if (!m.cuisine && v.cuisine) updates.cuisine = v.cuisine;
                if (Object.keys(updates).length > 0) {
                  await supabase.from('memories').update(updates).eq('id', m.id).eq('user_id', userId);
                  setMemories(prev => prev.map(x => x.id===m.id ? {...x,...updates} : x));
                }
              }
              localStorage.setItem("outsy_enrich_tried", JSON.stringify([...newlyTried]));
            } catch(e) { console.error('Enrich error:', e); }
          })();
        }
      }
      const { data: pref } = await supabase.from('preferences').select('*').eq('user_id', userId).maybeSingle();
      if (pref) { setPrefs({ ...DEFAULT_PREFS, ...pref, firstName: prof?.first_name || "", lastName: prof?.last_name || "", username: prof?.username || "", is_private: prof?.is_private || false, avatar_url: prof?.avatar_url || "" }); if(pref.theme) setThemeKey(pref.theme); }
      // Save to cache
      try { localStorage.setItem(cacheKey, JSON.stringify({ profile: prof, memories: mems, prefs: pref })); } catch {}
      await loadFollows(userId);
      // Load community-reported closed places
      try {
        const { data: closed } = await supabase.from('closed_places').select('name,place_id,address');
        if (closed) { const names = closed.map(p=>p.name); setClosedPlaces(names); closedPlacesRef.current = names; }
      } catch {}
      setLoading(false);

      // Trigger onboarding for first-time users
      // No prefs in DB = new user → clear any stale localStorage flags from previous accounts
      if (!pref) {
        localStorage.removeItem("outsy_onboarding_done");
        localStorage.removeItem("outsy_tour_done");
        // Clear any stale cache for this user (in case Supabase reused the same user_id)
        localStorage.removeItem(cacheKey);
        setShowOnboarding(true);
        // Pre-fill prefs from auth metadata — start from clean DEFAULT_PREFS (not spread from old state)
        const meta = session.user.user_metadata || {};
        const fn = meta.first_name || prof?.first_name || "";
        const ln = meta.last_name || prof?.last_name || "";
        setPrefs({ ...DEFAULT_PREFS, firstName: fn, lastName: ln, username: meta.username || "" });
      } else if (!pref.tour_done && !localStorage.getItem("outsy_tour_done")) {
        // Tour not completed: neither in DB nor localStorage
        setShowTour(true);
      }
    };
    load();
  }, [session]);

  const loadFollows = async (userId) => {
    // Following: people I follow (I am requester, they are addressee, status=accepted)
    const { data: followingData } = await supabase.from('friendships').select('*, profiles!friendships_addressee_id_fkey(*)').eq('requester_id', userId).eq('status', 'accepted');
    const followingList = (followingData||[]).map(f=>({id:f.id,profile:f.profiles,followedUserId:f.addressee_id}));
    setFriends(followingList);

    // Followers: people who follow me (they are requester, I am addressee, status=accepted)
    const { data: followersData } = await supabase.from('friendships').select('*, profiles!friendships_requester_id_fkey(*)').eq('addressee_id', userId).eq('status', 'accepted');
    const followersList = (followersData||[]).map(f=>({id:f.id,profile:f.profiles,followerUserId:f.requester_id}));
    setFollowers(followersList);

    // Fetch follower/following counts for all related users
    const allRelatedIds = [...new Set([
      ...followingList.map(f=>f.followedUserId),
      ...followersList.map(f=>f.followerUserId)
    ])];
    if (allRelatedIds.length > 0) {
      const [{ data: asReq }, { data: asAddr }] = await Promise.all([
        supabase.from('friendships').select('requester_id').in('requester_id', allRelatedIds).eq('status', 'accepted'),
        supabase.from('friendships').select('addressee_id').in('addressee_id', allRelatedIds).eq('status', 'accepted'),
      ]);
      const counts = {};
      allRelatedIds.forEach(id => { counts[id] = { following: 0, followers: 0 }; });
      (asReq||[]).forEach(r => { if (counts[r.requester_id]) counts[r.requester_id].following++; });
      (asAddr||[]).forEach(r => { if (counts[r.addressee_id]) counts[r.addressee_id].followers++; });
      setFollowCounts(counts);
    }

    if (followingList.length>0) {
      const followedIds = followingList.map(f=>f.followedUserId);
      const { data: fMems } = await supabase.from('memories').select('*').in('user_id', followedIds).order('ts', { ascending: false });
      if (fMems) {
        const { data: fProfiles } = await supabase.from('profiles').select('user_id, username, avatar_url').in('user_id', followedIds);
        const profileMap = {};
        (fProfiles||[]).forEach(p => { profileMap[p.user_id] = p; });
        setFriendMemories(fMems.map(m => {
          const p = profileMap[m.user_id];
          return { ...m, friendName: p ? `@${p.username}` : "?" };
        }));
      }
    }
    // Pending follow requests I received (for private accounts)
    const { data: inReqs } = await supabase.from('friendships').select('*, profiles!friendships_requester_id_fkey(*)').eq('addressee_id', userId).eq('status', 'pending');
    setPendingIn(inReqs||[]);
    // Pending follow requests I sent
    const { data: outReqs } = await supabase.from('friendships').select('*, profiles!friendships_addressee_id_fkey(*)').eq('requester_id', userId).eq('status', 'pending');
    setPendingOut(outReqs||[]);
  };

  useEffect(() => {
    if (heartsKey > 0) {
      const coords = recoCoordsRef.current;
      if (coords?.lat) loadHearts(coords, nbRecosRef.current);
    }
  }, [heartsKey]); // eslint-disable-line

  if (session === undefined) return null;
  if (!session) return <Auth />;
  const userId = session.user.id;

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 2200); };

  const handleAdd = async (form) => {
    const duplicate = memories.find(m => m.name.toLowerCase()===form.name.toLowerCase());
    if (duplicate) {
      setDuplicateAlert({ existing: duplicate, newForm: form });
      return;
    }
    const { isMine:_a, friendName:_b, distanceKm:_c, _lat, _lng, friendsData:_d, friendsWhoHave:_e, profiles:_f, user_id:_g, id:_h, ts:_ts, openNow:_on, openingHours:_oh, googleRating:_gr, activityType, priceSource:_ps, ...cleanForm } = form;
    const entry = { ...cleanForm, activity_type: activityType||null, id: Date.now(), ts: Date.now(), user_id: userId };
    const { error } = await supabase.from('memories').insert(entry);
    if (!error) {
      setMemories(prev=>[entry,...prev]); showToast(t.toastSaved); setFormKey(k=>k+1);
      // Auto-remove pin if converting to favorite
      const matchingPin = pins.find(p => p.name.toLowerCase() === form.name.toLowerCase());
      if (matchingPin) {
        await supabase.from('memories').delete().eq('id', matchingPin.id).eq('user_id', userId);
        setPins(prev => prev.filter(p => p.id !== matchingPin.id));
      }
    }
  };

  const handleUpdate = async (form) => {
    // Clean form - only send DB fields
    const { isMine, friendName, distanceKm, _lat, _lng, friendsData, friendsWhoHave, openNow, openingHours, googleRating, cuisine: _cu, profiles, activityType, priceSource: _ps, ...cleanForm } = form;
    const updateData = { ...cleanForm, activity_type: activityType||null };
    const { error } = await supabase.from('memories').update(updateData).eq('id', editMemory.id).eq('user_id', userId);
    if (!error) {
      setMemories(prev=>prev.map(m=>m.id===editMemory.id?{...m,...updateData}:m));
      setHeartMemories(prev=>prev.map(m=>m.id===editMemory.id?{...m,...updateData}:m));
      setEditMemory(null); showToast(t.toastUpdated);
    }
    else { console.error('Update error:', error); showToast('❌ ' + error.message); }
  };

  const handleDuplicateUpdate = async () => {
    const { newForm, existing } = duplicateAlert;
    const merged = { ...existing, ...newForm, id: existing.id, ts: existing.ts, user_id: userId };
    const { isMine, friendName, distanceKm, _lat, _lng, profiles, friendsData, friendsWhoHave, activityType, priceSource: _ps, ...updated } = merged;
    const updatedWithActivity = { ...updated, activity_type: activityType||null };
    await supabase.from('memories').update(updatedWithActivity).eq('id', existing.id).eq('user_id', userId);
    setMemories(prev=>prev.map(m=>m.id===existing.id?updatedWithActivity:m));
    setDuplicateAlert(null); showToast(t.toastUpdated); setFormKey(k=>k+1);
  };

  const deleteMemory = async (id) => {
    await supabase.from('memories').delete().eq('id', id).eq('user_id', userId);
    setMemories(prev=>{ const next=prev.filter(m=>m.id!==id); try{localStorage.removeItem(`outsy_cache_${userId}`);}catch{} return next; });
  };

  const savePrefs = async () => {
    const { firstName, lastName, username, is_private, avatar_url, ...dbPrefs } = prefs;
    // Validate username if changed
    if (username) {
      if (!/^[a-z0-9_.]{3,20}$/.test(username)) { showToast("❌ " + (t.errorUsernameInvalid||"Invalid username")); return; }
      const { data: existing } = await supabase.from('profiles').select('user_id').eq('username', username).neq('user_id', userId).maybeSingle();
      if (existing) { showToast("❌ " + (t.errorUsernameTaken||"Username already taken")); return; }
    }
    await supabase.from('preferences').upsert({ ...dbPrefs, user_id: userId });
    await supabase.from('profiles').upsert({ user_id: userId, first_name: firstName, last_name: lastName, email: session.user.email, username: username || null, is_private: is_private || false, avatar_url: avatar_url || null });
    setPrefsSaved(true); setTimeout(()=>{setPrefsSaved(false);setShowProfilePanel(false);}, 1500);
  };

  const searchFriends = async () => {
    if (!searchQuery.trim()) return;
    const q = searchQuery.trim().toLowerCase().replace(/^@/, "");
    if (!q) return;
    // Search by username (primary) or email
    const isEmail = q.includes("@") && q.includes(".");
    let results = [];
    if (isEmail) {
      const res = await fetch("/api/friends", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "search", userId, targetEmail: searchQuery }) });
      const data = await res.json();
      results = data.users || [];
    } else {
      // Username or name search
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, username, first_name, last_name, is_private, avatar_url')
        .or(`username.ilike.%${q}%,first_name.ilike.%${q}%,last_name.ilike.%${q}%`)
        .neq('user_id', userId)
        .limit(10);
      results = (profiles || []).map(p => ({
        user_id: p.user_id,
        username: p.username,
        first_name: p.first_name,
        last_name: p.last_name,
        is_private: p.is_private || false,
        avatar_url: p.avatar_url || ""
      }));
    }
    setSearchResults(results);
  };

  const sendFollowRequest = async (targetUserId, isTargetPrivate) => {
    const status = isTargetPrivate ? 'pending' : 'accepted';
    await supabase.from('friendships').insert({ requester_id: userId, addressee_id: targetUserId, status });
    showToast(isTargetPrivate ? (t.followSent||"Request sent") : (t.followAlready||"Following"));
    setSearchResults([]); setSearchQuery(""); await loadFollows(userId);
  };

  const acceptFollowRequest = async (friendshipId) => {
    await supabase.from('friendships').update({ status: 'accepted' }).eq('id', friendshipId);
    showToast("✓"); await loadFollows(userId);
  };

  const declineFollowRequest = async (friendshipId) => {
    await supabase.from('friendships').delete().eq('id', friendshipId);
    await loadFollows(userId);
  };

  const unfollow = async (follow) => {
    const name = follow.profile?.username ? `@${follow.profile.username}` : "?";
    if (!window.confirm(`${t.followUnfollow||"Unfollow"} ${name} ?`)) return;
    await supabase.from('friendships').delete().eq('id', follow.id);
    await loadFollows(userId);
    showToast(`✓ ${t.followUnfollow||"Unfollowed"}`);
  };

  const viewFollowMemories = (follow) => {
    const fMems = friendMemories.filter(m => m.user_id === follow.followedUserId);
    const name = follow.profile?.username ? `@${follow.profile.username}` : "?";
    setViewingFriend({ name, memories: fMems });
  };

  const pinPlace = async (place, note="") => {
    const existing = pins.find(p => p.name?.toLowerCase() === place.name?.toLowerCase());
    if (existing) { showToast("📌 " + (t.pinAlready||"Already pinned")); return; }
    const inFavs = memories.find(m => m.name?.toLowerCase() === place.name?.toLowerCase());
    if (inFavs) { showToast("❤️ " + (t.pinAlreadyFav||"Already in favorites")); return; }
    const entry = {
      id: Date.now(), ts: Date.now(), user_id: userId, is_pin: true,
      name: place.name, type: place.type || recoType, price: place.price || "",
      city: place.city || "", country: place.country || "",
      address: place.address || "", cuisine: place.cuisine || "",
      activity_type: place.activityType || place.activity_type || "",
      google_place_id: place.google_place_id || place.googlePlaceId || place.id || "",
      pin_note: note || "", rating: 0,
      lat: place.lat || place.location?.latitude || null,
      lng: place.lng || place.location?.longitude || null
    };
    const { error } = await supabase.from('memories').insert(entry);
    if (!error) { setPins(prev=>[entry,...prev]); showToast("📌 " + (t.pinSaved||"Pinned!")); }
    else { console.error("Pin error:", error); showToast("❌ " + error.message); }
  };

  const openPinModal = (place) => {
    const existing = pins.find(p => p.name?.toLowerCase() === place.name?.toLowerCase());
    if (existing) { showToast("📌 " + (t.pinAlready||"Already pinned")); return; }
    const inFavs = memories.find(m => m.name?.toLowerCase() === place.name?.toLowerCase());
    if (inFavs) { showToast("❤️ " + (t.pinAlreadyFav||"Already in favorites")); return; }
    setPinModal({ place, note: "" });
  };

  const openPlaceSheet = (place, list) => {
    const idx = list.findIndex(p => (p.name||"").toLowerCase() === (place.name||"").toLowerCase());
    setPlaceSheet({ list, index: idx >= 0 ? idx : 0 });
  };

  const logout = () => supabase.auth.signOut();

  const cancelSearch = () => {
    if (abortRef.current) abortRef.current.abort();
    setHeartLoading(false);
    setAiLoading(false);
    setGeocoding(false);
  };



  const sendResetEmail = async (email) => {
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    });
  };

  const getGPS = () => {
    if (!navigator.geolocation) return;
    setGpsLocation("Localisation en cours...");
    navigator.geolocation.getCurrentPosition(async pos => {
      const { latitude: lat, longitude: lng } = pos.coords;
      setRecoCoords({ lat, lng });
      recoCoordsRef.current = { lat, lng };
      localStorage.setItem('outsy_recoCoords', JSON.stringify({ lat, lng }));
      // Reverse geocode pour avoir une adresse précise
      try {
        const res = await fetch("/api/places", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "geocode", input: `${lat},${lng}` })
        });
        const data = await res.json();
        if (data.lat) {
          // Utiliser l'API Nominatim pour adresse complète
          const r = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`);
          const d = await r.json();
          const road = d.address?.road || "";
          const number = d.address?.house_number || "";
          const city = d.address?.city || d.address?.town || d.address?.village || "";
          const country = d.address?.country || "";
          const full = [number, road, city, country].filter(Boolean).join(", ");
          setGpsLocation(full || `${lat.toFixed(5)}, ${lng.toFixed(5)}`);
          setGpsReady(true);
          setHeartsKey(k=>k+1);
        }
      } catch {
        setGpsLocation(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
        setGpsReady(true);
      }
    }, (err) => {
      // Map the standard GeolocationPositionError code to a clearer message
      let msg = t.gpsError || "Location error";
      const isDenial = err && err.code === 1;
      if (err && typeof err.code === "number") {
        if (err.code === 1) msg = t.gpsErrorDenied || "Permission refusée — voir Comment activer ?";
        else if (err.code === 2) msg = t.gpsErrorUnavailable || "Position indisponible — vérifie le GPS / la connexion";
        else if (err.code === 3) msg = t.gpsErrorTimeout || "Délai dépassé — réessaie";
      }
      setGpsLocation(msg);
      setGpsReady(true);
      if (isDenial) setGpsPermissionState("denied");

      // Count failures and after 2 denial errors auto-fallback to manual
      // mode so the user is never stuck without a way to set a location.
      const newCount = gpsErrorCount + 1;
      setGpsErrorCount(newCount);
      if (isDenial && newCount >= 2) {
        setLocMode("free");
        showToast("📍 " + (t.gpsFallbackToManual || "Saisie manuelle activée — tu pourras retenter le GPS plus tard"));
      } else if (isDenial) {
        setShowGpsHelp(true);
      }
    }, { enableHighAccuracy: true, timeout: 10000 });
  };

  const geocodeLocation = async (address) => {
    try {
      const res = await fetch("/api/places", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "geocode", input: address }) });
      const data = await res.json();
      if (data.lat) return { lat: data.lat, lng: data.lng };
    } catch {}
    return null;
  };

  const loadHearts = async (coordsToUse, nbRecosOverride=null) => {
    const myMemoriesMap = new Map(memories.map(m=>[m.name.toLowerCase(), m]));
    // Places I own with rating >= 3
    const myGoodNames = new Set(memories.filter(m=>m.rating>=3).map(m=>m.name.toLowerCase()));
    // Places I own with rating < 3 (too low) - must be excluded even if friend rated it well
    const myBadNames = new Set(memories.filter(m=>m.rating>0&&m.rating<3).map(m=>m.name.toLowerCase()));

    const candidates = [
      // My memories with rating >= 3
      ...(recoFriendFilter!=="friends" ? memories.filter(m=>m.rating>=3) : []),
      // Friend memories:
      // - exclude any place I own with rating < 3 (my low rating wins)
      // - if "friends only": only standalone places (not in my favorites at all) with rating >= 3
      // - if "all": attach to my good places + standalone places with rating >= 3
      ...(recoFriendFilter!=="mine" ? friendMemories.filter(m => {
        const key = m.name.toLowerCase();
        if (myBadNames.has(key)) return false; // I rated it badly, never show
        if (recoFriendFilter==="friends") return !myMemoriesMap.has(key) && m.rating>=3;
        return myGoodNames.has(key) || m.rating>=3;
      }) : [])
    ]
      .filter(m=>typeMatches(m.type, recoType))
      .filter(m=>recoPrice===ALL||m.price===recoPrice)
      .filter(m=>!recoKids||m.kidsf);
    let heartMems = candidates.map(m=>({...m,isMine:!m.friendName}));
    if (coordsToUse && candidates.length > 0) {
      try {
        const toGeocode = candidates.filter(m=>m.city||m.name);
        if (toGeocode.length > 0) {
          const geoRes = await fetch("/api/geocode-memories", {
            method:"POST", headers:{"Content-Type":"application/json"},
            body: JSON.stringify({ places: toGeocode.map(m=>({id:m.id,name:m.name,city:m.city,country:m.country,address:m.address||""})) })
          });
          const geoData = await geoRes.json();
          const coordsMap = {};
          (geoData.results||[]).forEach(r=>{ if(r.lat) coordsMap[String(r.id)]={lat:r.lat,lng:r.lng}; });
          heartMems = heartMems.map(m=>{
            const c = coordsMap[String(m.id)];
            if (c) { const distKm = calcDistance(coordsToUse.lat, coordsToUse.lng, c.lat, c.lng); return {...m,_lat:c.lat,_lng:c.lng,distanceKm:distKm}; }
            return m;
          });
          const withCoords = heartMems.filter(m=>m.distanceKm!==undefined);
          if (withCoords.length > 0) {
            const inRadius = withCoords.filter(m=>m.distanceKm*1000<=distance);
            heartMems = inRadius.sort((a,b)=>b.rating-a.rating||a.distanceKm-b.distanceKm);
          } else { heartMems = heartMems.sort((a,b)=>b.rating-a.rating); }
        }
      } catch { heartMems = heartMems.sort((a,b)=>b.rating-a.rating); }
    } else { heartMems = heartMems.sort((a,b)=>b.rating-a.rating); }
    // Deduplicate by name - keep isMine version if exists
    const deduped = [];
    const seenNamesMap = new Map();
    // First pass: add own memories, initialize friendsWhoHave
    heartMems.filter(m=>m.isMine).forEach(m => {
      const key = m.name.toLowerCase();
      if (!seenNamesMap.has(key)) {
        const entry = {...m, friendsWhoHave:[], friendsData:[]};
        seenNamesMap.set(key, entry);
        deduped.push(entry);
      }
    });
    // Second pass: add friend-only memories or attach to existing
    heartMems.filter(m=>!m.isMine).forEach(m => {
      const key = m.name.toLowerCase();
      if (!seenNamesMap.has(key)) {
        const entry = {...m, friendsWhoHave:[m.friendName].filter(Boolean), friendsData:[m]};
        seenNamesMap.set(key, entry);
        deduped.push(entry);
      } else {
        const existing = seenNamesMap.get(key);
        if (m.friendName && !existing.friendsWhoHave.includes(m.friendName)) {
          existing.friendsWhoHave.push(m.friendName);
          existing.friendsData.push(m);
        }
      }
    });

    // Sort deduped by effective display rating (same logic as MemoryCard)
    const getDisplayRating = (m) => {
      if (m.isMine && m.rating > 0) return m.rating;
      const rated = (m.friendsData||[]).filter(f => f.rating > 0);
      if (rated.length > 0) return rated.reduce((s,f) => s + f.rating, 0) / rated.length;
      return m.rating || 0;
    };
    deduped.sort((a,b) => {
      if (a.distanceKm !== undefined && b.distanceKm !== undefined) {
        return getDisplayRating(b) - getDisplayRating(a) || a.distanceKm - b.distanceKm;
      }
      return getDisplayRating(b) - getDisplayRating(a);
    });

    const nbHearts = (() => {
      const val = nbRecosOverride ?? recoLimit;
      return parseInt(val) || 10;
    })();
    const allClosedNames = new Set([
      ...closedPlacesRef.current.map(n=>n.toLowerCase()),
      ...tempClosedRef.current
    ]);
    const heartSlice = deduped.filter(m=>!allClosedNames.has(m.name.toLowerCase())).slice(0, nbHearts);
    setHeartMemories(heartSlice);
    setHeartsLoaded(true);

    // Verify all hearts are still open (not just isMine)
    const toVerify = heartSlice.filter(m=>m.name);
    if (toVerify.length > 0) {
      try {
        const verifyRes = await fetch("/api/places", {
          method:"POST", headers:{"Content-Type":"application/json"},
          body: JSON.stringify({ action:"verify", places: toVerify.map(m=>({name:m.name,address:m.address||""})) })
        });
        const verifyData = await verifyRes.json();
        const tempClosedNames = new Set((verifyData.results||[])
          .filter(r=>r.businessStatus==="CLOSED_TEMPORARILY")
          .map(r=>r.name.toLowerCase()));
        if (tempClosedNames.size > 0) {
          tempClosedNames.forEach(n => tempClosedRef.current.add(n));
          setHeartMemories(prev=>prev.filter(m=>!tempClosedNames.has(m.name.toLowerCase())));
        }
        const closed = (verifyData.results||[]).filter(r=>r.businessStatus==="CLOSED_PERMANENTLY");
        if (closed.length > 0) {
          const closedFavs = closed.map(r=>{
            const mem = toVerify.find(m=>m.name.toLowerCase()===r.name.toLowerCase());
            return mem && mem.isMine ? {id:mem.id, name:mem.name, placeId:r.placeId} : null;
          }).filter(Boolean);
          if (closedFavs.length > 0) setClosedFavoritesAlert(closedFavs);
        }
        // Enrich heartMemories with real openNow + store missing data (address, cuisine, place_id)
        const verifyMap = {};
        (verifyData.results||[]).forEach(r=>{ verifyMap[r.name.toLowerCase()] = r; });
        setHeartMemories(prev=>prev.map(m=>{
          const v = verifyMap[m.name.toLowerCase()];
          if (!v) return m;
          // Build update payload for missing fields (treat NOT_FOUND as missing too)
          const updates = {};
          if (v.placeId && (!m.google_place_id || m.google_place_id==="NOT_FOUND")) updates.google_place_id = v.placeId;
          if (v.address && !m.address) updates.address = v.address;
          if (v.cuisine && !m.cuisine) updates.cuisine = v.cuisine;
          if (Object.keys(updates).length > 0 && m.user_id===userId) {
            supabase.from('memories').update(updates).eq('id',m.id).then(()=>{
              setMemories(prev2=>prev2.map(x=>x.id===m.id?{...x,...updates}:x));
            });
          }
          return {...m, ...updates, openNow:v.openNow??m.openNow, openingHours:v.openingHours||m.openingHours||null};
        }));
      } catch(e) { console.error("Verify favorites error:", e); }
    }
  };

  const loadRecos = async (skipAI = false) => {
    const locationLabel = locMode==="gps" ? gpsLocation : freeLocation;
    if (!locationLabel) return;
    // Create new abort controller for this search
    abortRef.current = new AbortController();
    const signal = abortRef.current.signal;
    setGeocoding(true);
    // GPS: use cached coords. Free text: always geocode fresh
    let coords;
    if (locMode === "gps" && recoCoordsRef.current?.lat) {
      coords = recoCoordsRef.current;
    } else {
      coords = await geocodeLocation(locationLabel);
      if (!coords) { setGeocoding(false); return; }
      setRecoCoords(coords);
      recoCoordsRef.current = coords;
      localStorage.setItem('outsy_recoCoords', JSON.stringify(coords));
    }
    setGeocoding(false);

    // DEBUG: initialize debug object early so it's always available
    if (typeof window !== "undefined") {
      window.__outsy = window.__outsy || {};
      window.__outsy.searchCenter = {lat: coords.lat, lng: coords.lng, radius: distance, label: locationLabel};
      window.__outsy.lastSearch = new Date().toISOString();
    }

    // Coups de cœur — filtrer par distance réelle
    setHeartLoading(true);
    const myGoodNames = new Set(memories.filter(m=>m.rating>=3).map(m=>m.name.toLowerCase()));
    const myBadNames = new Set(memories.filter(m=>m.rating>0&&m.rating<3).map(m=>m.name.toLowerCase()));
    const myMems = memories
      .filter(m=>m.rating>=3)
      .filter(m=>typeMatches(m.type, recoType))
      .filter(m=>recoPrice===ALL||m.price===recoPrice)
      .filter(m=>!recoKids||m.kidsf);
    const friendMems = friendMemories.filter(m => {
      const key = m.name.toLowerCase();
      if (myBadNames.has(key)) return false; // my low rating wins, never show
      return myGoodNames.has(key) || m.rating>=3;
    }).filter(m=>typeMatches(m.type, recoType))
     .filter(m=>recoPrice===ALL||m.price===recoPrice)
     .filter(m=>!recoKids||m.kidsf);
    const candidates = [...myMems, ...friendMems];

    // Show all favorites sorted by rating — distance filter is best-effort
    let heartMems = candidates.map(m=>({...m,isMine:!m.friendName}));
    try {
      const toGeocode = candidates.filter(m=>m.city||m.name);
      if (toGeocode.length > 0) {
        const geoRes = await fetch("/api/geocode-memories", {
          method:"POST", headers:{"Content-Type":"application/json"},
          body: JSON.stringify({ places: toGeocode.map(m=>({id:m.id,name:m.name,city:m.city,country:m.country,address:m.address||""})) })
        });
        const geoData = await geoRes.json();
        const coordsMap = {};
        (geoData.results||[]).forEach(r=>{ if(r.lat) coordsMap[String(r.id)]={lat:r.lat,lng:r.lng}; });

        heartMems = heartMems.map(m=>{
          const c = coordsMap[String(m.id)];
          if (c) {
            const distKm = calcDistance(coords.lat, coords.lng, c.lat, c.lng);
            return {...m, _lat:c.lat, _lng:c.lng, distanceKm: distKm};
          }
          return m;
        });

        // Only filter by distance if we got coords for at least some places
        const withCoords = heartMems.filter(m=>m.distanceKm!==undefined);
        if (withCoords.length > 0) {
          const inRadius = withCoords.filter(m=>m.distanceKm*1000<=distance);
          // Don't include places without coords - they could be anywhere
          heartMems = inRadius.sort((a,b)=>b.rating-a.rating||a.distanceKm-b.distanceKm);
        } else {
          heartMems = heartMems.sort((a,b)=>b.rating-a.rating);
        }
      } else {
        heartMems = heartMems.sort((a,b)=>b.rating-a.rating);
      }
    } catch(err) {
      heartMems = heartMems.sort((a,b)=>b.rating-a.rating);
    }
    // Deduplicate by name - keep isMine version if exists
    const deduped = [];
    const seenNamesMap = new Map();
    // First pass: add own memories, initialize friendsWhoHave
    heartMems.filter(m=>m.isMine).forEach(m => {
      const key = m.name.toLowerCase();
      if (!seenNamesMap.has(key)) {
        const entry = {...m, friendsWhoHave:[], friendsData:[]};
        seenNamesMap.set(key, entry);
        deduped.push(entry);
      }
    });
    // Second pass: add friend-only memories or attach to existing
    heartMems.filter(m=>!m.isMine).forEach(m => {
      const key = m.name.toLowerCase();
      if (!seenNamesMap.has(key)) {
        const entry = {...m, friendsWhoHave:[m.friendName].filter(Boolean), friendsData:[m]};
        seenNamesMap.set(key, entry);
        deduped.push(entry);
      } else {
        const existing = seenNamesMap.get(key);
        if (m.friendName && !existing.friendsWhoHave.includes(m.friendName)) {
          existing.friendsWhoHave.push(m.friendName);
          existing.friendsData.push(m);
        }
      }
    });
    // Sort by effective display rating after dedup (friend averages now available)
    const getDisplayRating = (m) => {
      if (m.isMine && m.rating > 0) return m.rating;
      const rated = (m.friendsData||[]).filter(f => f.rating > 0);
      if (rated.length > 0) return rated.reduce((s,f) => s + f.rating, 0) / rated.length;
      return m.rating || 0;
    };
    deduped.sort((a,b) => {
      if (a.distanceKm !== undefined && b.distanceKm !== undefined) {
        return getDisplayRating(b) - getDisplayRating(a) || a.distanceKm - b.distanceKm;
      }
      return getDisplayRating(b) - getDisplayRating(a);
    });
    // Preserve openNow status from previous state but NOT openingHours (force re-fetch for fresh data)
    const nbHearts = parseInt(recoLimit) || 10;
    const allClosedNames = new Set([
      ...closedPlacesRef.current.map(n=>n.toLowerCase()),
      ...tempClosedRef.current
    ]);
    const newHeartNames = new Set(
      deduped
        .filter(m => !allClosedNames.has(m.name.toLowerCase()))
        .slice(0, nbHearts)
        .map(m => m.name)
    );
    setHeartMemories(prev => {
      const prevMap = {};
      prev.forEach(m => {
        if(m.openNow!==undefined) prevMap[m.name.toLowerCase()] = {openNow:m.openNow, openingHours:m.openingHours};
      });
      return deduped
        .filter(m => !allClosedNames.has(m.name.toLowerCase()))
        .slice(0, nbHearts)
        .map(m => {
          const p = prevMap[m.name.toLowerCase()];
          return p ? {...m, openNow:p.openNow, openingHours:p.openingHours||m.openingHours} : m;
        });
    });

    // Exclusion list: my own favorites (all) + friend favorites that appear in heartMemories
    const heartFriendNames = [...newHeartNames].filter(name =>
      !memories.some(m => m.name === name) // friend-only places shown in hearts
    );
    const alreadyVisited = new Set([
      ...memories.map(m => m.name),
      ...heartFriendNames,
      ...pins.map(p => p.name),
    ]);

    // Nearby Google Places — fetch FIRST, used both for display and as AI candidate list
    let nearbyForAI = [];
    try {
      const res = await fetch("/api/places", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "nearby", lat: coords.lat, lng: coords.lng, radius: distance, type: recoType, lang: prefs.language || "en", mood: recoMood || "", kids: !!recoKids }),
      });
      const data = await res.json();
      const places = (data.places||[]).map(p=>{
        const plat = p.location?.latitude, plng = p.location?.longitude;
        const dist = plat && plng ? calcDistance(coords.lat, coords.lng, plat, plng) * 1000 : null;
        // Find best review in user's language, fallback to any 5-star review or editorialSummary
        const reviews = p.reviews || [];
        const userLang = prefs.language || "en";
        const reviewInLang = reviews.find(r =>
          r.text?.languageCode === userLang &&
          r.rating >= 4 &&
          r.text?.text?.length > 30 &&
          r.text.text.length < 200
        );
        const fiveStarReview = reviews.find(r => r.rating === 5 && r.text?.text?.length > 30 && r.text.text.length < 200);
        const topReview = reviewInLang || fiveStarReview || reviews.find(r => r.text?.text?.length > 30 && r.text.text.length < 200);
        // Prefer review in user lang over editorial summary which is usually English
        const summary = (reviewInLang?.text?.text) || (p.editorialSummary?.text?.languageCode === userLang ? p.editorialSummary.text : null);
        // Google placeId — required so PlaceCardBody can fetch full
        // details (photos, phone, website, hours, reviews, …). Without
        // it the place sheet for popular results lands on the loading
        // short-circuit and renders only the sparse fields the nearby
        // search itself returned.
        const parsed = parseAddress(p.addressComponents, p.formattedAddress);
        return {
          id: p.id,
          google_place_id: p.id,
          primaryType: p.primaryType,
          primaryTypeDisplayName: p.primaryTypeDisplayName,
          features: p.features,
          name: p.displayName?.text||"", address: p.formattedAddress||"",
          // Structured city / country / street — fed straight into the add
          // form when the user pins or hearts a popular reco. Without these
          // the form had to parse formattedAddress and would mash postcodes
          // into the city field.
          city: parsed.city, country: parsed.country, streetAddress: parsed.streetAddress,
          rating: p.rating, userRatingCount: p.userRatingCount||0,
          cuisine: p.cuisine || null,
          editorialSummary: summary,
          topReview: !summary ? (topReview?.text?.text || null) : null,
          price: PRICE_MAP[p.priceLevel]||"",
          lat: plat, lng: plng, _dist: dist,
          openNow: p.currentOpeningHours?.openNow ?? p.regularOpeningHours?.openNow,
          openingHours: p.currentOpeningHours?.weekdayDescriptions || p.regularOpeningHours?.weekdayDescriptions || null,
        };
      }).filter(p=>p.name);

      // DEBUG: expose to F12 console via window.__outsy
      if (typeof window !== "undefined") {
        window.__outsy = window.__outsy || {};
        window.__outsy.nearbyRaw = data;
        window.__outsy.nearbyParsed = places;
        window.__outsy.searchCenter = {lat: coords.lat, lng: coords.lng, radius: distance};
        window.__outsy.nearbyTable = places.map(p => ({
          name: p.name,
          dist: p._dist!=null ? Math.round(p._dist)+"m" : "?",
          rating: p.rating || "?",
          reviews: p.userRatingCount || 0,
          address: p.address,
        }));
      }

      // Sort by rating DESC, distance ASC for tie-breaking
      const sorted = [...places]
        .sort((a,b) => (b.rating||0)-(a.rating||0) || (a._dist||0)-(b._dist||0));

      // For display: show ALL popular places. Display-time dedup with heartMemories/aiRecos handles overlap.
      setNearbyPlaces(sorted);

      // Distance hard-cap (same heuristic as moodFilteredNearby for the
      // display): half-way between the user's chosen radius and the
      // server-side locationBias radius. Prevents global-name-match
      // hallucinations like 'Refinery Rooftop NYC' at 5500 km being
      // sent to Claude as an AI candidate just because the keyword
      // happens to be in its name.
      const biasRadius = Math.max(distance * 1.5, 3000);
      const maxDistance = (distance + biasRadius) / 2;
      const withinRange = sorted.filter(p => {
        if (!p.lat || !p.lng || !coords?.lat) return true;
        const R = 6371, dLat = (coords.lat - p.lat) * Math.PI/180, dLng = (coords.lng - p.lng) * Math.PI/180;
        const a = Math.sin(dLat/2)**2 + Math.cos(p.lat*Math.PI/180)*Math.cos(coords.lat*Math.PI/180)*Math.sin(dLng/2)**2;
        const dist = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)) * 1000;
        return dist <= maxDistance;
      });

      // For AI candidates: exclude visited places so AI proposes novel ones
      nearbyForAI = withinRange.filter(p => !alreadyVisited.has(p.name));

      // Pre-filter by mood: if mood is set, only send mood-matching candidates to AI
      if (recoMood) {
        const moodFiltered = nearbyForAI.filter(p => placeMatchesMood(p, recoMood));
        // Only use filtered list if it has enough results, otherwise fall back to full list
        if (moodFiltered.length >= 3) nearbyForAI = moodFiltered;
      }
    } catch { setNearbyPlaces([]); }
    setHeartLoading(false);

    // Skip AI if user only wants nearby places
    if (skipAI) { setAiRecos([]); return; }

    // AI Recos
    setAiLoading(true); setAiRecos([]);

    // Build the structured taste profile (top cuisines + avoided + price + friend anchors).
    const tasteProfile = buildTasteProfile(memories, friendMemories, recoType);

    // Same-type favorites are sent in full (rich anchor candidates). Other-type
    // favorites are summarized as profile colour without flooding the prompt.
    // Note: free note (why) may contain BOTH positive and negative remarks —
    // the star rating is the polarity anchor, the note adds texture. Claude
    // is expected to read sentiment naturally.
    const sameType = memories.filter(m=>m.rating>=3 && typeMatches(m.type, recoType)).sort((a,b)=>b.rating-a.rating);
    const memoryNote = (m) => [m.why, m.dislike].filter(s => s && s.trim()).join(" / ");
    const liked = sameType.slice(0,8).map(m=>{
      const subType = m.activity_type || m.cuisine || "";
      const positive = (m.likeTags||[]).join(", ");
      const negative = (m.dislikeTags||[]).join(", ");
      const note = memoryNote(m);
      const parts = [
        positive ? `👍 ${positive}` : null,
        negative ? `👎 ${negative}` : null,
        note ? `note: "${note}"` : null,
      ].filter(Boolean).join(" — ");
      return `- ${m.name} (${subType||m.type}, ${m.price||"?"}, ${m.rating}/5)${parts?` — ${parts}`:""}${m.kidsf?" — kids friendly":""}`;
    }).join("\n");
    const disliked = memories.filter(m=>m.rating>0&&m.rating<3).slice(0,5).map(m=>{
      const subType = m.activity_type || m.cuisine || "";
      const negative = (m.dislikeTags||[]).join(", ");
      const note = memoryNote(m);
      return `- ${m.name} (${subType||m.type})${negative?` — 👎 ${negative}`:""}${note?` — note: "${note}"`:""}`;
    }).join("\n");

    const excludeList = [...alreadyVisited].slice(0, 40).join(", ");

    // Pins matching the search type — Claude should BOOST them if they show up.
    const pinsList = pins.filter(p => typeMatches(p.type, recoType)).slice(0, 10)
      .map(p => `- ${p.name} (${p.activity_type||p.cuisine||p.type})${p.pin_note?` — "${p.pin_note}"`:""}`).join("\n");

    // Friend-loved anchors for the searched type — strong taste signal.
    const friendAnchorList = tasteProfile.friendAnchors.length > 0
      ? tasteProfile.friendAnchors.map(a => `- ${a.name}${a.cuisine?` (${a.cuisine})`:""} — loved by ${a.friend} (${a.rating}/5)`).join("\n")
      : "";

    const langLabel = LANGUAGES.find(l=>l.code===prefs.language)?.label || "English";

    // Type-specific guidance — what the AI should focus on for each category.
    const typeGuidance = {
      "Restaurant": "Focus on cuisine, ambiance and price match. Anchor each recommendation in a real cuisine the user has rated highly, NOT a vague similarity.",
      "Bar": "Focus on atmosphere, cocktail/wine selection, music and setting. If the mood mentions a specific format (rooftop, speakeasy, live music), ONLY return bars that strictly match it.",
      "Café": "Focus on coffee quality, pastries, brunch and work-friendliness. Match cozy spots, specialty coffee, patisseries based on the user's style.",
      "Hôtel": "Focus on stay quality (comfort, location, character, service). Ignore the hotel restaurant. Anchor in hotel STYLE (boutique, luxury, design, family) inferred from the profile.",
      "Destination": "Focus on cultural, scenic or unique value. Anchor in the user's interest in landmarks, neighborhoods, viewpoints.",
      "Activité": "Anchor in the EXPERIENCE TYPE, not the cultural category. Escape games anchor in other game/immersive experiences, NOT museums. Only cite a favorite of the SAME activity sub-type."
    };
    const guidance = typeGuidance[recoType] || typeGuidance["Restaurant"];

    // Build the numbered candidate list with type, rating, price and features.
    const candidateList = nearbyForAI.length > 0
      ? nearbyForAI.map((p, i) => {
          const placeType = p.primaryTypeDisplayName?.text || p.primaryType || "";
          const desc = p.editorialSummary ? ` | "${p.editorialSummary}"` : "";
          const feats = (p.features||[]).length > 0 ? ` | features: ${p.features.join(", ")}` : "";
          return `${i+1}. ${p.name} | type: ${placeType} | Google: ${p.rating||"?"}★ (${p.userRatingCount||0} avis) | ${p.price||"?"}${feats}${desc}`;
        }).join("\n")
      : null;

    // Compact taste-profile summary — top cuisines, price comfort, avoided list.
    const profileSummary = [
      tasteProfile.topCuisines.length > 0
        ? `Top sub-types: ${tasteProfile.topCuisines.map(c=>`${c.name} (×${c.count}, avg ${c.avg.toFixed(1)})`).join(", ")}`
        : null,
      tasteProfile.priceComfort ? `Usual price level: ${tasteProfile.priceComfort}` : null,
      tasteProfile.avoided.length > 0 ? `Avoided sub-types: ${tasteProfile.avoided.join(", ")}` : null,
    ].filter(Boolean).join("\n");

    const moodBlock = recoMood ? `
🎯 CURRENT MOOD (PRIMARY CRITERION — hard filter): "${recoMood}"
- The mood is the user's explicit current intent. It outranks the taste profile.
- ONLY return places that genuinely match this mood. Use the candidate "features" + editorial summary to verify.
- For each pick that matches the mood, anchor.kind MUST be "mood" and signals MUST include {kind:"mood", label:"..."}.
- Mood mismatch = automatic exclusion. NEVER pad with non-matching places to hit a count.` : "";

    const prompt = `User is searching for: ${recoType.toUpperCase()}
${guidance}

USER PROFILE (background taste — secondary to mood when mood is set):
${profileSummary || "No strong taste signal yet."}
Stated likes (tags): ${(prefs.lovesTags||[]).filter(Boolean).join(", ")||"—"}
Stated dislikes (tags): ${(prefs.hatesTags||[]).filter(Boolean).join(", ")||"—"}
Budget filter: ${recoPrice!==ALL?recoPrice:prefs.budget||"—"}
Kids friendly required: ${recoKids?"yes":"no"}
Free notes: ${prefs.notes||"—"}
Preferred output language: ${langLabel}
${moodBlock}

TOP FAVORITES of the user (use as anchor when truly comparable — never force a link).
IMPORTANT: each favorite's "note" is FREE TEXT and may contain BOTH praise and gripes.
The star rating is the dominant polarity. Read the note for nuance, but trust the rating
as the overall verdict (e.g. 5/5 with a small gripe in the note is still a place they love).
${liked||"None yet."}

DISAPPOINTMENTS (skip places similar to these):
${disliked||"None."}

${friendAnchorList ? `FRIEND FAVORITES (use as anchor when applicable — friend social proof is a strong taste signal):
${friendAnchorList}
` : ""}${pinsList ? `📌 PINNED by user — BOOST these if they appear in the candidate list or have a strong match:
${pinsList}
` : ""}${candidateList
  ? `${recoType.toUpperCase()} CANDIDATE LIST — ${nearbyForAI.length} places near the user:
${candidateList}

TASK:
- Select 5 to ${recoType === "Activité" ? 20 : 10} ${recoType.toLowerCase()}s STRICTLY from the numbered candidate list above.
- ${recoMood ? "RANK PRIMARILY by mood fit, then by taste profile match." : "RANK by taste profile match (cuisine, price, friend anchors)."}
- Quality over quantity: return 5 if only 5 are strong matches; return up to ${recoType === "Activité" ? 20 : 10} if you have that many with a clear anchor. NEVER pad with weak matches.
- DIVERSIFY: avoid near-duplicates of the same kind of experience. If two candidates are essentially the same thing (e.g. two VR arcades, two trampoline parks, two of the same chain, two go-kart tracks, two of the same brand of escape room), keep ONLY ONE — the one with the best rating, closer in case of tie. Two museums on clearly different subjects are NOT duplicates; two VR experiences ARE. The user wants variety.
- Each pick MUST have "idx" set to its number in the candidate list (e.g. idx: 3 for item 3).
- "name" must be the place name exactly as written in the list.
- Generate "headline", "anchor" and "signals" per the JSON schema. anchor.kind = "mood" when mood is set AND honestly matched; "favorite" when a real favorite is comparable; "friend" when citing a friend; "context" or null otherwise. DO NOT invent links (a korean spot is not a japanese favorite).
- "signals" array max 3 entries. Each {kind, label}. label ≤ 8 words, in ${langLabel}.
- Skip places similar to the disappointments above.
- Skip already-visited names: ${excludeList||"none"}.`
  : `No candidate list is available (Google returned zero places). Return an empty "recommendations" array. Do NOT invent places.`
}

Write all text (headline, signals.label, tip, warning, anchor.ref) in ${langLabel}.`;
    try {
      const res = await fetch("/api/recommend", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, structured: true, language: prefs.language || "en" }),
      });
      const data = await res.json();
      if (data.recommendations) {
        // Pre-resolve AI picks to real Google places. Always validate against
        // nearbyForAI — if the AI hallucinated a place that isn't in the
        // candidate list (e.g. 'Refinery Rooftop NYC' when we're in London),
        // drop it. When the candidate list is empty we return zero recos
        // (the prompt instructs Claude to do the same), so the UI shows the
        // 'no matches' empty state rather than a wrong place far away.
        const preResolved = nearbyForAI.length > 0
          ? data.recommendations.map(r => {
              // Try idx field first (new approach), then parse name as number (fallback)
              const rawIdx = r.idx ?? parseInt(r.name);
              const idx = rawIdx - 1;
              if (!isNaN(idx) && idx >= 0 && idx < nearbyForAI.length) {
                const gp = nearbyForAI[idx];
                return {
                  ...r,
                  name: gp.name, address: gp.address, lat: gp.lat, lng: gp.lng, _dist: gp._dist,
                  // Carry the Google placeId so the place sheet can fetch
                  // full details (photos, phone, website, reviews, …).
                  id: gp.id, google_place_id: gp.google_place_id,
                  primaryType: gp.primaryType, primaryTypeDisplayName: gp.primaryTypeDisplayName,
                  // Carry the structured fields parsed from Google's
                  // addressComponents. Without these, addRecoToCarnet falls
                  // back to a naive comma split of formattedAddress which
                  // mashes the postcode into the city and sometimes leaves
                  // city/country empty entirely for venues with peculiar
                  // address formats.
                  city: gp.city, country: gp.country, streetAddress: gp.streetAddress,
                  // gp.cuisine holds the localised activity sub-type for
                  // Activité places (escape game / zoo / musée / …). Falls
                  // back to Google's raw primaryTypeDisplayName, then a
                  // humanised primaryType, so the form is never empty.
                  activityType: gp.cuisine || gp.primaryTypeDisplayName?.text || gp.primaryTypeDisplayName || (gp.primaryType ? gp.primaryType.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()) : ""),
                };
              }
              // Try exact name match in nearbyForAI
              const exactMatch = nearbyForAI.find(p => p.name.toLowerCase() === (r.name||"").toLowerCase());
              if (exactMatch) {
                return {
                  ...r,
                  name: exactMatch.name, address: exactMatch.address, lat: exactMatch.lat, lng: exactMatch.lng, _dist: exactMatch._dist,
                  id: exactMatch.id, google_place_id: exactMatch.google_place_id,
                  primaryType: exactMatch.primaryType, primaryTypeDisplayName: exactMatch.primaryTypeDisplayName,
                  city: exactMatch.city, country: exactMatch.country, streetAddress: exactMatch.streetAddress,
                  activityType: exactMatch.cuisine || exactMatch.primaryTypeDisplayName?.text || exactMatch.primaryTypeDisplayName || (exactMatch.primaryType ? exactMatch.primaryType.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()) : ""),
                };
              }
              return null;
            }).filter(Boolean)
          : [];

        // Verify places are still operational via Google Places
        try {
          const verifyRes = await fetch("/api/places", {
            method: "POST", headers: {"Content-Type":"application/json"},
            body: JSON.stringify({ action:"verify", places: preResolved.map(r=>({name:r.name,address:r.address,googlePlaceId:""})) })
          });
          const verifyData = await verifyRes.json();
          const newlyClosed = (verifyData.results||[]).filter(r=>!r.operational);
          const permClosed = newlyClosed.filter(r=>r.businessStatus==="CLOSED_PERMANENTLY");
          const tempClosed = newlyClosed.filter(r=>r.businessStatus==="CLOSED_TEMPORARILY");
          if (tempClosed.length > 0) {
            tempClosed.forEach(r => tempClosedRef.current.add(r.name.toLowerCase()));
          }
          const allClosedNames = new Set([
            ...newlyClosed.map(r=>r.name.toLowerCase()),
            ...closedPlacesRef.current.map(n=>n.toLowerCase())
          ]);

          // preResolved already has real names + coords from Google
          const resolvedRecos = preResolved.filter(r =>
            !alreadyVisited.has(r.name) && !allClosedNames.has(r.name.toLowerCase())
          );

          // Claude returns the array already ranked by strength of match —
          // we preserve that order. resolvedRecos is built from preResolved
          // which keeps Claude's order. We only tie-break visually
          // identical positions by distance.
          const filtered = resolvedRecos;

          // Enrich with openNow from verify
          const verifyMap = {};
          (verifyData.results||[]).forEach(r => { verifyMap[r.name.toLowerCase()] = r; });
          const enriched = filtered.map(r => {
            const v = verifyMap[r.name.toLowerCase()];
            return v ? {...r, openNow:v.openNow??r.openNow, openingHours:v.openingHours||r.openingHours, googleRating:v.googleRating||null, cuisine:v.cuisine||r.cuisine} : r;
          });

          setAiRecos(enriched);
          if (permClosed.length > 0) {
            try {
              const toInsert = permClosed.map(r=>{
                const reco = data.recommendations.find(x=>x.name.toLowerCase()===r.name.toLowerCase());
                return { place_id: r.placeId||null, name: r.name, address: reco?.address||'', confirmed_by: userId };
              });
              await supabase.from('closed_places').upsert(toInsert, { onConflict: 'place_id', ignoreDuplicates: true });
              const newIds = newlyClosed.map(r=>r.name);
              const newNames = [...new Set([...closedPlacesRef.current, ...newIds])];
              setClosedPlaces(newNames);
              closedPlacesRef.current = newNames;
            } catch(e) { console.error('Upsert closed_places error:', e); }
          }
        } catch(verifyErr) {
          console.error("Verify error:", verifyErr);
          setAiRecos(preResolved); // use resolved names, not raw numbers
        }
      }
    } catch(err) { console.error("AI error:", err); }
    setAiLoading(false);
  };

  const addRecoToCarnet = (reco) => {
    // Debug: surfaces in the browser console so we can see whether the
    // reco object actually carries city/country/activityType. Helps diagnose
    // "city/country empty" reports without server-side guessing.
    if (typeof window !== "undefined") {
      console.log("addRecoToCarnet input:", {
        name: reco.name,
        address: reco.address,
        city: reco.city,
        country: reco.country,
        streetAddress: reco.streetAddress,
        activityType: reco.activityType,
        primaryType: reco.primaryType,
        primaryTypeDisplayName: reco.primaryTypeDisplayName,
      });
    }
    // Prefer the structured city / country / street fields attached to the
    // reco during the nearby transform (from Google addressComponents).
    // Fall back to a naive split of formattedAddress when those are missing
    // (legacy code paths or AI recos that didn't go through the transform).
    let city = reco.city || "";
    let country = reco.country || "";
    let streetAddress = reco.streetAddress || "";
    if (!city || !country) {
      const addrParts = (reco.address||"").split(",").map(s=>s.trim());
      country = country || addrParts[addrParts.length-1] || "";
      city = city || addrParts[addrParts.length-2] || "";
      streetAddress = streetAddress || addrParts.slice(0, addrParts.length-2).join(", ") || reco.address || "";
    }
    // For Activité, auto-fill activityType from Google's primaryTypeDisplayName
    // (the human-readable category like "Escape room game"). The AI reco
    // payload doesn't include activityType explicitly, so we read it off the
    // resolved Google place data carried through pre-resolution.
    const activityType = reco.activityType
      || reco.primaryTypeDisplayName?.text
      || reco.primaryTypeDisplayName
      || "";
    setRecoToAdd({
      name: reco.name,
      type: recoType,
      price: reco.price || "",
      city, country,
      address: streetAddress,
      cuisine: reco.cuisine || "",
      activityType,
      google_place_id: reco.google_place_id || reco.googlePlaceId || "",
      rating: 0, likeTags: [], dislikeTags: [], why: "", dislike: "", kidsf: false
    });
  };

  const addFriendToCarnet = (m) => {
    // Pre-fill from friend's memory but reset personal fields
    setRecoToAdd({
      name: m.name,
      type: m.type || "Restaurant",
      price: m.price || "",
      city: m.city || "",
      country: m.country || "",
      address: m.address || "",
      cuisine: m.cuisine || "",
      activityType: m.activity_type || m.activityType || "",
      google_place_id: m.google_place_id || "",
      rating: 0, likeTags: [], dislikeTags: [], why: "", dislike: "", kidsf: false
    });
  };

  const filteredMemories = (() => {
    const applyFilters = (m) => {
      if (!typeMatches(m.type, filterType)) return false;
      if (filterPrice!==ALL&&m.price!==filterPrice) return false;
      if (filterRating!==ALL&&m.rating<parseInt(filterRating)) return false;
      if (filterKids&&!m.kidsf) return false;
      if (memSearch.trim()) {
        const q = memSearch.toLowerCase();
        if (!m.name?.toLowerCase().includes(q)&&!m.city?.toLowerCase().includes(q)&&!m.country?.toLowerCase().includes(q)) return false;
      }
      return true;
    };
    const applyFiltersNoRating = (m) => {
      if (!typeMatches(m.type, filterType)) return false;
      if (filterPrice!==ALL&&m.price!==filterPrice) return false;
      if (filterKids&&!m.kidsf) return false;
      if (memSearch.trim()) {
        const q = memSearch.toLowerCase();
        if (!m.name?.toLowerCase().includes(q)&&!m.city?.toLowerCase().includes(q)&&!m.country?.toLowerCase().includes(q)) return false;
      }
      return true;
    };
    const myMems = memories.filter(applyFilters).map(m=>({...m,isMine:true,friendsWhoHave:[]}));
    const friendMems = friendFilter!=="mine" ? friendMemories.filter(applyFiltersNoRating) : [];
    
    // For each of my memories, find friends who also have it
    const myNames = new Set(memories.map(m=>m.name.toLowerCase())); // all my places for dedup
    myMems.forEach(m => {
      const matchingFriends = friendMems.filter(f=>f.name.toLowerCase()===m.name.toLowerCase());
      m.friendsWhoHave = matchingFriends.map(f=>f.friendName).filter(Boolean);
      m.friendsData = matchingFriends;
    });
    
    if (friendFilter==="friends") {
      // Show all friend memories, merging with mine if shared
      const seen = new Map();
      // First add my shared places (places I have AND friend has)
      myMems.filter(m=>friendMems.some(f=>f.name.toLowerCase()===m.name.toLowerCase())).forEach(m=>{
        const key = m.name.toLowerCase();
        const matches = friendMems.filter(f=>f.name.toLowerCase()===key);
        seen.set(key, {...m, friendsWhoHave:matches.map(f=>f.friendName).filter(Boolean), friendsData:matches});
      });
      // Then add friend-only places
      friendMems.filter(f=>!myNames.has(f.name.toLowerCase())).forEach(f => {
        const key = f.name.toLowerCase();
        if (!seen.has(key)) seen.set(key, {...f, isMine:false, friendsWhoHave:[f.friendName].filter(Boolean)});
        else seen.get(key).friendsWhoHave.push(f.friendName);
      });
      return [...seen.values()];
    }
    
    // Mixed view: my memories first, then friend-only memories
    const friendOnlyMems = [];
    const seenFriendNames = new Map();
    friendMems.filter(f=>!myNames.has(f.name.toLowerCase())).forEach(f => {
      const key = f.name.toLowerCase();
      if (!seenFriendNames.has(key)) {
        seenFriendNames.set(key, {...f, isMine:false, friendsWhoHave:[f.friendName].filter(Boolean)});
      } else {
        seenFriendNames.get(key).friendsWhoHave.push(f.friendName);
      }
    });
    
    return [...myMems, ...seenFriendNames.values()];
  })();

  const displayName = profile ? `${profile.first_name} ${profile.last_name}` : session.user.email;
  const locationLabel = locMode==="gps" ? gpsLocation : freeLocation;

  return (
    <>
      <style>{getCSS(COLORS)}</style>
      <div className="app">
        <div className="header">
          <div className="header-top">
            <div>
              <div className="header-logo">Outsy <span>AI</span></div>
              <div className="header-user">@{prefs.username||displayName}</div>
            </div>
            <button onClick={()=>setShowMenu(m=>!m)} style={{background:"none",border:`1px solid ${COLORS.border}`,borderRadius:8,padding:"6px 10px",cursor:"pointer",color:COLORS.text,fontSize:16,fontFamily:"'DM Sans',sans-serif",position:"relative"}}>
              ☰
              {showMenu&&(
                <div style={{position:"absolute",top:"110%",right:0,background:COLORS.card,border:`1px solid ${COLORS.border}`,borderRadius:10,boxShadow:"0 4px 20px rgba(0,0,0,0.15)",zIndex:100,minWidth:160,padding:4}} onClick={e=>e.stopPropagation()}>
                  <button onClick={()=>{setShowMenu(false);setShowProfilePanel(true);}} style={{display:"block",width:"100%",padding:"10px 16px",background:"none",border:"none",textAlign:"left",cursor:"pointer",color:COLORS.text,fontFamily:"'DM Sans',sans-serif",fontSize:13,borderRadius:6}} onMouseEnter={e=>e.target.style.background=`${COLORS.accent}11`} onMouseLeave={e=>e.target.style.background="none"}>
                    👤 {t.tabProfile||"Profile"}
                  </button>
                  <button onClick={()=>{setShowMenu(false);window.location.reload();}} style={{display:"block",width:"100%",padding:"10px 16px",background:"none",border:"none",textAlign:"left",cursor:"pointer",color:COLORS.text,fontFamily:"'DM Sans',sans-serif",fontSize:13,borderRadius:6}} onMouseEnter={e=>e.target.style.background=`${COLORS.accent}11`} onMouseLeave={e=>e.target.style.background="none"}>
                    🔄 {t.refresh||"Rafraîchir"}
                  </button>
                  <div style={{height:1,background:COLORS.border,margin:"2px 8px"}}/>
                  <button onClick={()=>{setShowMenu(false);logout();}} style={{display:"block",width:"100%",padding:"10px 16px",background:"none",border:"none",textAlign:"left",cursor:"pointer",color:"#d4869b",fontFamily:"'DM Sans',sans-serif",fontSize:13,borderRadius:6}} onMouseEnter={e=>e.target.style.background=`${COLORS.accent}11`} onMouseLeave={e=>e.target.style.background="none"}>
                    🚪 {t.logout||"Disconnect"}
                  </button>
                </div>
              )}
            </button>
          </div>
          <div className="tabs" style={{marginTop:12}}>
            <button className={`tab ${tab==="reco"?"active":""}`} onClick={()=>setTab("reco")}>{t.tabReco}</button>
            <button className={`tab ${tab==="memories"?"active":""}`} onClick={()=>setTab("memories")}>{t.tabFavorites}</button>
            <button className={`tab ${tab==="pins"?"active":""}`} onClick={()=>setTab("pins")}>📌 {t.tabPins||"Pins"}</button>
            <button className={`tab ${tab==="add"?"active":""}`} onClick={()=>setTab("add")}>{t.tabAdd}</button>
            <button className={`tab ${tab==="friends"?"active":""}`} onClick={()=>setTab("friends")}>
              {t.tabFriends} {pendingIn.length>0&&<span className="notif-badge">{pendingIn.length}</span>}
            </button>
          </div>
          {tab==="reco"&&(
            <div className="reco-subnav">
              <button onClick={()=>document.getElementById("reco-settings")?.scrollIntoView({behavior:"smooth",block:"start"})}>📍</button>
              {heartsToShow.length>0&&<button onClick={()=>document.getElementById("reco-hearts")?.scrollIntoView({behavior:"smooth",block:"start"})} style={{borderColor:"#d4869b44",background:"#d4869b11",color:"#d4869b"}}>❤️ {heartsToShow.length}</button>}
              {recoPins.length>0&&<button onClick={()=>document.getElementById("reco-pins")?.scrollIntoView({behavior:"smooth",block:"start"})} style={{borderColor:"#6b8cce44",background:"#6b8cce11",color:"#6b8cce"}}>📌 {recoPins.length}</button>}
              {(aiRecos.length>0||aiLoading)&&<button onClick={()=>document.getElementById("reco-ai")?.scrollIntoView({behavior:"smooth",block:"start"})} style={{borderColor:`${COLORS.accent}44`,background:`${COLORS.accent}11`,color:COLORS.accent}}>✨ {aiLoading?"...":aiRecos.length}</button>}
              {popularToShow.length>0&&<button onClick={()=>document.getElementById("reco-popular")?.scrollIntoView({behavior:"smooth",block:"start"})} style={{borderColor:"#7a9d7a44",background:"#7a9d7a11",color:"#7a9d7a"}}>🔥 {popularToShow.length}</button>}
            </div>
          )}
        </div>

        <div className="content" onClick={()=>showMenu&&setShowMenu(false)}>
          {loading && <div className="loading-overlay">{t.loading}</div>}

          {!loading && tab === "add" && <MemoryForm key={formKey} COLORS={COLORS} onSave={handleAdd} onCancel={()=>setFormKey(k=>k+1)} t={t} lang={lang} onDuplicate={(name)=>{ const dup=memories.find(m=>m.name.toLowerCase()===name.toLowerCase()); if(dup) setDuplicateAlert({existing:dup,newForm:null}); }}/>}

          {!loading && tab === "memories" && (
            <div>
              <div style={{marginBottom:12}}>
                <div className="filters-row"><span className="filter-label">{t.filterType}</span>{[[ALL,t.filterAll],...TYPES.map(x=>[x,(TYPES_I18N[lang]||TYPES_I18N.en)[x]||x])].map(([val,label])=><button key={val} className={`filter-btn ${filterType===val?"active":""}`} onClick={()=>setFilterType(val)}>{val===ALL?t.filterAll:`${TYPE_ICONS[val]} ${label}`}</button>)}</div>
                <div className="filters-row"><span className="filter-label">{t.filterPrice}</span>{[[ALL,t.filterAll],...PRICES.map(p=>[p,p])].map(([val,label])=><button key={val} className={`filter-btn ${filterPrice===val?"active":""}`} onClick={()=>setFilterPrice(val)}>{label}</button>)}</div>
                <div className="filters-row"><span className="filter-label">{t.filterRating}</span>{[[ALL,t.filterAll],["1","1"],["2","2"],["3","3"],["4","4"],["5","5"]].map(([val,label])=><button key={val} className={`filter-btn ${filterRating===val?"active":""}`} onClick={()=>setFilterRating(val)}>{val===ALL?t.filterAll:`${val}★+`}</button>)}</div>
                <div className="filters-row">
                  <button className={`filter-btn ${filterKids?"active":""}`} onClick={()=>setFilterKids(!filterKids)}>{t.filterKids}</button>
                  {friends.length>0&&(<>
                    <button className={`filter-btn ${friendFilter==="all"?"active":""}`} onClick={()=>setFriendFilter("all")}>👤+👥</button>
                    <button className={`filter-btn ${friendFilter==="mine"?"active":""}`} onClick={()=>setFriendFilter("mine")}>👤 {t.filterMine||"Mine"}</button>
                    <button className={`filter-btn ${friendFilter==="friends"?"active":""}`} onClick={()=>setFriendFilter("friends")}>👥 {t.filterFriendsOnly||"Friends"}</button>
                  </>)}
                </div>
                <input
                  value={memSearch}
                  onChange={e=>setMemSearch(e.target.value)}
                  placeholder={t.searchPlaces||"Search by name, city..."}
                  style={{background:COLORS.card,border:`1px solid ${COLORS.border}`,borderRadius:8,color:COLORS.text,fontFamily:"'DM Sans',sans-serif",fontSize:13,padding:"9px 12px",outline:"none",width:"100%",marginBottom:8,transition:"border-color 0.2s"}}
                />
              </div>
              <div className="memory-list" key={friendFilter}>
                {filteredMemories.length===0?(
                  <div className="empty"><div className="empty-icon">❤️</div><div className="empty-text">{memories.length===0?t.emptyFavorites:t.emptyResults}</div><div className="empty-sub">{memories.length===0?t.emptyFavoritesSub:t.emptyResultsSub}</div></div>
                ):filteredMemories.map(m=><MemoryCard key={`mem-${m.name.toLowerCase().replace(/\s+/g,"-")}`} m={m} isMine={m.isMine} lang={lang} COLORS={COLORS} t={t} onEdit={setEditMemory} onDelete={deleteMemory} onDeleteRequest={(id,name)=>setDeleteConfirm({id,name})} onViewFriend={(name,fMem)=>{ const mem=fMem||friendMemories.find(x=>x.friendName===name&&x.name===m.name); if(mem)setFriendMemoryModal({memory:mem,friendName:name}); }} setFriendMemoryModal={setFriendMemoryModal} addFriendToCarnet={addFriendToCarnet}
                  onSaveFriend={(fMem)=>addFriendToCarnet(fMem)} onPin={(m)=>openPinModal({name:m.name,type:m.type,price:m.price,city:m.city,country:m.country,address:m.address,cuisine:m.cuisine,activityType:m.activity_type,google_place_id:m.google_place_id})}/>)}
              </div>
            </div>
          )}

          {/* Pins tab */}
          {!loading && tab === "pins" && (
            <div className="memories-section">
              <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:20,fontStyle:"italic",color:COLORS.accent,marginBottom:12}}>📌 {t.tabPins||"Pins"}</div>
              <div style={{fontSize:12,color:COLORS.muted,marginBottom:12}}>{t.pinsDesc||"Places you want to try. They'll be recommended when relevant."}</div>
              <div style={{marginBottom:16}}>
                <PlaceSearch COLORS={COLORS} onPlaceSelected={(place)=>{
                  if (!place) return;
                  openPinModal({name:place.name,type:place.type||"Restaurant",price:place.price||"",city:place.city||"",country:place.country||"",address:place.address||"",cuisine:place.cuisine||"",activityType:place.activityType||"",google_place_id:place.googlePlaceId||""});
                }}/>
              </div>
              {enrichedPins.length===0?(
                <div style={{textAlign:"center",color:COLORS.muted,padding:"40px 0",fontSize:13}}>{t.pinsEmpty||"No pins yet. Use the 📌 button on recommendations to pin places for later."}</div>
              ):(
                <div className="memory-list">
                  {enrichedPins.map(pin=>(
                    <div key={pin.id} className="memory-card" style={{position:"relative"}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                        <div style={{flex:1,minWidth:0}}>
                          <div className="memory-name" onClick={()=>openPlaceSheet(pin,enrichedPins)} style={{cursor:"pointer"}}>{TYPE_ICONS[pin.type?.split(",")[0]?.trim()]||"📍"} {pin.name}</div>
                        </div>
                        <div style={{display:"flex",gap:6,flexShrink:0,alignItems:"center"}}>
                          {pin.friendsWhoHave?.length>0&&(
                            <FriendsBadge friends={pin.friendsWhoHave} friendsData={pin.friendsData}
                              onViewFriend={(name,fMem)=>{if(fMem)setFriendMemoryModal({memory:fMem,friendName:name});}}
                              COLORS={COLORS} t={t}/>
                          )}
                          <button onClick={()=>{
                            setRecoToAdd({name:pin.name,type:pin.type||"Restaurant",price:pin.price||"",city:pin.city||"",country:pin.country||"",address:pin.address||"",cuisine:pin.cuisine||"",activityType:pin.activity_type||"",google_place_id:pin.google_place_id||"",rating:0,likeTags:[],dislikeTags:[],why:"",dislike:"",kidsf:false});
                            setPrevTab("pins");
                            setTab("add");
                          }} title={t.recoAddFav||"Add"} style={{background:COLORS.card,border:`1px solid ${COLORS.accent}`,color:COLORS.accent,borderRadius:"50%",width:30,height:30,cursor:"pointer",fontSize:18,display:"flex",alignItems:"center",justifyContent:"center",padding:0,fontFamily:"'DM Sans',sans-serif",fontWeight:300}}>+</button>
                          <button onClick={async()=>{
                            await supabase.from('memories').delete().eq('id',pin.id).eq('user_id',userId);
                            setPins(prev=>prev.filter(p=>p.id!==pin.id));
                            showToast("✓");
                          }} title={t.delete} style={{background:"none",border:`1px solid ${COLORS.dislike}33`,borderRadius:"50%",width:30,height:30,cursor:"pointer",fontSize:12,color:"#d4869b",display:"flex",alignItems:"center",justifyContent:"center",padding:0}}>✕</button>
                        </div>
                      </div>
                      <div className="memory-meta" style={{marginBottom:6,justifyContent:"flex-start",flexWrap:"wrap",gap:5,marginTop:6}}>
                        {pin.cuisine&&<span className="badge">{pin.cuisine}</span>}
                        {pin.activity_type&&<span className="badge">{pin.activity_type}</span>}
                        {pin.price&&<span className="badge price">{pin.price}</span>}
                      </div>
                      {(pin.address||pin.city)&&<div className="memory-location">
                        📍 {pin.address||[pin.city,pin.country].filter(Boolean).join(", ")}
                        <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(pin.name+", "+(pin.address||[pin.city,pin.country].filter(Boolean).join(", ")))}`}
                          target="_blank" rel="noopener noreferrer"
                          style={{color:COLORS.accent,fontSize:12,marginLeft:6,textDecoration:"none"}}>Maps →</a>
                      </div>}
                      {pin.pin_note&&<div style={{fontSize:12,color:"#6b8cce",marginTop:4,fontStyle:"italic"}}>💬 {pin.pin_note}</div>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {!loading && tab === "friends" && (
            <div className="friends-section">
              {viewingFriend && (
                <div className="friend-panel">
                  <div className="friend-panel-header">
                    <div className="friend-panel-title">{t.followHeartTitle} {viewingFriend.name}</div>
                    <button className="friend-panel-close" onClick={()=>setViewingFriend(null)}>✕</button>
                  </div>
                  {viewingFriend.memories.length===0?(
                    <div style={{fontSize:13,color:COLORS.muted,textAlign:"center",padding:"20px 0"}}>{viewingFriend.name} {t.followNoHeart}</div>
                  ):(
                    <div className="memory-list">
                      {viewingFriend.memories.map(m=><MemoryCard key={m.id} m={m} isMine={false} COLORS={COLORS} t={t} lang={lang} onEdit={()=>{}} onDelete={()=>{}}
                        onSaveFriend={(fMem)=>addFriendToCarnet(fMem)} onPin={(m)=>openPinModal({name:m.name,type:m.type,price:m.price,city:m.city,country:m.country,address:m.address,cuisine:m.cuisine,activityType:m.activity_type,google_place_id:m.google_place_id})}/>)}
                    </div>
                  )}
                </div>
              )}

              {/* Stats bar */}
              <div style={{display:"flex",alignItems:"center",gap:16,padding:"14px 16px",background:COLORS.card,border:`1px solid ${COLORS.border}`,borderRadius:12,marginBottom:12}}>
                <div style={{width:48,height:48,borderRadius:"50%",overflow:"hidden",background:`${COLORS.accent}11`,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center"}}>
                  {prefs.avatar_url ? <img src={prefs.avatar_url} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/> : <span style={{fontSize:20}}>👤</span>}
                </div>
                <div style={{flex:1}}>
                  <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:18,fontStyle:"italic",color:COLORS.accent}}>@{prefs.username||"..."}</div>
                  <div style={{display:"flex",gap:16,marginTop:4}}>
                    <span style={{fontSize:12,color:COLORS.muted}}><strong style={{color:COLORS.text}}>{friends.length}</strong> {t.followingList}</span>
                    <span style={{fontSize:12,color:COLORS.muted}}><strong style={{color:COLORS.text}}>{followers.length}</strong> {t.followersList}</span>
                  </div>
                </div>
              </div>

              {/* Pending follow requests I received */}
              {pendingIn.length>0&&(
                <div style={{marginBottom:8}}>
                  <div className="friends-title" style={{marginBottom:6,fontSize:13}}>{t.followRequests} ({pendingIn.length})</div>
                  {pendingIn.map(f=>{
                    const uname = f.profiles?.username ? `@${f.profiles.username}` : "?";
                    return (
                    <div key={f.id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"6px 10px",background:COLORS.card,border:`1px solid ${COLORS.border}`,borderRadius:8,marginBottom:4}}>
                      <div style={{display:"flex",alignItems:"center",gap:8}}>
                        <div style={{width:24,height:24,borderRadius:"50%",overflow:"hidden",background:`${COLORS.accent}11`,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center"}}>
                          {f.profiles?.avatar_url ? <img src={f.profiles.avatar_url} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/> : <span style={{fontSize:11}}>👤</span>}
                        </div>
                        <span style={{fontSize:13,fontWeight:500,color:COLORS.text}}>{uname}</span>
                      </div>
                      <div style={{display:"flex",gap:4}}>
                        <button className="friend-action-btn accept" style={{padding:"3px 10px",fontSize:11}} onClick={()=>acceptFollowRequest(f.id)}>{t.followAccept}</button>
                        <button className="friend-action-btn decline" style={{padding:"3px 6px",fontSize:11}} onClick={()=>declineFollowRequest(f.id)}>✕</button>
                      </div>
                    </div>);
                  })}
                </div>
              )}

              {/* Search users */}
              <div style={{marginBottom:8}}>
                <div className="friend-search-row">
                  <input className="friend-search-input" placeholder={t.followSearchPlaceholder} value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} onKeyDown={e=>e.key==="Enter"&&searchFriends()}/>
                  <button className="friend-search-btn" onClick={searchFriends}>{t.followSearchBtn}</button>
                </div>
                {searchResults.length>0&&(
                  <div style={{marginTop:6,display:"flex",flexDirection:"column",gap:4}}>
                    {searchResults.map(u=>{
                      const alreadyFollowing=friends.some(f=>f.followedUserId===u.user_id);
                      const pendingSent=pendingOut.some(f=>f.addressee_id===u.user_id);
                      const isFollowerNotFollowed = followers.some(f=>f.followerUserId===u.user_id) && !alreadyFollowing;
                      return (
                        <div key={u.user_id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"6px 10px",background:COLORS.card,border:`1px solid ${COLORS.border}`,borderRadius:8}}>
                          <div style={{display:"flex",alignItems:"center",gap:8}}>
                            <div style={{width:28,height:28,borderRadius:"50%",overflow:"hidden",background:`${COLORS.accent}11`,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center"}}>
                              {u.avatar_url ? <img src={u.avatar_url} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/> : <span style={{fontSize:12}}>👤</span>}
                            </div>
                            <div>
                              <div style={{fontSize:13,fontWeight:500,color:COLORS.text}}>{u.username ? `@${u.username}` : "?"}{u.is_private?" 🔒":""}</div>
                              <div style={{fontSize:11,color:COLORS.muted}}>{[u.first_name,u.last_name].filter(Boolean).join(" ")}</div>
                            </div>
                          </div>
                          {alreadyFollowing
                            ?<span className="friend-action-btn pending" style={{fontSize:11,padding:"3px 8px"}}>{t.followAlready}</span>
                            :pendingSent
                              ?<span className="friend-action-btn pending" style={{fontSize:11,padding:"3px 8px"}}>{t.followSent}</span>
                              :<button className="friend-action-btn add" style={{fontSize:11,padding:"3px 10px"}} onClick={()=>sendFollowRequest(u.user_id, u.is_private)}>{isFollowerNotFollowed ? t.followBackBtn : t.followBtn}</button>
                          }
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Following list */}
              <div style={{marginBottom:8}}>
                <div className="friends-title" style={{marginBottom:6,fontSize:13}}>{t.followingList} ({friends.length})</div>
                {friends.length===0?<div className="empty-friends">{t.followNone}</div>:friends.map(f=>{
                  const uname = f.profile?.username ? `@${f.profile.username}` : "?";
                  const fc = followCounts[f.followedUserId] || {following:0,followers:0};
                  const userMems = friendMemories.filter(m=>m.user_id===f.followedUserId);
                  const typeCounts = {};
                  userMems.forEach(m=>(m.type||"Restaurant").split(",").forEach(tp=>{const k=tp.trim();typeCounts[k]=(typeCounts[k]||0)+1;}));
                  return (
                  <div key={f.id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"6px 10px",background:COLORS.card,border:`1px solid ${COLORS.border}`,borderRadius:8,marginBottom:4}}>
                    <div style={{display:"flex",alignItems:"center",gap:8,flex:1,minWidth:0}}>
                      <div style={{width:24,height:24,borderRadius:"50%",overflow:"hidden",background:`${COLORS.accent}11`,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center"}}>
                        {f.profile?.avatar_url ? <img src={f.profile.avatar_url} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/> : <span style={{fontSize:11}}>👤</span>}
                      </div>
                      <div style={{minWidth:0}}>
                        <div style={{display:"flex",alignItems:"center",gap:6}}>
                          <span style={{fontSize:13,fontWeight:500,color:COLORS.text}}>{uname}</span>
                          <span style={{fontSize:10,color:COLORS.muted}}>{fc.following} {t.followingList?.toLowerCase()} · {fc.followers} {t.followersList?.toLowerCase()}</span>
                        </div>
                        {userMems.length>0&&<div style={{display:"flex",gap:6,marginTop:2}}>
                          {TYPES.map(tp=>typeCounts[tp]?<span key={tp} style={{fontSize:10,color:COLORS.muted}}>{TYPE_ICONS[tp]}{typeCounts[tp]}</span>:null)}
                        </div>}
                      </div>
                    </div>
                    <div style={{display:"flex",gap:4,alignItems:"center"}}>
                      <button className="friend-action-btn view" style={{fontSize:11,padding:"3px 8px"}} onClick={()=>viewFollowMemories(f)}>{t.followView}</button>
                      <button onClick={()=>unfollow(f)} title={t.followUnfollow} style={{background:"none",border:`1px solid ${COLORS.dislike}33`,color:"#d4869b",borderRadius:"50%",width:22,height:22,cursor:"pointer",fontSize:10,display:"flex",alignItems:"center",justifyContent:"center",padding:0}}>✕</button>
                    </div>
                  </div>
                );})}
              </div>

              {/* Followers list */}
              <div style={{marginBottom:8}}>
                <div className="friends-title" style={{marginBottom:6,fontSize:13}}>{t.followersList} ({followers.length})</div>
                {followers.length>0&&followers.map(f=>{
                  const uname = f.profile?.username ? `@${f.profile.username}` : "?";
                  const iFollowBack = friends.some(fr=>fr.followedUserId===f.followerUserId);
                  const fc = followCounts[f.followerUserId] || {following:0,followers:0};
                  return (
                  <div key={f.id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"6px 10px",background:COLORS.card,border:`1px solid ${COLORS.border}`,borderRadius:8,marginBottom:4}}>
                    <div style={{display:"flex",alignItems:"center",gap:8,flex:1,minWidth:0}}>
                      <div style={{width:24,height:24,borderRadius:"50%",overflow:"hidden",background:`${COLORS.accent}11`,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center"}}>
                        {f.profile?.avatar_url ? <img src={f.profile.avatar_url} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/> : <span style={{fontSize:11}}>👤</span>}
                      </div>
                      <div style={{minWidth:0}}>
                        <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
                          <span style={{fontSize:13,fontWeight:500,color:COLORS.text}}>{uname}</span>
                          <span style={{fontSize:10,color:COLORS.muted}}>{fc.following} {t.followingList?.toLowerCase()} · {fc.followers} {t.followersList?.toLowerCase()}</span>
                        </div>
                      </div>
                    </div>
                    {!iFollowBack && <button className="friend-action-btn add" style={{fontSize:11,padding:"3px 10px"}} onClick={()=>{
                      const isPrivate = f.profile?.is_private || false;
                      sendFollowRequest(f.followerUserId, isPrivate);
                    }}>{t.followBackBtn}</button>}
                    {iFollowBack && <span className="friend-action-btn pending" style={{opacity:0.5,fontSize:11,padding:"3px 8px"}}>{t.followAlready}</span>}
                  </div>);
                })}
              </div>

              {/* Pending requests I sent */}
              {pendingOut.length>0&&(
                <div>
                  <div className="friends-title" style={{marginBottom:6,fontSize:13}}>{t.followPending} ({pendingOut.length})</div>
                  {pendingOut.map(f=>(
                    <div key={f.id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"6px 10px",background:COLORS.card,border:`1px solid ${COLORS.border}`,borderRadius:8,marginBottom:4}}>
                      <span style={{fontSize:13,fontWeight:500,color:COLORS.text}}>@{f.profiles?.username||"?"}</span>
                      <span className="friend-action-btn pending" style={{fontSize:11,padding:"3px 8px"}}>{t.followSent||"Pending"}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {showProfilePanel && (
            <div className="alert-overlay" style={{zIndex:500,overflowY:"auto",padding:"10px",alignItems:"flex-start"}} onClick={()=>setShowProfilePanel(false)}>
              <div className="alert-box" style={{maxWidth:500,width:"100%",padding:0,margin:"auto",maxHeight:"none"}} onClick={e=>e.stopPropagation()}>
                <div style={{padding:"20px 24px 0",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:22,fontStyle:"italic",color:COLORS.accent}}>👤 {t.tabProfile||"Profile"}</div>
                  <button onClick={()=>setShowProfilePanel(false)} style={{background:"none",border:"none",fontSize:20,color:COLORS.muted,cursor:"pointer"}}>✕</button>
                </div>
                <div style={{padding:"16px 24px 24px"}}>
            <div className="prefs-section">
              <div className="prefs-card">
                <div className="prefs-card-title">{t.profileIdentity}</div>
                {/* Avatar */}
                <div style={{display:"flex",justifyContent:"center",marginBottom:12}}>
                  <label style={{cursor:"pointer",position:"relative"}}>
                    <div style={{width:72,height:72,borderRadius:"50%",border:`2px dashed ${COLORS.accent}66`,display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden",background:`${COLORS.accent}11`}}>
                      {prefs.avatar_url
                        ? <img src={prefs.avatar_url} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                        : <span style={{fontSize:24,color:COLORS.accent}}>📷</span>}
                    </div>
                    <div style={{fontSize:10,color:COLORS.muted,textAlign:"center",marginTop:4}}>{t.profilePhoto||"Photo"}</div>
                    <input type="file" accept="image/*" style={{display:"none"}} onChange={async(e)=>{
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const uid = session.user.id;
                      const ext = file.name.split('.').pop();
                      const path = `${uid}/avatar.${ext}`;
                      try {
                        await supabase.storage.from('avatars').upload(path, file, {upsert:true});
                        const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path);
                        if (urlData?.publicUrl) setPrefs(p=>({...p, avatar_url: urlData.publicUrl + '?t=' + Date.now()}));
                      } catch(err) { console.error('Avatar upload error:', err); }
                    }}/>
                  </label>
                </div>
                <div className="row-2">
                  <div className="field"><label>{t.profileFirstName}</label><input placeholder={t.profileFirstName} value={prefs.firstName||""} onChange={e=>setPrefs(p=>({...p,firstName:e.target.value}))}/></div>
                  <div className="field"><label>{t.profileLastName}</label><input placeholder={t.profileLastName} value={prefs.lastName||""} onChange={e=>setPrefs(p=>({...p,lastName:e.target.value}))}/></div>
                </div>
                <div className="field" style={{marginTop:8}}>
                  <label>{t.profileUsername||"Username"}</label>
                  <input placeholder="@username" value={prefs.username ? `@${prefs.username}` : ""} onChange={e=>setPrefs(p=>({...p,username:e.target.value.replace(/[^a-zA-Z0-9_.]/g,"").toLowerCase()}))} style={{fontFamily:"'DM Sans',monospace"}}/>
                </div>
                <div className="field" style={{marginTop:8}}>
                  <label>{t.profilePrivacy||"Privacy"}</label>
                  <div style={{display:"flex",gap:8}}>
                    {[["public",t.followPublic||"Public","🌍"],["private",t.followPrivate||"Private","🔒"]].map(([val,label,icon])=>(
                      <button key={val} onClick={()=>setPrefs(p=>({...p,is_private:val==="private"}))}
                        style={{flex:1,padding:"8px 12px",borderRadius:10,fontSize:12,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",
                          border:`1px solid ${(prefs.is_private?(val==="private"):(val==="public"))?COLORS.accent:COLORS.border}`,
                          background:(prefs.is_private?(val==="private"):(val==="public"))?`${COLORS.accent}22`:COLORS.card,
                          color:(prefs.is_private?(val==="private"):(val==="public"))?COLORS.accent:COLORS.muted,fontWeight:600}}>
                        {icon} {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="prefs-card">
                <div className="prefs-card-title">🎨 {t.profileTheme||"Theme"}</div>
                <div style={{display:"flex",gap:10,marginTop:8}}>
                  {["light","dark"].map(th=>(
                    <button key={th} onClick={()=>{setThemeKey(th);setPrefs(p=>({...p,theme:th}));}}
                      style={{flex:1,padding:"10px",borderRadius:10,fontSize:13,
                        fontFamily:"'DM Sans',sans-serif",fontWeight:600,cursor:"pointer",
                        border:`1px solid ${themeKey===th?COLORS.accent:COLORS.border}`,
                        background:themeKey===th?`${COLORS.accent}22`:"transparent",
                        color:themeKey===th?COLORS.accent:COLORS.muted}}>
                      {th==="light"?`☀️ ${t.themeLight||"Light"}`:`🌙 ${t.themeDark||"Dark"}`}
                    </button>
                  ))}
                </div>
              </div>
              <div className="prefs-card">
                <div className="prefs-card-title">{t.profileLanguage}</div>
                <div className="field">
                  <label>{t.profileLanguageLabel}</label>
                  <select value={prefs.language||"en"} onChange={e=>setPrefs(p=>({...p,language:e.target.value}))}>
                    {LANGUAGES.map(l=><option key={l.code} value={l.code}>{l.label}</option>)}
                  </select>
                </div>
              </div>

              <div className="prefs-card">
                <div className="prefs-card-title">{t.prefCitiesLabel||"🏙️ Preferred cities"}</div>
                <CityPicker
                  COLORS={COLORS}
                  cities={prefs.preferredCities||[]}
                  onChange={v=>setPrefs(p=>({...p,preferredCities:v}))}
                  placeholder={t.prefCitiesPlaceholder||"Add a city..."}
                  empty={t.prefCitiesEmpty||"No cities added yet"}
                />
              </div>

              <div className="prefs-card">
                <div className="prefs-card-title">🎯 {t.profileBudget||"Budget"}</div>
                <div className="field">
                  <label>{t.profileBudget}</label>
                  <div style={{display:"flex",gap:8}}>
                    {[["",t.profileBudgetNone||"—"],...PRICES.map((p,i)=>[p,[t.priceCheap||"Bon marché",t.priceMid||"Intermédiaire",t.priceHigh||"Haut de gamme"][i]])].map(([val,label])=>(
                      <button key={val} onClick={()=>setPrefs(p=>({...p,budget:val}))}
                        style={{flex:1,padding:"8px 4px",background:(prefs.budget||"")===val?`${COLORS.accent}22`:COLORS.card,
                          border:`1px solid ${(prefs.budget||"")===val?COLORS.accent:COLORS.border}`,
                          borderRadius:8,color:(prefs.budget||"")===val?COLORS.accent:COLORS.muted,
                          cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontSize:11,fontWeight:600,transition:"all 0.2s",
                          lineHeight:1.2,textAlign:"center"}}>
                        <div style={{fontSize:13}}>{val||"—"}</div>
                        <div style={{fontSize:9,fontWeight:400,opacity:0.7,marginTop:1}}>{label}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="prefs-card">
                <div className="prefs-card-title">{t.profileLikes}</div>
                <div className="field"><TagPicker options={PREFS_LOVES_BY_LANG[lang]||PREFS_LOVES_BY_LANG.en} selected={prefs.lovesTags||[]} onChange={v=>setPrefs(p=>({...p,lovesTags:v}))} mode="like"/></div>
              </div>

              <div className="prefs-card" style={{borderColor:COLORS.dislike+"44"}}>
                <div className="prefs-card-title bad">{t.profileDislikes}</div>
                <div className="field"><TagPicker options={PREFS_HATES_BY_LANG[lang]||PREFS_HATES_BY_LANG.en} selected={prefs.hatesTags||[]} onChange={v=>setPrefs(p=>({...p,hatesTags:v}))} mode="dislike"/></div>
              </div>
              <div className="prefs-card">
                <div className="prefs-card-title">{t.profileNotes}</div>
                <div className="field"><textarea placeholder={t.profileNotesPlaceholder||"Régime, allergies, contexte, style préféré..."} value={prefs.notes||""} onChange={e=>setPrefs(p=>({...p,notes:e.target.value}))} style={{minHeight:80,textAlign:"justify"}}/></div>
              </div>
              <button className="prefs-save-btn" onClick={savePrefs}>{t.profileSave}</button>
              {prefsSaved&&<div className="prefs-saved">{t.profileSaved}</div>}
              <button className="prefs-save-btn" style={{borderColor:"#e06060",color:"#e06060",marginTop:4}} onClick={()=>setShowResetModal(true)}>
                🔑 {t.resetPassword||"Reset password"}
              </button>
              <button style={{background:"none",border:"none",color:"#d4869b",fontSize:11,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",marginTop:16,padding:4,textDecoration:"underline"}} onClick={async()=>{
                if (!window.confirm(t.deleteAccountConfirm||"⚠️ Supprimer définitivement votre compte et toutes vos données ? Cette action est irréversible.")) return;
                if (!window.confirm(t.deleteAccountConfirm2||"Êtes-vous vraiment sûr(e) ? Tous vos favoris, amis et préférences seront supprimés.")) return;
                try {
                  const uid = session.user.id;
                  const { data: { session: currentSession } } = await supabase.auth.getSession();
                  const res = await fetch('/api/delete-account', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId: uid, accessToken: currentSession.access_token })
                  });
                  const result = await res.json();
                  if (result.success) {
                    localStorage.clear();
                    try { sessionStorage.clear(); } catch {}
                    await supabase.auth.signOut();
                    showToast(t.deleteAccountDone||"Compte supprimé.");
                    // Force full page reload to clear all React state
                    setTimeout(() => window.location.reload(), 500);
                  } else {
                    showToast("❌ " + (result.error || "Erreur"));
                  }
                } catch(e) { console.error(e); showToast("❌ Erreur"); }
              }}>
                🗑️ {t.deleteAccount||"Supprimer mon compte"}
              </button>
            </div>
                </div>
              </div>
            </div>
          )}

          {!loading && tab === "reco" && (
            <div className="reco-section">
              {/* Ask Outsy — natural language search (the headline feature) */}
              <div id="ask-outsy" className="reco-block ask-outsy-block" style={{background:`linear-gradient(135deg, ${COLORS.accent}11, ${COLORS.accent}05)`,border:`1px solid ${COLORS.accent}33`,borderRadius:14,padding:"16px 16px 14px"}}>
                <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:20,lineHeight:1.25,fontStyle:"italic",color:COLORS.text,fontWeight:500}}>
                  ✨ {(t.askOutsyHeadline||"Hi {name}! Tell me what you're looking for and Outsy will help").replace("{name}", profile?.first_name || "")}
                </div>
                <div style={{position:"relative",width:"100%",marginTop:10}}>
                  <textarea
                    ref={outsyTextareaRef}
                    value={outsyQuery}
                    onChange={e=>setOutsyQuery(e.target.value)}
                    placeholder={outsyQueryListening?(t.recoMoodListening||"À l'écoute..."):(t.askOutsyPlaceholder||"Ex: I'm looking for a rooftop restaurant near me with colleagues")}
                    rows={3}
                    style={{background:COLORS.card,border:`1px solid ${outsyQueryListening?"#e74c3c":COLORS.border}`,borderRadius:10,padding:"12px 56px 12px 14px",color:COLORS.text,fontFamily:"'DM Sans',sans-serif",fontSize:14,width:"100%",resize:"none",minHeight:74,boxSizing:"border-box",lineHeight:1.4,overflow:"hidden",textAlign:"justify"}}
                  />
                  {outsyQuery && (
                    <button type="button" onClick={()=>setOutsyQuery("")} title={t.askOutsyClear||"Clear"} aria-label={t.askOutsyClear||"Clear"} style={{position:"absolute",right:11,top:50,width:30,height:30,borderRadius:"50%",border:`1px solid ${COLORS.border}`,background:COLORS.bg,color:COLORS.muted,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,padding:0,boxShadow:"0 1px 3px rgba(0,0,0,0.06)"}}>✕</button>
                  )}
                  <button type="button" onClick={toggleOutsyDictation} title={outsyQueryListening?(t.recoMoodStop||"Arrêter la dictée"):(t.askOutsyDictate||"Dicter ma demande")} aria-label={outsyQueryListening?(t.recoMoodStop||"Arrêter"):(t.askOutsyDictate||"Dicter")} style={{position:"absolute",right:8,top:8,width:36,height:36,borderRadius:"50%",border:"none",background:outsyQueryListening?"#e74c3c":COLORS.bg,color:outsyQueryListening?"#fff":COLORS.accent,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:17,padding:0,boxShadow:"0 1px 4px rgba(0,0,0,0.08)",animation:outsyQueryListening?"moodPulse 1.2s ease-in-out infinite":"none"}}>🎤</button>
                </div>
                {(micPermissionState === "denied" || showMicHelp) && (
                  <div style={{marginTop:10,padding:"10px 12px",background:`${COLORS.dislike||"#d4869b"}11`,border:`1px solid ${COLORS.dislike||"#d4869b"}44`,borderRadius:8,fontSize:12,color:COLORS.text,fontFamily:"'DM Sans',sans-serif"}}>
                    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:8}}>
                      <span>🎤 {t.micPermissionDeniedShort || "Microphone bloqué pour ce navigateur"}</span>
                      <button onClick={()=>setShowMicHelp(s=>!s)} style={{background:"none",border:"none",color:COLORS.accent,cursor:"pointer",fontSize:12,fontFamily:"'DM Sans',sans-serif",textDecoration:"underline",padding:0}}>
                        {showMicHelp ? (t.gpsHide||"Masquer") : (t.gpsHowToActivate||"Comment activer ?")}
                      </button>
                    </div>
                    {showMicHelp && (
                      <div style={{marginTop:8,paddingTop:8,borderTop:`1px solid ${COLORS.border}`,lineHeight:1.5}}>
                        {MIC_INSTRUCTIONS_FR[detectBrowser()] || MIC_INSTRUCTIONS_FR.unknown}
                        <div style={{marginTop:6,fontSize:11,color:COLORS.muted}}>
                          {t.micAfterActivate || "Après activation, retape sur 🎤. Tu peux aussi taper ta demande au clavier en attendant."}
                        </div>
                      </div>
                    )}
                  </div>
                )}
                <button onClick={handleAnalyzeQuery} disabled={!outsyQuery.trim() || analyzingIntent}
                  style={{marginTop:10,width:"100%",padding:"11px 14px",background:COLORS.accent,border:"none",borderRadius:10,color:COLORS.bg,fontSize:13,fontWeight:700,letterSpacing:"0.04em",cursor:(!outsyQuery.trim()||analyzingIntent)?"not-allowed":"pointer",opacity:(!outsyQuery.trim()||analyzingIntent)?0.5:1,fontFamily:"'DM Sans',sans-serif",textTransform:"uppercase"}}>
                  {analyzingIntent ? (t.askOutsyAnalyzing||"Analyzing...") : (t.askOutsyAnalyze||"✨ Analyze my request")}
                </button>
              </div>
              <div id="reco-settings" className="reco-block">
              <div className="reco-block-title">{t.recoLocation}</div>
              <div className="reco-location-card">
                <div className="location-row">
                  <button className={`loc-btn ${locMode==="gps"?"active":""}`} onClick={()=>{setLocMode("gps");setRecoCoords(null);setGpsReady(false);getGPS();}}>{t.recoGPS}</button>
                  <button className={`loc-btn ${locMode==="free"?"active":""}`} onClick={()=>{setLocMode("free");setRecoCoords(null);recoCoordsRef.current=null;localStorage.removeItem("outsy_recoCoords");}}>{t.recoManual}</button>
                </div>
                {(locMode==="gps" && (gpsPermissionState==="denied" || showGpsHelp)) && (
                  <div style={{marginTop:8,padding:"10px 12px",background:`${COLORS.dislike||"#d4869b"}11`,border:`1px solid ${COLORS.dislike||"#d4869b"}44`,borderRadius:8,fontSize:12,color:COLORS.text,fontFamily:"'DM Sans',sans-serif"}}>
                    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:8}}>
                      <span>📍 {t.gpsPermissionDeniedShort || "Localisation bloquée pour ce navigateur"}</span>
                      <button onClick={()=>setShowGpsHelp(s=>!s)} style={{background:"none",border:"none",color:COLORS.accent,cursor:"pointer",fontSize:12,fontFamily:"'DM Sans',sans-serif",textDecoration:"underline",padding:0}}>
                        {showGpsHelp ? (t.gpsHide||"Masquer") : (t.gpsHowToActivate||"Comment activer ?")}
                      </button>
                    </div>
                    {showGpsHelp && (
                      <div style={{marginTop:8,paddingTop:8,borderTop:`1px solid ${COLORS.border}`,lineHeight:1.5}}>
                        {GPS_INSTRUCTIONS_FR[detectBrowser()] || GPS_INSTRUCTIONS_FR.unknown}
                        <div style={{marginTop:6,fontSize:11,color:COLORS.muted}}>
                          {t.gpsAfterActivate || "Après activation, retape sur \"Ma position\". Tu peux aussi utiliser \"Saisir\" en attendant."}
                        </div>
                      </div>
                    )}
                  </div>
                )}
                {locMode==="gps"&&gpsLocation&&<input className="inline-input" value={gpsLocation} onChange={e=>setGpsLocation(e.target.value)}/>}
                {locMode==="gps"&&!gpsLocation&&<div style={{fontSize:12,color:COLORS.muted}}>{t.recoGPSLoading}</div>}
                {locMode==="free"&&<RecoPlaceSearch COLORS={COLORS} initialValue={freeLocation} onPlaceSelected={(p)=>{if(p){setFreeLocation(p.address);if(p.lat){const c={lat:p.lat,lng:p.lng};setRecoCoords(c);recoCoordsRef.current=c;setHeartsKey(k=>k+1);}  }else{setFreeLocation("");setRecoCoords(null);}}}/>}
                <div className="field"><label>{t.recoRadius}</label><DistanceSlider value={distance} onChange={v=>{setDistance(v);if(locationLabel)setHeartsKey(k=>k+1);}}/></div>
                <div className="field" style={{marginTop:4}}>
                  <label style={{fontSize:10,textTransform:"uppercase",letterSpacing:"0.15em",color:COLORS.muted,fontWeight:500}}>💭 {t.recoMood||"Mood / envie"}</label>
                  <div style={{position:"relative",width:"100%"}}>
                    <textarea ref={moodTextareaRef} value={recoMood} onChange={e=>setRecoMood(e.target.value)} placeholder={recoMoodListening?(t.recoMoodListening||"À l'écoute..."):(t.recoMoodPlaceholder||"Ex: rooftop, romantique, brunch...")} rows={1} style={{background:COLORS.card,border:`1px solid ${recoMoodListening?"#e74c3c":COLORS.border}`,borderRadius:8,padding:"10px 80px 10px 12px",color:COLORS.text,fontFamily:"'DM Sans',sans-serif",fontSize:13,width:"100%",fontStyle:recoMood?"normal":"italic",boxSizing:"border-box",resize:"none",minHeight:40,lineHeight:1.4,overflow:"hidden",textAlign:"justify"}}/>
                    {recoMood && (
                      <button type="button" onClick={()=>setRecoMood("")} title={t.askOutsyClear||"Effacer"} aria-label={t.askOutsyClear||"Effacer"} style={{position:"absolute",right:44,top:8,width:24,height:24,borderRadius:"50%",border:`1px solid ${COLORS.border}`,background:COLORS.bg,color:COLORS.muted,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,padding:0}}>✕</button>
                    )}
                    <button type="button" onClick={toggleMoodDictation} title={recoMoodListening?(t.recoMoodStop||"Arrêter la dictée"):(t.recoMoodDictate||"Dicter")} aria-label={recoMoodListening?(t.recoMoodStop||"Arrêter la dictée"):(t.recoMoodDictate||"Dicter")} style={{position:"absolute",right:6,top:6,width:32,height:32,borderRadius:"50%",border:"none",background:recoMoodListening?"#e74c3c":"transparent",color:recoMoodListening?"#fff":COLORS.muted,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,padding:0,animation:recoMoodListening?"moodPulse 1.2s ease-in-out infinite":"none"}}>🎤</button>
                  </div>
                </div>
                <div>
                  <div style={{fontSize:10,textTransform:"uppercase",letterSpacing:"0.15em",color:COLORS.muted,marginBottom:6}}>Type</div>
                  <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>{TYPES.map(tp=><button key={tp} className={`reco-type-btn ${recoType===tp?"active":""}`} onClick={()=>{setRecoType(tp);if(locationLabel)setHeartsKey(k=>k+1);}}>{TYPE_ICONS[tp]} {(TYPES_I18N[lang]||TYPES_I18N.en)[tp]||tp}</button>)}</div>
                </div>
                <div className="filters-row"><span className="filter-label">{t.filterPrice}</span>{[[ALL,t.filterAll],...PRICES.map(p=>[p,p])].map(([val,label])=><button key={val} className={`filter-btn ${recoPrice===val?"active":""}`} onClick={()=>{setRecoPrice(val);if(locationLabel)setHeartsKey(k=>k+1);}}>{label}</button>)}</div>
                <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                  <button className={`filter-btn ${recoKids?"active":""}`} onClick={()=>{setRecoKids(k=>!k);if(locationLabel)setHeartsKey(k=>k+1);}}>{t.filterKids||"👶 Kids friendly"}</button>
                  {friends.length>0&&(<>
                    <button className={`filter-btn ${recoFriendFilter==="all"?"active":""}`} onClick={()=>{setRecoFriendFilter("all");if(locationLabel)setHeartsKey(k=>k+1);}}>👤+👥</button>
                    <button className={`filter-btn ${recoFriendFilter==="mine"?"active":""}`} onClick={()=>{setRecoFriendFilter("mine");if(locationLabel)setHeartsKey(k=>k+1);}}>👤 {t.filterMine||"Mine"}</button>
                    <button className={`filter-btn ${recoFriendFilter==="friends"?"active":""}`} onClick={()=>{setRecoFriendFilter("friends");if(locationLabel)setHeartsKey(k=>k+1);}}>👥 {t.filterFriendsOnly||"Friends"}</button>
                  </>)}
                </div>
                {recoType === "Destination" ? (
                  <div style={{padding:"10px 12px",background:`${COLORS.accent}11`,border:`1px solid ${COLORS.accent}33`,borderRadius:8,fontSize:12,color:COLORS.muted,fontFamily:"'DM Sans',sans-serif",lineHeight:1.4}}>
                    {t.recoDestinationInfo||"Destination = villes et pays à visiter. La recherche \"près de moi\" ne s'applique pas — enregistre tes destinations depuis l'onglet + Ajouter et retrouve-les ici."}
                  </div>
                ) : (
                <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                  <button className="reco-btn" style={{flex:"1 1 140px",fontSize:11,padding:"13px 8px"}} onClick={()=>loadRecos(true)} disabled={heartLoading||aiLoading||geocoding||!locationLabel||(locMode==="gps"&&!gpsReady)}>
                    🔥 {t.recoFindNearby||"Lieux populaires"}
                  </button>
                  <button className="reco-btn" style={{flex:"1 1 140px",fontSize:11,padding:"13px 8px",background:`${COLORS.accent}22`,borderColor:COLORS.accent,color:COLORS.accent,fontWeight:700}} onClick={()=>loadRecos(false)} disabled={heartLoading||aiLoading||geocoding||!locationLabel||(locMode==="gps"&&!gpsReady)}>
                    {geocoding?t.recoLocating:heartLoading||aiLoading?t.recoSearching:(t.recoFind||"✨ Demander à Outsy AI")}
                  </button>
                  {(heartLoading||aiLoading||geocoding)&&(
                    <button onClick={cancelSearch} style={{padding:"13px 16px",background:COLORS.dislikeBg,border:`1px solid ${COLORS.dislike}44`,borderRadius:10,color:"#e06060",cursor:"pointer",fontSize:13,fontWeight:600,fontFamily:"'DM Sans',sans-serif",whiteSpace:"nowrap"}}>
                      ✕ {t.cancel||"Cancel"}
                    </button>
                  )}
                </div>
                )}
              </div>
              </div>

              {(heartsToShow.length>0||aiRecos.length>0||moodFilteredNearby.length>0)&&(
                <GoogleMap recommendations={aiRecos} userCoords={recoCoords} heartMemories={heartsToShow} nearbyPlaces={moodFilteredNearby} pins={recoPins} themeKey={themeKey} COLORS={COLORS} t={t} recoLimit={recoLimit}/>
              )}

              {heartsToShow.length>0&&(
                <div id="reco-hearts" className="reco-block section-hearts">
                  <div className="reco-block-title">{t.recoHearts}{recoMood ? ` · ${recoMood}` : ""}</div>
                  <div className="memory-list">{heartsToShow.map(m=><MemoryCard key={`heart-${m.id}`} m={m} onOpen={()=>openPlaceSheet(m,heartsToShow)} isMine={m.isMine} lang={lang} COLORS={COLORS} t={t} onEdit={setEditMemory} onDelete={deleteMemory} onDeleteRequest={(id,name)=>setDeleteConfirm({id,name})} onViewFriend={(name,fMem)=>{ const mem=fMem||friendMemories.find(x=>x.friendName===name&&x.name===m.name); if(mem)setFriendMemoryModal({memory:mem,friendName:name}); }} setFriendMemoryModal={setFriendMemoryModal} addFriendToCarnet={addFriendToCarnet}
                  fitTags={computeFitTags(m, { ...fitCtx, source: "favorite" }, lang)}
                  onSaveFriend={(fMem)=>addFriendToCarnet(fMem)} onPin={(m)=>openPinModal({name:m.name,type:m.type,price:m.price,city:m.city,country:m.country,address:m.address,cuisine:m.cuisine,activityType:m.activity_type,google_place_id:m.google_place_id})}/>)}</div>
                </div>
              )}

              {/* Pins in Reco */}
              {heartsLoaded&&recoPins.length>0&&(()=>{
                const pinsWithDist = recoPins.map(p => {
                  if (p.lat && p.lng && recoCoords?.lat) {
                    const R = 6371; const dLat = (recoCoords.lat - p.lat) * Math.PI/180;
                    const dLng = (recoCoords.lng - p.lng) * Math.PI/180;
                    const a = Math.sin(dLat/2)**2 + Math.cos(p.lat*Math.PI/180)*Math.cos(recoCoords.lat*Math.PI/180)*Math.sin(dLng/2)**2;
                    const km = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
                    return { ...p, _dist: km * 1000 };
                  }
                  return p;
                });
                return (
                <div id="reco-pins" className="reco-block section-pins">
                  <div className="reco-block-title">📌 {t.tabPins||"Pins"}{recoMood ? ` · ${recoMood}` : ""} ({pinsWithDist.length})</div>
                  <div className="memory-list">
                    {pinsWithDist.map(pin=>(
                      <div key={pin.id} className="memory-card" style={{borderLeft:`3px solid #6b8cce`}}>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                          <div style={{flex:1,minWidth:0}}>
                            <div className="memory-name" onClick={()=>openPlaceSheet(pin,pinsWithDist)} style={{cursor:"pointer"}}>{TYPE_ICONS[pin.type?.split(",")[0]?.trim()]||"📍"} {pin.name}</div>
                          </div>
                          <CardActions
                            distance={pin._dist}
                            friendsHave={pin.friendsWhoHave?.length>0 ? pin.friendsData : null}
                            myMem={null}
                            onEdit={()=>{}}
                            onAdd={()=>{
                              setRecoToAdd({name:pin.name,type:pin.type||"Restaurant",price:pin.price||"",city:pin.city||"",country:pin.country||"",address:pin.address||"",cuisine:pin.cuisine||"",activityType:pin.activity_type||"",google_place_id:pin.google_place_id||"",rating:0,likeTags:[],dislikeTags:[],why:"",dislike:"",kidsf:false});
                              setPrevTab("reco");
                            }}
                            COLORS={COLORS} t={t}
                            setFriendMemoryModal={setFriendMemoryModal}
                            addFriendToCarnet={addFriendToCarnet}
                          />
                        </div>
                        <div className="memory-meta" style={{marginTop:4,justifyContent:"flex-start",flexWrap:"wrap",gap:5}}>
                          {pin.cuisine&&<span className="badge">{pin.cuisine}</span>}
                          {pin.activity_type&&<span className="badge">{pin.activity_type}</span>}
                          {pin.price&&<span className="badge price">{pin.price}</span>}
                        </div>
                        {(() => {
                          const tags = computeFitTags(pin, { ...fitCtx, source: "pin" }, lang);
                          return tags.length > 0 ? <div style={{marginTop:4}}><FitTags tags={tags} COLORS={COLORS}/></div> : null;
                        })()}
                        {(pin.address||pin.city)&&<div className="memory-location">
                          📍 {pin.address||[pin.city,pin.country].filter(Boolean).join(", ")}
                          <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(pin.name+", "+(pin.address||[pin.city,pin.country].filter(Boolean).join(", ")))}`}
                            target="_blank" rel="noopener noreferrer"
                            style={{color:COLORS.accent,fontSize:12,marginLeft:6,textDecoration:"none"}}>Maps →</a>
                        </div>}
                        {pin.pin_note&&<div style={{fontSize:11,color:"#6b8cce",marginTop:2,fontStyle:"italic"}}>💬 {pin.pin_note}</div>}
                      </div>
                    ))}
                  </div>
                </div>
                );
              })()}

              {(aiLoading||aiRecos.length>0)&&(
                <div id="reco-ai" className="reco-block section-ai">
                  <div className="reco-block-title">{t.recoAI}</div>
                  {aiLoading&&<div className="thinking"><div className="dot"/><div className="dot"/><div className="dot"/></div>}
                  {aiRecos.length>0&&!aiLoading&&(
                    <>
                      <div className="ai-reco-list">
                        {aiRecos.slice(0, recoType === "Activité" ? 20 : 10).map((reco,i)=>(
                          <div key={i} className="ai-reco-card">
                            <div className="ai-reco-header">
                              <div className="ai-reco-top">
                                <div className="ai-reco-name" onClick={()=>openPlaceSheet(reco, aiRecos)} style={{cursor:"pointer"}}>{getTypeIcon(reco.type||recoType)} {reco.name}</div>
                                <div style={{display:"flex",alignItems:"center",gap:8}}>
                                  {reco.outsideRadius&&reco._dist&&<span style={{fontSize:9,color:"#b89a2a",background:"rgba(184,154,42,0.12)",border:"1px solid rgba(184,154,42,0.3)",borderRadius:20,padding:"2px 7px",whiteSpace:"nowrap"}}>⚠️ {reco._dist>=1000?`${(reco._dist/1000).toFixed(1)}km`:`${Math.round(reco._dist)}m`}</span>}
                                  <div className="ai-reco-rank">#{i+1}</div>
                                  <CardActions
                                    distance={!reco.outsideRadius ? reco._dist : null}
                                    friendsHave={friendMemories.filter(fm => fm.name.toLowerCase()===reco.name.toLowerCase())}
                                    myMem={memories.find(mm => mm.name.toLowerCase()===reco.name.toLowerCase())}
                                    onEdit={setEditMemory}
                                    onAdd={()=>addRecoToCarnet(reco)}
                                    onPin={()=>openPinModal({name:reco.name,type:reco.type||recoType,price:reco.price,city:reco.city,country:reco.country,address:reco.address,cuisine:reco.cuisine,activityType:reco.activityType,google_place_id:reco.google_place_id,lat:reco.lat,lng:reco.lng})}
                                    COLORS={COLORS}
                                    t={t}
                                    setFriendMemoryModal={setFriendMemoryModal}
                                    addFriendToCarnet={addFriendToCarnet}
                                  />
                                </div>
                              </div>
                              <div className="ai-reco-meta">
                                {reco.cuisine&&<span className="badge">{reco.cuisine}</span>}
                                {reco.googleRating&&<span className="badge stars" style={{padding:"2px 6px"}}><StarRating rating={reco.googleRating} size={11} emptyColor={COLORS.border}/></span>}
                                <span className="badge price">{reco.price}</span>
                              </div>
                              {(() => {
                                const tags = computeFitTags(reco, { ...fitCtx, source: "ai", aiSignals: reco.signals }, lang);
                                return tags.length > 0 ? <div style={{marginTop:2}}><FitTags tags={tags} COLORS={COLORS}/></div> : null;
                              })()}
                              {reco.address&&(
                                <div className="ai-reco-address">
                                  📍 {reco.address}
                                  <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(reco.name+(reco.address?", "+reco.address:""))}`} target="_blank" rel="noopener noreferrer" className="maps-link" style={{marginLeft:8}}>{t.recoMapsLink}</a>
                                </div>
                              )}
                              {reco.openNow!==undefined&&reco.openNow!==null&&<OpeningHoursWidget openNow={reco.openNow} hours={reco.openingHours} lang={lang} COLORS={COLORS} t={t}/>}
                              {reco.headline&&<div className="ai-reco-why">« {reco.headline} »</div>}
                              {!reco.headline&&reco.why&&<div className="ai-reco-why">« {reco.why} »</div>}
                              {reco.tip&&<div className="ai-reco-tip">💡 {reco.tip}</div>}
                              {reco.warning&&<div className="ai-reco-warning">⚠️ {reco.warning}</div>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}

              {popularToShow.length>0&&(()=>{
                const filtered = popularToShow;
                return (
                  <div id="reco-popular" className="reco-block section-nearby">
                    <div className="reco-block-title">{t.recoNearby}{recoMood ? ` · ${recoMood}` : ""} ({filtered.length})</div>
                    <div className="ai-reco-list">
                      {filtered.map((p,i)=>(
                        <div key={i} className="ai-reco-card">
                          <div className="ai-reco-header">
                            <div className="ai-reco-top">
                              <div className="ai-reco-name" onClick={()=>openPlaceSheet(p, filtered)} style={{cursor:"pointer"}}>{getTypeIcon(recoType)} {p.name}</div>
                              <CardActions
                                distance={p._dist}
                                friendsHave={friendMemories.filter(fm => fm.name.toLowerCase()===p.name.toLowerCase())}
                                myMem={memories.find(mm => mm.name.toLowerCase()===p.name.toLowerCase())}
                                onEdit={setEditMemory}
                                onAdd={()=>addRecoToCarnet({name:p.name,type:recoType,price:p.price||"",address:p.address,city:p.city||"",country:p.country||"",streetAddress:p.streetAddress||"",cuisine:p.cuisine,googleRating:p.rating,activityType:p.primaryTypeDisplayName?.text||p.primaryTypeDisplayName||"",google_place_id:p.id||"",primaryTypeDisplayName:p.primaryTypeDisplayName})}
                                onPin={()=>openPinModal({name:p.name,type:recoType,price:p.price||"",address:p.address,cuisine:p.cuisine,activityType:p.primaryTypeDisplayName?.text||p.primaryTypeDisplayName||"",id:p.id||"",lat:p.location?.latitude||p.lat,lng:p.location?.longitude||p.lng})}
                                COLORS={COLORS}
                                t={t}
                                setFriendMemoryModal={setFriendMemoryModal}
                                addFriendToCarnet={addFriendToCarnet}
                              />
                            </div>
                            <div className="ai-reco-meta">
                              {p.cuisine&&<span className="badge">{p.cuisine.toUpperCase()}</span>}
                              {p.rating&&<span className="badge stars" style={{padding:"2px 6px"}}><StarRating rating={p.rating} size={11} emptyColor={COLORS.border}/></span>}
                              {p.price&&<span className="badge price">{p.price}</span>}
                            </div>
                            {(() => {
                              const tags = computeFitTags(p, { ...fitCtx, source: "popular" }, lang);
                              return tags.length > 0 ? <div style={{marginTop:2}}><FitTags tags={tags} COLORS={COLORS}/></div> : null;
                            })()}
                            {(p.features||[]).length>0&&(
                              <div style={{display:"flex",gap:4,flexWrap:"wrap",marginTop:2}}>
                                {p.features.map((f,fi)=><span key={fi} style={{fontSize:9,padding:"2px 6px",borderRadius:10,background:`${COLORS.accent}11`,color:COLORS.accent,border:`1px solid ${COLORS.accent}22`,fontFamily:"'DM Sans',sans-serif"}}>{f}</span>)}
                              </div>
                            )}
                            {p.address&&(
                              <div className="ai-reco-address">
                                📍 {p.address}
                                <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.name+(p.address?", "+p.address:""))}`} target="_blank" rel="noopener noreferrer" className="maps-link" style={{marginLeft:8}}>{t.recoMapsLink}</a>
                              </div>
                            )}
                            {p.openNow!==undefined&&p.openNow!==null&&<OpeningHoursWidget openNow={p.openNow} hours={p.openingHours} lang={lang} COLORS={COLORS} t={t}/>}
                            {p.editorialSummary&&<div className="ai-reco-why">« {p.editorialSummary} »</div>}
                            {!p.editorialSummary&&p.topReview&&<div className="ai-reco-why" style={{fontSize:12}}>💬 « {p.topReview} »</div>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      </div>

      {editMemory&&(
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-title">{t.editTitle} {editMemory.name}</div>
            <MemoryForm initial={editMemory} COLORS={COLORS} onSave={handleUpdate} onCancel={()=>setEditMemory(null)} isEdit={true} t={t} lang={lang} onDelete={()=>{setDeleteConfirm({id:editMemory.id,name:editMemory.name});setEditMemory(null);}}/>
          </div>
        </div>
      )}

      {recoToAdd&&(
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-title">+ {recoToAdd.name}</div>
            <MemoryForm initial={recoToAdd} lang={lang} COLORS={COLORS} onSave={async(form)=>{
              // Check for duplicate first
              const dup = memories.find(m => m.name.toLowerCase().trim()===form.name.toLowerCase().trim());
              if (dup) {
                setDuplicateAlert({ existing: dup, newForm: form });
                setRecoToAdd(null);
                return;
              }
              const {isMine:_a,friendName:_b,distanceKm:_c,_lat,_lng,profiles:_d,friendsData:_e,friendsWhoHave:_f,openNow:_g,openingHours:_h,googleRating:_i,activityType,priceSource:_k,...cleanF}=form;
              const entry={...cleanF,activity_type:activityType||null,id:Date.now(),ts:Date.now(),user_id:userId};
              const {error}=await supabase.from('memories').insert(entry);
              if(!error){
                setMemories(prev=>[entry,...prev]);showToast(t.toastAdded);
                // Auto-remove matching pin
                const matchingPin = pins.find(p => p.name.toLowerCase() === form.name.toLowerCase());
                if (matchingPin) { await supabase.from('memories').delete().eq('id', matchingPin.id).eq('user_id', userId); setPins(prev => prev.filter(p => p.id !== matchingPin.id)); }
              }
              setRecoToAdd(null);
              if (prevTab && prevTab !== "add") { setTab(prevTab); setPrevTab("reco"); }
            }} onCancel={()=>{setRecoToAdd(null); if (prevTab && prevTab !== "add") { setTab(prevTab); setPrevTab("reco"); }}} isEdit={false} prefilled={true} t={t}/>
          </div>
        </div>
      )}

      {closedFavoritesAlert.length>0&&(
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-title">{t.closedTitle||"⚠️ Closed places"}</div>
            <p style={{fontSize:13,color:COLORS.muted,marginBottom:12}}>{t.closedText||"These places appear to be permanently closed. Remove them from your Favorites?"}</p>
            {closedFavoritesAlert.map(f=>(
              <div key={f.id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"8px 0",borderBottom:`1px solid ${COLORS.border}44`}}>
                <span style={{fontSize:13,color:COLORS.text}}>🔴 {f.name}</span>
              </div>
            ))}
            <div style={{display:"flex",gap:8,marginTop:16}}>
              <button className="modal-btn secondary" style={{flex:1}} onClick={()=>setClosedFavoritesAlert([])}>{t.closedKeep||"Keep"}</button>
              <button className="modal-btn primary" style={{flex:1}} onClick={async()=>{
                for (const f of closedFavoritesAlert) {
                  await supabase.from('memories').delete().eq('id',f.id).eq('user_id',userId);
                  setMemories(prev=>prev.filter(m=>m.id!==f.id));
                  // Add to community closed list
                  if (f.placeId) await supabase.from('closed_places').upsert({place_id:f.placeId,name:f.name,confirmed_by:userId},{onConflict:'place_id',ignoreDuplicates:true});
                }
                setClosedFavoritesAlert([]);
                showToast(t.closedToast||"✓ Favorites removed");
              }}>{t.closedRemove||"Remove"}</button>
            </div>
          </div>
        </div>
      )}
      {friendMemoryModal&&(
        <div className="modal-overlay" onClick={e=>{if(e.target===e.currentTarget)setFriendMemoryModal(null);}}>
          <div className="modal" style={{maxHeight:"90vh",overflowY:"auto"}}>
            <div className="modal-title">👤 {friendMemoryModal.friendName}</div>
            <MemoryCard m={friendMemoryModal.memory} isMine={false} lang={lang} COLORS={COLORS} t={t} onEdit={()=>{}} onDelete={()=>{}} onDeleteRequest={()=>{}}
              onSaveFriend={(fMem)=>{setFriendMemoryModal(null);addFriendToCarnet(fMem);}}/>
            <div style={{marginTop:16,borderTop:`1px solid ${COLORS.border}`,paddingTop:12}}>
              <div style={{fontSize:11,color:COLORS.muted,marginBottom:10,textAlign:"center",textTransform:"uppercase",letterSpacing:"0.1em"}}>{t.friendSaveLabel||"Edit before saving"}</div>
              <MemoryForm
                key={"friend-"+friendMemoryModal.memory.id}
                initial={friendMemoryModal.memory}
                isEdit={true}
                t={t}
                lang={lang}
                COLORS={COLORS} onSave={(form)=>{
                  const dup=memories.find(m=>m.name.toLowerCase()===form.name.toLowerCase());
                  setFriendMemoryModal(null);
                  if(dup){setDuplicateAlert({existing:dup,newForm:form});}
                  else{handleAdd(form);}
                }}
                onCancel={()=>setFriendMemoryModal(null)}
              />
            </div>
          </div>
        </div>
      )}
      {/* Onboarding — first-time user setup */}
      {showOnboarding&&(()=>{
        const totalSteps = 7;
        const lang = prefs.language || "en";
        const ot = ONBOARD_TOUR[lang] || ONBOARD_TOUR["en"];
        const labelStyle = {fontSize:10,textTransform:"uppercase",letterSpacing:"0.15em",color:COLORS.muted,fontWeight:500,display:"block",marginBottom:6};
        const inputStyle = {background:COLORS.bg,border:`1px solid ${COLORS.border}`,borderRadius:8,padding:"10px 12px",color:COLORS.text,fontFamily:"'DM Sans',sans-serif",fontSize:14,width:"100%"};

        const finishOnboarding = async () => {
          localStorage.setItem("outsy_onboarding_done","1");
          setShowOnboarding(false);
          setShowTour(true);
          const userId = session.user.id;
          const { firstName, lastName, username, is_private, avatar_url, ...dbPrefs } = prefs;
          setProfile({user_id:userId,first_name:firstName,last_name:lastName,email:session.user.email,username:username||null,is_private:is_private||false,avatar_url:avatar_url||null});
          try {
            await supabase.from('profiles').upsert({user_id:userId,first_name:firstName,last_name:lastName,email:session.user.email,username:username||null,is_private:is_private||false,avatar_url:avatar_url||null});
            await supabase.from('preferences').upsert({user_id:userId,...dbPrefs,onboarding_done:true});
          } catch(e) { console.error("Onboarding save error:", e); }
        };

        return (
          <div className="alert-overlay" style={{zIndex:600,overflowY:"auto",padding:"20px 10px",alignItems:"flex-start"}}>
            <div className="alert-box" style={{maxWidth:440,padding:28,maxHeight:"none",margin:"auto",width:"100%"}}>
              {/* Progress dots */}
              <div style={{display:"flex",justifyContent:"center",gap:6,marginBottom:20}}>
                {Array.from({length:totalSteps}).map((_,i)=><div key={i} style={{width:8,height:8,borderRadius:"50%",background:i===onboardingStep?COLORS.accent:`${COLORS.accent}33`}}/>)}
              </div>

              {/* Step 0: Welcome + Name + Language */}
              {onboardingStep===0&&(<>
                <div style={{textAlign:"center",marginBottom:16}}>
                  <div style={{fontSize:36,marginBottom:8}}>👋</div>
                  <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:26,fontStyle:"italic",color:COLORS.accent}}>{ot.onboardWelcome}</div>
                  <div style={{fontSize:13,color:COLORS.muted,marginTop:8}}>{ot.onboardWelcomeSub}</div>
                </div>
                {/* Avatar upload */}
                <div style={{display:"flex",justifyContent:"center",marginBottom:12}}>
                  <label style={{cursor:"pointer",position:"relative"}}>
                    <div style={{width:80,height:80,borderRadius:"50%",border:`2px dashed ${COLORS.accent}66`,display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden",background:`${COLORS.accent}11`}}>
                      {prefs.avatar_url
                        ? <img src={prefs.avatar_url} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                        : <span style={{fontSize:28,color:COLORS.accent}}>📷</span>}
                    </div>
                    <div style={{fontSize:10,color:COLORS.muted,textAlign:"center",marginTop:4}}>{t.profilePhoto||"Photo"}</div>
                    <input type="file" accept="image/*" style={{display:"none"}} onChange={async(e)=>{
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const uid = session.user.id;
                      const ext = file.name.split('.').pop();
                      const path = `${uid}/avatar.${ext}`;
                      try {
                        await supabase.storage.from('avatars').upload(path, file, {upsert:true});
                        const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path);
                        if (urlData?.publicUrl) setPrefs(p=>({...p, avatar_url: urlData.publicUrl + '?t=' + Date.now()}));
                      } catch(err) { console.error('Avatar upload error:', err); }
                    }}/>
                  </label>
                </div>
                <div style={{display:"flex",gap:10,marginBottom:8}}>
                  <div style={{flex:1}}><label style={labelStyle}>{t.profileFirstName||"First name"}</label><input value={prefs.firstName||""} onChange={e=>setPrefs(p=>({...p,firstName:e.target.value}))} style={inputStyle}/></div>
                  <div style={{flex:1}}><label style={labelStyle}>{t.profileLastName||"Last name"}</label><input value={prefs.lastName||""} onChange={e=>setPrefs(p=>({...p,lastName:e.target.value}))} style={inputStyle}/></div>
                </div>
                <div style={{marginBottom:12}}>
                  <label style={labelStyle}>{t.profileUsername||"Username"} <span style={{color:"#d4869b"}}>*</span></label>
                  <input value={prefs.username ? `@${prefs.username}` : ""} placeholder="@username" onChange={e=>{setUsernameError("");setPrefs(p=>({...p,username:e.target.value.replace(/[^a-zA-Z0-9_.@]/g,"").replace(/^@/,"").toLowerCase()}));}} style={{...inputStyle,fontFamily:"'DM Sans',monospace",borderColor:usernameError?"#d4869b":undefined}}/>
                  {usernameError&&<div style={{color:"#d4869b",fontSize:11,marginTop:4}}>{usernameError}</div>}
                </div>
                <div>
                  <label style={labelStyle}>🌍 {t.profileLanguage||"Language"}</label>
                  <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>{LANGUAGES.map(l=><button key={l.code} onClick={()=>setPrefs(p=>({...p,language:l.code}))} style={{padding:"6px 12px",borderRadius:20,fontSize:12,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",border:`1px solid ${prefs.language===l.code?COLORS.accent:COLORS.border}`,background:prefs.language===l.code?`${COLORS.accent}22`:COLORS.card,color:prefs.language===l.code?COLORS.accent:COLORS.muted,fontWeight:prefs.language===l.code?600:400}}>{l.flag} {l.label}</button>)}</div>
                </div>
                <div style={{marginTop:12}}>
                  <label style={labelStyle}>🎨 {t.profileTheme||"Theme"}</label>
                  <div style={{display:"flex",gap:8}}>
                    {[["light","☀️ Light"],["dark","🌙 Dark"]].map(([k,label])=><button key={k} onClick={()=>{setPrefs(p=>({...p,theme:k}));setThemeKey(k);}} style={{flex:1,padding:"8px 12px",borderRadius:20,fontSize:12,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",border:`1px solid ${themeKey===k?COLORS.accent:COLORS.border}`,background:themeKey===k?`${COLORS.accent}22`:COLORS.card,color:themeKey===k?COLORS.accent:COLORS.muted,fontWeight:themeKey===k?600:400}}>{label}</button>)}
                  </div>
                </div>
              </>)}

              {/* Step 1: Budget */}
              {onboardingStep===1&&(<>
                <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:20,fontStyle:"italic",color:COLORS.accent,marginBottom:4}}>🎯 {t.profileBudget||"Budget"}</div>
                <div style={{fontSize:12,color:COLORS.muted,marginBottom:12}}>{ot.onboardResultsSub||"Choose your usual budget. (optional)"}</div>
                <div>
                  <label style={labelStyle}>{t.profileBudget||"Budget"}</label>
                  <div style={{display:"flex",gap:8}}>
                    {[["",t.profileBudgetNone||"—"],...PRICES.map((p,i)=>[p,[t.priceCheap||"Bon marché",t.priceMid||"Intermédiaire",t.priceHigh||"Haut de gamme"][i]])].map(([val,label])=>(
                      <button key={val} onClick={()=>setPrefs(p=>({...p,budget:val}))}
                        style={{flex:1,padding:"8px 4px",background:(prefs.budget||"")===val?`${COLORS.accent}22`:COLORS.card,
                          border:`1px solid ${(prefs.budget||"")===val?COLORS.accent:COLORS.border}`,
                          borderRadius:8,color:(prefs.budget||"")===val?COLORS.accent:COLORS.muted,
                          cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontSize:11,fontWeight:600,transition:"all 0.2s",
                          lineHeight:1.2,textAlign:"center"}}>
                        <div style={{fontSize:13}}>{val||"—"}</div>
                        <div style={{fontSize:9,fontWeight:400,opacity:0.7,marginTop:1}}>{label}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </>)}

              {/* Step 2: Preferred cities */}
              {onboardingStep===2&&(<>
                <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:20,fontStyle:"italic",color:COLORS.accent,marginBottom:4}}>{t.prefCitiesLabel||"🏙️ Preferred cities"}</div>
                <div style={{fontSize:12,color:COLORS.muted,marginBottom:12}}>{ot.onboardCitiesSub}</div>
                <CityPicker COLORS={COLORS} cities={prefs.preferredCities||[]} onChange={v=>setPrefs(p=>({...p,preferredCities:v}))} placeholder={t.prefCitiesPlaceholder||"Add a city..."} empty={t.prefCitiesEmpty||"No cities added yet"}/>
              </>)}

              {/* Step 3: What I love */}
              {onboardingStep===3&&(<>
                <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:20,fontStyle:"italic",color:COLORS.accent,marginBottom:4}}>{t.profileLikes||"✨ What I love"}</div>
                <div style={{fontSize:12,color:COLORS.muted,marginBottom:12}}>{ot.onboardLikesSub}</div>
                <TagPicker options={PREFS_LOVES_BY_LANG[lang]||PREFS_LOVES_BY_LANG.en} selected={prefs.lovesTags||[]} onChange={v=>setPrefs(p=>({...p,lovesTags:v}))} mode="like"/>
              </>)}

              {/* Step 4: What I avoid */}
              {onboardingStep===4&&(<>
                <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:20,fontStyle:"italic",color:"#d4869b",marginBottom:4}}>{t.profileDislikes||"🚫 What I avoid"}</div>
                <div style={{fontSize:12,color:COLORS.muted,marginBottom:12}}>{ot.onboardDislikesSub}</div>
                <TagPicker options={PREFS_HATES_BY_LANG[lang]||PREFS_HATES_BY_LANG.en} selected={prefs.hatesTags||[]} onChange={v=>setPrefs(p=>({...p,hatesTags:v}))} mode="dislike"/>
              </>)}

              {/* Step 5: Notes for AI */}
              {onboardingStep===5&&(<>
                <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:20,fontStyle:"italic",color:COLORS.accent,marginBottom:4}}>{t.profileNotes||"📝 Notes for the AI"}</div>
                <div style={{fontSize:12,color:COLORS.muted,marginBottom:12}}>{ot.onboardNotesSub}</div>
                <textarea value={prefs.notes||""} onChange={e=>setPrefs(p=>({...p,notes:e.target.value}))} placeholder={ot.onboardNotesPlaceholder} style={{...inputStyle,minHeight:100,resize:"vertical",textAlign:"justify"}}/>
              </>)}

              {/* Step 6: Ready! */}
              {onboardingStep===6&&(<>
                <div style={{textAlign:"center"}}>
                  <div style={{fontSize:48,marginBottom:12}}>🎉</div>
                  <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:26,fontStyle:"italic",color:COLORS.accent,marginBottom:8}}>{t.onboardReady||"You're all set!"}</div>
                  <div style={{fontSize:13,color:COLORS.muted,lineHeight:1.6}}>{t.onboardReadySub||"Your profile is ready. Let's take a quick tour of the app, then you can start exploring!"}</div>
                </div>
              </>)}

              {/* Navigation buttons */}
              <div style={{display:"flex",gap:8,marginTop:16}}>
                <button className="modal-btn secondary" style={{flex:1,visibility:onboardingStep>0?"visible":"hidden"}} onClick={()=>setOnboardingStep(s=>s-1)}>← {ot.onboardBack||"Back"}</button>
                {onboardingStep<totalSteps-1
                  ? <button className="save-btn" style={{flex:1,margin:0}} onClick={async()=>{
                    if (onboardingStep===0) {
                      if (!prefs.firstName?.trim()||!prefs.lastName?.trim()) return;
                      const uname = (prefs.username||"").trim();
                      if (!uname) { setUsernameError(t.errorUsernameRequired||"Username is required."); return; }
                      if (!/^[a-z0-9_.]{3,20}$/.test(uname)) { setUsernameError(t.errorUsernameInvalid||"3-20 characters, letters, numbers, _ or . only."); return; }
                      const { data: existing } = await supabase.from('profiles').select('user_id').eq('username', uname).neq('user_id', session.user.id).maybeSingle();
                      if (existing) { setUsernameError(t.errorUsernameTaken||"This username is already taken."); return; }
                      setUsernameError("");
                    }
                    setOnboardingStep(s=>s+1);
                  }} disabled={onboardingStep===0&&(!prefs.firstName?.trim()||!prefs.lastName?.trim()||!prefs.username?.trim())}>{ot.onboardNext||"Next →"}</button>
                  : <button className="save-btn" style={{flex:1,margin:0}} onClick={finishOnboarding}>{ot.onboardFinish||"Let's go! 🚀"}</button>
                }
              </div>
              {onboardingStep>0&&onboardingStep<6&&<button style={{background:"none",border:"none",color:COLORS.muted,fontSize:11,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",marginTop:8,padding:4,textAlign:"center",width:"100%"}} onClick={()=>setOnboardingStep(6)}>{t.onboardSkip||"Skip"}</button>}
            </div>
          </div>
        );
      })()}

      {/* App Tour — quick demo slides */}
      {showTour&&(()=>{
        const tourSlides = [
          { icon: "🍽️", title: t.tourReco||"Reco", desc: t.tourRecoDesc||"Trouvez les meilleurs lieux autour de vous. Lieux populaires Google + recommandations IA personnalisées." },
          { icon: "❤️", title: t.tourFav||"Favoris", desc: t.tourFavDesc||"Tous vos coups de cœur, notés et détaillés. Filtrez par type, prix, note." },
          { icon: "➕", title: t.tourAdd||"Ajouter", desc: t.tourAddDesc||"Enregistrez un lieu en quelques secondes. Recherche Google intégrée avec auto-complétion." },
          { icon: "👥", title: t.tourFriends||"Following", desc: t.tourFriendsDesc||"Follow users and discover their favorites." },
          { icon: "🎯", title: t.tourProfile||"Profil", desc: t.tourProfileDesc||"Personnalisez vos préférences pour des recommandations sur mesure." },
        ];
        const slide = tourSlides[tourStep];
        return (
          <div className="alert-overlay" style={{zIndex:550}}>
            <div className="alert-box" style={{maxWidth:400,padding:28,textAlign:"center"}}>
              <div style={{fontSize:48,marginBottom:12}}>{slide.icon}</div>
              <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:24,fontStyle:"italic",color:COLORS.accent,marginBottom:8}}>{slide.title}</div>
              <div style={{fontSize:13,color:COLORS.muted,lineHeight:1.6,marginBottom:20}}>{slide.desc}</div>
              {/* Progress dots */}
              <div style={{display:"flex",justifyContent:"center",gap:6,marginBottom:16}}>
                {tourSlides.map((_,i)=><div key={i} style={{width:8,height:8,borderRadius:"50%",background:i===tourStep?COLORS.accent:`${COLORS.accent}33`,cursor:"pointer"}} onClick={()=>setTourStep(i)}/>)}
              </div>
              <div style={{display:"flex",gap:8,justifyContent:"center"}}>
                <button className="modal-btn secondary" onClick={()=>setTourStep(s=>s-1)} style={{flex:1,visibility:tourStep>0?"visible":"hidden"}}>←</button>
                {tourStep<tourSlides.length-1
                  ? <button className="save-btn" style={{margin:0,flex:1}} onClick={()=>setTourStep(s=>s+1)}>{t.tourNext||"Suivant →"}</button>
                  : <button className="save-btn" style={{margin:0,flex:1}} onClick={async()=>{localStorage.setItem("outsy_tour_done","1");setShowTour(false);try{await supabase.from('preferences').upsert({user_id:session.user.id,tour_done:true});}catch{}}}>{t.tourStart||"C'est parti ! 🎉"}</button>
                }
              </div>
              <button className="auth-link" style={{marginTop:10,fontSize:11,color:COLORS.muted}} onClick={async()=>{localStorage.setItem("outsy_tour_done","1");setShowTour(false);try{await supabase.from('preferences').upsert({user_id:session.user.id,tour_done:true});}catch{}}}>{t.tourSkip||"Passer le tour"}</button>
            </div>
          </div>
        );
      })()}

      {duplicatesFound&&duplicatesFound.length>0&&(()=>{
        const currentGroup = duplicatesFound[0];
        const handleKeep = async (keepId) => {
          const toDelete = currentGroup.filter(m => m.id !== keepId).map(m => m.id);
          if (toDelete.length > 0) {
            await supabase.from('memories').delete().in('id', toDelete).eq('user_id', userId);
            setMemories(prev => prev.filter(m => !toDelete.includes(m.id)));
          }
          setDuplicatesFound(d => d.length > 1 ? d.slice(1) : null);
        };
        const handleSkip = () => setDuplicatesFound(d => d.length > 1 ? d.slice(1) : null);
        // Compute which fields differ between the duplicates
        const fields = ['rating','price','address','city','country','cuisine','type','kidsf','google_place_id'];
        const diffFields = new Set();
        fields.forEach(f => {
          const values = currentGroup.map(m => m[f]||"");
          if (new Set(values.map(v=>String(v))).size > 1) diffFields.add(f);
        });
        // Likes/dislikes differ?
        const likeArrs = currentGroup.map(m => JSON.stringify((m.likeTags||[]).slice().sort()));
        if (new Set(likeArrs).size > 1) diffFields.add('likeTags');
        const dislikeArrs = currentGroup.map(m => JSON.stringify((m.dislikeTags||[]).slice().sort()));
        if (new Set(dislikeArrs).size > 1) diffFields.add('dislikeTags');
        // Why/dislike text differs?
        if (new Set(currentGroup.map(m => m.why||"")).size > 1) diffFields.add('why');
        if (new Set(currentGroup.map(m => m.dislike||"")).size > 1) diffFields.add('dislike');

        const diffStyle = {color:COLORS.accent,fontWeight:700,background:`${COLORS.accent}15`,padding:"1px 5px",borderRadius:4};
        const sameStyle = {color:COLORS.muted};

        return (
          <div className="alert-overlay">
            <div className="alert-box" style={{maxWidth:560}}>
              <div className="alert-title">⚠️ Doublons détectés</div>
              <div className="alert-text">
                {currentGroup.length} entrées pour <strong>"{currentGroup[0].name}"</strong>. Les <span style={{color:COLORS.accent,fontWeight:700}}>champs en doré</span> diffèrent — choisissez la version à garder.
                {duplicatesFound.length > 1 && <span style={{display:"block",fontSize:11,color:COLORS.muted,marginTop:6}}>({duplicatesFound.length - 1} autre{duplicatesFound.length > 2 ? "s" : ""} groupe{duplicatesFound.length > 2 ? "s" : ""} après celui-ci)</span>}
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:10,marginTop:8,maxHeight:380,overflowY:"auto"}}>
                {currentGroup.map(m => (
                  <button key={m.id} onClick={()=>handleKeep(m.id)} style={{
                    background:COLORS.card, border:`1px solid ${COLORS.border}`, borderRadius:10, padding:"12px 14px",
                    textAlign:"left", cursor:"pointer", fontFamily:"'DM Sans',sans-serif", color:COLORS.text
                  }}>
                    <div style={{fontWeight:600,fontSize:13,marginBottom:6}}>{m.name}</div>
                    <div style={{fontSize:11,display:"flex",flexWrap:"wrap",gap:6,alignItems:"center"}}>
                      <span style={diffFields.has('rating')?diffStyle:sameStyle}>{m.rating||0}★</span>
                      <span style={diffFields.has('price')?diffStyle:sameStyle}>{m.price||"—"}</span>
                      {diffFields.has('cuisine') ? <span style={diffStyle}>{m.cuisine||"sans cuisine"}</span> : (m.cuisine && <span style={sameStyle}>{m.cuisine}</span>)}
                      {diffFields.has('type') ? <span style={diffStyle}>{m.type||"—"}</span> : <span style={sameStyle}>{m.type||"—"}</span>}
                      {m.kidsf && <span style={diffFields.has('kidsf')?diffStyle:sameStyle}>👶</span>}
                    </div>
                    <div style={{fontSize:11,marginTop:5,...((diffFields.has('address')||diffFields.has('city')||diffFields.has('country'))?diffStyle:sameStyle)}}>
                      📍 {m.address||"sans adresse"}{m.city?", "+m.city:""}{m.country?", "+m.country:""}
                    </div>
                    {diffFields.has('google_place_id') && (
                      <div style={{fontSize:10,color:m.google_place_id?"#5a9e6a":"#d4869b",marginTop:4}}>
                        {m.google_place_id ? "✓ Lié à Google" : "⚠ Pas lié à Google"}
                      </div>
                    )}
                    {(m.likeTags?.length>0)&&<div style={{fontSize:10,marginTop:4,...(diffFields.has('likeTags')?diffStyle:{color:COLORS.accent})}}>👍 {m.likeTags.join(", ")}</div>}
                    {(m.dislikeTags?.length>0)&&<div style={{fontSize:10,marginTop:3,color:"#d4869b",...(diffFields.has('dislikeTags')?{...diffStyle,color:"#d4869b",background:"rgba(212,134,155,0.15)"}:{})}}>👎 {m.dislikeTags.join(", ")}</div>}
                    {m.why && <div style={{fontSize:11,marginTop:4,fontStyle:"italic",...(diffFields.has('why')?diffStyle:sameStyle)}}>« {m.why} »</div>}
                    {m.ts && <div style={{fontSize:10,color:COLORS.muted,marginTop:5}}>Créé le {new Date(m.ts).toLocaleDateString()}</div>}
                  </button>
                ))}
              </div>
              <div className="alert-actions" style={{marginTop:8}}>
                <button className="modal-btn secondary" onClick={handleSkip}>Décider plus tard</button>
              </div>
            </div>
          </div>
        );
      })()}
      {deleteConfirm&&(
        <div className="alert-overlay">
          <div className="alert-box">
            <div className="alert-title">🗑️ {t.deleteTitle||"Delete"}</div>
            <div className="alert-text">"{deleteConfirm.name}" {t.deleteText||"will be removed from your favorites."}</div>
            <div className="alert-actions">
              <button className="modal-btn secondary" onClick={()=>setDeleteConfirm(null)}>{t.duplicateCancel}</button>
              <button className="modal-btn primary" style={{background:"#e06060",border:"none"}} onClick={()=>{deleteMemory(deleteConfirm.id);setDeleteConfirm(null);}}>
                {t.deleteConfirm||"Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Pin note modal */}
      {/* Place Sheet */}
      {placeSheet&&(
        <PlaceSheet
          place={placeSheet.list[placeSheet.index]}
          list={placeSheet.list}
          index={placeSheet.index}
          onClose={()=>setPlaceSheet(null)}
          onNavigate={(i)=>setPlaceSheet(prev=>({...prev,index:i}))}
          COLORS={COLORS} t={{...t, _lang: lang}}
          friendMemories={friendMemories}
          memories={memories}
          pins={pins}
          onAdd={(p)=>{
            setPendingPlaceSheet(placeSheet);
            setRecoToAdd({name:p.name,type:p.type||recoType,price:p.price||"",city:p.city||"",country:p.country||"",address:p.address||p.formattedAddress||"",cuisine:p.cuisine||"",activityType:p.activityType||p.activity_type||"",google_place_id:p.google_place_id||p.id||"",rating:0,likeTags:[],dislikeTags:[],why:"",dislike:"",kidsf:false});
            setPlaceSheet(null);
          }}
          onPin={(p)=>{
            setPendingPlaceSheet(placeSheet);
            openPinModal({name:p.name,type:p.type||recoType,price:p.price||"",address:p.address||p.formattedAddress||"",cuisine:p.cuisine||"",activityType:p.activityType||p.activity_type||"",google_place_id:p.google_place_id||p.id||""});
            setPlaceSheet(null);
          }}
          onEdit={(mem)=>{
            setPendingPlaceSheet(placeSheet);
            setEditMemory(mem);
            setPlaceSheet(null);
          }}
        />
      )}

      {pinModal&&(
        <div className="alert-overlay" style={{zIndex:600}}>
          <div className="alert-box" style={{maxWidth:380,padding:24}}>
            <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:18,fontStyle:"italic",color:COLORS.accent,marginBottom:4}}>📌 {pinModal.place.name}</div>
            <div style={{fontSize:12,color:COLORS.muted,marginBottom:12}}>{t.pinNotePrompt||"Add a note (optional):"}</div>
            <input value={pinModal.note} onChange={e=>setPinModal(p=>({...p,note:e.target.value}))} placeholder={t.pinNotePlaceholder||"Ex: for the kids, date night idea..."} autoFocus style={{background:COLORS.bg,border:`1px solid ${COLORS.border}`,borderRadius:8,padding:"10px 12px",color:COLORS.text,fontFamily:"'DM Sans',sans-serif",fontSize:13,width:"100%",marginBottom:16}}/>
            <div style={{display:"flex",gap:8}}>
              <button className="modal-btn secondary" style={{flex:1}} onClick={()=>setPinModal(null)}>{t.cancel||"Cancel"}</button>
              <button className="save-btn" style={{flex:1,margin:0}} onClick={()=>{pinPlace(pinModal.place,pinModal.note);setPinModal(null);}}>📌 {t.pinBtn||"Pin"}</button>
            </div>
          </div>
        </div>
      )}
      {duplicateAlert&&(
        <div className="alert-overlay">
          <div className="alert-box">
            <div className="alert-title">{t.duplicateTitle}</div>
            <div className="alert-text"><strong>{duplicateAlert.existing.name}</strong> {t.duplicateText}</div>
            <div className="alert-actions">
              <button className="modal-btn secondary" onClick={()=>{setDuplicateAlert(null);setFormKey(k=>k+1);}}>{t.duplicateCancel}</button>
              <button className="modal-btn primary" onClick={()=>{setEditMemory(duplicateAlert.existing);setTab("memories");setDuplicateAlert(null);}}>{t.duplicateEdit||"Edit"}</button>
            </div>
          </div>
        </div>
      )}

      {showResetModal&&(
        <div className="alert-overlay">
          <div className="alert-box">
            <div className="alert-title">🔑 {t.resetPassword||"Reset password"}</div>
            <div className="alert-text" style={{color:COLORS.muted}}>{t.resetPasswordText||"We'll send a reset link to:"}</div>
            <div style={{fontSize:14,color:COLORS.text,padding:"8px 0"}}>{session?.user?.email}</div>
            <div className="alert-actions">
              <button className="modal-btn secondary" onClick={()=>setShowResetModal(false)}>{t.duplicateCancel}</button>
              <button className="modal-btn primary" onClick={async()=>{await sendResetEmail(session.user.email);setShowResetModal(false);showToast(t.resetSent||"✓ Reset email sent!");}}>
                {t.resetSend||"Send link"}
              </button>
            </div>
          </div>
        </div>
      )}
      {toast&&<div className="success-toast">{toast}</div>}
      <div style={{textAlign:"center",padding:"16px 0 24px",fontSize:"10px",color:COLORS.muted,letterSpacing:"0.1em"}}>
        Outsy AI v{APP_VERSION} — {BUILD_DATE}
      </div>
    </>
  );
}

export default TravelAgent;