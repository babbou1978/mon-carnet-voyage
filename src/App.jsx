import { useState, useEffect } from "react";
import { supabase } from "./supabase.js";

const TYPES = ["Restaurant", "Hôtel", "Bar / Café", "Destination", "Activité"];
const PRICES = ["€", "€€", "€€€", "€€€€"];
const TYPE_ICONS = {
  "Restaurant": "🍽️", "Hôtel": "🏨", "Bar / Café": "☕",
  "Destination": "🗺️", "Activité": "🎯",
};

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
  .header { padding: 28px 24px 16px; border-bottom: 1px solid ${COLORS.border}; position: sticky; top: 0; background: ${COLORS.bg}; z-index: 10; }
  .header-title { font-family: 'Cormorant Garamond', serif; font-size: 26px; font-weight: 300; letter-spacing: 0.05em; line-height: 1.1; }
  .header-title span { color: ${COLORS.accent}; font-style: italic; }
  .header-sub { font-size: 11px; color: ${COLORS.muted}; letter-spacing: 0.15em; text-transform: uppercase; margin-top: 4px; }
  .tabs { display: flex; margin-top: 14px; background: ${COLORS.card}; border-radius: 8px; padding: 3px; border: 1px solid ${COLORS.border}; }
  .tab { flex: 1; padding: 7px 2px; font-size: 10px; font-family: 'DM Sans', sans-serif; letter-spacing: 0.06em; text-transform: uppercase; background: none; border: none; color: ${COLORS.muted}; cursor: pointer; border-radius: 6px; transition: all 0.2s; font-weight: 500; }
  .tab.active { background: ${COLORS.accent}; color: #0f0e0c; }
  .content { flex: 1; padding: 20px 24px; overflow-y: auto; }
  .form-section { display: flex; flex-direction: column; gap: 14px; }
  .field { display: flex; flex-direction: column; gap: 6px; }
  .field label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.15em; color: ${COLORS.muted}; font-weight: 500; }
  .field input, .field textarea, .field select { background: ${COLORS.card}; border: 1px solid ${COLORS.border}; border-radius: 8px; color: ${COLORS.text}; font-family: 'DM Sans', sans-serif; font-size: 14px; padding: 11px 14px; outline: none; transition: border-color 0.2s; width: 100%; }
  .field input:focus, .field textarea:focus { border-color: ${COLORS.accent}; }
  .field textarea { resize: none; min-height: 76px; line-height: 1.5; }
  .field select { cursor: pointer; appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%238a8070' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 14px center; padding-right: 36px; }
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
  .dislike-field textarea { background: ${COLORS.dislikeBg}; border-color: ${COLORS.dislike}44; color: #d4a0a0; }
  .dislike-field textarea:focus { border-color: ${COLORS.dislike}; }
  .dislike-field label { color: #a06060; }
  .save-btn { background: ${COLORS.accent}; color: #0f0e0c; border: none; border-radius: 10px; padding: 14px; font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; cursor: pointer; margin-top: 4px; transition: all 0.2s; }
  .save-btn:hover { background: ${COLORS.accentLight}; }
  .save-btn:disabled { opacity: 0.5; cursor: not-allowed; }
  .memory-list { display: flex; flex-direction: column; gap: 12px; }
  .memory-card { background: ${COLORS.card}; border: 1px solid ${COLORS.border}; border-radius: 12px; padding: 16px; transition: border-color 0.2s; }
  .memory-card:hover { border-color: ${COLORS.accent}44; }
  .memory-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 8px; margin-bottom: 6px; }
  .memory-name { font-family: 'Cormorant Garamond', serif; font-size: 19px; font-weight: 400; line-height: 1.2; }
  .memory-meta { display: flex; gap: 5px; align-items: center; flex-shrink: 0; flex-wrap: wrap; justify-content: flex-end; }
  .badge { font-size: 10px; padding: 3px 7px; border-radius: 20px; background: ${COLORS.tag}; color: ${COLORS.muted}; letter-spacing: 0.06em; text-transform: uppercase; }
  .badge.price { color: ${COLORS.accent}; background: ${COLORS.accent}18; }
  .badge.stars { color: #e8c97a; background: #2a2310; font-size: 11px; }
  .memory-location { font-size: 12px; color: ${COLORS.muted}; margin-bottom: 6px; }
  .memory-why { font-size: 13px; color: #b8ad98; line-height: 1.5; font-style: italic; }
  .memory-dislike { font-size: 12px; color: #a06060; line-height: 1.4; margin-top: 6px; padding: 6px 10px; background: ${COLORS.dislikeBg}; border-radius: 6px; border-left: 2px solid ${COLORS.dislike}66; }
  .memory-footer { display: flex; justify-content: space-between; align-items: center; margin-top: 10px; }
  .memory-date { font-size: 10px; color: ${COLORS.muted}; }
  .del-btn { background: none; border: none; color: ${COLORS.muted}; cursor: pointer; font-size: 13px; padding: 2px 6px; border-radius: 4px; transition: color 0.2s; }
  .del-btn:hover { color: #e06060; }
  .prefs-section { display: flex; flex-direction: column; gap: 16px; }
  .prefs-card { background: ${COLORS.card}; border: 1px solid ${COLORS.border}; border-radius: 12px; padding: 18px; display: flex; flex-direction: column; gap: 12px; }
  .prefs-card-title { font-family: 'Cormorant Garamond', serif; font-size: 17px; font-style: italic; color: ${COLORS.accent}; margin-bottom: 2px; }
  .prefs-save-btn { background: none; border: 1px solid ${COLORS.accent}; color: ${COLORS.accent}; border-radius: 8px; padding: 11px; font-family: 'DM Sans', sans-serif; font-size: 12px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; cursor: pointer; transition: all 0.2s; }
  .prefs-save-btn:hover { background: ${COLORS.accent}22; }
  .prefs-saved { font-size: 11px; color: ${COLORS.accent}; text-align: center; opacity: 0.8; }
  .reco-section { display: flex; flex-direction: column; gap: 16px; }
  .location-row { display: flex; gap: 8px; }
  .loc-btn { padding: 10px 14px; background: ${COLORS.card}; border: 1px solid ${COLORS.border}; border-radius: 8px; color: ${COLORS.muted}; font-size: 12px; cursor: pointer; transition: all 0.2s; white-space: nowrap; font-family: 'DM Sans', sans-serif; }
  .loc-btn.active { border-color: ${COLORS.accent}; color: ${COLORS.accent}; }
  .reco-type-row { display: flex; gap: 6px; flex-wrap: wrap; }
  .reco-type-btn { padding: 7px 11px; background: ${COLORS.card}; border: 1px solid ${COLORS.border}; border-radius: 20px; color: ${COLORS.muted}; font-size: 12px; cursor: pointer; transition: all 0.2s; font-family: 'DM Sans', sans-serif; }
  .reco-type-btn.active { background: ${COLORS.accent}22; border-color: ${COLORS.accent}; color: ${COLORS.accent}; }
  .reco-btn { background: ${COLORS.card}; border: 1px solid ${COLORS.accent}; color: ${COLORS.accent}; border-radius: 10px; padding: 13px; font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; cursor: pointer; transition: all 0.2s; }
  .reco-btn:hover { background: ${COLORS.accent}22; }
  .reco-btn:disabled { opacity: 0.4; cursor: not-allowed; }
  .reco-result { background: ${COLORS.card}; border: 1px solid ${COLORS.border}; border-radius: 12px; padding: 18px; font-size: 14px; line-height: 1.75; color: #d4cab8; white-space: pre-wrap; }
  .reco-result strong { color: ${COLORS.accent}; font-weight: 500; }
  .thinking { display: flex; gap: 5px; justify-content: center; padding: 20px; }
  .dot { width: 7px; height: 7px; border-radius: 50%; background: ${COLORS.accent}; animation: bounce 1.2s infinite; }
  .dot:nth-child(2) { animation-delay: 0.2s; }
  .dot:nth-child(3) { animation-delay: 0.4s; }
  @keyframes bounce { 0%,80%,100%{opacity:.3;transform:scale(.8)}40%{opacity:1;transform:scale(1)} }
  .success-toast { position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%); background: ${COLORS.accent}; color: #0f0e0c; padding: 10px 20px; border-radius: 20px; font-size: 13px; font-weight: 600; z-index: 100; animation: fadeInUp 0.3s ease, fadeOut 0.3s ease 1.7s forwards; }
  @keyframes fadeInUp { from{opacity:0;transform:translateX(-50%) translateY(10px)}to{opacity:1;transform:translateX(-50%) translateY(0)} }
  @keyframes fadeOut { to{opacity:0} }
  .count-badge { display: inline-flex; align-items: center; justify-content: center; width: 17px; height: 17px; background: ${COLORS.accent}; color: #0f0e0c; border-radius: 50%; font-size: 10px; font-weight: 700; margin-left: 4px; }
  .empty { text-align: center; padding: 60px 20px; color: ${COLORS.muted}; }
  .empty-icon { font-size: 40px; margin-bottom: 12px; }
  .empty-text { font-family: 'Cormorant Garamond', serif; font-size: 18px; font-style: italic; }
  .empty-sub { font-size: 12px; margin-top: 6px; }
  .inline-input { background: ${COLORS.card}; border: 1px solid ${COLORS.border}; border-radius: 8px; color: ${COLORS.text}; font-family: 'DM Sans', sans-serif; font-size: 14px; padding: 10px 14px; outline: none; width: 100%; margin-top: 8px; transition: border-color 0.2s; }
  .inline-input:focus { border-color: ${COLORS.accent}; }
  .loading-overlay { text-align: center; padding: 40px 20px; color: ${COLORS.muted}; font-size: 13px; }
`;

function formatDate(ts) {
  return new Date(ts).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}
function starsLabel(n) { return "★".repeat(n) + "☆".repeat(5 - n); }
function parseRecoText(t) { return t.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>"); }

function StarPicker({ value, onChange }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="star-row">
      {[1,2,3,4,5].map(n => (
        <span key={n} className={`star ${(hover || value) >= n ? "active" : ""}`}
          onClick={() => onChange(n === value ? 0 : n)}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}>★</span>
      ))}
      {value > 0 && <span style={{ fontSize: 12, color: COLORS.muted }}>{value}/5</span>}
    </div>
  );
}

const DEFAULT_FORM = { name: "", type: "Restaurant", price: "€€", city: "", country: "", rating: 0, why: "", dislike: "" };
const DEFAULT_PREFS = { loves: "", hates: "", budget: "", notes: "" };

export default function TravelAgent() {
  const [tab, setTab] = useState("add");
  const [memories, setMemories] = useState([]);
  const [prefs, setPrefs] = useState(DEFAULT_PREFS);
  const [prefsSaved, setPrefsSaved] = useState(false);
  const [toast, setToast] = useState(false);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [loading, setLoading] = useState(true);
  const [recoType, setRecoType] = useState("Restaurant");
  const [locMode, setLocMode] = useState("free");
  const [freeLocation, setFreeLocation] = useState("");
  const [gpsLocation, setGpsLocation] = useState("");
  const [recoResult, setRecoResult] = useState("");
  const [recoLoading, setRecoLoading] = useState(false);

  // Charger les données depuis Supabase au démarrage
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      // Mémoires
      const { data: mems } = await supabase.from('memories').select('*').order('ts', { ascending: false });
      if (mems) setMemories(mems);
      // Préférences
      const { data: pref } = await supabase.from('preferences').select('*').eq('id', 1).single();
      if (pref) setPrefs(pref);
      setLoading(false);
    };
    load();
  }, []);

  const addMemory = async () => {
    if (!form.name.trim()) return;
    const entry = { ...form, id: Date.now(), ts: Date.now() };
    const { error } = await supabase.from('memories').insert(entry);
    if (!error) {
      setMemories(prev => [entry, ...prev]);
      setForm(DEFAULT_FORM);
      setToast(true); setTimeout(() => setToast(false), 2200);
    }
  };

  const deleteMemory = async (id) => {
    await supabase.from('memories').delete().eq('id', id);
    setMemories(prev => prev.filter(m => m.id !== id));
  };

  const savePrefs = async () => {
    await supabase.from('preferences').upsert({ ...prefs, id: 1 });
    setPrefsSaved(true); setTimeout(() => setPrefsSaved(false), 2000);
  };

  const getGPS = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(pos => {
      const { latitude: lat, longitude: lng } = pos.coords;
      fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`)
        .then(r => r.json())
        .then(d => {
          const city = d.address?.city || d.address?.town || d.address?.village || "";
          setGpsLocation(`${city}, ${d.address?.country || ""}`);
        })
        .catch(() => setGpsLocation(`${lat.toFixed(3)}, ${lng.toFixed(3)}`));
    });
  };

  const getRecos = async () => {
    setRecoLoading(true); setRecoResult("");
    const location = locMode === "gps" ? gpsLocation : freeLocation;
    const liked = memories.filter(m => m.rating >= 3)
      .map(m => `- ${m.name} (${m.type}, ${m.price}, ${m.rating}/5) à ${m.city}${m.country ? ", "+m.country : ""} — aimé: ${m.why||"—"}${m.dislike ? ` / moins aimé: ${m.dislike}` : ""}`)
      .join("\n");
    const disliked = memories.filter(m => m.rating > 0 && m.rating < 3)
      .map(m => `- ${m.name} (${m.rating}/5) — ${m.dislike||m.why||"expérience mitigée"}`)
      .join("\n");

    const prompt = `Tu es un agent de voyage personnel francophone, expert en découvertes locales.

=== PROFIL DE L'UTILISATEUR ===
Ce qu'il aime en général : ${prefs.loves || "non renseigné"}
Ce qu'il n'aime pas en général : ${prefs.hates || "non renseigné"}
Budget habituel : ${prefs.budget || "non renseigné"}
Notes : ${prefs.notes || "—"}

=== LIEUX APPRÉCIÉS (note ≥ 3/5) ===
${liked || "Aucun lieu enregistré."}

=== LIEUX DÉCEVANTS (note < 3/5) ===
${disliked || "Aucun."}

=== DEMANDE ===
L'utilisateur cherche : un(e) **${recoType}** à **${location || "n'importe où"}**.

Propose 3 recommandations très personnalisées. Pour chaque lieu :
- **Nom du lieu**
- Type et fourchette de prix
- Pourquoi ça correspond à ses goûts
- Ce qu'il faut savoir par rapport à ses aversions
- Un conseil pratique

N'inclus jamais d'endroits similaires à ceux mal notés. Sois précis, chaleureux, francophone.`;

    try {
      const res = await fetch("/api/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json();
      setRecoResult(data.result || "Erreur de réponse.");
    } catch { setRecoResult("Une erreur est survenue."); }
    setRecoLoading(false);
  };

  return (
    <>
      <style>{css}</style>
      <div className="app">
        <div className="header">
          <div className="header-title">Mon <span>Carnet</span> de Voyage</div>
          <div className="header-sub">Agence personnelle • Powered by AI</div>
          <div className="tabs">
            <button className={`tab ${tab==="add"?"active":""}`} onClick={() => setTab("add")}>+ Ajouter</button>
            <button className={`tab ${tab==="memories"?"active":""}`} onClick={() => setTab("memories")}>
              Mémoires {memories.length > 0 && <span className="count-badge">{memories.length}</span>}
            </button>
            <button className={`tab ${tab==="prefs"?"active":""}`} onClick={() => setTab("prefs")}>Profil</button>
            <button className={`tab ${tab==="reco"?"active":""}`} onClick={() => setTab("reco")}>Reco ✨</button>
          </div>
        </div>

        <div className="content">
          {loading && <div className="loading-overlay">Chargement de vos données... ✈️</div>}

          {!loading && tab === "add" && (
            <div className="form-section">
              <div className="field">
                <label>Nom du lieu</label>
                <input placeholder="Ex: Le Comptoir du Relais" value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} />
              </div>
              <div className="row-2">
                <div className="field">
                  <label>Type</label>
                  <select value={form.type} onChange={e => setForm(f => ({...f, type: e.target.value}))}>
                    {TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label>Prix</label>
                  <div className="price-selector">
                    {PRICES.map(p => (
                      <button key={p} className={`price-btn ${form.price===p?"selected":""}`} onClick={() => setForm(f => ({...f, price: p}))}>{p}</button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="row-2">
                <div className="field">
                  <label>Ville</label>
                  <input placeholder="Paris" value={form.city} onChange={e => setForm(f => ({...f, city: e.target.value}))} />
                </div>
                <div className="field">
                  <label>Pays</label>
                  <input placeholder="France" value={form.country} onChange={e => setForm(f => ({...f, country: e.target.value}))} />
                </div>
              </div>
              <div className="field">
                <label>Note globale</label>
                <StarPicker value={form.rating} onChange={v => setForm(f => ({...f, rating: v}))} />
              </div>
              <div className="section-divider"><span>Ce que j'ai aimé</span></div>
              <div className="field">
                <label>Pourquoi j'ai aimé</label>
                <textarea placeholder="L'ambiance, la cuisine, le service, la déco..." value={form.why} onChange={e => setForm(f => ({...f, why: e.target.value}))} />
              </div>
              <div className="section-divider"><span>Ce que j'ai moins aimé</span></div>
              <div className="field dislike-field">
                <label>Ce que j'ai moins aimé</label>
                <textarea placeholder="Le bruit, le service lent, les portions, le quartier..." value={form.dislike} onChange={e => setForm(f => ({...f, dislike: e.target.value}))} />
              </div>
              <button className="save-btn" onClick={addMemory} disabled={!form.name.trim()}>Enregistrer ce souvenir</button>
            </div>
          )}

          {!loading && tab === "memories" && (
            <div className="memory-list">
              {memories.length === 0 ? (
                <div className="empty">
                  <div className="empty-icon">🧭</div>
                  <div className="empty-text">Votre carnet est vide</div>
                  <div className="empty-sub">Commencez par ajouter un lieu</div>
                </div>
              ) : memories.map(m => (
                <div key={m.id} className="memory-card">
                  <div className="memory-top">
                    <div className="memory-name">{TYPE_ICONS[m.type]} {m.name}</div>
                    <div className="memory-meta">
                      {m.rating > 0 && <span className="badge stars">{starsLabel(m.rating)}</span>}
                      <span className="badge price">{m.price}</span>
                      <span className="badge">{m.type}</span>
                    </div>
                  </div>
                  {(m.city||m.country) && <div className="memory-location">📍 {[m.city,m.country].filter(Boolean).join(", ")}</div>}
                  {m.why && <div className="memory-why">« {m.why} »</div>}
                  {m.dislike && <div className="memory-dislike">👎 {m.dislike}</div>}
                  <div className="memory-footer">
                    <span className="memory-date">{formatDate(m.ts)}</span>
                    <button className="del-btn" onClick={() => deleteMemory(m.id)}>✕</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && tab === "prefs" && (
            <div className="prefs-section">
              <div className="prefs-card">
                <div className="prefs-card-title">✨ Ce que j'aime en général</div>
                <div className="field">
                  <label>Mes goûts & atmosphères</label>
                  <textarea placeholder="Ex: J'aime les endroits chaleureux, la cuisine locale authentique, les terrasses, les vins naturels..." value={prefs.loves} onChange={e => setPrefs(p => ({...p, loves: e.target.value}))} style={{minHeight: 90}} />
                </div>
                <div className="field">
                  <label>Budget habituel</label>
                  <select value={prefs.budget} onChange={e => setPrefs(p => ({...p, budget: e.target.value}))}>
                    <option value="">Non renseigné</option>
                    {PRICES.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>
              <div className="prefs-card" style={{borderColor: COLORS.dislike+"44"}}>
                <div className="prefs-card-title" style={{color:"#c07070"}}>🚫 Ce que j'évite toujours</div>
                <div className="field dislike-field">
                  <label>Mes aversions</label>
                  <textarea placeholder="Ex: Je n'aime pas les endroits trop bruyants, la cuisine trop épicée, les menus touristiques..." value={prefs.hates} onChange={e => setPrefs(p => ({...p, hates: e.target.value}))} style={{minHeight: 90}} />
                </div>
              </div>
              <div className="prefs-card">
                <div className="prefs-card-title">📝 Notes libres</div>
                <div className="field">
                  <label>Autres infos pour l'agent</label>
                  <textarea placeholder="Ex: Je voyage souvent en couple, allergie aux fruits de mer..." value={prefs.notes} onChange={e => setPrefs(p => ({...p, notes: e.target.value}))} style={{minHeight: 80}} />
                </div>
              </div>
              <button className="prefs-save-btn" onClick={savePrefs}>Sauvegarder mon profil</button>
              {prefsSaved && <div className="prefs-saved">✓ Profil enregistré</div>}
            </div>
          )}

          {!loading && tab === "reco" && (
            <div className="reco-section">
              <div className="field">
                <label>Je cherche un(e)</label>
                <div className="reco-type-row">
                  {TYPES.map(t => (
                    <button key={t} className={`reco-type-btn ${recoType===t?"active":""}`} onClick={() => setRecoType(t)}>
                      {TYPE_ICONS[t]} {t}
                    </button>
                  ))}
                </div>
              </div>
              <div className="field">
                <label>Localisation</label>
                <div className="location-row">
                  <button className={`loc-btn ${locMode==="gps"?"active":""}`} onClick={() => { setLocMode("gps"); getGPS(); }}>📍 Ma position</button>
                  <button className={`loc-btn ${locMode==="free"?"active":""}`} onClick={() => setLocMode("free")}>✏️ Saisir</button>
                </div>
                {locMode==="gps" && gpsLocation && <input className="inline-input" value={gpsLocation} onChange={e => setGpsLocation(e.target.value)} />}
                {locMode==="gps" && !gpsLocation && <div style={{fontSize:12,color:COLORS.muted,marginTop:6}}>Récupération de votre position...</div>}
                {locMode==="free" && <input className="inline-input" placeholder="Ex: Rome, Tokyo, Bordeaux..." value={freeLocation} onChange={e => setFreeLocation(e.target.value)} />}
              </div>
              {memories.length===0 && !prefs.loves && (
                <div style={{fontSize:12,color:COLORS.muted,padding:"8px 12px",background:COLORS.card,borderRadius:8,border:`1px solid ${COLORS.border}`}}>
                  💡 Renseignez votre profil et ajoutez des lieux pour des recommandations ultra-personnalisées
                </div>
              )}
              <button className="reco-btn" onClick={getRecos} disabled={recoLoading||(!freeLocation&&!gpsLocation)}>
                {recoLoading ? "Analyse en cours..." : "✨ Obtenir mes recommandations"}
              </button>
              {recoLoading && <div className="thinking"><div className="dot"/><div className="dot"/><div className="dot"/></div>}
              {recoResult && !recoLoading && (
                <div className="reco-result" dangerouslySetInnerHTML={{__html: parseRecoText(recoResult)}} />
              )}
            </div>
          )}
        </div>
      </div>
      {toast && <div className="success-toast">✓ Souvenir enregistré !</div>}
    </>
  );
}
