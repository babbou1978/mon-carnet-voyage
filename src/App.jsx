import { useState, useEffect, useLayoutEffect, useRef, useCallback } from "react";
import { APP_VERSION, BUILD_DATE } from "./version.js";
import { supabase } from "./supabase.js";
import Auth from "./Auth.jsx";

const TYPES = ["Restaurant", "Hôtel", "Bar / Café", "Destination", "Activité"];
const PRICES = ["€", "€€", "€€€", "€€€€"];
const TYPE_ICONS = { "Restaurant": "🍽️", "Hôtel": "🏨", "Bar / Café": "☕", "Destination": "🗺️", "Activité": "🎯" };
const GOOGLE_TYPE_MAP = { restaurant: "Restaurant", cafe: "Bar / Café", bar: "Bar / Café", lodging: "Hôtel", hotel: "Hôtel", tourist_attraction: "Destination", museum: "Activité", park: "Activité", amusement_park: "Activité", night_club: "Bar / Café", bakery: "Restaurant", food: "Restaurant" };
const PRICE_MAP = { PRICE_LEVEL_FREE: "€", PRICE_LEVEL_INEXPENSIVE: "€", PRICE_LEVEL_MODERATE: "€€", PRICE_LEVEL_EXPENSIVE: "€€€", PRICE_LEVEL_VERY_EXPENSIVE: "€€€€" };
const DISTANCE_STEPS = [100, 500, 1000, 2000, 5000, 10000];
const ALL = "__ALL__"; // Internal constant for "all" filter - language independent
const DISTANCE_LABELS = ["100m", "500m", "1km", "2km", "5km", "10km"];

const LIKES_BY_TYPE_LANG = {
  fr: { "Restaurant":["Ambiance chaleureuse","Cuisine locale","Terrasse agréable","Service attentionné","Cadre original","Cave à vins","Produits frais","Vue exceptionnelle","Rapport qualité/prix"],"Bar / Café":["Ambiance chaleureuse","Terrasse agréable","Bonne sélection","Service attentionné","Cadre original","Musique agréable","Vue exceptionnelle","Rapport qualité/prix"],"Hôtel":["Chambre spacieuse","Petit-déjeuner inclus","Piscine","Spa","Vue exceptionnelle","Personnel attentionné","Rapport qualité/prix","Calme","Emplacement idéal"],"Destination":["Paysages exceptionnels","Culture locale","Peu touristique","Gastronomie","Architecture","Nature","Art","Vie nocturne","Accessibilité"],"Activité":["Expérience unique","Bien organisé","Guide excellent","Rapport qualité/prix","Vue exceptionnelle","Originalité","Accessibilité"] },
  en: { "Restaurant":["Warm atmosphere","Local cuisine","Pleasant terrace","Attentive service","Original setting","Wine cellar","Fresh produce","Exceptional view","Value for money"],"Bar / Café":["Warm atmosphere","Pleasant terrace","Good selection","Attentive service","Original setting","Pleasant music","Exceptional view","Value for money"],"Hôtel":["Spacious room","Breakfast included","Pool","Spa","Exceptional view","Attentive staff","Value for money","Quiet","Ideal location"],"Destination":["Exceptional scenery","Local culture","Off the beaten track","Gastronomy","Architecture","Nature","Art","Nightlife","Accessibility"],"Activité":["Unique experience","Well organized","Excellent guide","Value for money","Exceptional view","Originality","Accessibility"] },
  es: { "Restaurant":["Ambiente cálido","Cocina local","Terraza agradable","Servicio atento","Ambiente original","Bodega","Productos frescos","Vista excepcional","Buena relación calidad-precio","Apto para niños"],"Bar / Café":["Ambiente cálido","Terraza agradable","Buena selección","Servicio atento","Ambiente original","Música agradable","Vista excepcional","Buena relación calidad-precio","Apto para niños"],"Hôtel":["Habitación amplia","Desayuno incluido","Piscina","Spa","Vista excepcional","Personal atento","Buena relación calidad-precio","Apto para niños","Tranquilo","Ubicación ideal"],"Destination":["Paisajes excepcionales","Cultura local","Poco turístico","Gastronomía","Arquitectura","Naturaleza","Arte","Vida nocturna","Apto para niños","Accesibilidad"],"Activité":["Experiencia única","Bien organizado","Excelente guía","Buena relación calidad-precio","Apto para niños","Vista excepcional","Originalidad","Accesibilidad"] },
  de: { "Restaurant":["Gemütliche Atmosphäre","Lokale Küche","Angenehme Terrasse","Aufmerksamer Service","Originelles Ambiente","Weinkeller","Frische Produkte","Außergewöhnliche Aussicht","Preis-Leistung","Kinderfreundlich"],"Bar / Café":["Gemütliche Atmosphäre","Angenehme Terrasse","Gute Auswahl","Aufmerksamer Service","Originelles Ambiente","Angenehme Musik","Außergewöhnliche Aussicht","Preis-Leistung","Kinderfreundlich"],"Hôtel":["Geräumiges Zimmer","Frühstück inklusive","Pool","Spa","Außergewöhnliche Aussicht","Aufmerksames Personal","Preis-Leistung","Kinderfreundlich","Ruhig","Ideale Lage"],"Destination":["Außergewöhnliche Landschaft","Lokale Kultur","Abseits des Trubels","Gastronomie","Architektur","Natur","Kunst","Nachtleben","Kinderfreundlich","Barrierefreiheit"],"Activité":["Einzigartiges Erlebnis","Gut organisiert","Ausgezeichneter Guide","Preis-Leistung","Kinderfreundlich","Außergewöhnliche Aussicht","Originalität","Barrierefreiheit"] },
  it: { "Restaurant":["Atmosfera accogliente","Cucina locale","Terrazza piacevole","Servizio attento","Ambiente originale","Cantina","Prodotti freschi","Vista eccezionale","Rapporto qualità/prezzo","Adatto ai bambini"],"Bar / Café":["Atmosfera accogliente","Terrazza piacevole","Buona selezione","Servizio attento","Ambiente originale","Musica piacevole","Vista eccezionale","Rapporto qualità/prezzo","Adatto ai bambini"],"Hôtel":["Camera spaziosa","Colazione inclusa","Piscina","Spa","Vista eccezionale","Personale attento","Rapporto qualità/prezzo","Adatto ai bambini","Tranquillo","Posizione ideale"],"Destination":["Paesaggi eccezionali","Cultura locale","Fuori dai sentieri battuti","Gastronomia","Architettura","Natura","Arte","Vita notturna","Adatto ai bambini","Accessibilità"],"Activité":["Esperienza unica","Ben organizzato","Guida eccellente","Rapporto qualità/prezzo","Adatto ai bambini","Vista eccezionale","Originalità","Accessibilità"] },
  pt: { "Restaurant":["Ambiente acolhedor","Cozinha local","Esplanada agradável","Serviço atento","Ambiente original","Adega","Produtos frescos","Vista excecional","Boa relação qualidade/preço","Adequado para crianças"],"Bar / Café":["Ambiente acolhedor","Esplanada agradável","Boa seleção","Serviço atento","Ambiente original","Música agradável","Vista excecional","Boa relação qualidade/preço","Adequado para crianças"],"Hôtel":["Quarto espaçoso","Pequeno-almoço incluído","Piscina","Spa","Vista excecional","Pessoal atento","Boa relação qualidade/preço","Adequado para crianças","Sossegado","Localização ideal"],"Destination":["Paisagens excecionais","Cultura local","Fora dos circuitos turísticos","Gastronomia","Arquitetura","Natureza","Arte","Vida noturna","Adequado para crianças","Acessibilidade"],"Activité":["Experiência única","Bem organizado","Guia excelente","Boa relação qualidade/preço","Adequado para crianças","Vista excecional","Originalidade","Acessibilidade"] },
  nl: { "Restaurant":["Warme sfeer","Lokale keuken","Prettig terras","Attente bediening","Originele setting","Wijnkelder","Verse producten","Uitzonderlijk uitzicht","Prijs-kwaliteit","Kindvriendelijk"],"Bar / Café":["Warme sfeer","Prettig terras","Goede selectie","Attente bediening","Originele setting","Prettige muziek","Uitzonderlijk uitzicht","Prijs-kwaliteit","Kindvriendelijk"],"Hôtel":["Ruime kamer","Ontbijt inbegrepen","Zwembad","Spa","Uitzonderlijk uitzicht","Attent personeel","Prijs-kwaliteit","Kindvriendelijk","Rustig","Ideale ligging"],"Destination":["Uitzonderlijk landschap","Lokale cultuur","Onontdekt","Gastronomie","Architectuur","Natuur","Kunst","Nachtleven","Kindvriendelijk","Toegankelijkheid"],"Activité":["Unieke ervaring","Goed georganiseerd","Uitstekende gids","Prijs-kwaliteit","Kindvriendelijk","Uitzonderlijk uitzicht","Originaliteit","Toegankelijkheid"] },
};
const DISLIKES_BY_TYPE_LANG = {
  fr: { "Restaurant":["Trop bruyant","Service lent","Portions trop petites","Trop touristique","Prix excessif","Trop bondé","Service froid","Mauvaise localisation"],"Bar / Café":["Trop bruyant","Service lent","Trop bondé","Prix excessif","Service froid","Mauvaise ambiance"],"Hôtel":["Chambre trop petite","Bruit","Wi-Fi mauvais","Ménage insuffisant","Check-in tardif","Prix excessif","Emplacement mauvais"],"Destination":["Trop touristique","Foules","Manque de sécurité","Peu de transports","Trop cher","Peu d'activités"],"Activité":["Trop touristique","Mal organisé","Prix excessif","Trop long","Guide décevant","Trop de monde"] },
  en: { "Restaurant":["Too noisy","Slow service","Small portions","Too touristy","Overpriced","Too crowded","Cold service","Bad location"],"Bar / Café":["Too noisy","Slow service","Too crowded","Overpriced","Cold service","Bad atmosphere"],"Hôtel":["Room too small","Noise","Bad Wi-Fi","Poor cleaning","Late check-in","Overpriced","Bad location"],"Destination":["Too touristy","Crowds","Safety concerns","Poor transport","Too expensive","Few activities"],"Activité":["Too touristy","Poorly organized","Overpriced","Too long","Disappointing guide","Too crowded"] },
  es: { "Restaurant":["Demasiado ruidoso","Servicio lento","Porciones pequeñas","Demasiado turístico","Precio excesivo","Demasiado lleno","Servicio frío","Mala ubicación"],"Bar / Café":["Demasiado ruidoso","Servicio lento","Demasiado lleno","Precio excesivo","Servicio frío","Mal ambiente"],"Hôtel":["Habitación pequeña","Ruido","Mal Wi-Fi","Limpieza deficiente","Check-in tardío","Precio excesivo","Mala ubicación"],"Destination":["Demasiado turístico","Multitudes","Inseguridad","Poco transporte","Demasiado caro","Pocas actividades"],"Activité":["Demasiado turístico","Mal organizado","Precio excesivo","Demasiado largo","Guía decepcionante","Demasiada gente"] },
  de: { "Restaurant":["Zu laut","Langsamer Service","Kleine Portionen","Zu touristisch","Überteuert","Zu voll","Kalter Service","Schlechte Lage"],"Bar / Café":["Zu laut","Langsamer Service","Zu voll","Überteuert","Kalter Service","Schlechte Atmosphäre"],"Hôtel":["Zimmer zu klein","Lärm","Schlechtes WLAN","Mangelhafte Reinigung","Später Check-in","Überteuert","Schlechte Lage"],"Destination":["Zu touristisch","Massen","Sicherheitsprobleme","Schlechter Transport","Zu teuer","Wenig Aktivitäten"],"Activité":["Zu touristisch","Schlecht organisiert","Überteuert","Zu lang","Enttäuschender Guide","Zu viele Menschen"] },
  it: { "Restaurant":["Troppo rumoroso","Servizio lento","Porzioni piccole","Troppo turistico","Prezzo eccessivo","Troppo affollato","Servizio freddo","Posizione pessima"],"Bar / Café":["Troppo rumoroso","Servizio lento","Troppo affollato","Prezzo eccessivo","Servizio freddo","Pessima atmosfera"],"Hôtel":["Camera troppo piccola","Rumore","Wi-Fi pessimo","Pulizia insufficiente","Check-in tardivo","Prezzo eccessivo","Posizione pessima"],"Destination":["Troppo turistico","Folle","Scarsa sicurezza","Pochi trasporti","Troppo caro","Poche attività"],"Activité":["Troppo turistico","Mal organizzato","Prezzo eccessivo","Troppo lungo","Guida deludente","Troppa gente"] },
  pt: { "Restaurant":["Muito barulhento","Serviço lento","Porções pequenas","Muito turístico","Preço excessivo","Muito cheio","Serviço frio","Má localização"],"Bar / Café":["Muito barulhento","Serviço lento","Muito cheio","Preço excessivo","Serviço frio","Má atmosfera"],"Hôtel":["Quarto pequeno","Barulho","Wi-Fi fraco","Limpeza insuficiente","Check-in tardio","Preço excessivo","Má localização"],"Destination":["Muito turístico","Multidões","Falta de segurança","Poucos transportes","Muito caro","Poucas atividades"],"Activité":["Muito turístico","Mal organizado","Preço excessivo","Muito longo","Guia dececionante","Demasiadas pessoas"] },
  nl: { "Restaurant":["Te luidruchtig","Trage bediening","Kleine porties","Te toeristisch","Te duur","Te druk","Koude bediening","Slechte locatie"],"Bar / Café":["Te luidruchtig","Trage bediening","Te druk","Te duur","Koude bediening","Slechte sfeer"],"Hôtel":["Kamer te klein","Lawaai","Slecht Wi-Fi","Gebrekkige schoonmaak","Late check-in","Te duur","Slechte locatie"],"Destination":["Te toeristisch","Drukte","Veiligheidsproblemen","Weinig transport","Te duur","Weinig activiteiten"],"Activité":["Te toeristisch","Slecht georganiseerd","Te duur","Te lang","Teleurstellende gids","Te druk"] },
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
  fr:{"Restaurant":"Restaurant","Hôtel":"Hôtel","Bar / Café":"Bar / Café","Destination":"Destination","Activité":"Activité"},
  en:{"Restaurant":"Restaurant","Hôtel":"Hotel","Bar / Café":"Bar / Café","Destination":"Destination","Activité":"Activity"},
  es:{"Restaurant":"Restaurante","Hôtel":"Hotel","Bar / Café":"Bar / Café","Destination":"Destino","Activité":"Actividad"},
  de:{"Restaurant":"Restaurant","Hôtel":"Hotel","Bar / Café":"Bar / Café","Destination":"Reiseziel","Activité":"Aktivität"},
  it:{"Restaurant":"Ristorante","Hôtel":"Hotel","Bar / Café":"Bar / Caffè","Destination":"Destinazione","Activité":"Attività"},
  pt:{"Restaurant":"Restaurante","Hôtel":"Hotel","Bar / Café":"Bar / Café","Destination":"Destino","Activité":"Atividade"},
  nl:{"Restaurant":"Restaurant","Hôtel":"Hotel","Bar / Café":"Bar / Café","Destination":"Bestemming","Activité":"Activiteit"},
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
    tabReco: "Reco ✨", tabFavorites: "❤️ Favoris", tabAdd: "+ Ajouter", tabFriends: "👥 Amis", tabProfile: "Profil",
    logout: "Déconnexion",
    addPlace: "Nom du lieu", addType: "Type", addPrice: "Prix", addCity: "Ville", addCountry: "Pays",
    addRating: "Note globale", addKids: "👶 Kids friendly", addLiked: "Ce que j'ai aimé",
    addLikedSelect: "Sélectionner", addLikedPrecise: "Préciser", addDisliked: "Ce que j'ai moins aimé",
    addDislikedSelect: "Sélectionner", addDislikedPrecise: "Préciser",
    addSave: "Enregistrer", addUpdate: "Sauvegarder",
    filterType: "Type", filterPrice: "Prix", filterRating: "Note", filterKids: "👶 Kids friendly",
    filterFriends: "👥 Amis", filterAll: "Tous", nbRecosLabel: "Nombre de recommandations AI", nbRecos5: "5", nbRecos10: "10", nbRecosAuto: "Auto",
    emptyFavorites: "Aucun coup de cœur encore", emptyFavoritesSub: "Commencez par ajouter un lieu",
    emptyResults: "Aucun résultat", emptyResultsSub: "Essayez d'autres filtres",
    profileIdentity: "👤 Mon identité", profileFirstName: "Prénom", profileLastName: "Nom",
    prefCitiesLabel: "🏙️ Villes préférées", prefCitiesPlaceholder: "Ajouter une ville...", prefCitiesEmpty: "Aucune ville ajoutée", profileLanguage: "🌍 Langue préférée", profileLanguageLabel: "Langue de l'interface et des recommandations",
    profileLikes: "✨ Ce que j'aime", profileLikesSelect: "Sélectionner", profileLikesPrecise: "Préciser",
    profileBudget: "Budget habituel", profileBudgetNone: "Non renseigné",
    profileDislikes: "🚫 Ce que j'évite", profileDislikesSelect: "Sélectionner", profileDislikesPrecise: "Préciser",
    profileNotes: "📝 Notes libres", profileNotesLabel: "Autres infos", profileSave: "Sauvegarder mon profil", profileSaved: "✓ Profil enregistré",
    friendsRequests: "🔔 Demandes reçues", friendsSearch: "🔍 Ajouter un ami", friendsSearchPlaceholder: "Email de votre ami...",
    friendsSearchBtn: "Chercher", friendsList: "👥 Mes amis", friendsNone: "Aucun ami pour l'instant.",
    friendsPending: "⏳ En attente", friendsAlready: "Déjà ami", friendsSent: "Envoyée", friendsAdd: "+ Ajouter",
    friendsAccept: "✓", friendsView: "Voir ❤️", friendsHeartTitle: "❤️ Coups de cœur de",
    friendsNoHeart: "n'a pas encore de coups de cœur.",
    recoLocation: "📍 Localisation & paramètres", recoRadius: "Rayon de recherche",
    recoType: "Type", recoPrice: "Prix", recoFind: "✨ Demander à Outsy AI",
    recoLocating: "Localisation...", recoSearching: "Recherche en cours...",
    recoGPS: "📍 Ma position", recoManual: "✏️ Saisir", recoGPSLoading: "Récupération de votre position...",
    recoHearts: "❤️ Coups de cœur", recoHeartsNear: "Vos favoris & amis",
    recoInCarnet: "Dans votre carnet", recoNearby: "Lieux populaires à proximité",
    recoAI: "✨ Outsy AI", recoAISub: "10 recommandations triées par affinité",
    recoAddFav: "+ Ajouter à mes coups de cœur", recoMapsLink: "Maps →",
    recoNoHeart: "Aucun coup de cœur dans ce rayon. Ajoutez des lieux notés ≥ 4★ !",
    duplicateTitle: "📍 Lieu déjà existant", duplicateText: "est déjà dans vos coups de cœur. Mettre à jour ?",
    duplicateCancel: "Annuler", duplicateEdit: "Modifier l'existant", duplicateUpdate: "Mettre à jour",
    editTitle: "✏️ Modifier", toastSaved: "✓ Souvenir enregistré !", toastUpdated: "✓ Coup de cœur mis à jour !",
    toastAdded: "✓ Ajouté à vos coups de cœur !", toastFriend: "✓ Demande envoyée !", toastFriendAdded: "✓ Ami ajouté !",
    loading: "Chargement... ✈️", loginConnect: "Se connecter", loginCreate: "Créer mon compte",
    loginEmail: "Email", loginPassword: "Mot de passe", loginFirstName: "Prénom", loginLastName: "Nom",
    loginError: "Email ou mot de passe incorrect.", loginSignupError: "Erreur lors de l'inscription.",
    loginNameRequired: "Prénom et nom requis.", loginWelcome: "Bienvenue",
  },
  es: {
    appTagline: "Save & Share places you love. Discover more.",
    tabReco: "Reco ✨", tabFavorites: "❤️ Favoritos", tabAdd: "+ Añadir", tabFriends: "👥 Amigos", tabProfile: "Perfil",
    logout: "Cerrar sesión",
    addPlace: "Nombre del lugar", addType: "Tipo", addPrice: "Precio", addCity: "Ciudad", addCountry: "País",
    addRating: "Puntuación", addKids: "Apto para niños", addLiked: "Lo que me gustó",
    addLikedSelect: "Seleccionar", addLikedPrecise: "Añadir detalles", addDisliked: "Lo que no me gustó",
    addDislikedSelect: "Seleccionar", addDislikedPrecise: "Añadir detalles",
    addSave: "Guardar", addUpdate: "Actualizar",
    filterType: "Tipo", filterPrice: "Precio", filterRating: "Nota", filterKids: "👶 Niños",
    filterFriends: "👥 Amigos", filterAll: "Todos", nbRecosLabel: "Número de recomendaciones AI", nbRecos5: "5", nbRecos10: "10", nbRecosAuto: "Auto",
    emptyFavorites: "Aún sin favoritos", emptyFavoritesSub: "Empieza añadiendo un lugar",
    emptyResults: "Sin resultados", emptyResultsSub: "Prueba otros filtros",
    profileIdentity: "👤 Mi identidad", profileFirstName: "Nombre", profileLastName: "Apellido",
    prefCitiesLabel: "🏙️ Ciudades preferidas", prefCitiesPlaceholder: "Añadir una ciudad...", prefCitiesEmpty: "Sin ciudades añadidas", profileLanguage: "🌍 Idioma preferido", profileLanguageLabel: "Idioma de la interfaz y recomendaciones",
    profileLikes: "✨ Lo que me gusta", profileLikesSelect: "Seleccionar", profileLikesPrecise: "Añadir detalles",
    profileBudget: "Presupuesto habitual", profileBudgetNone: "No especificado",
    profileDislikes: "🚫 Lo que evito", profileDislikesSelect: "Seleccionar", profileDislikesPrecise: "Añadir detalles",
    profileNotes: "📝 Notas libres", profileNotesLabel: "Otra info", profileSave: "Guardar perfil", profileSaved: "✓ Perfil guardado",
    friendsRequests: "🔔 Solicitudes", friendsSearch: "🔍 Añadir amigo", friendsSearchPlaceholder: "Email de tu amigo...",
    friendsSearchBtn: "Buscar", friendsList: "👥 Mis amigos", friendsNone: "Sin amigos por ahora.",
    friendsPending: "⏳ Pendiente", friendsAlready: "Ya amigos", friendsSent: "Enviado", friendsAdd: "+ Añadir",
    friendsAccept: "✓", friendsView: "Ver ❤️", friendsHeartTitle: "❤️ Favoritos de",
    friendsNoHeart: "aún no tiene favoritos.",
    recoLocation: "📍 Ubicación y ajustes", recoRadius: "Radio de búsqueda",
    recoType: "Tipo", recoPrice: "Precio", recoFind: "✨ Preguntar a Outsy AI",
    recoLocating: "Localizando...", recoSearching: "Buscando...",
    recoGPS: "📍 Mi ubicación", recoManual: "✏️ Introducir", recoGPSLoading: "Obteniendo tu ubicación...",
    recoHearts: "❤️ Favoritos", recoHeartsNear: "Tus favoritos y amigos",
    recoInCarnet: "En tu colección", recoNearby: "Lugares populares cercanos",
    recoAI: "✨ Outsy AI", recoAISub: "10 recomendaciones por afinidad",
    recoAddFav: "+ Añadir a favoritos", recoMapsLink: "Maps →",
    recoNoHeart: "Sin favoritos en esta zona. ¡Añade lugares con ≥ 4★!",
    duplicateTitle: "📍 Lugar ya existe", duplicateText: "ya está en tus favoritos. ¿Actualizar?",
    duplicateCancel: "Cancelar", duplicateUpdate: "Actualizar",
    editTitle: "✏️ Editar", toastSaved: "✓ ¡Guardado!", toastUpdated: "✓ ¡Favorito actualizado!",
    toastAdded: "✓ ¡Añadido a favoritos!", toastFriend: "✓ ¡Solicitud enviada!", toastFriendAdded: "✓ ¡Amigo añadido!",
    loading: "Cargando... ✈️", loginConnect: "Iniciar sesión", loginCreate: "Crear cuenta",
    loginEmail: "Email", loginPassword: "Contraseña", loginFirstName: "Nombre", loginLastName: "Apellido",
    loginError: "Email o contraseña incorrectos.", loginSignupError: "Error al registrarse.",
    loginNameRequired: "Nombre y apellido requeridos.", loginWelcome: "Bienvenido/a",
  },
  de: {
    appTagline: "Save & Share places you love. Discover more.",
    tabReco: "Reco ✨", tabFavorites: "❤️ Favoriten", tabAdd: "+ Hinzufügen", tabFriends: "👥 Freunde", tabProfile: "Profil",
    logout: "Abmelden",
    addPlace: "Ortsname", addType: "Typ", addPrice: "Preis", addCity: "Stadt", addCountry: "Land",
    addRating: "Gesamtbewertung", addKids: "Kinderfreundlich", addLiked: "Was mir gefiel",
    addLikedSelect: "Auswählen", addLikedPrecise: "Details hinzufügen", addDisliked: "Was mir nicht gefiel",
    addDislikedSelect: "Auswählen", addDislikedPrecise: "Details hinzufügen",
    addSave: "Speichern", addUpdate: "Aktualisieren",
    filterType: "Typ", filterPrice: "Preis", filterRating: "Bewertung", filterKids: "👶 Kinder",
    filterFriends: "👥 Freunde", filterAll: "Alle", nbRecosLabel: "Anzahl AI-Empfehlungen", nbRecos5: "5", nbRecos10: "10", nbRecosAuto: "Auto",
    emptyFavorites: "Noch keine Favoriten", emptyFavoritesSub: "Füge einen Ort hinzu",
    emptyResults: "Keine Ergebnisse", emptyResultsSub: "Versuche andere Filter",
    profileIdentity: "👤 Meine Identität", profileFirstName: "Vorname", profileLastName: "Nachname",
    prefCitiesLabel: "🏙️ Bevorzugte Städte", prefCitiesPlaceholder: "Stadt hinzufügen...", prefCitiesEmpty: "Keine Städte hinzugefügt", profileLanguage: "🌍 Bevorzugte Sprache", profileLanguageLabel: "Sprache der Oberfläche und Empfehlungen",
    profileLikes: "✨ Was ich mag", profileLikesSelect: "Auswählen", profileLikesPrecise: "Details hinzufügen",
    profileBudget: "Übliches Budget", profileBudgetNone: "Nicht angegeben",
    profileDislikes: "🚫 Was ich meide", profileDislikesSelect: "Auswählen", profileDislikesPrecise: "Details hinzufügen",
    profileNotes: "📝 Freie Notizen", profileNotesLabel: "Weitere Infos", profileSave: "Profil speichern", profileSaved: "✓ Profil gespeichert",
    friendsRequests: "🔔 Anfragen", friendsSearch: "🔍 Freund hinzufügen", friendsSearchPlaceholder: "E-Mail deines Freundes...",
    friendsSearchBtn: "Suchen", friendsList: "👥 Meine Freunde", friendsNone: "Noch keine Freunde.",
    friendsPending: "⏳ Ausstehend", friendsAlready: "Bereits Freunde", friendsSent: "Gesendet", friendsAdd: "+ Hinzufügen",
    friendsAccept: "✓", friendsView: "Anzeigen ❤️", friendsHeartTitle: "❤️ Favoriten von",
    friendsNoHeart: "hat noch keine Favoriten.",
    recoLocation: "📍 Standort & Einstellungen", recoRadius: "Suchradius",
    recoType: "Typ", recoPrice: "Preis", recoFind: "✨ Outsy AI fragen",
    recoLocating: "Wird geortet...", recoSearching: "Suche läuft...",
    recoGPS: "📍 Mein Standort", recoManual: "✏️ Eingeben", recoGPSLoading: "Standort wird ermittelt...",
    recoHearts: "❤️ Favoriten", recoHeartsNear: "Deine Favoriten & Freunde",
    recoInCarnet: "In deiner Sammlung", recoNearby: "Beliebte Orte in der Nähe",
    recoAI: "✨ Outsy AI", recoAISub: "10 Empfehlungen nach Übereinstimmung",
    recoAddFav: "+ Zu Favoriten hinzufügen", recoMapsLink: "Maps →",
    recoNoHeart: "Keine Favoriten in diesem Bereich. Füge Orte mit ≥ 4★ hinzu!",
    duplicateTitle: "📍 Ort bereits vorhanden", duplicateText: "ist bereits in deinen Favoriten. Aktualisieren?",
    duplicateCancel: "Abbrechen", duplicateEdit: "Bestehenden bearbeiten", duplicateUpdate: "Aktualisieren",
    editTitle: "✏️ Bearbeiten", toastSaved: "✓ Gespeichert!", toastUpdated: "✓ Favorit aktualisiert!",
    toastAdded: "✓ Zu Favoriten hinzugefügt!", toastFriend: "✓ Anfrage gesendet!", toastFriendAdded: "✓ Freund hinzugefügt!",
    loading: "Laden... ✈️", loginConnect: "Anmelden", loginCreate: "Konto erstellen",
    loginEmail: "E-Mail", loginPassword: "Passwort", loginFirstName: "Vorname", loginLastName: "Nachname",
    loginError: "Falsche E-Mail oder falsches Passwort.", loginSignupError: "Fehler bei der Registrierung.",
    loginNameRequired: "Vor- und Nachname erforderlich.", loginWelcome: "Willkommen",
  },
  it: {
    appTagline: "Save & Share places you love. Discover more.",
    tabReco: "Reco ✨", tabFavorites: "❤️ Preferiti", tabAdd: "+ Aggiungi", tabFriends: "👥 Amici", tabProfile: "Profilo",
    logout: "Disconnetti",
    addPlace: "Nome del posto", addType: "Tipo", addPrice: "Prezzo", addCity: "Città", addCountry: "Paese",
    addRating: "Valutazione", addKids: "Adatto ai bambini", addLiked: "Cosa mi è piaciuto",
    addLikedSelect: "Seleziona", addLikedPrecise: "Aggiungi dettagli", addDisliked: "Cosa non mi è piaciuto",
    addDislikedSelect: "Seleziona", addDislikedPrecise: "Aggiungi dettagli",
    addSave: "Salva", addUpdate: "Aggiorna",
    filterType: "Tipo", filterPrice: "Prezzo", filterRating: "Valutazione", filterKids: "👶 Bambini",
    filterFriends: "👥 Amici", filterAll: "Tutti", nbRecosLabel: "Numero raccomandazioni AI", nbRecos5: "5", nbRecos10: "10", nbRecosAuto: "Auto",
    emptyFavorites: "Ancora nessun preferito", emptyFavoritesSub: "Inizia aggiungendo un posto",
    emptyResults: "Nessun risultato", emptyResultsSub: "Prova altri filtri",
    profileIdentity: "👤 La mia identità", profileFirstName: "Nome", profileLastName: "Cognome",
    prefCitiesLabel: "🏙️ Città preferite", prefCitiesPlaceholder: "Aggiungi una città...", prefCitiesEmpty: "Nessuna città aggiunta", profileLanguage: "🌍 Lingua preferita", profileLanguageLabel: "Lingua dell'interfaccia e delle raccomandazioni",
    profileLikes: "✨ Cosa mi piace", profileLikesSelect: "Seleziona", profileLikesPrecise: "Aggiungi dettagli",
    profileBudget: "Budget abituale", profileBudgetNone: "Non specificato",
    profileDislikes: "🚫 Cosa evito", profileDislikesSelect: "Seleziona", profileDislikesPrecise: "Aggiungi dettagli",
    profileNotes: "📝 Note libere", profileNotesLabel: "Altre info", profileSave: "Salva profilo", profileSaved: "✓ Profilo salvato",
    friendsRequests: "🔔 Richieste", friendsSearch: "🔍 Aggiungi amico", friendsSearchPlaceholder: "Email del tuo amico...",
    friendsSearchBtn: "Cerca", friendsList: "👥 I miei amici", friendsNone: "Nessun amico per ora.",
    friendsPending: "⏳ In attesa", friendsAlready: "Già amici", friendsSent: "Inviato", friendsAdd: "+ Aggiungi",
    friendsAccept: "✓", friendsView: "Vedi ❤️", friendsHeartTitle: "❤️ Preferiti di",
    friendsNoHeart: "non ha ancora preferiti.",
    recoLocation: "📍 Posizione & impostazioni", recoRadius: "Raggio di ricerca",
    recoType: "Tipo", recoPrice: "Prezzo", recoFind: "✨ Chiedi a Outsy AI",
    recoLocating: "Localizzazione...", recoSearching: "Ricerca in corso...",
    recoGPS: "📍 La mia posizione", recoManual: "✏️ Inserisci", recoGPSLoading: "Recupero posizione...",
    recoHearts: "❤️ Preferiti", recoHeartsNear: "I tuoi preferiti e amici",
    recoInCarnet: "Nella tua collezione", recoNearby: "Posti popolari vicini",
    recoAI: "✨ Outsy AI", recoAISub: "10 raccomandazioni per affinità",
    recoAddFav: "+ Aggiungi ai preferiti", recoMapsLink: "Maps →",
    recoNoHeart: "Nessun preferito in quest'area. Aggiungi posti con ≥ 4★!",
    duplicateTitle: "📍 Posto già esistente", duplicateText: "è già nei tuoi preferiti. Aggiornare?",
    duplicateCancel: "Annulla", duplicateEdit: "Modifica esistente", duplicateUpdate: "Aggiorna",
    editTitle: "✏️ Modifica", toastSaved: "✓ Salvato!", toastUpdated: "✓ Preferito aggiornato!",
    toastAdded: "✓ Aggiunto ai preferiti!", toastFriend: "✓ Richiesta inviata!", toastFriendAdded: "✓ Amico aggiunto!",
    loading: "Caricamento... ✈️", loginConnect: "Accedi", loginCreate: "Crea account",
    loginEmail: "Email", loginPassword: "Password", loginFirstName: "Nome", loginLastName: "Cognome",
    loginError: "Email o password errati.", loginSignupError: "Errore durante la registrazione.",
    loginNameRequired: "Nome e cognome richiesti.", loginWelcome: "Benvenuto/a",
  },
  pt: {
    appTagline: "Save & Share places you love. Discover more.",
    tabReco: "Reco ✨", tabFavorites: "❤️ Favoritos", tabAdd: "+ Adicionar", tabFriends: "👥 Amigos", tabProfile: "Perfil",
    logout: "Sair",
    addPlace: "Nome do lugar", addType: "Tipo", addPrice: "Preço", addCity: "Cidade", addCountry: "País",
    addRating: "Avaliação geral", addKids: "Adequado para crianças", addLiked: "O que gostei",
    addLikedSelect: "Selecionar", addLikedPrecise: "Adicionar detalhes", addDisliked: "O que não gostei",
    addDislikedSelect: "Selecionar", addDislikedPrecise: "Adicionar detalhes",
    addSave: "Guardar", addUpdate: "Atualizar",
    filterType: "Tipo", filterPrice: "Preço", filterRating: "Avaliação", filterKids: "👶 Crianças",
    filterFriends: "👥 Amigos", filterAll: "Todos", nbRecosLabel: "Número de recomendações AI", nbRecos5: "5", nbRecos10: "10", nbRecosAuto: "Auto",
    emptyFavorites: "Ainda sem favoritos", emptyFavoritesSub: "Comece por adicionar um lugar",
    emptyResults: "Sem resultados", emptyResultsSub: "Tente outros filtros",
    profileIdentity: "👤 Minha identidade", profileFirstName: "Nome", profileLastName: "Apelido",
    prefCitiesLabel: "🏙️ Cidades preferidas", prefCitiesPlaceholder: "Adicionar uma cidade...", prefCitiesEmpty: "Sem cidades adicionadas", profileLanguage: "🌍 Idioma preferido", profileLanguageLabel: "Idioma da interface e recomendações",
    profileLikes: "✨ O que gosto", profileLikesSelect: "Selecionar", profileLikesPrecise: "Adicionar detalhes",
    profileBudget: "Orçamento habitual", profileBudgetNone: "Não especificado",
    profileDislikes: "🚫 O que evito", profileDislikesSelect: "Selecionar", profileDislikesPrecise: "Adicionar detalhes",
    profileNotes: "📝 Notas livres", profileNotesLabel: "Outras informações", profileSave: "Guardar perfil", profileSaved: "✓ Perfil guardado",
    friendsRequests: "🔔 Pedidos", friendsSearch: "🔍 Adicionar amigo", friendsSearchPlaceholder: "Email do seu amigo...",
    friendsSearchBtn: "Pesquisar", friendsList: "👥 Os meus amigos", friendsNone: "Sem amigos por enquanto.",
    friendsPending: "⏳ Pendente", friendsAlready: "Já amigos", friendsSent: "Enviado", friendsAdd: "+ Adicionar",
    friendsAccept: "✓", friendsView: "Ver ❤️", friendsHeartTitle: "❤️ Favoritos de",
    friendsNoHeart: "ainda não tem favoritos.",
    recoLocation: "📍 Localização & definições", recoRadius: "Raio de pesquisa",
    recoType: "Tipo", recoPrice: "Preço", recoFind: "✨ Perguntar ao Outsy AI",
    recoLocating: "A localizar...", recoSearching: "A pesquisar...",
    recoGPS: "📍 A minha posição", recoManual: "✏️ Introduzir", recoGPSLoading: "A obter posição...",
    recoHearts: "❤️ Favoritos", recoHeartsNear: "Os seus favoritos e amigos",
    recoInCarnet: "Na sua coleção", recoNearby: "Lugares populares perto",
    recoAI: "✨ Outsy AI", recoAISub: "10 recomendações por afinidade",
    recoAddFav: "+ Adicionar aos favoritos", recoMapsLink: "Maps →",
    recoNoHeart: "Sem favoritos nesta área. Adicione lugares com ≥ 4★!",
    duplicateTitle: "📍 Lugar já existe", duplicateText: "já está nos seus favoritos. Atualizar?",
    duplicateCancel: "Cancelar", duplicateEdit: "Editar existente", duplicateUpdate: "Atualizar",
    editTitle: "✏️ Editar", toastSaved: "✓ Guardado!", toastUpdated: "✓ Favorito atualizado!",
    toastAdded: "✓ Adicionado aos favoritos!", toastFriend: "✓ Pedido enviado!", toastFriendAdded: "✓ Amigo adicionado!",
    loading: "A carregar... ✈️", loginConnect: "Entrar", loginCreate: "Criar conta",
    loginEmail: "Email", loginPassword: "Palavra-passe", loginFirstName: "Nome", loginLastName: "Apelido",
    loginError: "Email ou palavra-passe incorretos.", loginSignupError: "Erro ao registar.",
    loginNameRequired: "Nome e apelido obrigatórios.", loginWelcome: "Bem-vindo/a",
  },
  nl: {
    appTagline: "Save & Share places you love. Discover more.",
    tabReco: "Reco ✨", tabFavorites: "❤️ Favorieten", tabAdd: "+ Toevoegen", tabFriends: "👥 Vrienden", tabProfile: "Profiel",
    logout: "Uitloggen",
    addPlace: "Naam van de plek", addType: "Type", addPrice: "Prijs", addCity: "Stad", addCountry: "Land",
    addRating: "Algemene beoordeling", addKids: "Kindvriendelijk", addLiked: "Wat ik leuk vond",
    addLikedSelect: "Selecteren", addLikedPrecise: "Details toevoegen", addDisliked: "Wat ik niet leuk vond",
    addDislikedSelect: "Selecteren", addDislikedPrecise: "Details toevoegen",
    addSave: "Opslaan", addUpdate: "Bijwerken",
    filterType: "Type", filterPrice: "Prijs", filterRating: "Beoordeling", filterKids: "👶 Kinderen",
    filterFriends: "👥 Vrienden", filterAll: "Alle", nbRecosLabel: "Aantal AI-aanbevelingen", nbRecos5: "5", nbRecos10: "10", nbRecosAuto: "Auto",
    emptyFavorites: "Nog geen favorieten", emptyFavoritesSub: "Begin met een plek toevoegen",
    emptyResults: "Geen resultaten", emptyResultsSub: "Probeer andere filters",
    profileIdentity: "👤 Mijn identiteit", profileFirstName: "Voornaam", profileLastName: "Achternaam",
    prefCitiesLabel: "🏙️ Voorkeurssteden", prefCitiesPlaceholder: "Stad toevoegen...", prefCitiesEmpty: "Geen steden toegevoegd", profileLanguage: "🌍 Voorkeurstaal", profileLanguageLabel: "Taal van de interface en aanbevelingen",
    profileLikes: "✨ Wat ik leuk vind", profileLikesSelect: "Selecteren", profileLikesPrecise: "Details toevoegen",
    profileBudget: "Gebruikelijk budget", profileBudgetNone: "Niet opgegeven",
    profileDislikes: "🚫 Wat ik vermijd", profileDislikesSelect: "Selecteren", profileDislikesPrecise: "Details toevoegen",
    profileNotes: "📝 Vrije notities", profileNotesLabel: "Andere info", profileSave: "Profiel opslaan", profileSaved: "✓ Profiel opgeslagen",
    friendsRequests: "🔔 Verzoeken", friendsSearch: "🔍 Vriend toevoegen", friendsSearchPlaceholder: "E-mail van je vriend...",
    friendsSearchBtn: "Zoeken", friendsList: "👥 Mijn vrienden", friendsNone: "Nog geen vrienden.",
    friendsPending: "⏳ In behandeling", friendsAlready: "Al vrienden", friendsSent: "Verzonden", friendsAdd: "+ Toevoegen",
    friendsAccept: "✓", friendsView: "Bekijk ❤️", friendsHeartTitle: "❤️ Favorieten van",
    friendsNoHeart: "heeft nog geen favorieten.",
    recoLocation: "📍 Locatie & instellingen", recoRadius: "Zoekradius",
    recoType: "Type", recoPrice: "Prijs", recoFind: "✨ Vraag Outsy AI",
    recoLocating: "Locatie bepalen...", recoSearching: "Zoeken...",
    recoGPS: "📍 Mijn locatie", recoManual: "✏️ Invoeren", recoGPSLoading: "Locatie ophalen...",
    recoHearts: "❤️ Favorieten", recoHeartsNear: "Jouw favorieten & vrienden",
    recoInCarnet: "In jouw collectie", recoNearby: "Populaire plekken in de buurt",
    recoAI: "✨ Outsy AI", recoAISub: "10 aanbevelingen op basis van overeenkomst",
    recoAddFav: "+ Toevoegen aan favorieten", recoMapsLink: "Maps →",
    recoNoHeart: "Geen favorieten in dit gebied. Voeg plekken toe met ≥ 4★!",
    duplicateTitle: "📍 Plek bestaat al", duplicateText: "staat al in je favorieten. Bijwerken?",
    duplicateCancel: "Annuleren", duplicateEdit: "Bestaande bewerken", duplicateUpdate: "Bijwerken",
    editTitle: "✏️ Bewerken", toastSaved: "✓ Opgeslagen!", toastUpdated: "✓ Favoriet bijgewerkt!",
    toastAdded: "✓ Toegevoegd aan favorieten!", toastFriend: "✓ Verzoek verzonden!", toastFriendAdded: "✓ Vriend toegevoegd!",
    loading: "Laden... ✈️", loginConnect: "Inloggen", loginCreate: "Account aanmaken",
    loginEmail: "E-mail", loginPassword: "Wachtwoord", loginFirstName: "Voornaam", loginLastName: "Achternaam",
    loginError: "Onjuist e-mailadres of wachtwoord.", loginSignupError: "Fout bij registratie.",
    loginNameRequired: "Voor- en achternaam vereist.", loginWelcome: "Welkom",
  },
  en: {
    appTagline: "Save & Share places you love. Discover more.",
    tabReco: "Reco ✨", tabFavorites: "❤️ Favorites", tabAdd: "+ Add", tabFriends: "👥 Friends", tabProfile: "Profile",
    logout: "Sign out",
    addPlace: "Place name", addType: "Type", addPrice: "Price", addCity: "City", addCountry: "Country",
    addRating: "Overall rating", addKids: "👶 Kids friendly", addLiked: "What I liked",
    addLikedSelect: "Select", addLikedPrecise: "Add details", addDisliked: "What I didn't like",
    addDislikedSelect: "Select", addDislikedPrecise: "Add details",
    addSave: "Save", addUpdate: "Update",
    filterType: "Type", filterPrice: "Price", filterRating: "Rating", filterKids: "👶 Kids friendly",
    filterFriends: "👥 Friends", filterAll: "All", nbRecosLabel: "AI Recommendation Number", nbRecos5: "5", nbRecos10: "10", nbRecosAuto: "Auto (max based on favorites)",
    emptyFavorites: "No favorites yet", emptyFavoritesSub: "Start by adding a place",
    emptyResults: "No results", emptyResultsSub: "Try different filters",
    profileIdentity: "👤 My identity", profileFirstName: "First name", profileLastName: "Last name",
    prefCitiesLabel: "🏙️ Preferred cities", prefCitiesPlaceholder: "Add a city...", prefCitiesEmpty: "No cities added yet", profileLanguage: "🌍 Preferred language", profileLanguageLabel: "Interface and recommendations language",
    profileLikes: "✨ What I like", profileLikesSelect: "Select", profileLikesPrecise: "Add details",
    profileBudget: "Usual budget", profileBudgetNone: "Not specified",
    profileDislikes: "🚫 What I avoid", profileDislikesSelect: "Select", profileDislikesPrecise: "Add details",
    profileNotes: "📝 Free notes", profileNotesLabel: "Other info", profileSave: "Save my profile", profileSaved: "✓ Profile saved",
    friendsRequests: "🔔 Friend requests", friendsSearch: "🔍 Add a friend", friendsSearchPlaceholder: "Your friend's email...",
    friendsSearchBtn: "Search", friendsList: "👥 My friends", friendsNone: "No friends yet.",
    friendsPending: "⏳ Pending", friendsAlready: "Already friends", friendsSent: "Sent", friendsAdd: "+ Add",
    friendsAccept: "✓", friendsView: "View ❤️", friendsHeartTitle: "❤️ Favorites from",
    friendsNoHeart: "has no favorites yet.",
    recoLocation: "📍 Location & settings", recoRadius: "Search radius",
    recoType: "Type", recoPrice: "Price", recoFind: "✨ Ask Outsy AI",
    recoLocating: "Locating...", recoSearching: "Searching...",
    recoGPS: "📍 My location", recoManual: "✏️ Enter", recoGPSLoading: "Getting your location...",
    recoHearts: "❤️ Favorites", recoHeartsNear: "Your favorites & friends",
    recoInCarnet: "In your collection", recoNearby: "Popular nearby places",
    recoAI: "✨ Outsy AI", recoAISub: "10 recommendations ranked by match",
    recoAddFav: "+ Add to my favorites", recoMapsLink: "Maps →",
    recoNoHeart: "No favorites in this area. Add places with rating ≥ 4★!",
    duplicateTitle: "📍 Place already exists", duplicateText: "is already in your favorites. Update it?",
    duplicateCancel: "Cancel", duplicateEdit: "Edit existing", duplicateUpdate: "Update",
    editTitle: "✏️ Edit", toastSaved: "✓ Place saved!", toastUpdated: "✓ Favorite updated!",
    toastAdded: "✓ Added to favorites!", toastFriend: "✓ Request sent!", toastFriendAdded: "✓ Friend added!",
    loading: "Loading... ✈️", loginConnect: "Sign in", loginCreate: "Create account",
    loginEmail: "Email", loginPassword: "Password", loginFirstName: "First name", loginLastName: "Last name",
    loginError: "Incorrect email or password.", loginSignupError: "Error during registration.",
    loginNameRequired: "First and last name required.", loginWelcome: "Welcome",
  },
};

function useT(language) {
  return TRANSLATIONS[language] || TRANSLATIONS["en"];
}



const COLORS = {
  bg: "#0f0e0c", card: "#1a1814", border: "#2e2b25",
  accent: "#c9a84c", accentLight: "#e8c97a",
  text: "#f0ead8", muted: "#8a8070", tag: "#252219",
  dislike: "#8b3a3a", dislikeBg: "#3a1a1a",
};

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=DM+Sans:wght@300;400;500&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: ${COLORS.bg}; color: ${COLORS.text}; font-family: 'DM Sans', sans-serif; min-height: 100vh; }
  .app { max-width: 480px; margin: 0 auto; min-height: 100vh; display: flex; flex-direction: column; }
  .header { padding: 20px 24px 14px; border-bottom: 1px solid ${COLORS.border}; position: sticky; top: 0; background: ${COLORS.bg}; z-index: 10; }
  .header-top { display: flex; justify-content: space-between; align-items: center; }
  .header-logo { font-family: 'Cormorant Garamond', serif; font-size: 22px; font-weight: 300; letter-spacing: 0.05em; }
  .header-logo span { color: ${COLORS.accent}; font-style: italic; }
  .header-user { font-size: 11px; color: ${COLORS.muted}; letter-spacing: 0.08em; text-transform: uppercase; }
  .logout-btn { background: none; border: 1px solid ${COLORS.border}; color: ${COLORS.muted}; border-radius: 6px; padding: 5px 10px; font-size: 11px; cursor: pointer; font-family: 'DM Sans', sans-serif; transition: all 0.2s; }
  .logout-btn:hover { border-color: #e06060; color: #e06060; }
  .header-middle { display: flex; justify-content: space-between; align-items: center; margin-top: 4px; margin-bottom: 10px; }
  .tabs { display: flex; background: ${COLORS.card}; border-radius: 8px; padding: 3px; border: 1px solid ${COLORS.border}; }
  .tab { flex: 1; padding: 6px 2px; font-size: 9px; font-family: 'DM Sans', sans-serif; letter-spacing: 0.05em; text-transform: uppercase; background: none; border: none; color: ${COLORS.muted}; cursor: pointer; border-radius: 6px; transition: all 0.2s; font-weight: 500; }
  .tab.active { background: ${COLORS.accent}; color: #0f0e0c; }
  .content { flex: 1; padding: 20px 24px; overflow-y: auto; }
  .form-section { display: flex; flex-direction: column; gap: 14px; }
  .field { display: flex; flex-direction: column; gap: 6px; position: relative; }
  .field label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.15em; color: ${COLORS.muted}; font-weight: 500; }
  .field input, .field textarea, .field select { background: ${COLORS.card}; border: 1px solid ${COLORS.border}; border-radius: 8px; color: ${COLORS.text}; font-family: 'DM Sans', sans-serif; font-size: 14px; padding: 11px 14px; outline: none; transition: border-color 0.2s; width: 100%; }
  .field input:focus, .field textarea:focus { border-color: ${COLORS.accent}; }
  .field textarea { resize: none; min-height: 60px; line-height: 1.5; }
  .field select { cursor: pointer; appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%238a8070' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 14px center; padding-right: 36px; }
  .tags-row { display: flex; flex-wrap: wrap; gap: 6px; }
  .tag-pill { padding: 5px 10px; border-radius: 20px; font-size: 11px; cursor: pointer; transition: all 0.2s; font-family: 'DM Sans', sans-serif; border: 1px solid ${COLORS.border}; background: ${COLORS.tag}; color: ${COLORS.muted}; }
  .tag-pill.selected-like { background: ${COLORS.accent}22; border-color: ${COLORS.accent}; color: ${COLORS.accent}; }
  .tag-pill.selected-dislike { background: #3a1a1a; border-color: #8b3a3a44; color: #a06060; }
  .autocomplete-wrapper { position: relative; }
  .autocomplete-dropdown { position: absolute; top: 100%; left: 0; right: 0; z-index: 50; background: #222018; border: 1px solid ${COLORS.accent}44; border-radius: 8px; margin-top: 4px; overflow: hidden; box-shadow: 0 8px 24px rgba(0,0,0,0.4); }
  .autocomplete-item { padding: 11px 14px; cursor: pointer; transition: background 0.15s; border-bottom: 1px solid ${COLORS.border}; }
  .autocomplete-item:last-child { border-bottom: none; }
  .autocomplete-item:hover { background: ${COLORS.accent}18; }
  .autocomplete-main { font-size: 14px; color: ${COLORS.text}; }
  .autocomplete-sub { font-size: 11px; color: ${COLORS.muted}; margin-top: 2px; }
  .autocomplete-loading { padding: 11px 14px; font-size: 12px; color: ${COLORS.muted}; text-align: center; }
  .place-badge { font-size: 11px; color: ${COLORS.accent}; margin-top: 4px; }
  .price-selector { display: flex; gap: 8px; }
  .price-btn { padding: 5px 8px; background: ${COLORS.card}; border: 1px solid ${COLORS.border}; border-radius: 6px; color: ${COLORS.muted}; font-size: 12px; cursor: pointer; transition: all 0.2s; font-family: 'DM Sans', sans-serif; font-weight: 500; }
  .price-btn.selected { background: ${COLORS.accent}22; border-color: ${COLORS.accent}; color: ${COLORS.accent}; }
  .star-row { display: flex; gap: 8px; align-items: center; }
  .star { font-size: 24px; cursor: pointer; transition: all 0.15s; color: #3a3520; user-select: none; }
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
  .save-btn { background: ${COLORS.accent}; color: #0f0e0c; border: none; border-radius: 10px; padding: 14px; font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; cursor: pointer; margin-top: 4px; transition: all 0.2s; }
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
  .badge.stars { color: #e8c97a; background: #2a2310; font-size: 11px; }
  .badge.kids { color: #7abf8a; background: #1a2e1e; }
  .badge.friend { color: ${COLORS.accent}; background: ${COLORS.accent}12; font-style: italic; }
  .memory-location { font-size: 12px; color: ${COLORS.muted}; margin-bottom: 6px; }
  .memory-tags { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 5px; }
  .memory-tag { font-size: 10px; padding: 2px 8px; border-radius: 20px; background: ${COLORS.accent}12; color: ${COLORS.accent}; }
  .memory-tag.bad { background: #3a1a1a; color: #a06060; }
  .memory-why { font-size: 12px; color: #b8ad98; line-height: 1.5; font-style: italic; margin-top: 4px; }
  .memory-dislike { font-size: 12px; color: #a06060; line-height: 1.4; margin-top: 4px; font-style: italic; }
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
  .modal-btn.primary { background: ${COLORS.accent}; color: #0f0e0c; border: none; }
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
  .prefs-card-title.bad { color: #c07070; }
  .prefs-save-btn { background: none; border: 1px solid ${COLORS.accent}; color: ${COLORS.accent}; border-radius: 8px; padding: 11px; font-family: 'DM Sans', sans-serif; font-size: 12px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; cursor: pointer; transition: all 0.2s; }
  .prefs-save-btn:hover { background: ${COLORS.accent}22; }
  .prefs-saved { font-size: 11px; color: ${COLORS.accent}; text-align: center; }
  .friends-section { display: flex; flex-direction: column; gap: 16px; }
  .friend-search-row { display: flex; gap: 8px; }
  .friend-search-input { flex: 1; background: ${COLORS.card}; border: 1px solid ${COLORS.border}; border-radius: 8px; color: ${COLORS.text}; font-family: 'DM Sans', sans-serif; font-size: 14px; padding: 11px 14px; outline: none; }
  .friend-search-btn { padding: 11px 16px; background: ${COLORS.accent}; border: none; border-radius: 8px; color: #0f0e0c; font-family: 'DM Sans', sans-serif; font-size: 12px; font-weight: 600; cursor: pointer; }
  .friend-card { background: ${COLORS.card}; border: 1px solid ${COLORS.border}; border-radius: 10px; padding: 14px 16px; display: flex; align-items: center; justify-content: space-between; gap: 12px; }
  .friend-info { display: flex; flex-direction: column; gap: 2px; }
  .friend-name { font-size: 14px; color: ${COLORS.text}; font-weight: 500; }
  .friend-email { font-size: 11px; color: ${COLORS.muted}; }
  .friend-action-btn { padding: 6px 12px; border-radius: 6px; font-family: 'DM Sans', sans-serif; font-size: 11px; font-weight: 600; cursor: pointer; transition: all 0.2s; border: none; }
  .friend-action-btn.add { background: ${COLORS.accent}; color: #0f0e0c; }
  .friend-action-btn.accept { background: #2a4a2e; color: #7abf8a; }
  .friend-action-btn.decline { background: ${COLORS.dislikeBg}; color: #a06060; margin-left: 4px; }
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
  .reco-section { display: flex; flex-direction: column; gap: 20px; }
  .reco-location-card { background: ${COLORS.card}; border: 1px solid ${COLORS.accent}44; border-radius: 12px; padding: 16px; display: flex; flex-direction: column; gap: 12px; }
  .reco-location-title { font-family: 'Cormorant Garamond', serif; font-size: 16px; font-style: italic; color: ${COLORS.accent}; }
  .reco-block { display: flex; flex-direction: column; gap: 14px; }
  .reco-block-title { font-family: 'Cormorant Garamond', serif; font-size: 20px; font-style: italic; color: ${COLORS.accent}; padding-bottom: 8px; border-bottom: 1px solid ${COLORS.border}; }
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
  .ai-reco-rank { font-size: 22px; font-family: 'Cormorant Garamond', serif; color: ${COLORS.accent}; font-style: italic; }
  .ai-reco-meta { display: flex; gap: 6px; flex-wrap: wrap; }
  .match-score { display: flex; align-items: center; gap: 6px; }
  .match-bar-wrap { flex: 1; height: 4px; background: ${COLORS.border}; border-radius: 4px; overflow: hidden; }
  .match-bar { height: 100%; border-radius: 4px; background: ${COLORS.accent}; transition: width 0.5s ease; }
  .match-score-label { font-size: 11px; color: ${COLORS.accent}; font-weight: 600; white-space: nowrap; }
  .match-reasons { display: flex; flex-wrap: wrap; gap: 5px; margin-top: 2px; }
  .match-reason { font-size: 10px; padding: 3px 8px; border-radius: 20px; background: ${COLORS.accent}18; color: ${COLORS.accent}; border: 1px solid ${COLORS.accent}33; }
  .ai-reco-address { font-size: 12px; color: ${COLORS.muted}; }
  .ai-reco-why { font-size: 13px; color: #b8ad98; line-height: 1.5; font-style: italic; }
  .ai-reco-tip { font-size: 12px; color: ${COLORS.accent}; line-height: 1.4; }
  .ai-reco-warning { font-size: 12px; color: #a06060; line-height: 1.4; }
  .global-map-container { height: 240px; width: 100%; border-radius: 12px; overflow: hidden; border: 1px solid ${COLORS.border}; position: relative; }
  .thinking { display: flex; gap: 5px; justify-content: center; padding: 20px; }
  .dot { width: 7px; height: 7px; border-radius: 50%; background: ${COLORS.accent}; animation: bounce 1.2s infinite; }
  .dot:nth-child(2) { animation-delay: 0.2s; }
  .dot:nth-child(3) { animation-delay: 0.4s; }
  @keyframes bounce { 0%,80%,100%{opacity:.3;transform:scale(.8)}40%{opacity:1;transform:scale(1)} }
  .success-toast { position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%); background: ${COLORS.accent}; color: #0f0e0c; padding: 10px 20px; border-radius: 20px; font-size: 13px; font-weight: 600; z-index: 300; animation: fadeInUp 0.3s ease, fadeOut 0.3s ease 1.7s forwards; }
  @keyframes fadeInUp { from{opacity:0;transform:translateX(-50%) translateY(10px)}to{opacity:1;transform:translateX(-50%) translateY(0)} }
  @keyframes fadeOut { to{opacity:0} }
  .count-badge { display: inline-flex; align-items: center; justify-content: center; width: 17px; height: 17px; background: ${COLORS.accent}; color: #0f0e0c; border-radius: 50%; font-size: 10px; font-weight: 700; margin-left: 4px; }
  .notif-badge { display: inline-flex; align-items: center; justify-content: center; width: 17px; height: 17px; background: #e06060; color: white; border-radius: 50%; font-size: 10px; font-weight: 700; margin-left: 4px; }
  .empty { text-align: center; padding: 60px 20px; color: ${COLORS.muted}; }
  .empty-icon { font-size: 40px; margin-bottom: 12px; }
  .empty-text { font-family: 'Cormorant Garamond', serif; font-size: 18px; font-style: italic; }
  .empty-sub { font-size: 12px; margin-top: 6px; }
  .inline-input { background: ${COLORS.bg}; border: 1px solid ${COLORS.border}; border-radius: 8px; color: ${COLORS.text}; font-family: 'DM Sans', sans-serif; font-size: 14px; padding: 10px 14px; outline: none; width: 100%; margin-top: 0; transition: border-color 0.2s; }
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
function StarRating({ rating, size=13 }) {
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
            <stop offset={pct+"%"} stopColor="#3a3520"/>
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

function PlaceSearch({ onPlaceSelected }) {
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
      const city = components.find(c=>c.types?.includes("locality"))?.longText || components.find(c=>c.types?.includes("postal_town"))?.longText || components.find(c=>c.types?.includes("administrative_area_level_2"))?.longText || "";
      const country = components.find(c=>c.types?.includes("country"))?.longText || secondaryText.split(",").pop()?.trim() || "";
      const streetNumber = components.find(c=>c.types?.includes("street_number"))?.longText || "";
      const route = components.find(c=>c.types?.includes("route"))?.longText || "";
      const postalCode = components.find(c=>c.types?.includes("postal_code"))?.longText || "";
      const streetAddress = [streetNumber, route, postalCode].filter(Boolean).join(" ") || details.formattedAddress || "";
      const googleTypes = details.types||[];
      let type = "Restaurant";
      for (const gt of googleTypes) { if (GOOGLE_TYPE_MAP[gt]) { type=GOOGLE_TYPE_MAP[gt]; break; } }
      const price = PRICE_MAP[details.priceLevel]||"€€";
      // Extract cuisine from Google types
      const cuisineKeywords = {
        italian:"Italian", japanese:"Japanese", chinese:"Chinese", french:"French",
        indian:"Indian", thai:"Thai", mexican:"Mexican", american:"American",
        greek:"Greek", spanish:"Spanish", mediterranean:"Mediterranean",
        british:"British", korean:"Korean", vietnamese:"Vietnamese",
        turkish:"Turkish", lebanese:"Lebanese", moroccan:"Moroccan",
        sushi:"Sushi", pizza:"Pizza", burger:"Burger", steak:"Steakhouse",
        seafood:"Seafood", vegetarian:"Vegetarian", bakery:"Bakery",
        wine_bar:"Wine bar", cocktail:"Cocktail bar", cafe:"Café",
        ramen:"Japanese", noodle:"Asian", brasserie:"Brasserie", bistro:"Bistro"
      };
      let cuisine = "";
      for (const gt of googleTypes) {
        const key = Object.keys(cuisineKeywords).find(k=>gt.toLowerCase().includes(k));
        if (key) { cuisine = cuisineKeywords[key]; break; }
      }
      const googlePlaceId = placeId || "";
      const place = { name: mainText, city, country, type, price, address: streetAddress, cuisine, googlePlaceId };
      setSelectedPlace(place); onPlaceSelected(place);
    } catch {
      const parts = secondaryText.split(",");
      onPlaceSelected({ name: mainText, city: parts[0]?.trim()||"", country: parts[parts.length-1]?.trim()||"", type: "Restaurant", price: "€€" });
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
              <div key={i} className="autocomplete-item" onMouseDown={()=>selectPlace(s)} style={{background:i===activeIdx?"#2e2b25":"transparent",borderRadius:4}}>
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

function GoogleMap({ recommendations, userCoords, heartMemories }) {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const boundsRef = useRef(null);
  const [activePlace, setActivePlace] = useState(null);
  const [fullscreen, setFullscreen] = useState(false);

  useEffect(() => {
    if (!mapRef.current) return;
    const hasContent = recommendations?.length || userCoords?.lat || heartMemories?.length;
    if (!hasContent) return;

    const loadMap = () => {
      if (!window.google) return;
      const bounds = new window.google.maps.LatLngBounds();
      const map = new window.google.maps.Map(mapRef.current, {
        zoom: 13, mapTypeControl: false, streetViewControl: false, fullscreenControl: false,
        mapId: "49c549e3ad4ad4323a538e40",
        colorScheme: "DARK",
      });
      mapInstance.current = map;
      boundsRef.current = bounds;
      const geocoder = new window.google.maps.Geocoder();
      let total = 0, done = 0;
      const checkFit = () => { done++; if (done >= total && !bounds.isEmpty()) map.fitBounds(bounds); };

      // User position - blue
      if (userCoords?.lat) {
        bounds.extend({ lat: userCoords.lat, lng: userCoords.lng });
        (() => {
          const pin = new window.google.maps.marker.PinElement({ background:"#4a90d9", borderColor:"#ffffff", glyphColor:"#ffffff", scale:0.9 });
          new window.google.maps.marker.AdvancedMarkerElement({ position:{lat:userCoords.lat,lng:userCoords.lng}, map, zIndex:100, content:pin });
        })();
      }

      // Heart memories - red
      (heartMemories||[]).forEach(m => {
        if (!m._lat && !m.city && !m.name) return;
        total++;
        if (m._lat) {
          const pos = { lat: m._lat, lng: m._lng };
          const pin = new window.google.maps.marker.PinElement({ background:"#e05555", borderColor:"#0f0e0c", glyphColor:"#fff", scale:0.8 });
          const marker = new window.google.maps.marker.AdvancedMarkerElement({ position:pos, map, title:m.name, content:pin });
          marker.addListener("gmp-click", () => setActivePlace({ ...m, markerType: "heart" }));
          bounds.extend(pos);
          checkFit();
        } else {
          geocoder.geocode({ address: `${m.name} ${m.city||""} ${m.country||""}` }, (res, status) => {
            if (status === "OK" && res[0]) {
              const pos = res[0].geometry.location;
              const pin2 = new window.google.maps.marker.PinElement({ background:"#e05555", borderColor:"#0f0e0c", glyphColor:"#fff", scale:0.8 });
              const marker = new window.google.maps.marker.AdvancedMarkerElement({ position:pos, map, title:m.name, content:pin2 });
              marker.addListener("gmp-click", () => setActivePlace({ ...m, markerType: "heart" }));
              bounds.extend(pos);
            }
            checkFit();
          });
        }
      });

      // AI recommendations - gold
      (recommendations||[]).forEach((reco, i) => {
        if (!reco.address) return;
        total++;
        geocoder.geocode({ address: reco.address }, (results, status) => {
          if (status === "OK" && results[0]) {
            const pos = results[0].geometry.location;
            const pinEl = new window.google.maps.marker.PinElement({ background:"#c9a84c", borderColor:"#0f0e0c", glyphColor:"#0f0e0c", glyphText:String(i+1), scale:1.0 });
            const marker = new window.google.maps.marker.AdvancedMarkerElement({ position:pos, map, title:reco.name, content:pinEl });
            marker.addListener("gmp-click", () => setActivePlace({ ...reco, markerType: "ai", idx: i+1 }));
            bounds.extend(pos);
          }
          checkFit();
        });
      });

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
    userCoords?.lat,
    userCoords?.lng
  ]);

  // Refit bounds when toggling fullscreen
  useEffect(() => {
    if (mapInstance.current && boundsRef.current && !boundsRef.current.isEmpty()) {
      setTimeout(() => mapInstance.current.fitBounds(boundsRef.current), 100);
    }
  }, [fullscreen]);

  const mapStyle = fullscreen
    ? { position:"fixed", inset:0, zIndex:500, background:"#0f0e0c" }
    : { position:"relative", borderRadius:12, overflow:"hidden", border:"1px solid #2e2b25" };

  return (
    <div style={mapStyle}>
      <div ref={mapRef} style={{ width:"100%", height: fullscreen ? "100vh" : "240px" }}/>

      {/* Fullscreen toggle */}
      {/* Recenter button */}
      <button onClick={() => {
        if (mapInstance.current && boundsRef.current && !boundsRef.current.isEmpty()) {
          mapInstance.current.fitBounds(boundsRef.current);
        }
      }} style={{
        position:"absolute", top:8, left:8, background:"#1a1814", border:"1px solid #2e2b25",
        borderRadius:6, width:32, height:32, color:"#f0ead8", cursor:"pointer", fontSize:16,
        fontFamily:"'DM Sans',sans-serif", zIndex:1, display:"flex", alignItems:"center", justifyContent:"center",
        boxShadow:"0 2px 8px rgba(0,0,0,0.4)"
      }}>⊕</button>

      <button onClick={() => setFullscreen(f => !f)} style={{
        position:"absolute", top:8, right:8, background:"#c9a84c", border:"none",
        borderRadius:6, padding:"6px 12px", color:"#0f0e0c", cursor:"pointer", fontSize:12,
        fontFamily:"'DM Sans',sans-serif", fontWeight:600, zIndex:1, boxShadow:"0 2px 8px rgba(0,0,0,0.4)"
      }}>
        {fullscreen ? "✕ Close" : "⛶ Fullscreen"}
      </button>

      {/* Legend */}
      <div style={{ position:"absolute", top:8, left:48, display:"flex", gap:6, zIndex:1 }}>
        {userCoords?.lat && <span style={{fontSize:12,color:"#f0ead8",background:"#1a181488",padding:"4px 9px",borderRadius:20,border:"1px solid #2e2b25",backdropFilter:"blur(4px)"}}>🔵 You</span>}
        {(heartMemories||[]).length > 0 && <span style={{fontSize:12,color:"#f0ead8",background:"#1a181488",padding:"4px 9px",borderRadius:20,border:"1px solid #2e2b25",backdropFilter:"blur(4px)"}}>🔴 Favorites</span>}
        {(recommendations||[]).length > 0 && <span style={{fontSize:12,color:"#f0ead8",background:"#1a181488",padding:"4px 9px",borderRadius:20,border:"1px solid #2e2b25",backdropFilter:"blur(4px)"}}>🟡 AI picks</span>}
      </div>

      {/* Place popup on click */}
      {activePlace && (
        <div style={{
          position:"absolute", bottom:8, left:8, right:8,
          background:"#1a1814", border:`1px solid ${activePlace.markerType==="heart"?"#e05555":"#c9a84c"}`,
          borderRadius:10, padding:"12px 14px", zIndex:20
        }}>
          <div style={{display:"flex", justifyContent:"space-between", alignItems:"flex-start"}}>
            <div style={{fontFamily:"'Cormorant Garamond',serif", fontSize:17, color:"#f0ead8", flex:1, marginRight:8}}>
              {activePlace.idx && <span style={{color:"#c9a84c",marginRight:6}}>#{activePlace.idx}</span>}
              {activePlace.name}
            </div>
            <button onClick={() => setActivePlace(null)} style={{background:"none",border:"none",color:"#8a8070",cursor:"pointer",fontSize:16}}>✕</button>
          </div>
          <div style={{fontSize:11,color:"#8a8070",marginTop:3}}>
            {activePlace.address || [activePlace.city, activePlace.country].filter(Boolean).join(", ")}
          </div>
          {activePlace.why && <div style={{fontSize:12,color:"#b8ad98",fontStyle:"italic",marginTop:4}}>« {activePlace.why} »</div>}
          {activePlace.rating > 0 && <div style={{fontSize:12,color:"#e8c97a",marginTop:3}}>{"★".repeat(activePlace.rating)}</div>}
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
function RecoPlaceSearch({ onPlaceSelected, initialValue="" }) {
  const [query, setQuery] = useState(initialValue);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);
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
              <div key={i} className="autocomplete-item" onMouseDown={()=>selectPlace(s)} style={{background:i===activeIdx?"#2e2b25":"transparent"}}>
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
const DEFAULT_FORM = { name:"",type:"Restaurant",price:"€€",city:"",country:"",rating:0,likeTags:[],dislikeTags:[],why:"",dislike:"",kidsf:false,cuisine:"",address:"" };
const DEFAULT_PREFS = { loves:"",hates:"",budget:"",notes:"",lovesTags:[],hatesTags:[],firstName:"",lastName:"",language:"en",nbrecos:"10",preferredCities:[] };

function MemoryForm({ initial, onSave, onCancel, isEdit=false, t, lang="en", onDuplicate }) {
  const [form, setForm] = useState(initial||DEFAULT_FORM);
  const likesOptions = (LIKES_BY_TYPE_LANG[lang]||LIKES_BY_TYPE_LANG.en)[form.type]||(LIKES_BY_TYPE_LANG.en)["Restaurant"];
  const dislikesOptions = (DISLIKES_BY_TYPE_LANG[lang]||DISLIKES_BY_TYPE_LANG.en)[form.type]||(DISLIKES_BY_TYPE_LANG.en)["Restaurant"];
  const handleTypeChange = (t) => setForm(f=>({...f,type:t,likeTags:[],dislikeTags:[]}));
  const handlePlaceSelected = (place) => {
    if (!place) { setForm(f=>({...f,name:"",city:"",country:"",type:"Restaurant",price:"€€"})); return; }
    setForm(f=>({...f,name:place.name,city:place.city,country:place.country,address:place.address||"",type:place.type,price:place.price,cuisine:place.cuisine||"",google_place_id:place.googlePlaceId||"",likeTags:[],dislikeTags:[]}));
    if (onDuplicate) onDuplicate(place.name);
  };
  return (
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      {!isEdit?<div className="field"><label>{t?.addPlace||"Place name"}</label><PlaceSearch onPlaceSelected={handlePlaceSelected}/></div>
        :<div className="field"><label>{t?.addPlace||"Place name"}</label><input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))}/></div>}
      {form.name && <>
        <div className="row-2">
          <div className="field"><label>Type</label><select value={form.type} onChange={e=>handleTypeChange(e.target.value)}>{TYPES.map(t=><option key={t}>{t}</option>)}</select></div>
          {(form.type==="Restaurant"||form.type==="Bar / Café")&&(<div className="field"><label>{t?.addCuisine||"Cuisine"}</label><input value={form.cuisine||""} onChange={e=>setForm(f=>({...f,cuisine:e.target.value}))} placeholder="Ex: Italian, Japanese..."/></div>)}
          <div className="field"><label>Prix</label><div className="price-selector">{PRICES.map(p=><button key={p} className={`price-btn ${form.price===p?"selected":""}`} onClick={()=>setForm(f=>({...f,price:p}))}>{p}</button>)}</div></div>
        </div>
        <div className="field"><label>{t?.addAddress||"Address"}</label><input placeholder="22 Harcourt Street" value={form.address||""} onChange={e=>setForm(f=>({...f,address:e.target.value}))}/></div>
        <div className="row-2">
          <div className="field"><label>{t?.addCity||"City"}</label><input placeholder="London" value={form.city} onChange={e=>setForm(f=>({...f,city:e.target.value}))}/></div>
          <div className="field"><label>{t?.addCountry||"Country"}</label><input placeholder="UK" value={form.country} onChange={e=>setForm(f=>({...f,country:e.target.value}))}/></div>
        </div>
        <div className="field"><label>{t?.addRating||"Rating"}</label><StarPicker value={form.rating} onChange={v=>setForm(f=>({...f,rating:v}))}/></div>
        <KidsToggle value={form.kidsf} onChange={v=>setForm(f=>({...f,kidsf:v}))} t={t}/>
        <div className="section-divider"><span>{t?.addLiked||"Liked"}</span></div>
        <div className="field"><label>{t?.addLikedSelect||"Select"}</label><TagPicker options={likesOptions} selected={form.likeTags} onChange={v=>setForm(f=>({...f,likeTags:v}))} mode="like"/></div>
        <div className="field"><label>{t?.addLikedPrecise||"Details"}</label><textarea placeholder="..." value={form.why} onChange={e=>setForm(f=>({...f,why:e.target.value}))}/></div>
        <div className="section-divider"><span>{t?.addDisliked||"Disliked"}</span></div>
        <div className="field"><label style={{color:"#a06060"}}>{t?.addDislikedSelect||"Select"}</label><TagPicker options={dislikesOptions} selected={form.dislikeTags} onChange={v=>setForm(f=>({...f,dislikeTags:v}))} mode="dislike"/></div>
        <div className="field"><label style={{color:"#a06060"}}>{t?.addDislikedPrecise||"Details"}</label><textarea placeholder="..." value={form.dislike} onChange={e=>setForm(f=>({...f,dislike:e.target.value}))} style={{background:COLORS.dislikeBg,borderColor:COLORS.dislike+"44",color:"#d4a0a0"}}/></div>
        <div style={{display:"flex",gap:8,marginTop:4}}>
          {onCancel&&<button className="modal-btn secondary" onClick={onCancel}>{t?.duplicateCancel||"Cancel"}</button>}
          <button className="save-btn" style={{flex:1,margin:0}} onClick={()=>onSave(form)} disabled={!form.name.trim()}>{isEdit?(t?.addUpdate||"Update"):(t?.addSave||"Save")}</button>
        </div>
      </>}
    </div>
  );
}

function OpeningHoursWidget({ openNow, hours, lang="en" }) {
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
    let out = line;
    Object.entries(dayMap).forEach(([en,fr])=>{ out = out.replace(en, fr); });
    // Convert AM/PM to 24h
    out = out.replace(/(\d+):(\d+)\s*AM/g, (_,h,m)=>{
      const hh = h==="12"?"00":h.padStart(2,"0");
      return `${hh}:${m}`;
    });
    out = out.replace(/(\d+):(\d+)\s*PM/g, (_,h,m)=>{
      const hh = h==="12"?"12":String(parseInt(h)+12);
      return `${hh}:${m}`;
    });
    out = out.replace(" – ", "–");
    return out;
  };

  const getTodayLine = () => {
    if (!hours?.length) return null;
    const days = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
    const today = new Date().getDay();
    return hours.find(h => h.startsWith(days[today])) || null;
  };

  const todayLine = getTodayLine();
  const todayTimes = todayLine ? convertToFr(todayLine).split(": ").slice(1).join(": ") : null;

  const openLabel = {fr:"Ouvert",en:"Open",es:"Abierto",de:"Geöffnet",it:"Aperto",pt:"Aberto",nl:"Open"}[lang]||"Open";
  const closedLabel = {fr:"Fermé",en:"Closed",es:"Cerrado",de:"Geschlossen",it:"Chiuso",pt:"Fechado",nl:"Gesloten"}[lang]||"Closed";
  const maybeTemp = !openNow && !hours?.length;
  const statusText = openNow
    ? `🟢 ${openLabel}${todayTimes && todayTimes!==closedLabel ? " · "+todayTimes : ""}`
    : maybeTemp
      ? `⚠️ ${{fr:'Fermé temporairement',en:'Possibly temporarily closed',es:'Posiblemente cerrado temporalmente',de:'Möglicherweise vorübergehend geschlossen',it:'Possibilmente chiuso temporaneamente',pt:'Possivelmente fechado temporariamente',nl:'Mogelijk tijdelijk gesloten'}[lang]||'Possibly temporarily closed'}`
      : `🔴 ${closedLabel}${todayTimes && todayTimes!==closedLabel ? " · "+todayTimes : ""}`;

  return (
    <div style={{marginBottom:6}}>
      <div onClick={()=>hours?.length&&setExpanded(e=>!e)}
        style={{display:"inline-flex",alignItems:"center",gap:6,cursor:hours?.length?"pointer":"default"}}>
        <span style={{fontSize:11,
          color:openNow?"#7abf8a":maybeTemp?"#e8c97a":"#e06060",
          background:openNow?"#1a2e1e":maybeTemp?"#2e2b10":"#3a1a1a",
          padding:"3px 10px",borderRadius:20}}>
          {statusText}
        </span>
        {hours?.length&&<span style={{fontSize:10,color:"#8a8070"}}>{expanded?"▲":"▼"}</span>}
      </div>
      {expanded&&hours?.length&&(
        <div style={{marginTop:6,background:"#1a1814",border:"1px solid #2e2b25",borderRadius:8,
          padding:"8px 12px",fontSize:11,color:"#8a8070",lineHeight:1.8}}>
          {hours.map((h,i)=>{
            const fr = convertToFr(h);
            const [day,...rest] = fr.split(": ");
            return (
              <div key={i} style={{display:"flex",gap:8}}>
                <span style={{minWidth:100,color:"#f0ead8",fontWeight:500}}>{day}</span>
                <span>{rest.join(": ")}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function FriendsBadge({ friends, friendsData=[], onViewFriend, onSaveFriend }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={ref} style={{position:"relative",display:"inline-flex",alignItems:"center"}}>
      <span onClick={()=>setOpen(o=>!o)}
        style={{fontSize:10,color:"#9b8fe8",background:"#1e1a2e",border:"1px solid #9b8fe844",borderRadius:20,
          padding:"3px 7px",fontFamily:"'DM Sans',sans-serif",cursor:"pointer",userSelect:"none",letterSpacing:"0.06em"}}>
        👥 {friends.length}
      </span>
      {open&&(
        <div style={{position:"absolute",top:"calc(100% + 4px)",left:0,background:"#1a1814",border:"1px solid #2e2b25",
          borderRadius:10,padding:"8px 4px",zIndex:100,minWidth:220,boxShadow:"0 4px 20px rgba(0,0,0,0.6)"}}>
          {friends.map((fname,i)=>{
            const fMem = friendsData.find(m=>m.friendName===fname);
            return (
              <div key={i} style={{padding:"8px 12px",borderBottom:i<friends.length-1?"1px solid #2e2b2533":"none"}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:8}}>
                  <span style={{fontSize:12,color:"#f0ead8",fontWeight:500}}>👤 {fname}</span>
                  <div style={{display:"flex",gap:4,alignItems:"center"}}>
                    {fMem?.rating>0&&<span className="badge stars" style={{fontSize:9}}>{starsLabel(fMem.rating)}</span>}
                    {fMem?.kidsf&&<span className="badge kids" style={{fontSize:9}}>👶</span>}
                    {fMem?.price&&<span className="badge price" style={{fontSize:9}}>{fMem.price}</span>}
                    {onViewFriend&&<span onClick={()=>{setOpen(false);onViewFriend(fname,fMem);}}
                      style={{fontSize:14,color:"#c9a84c",cursor:"pointer",marginLeft:2}} title="Voir la fiche">→</span>}
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

function MemoryCard({ m, onEdit, onDelete, onDeleteRequest, isMine, lang="en", onViewFriend, onSaveFriend }) {
  return (
    <div className={`memory-card ${!isMine?"friend-memory-card":""}`}>
      <div className="memory-top">
        <div className="memory-name">{TYPE_ICONS[m.type]} {m.name}</div>
      </div>
      <div className="memory-meta" style={{marginBottom:6,justifyContent:"flex-start",flexWrap:"wrap",gap:5}}>
        {m.cuisine&&<span className="badge">{m.cuisine}</span>}
        {(()=>{
          if (m.isMine&&m.rating>0) return <span className="badge stars">{starsLabel(m.rating)}</span>;
          if (!m.isMine&&m.friendsData?.length>0) {
            const avg = m.friendsData.reduce((s,f)=>s+(f.rating||0),0)/m.friendsData.filter(f=>f.rating>0).length;
            if (avg>0) return <span className="badge stars"><StarRating rating={avg} size={11}/></span>;
          }
          if (m.rating>0) return <span className="badge stars">{starsLabel(m.rating)}</span>;
          return null;
        })()}
        {m.kidsf&&<span className="badge kids">👶</span>}
        {(m.friendsWhoHave?.length>0)&&<FriendsBadge friends={m.friendsWhoHave} friendsData={m.friendsData||[]} onViewFriend={onViewFriend} onSaveFriend={onSaveFriend}/>}
        <span className="badge price">{m.price}</span>
      </div>
      {(m.address||m.city||m.country)&&<div className="memory-location">
        📍 {m.address||[m.city,m.country].filter(Boolean).join(", ")}
        <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(m.name+", "+(m.address||[m.city,m.country].filter(Boolean).join(", ")))}`}
          target="_blank" rel="noopener noreferrer"
          style={{color:"#c9a84c",fontSize:10,marginLeft:8,textDecoration:"none"}}>Maps →</a>
      </div>}
      {m.openNow!==undefined&&m.openNow!==null&&<OpeningHoursWidget openNow={m.openNow} hours={m.openingHours} lang={lang}/>}

      {(m.likeTags||[]).length>0&&<div className="memory-tags">{m.likeTags.map(t=><span key={t} className="memory-tag">👍 {t}</span>)}</div>}
      {m.why&&<div className="memory-why">« {m.why} »</div>}
      {(m.dislikeTags||[]).length>0&&<div className="memory-tags">{m.dislikeTags.map(t=><span key={t} className="memory-tag bad">👎 {t}</span>)}</div>}
      {m.dislike&&<div className="memory-dislike">« {m.dislike} »</div>}
      <div className="memory-footer">
        <span className="memory-date">{formatDate(m.ts)}</span>
        {isMine&&<div className="memory-actions">
          <button className="edit-btn" onClick={()=>onEdit(m)}>✏️ Éditer</button>
          <button className="del-btn" onClick={()=>onDeleteRequest(m.id, m.name)}>✕</button>
        </div>}
      </div>
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

function CityPicker({ cities: citiesRaw, onChange, placeholder, empty }) {
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
            style={{flex:1,background:"#1a1814",border:"1px solid #2e2b25",borderRadius:8,color:"#f0ead8",
              fontFamily:"'DM Sans',sans-serif",fontSize:13,padding:"9px 12px",outline:"none"}}
          />
          <button onClick={add} style={{background:"#c9a84c22",border:"1px solid #c9a84c",borderRadius:8,
            padding:"9px 14px",color:"#c9a84c",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontSize:13,fontWeight:600}}>
            +
          </button>
        </div>
        {showDrop&&suggestions.length>0&&(
          <div style={{position:"absolute",top:"100%",left:0,right:0,background:"#1a1814",border:"1px solid #2e2b25",
            borderRadius:8,zIndex:100,overflow:"hidden",marginTop:4,boxShadow:"0 4px 16px rgba(0,0,0,0.4)"}}>
            {suggestions.map((s,i)=>(
              <div key={i} onMouseDown={()=>selectSuggestion(s)}
                style={{padding:"10px 14px",cursor:"pointer",fontSize:13,color:"#f0ead8",
                  background:i===activeIdx?"#2e2b25":"transparent",borderBottom:"1px solid #2e2b2522"}}>
                📍 {s.label}
              </div>
            ))}
          </div>
        )}
      </div>
      {cities.length===0 ? (
        <div style={{fontSize:12,color:"#8a8070",fontStyle:"italic"}}>{empty}</div>
      ) : (
        <div style={{display:"flex",flexDirection:"column",gap:4}}>
          {cities.map((city,i)=>(
            <div key={i} style={{display:"flex",alignItems:"center",gap:6,background:"#1a1814",
              border:"1px solid #2e2b25",borderRadius:8,padding:"7px 10px"}}>
              <span style={{fontSize:11,color:"#c9a84c",fontWeight:700,minWidth:18}}>#{i+1}</span>
              <span style={{flex:1,fontSize:13,color:"#f0ead8"}}>{city}</span>
              <button onClick={()=>moveUp(i)} disabled={i===0}
                style={{background:"none",border:"none",color:i===0?"#3a3730":"#8a8070",cursor:i===0?"default":"pointer",fontSize:14,padding:"0 4px"}}>▲</button>
              <button onClick={()=>moveDown(i)} disabled={i===cities.length-1}
                style={{background:"none",border:"none",color:i===cities.length-1?"#3a3730":"#8a8070",cursor:i===cities.length-1?"default":"pointer",fontSize:14,padding:"0 4px"}}>▼</button>
              <button onClick={()=>remove(i)}
                style={{background:"none",border:"none",color:"#e06060",cursor:"pointer",fontSize:14,padding:"0 4px"}}>✕</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TravelAgent() {
  const [session, setSession] = useState(undefined);
  const [showResetModal, setShowResetModal] = useState(false);
  const [tab, _setTab] = useState("reco");
  const scrollPositions = useRef({});
  useLayoutEffect(() => {
    const pos = scrollPositions.current._next ?? null;
    if (pos !== null) { window.scrollTo({top: pos, behavior:"instant"}); scrollPositions.current._next = null; }
  }, [tab]);
  const setTab = (t) => { scrollPositions.current[tab] = window.scrollY; scrollPositions.current._next = scrollPositions.current[t] ?? 0; _setTab(t); };
  const [memories, setMemories] = useState([]);
  const [friendMemories, setFriendMemories] = useState([]);
  const [friends, setFriends] = useState([]);
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
  const [deleteConfirm, setDeleteConfirm] = useState(null);
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
  const [recoPrice, setRecoPrice] = useState(ALL);
  const [recoKids, setRecoKids] = useState(false);
  const [recoFriendFilter, setRecoFriendFilter] = useState("all"); // all | mine | friends
  const [distance, setDistance] = useState(1000);
  const [locMode, setLocMode] = useState(() => localStorage.getItem("outsy_locMode") || "free");
  const [freeLocation, setFreeLocation] = useState(() => localStorage.getItem("outsy_freeLocation") || "");
  const [gpsLocation, setGpsLocation] = useState(() => localStorage.getItem("outsy_gpsLocation") || "");
  const [gpsReady, setGpsReady] = useState(true); // false while GPS is loading
  const [recoCoords, setRecoCoords] = useState(() => {
    try { const s = localStorage.getItem("outsy_recoCoords"); return s ? JSON.parse(s) : null; } catch { return null; }
  });
  const recoCoordsRef = useRef(null);
  const [geocoding, setGeocoding] = useState(false);
  const [heartMemories, setHeartMemories] = useState([]);
  const [closedPlaces, setClosedPlaces] = useState([]);
  const [heartsLoaded, setHeartsLoaded] = useState(false);
  const [heartsKey, setHeartsKey] = useState(0);
  const [nearbyPlaces, setNearbyPlaces] = useState([]);
  const [heartLoading, setHeartLoading] = useState(false);
  const [aiRecos, setAiRecos] = useState([]);
  const [aiLoading, setAiLoading] = useState(false);
  const abortRef = useRef(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setSession(session));
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
        if (pr) setPrefs({ ...DEFAULT_PREFS, ...pr });
        setLoading(false); // Show UI immediately with cached data
      }
    } catch {}

    // Then refresh from Supabase in background
    const load = async () => {
      if (!localStorage.getItem(cacheKey)) setLoading(true);
      const { data: prof } = await supabase.from('profiles').select('*').eq('user_id', userId).maybeSingle();
      if (prof) setProfile(prof);
      const { data: mems } = await supabase.from('memories').select('*').eq('user_id', userId).order('ts', { ascending: false });
      if (mems) setMemories(mems);

      // Auto-enrich memories missing google_place_id/address/cuisine - once per day max
      if (mems && mems.length > 0) {
        const lastEnrich = localStorage.getItem("outsy_enriched");
        const today = new Date().toDateString();
        const toEnrich = mems.filter(m => !m.google_place_id || !m.address || !m.cuisine);
        if (toEnrich.length > 0 && lastEnrich !== today) {
          localStorage.setItem("outsy_enriched", today);
          (async () => {
            for (const m of toEnrich.slice(0, 10)) { // max 10 per day
              try {
                const query = `${m.name}${m.city ? ', '+m.city : ''}${m.country ? ', '+m.country : ''}`;
                const r = await fetch('/api/places', {
                  method: 'POST', headers: {'Content-Type':'application/json'},
                  body: JSON.stringify({ action: 'verify', places: [{name: m.name, address: m.address||''}] })
                });
                const data = await r.json();
                const result = data.results?.[0];
                if (!result) continue;
                
                // Get full details from Places API
                const r2 = await fetch('/api/places', {
                  method: 'POST', headers: {'Content-Type':'application/json'},
                  body: JSON.stringify({ action: 'geocode', input: query })
                });
                const geoData = await r2.json();
                
                const updates = {};
                if (!m.address && result.placeId) {
                  // Extract address from geocode
                  if (geoData.address && !m.address) updates.address = geoData.address.split(',')[0]?.trim() || '';
                }
                if (!m.city && geoData.address) {
                  const parts = geoData.address.split(',').map(s=>s.trim());
                  if (parts.length >= 2) updates.city = parts[parts.length-2] || '';
                  if (parts.length >= 1) updates.country = parts[parts.length-1] || '';
                }
                if (!m.cuisine && result.cuisine) updates.cuisine = result.cuisine;
                
                if (Object.keys(updates).length > 0) {
                  await supabase.from('memories').update(updates).eq('id', m.id).eq('user_id', userId);
                  setMemories(prev => prev.map(x => x.id===m.id ? {...x,...updates} : x));
                  console.log(`Enriched: ${m.name}`, updates);
                }
              } catch(e) { console.error('Enrich error:', m.name, e); }
            }
          })();
        }
      }
      const { data: pref } = await supabase.from('preferences').select('*').eq('user_id', userId).maybeSingle();
      if (pref) setPrefs({ ...DEFAULT_PREFS, ...pref });
      // Save to cache
      try { localStorage.setItem(cacheKey, JSON.stringify({ profile: prof, memories: mems, prefs: pref })); } catch {}
      await loadFriends(userId);
      // Load community-reported closed places
      try {
        const { data: closed } = await supabase.from('closed_places').select('name,place_id,address');
        if (closed) setClosedPlaces(closed.map(p=>p.name)); // keep original case for AI prompt
      } catch {}
      setLoading(false);
    };
    load();
  }, [session]);

  const loadFriends = async (userId) => {
    const { data: acceptedA } = await supabase.from('friendships').select('*, profiles!friendships_addressee_id_fkey(*)').eq('requester_id', userId).eq('status', 'accepted');
    const { data: acceptedB } = await supabase.from('friendships').select('*, profiles!friendships_requester_id_fkey(*)').eq('addressee_id', userId).eq('status', 'accepted');
    const friendList = [
      ...(acceptedA||[]).map(f=>({id:f.id,profile:f.profiles,friendUserId:f.addressee_id})),
      ...(acceptedB||[]).map(f=>({id:f.id,profile:f.profiles,friendUserId:f.requester_id})),
    ];
    setFriends(friendList);
    if (friendList.length>0) {
      const friendIds = friendList.map(f=>f.friendUserId);
      // Récupérer les mémoires sans jointure
      const { data: fMems } = await supabase.from('memories').select('*').in('user_id', friendIds).order('ts', { ascending: false });
      if (fMems) {
        // Récupérer les profils séparément et fusionner
        const { data: fProfiles } = await supabase.from('profiles').select('user_id, first_name, last_name').in('user_id', friendIds);
        const profileMap = {};
        (fProfiles||[]).forEach(p => { profileMap[p.user_id] = p; });
        setFriendMemories(fMems.map(m => {
          const p = profileMap[m.user_id];
          return { ...m, friendName: p ? `${p.first_name} ${p.last_name}` : "Ami" };
        }));
      }
    }
    const { data: inReqs } = await supabase.from('friendships').select('*, profiles!friendships_requester_id_fkey(*)').eq('addressee_id', userId).eq('status', 'pending');
    setPendingIn(inReqs||[]);
    const { data: outReqs } = await supabase.from('friendships').select('*, profiles!friendships_addressee_id_fkey(*)').eq('requester_id', userId).eq('status', 'pending');
    setPendingOut(outReqs||[]);
  };

  useEffect(() => {
    if (heartsKey > 0) {
      const coords = recoCoordsRef.current;
      if (coords?.lat) loadHearts(coords);
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
    const { isMine:_a, friendName:_b, distanceKm:_c, _lat, _lng, friendsData:_d, friendsWhoHave:_e, profiles:_f, user_id:_g, id:_h, ts:_ts, ...cleanForm } = form;
    const entry = { ...cleanForm, id: Date.now(), ts: Date.now(), user_id: userId };
    const { error } = await supabase.from('memories').insert(entry);
    if (!error) { setMemories(prev=>[entry,...prev]); showToast(t.toastSaved); setFormKey(k=>k+1); }
  };

  const handleUpdate = async (form) => {
    // Clean form - only send DB fields
    const { isMine, friendName, distanceKm, _lat, _lng, friendsData, friendsWhoHave, ...cleanForm } = form;
    const { error } = await supabase.from('memories').update(cleanForm).eq('id', editMemory.id).eq('user_id', userId);
    if (!error) { setMemories(prev=>prev.map(m=>m.id===editMemory.id?{...m,...cleanForm}:m)); setEditMemory(null); showToast(t.toastUpdated); }
    else { console.error('Update error:', error); showToast('❌ ' + error.message); }
  };

  const handleDuplicateUpdate = async () => {
    const { newForm, existing } = duplicateAlert;
    const merged = { ...existing, ...newForm, id: existing.id, ts: existing.ts, user_id: userId };
    const { isMine, friendName, distanceKm, _lat, _lng, profiles, friendsData, friendsWhoHave, ...updated } = merged;
    await supabase.from('memories').update(updated).eq('id', existing.id).eq('user_id', userId);
    setMemories(prev=>prev.map(m=>m.id===existing.id?updated:m));
    setDuplicateAlert(null); showToast(t.toastUpdated); setFormKey(k=>k+1);
  };

  const deleteMemory = async (id) => {
    await supabase.from('memories').delete().eq('id', id).eq('user_id', userId);
    setMemories(prev=>{ const next=prev.filter(m=>m.id!==id); try{localStorage.removeItem(`outsy_cache_${userId}`);}catch{} return next; });
  };

  const savePrefs = async () => {
    await supabase.from('preferences').upsert({ ...prefs, user_id: userId });
    await supabase.from('profiles').upsert({ user_id: userId, first_name: prefs.firstName, last_name: prefs.lastName, email: session.user.email });
    setPrefsSaved(true); setTimeout(()=>setPrefsSaved(false), 2000);
  };

  const searchFriends = async () => {
    if (!searchQuery.trim()) return;
    const res = await fetch("/api/friends", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "search", userId, targetEmail: searchQuery }) });
    const data = await res.json();
    setSearchResults(data.users||[]);
  };

  const sendFriendRequest = async (targetUserId) => {
    await supabase.from('friendships').insert({ requester_id: userId, addressee_id: targetUserId, status: 'pending' });
    showToast(t.toastFriend); setSearchResults([]); setSearchQuery(""); await loadFriends(userId);
  };

  const acceptFriend = async (friendshipId) => {
    await supabase.from('friendships').update({ status: 'accepted' }).eq('id', friendshipId);
    showToast(t.toastFriendAdded); await loadFriends(userId);
  };

  const declineFriend = async (friendshipId) => {
    await supabase.from('friendships').delete().eq('id', friendshipId);
    await loadFriends(userId);
  };

  const viewFriendMemories = (friend) => {
    const fMems = friendMemories.filter(m => m.user_id === friend.friendUserId);
    setViewingFriend({ name: `${friend.profile?.first_name} ${friend.profile?.last_name}`, memories: fMems });
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
      setGpsLocation("Erreur de localisation");
      setGpsReady(true);
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

  const loadHearts = async (coordsToUse) => {
    const myNames = new Set(memories.map(m=>m.name.toLowerCase())); // all my places for dedup
    const candidates = [
      // My memories filtered by rating
      ...(recoFriendFilter!=="friends" ? memories.filter(m=>m.rating>=3) : []),
      // Friend memories:
      // - if "friends only": only places NOT in my favorites
      // - if "all": places I have (regardless of their rating) + standalone places (rating>=3)
      ...(recoFriendFilter!=="mine" ? friendMemories.filter(m=>
        recoFriendFilter==="friends"
          ? m.rating>=3  // friends only: apply rating filter strictly
          : myNames.has(m.name.toLowerCase()) || m.rating>=3   // all: attach mine + standalone
      ) : [])
    ]
      .filter(m=>recoType===ALL||m.type===recoType)
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
            heartMems = inRadius.sort((a,b)=>a.distanceKm-b.distanceKm||b.rating-a.rating);
          } else { heartMems = heartMems.sort((a,b)=>b.rating-a.rating); }
        }
      } catch { heartMems = heartMems.sort((a,b)=>b.rating-a.rating); }
    } else { heartMems = heartMems.sort((a,b)=>b.rating-a.rating); }
    // Deduplicate by name - keep isMine version if exists
    const deduped = [];
    const seenNames = new Set();
    // First pass: add own memories
    heartMems.filter(m=>m.isMine).forEach(m => {
      const key = m.name.toLowerCase();
      if (!seenNames.has(key)) { seenNames.add(key); deduped.push(m); }
    });
    // Second pass: add friend-only memories
    heartMems.filter(m=>!m.isMine).forEach(m => {
      const key = m.name.toLowerCase();
      if (!seenNames.has(key)) { seenNames.add(key); deduped.push(m); }
      else {
        // Add friend to existing entry's friendsWhoHave
        const existing = deduped.find(x=>x.name.toLowerCase()===key);
        if (existing) { existing.friendsWhoHave = [...(existing.friendsWhoHave||[]), m.friendName].filter(Boolean); existing.friendsData = [...(existing.friendsData||[]), m]; }
      }
    });
    const heartSlice = deduped.slice(0,10);
    setHeartMemories(heartSlice);
    setHeartsLoaded(true);

    // Verify favorites are still open
    const myHearts = heartSlice.filter(m=>m.isMine&&m.name);
    if (myHearts.length > 0) {
      try {
        const verifyRes = await fetch("/api/places", {
          method:"POST", headers:{"Content-Type":"application/json"},
          body: JSON.stringify({ action:"verify", places: myHearts.map(m=>({name:m.name,address:m.address||""})) })
        });
        const verifyData = await verifyRes.json();
        const tempClosedNames = new Set((verifyData.results||[])
          .filter(r=>r.businessStatus==="CLOSED_TEMPORARILY")
          .map(r=>r.name.toLowerCase()));
        if (tempClosedNames.size > 0) {
          setHeartMemories(prev=>prev.filter(m=>!tempClosedNames.has(m.name.toLowerCase())));
          console.log("Filtered temp closed:", [...tempClosedNames]);
        }
        const closed = (verifyData.results||[]).filter(r=>r.businessStatus==="CLOSED_PERMANENTLY");
        if (closed.length > 0) {
          const closedFavs = closed.map(r=>{
            const mem = myHearts.find(m=>m.name.toLowerCase()===r.name.toLowerCase());
            return mem ? {id:mem.id, name:mem.name, placeId:r.placeId} : null;
          }).filter(Boolean);
          if (closedFavs.length > 0) setClosedFavoritesAlert(closedFavs);
        }
        // Enrich heartMemories with real openNow + store placeId
        const verifyMap = {};
        (verifyData.results||[]).forEach(r=>{ verifyMap[r.name.toLowerCase()] = r; });
        setHeartMemories(prev=>prev.map(m=>{
          const v = verifyMap[m.name.toLowerCase()];
          if (!v) return m;
          // Save placeId back to DB if missing
          if (v.placeId && !m.google_place_id && m.user_id===userId) {
            supabase.from('memories').update({google_place_id:v.placeId}).eq('id',m.id).then(()=>{
              setMemories(prev2=>prev2.map(x=>x.id===m.id?{...x,google_place_id:v.placeId}:x));
            });
          }
          return {...m, openNow:v.openNow??m.openNow, openingHours:v.openingHours||m.openingHours||null};
        }));
      } catch(e) { console.error("Verify favorites error:", e); }
    }
  };

  const loadRecos = async () => {
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
    console.log("Using coords:", coords.lat, coords.lng, "for:", locationLabel);

    // Coups de cœur — filtrer par distance réelle
    setHeartLoading(true);
    const myNames = new Set(memories.map(m=>m.name.toLowerCase())); // all my places for dedup
    const myMems = memories
      .filter(m=>m.rating>=3)
      .filter(m=>recoType===ALL||m.type===recoType)
      .filter(m=>recoPrice===ALL||m.price===recoPrice)
      .filter(m=>!recoKids||m.kidsf);
    const friendMems = friendMemories.filter(m=>
      myNames.has(m.name.toLowerCase()) || m.rating>=3 // always include friend version of my places
    ).filter(m=>recoType===ALL||m.type===recoType)
     .filter(m=>recoPrice===ALL||m.price===recoPrice)
     .filter(m=>!recoKids||m.kidsf);
    const candidates = [...myMems, ...friendMems];

    // Show all favorites sorted by rating — distance filter is best-effort
    console.log("Heart candidates:", candidates.length, "memories:", memories.length, "friends:", friendMemories.length);
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
        console.log("coordsMap keys:", Object.keys(coordsMap));
        console.log("heartMems IDs:", heartMems.map(m=>String(m.id)));

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
          console.log("In radius:", inRadius.length, "of", withCoords.length, "distance:", distance);
          // Don't include places without coords - they could be anywhere
          heartMems = inRadius.sort((a,b)=>a.distanceKm-b.distanceKm||b.rating-a.rating);
        } else {
          heartMems = heartMems.sort((a,b)=>b.rating-a.rating);
        }
      } else {
        heartMems = heartMems.sort((a,b)=>b.rating-a.rating);
      }
    } catch(err) {
      console.error("HEART FILTER ERROR:", err);
      heartMems = heartMems.sort((a,b)=>b.rating-a.rating);
    }
    // Deduplicate by name - keep isMine version if exists
    const deduped = [];
    const seenNames = new Set();
    // First pass: add own memories
    heartMems.filter(m=>m.isMine).forEach(m => {
      const key = m.name.toLowerCase();
      if (!seenNames.has(key)) { seenNames.add(key); deduped.push(m); }
    });
    // Second pass: add friend-only memories
    heartMems.filter(m=>!m.isMine).forEach(m => {
      const key = m.name.toLowerCase();
      if (!seenNames.has(key)) { seenNames.add(key); deduped.push(m); }
      else {
        // Add friend to existing entry's friendsWhoHave
        const existing = deduped.find(x=>x.name.toLowerCase()===key);
        if (existing) { existing.friendsWhoHave = [...(existing.friendsWhoHave||[]), m.friendName].filter(Boolean); existing.friendsData = [...(existing.friendsData||[]), m]; }
      }
    });
    // Preserve openNow from previous state if already enriched
    setHeartMemories(prev => {
      const prevMap = {};
      prev.forEach(m => { if(m.openNow!==undefined) prevMap[m.name.toLowerCase()] = {openNow:m.openNow, openingHours:m.openingHours}; });
      return deduped.slice(0,10).map(m => {
        const prev = prevMap[m.name.toLowerCase()];
        return prev ? {...m, openNow:prev.openNow, openingHours:prev.openingHours} : m;
      });
    });

    // Nearby Google Places
    try {
      const res = await fetch("/api/places", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "nearby", lat: coords.lat, lng: coords.lng, radius: distance, type: recoType }),
      });
      const data = await res.json();
      const places = (data.places||[]).map(p=>({
        name: p.displayName?.text||"", address: p.formattedAddress||"",
        rating: p.rating, price: PRICE_MAP[p.priceLevel]||"",
        lat: p.location?.latitude, lng: p.location?.longitude,
        openNow: p.currentOpeningHours?.openNow ?? p.regularOpeningHours?.openNow,
        openingHours: p.currentOpeningHours?.weekdayDescriptions || p.regularOpeningHours?.weekdayDescriptions || null,
        nextCloseTime: p.currentOpeningHours?.nextCloseTime || null,
        nextOpenTime: p.currentOpeningHours?.nextOpenTime || null,
      })).filter(p=>p.name);
      setNearbyPlaces(places);
    } catch { setNearbyPlaces([]); }
    setHeartLoading(false);

    // AI Recos
    setAiLoading(true); setAiRecos([]);
    const liked = memories.filter(m=>m.rating>=3).sort((a,b)=>b.rating-a.rating).slice(0,10)
      .map(m=>`- ${m.name} (${m.type}, ${m.price}, ${m.rating}/5) — liked: ${[...(m.likeTags||[]),m.why].filter(Boolean).join(", ")||"—"} — disliked: ${[...(m.dislikeTags||[]),m.dislike].filter(Boolean).join(", ")||"—"}${m.kidsf?" — kids friendly":""}`)
      .join("\n");
    const disliked = memories.filter(m=>m.rating>0&&m.rating<3).slice(0,5)
      .map(m=>`- ${m.name} (${m.rating}/5) — ${[...(m.dislikeTags||[]),m.dislike].filter(Boolean).join(", ")||"disappointing"}`)
      .join("\n");
    const friendLiked = friendMemories.filter(m=>m.rating>=3)
      .map(m=>`- ${m.name} (${m.type}) [ami: ${m.friendName}]`)
      .join("\n");
    const nbRecosCount = prefs.nbrecos === "auto"
      ? Math.max(3, 10 - heartMemories.length)
      : parseInt(prefs.nbrecos) || 10;
    const distLabel = DISTANCE_LABELS[DISTANCE_STEPS.indexOf(distance)];
    const langLabel = LANGUAGES.find(l=>l.code===prefs.language)?.label || "English";
    const prompt = `User profile:
Likes: ${[...(prefs.lovesTags||[]),prefs.loves].filter(Boolean).join(", ")||"not specified"}
Dislikes: ${[...(prefs.hatesTags||[]),prefs.hates].filter(Boolean).join(", ")||"not specified"}
Budget: ${recoPrice!==ALL?recoPrice:prefs.budget||"not specified"}
Kids friendly required: ${recoKids?"yes":"no"}
Preferred language for responses: ${langLabel}

My favorites: ${liked||"None."}
My disappointments: ${disliked||"None."}
Friends favorites: ${friendLiked||"None."}

Request: Find the ${nbRecosCount} best ${recoType} within STRICT ${distLabel} radius around "${locationLabel}".

IMPORTANT RULES:
- ALL places MUST be within ${distLabel} of "${locationLabel}". This is a HARD limit - do not exceed it under any circumstance.
- Before including a place, verify its address is physically within ${distLabel} walking distance from "${locationLabel}". If unsure, skip it.
- A place at 1.5km when the limit is 1km must be excluded. No exceptions.
- Sort by best match to the user profile (highest matchScore first)
- matchScore 0-100 based on profile match
- 2-3 concrete matchReasons explaining why this place fits
- Full address required: street number, street name, city, country
- NEVER suggest any of these places already in favorites: ${memories.map(m=>m.name).slice(0,20).join(', ')}
- NEVER suggest places similar to disappointments
- These venues are PERMANENTLY CLOSED, NEVER suggest them: ${closedPlaces.join(", ")||"none"}
- Write all text content (why, tip, warning, matchReasons) in ${langLabel}`;
    try {
      const res = await fetch("/api/recommend", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, structured: true, language: prefs.language || "en" }),
      });
      const data = await res.json();
      if (data.recommendations) {
        console.log(`AI returned ${data.recommendations.length} recommendations:`, data.recommendations.map(r=>r.name));
        // Verify places are still operational via Google Places
        try {
          const verifyRes = await fetch("/api/places", {
            method: "POST", headers: {"Content-Type":"application/json"},
            body: JSON.stringify({ action:"verify", places: data.recommendations.map(r=>({name:r.name,address:r.address,googlePlaceId:""})) })
          });
          const verifyData = await verifyRes.json();
          const newlyClosed = (verifyData.results||[]).filter(r=>!r.operational);
          const permClosed = newlyClosed.filter(r=>r.businessStatus==="CLOSED_PERMANENTLY");
          const tempClosed = newlyClosed.filter(r=>r.businessStatus==="CLOSED_TEMPORARILY");
          if (newlyClosed.length > 0) console.log(`Filtered as CLOSED: ${newlyClosed.map(r=>r.name).join(', ')}`);
          if (closedPlaces.length > 0) console.log(`Community closed list (${closedPlaces.length}):`, closedPlaces);
          const allClosedNames = new Set([
            ...newlyClosed.map(r=>r.name.toLowerCase()),
            ...closedPlaces.map(n=>n.toLowerCase())
          ]);
          // Enrich recos with real openNow from Google
          const verifyMap = {};
          (verifyData.results||[]).forEach(r=>{ verifyMap[r.name.toLowerCase()] = r; });
          const filtered = data.recommendations
            .filter(r=>!allClosedNames.has(r.name.toLowerCase()))
            .map(r=>{ const v=verifyMap[r.name.toLowerCase()]; return v ? {...r, openNow:v.openNow??r.openNow, openingHours:v.openingHours||r.openingHours, googleRating:v.googleRating||null, cuisine:v.cuisine||r.cuisine} : r; });
          console.log(`After closed filter: ${filtered.length} results:`, filtered.map(r=>r.name));
          console.log("Filtered addresses:", filtered.map(r=>r.name+": "+r.address));

          // Filter by real distance if we have coords
          if (coords?.lat && filtered.length > 0) {
            try {
              const geoRes = await fetch("/api/geocode-memories", {
                method:"POST", headers:{"Content-Type":"application/json"},
                body: JSON.stringify({ places: filtered.map(r=>({id:r.name,name:r.name,city:"",country:"",address:r.address})) })
              });
              const geoData = await geoRes.json();
              const recoWithDist = filtered.map(r=>{
                const g = (geoData.results||[]).find(x=>x.id===r.name);
                const dist = g?.lat ? calcDistance(coords.lat, coords.lng, g.lat, g.lng)*1000 : null;
                return {...r, _dist: dist};
              });
              const inRadius = recoWithDist.filter(r=>r._dist===null||r._dist<=distance);
              const outRadius = recoWithDist.filter(r=>r._dist!==null&&r._dist>distance);
              console.log(`In radius: ${inRadius.length}, Out of radius: ${outRadius.length}`);
              if (inRadius.length >= nbRecosCount) {
                // Enough results in radius - discard those outside
                setAiRecos(inRadius.sort((a,b)=>(a._dist||0)-(b._dist||0)));
              } else {
                // Not enough in radius - keep all, sorted by distance
                setAiRecos(recoWithDist.sort((a,b)=>(a._dist||0)-(b._dist||0)));
              }
            } catch {
              setAiRecos(filtered);
            }
          } else {
            setAiRecos(filtered);
          }
          if (permClosed.length > 0) {
            try {
              const toInsert = permClosed.map(r=>{
                const reco = data.recommendations.find(x=>x.name.toLowerCase()===r.name.toLowerCase());
                return { place_id: r.placeId||null, name: r.name, address: reco?.address||'', confirmed_by: userId };
              });
              await supabase.from('closed_places').upsert(toInsert, { onConflict: 'place_id' });
              const newIds = newlyClosed.map(r=>r.name);
              setClosedPlaces(prev=>[...new Set([...prev, ...newIds])]);
            } catch(e) { console.error('Upsert closed_places error:', e); }
          }
        } catch(verifyErr) {
          console.error("Verify error:", verifyErr);
          setAiRecos(data.recommendations);
        }
      }
    } catch(err) { console.error("AI error:", err); }
    setAiLoading(false);
  };

  const addRecoToCarnet = (reco) => {
    // Extract city/country from address
    const addrParts = (reco.address||"").split(",").map(s=>s.trim());
    const country = addrParts[addrParts.length-1] || "";
    const city = addrParts[addrParts.length-2] || "";
    const streetAddress = addrParts.slice(0, addrParts.length-2).join(", ") || reco.address || "";
    setRecoToAdd({
      name: reco.name,
      type: reco.type || recoType,
      price: reco.price || "€€",
      city, country,
      address: streetAddress,
      cuisine: reco.cuisine || "",
      rating: 0, likeTags: [], dislikeTags: [], why: "", dislike: "", kidsf: false
    });
  };

  const filteredMemories = (() => {
    const applyFilters = (m) => {
      if (filterType!==ALL&&m.type!==filterType) return false;
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
      if (filterType!==ALL&&m.type!==filterType) return false;
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
      <style>{css}</style>
      <div className="app">
        <div className="header">
          <div className="header-top">
            <div>
              <div className="header-logo">Outsy <span>AI</span></div>
              <div className="header-user">{displayName}</div>
            </div>
            <button className="logout-btn" onClick={logout}>{t.logout}</button>
          </div>
          <div className="tabs" style={{marginTop:12}}>
            <button className={`tab ${tab==="reco"?"active":""}`} onClick={()=>setTab("reco")}>{t.tabReco}</button>
            <button className={`tab ${tab==="memories"?"active":""}`} onClick={()=>setTab("memories")}>{t.tabFavorites}</button>
            <button className={`tab ${tab==="add"?"active":""}`} onClick={()=>setTab("add")}>{t.tabAdd}</button>
            <button className={`tab ${tab==="friends"?"active":""}`} onClick={()=>setTab("friends")}>
              {t.tabFriends} {pendingIn.length>0&&<span className="notif-badge">{pendingIn.length}</span>}
            </button>
            <button className={`tab ${tab==="prefs"?"active":""}`} onClick={()=>setTab("prefs")}>{t.tabProfile}</button>
          </div>
        </div>

        <div className="content">
          {loading && <div className="loading-overlay">{t.loading}</div>}

          {!loading && tab === "add" && <MemoryForm key={formKey} onSave={handleAdd} onCancel={()=>setFormKey(k=>k+1)} t={t} lang={lang} onDuplicate={(name)=>{ const dup=memories.find(m=>m.name.toLowerCase()===name.toLowerCase()); if(dup) setDuplicateAlert({existing:dup,newForm:null}); }}/>}

          {!loading && tab === "memories" && (
            <div>
              <div style={{marginBottom:12}}>
                <div className="filters-row"><span className="filter-label">{t.filterType}</span>{[[ALL,t.filterAll],...TYPES.map(x=>[x,x])].map(([val,label])=><button key={val} className={`filter-btn ${filterType===val?"active":""}`} onClick={()=>setFilterType(val)}>{val===ALL?t.filterAll:`${TYPE_ICONS[val]} ${val}`}</button>)}</div>
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
                ):filteredMemories.map(m=><MemoryCard key={`mem-${m.name.toLowerCase().replace(/\s+/g,"-")}`} m={m} isMine={m.isMine} lang={lang} onEdit={setEditMemory} onDelete={deleteMemory} onDeleteRequest={(id,name)=>setDeleteConfirm({id,name})} onViewFriend={(name,fMem)=>{ const mem=fMem||friendMemories.find(x=>x.friendName===name&&x.name===m.name); if(mem)setFriendMemoryModal({memory:mem,friendName:name}); }}
                  onSaveFriend={(fMem)=>{const dup=memories.find(m=>m.name.toLowerCase()===fMem.name.toLowerCase());if(dup){setDuplicateAlert({existing:dup,newForm:fMem});}else{handleAdd(fMem);}}}/>)}
              </div>
            </div>
          )}

          {!loading && tab === "friends" && (
            <div className="friends-section">
              {viewingFriend && (
                <div className="friend-panel">
                  <div className="friend-panel-header">
                    <div className="friend-panel-title">{t.friendsHeartTitle} {viewingFriend.name}</div>
                    <button className="friend-panel-close" onClick={()=>setViewingFriend(null)}>✕</button>
                  </div>
                  {viewingFriend.memories.length===0?(
                    <div style={{fontSize:13,color:COLORS.muted,textAlign:"center",padding:"20px 0"}}>{viewingFriend.name} {t.friendsNoHeart}</div>
                  ):(
                    <div className="memory-list">
                      {viewingFriend.memories.map(m=><MemoryCard key={m.id} m={m} isMine={false} onEdit={()=>{}} onDelete={()=>{}}/>)}
                    </div>
                  )}
                </div>
              )}

              {pendingIn.length>0&&(
                <div>
                  <div className="friends-title" style={{marginBottom:10}}>{t.friendsRequests}</div>
                  {pendingIn.map(f=>(
                    <div key={f.id} className="friend-card" style={{marginBottom:8}}>
                      <div className="friend-info"><div className="friend-name">{f.profiles?.first_name} {f.profiles?.last_name}</div><div className="friend-email">{f.profiles?.email}</div></div>
                      <div><button className="friend-action-btn accept" onClick={()=>acceptFriend(f.id)}>{t.friendsAccept}</button><button className="friend-action-btn decline" onClick={()=>declineFriend(f.id)}>✕</button></div>
                    </div>
                  ))}
                </div>
              )}

              <div>
                <div className="friends-title" style={{marginBottom:10}}>{t.friendsSearch}</div>
                <div className="friend-search-row">
                  <input className="friend-search-input" placeholder={t.friendsSearchPlaceholder} value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} onKeyDown={e=>e.key==="Enter"&&searchFriends()}/>
                  <button className="friend-search-btn" onClick={searchFriends}>{t.friendsSearchBtn}</button>
                </div>
                {searchResults.length>0&&(
                  <div style={{marginTop:10,display:"flex",flexDirection:"column",gap:8}}>
                    {searchResults.map(u=>{
                      const alreadyFriend=friends.some(f=>f.friendUserId===u.user_id);
                      const pendingSent=pendingOut.some(f=>f.addressee_id===u.user_id);
                      return (
                        <div key={u.user_id} className="friend-card">
                          <div className="friend-info"><div className="friend-name">{u.first_name} {u.last_name}</div><div className="friend-email">{u.email}</div></div>
                          {alreadyFriend?<span className="friend-action-btn pending">{t.friendsAlready}</span>:pendingSent?<span className="friend-action-btn pending">{t.friendsSent}</span>:<button className="friend-action-btn add" onClick={()=>sendFriendRequest(u.user_id)}>{t.friendsAdd}</button>}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div>
                <div className="friends-title" style={{marginBottom:10}}>{t.friendsList} ({friends.length})</div>
                {friends.length===0?<div className="empty-friends">{t.friendsNone}</div>:friends.map(f=>(
                  <div key={f.id} className="friend-card" style={{marginBottom:8}}>
                    <div className="friend-info">
                      <div className="friend-name">{f.profile?.first_name} {f.profile?.last_name}</div>
                      <div className="friend-email">{friendMemories.filter(m=>m.user_id===f.friendUserId).length} coups de cœur</div>
                    </div>
                    <button className="friend-action-btn view" onClick={()=>viewFriendMemories(f)}>{t.friendsView}</button>
                  </div>
                ))}
              </div>

              {pendingOut.length>0&&(
                <div>
                  <div className="friends-title" style={{marginBottom:10,fontSize:14}}>{t.friendsPending}</div>
                  {pendingOut.map(f=>(
                    <div key={f.id} className="friend-card" style={{marginBottom:8}}>
                      <div className="friend-info"><div className="friend-name">{f.profiles?.first_name} {f.profiles?.last_name}</div></div>
                      <span className="friend-action-btn pending">En attente</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {!loading && tab === "prefs" && (
            <div className="prefs-section">
              <div className="prefs-card">
                <div className="prefs-card-title">{t.profileIdentity}</div>
                <div className="row-2">
                  <div className="field"><label>{t.profileFirstName}</label><input placeholder="Brice" value={prefs.firstName||""} onChange={e=>setPrefs(p=>({...p,firstName:e.target.value}))}/></div>
                  <div className="field"><label>{t.profileLastName}</label><input placeholder="Dupont" value={prefs.lastName||""} onChange={e=>setPrefs(p=>({...p,lastName:e.target.value}))}/></div>
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
                  cities={prefs.preferredCities||[]}
                  onChange={v=>setPrefs(p=>({...p,preferredCities:v}))}
                  placeholder={t.prefCitiesPlaceholder||"Add a city..."}
                  empty={t.prefCitiesEmpty||"No cities added yet"}
                />
              </div>

              <div className="prefs-card">
                <div className="prefs-card-title">🎯 {t.nbRecosLabel||"AI Recommendation Number"} & {t.profileBudget||"Budget"}</div>
                <div className="field">
                  <label>{t.nbRecosLabel||"AI Recommendation Number"}</label>
                  <div style={{display:"flex",gap:8}}>
                    {[["5",t.nbRecos5||"5"],["10",t.nbRecos10||"10"],["auto",t.nbRecosAuto||"Auto"]].map(([val,label])=>(
                      <button key={val} onClick={()=>setPrefs(p=>({...p,nbrecos:val}))}
                        style={{flex:1,padding:"10px 4px",background:(prefs.nbrecos||"10")===val?"#c9a84c22":"#1a1814",
                          border:`1px solid ${(prefs.nbrecos||"10")===val?"#c9a84c":"#2e2b25"}`,
                          borderRadius:8,color:(prefs.nbrecos||"10")===val?"#c9a84c":"#8a8070",
                          cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontSize:12,fontWeight:600,transition:"all 0.2s"}}>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="field">
                  <label>{t.profileBudget}</label>
                  <select value={prefs.budget} onChange={e=>setPrefs(p=>({...p,budget:e.target.value}))}>
                    <option value="">{t.profileBudgetNone}</option>
                    {PRICES.map(p=><option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>
              <div className="prefs-card">
                <div className="prefs-card-title">{t.profileLikes}</div>
                <div className="field"><label>{t.profileLikesSelect}</label><TagPicker options={PREFS_LOVES_BY_LANG[lang]||PREFS_LOVES_BY_LANG.en} selected={prefs.lovesTags||[]} onChange={v=>setPrefs(p=>({...p,lovesTags:v}))} mode="like"/></div>
                <div className="field"><label>{t.profileLikesPrecise}</label><textarea placeholder="..." value={prefs.loves} onChange={e=>setPrefs(p=>({...p,loves:e.target.value}))} style={{minHeight:60}}/></div>
              </div>

              <div className="prefs-card" style={{borderColor:COLORS.dislike+"44"}}>
                <div className="prefs-card-title bad">{t.profileDislikes}</div>
                <div className="field"><label style={{color:"#a06060"}}>{t.profileDislikesSelect}</label><TagPicker options={PREFS_HATES_BY_LANG[lang]||PREFS_HATES_BY_LANG.en} selected={prefs.hatesTags||[]} onChange={v=>setPrefs(p=>({...p,hatesTags:v}))} mode="dislike"/></div>
                <div className="field"><label style={{color:"#a06060"}}>{t.profileDislikesPrecise}</label><textarea placeholder="..." value={prefs.hates} onChange={e=>setPrefs(p=>({...p,hates:e.target.value}))} style={{minHeight:60,background:COLORS.dislikeBg,borderColor:COLORS.dislike+"44",color:"#d4a0a0"}}/></div>
              </div>
              <div className="prefs-card">
                <div className="prefs-card-title">{t.profileNotes}</div>
                <div className="field"><label>{t.profileNotesLabel}</label><textarea placeholder="..." value={prefs.notes} onChange={e=>setPrefs(p=>({...p,notes:e.target.value}))} style={{minHeight:70}}/></div>
              </div>
              <button className="prefs-save-btn" onClick={savePrefs}>{t.profileSave}</button>
              {prefsSaved&&<div className="prefs-saved">{t.profileSaved}</div>}
              <button className="prefs-save-btn" style={{borderColor:"#e06060",color:"#e06060",marginTop:4}} onClick={()=>setShowResetModal(true)}>
                🔑 {t.resetPassword||"Reset password"}
              </button>
            </div>
          )}

          {!loading && tab === "reco" && (
            <div className="reco-section">
              <div className="reco-location-card">
                <div className="reco-location-title">{t.recoLocation}</div>
                <div className="location-row">
                  <button className={`loc-btn ${locMode==="gps"?"active":""}`} onClick={()=>{setLocMode("gps");setRecoCoords(null);setGpsReady(false);getGPS();}}>{t.recoGPS}</button>
                  <button className={`loc-btn ${locMode==="free"?"active":""}`} onClick={()=>{setLocMode("free");setRecoCoords(null);}}>{t.recoManual}</button>
                </div>
                {locMode==="gps"&&gpsLocation&&<input className="inline-input" value={gpsLocation} onChange={e=>setGpsLocation(e.target.value)}/>}
                {locMode==="gps"&&!gpsLocation&&<div style={{fontSize:12,color:COLORS.muted}}>{t.recoGPSLoading}</div>}
                {locMode==="free"&&<RecoPlaceSearch initialValue={freeLocation} onPlaceSelected={(p)=>{if(p){setFreeLocation(p.address);if(p.lat){const c={lat:p.lat,lng:p.lng};setRecoCoords(c);recoCoordsRef.current=c;setHeartsKey(k=>k+1);}  }else{setFreeLocation("");setRecoCoords(null);}}}/>}
                <div className="field"><label>{t.recoRadius}</label><DistanceSlider value={distance} onChange={v=>{setDistance(v);setHeartsKey(k=>k+1);}}/></div>
                <div>
                  <div style={{fontSize:10,textTransform:"uppercase",letterSpacing:"0.15em",color:COLORS.muted,marginBottom:6}}>Type</div>
                  <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>{TYPES.map(tp=><button key={tp} className={`reco-type-btn ${recoType===tp?"active":""}`} onClick={()=>{setRecoType(tp);setHeartsKey(k=>k+1);}}>{TYPE_ICONS[tp]} {(TYPES_I18N[lang]||TYPES_I18N.en)[tp]||tp}</button>)}</div>
                </div>
                <div className="filters-row"><span className="filter-label">{t.filterPrice}</span>{[[ALL,t.filterAll],...PRICES.map(p=>[p,p])].map(([val,label])=><button key={val} className={`filter-btn ${recoPrice===val?"active":""}`} onClick={()=>{setRecoPrice(val);setHeartsKey(k=>k+1);}}>{label}</button>)}</div>
                <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                  <button className={`filter-btn ${recoKids?"active":""}`} onClick={()=>{setRecoKids(k=>!k);setHeartsKey(k=>k+1);}}>👶 Kids friendly</button>
                  {friends.length>0&&(<>
                    <button className={`filter-btn ${recoFriendFilter==="all"?"active":""}`} onClick={()=>{setRecoFriendFilter("all");setHeartsKey(k=>k+1);}}>👤+👥</button>
                    <button className={`filter-btn ${recoFriendFilter==="mine"?"active":""}`} onClick={()=>{setRecoFriendFilter("mine");setHeartsKey(k=>k+1);}}>👤 {t.filterMine||"Mine"}</button>
                    <button className={`filter-btn ${recoFriendFilter==="friends"?"active":""}`} onClick={()=>{setRecoFriendFilter("friends");setHeartsKey(k=>k+1);}}>👥 {t.filterFriendsOnly||"Friends"}</button>
                  </>)}
                </div>
                <div className="field" style={{marginTop:4}}>
                  <label style={{fontSize:10,textTransform:"uppercase",letterSpacing:"0.15em",color:"#8a8070",fontWeight:500}}>{t.nbRecosLabel||"AI Recommendation Number"}</label>
                  <div style={{display:"flex",gap:6,marginTop:6}}>
                    {[["5","5"],["10","10"],["auto","Auto"]].map(([val,label])=>(
                      <button key={val} onClick={()=>setPrefs(p=>({...p,nbrecos:val}))}
                        style={{flex:1,padding:"8px 4px",background:(prefs.nbrecos||"10")===val?"#c9a84c22":"#1a1814",
                          border:`1px solid ${(prefs.nbrecos||"10")===val?"#c9a84c":"#2e2b25"}`,
                          borderRadius:8,color:(prefs.nbrecos||"10")===val?"#c9a84c":"#8a8070",
                          cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontSize:11,fontWeight:600}}>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
                <div style={{display:"flex",gap:8}}>
                  <button className="reco-btn" style={{flex:1}} onClick={loadRecos} disabled={heartLoading||aiLoading||geocoding||!locationLabel||(locMode==="gps"&&!gpsReady)}>
                    {geocoding?t.recoLocating:heartLoading||aiLoading?t.recoSearching:t.recoFind}
                  </button>
                  {(heartLoading||aiLoading||geocoding)&&(
                    <button onClick={cancelSearch} style={{padding:"13px 16px",background:"#3a1a1a",border:"1px solid #8b3a3a",borderRadius:10,color:"#e06060",cursor:"pointer",fontSize:13,fontWeight:600,fontFamily:"'DM Sans',sans-serif",whiteSpace:"nowrap"}}>
                      ✕ {t.cancel||"Cancel"}
                    </button>
                  )}
                </div>
              </div>

              {(heartMemories.length>0||aiRecos.length>0)&&(
                <GoogleMap recommendations={aiRecos} userCoords={recoCoords} heartMemories={heartMemories}/>
              )}

              {(heartMemories.length>0||nearbyPlaces.length>0)&&(
                <div className="reco-block">
                  <div className="reco-block-title">{t.recoHearts}<span>{t.recoHeartsNear}</span></div>
                  {heartMemories.length>0&&(
                    <div>
                      <div style={{fontSize:11,color:COLORS.muted,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:8}}>{t.recoInCarnet}</div>
                      <div className="memory-list">{heartMemories.map(m=><MemoryCard key={`heart-${m.id}`} m={m} isMine={m.isMine} lang={lang} onEdit={setEditMemory} onDelete={deleteMemory} onDeleteRequest={(id,name)=>setDeleteConfirm({id,name})} onViewFriend={(name,fMem)=>{ const mem=fMem||friendMemories.find(x=>x.friendName===name&&x.name===m.name); if(mem)setFriendMemoryModal({memory:mem,friendName:name}); }}
                  onSaveFriend={(fMem)=>{const dup=memories.find(m=>m.name.toLowerCase()===fMem.name.toLowerCase());if(dup){setDuplicateAlert({existing:dup,newForm:fMem});}else{handleAdd(fMem);}}}/>)}</div>
                    </div>
                  )}
                  {nearbyPlaces.length>0&&(
                    <div style={{marginTop:heartMemories.length>0?16:0}}>
                      <div style={{fontSize:11,color:COLORS.muted,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:8}}>{t.recoNearby}</div>
                      <div style={{display:"flex",flexDirection:"column",gap:10}}>
                        {nearbyPlaces.map((p,i)=>(
                          <div key={i} className="nearby-card">
                            <div className="nearby-name">{TYPE_ICONS[recoType]} {p.name}</div>
                            <div className="nearby-meta">
                              {p.rating&&<span className="badge stars">★ {p.rating.toFixed(1)}</span>}
                              {p.price&&<span className="badge price">{p.price}</span>}
                              {p.openNow!==undefined&&p.openNow!==null&&<OpeningHoursWidget openNow={p.openNow} hours={p.openingHours} lang={lang}/>}
                            </div>
                            {p.address&&<div className="nearby-address">📍 {p.address}</div>}
                            <div style={{display:"flex",gap:10,alignItems:"center",marginTop:4}}>
                              <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.name+(p.address?", "+p.address:"")+(p.address?"":(" "+(p.city||"")+" "+(p.country||""))))}`} target="_blank" rel="noopener noreferrer" className="maps-link">{t.recoMapsLink}</a>
                              <button className="add-to-carnet-btn" style={{margin:0}} onClick={()=>addRecoToCarnet({name:p.name,type:recoType,price:p.price||"€€"})}>{t.recoAddFav}</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {(aiLoading||aiRecos.length>0)&&(
                <div className="reco-block">
                  <div className="reco-block-title">{t.recoAI}<span>{t.recoAISub}</span></div>
                  {aiLoading&&<div className="thinking"><div className="dot"/><div className="dot"/><div className="dot"/></div>}
                  {aiRecos.length>0&&!aiLoading&&(
                    <>
                      <div className="ai-reco-list">
                        {aiRecos.slice(0,10).map((reco,i)=>(
                          <div key={i} className="ai-reco-card">
                            <div className="ai-reco-header">
                              <div className="ai-reco-top">
                                <div className="ai-reco-name">{reco.name}</div>
                                <div className="ai-reco-rank">#{i+1}</div>
                              </div>
                              <div className="ai-reco-meta">
                                {reco.cuisine&&<span className="badge">{reco.cuisine}</span>}
                                {reco.googleRating&&<span className="badge stars" style={{padding:"2px 6px"}}><StarRating rating={reco.googleRating} size={11}/></span>}
                                <span className="badge price">{reco.price}</span>
                              </div>
                              {reco.matchScore&&(
                                <div className="match-score">
                                  <div className="match-bar-wrap"><div className="match-bar" style={{width:`${reco.matchScore}%`}}/></div>
                                  <div className="match-score-label">{reco.matchScore}% match</div>
                                </div>
                              )}
                              {reco.matchReasons?.length>0&&(
                                <div className="match-reasons">{reco.matchReasons.map((r,j)=><span key={j} className="match-reason">✓ {r}</span>)}</div>
                              )}
                              {reco.address&&(
                                <div className="ai-reco-address">
                                  📍 {reco.address}
                                  <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(reco.name+(reco.address?", "+reco.address:""))}`} target="_blank" rel="noopener noreferrer" style={{color:COLORS.accent,fontSize:11,marginLeft:8}}>{t.recoMapsLink}</a>
                                </div>
                              )}
                              {reco.openNow!==undefined&&reco.openNow!==null&&<OpeningHoursWidget openNow={reco.openNow} hours={reco.openingHours} lang={lang}/>}
                              {reco.why&&<div className="ai-reco-why">« {reco.why} »</div>}
                              {reco.tip&&<div className="ai-reco-tip">💡 {reco.tip}</div>}
                              {reco.warning&&<div className="ai-reco-warning">⚠️ {reco.warning}</div>}
                              <button className="add-to-carnet-btn" onClick={()=>addRecoToCarnet(reco)}>{t.recoAddFav}</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {editMemory&&(
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-title">{t.editTitle} {editMemory.name}</div>
            <MemoryForm initial={editMemory} onSave={handleUpdate} onCancel={()=>setEditMemory(null)} isEdit={true} t={t} lang={lang}/>
          </div>
        </div>
      )}

      {recoToAdd&&(
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-title">+ {recoToAdd.name}</div>
            <MemoryForm initial={recoToAdd} lang={lang} onSave={async(form)=>{
              const {isMine:_a,friendName:_b,distanceKm:_c,_lat,_lng,profiles:_d,friendsData:_e,friendsWhoHave:_f,...cleanF}=form;
const entry={...cleanF,id:Date.now(),ts:Date.now(),user_id:userId};
              const {error}=await supabase.from('memories').insert(entry);
              if(!error){setMemories(prev=>[entry,...prev]);showToast(t.toastAdded);}
              setRecoToAdd(null);
            }} onCancel={()=>setRecoToAdd(null)} isEdit={true} t={t}/>
          </div>
        </div>
      )}

      {closedFavoritesAlert.length>0&&(
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-title">⚠️ Établissements fermés</div>
            <p style={{fontSize:13,color:COLORS.muted,marginBottom:12}}>Ces établissements semblent définitivement fermés. Voulez-vous les supprimer de vos Favoris ?</p>
            {closedFavoritesAlert.map(f=>(
              <div key={f.id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"8px 0",borderBottom:"1px solid #2e2b2533"}}>
                <span style={{fontSize:13,color:COLORS.text}}>🔴 {f.name}</span>
              </div>
            ))}
            <div style={{display:"flex",gap:8,marginTop:16}}>
              <button className="modal-btn secondary" style={{flex:1}} onClick={()=>setClosedFavoritesAlert([])}>Garder</button>
              <button className="modal-btn primary" style={{flex:1}} onClick={async()=>{
                for (const f of closedFavoritesAlert) {
                  await supabase.from('memories').delete().eq('id',f.id).eq('user_id',userId);
                  setMemories(prev=>prev.filter(m=>m.id!==f.id));
                  // Add to community closed list
                  if (f.placeId) await supabase.from('closed_places').upsert({place_id:f.placeId,name:f.name},{onConflict:'place_id'});
                }
                setClosedFavoritesAlert([]);
                showToast("✓ Favoris supprimés");
              }}>Supprimer</button>
            </div>
          </div>
        </div>
      )}
      {friendMemoryModal&&(
        <div className="modal-overlay" onClick={e=>{if(e.target===e.currentTarget)setFriendMemoryModal(null);}}>
          <div className="modal" style={{maxHeight:"90vh",overflowY:"auto"}}>
            <div className="modal-title">👤 {friendMemoryModal.friendName}</div>
            <MemoryCard m={friendMemoryModal.memory} isMine={false} lang={lang} onEdit={()=>{}} onDelete={()=>{}} onDeleteRequest={()=>{}}/>
            <div style={{marginTop:16,borderTop:"1px solid #2e2b25",paddingTop:12}}>
              <div style={{fontSize:11,color:"#8a8070",marginBottom:10,textAlign:"center",textTransform:"uppercase",letterSpacing:"0.1em"}}>Modifier avant de sauvegarder</div>
              <MemoryForm
                key={"friend-"+friendMemoryModal.memory.id}
                initial={friendMemoryModal.memory}
                isEdit={true}
                t={t}
                lang={lang}
                onSave={(form)=>{
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
