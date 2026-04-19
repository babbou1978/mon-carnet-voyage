import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "./supabase.js";
import Auth from "./Auth.jsx";

const TYPES = ["Restaurant", "Hôtel", "Bar / Café", "Destination", "Activité"];
const PRICES = ["€", "€€", "€€€", "€€€€"];
const TYPE_ICONS = { "Restaurant": "🍽️", "Hôtel": "🏨", "Bar / Café": "☕", "Destination": "🗺️", "Activité": "🎯" };
const GOOGLE_TYPE_MAP = { restaurant: "Restaurant", cafe: "Bar / Café", bar: "Bar / Café", lodging: "Hôtel", hotel: "Hôtel", tourist_attraction: "Destination", museum: "Activité", park: "Activité", amusement_park: "Activité", night_club: "Bar / Café", bakery: "Restaurant", food: "Restaurant" };
const PRICE_MAP = { PRICE_LEVEL_FREE: "€", PRICE_LEVEL_INEXPENSIVE: "€", PRICE_LEVEL_MODERATE: "€€", PRICE_LEVEL_EXPENSIVE: "€€€", PRICE_LEVEL_VERY_EXPENSIVE: "€€€€" };

const LIKES_BY_TYPE = {
  "Restaurant": ["Ambiance chaleureuse", "Cuisine locale", "Terrasse agréable", "Service attentionné", "Cadre original", "Cave à vins", "Produits frais", "Vue exceptionnelle", "Rapport qualité/prix", "Kids friendly"],
  "Bar / Café": ["Ambiance chaleureuse", "Terrasse agréable", "Bonne sélection", "Service attentionné", "Cadre original", "Musique agréable", "Vue exceptionnelle", "Rapport qualité/prix", "Kids friendly"],
  "Hôtel": ["Chambre spacieuse", "Petit-déjeuner inclus", "Piscine", "Spa", "Vue exceptionnelle", "Personnel attentionné", "Rapport qualité/prix", "Kids friendly", "Calme", "Emplacement idéal"],
  "Destination": ["Paysages exceptionnels", "Culture locale", "Peu touristique", "Gastronomie", "Architecture", "Nature", "Art", "Vie nocturne", "Kids friendly", "Accessibilité"],
  "Activité": ["Expérience unique", "Bien organisé", "Guide excellent", "Rapport qualité/prix", "Kids friendly", "Vue exceptionnelle", "Originalité", "Accessibilité"],
};
const DISLIKES_BY_TYPE = {
  "Restaurant": ["Trop bruyant", "Service lent", "Portions trop petites", "Trop touristique", "Prix excessif", "Trop bondé", "Service froid", "Mauvaise localisation"],
  "Bar / Café": ["Trop bruyant", "Service lent", "Trop bondé", "Prix excessif", "Service froid", "Mauvaise ambiance"],
  "Hôtel": ["Chambre trop petite", "Bruit", "Wi-Fi mauvais", "Ménage insuffisant", "Check-in tardif", "Prix excessif", "Emplacement mauvais"],
  "Destination": ["Trop touristique", "Foules", "Manque de sécurité", "Peu de transports", "Trop cher", "Peu d'activités"],
  "Activité": ["Trop touristique", "Mal organisé", "Prix excessif", "Trop long", "Guide décevant", "Trop de monde"],
};
const PREFS_LOVES_OPTIONS = ["Cuisine authentique", "Endroits intimistes", "Découvertes locales", "Vins naturels", "Petits producteurs", "Terrasses", "Architecture", "Nature", "Art et culture", "Gastronomie", "Kids friendly"];
const PREFS_HATES_OPTIONS = ["Chaînes de restaurants", "Endroits bruyants", "Cuisine épicée", "Menus touristiques", "Grandes surfaces", "Foules", "Cuisine industrielle"];

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
  .header { padding: 24px 24px 14px; border-bottom: 1px solid ${COLORS.border}; position: sticky; top: 0; background: ${COLORS.bg}; z-index: 10; }
  .header-top { display: flex; justify-content: space-between; align-items: flex-start; }
  .header-title { font-family: 'Cormorant Garamond', serif; font-size: 24px; font-weight: 300; letter-spacing: 0.05em; line-height: 1.1; }
  .header-title span { color: ${COLORS.accent}; font-style: italic; }
  .header-sub { font-size: 11px; color: ${COLORS.muted}; letter-spacing: 0.1em; text-transform: uppercase; margin-top: 3px; }
  .logout-btn { background: none; border: 1px solid ${COLORS.border}; color: ${COLORS.muted}; border-radius: 6px; padding: 5px 10px; font-size: 11px; cursor: pointer; font-family: 'DM Sans', sans-serif; transition: all 0.2s; white-space: nowrap; }
  .logout-btn:hover { border-color: #e06060; color: #e06060; }
  .tabs { display: flex; margin-top: 12px; background: ${COLORS.card}; border-radius: 8px; padding: 3px; border: 1px solid ${COLORS.border}; }
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
  .price-btn { flex: 1; padding: 10px 4px; background: ${COLORS.card}; border: 1px solid ${COLORS.border}; border-radius: 8px; color: ${COLORS.muted}; font-size: 13px; cursor: pointer; transition: all 0.2s; font-family: 'DM Sans', sans-serif; font-weight: 500; }
  .price-btn.selected { background: ${COLORS.accent}22; border-color: ${COLORS.accent}; color: ${COLORS.accent}; }
  .star-row { display: flex; gap: 8px; align-items: center; }
  .star { font-size: 24px; cursor: pointer; transition: transform 0.15s, opacity 0.15s; opacity: 0.25; filter: grayscale(1); user-select: none; }
  .star.active { opacity: 1; filter: none; transform: scale(1.1); }
  .star:hover { opacity: 0.75; filter: none; }
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
  .memory-card:hover { border-color: ${COLORS.accent}44; }
  .memory-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 8px; margin-bottom: 6px; }
  .memory-name { font-family: 'Cormorant Garamond', serif; font-size: 19px; font-weight: 400; line-height: 1.2; }
  .memory-meta { display: flex; gap: 5px; align-items: center; flex-shrink: 0; flex-wrap: wrap; justify-content: flex-end; }
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
  .friend-search-input { flex: 1; background: ${COLORS.card}; border: 1px solid ${COLORS.border}; border-radius: 8px; color: ${COLORS.text}; font-family: 'DM Sans', sans-serif; font-size: 14px; padding: 11px 14px; outline: none; transition: border-color 0.2s; }
  .friend-search-input:focus { border-color: ${COLORS.accent}; }
  .friend-search-btn { padding: 11px 16px; background: ${COLORS.accent}; border: none; border-radius: 8px; color: #0f0e0c; font-family: 'DM Sans', sans-serif; font-size: 12px; font-weight: 600; cursor: pointer; white-space: nowrap; }
  .friend-card { background: ${COLORS.card}; border: 1px solid ${COLORS.border}; border-radius: 10px; padding: 14px 16px; display: flex; align-items: center; justify-content: space-between; gap: 12px; }
  .friend-info { display: flex; flex-direction: column; gap: 2px; }
  .friend-name { font-size: 14px; color: ${COLORS.text}; font-weight: 500; }
  .friend-email { font-size: 11px; color: ${COLORS.muted}; }
  .friend-action-btn { padding: 6px 12px; border-radius: 6px; font-family: 'DM Sans', sans-serif; font-size: 11px; font-weight: 600; cursor: pointer; transition: all 0.2s; border: none; }
  .friend-action-btn.add { background: ${COLORS.accent}; color: #0f0e0c; }
  .friend-action-btn.accept { background: #2a4a2e; color: #7abf8a; }
  .friend-action-btn.decline { background: ${COLORS.dislikeBg}; color: #a06060; margin-left: 4px; }
  .friend-action-btn.pending { background: ${COLORS.tag}; color: ${COLORS.muted}; cursor: default; }
  .friends-title { font-family: 'Cormorant Garamond', serif; font-size: 17px; font-style: italic; color: ${COLORS.accent}; }
  .empty-friends { text-align: center; padding: 30px; color: ${COLORS.muted}; font-size: 13px; }

  /* RECO */
  .reco-section { display: flex; flex-direction: column; gap: 20px; }
  .reco-block { display: flex; flex-direction: column; gap: 14px; }
  .reco-block-title { font-family: 'Cormorant Garamond', serif; font-size: 20px; font-style: italic; color: ${COLORS.accent}; padding-bottom: 8px; border-bottom: 1px solid ${COLORS.border}; }
  .reco-block-title span { font-size: 12px; font-style: normal; color: ${COLORS.muted}; font-family: 'DM Sans', sans-serif; margin-left: 8px; }
  .location-row { display: flex; gap: 8px; }
  .loc-btn { padding: 10px 14px; background: ${COLORS.card}; border: 1px solid ${COLORS.border}; border-radius: 8px; color: ${COLORS.muted}; font-size: 12px; cursor: pointer; transition: all 0.2s; white-space: nowrap; font-family: 'DM Sans', sans-serif; }
  .loc-btn.active { border-color: ${COLORS.accent}; color: ${COLORS.accent}; }
  .reco-type-row { display: flex; gap: 6px; flex-wrap: wrap; }
  .reco-type-btn { padding: 7px 11px; background: ${COLORS.card}; border: 1px solid ${COLORS.border}; border-radius: 20px; color: ${COLORS.muted}; font-size: 12px; cursor: pointer; transition: all 0.2s; font-family: 'DM Sans', sans-serif; }
  .reco-type-btn.active { background: ${COLORS.accent}22; border-color: ${COLORS.accent}; color: ${COLORS.accent}; }
  .reco-btn { background: ${COLORS.card}; border: 1px solid ${COLORS.accent}; color: ${COLORS.accent}; border-radius: 10px; padding: 13px; font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; cursor: pointer; transition: all 0.2s; }
  .reco-btn:hover { background: ${COLORS.accent}22; }
  .reco-btn:disabled { opacity: 0.4; cursor: not-allowed; }

  /* AI Reco Cards */
  .ai-reco-list { display: flex; flex-direction: column; gap: 16px; }
  .ai-reco-card { background: ${COLORS.card}; border: 1px solid ${COLORS.accent}33; border-radius: 12px; overflow: hidden; }
  .ai-reco-header { padding: 16px 16px 10px; }
  .ai-reco-name { font-family: 'Cormorant Garamond', serif; font-size: 20px; font-weight: 400; color: ${COLORS.text}; margin-bottom: 6px; }
  .ai-reco-meta { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 8px; }
  .ai-reco-address { font-size: 12px; color: ${COLORS.muted}; margin-bottom: 8px; display: flex; align-items: center; gap: 4px; }
  .ai-reco-why { font-size: 13px; color: #b8ad98; line-height: 1.5; font-style: italic; margin-bottom: 6px; }
  .ai-reco-tip { font-size: 12px; color: ${COLORS.accent}; line-height: 1.4; }
  .ai-reco-warning { font-size: 12px; color: #a06060; line-height: 1.4; margin-top: 4px; }
  .maps-btn { display: flex; align-items: center; gap: 6px; font-size: 11px; color: ${COLORS.accent}; text-decoration: none; margin-top: 6px; }
  .map-container { height: 180px; width: 100%; border-top: 1px solid ${COLORS.border}; }

  /* Global map */
  .global-map-container { height: 260px; width: 100%; border-radius: 12px; overflow: hidden; border: 1px solid ${COLORS.border}; }

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
  .inline-input { background: ${COLORS.card}; border: 1px solid ${COLORS.border}; border-radius: 8px; color: ${COLORS.text}; font-family: 'DM Sans', sans-serif; font-size: 14px; padding: 10px 14px; outline: none; width: 100%; margin-top: 8px; transition: border-color 0.2s; }
  .inline-input:focus { border-color: ${COLORS.accent}; }
  .loading-overlay { text-align: center; padding: 40px 20px; color: ${COLORS.muted}; font-size: 13px; }
  .add-to-carnet-btn { display: flex; align-items: center; gap: 5px; background: none; border: 1px solid ${COLORS.accent}44; color: ${COLORS.accent}; border-radius: 6px; padding: 4px 10px; font-size: 11px; cursor: pointer; font-family: 'DM Sans', sans-serif; margin-top: 8px; transition: all 0.2s; }
  .add-to-carnet-btn:hover { background: ${COLORS.accent}18; border-color: ${COLORS.accent}; }
`;

function formatDate(ts) { return new Date(ts).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" }); }
function starsLabel(n) { return "★".repeat(n) + "☆".repeat(5 - n); }

function StarPicker({ value, onChange }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="star-row">
      {[1,2,3,4,5].map(n => (
        <span key={n} className={`star ${(hover || value) >= n ? "active" : ""}`}
          onClick={() => onChange(n === value ? 0 : n)}
          onMouseEnter={() => setHover(n)} onMouseLeave={() => setHover(0)}>★</span>
      ))}
      {value > 0 && <span style={{ fontSize: 12, color: COLORS.muted }}>{value}/5</span>}
    </div>
  );
}

function TagPicker({ options, selected, onChange, mode = "like" }) {
  const toggle = (opt) => {
    const arr = selected || [];
    onChange(arr.includes(opt) ? arr.filter(x => x !== opt) : [...arr, opt]);
  };
  return (
    <div className="tags-row">
      {options.map(opt => (
        <button key={opt} className={`tag-pill ${(selected||[]).includes(opt) ? (mode === "like" ? "selected-like" : "selected-dislike") : ""}`}
          onClick={() => toggle(opt)}>{opt}</button>
      ))}
    </div>
  );
}

function KidsToggle({ value, onChange }) {
  return (
    <div className={`kids-toggle ${value ? "on" : ""}`} onClick={() => onChange(!value)}>
      <span style={{ fontSize: 16 }}>👶</span>
      <span className="kids-toggle-label">Kids friendly</span>
      <div className="toggle-switch"><div className="toggle-knob" /></div>
    </div>
  );
}

function PlaceSearch({ onPlaceSelected, initialValue = "" }) {
  const [query, setQuery] = useState(initialValue);
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
      const res = await fetch("/api/places", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "autocomplete", input: val }) });
      const data = await res.json();
      setSuggestions(data.suggestions || []);
      setShowDropdown(true);
    } catch {}
    setLoading(false);
  }, []);

  const handleInput = (e) => {
    const val = e.target.value;
    setQuery(val); setSelectedPlace(null);
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
      const components = details.addressComponents || [];
      const city = components.find(c => c.types?.includes("locality"))?.longText || components.find(c => c.types?.includes("administrative_area_level_1"))?.longText || "";
      const country = components.find(c => c.types?.includes("country"))?.longText || secondaryText.split(",").pop()?.trim() || "";
      const googleTypes = details.types || [];
      let type = "Restaurant";
      for (const gt of googleTypes) { if (GOOGLE_TYPE_MAP[gt]) { type = GOOGLE_TYPE_MAP[gt]; break; } }
      const price = PRICE_MAP[details.priceLevel] || "€€";
      const place = { name: mainText, city, country, type, price };
      setSelectedPlace(place); onPlaceSelected(place);
    } catch {
      const parts = secondaryText.split(",");
      onPlaceSelected({ name: mainText, city: parts[0]?.trim() || "", country: parts[parts.length-1]?.trim() || "", type: "Restaurant", price: "€€" });
    }
  };

  const clear = () => { setQuery(""); setSelectedPlace(null); setSuggestions([]); onPlaceSelected(null); };

  return (
    <div className="autocomplete-wrapper" ref={wrapperRef}>
      <div style={{ position: "relative" }}>
        <input placeholder="Ex: Le Comptoir du Relais, Rome..." value={query} onChange={handleInput}
          onFocus={() => suggestions.length > 0 && setShowDropdown(true)}
          style={{ background: COLORS.card, border: `1px solid ${selectedPlace ? COLORS.accent : COLORS.border}`, borderRadius: 8, color: COLORS.text, fontFamily: "'DM Sans', sans-serif", fontSize: 14, padding: "11px 14px", outline: "none", width: "100%", transition: "border-color 0.2s" }} />
        {selectedPlace && <button onClick={clear} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: COLORS.muted, cursor: "pointer", fontSize: 16 }}>✕</button>}
      </div>
      {selectedPlace && <div className="place-badge">✓ {selectedPlace.city}{selectedPlace.country ? `, ${selectedPlace.country}` : ""} • {selectedPlace.type} • {selectedPlace.price}</div>}
      {showDropdown && (loading || suggestions.length > 0) && (
        <div className="autocomplete-dropdown">
          {loading && <div className="autocomplete-loading">Recherche...</div>}
          {!loading && suggestions.map((s, i) => {
            const main = s.placePrediction?.structuredFormat?.mainText?.text || "";
            const secondary = s.placePrediction?.structuredFormat?.secondaryText?.text || "";
            return (
              <div key={i} className="autocomplete-item" onMouseDown={() => selectPlace(s)}>
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

// Google Map component
function GoogleMap({ recommendations }) {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const apiKey = "AIzaSyC_placeholder"; // sera remplacé par variable d'env

  useEffect(() => {
    if (!recommendations?.length || !mapRef.current) return;

    const loadMap = () => {
      if (!window.google) return;
      const bounds = new window.google.maps.LatLngBounds();
      const map = new window.google.maps.Map(mapRef.current, {
        zoom: 13,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        styles: [
          { elementType: "geometry", stylers: [{ color: "#1a1814" }] },
          { elementType: "labels.text.fill", stylers: [{ color: "#f0ead8" }] },
          { elementType: "labels.text.stroke", stylers: [{ color: "#0f0e0c" }] },
          { featureType: "road", elementType: "geometry", stylers: [{ color: "#2e2b25" }] },
          { featureType: "water", elementType: "geometry", stylers: [{ color: "#0f0e0c" }] },
          { featureType: "poi", stylers: [{ visibility: "off" }] },
        ],
      });
      mapInstance.current = map;

      const geocoder = new window.google.maps.Geocoder();
      let loaded = 0;

      recommendations.forEach((reco, i) => {
        geocoder.geocode({ address: reco.address }, (results, status) => {
          if (status === "OK" && results[0]) {
            const pos = results[0].geometry.location;
            bounds.extend(pos);
            new window.google.maps.Marker({
              position: pos,
              map,
              title: reco.name,
              label: { text: String(i + 1), color: "#0f0e0c", fontWeight: "bold", fontSize: "12px" },
              icon: {
                path: window.google.maps.SymbolPath.CIRCLE,
                fillColor: "#c9a84c",
                fillOpacity: 1,
                strokeColor: "#0f0e0c",
                strokeWeight: 2,
                scale: 16,
              },
            });
            loaded++;
            if (loaded === recommendations.length) {
              map.fitBounds(bounds);
            }
          }
        });
      });
    };

    if (window.google) {
      loadMap();
    } else {
      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_MAPS_KEY || ""}&callback=initGoogleMap`;
      script.async = true;
      window.initGoogleMap = loadMap;
      document.head.appendChild(script);
    }
  }, [recommendations]);

  return <div ref={mapRef} className="global-map-container" />;
}

const DEFAULT_FORM = { name: "", type: "Restaurant", price: "€€", city: "", country: "", rating: 0, likeTags: [], dislikeTags: [], why: "", dislike: "", kidsf: false };
const DEFAULT_PREFS = { loves: "", hates: "", budget: "", notes: "", lovesTags: [], hatesTags: [], firstName: "", lastName: "" };

function MemoryForm({ initial, onSave, onCancel, isEdit = false }) {
  const [form, setForm] = useState(initial || DEFAULT_FORM);
  const likesOptions = LIKES_BY_TYPE[form.type] || LIKES_BY_TYPE["Restaurant"];
  const dislikesOptions = DISLIKES_BY_TYPE[form.type] || DISLIKES_BY_TYPE["Restaurant"];

  const handleTypeChange = (newType) => setForm(f => ({ ...f, type: newType, likeTags: [], dislikeTags: [] }));
  const handlePlaceSelected = (place) => {
    if (!place) { setForm(f => ({ ...f, name: "", city: "", country: "", type: "Restaurant", price: "€€" })); return; }
    setForm(f => ({ ...f, name: place.name, city: place.city, country: place.country, type: place.type, price: place.price, likeTags: [], dislikeTags: [] }));
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {!isEdit ? (
        <div className="field"><label>Nom du lieu</label><PlaceSearch onPlaceSelected={handlePlaceSelected} /></div>
      ) : (
        <div className="field"><label>Nom du lieu</label><input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
      )}

      {form.name && <>
        <div className="row-2">
          <div className="field">
            <label>Type</label>
            <select value={form.type} onChange={e => handleTypeChange(e.target.value)}>
              {TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Prix</label>
            <div className="price-selector">
              {PRICES.map(p => <button key={p} className={`price-btn ${form.price===p?"selected":""}`} onClick={() => setForm(f => ({ ...f, price: p }))}>{p}</button>)}
            </div>
          </div>
        </div>
        <div className="row-2">
          <div className="field"><label>Ville</label><input placeholder="Paris" value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} /></div>
          <div className="field"><label>Pays</label><input placeholder="France" value={form.country} onChange={e => setForm(f => ({ ...f, country: e.target.value }))} /></div>
        </div>
        <div className="field"><label>Note globale</label><StarPicker value={form.rating} onChange={v => setForm(f => ({ ...f, rating: v }))} /></div>
        <KidsToggle value={form.kidsf} onChange={v => setForm(f => ({ ...f, kidsf: v }))} />
        <div className="section-divider"><span>Ce que j'ai aimé</span></div>
        <div className="field"><label>Sélectionner</label><TagPicker options={likesOptions} selected={form.likeTags} onChange={v => setForm(f => ({ ...f, likeTags: v }))} mode="like" /></div>
        <div className="field"><label>Préciser</label><textarea placeholder="Autre chose..." value={form.why} onChange={e => setForm(f => ({ ...f, why: e.target.value }))} /></div>
        <div className="section-divider"><span>Ce que j'ai moins aimé</span></div>
        <div className="field"><label style={{ color: "#a06060" }}>Sélectionner</label><TagPicker options={dislikesOptions} selected={form.dislikeTags} onChange={v => setForm(f => ({ ...f, dislikeTags: v }))} mode="dislike" /></div>
        <div className="field"><label style={{ color: "#a06060" }}>Préciser</label><textarea placeholder="Autre chose..." value={form.dislike} onChange={e => setForm(f => ({ ...f, dislike: e.target.value }))} style={{ background: COLORS.dislikeBg, borderColor: COLORS.dislike+"44", color: "#d4a0a0" }} /></div>
        <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
          {onCancel && <button className="modal-btn secondary" onClick={onCancel}>Annuler</button>}
          <button className="save-btn" style={{ flex: 1, margin: 0 }} onClick={() => onSave(form)} disabled={!form.name.trim()}>
            {isEdit ? "Sauvegarder" : "Enregistrer ce souvenir"}
          </button>
        </div>
      </>}
    </div>
  );
}

function MemoryCard({ m, onEdit, onDelete, isMine }) {
  return (
    <div className={`memory-card ${!isMine ? "friend-card" : ""}`}>
      <div className="memory-top">
        <div className="memory-name">{TYPE_ICONS[m.type]} {m.name}</div>
        <div className="memory-meta">
          {m.rating > 0 && <span className="badge stars">{starsLabel(m.rating)}</span>}
          {m.kidsf && <span className="badge kids">👶</span>}
          <span className="badge price">{m.price}</span>
          {!isMine && m.friendName && <span className="badge friend">{m.friendName}</span>}
        </div>
      </div>
      {(m.city||m.country) && <div className="memory-location">📍 {[m.city,m.country].filter(Boolean).join(", ")}</div>}
      {(m.likeTags||[]).length > 0 && <div className="memory-tags">{m.likeTags.map(t => <span key={t} className="memory-tag">👍 {t}</span>)}</div>}
      {m.why && <div className="memory-why">« {m.why} »</div>}
      {(m.dislikeTags||[]).length > 0 && <div className="memory-tags">{m.dislikeTags.map(t => <span key={t} className="memory-tag bad">👎 {t}</span>)}</div>}
      {m.dislike && <div className="memory-dislike">« {m.dislike} »</div>}
      <div className="memory-footer">
        <span className="memory-date">{formatDate(m.ts)}</span>
        {isMine && <div className="memory-actions">
          <button className="edit-btn" onClick={() => onEdit(m)}>✏️ Éditer</button>
          <button className="del-btn" onClick={() => onDelete(m.id)}>✕</button>
        </div>}
      </div>
    </div>
  );
}

export default function TravelAgent() {
  const [session, setSession] = useState(undefined);
  const [tab, setTab] = useState("add");
  const [memories, setMemories] = useState([]);
  const [friendMemories, setFriendMemories] = useState([]);
  const [friends, setFriends] = useState([]);
  const [pendingIn, setPendingIn] = useState([]);
  const [pendingOut, setPendingOut] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [profile, setProfile] = useState(null);
  const [prefs, setPrefs] = useState(DEFAULT_PREFS);
  const [prefsSaved, setPrefsSaved] = useState(false);
  const [toast, setToast] = useState("");
  const [loading, setLoading] = useState(true);
  const [editMemory, setEditMemory] = useState(null);
  const [duplicateAlert, setDuplicateAlert] = useState(null);

  // Filtres mémoires
  const [filterType, setFilterType] = useState("Tous");
  const [filterPrice, setFilterPrice] = useState("Tous");
  const [filterRating, setFilterRating] = useState("Tous");
  const [filterKids, setFilterKids] = useState(false);
  const [showFriendMems, setShowFriendMems] = useState(true);

  // Reco
  const [recoType, setRecoType] = useState("Restaurant");
  const [recoPrice, setRecoPrice] = useState("Tous");
  const [recoKids, setRecoKids] = useState(false);
  const [locMode, setLocMode] = useState("free");
  const [freeLocation, setFreeLocation] = useState("");
  const [gpsLocation, setGpsLocation] = useState("");
  const [aiRecos, setAiRecos] = useState([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [addingFromReco, setAddingFromReco] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setSession(session));
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) return;
    const load = async () => {
      setLoading(true);
      const userId = session.user.id;
      const { data: prof } = await supabase.from('profiles').select('*').eq('user_id', userId).single();
      if (prof) setProfile(prof);
      const { data: mems } = await supabase.from('memories').select('*').eq('user_id', userId).order('ts', { ascending: false });
      if (mems) setMemories(mems);
      const { data: pref } = await supabase.from('preferences').select('*').eq('user_id', userId).single();
      if (pref) setPrefs({ ...DEFAULT_PREFS, ...pref });
      await loadFriends(userId);
      setLoading(false);
    };
    load();
  }, [session]);

  const loadFriends = async (userId) => {
    const { data: acceptedA } = await supabase.from('friendships').select('*, profiles!friendships_addressee_id_fkey(*)').eq('requester_id', userId).eq('status', 'accepted');
    const { data: acceptedB } = await supabase.from('friendships').select('*, profiles!friendships_requester_id_fkey(*)').eq('addressee_id', userId).eq('status', 'accepted');
    const friendList = [
      ...(acceptedA || []).map(f => ({ id: f.id, profile: f.profiles, friendUserId: f.addressee_id })),
      ...(acceptedB || []).map(f => ({ id: f.id, profile: f.profiles, friendUserId: f.requester_id })),
    ];
    setFriends(friendList);
    if (friendList.length > 0) {
      const friendIds = friendList.map(f => f.friendUserId);
      const { data: fMems } = await supabase.from('memories').select('*, profiles(first_name, last_name)').in('user_id', friendIds).order('ts', { ascending: false });
      if (fMems) setFriendMemories(fMems.map(m => ({ ...m, friendName: `${m.profiles?.first_name} ${m.profiles?.last_name}` })));
    }
    const { data: inReqs } = await supabase.from('friendships').select('*, profiles!friendships_requester_id_fkey(*)').eq('addressee_id', userId).eq('status', 'pending');
    setPendingIn(inReqs || []);
    const { data: outReqs } = await supabase.from('friendships').select('*, profiles!friendships_addressee_id_fkey(*)').eq('requester_id', userId).eq('status', 'pending');
    setPendingOut(outReqs || []);
  };

  if (session === undefined) return null;
  if (!session) return <Auth />;
  const userId = session.user.id;

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 2200); };

  const handleAdd = async (form) => {
    const duplicate = memories.find(m => m.name.toLowerCase() === form.name.toLowerCase());
    if (duplicate) { setDuplicateAlert({ existing: duplicate, newForm: form }); return; }
    const entry = { ...form, id: Date.now(), ts: Date.now(), user_id: userId };
    const { error } = await supabase.from('memories').insert(entry);
    if (!error) { setMemories(prev => [entry, ...prev]); showToast("✓ Souvenir enregistré !"); }
  };

  const handleUpdate = async (form) => {
    const { error } = await supabase.from('memories').update(form).eq('id', editMemory.id).eq('user_id', userId);
    if (!error) { setMemories(prev => prev.map(m => m.id === editMemory.id ? { ...m, ...form } : m)); setEditMemory(null); showToast("✓ Souvenir mis à jour !"); }
  };

  const handleDuplicateUpdate = async () => {
    const { newForm, existing } = duplicateAlert;
    const updated = { ...existing, ...newForm, id: existing.id, ts: existing.ts, user_id: userId };
    await supabase.from('memories').update(updated).eq('id', existing.id).eq('user_id', userId);
    setMemories(prev => prev.map(m => m.id === existing.id ? updated : m));
    setDuplicateAlert(null); showToast("✓ Souvenir mis à jour !");
  };

  const deleteMemory = async (id) => {
    await supabase.from('memories').delete().eq('id', id).eq('user_id', userId);
    setMemories(prev => prev.filter(m => m.id !== id));
  };

  const savePrefs = async () => {
    await supabase.from('preferences').upsert({ ...prefs, user_id: userId });
    await supabase.from('profiles').upsert({ user_id: userId, first_name: prefs.firstName, last_name: prefs.lastName, email: session.user.email });
    setPrefsSaved(true); setTimeout(() => setPrefsSaved(false), 2000);
  };

  const searchFriends = async () => {
    if (!searchQuery.trim()) return;
    const res = await fetch("/api/friends", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "search", userId, targetEmail: searchQuery }) });
    const data = await res.json();
    setSearchResults(data.users || []);
  };

  const sendFriendRequest = async (targetUserId) => {
    await supabase.from('friendships').insert({ requester_id: userId, addressee_id: targetUserId, status: 'pending' });
    showToast("✓ Demande envoyée !"); setSearchResults([]); setSearchQuery(""); await loadFriends(userId);
  };

  const acceptFriend = async (friendshipId) => {
    await supabase.from('friendships').update({ status: 'accepted' }).eq('id', friendshipId);
    showToast("✓ Ami ajouté !"); await loadFriends(userId);
  };

  const declineFriend = async (friendshipId) => {
    await supabase.from('friendships').delete().eq('id', friendshipId);
    await loadFriends(userId);
  };

  const logout = () => supabase.auth.signOut();

  const getGPS = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(pos => {
      const { latitude: lat, longitude: lng } = pos.coords;
      fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`)
        .then(r => r.json())
        .then(d => { const city = d.address?.city || d.address?.town || d.address?.village || ""; setGpsLocation(`${city}, ${d.address?.country || ""}`); })
        .catch(() => setGpsLocation(`${lat.toFixed(3)}, ${lng.toFixed(3)}`));
    });
  };

  // Filtres mémoires
  const allMemories = [
    ...memories.map(m => ({ ...m, isMine: true })),
    ...(showFriendMems ? friendMemories.map(m => ({ ...m, isMine: false })) : [])
  ];
  const filteredMemories = allMemories.filter(m => {
    if (filterType !== "Tous" && m.type !== filterType) return false;
    if (filterPrice !== "Tous" && m.price !== filterPrice) return false;
    if (filterRating !== "Tous" && m.rating < parseInt(filterRating)) return false;
    if (filterKids && !m.kidsf) return false;
    return true;
  });

  // Coups de cœur pour la section Reco (mémoires bien notées)
  const heartMemories = [...memories, ...friendMemories].filter(m => {
    if (m.rating < 4) return false;
    if (recoType !== "Tous" && m.type !== recoType) return false;
    if (recoPrice !== "Tous" && m.price !== recoPrice) return false;
    if (recoKids && !m.kidsf) return false;
    return true;
  }).sort((a, b) => b.rating - a.rating).slice(0, 10);

  const getAiRecos = async () => {
    setAiLoading(true); setAiRecos([]);
    const location = locMode === "gps" ? gpsLocation : freeLocation;
    const liked = memories.filter(m => m.rating >= 3)
      .map(m => `- ${m.name} (${m.type}, ${m.price}, ${m.rating}/5) à ${m.city}${m.country ? ", "+m.country : ""} — aimé: ${[...(m.likeTags||[]), m.why].filter(Boolean).join(", ")||"—"} — moins aimé: ${[...(m.dislikeTags||[]), m.dislike].filter(Boolean).join(", ")||"—"}${m.kidsf ? " — kids friendly" : ""}`)
      .join("\n");
    const disliked = memories.filter(m => m.rating > 0 && m.rating < 3)
      .map(m => `- ${m.name} (${m.rating}/5) — ${[...(m.dislikeTags||[]), m.dislike].filter(Boolean).join(", ")||"expérience mitigée"}`)
      .join("\n");
    const friendLiked = friendMemories.filter(m => m.rating >= 3)
      .map(m => `- ${m.name} (${m.type}, ${m.price}) à ${m.city} [ami: ${m.friendName}]`)
      .join("\n");

    const prompt = `Profil utilisateur :
Aime : ${[...(prefs.lovesTags||[]), prefs.loves].filter(Boolean).join(", ") || "non renseigné"}
Évite : ${[...(prefs.hatesTags||[]), prefs.hates].filter(Boolean).join(", ") || "non renseigné"}
Budget : ${recoPrice !== "Tous" ? recoPrice : prefs.budget || "non renseigné"}
Kids friendly requis : ${recoKids ? "oui" : "non"}

Mes lieux appréciés :
${liked || "Aucun."}

Mes lieux décevants :
${disliked || "Aucun."}

Lieux appréciés par mes amis :
${friendLiked || "Aucun."}

Demande : 3 ${recoType} à ${location || "n'importe où"}.
Pour chaque lieu, fournis : name, type, price (€/€€/€€€/€€€€), address (adresse complète avec ville et pays), why, tip, warning (ou null).`;

    try {
      const res = await fetch("/api/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, structured: true }),
      });
      const data = await res.json();
      if (data.recommendations) setAiRecos(data.recommendations);
      else setAiRecos([]);
    } catch { setAiRecos([]); }
    setAiLoading(false);
  };

  const addRecoToCarnet = async (reco) => {
    const entry = {
      name: reco.name, type: reco.type, price: reco.price,
      city: reco.address?.split(",").slice(-2, -1)[0]?.trim() || "",
      country: reco.address?.split(",").pop()?.trim() || "",
      rating: 0, likeTags: [], dislikeTags: [], why: "", dislike: "", kidsf: false,
      id: Date.now(), ts: Date.now(), user_id: userId
    };
    const { error } = await supabase.from('memories').insert(entry);
    if (!error) { setMemories(prev => [entry, ...prev]); showToast("✓ Ajouté à vos mémoires !"); }
  };

  const displayName = profile ? `${profile.first_name} ${profile.last_name}` : session.user.email;

  return (
    <>
      <style>{css}</style>
      <div className="app">
        <div className="header">
          <div className="header-top">
            <div>
              <div className="header-title">Mon <span>Carnet</span></div>
              <div className="header-sub">{displayName}</div>
            </div>
            <button className="logout-btn" onClick={logout}>Déconnexion</button>
          </div>
          <div className="tabs">
            <button className={`tab ${tab==="add"?"active":""}`} onClick={() => setTab("add")}>+ Ajouter</button>
            <button className={`tab ${tab==="memories"?"active":""}`} onClick={() => setTab("memories")}>
              Mémoires {memories.length > 0 && <span className="count-badge">{memories.length}</span>}
            </button>
            <button className={`tab ${tab==="friends"?"active":""}`} onClick={() => setTab("friends")}>
              Amis {pendingIn.length > 0 && <span className="notif-badge">{pendingIn.length}</span>}
            </button>
            <button className={`tab ${tab==="prefs"?"active":""}`} onClick={() => setTab("prefs")}>Profil</button>
            <button className={`tab ${tab==="reco"?"active":""}`} onClick={() => setTab("reco")}>Reco ✨</button>
          </div>
        </div>

        <div className="content">
          {loading && <div className="loading-overlay">Chargement... ✈️</div>}

          {!loading && tab === "add" && <MemoryForm onSave={handleAdd} />}

          {!loading && tab === "memories" && (
            <div>
              <div style={{ marginBottom: 12 }}>
                <div className="filters-row">
                  <span className="filter-label">Type</span>
                  {["Tous", ...TYPES].map(t => <button key={t} className={`filter-btn ${filterType===t?"active":""}`} onClick={() => setFilterType(t)}>{t==="Tous"?"Tous":`${TYPE_ICONS[t]} ${t}`}</button>)}
                </div>
                <div className="filters-row">
                  <span className="filter-label">Prix</span>
                  {["Tous", ...PRICES].map(p => <button key={p} className={`filter-btn ${filterPrice===p?"active":""}`} onClick={() => setFilterPrice(p)}>{p}</button>)}
                </div>
                <div className="filters-row">
                  <span className="filter-label">Note</span>
                  {["Tous","1","2","3","4","5"].map(r => <button key={r} className={`filter-btn ${filterRating===r?"active":""}`} onClick={() => setFilterRating(r)}>{r==="Tous"?"Tous":`${r}★+`}</button>)}
                </div>
                <div className="filters-row">
                  <button className={`filter-btn ${filterKids?"active":""}`} onClick={() => setFilterKids(!filterKids)}>👶 Kids friendly</button>
                  {friends.length > 0 && <button className={`filter-btn ${showFriendMems?"active":""}`} onClick={() => setShowFriendMems(!showFriendMems)}>👥 Amis</button>}
                </div>
              </div>
              <div className="memory-list">
                {filteredMemories.length === 0 ? (
                  <div className="empty"><div className="empty-icon">🧭</div><div className="empty-text">{memories.length === 0 ? "Votre carnet est vide" : "Aucun résultat"}</div><div className="empty-sub">{memories.length === 0 ? "Commencez par ajouter un lieu" : "Essayez d'autres filtres"}</div></div>
                ) : filteredMemories.map(m => (
                  <MemoryCard key={`${m.id}-${m.isMine}`} m={m} isMine={m.isMine} onEdit={setEditMemory} onDelete={deleteMemory} />
                ))}
              </div>
            </div>
          )}

          {!loading && tab === "friends" && (
            <div className="friends-section">
              {pendingIn.length > 0 && (
                <div>
                  <div className="friends-title" style={{ marginBottom: 10 }}>🔔 Demandes reçues</div>
                  {pendingIn.map(f => (
                    <div key={f.id} className="friend-card" style={{ marginBottom: 8 }}>
                      <div className="friend-info">
                        <div className="friend-name">{f.profiles?.first_name} {f.profiles?.last_name}</div>
                        <div className="friend-email">{f.profiles?.email}</div>
                      </div>
                      <div>
                        <button className="friend-action-btn accept" onClick={() => acceptFriend(f.id)}>✓ Accepter</button>
                        <button className="friend-action-btn decline" onClick={() => declineFriend(f.id)}>✕</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div>
                <div className="friends-title" style={{ marginBottom: 10 }}>🔍 Ajouter un ami</div>
                <div className="friend-search-row">
                  <input className="friend-search-input" placeholder="Email de votre ami..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} onKeyDown={e => e.key === "Enter" && searchFriends()} />
                  <button className="friend-search-btn" onClick={searchFriends}>Chercher</button>
                </div>
                {searchResults.length > 0 && (
                  <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 8 }}>
                    {searchResults.map(u => {
                      const alreadyFriend = friends.some(f => f.friendUserId === u.user_id);
                      const pendingSent = pendingOut.some(f => f.addressee_id === u.user_id);
                      return (
                        <div key={u.user_id} className="friend-card">
                          <div className="friend-info">
                            <div className="friend-name">{u.first_name} {u.last_name}</div>
                            <div className="friend-email">{u.email}</div>
                          </div>
                          {alreadyFriend ? <span className="friend-action-btn pending">Déjà ami</span>
                            : pendingSent ? <span className="friend-action-btn pending">Envoyée</span>
                            : <button className="friend-action-btn add" onClick={() => sendFriendRequest(u.user_id)}>+ Ajouter</button>}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              <div>
                <div className="friends-title" style={{ marginBottom: 10 }}>👥 Mes amis ({friends.length})</div>
                {friends.length === 0 ? (
                  <div className="empty-friends">Aucun ami pour l'instant.</div>
                ) : friends.map(f => (
                  <div key={f.id} className="friend-card" style={{ marginBottom: 8 }}>
                    <div className="friend-info">
                      <div className="friend-name">{f.profile?.first_name} {f.profile?.last_name}</div>
                      <div className="friend-email">{f.profile?.email}</div>
                    </div>
                    <span style={{ fontSize: 11, color: COLORS.muted }}>{friendMemories.filter(m => m.user_id === f.friendUserId).length} lieux</span>
                  </div>
                ))}
              </div>
              {pendingOut.length > 0 && (
                <div>
                  <div className="friends-title" style={{ marginBottom: 10, fontSize: 14 }}>⏳ Demandes envoyées</div>
                  {pendingOut.map(f => (
                    <div key={f.id} className="friend-card" style={{ marginBottom: 8 }}>
                      <div className="friend-info">
                        <div className="friend-name">{f.profiles?.first_name} {f.profiles?.last_name}</div>
                      </div>
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
                <div className="prefs-card-title">👤 Mon identité</div>
                <div className="row-2">
                  <div className="field"><label>Prénom</label><input placeholder="Brice" value={prefs.firstName||""} onChange={e => setPrefs(p => ({ ...p, firstName: e.target.value }))} /></div>
                  <div className="field"><label>Nom</label><input placeholder="Dupont" value={prefs.lastName||""} onChange={e => setPrefs(p => ({ ...p, lastName: e.target.value }))} /></div>
                </div>
              </div>
              <div className="prefs-card">
                <div className="prefs-card-title">✨ Ce que j'aime en général</div>
                <div className="field"><label>Sélectionner</label><TagPicker options={PREFS_LOVES_OPTIONS} selected={prefs.lovesTags||[]} onChange={v => setPrefs(p => ({ ...p, lovesTags: v }))} mode="like" /></div>
                <div className="field"><label>Préciser</label><textarea placeholder="Autre chose..." value={prefs.loves} onChange={e => setPrefs(p => ({ ...p, loves: e.target.value }))} style={{ minHeight: 60 }} /></div>
                <div className="field"><label>Budget habituel</label>
                  <select value={prefs.budget} onChange={e => setPrefs(p => ({ ...p, budget: e.target.value }))}>
                    <option value="">Non renseigné</option>
                    {PRICES.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>
              <div className="prefs-card" style={{ borderColor: COLORS.dislike+"44" }}>
                <div className="prefs-card-title bad">🚫 Ce que j'évite</div>
                <div className="field"><label style={{ color: "#a06060" }}>Sélectionner</label><TagPicker options={PREFS_HATES_OPTIONS} selected={prefs.hatesTags||[]} onChange={v => setPrefs(p => ({ ...p, hatesTags: v }))} mode="dislike" /></div>
                <div className="field"><label style={{ color: "#a06060" }}>Préciser</label><textarea placeholder="Autre chose..." value={prefs.hates} onChange={e => setPrefs(p => ({ ...p, hates: e.target.value }))} style={{ minHeight: 60, background: COLORS.dislikeBg, borderColor: COLORS.dislike+"44", color: "#d4a0a0" }} /></div>
              </div>
              <div className="prefs-card">
                <div className="prefs-card-title">📝 Notes libres</div>
                <div className="field"><label>Autres infos pour l'agent</label><textarea placeholder="Ex: Je voyage souvent en couple..." value={prefs.notes} onChange={e => setPrefs(p => ({ ...p, notes: e.target.value }))} style={{ minHeight: 70 }} /></div>
              </div>
              <button className="prefs-save-btn" onClick={savePrefs}>Sauvegarder mon profil</button>
              {prefsSaved && <div className="prefs-saved">✓ Profil enregistré</div>}
            </div>
          )}

          {!loading && tab === "reco" && (
            <div className="reco-section">

              {/* Filtres communs */}
              <div>
                <div className="filters-row">
                  <span className="filter-label">Type</span>
                  {TYPES.map(t => <button key={t} className={`reco-type-btn ${recoType===t?"active":""}`} onClick={() => setRecoType(t)}>{TYPE_ICONS[t]} {t}</button>)}
                </div>
                <div className="filters-row">
                  <span className="filter-label">Prix</span>
                  {["Tous", ...PRICES].map(p => <button key={p} className={`filter-btn ${recoPrice===p?"active":""}`} onClick={() => setRecoPrice(p)}>{p}</button>)}
                </div>
                <div className="filters-row">
                  <button className={`filter-btn ${recoKids?"active":""}`} onClick={() => setRecoKids(!recoKids)}>👶 Kids friendly</button>
                </div>
              </div>

              {/* Section 1 : Coups de cœur */}
              <div className="reco-block">
                <div className="reco-block-title">
                  ❤️ Coups de cœur
                  <span>{friends.length > 0 ? "Vous & vos amis • note ≥ 4★" : "Vos favoris • note ≥ 4★"}</span>
                </div>
                {heartMemories.length === 0 ? (
                  <div style={{ fontSize: 13, color: COLORS.muted, padding: "12px", background: COLORS.card, borderRadius: 8, border: `1px solid ${COLORS.border}` }}>
                    Aucun coup de cœur pour ce type. Ajoutez des lieux avec une note ≥ 4★ !
                  </div>
                ) : (
                  <div className="memory-list">
                    {heartMemories.map(m => (
                      <MemoryCard key={`heart-${m.id}`} m={m} isMine={!m.friendName} onEdit={setEditMemory} onDelete={deleteMemory} />
                    ))}
                  </div>
                )}
              </div>

              {/* Section 2 : Recommandations AI */}
              <div className="reco-block">
                <div className="reco-block-title">✨ Recommandations AI<span>Basées sur votre profil</span></div>
                <div className="field">
                  <label>Localisation</label>
                  <div className="location-row">
                    <button className={`loc-btn ${locMode==="gps"?"active":""}`} onClick={() => { setLocMode("gps"); getGPS(); }}>📍 Ma position</button>
                    <button className={`loc-btn ${locMode==="free"?"active":""}`} onClick={() => setLocMode("free")}>✏️ Saisir</button>
                  </div>
                  {locMode==="gps" && gpsLocation && <input className="inline-input" value={gpsLocation} onChange={e => setGpsLocation(e.target.value)} />}
                  {locMode==="gps" && !gpsLocation && <div style={{fontSize:12,color:COLORS.muted,marginTop:6}}>Récupération...</div>}
                  {locMode==="free" && <input className="inline-input" placeholder="Ex: Rome, Tokyo, Bordeaux..." value={freeLocation} onChange={e => setFreeLocation(e.target.value)} />}
                </div>
                <button className="reco-btn" onClick={getAiRecos} disabled={aiLoading||(!freeLocation&&!gpsLocation)}>
                  {aiLoading ? "Analyse en cours..." : "✨ Obtenir mes recommandations AI"}
                </button>
                {aiLoading && <div className="thinking"><div className="dot"/><div className="dot"/><div className="dot"/></div>}

                {aiRecos.length > 0 && !aiLoading && (
                  <>
                    {/* Carte globale avec les 3 épingles */}
                    <GoogleMap recommendations={aiRecos} />

                    {/* Cards individuelles */}
                    <div className="ai-reco-list">
                      {aiRecos.map((reco, i) => (
                        <div key={i} className="ai-reco-card">
                          <div className="ai-reco-header">
                            <div className="ai-reco-name">
                              <span style={{ color: COLORS.accent, fontSize: 14, fontFamily: "DM Sans", fontStyle: "normal", marginRight: 8 }}>{i+1}</span>
                              {reco.name}
                            </div>
                            <div className="ai-reco-meta">
                              <span className="badge">{TYPE_ICONS[reco.type] || "📍"} {reco.type}</span>
                              <span className="badge price">{reco.price}</span>
                            </div>
                            {reco.address && (
                              <div className="ai-reco-address">
                                📍 {reco.address}
                                <a href={`https://maps.google.com/?q=${encodeURIComponent(reco.address)}`} target="_blank" rel="noopener noreferrer" style={{ color: COLORS.accent, fontSize: 11, marginLeft: 6 }}>
                                  Voir sur Maps →
                                </a>
                              </div>
                            )}
                            {reco.why && <div className="ai-reco-why">« {reco.why} »</div>}
                            {reco.tip && <div className="ai-reco-tip">💡 {reco.tip}</div>}
                            {reco.warning && <div className="ai-reco-warning">⚠️ {reco.warning}</div>}
                            <button className="add-to-carnet-btn" onClick={() => addRecoToCarnet(reco)}>
                              + Ajouter à mon carnet
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {editMemory && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-title">✏️ Modifier {editMemory.name}</div>
            <MemoryForm initial={editMemory} onSave={handleUpdate} onCancel={() => setEditMemory(null)} isEdit={true} />
          </div>
        </div>
      )}

      {duplicateAlert && (
        <div className="alert-overlay">
          <div className="alert-box">
            <div className="alert-title">📍 Lieu déjà existant</div>
            <div className="alert-text"><strong>{duplicateAlert.existing.name}</strong> est déjà dans votre carnet. Mettre à jour ?</div>
            <div className="alert-actions">
              <button className="modal-btn secondary" onClick={() => setDuplicateAlert(null)}>Annuler</button>
              <button className="modal-btn primary" onClick={handleDuplicateUpdate}>Mettre à jour</button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="success-toast">{toast}</div>}
    </>
  );
}
