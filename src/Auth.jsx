import { useState } from "react";
import { supabase } from "./supabase.js";

const COLORS = {
  bg: "#0f0e0c", card: "#1a1814", border: "#2e2b25",
  accent: "#c9a84c", accentLight: "#e8c97a",
  text: "#f0ead8", muted: "#8a8070",
};

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=DM+Sans:wght@300;400;500&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: ${COLORS.bg}; color: ${COLORS.text}; font-family: 'DM Sans', sans-serif; min-height: 100vh; }

  .auth-wrapper {
    max-width: 400px; margin: 0 auto; min-height: 100vh;
    display: flex; flex-direction: column; justify-content: center; padding: 40px 24px;
  }
  .auth-logo {
    font-family: 'Cormorant Garamond', serif; font-size: 36px; font-weight: 300;
    letter-spacing: 0.05em; text-align: center; margin-bottom: 8px;
  }
  .auth-logo span { color: ${COLORS.accent}; font-style: italic; }
  .auth-sub {
    font-size: 11px; color: ${COLORS.muted}; letter-spacing: 0.15em;
    text-transform: uppercase; text-align: center; margin-bottom: 40px;
  }
  .auth-card {
    background: ${COLORS.card}; border: 1px solid ${COLORS.border};
    border-radius: 16px; padding: 28px; display: flex; flex-direction: column; gap: 16px;
  }
  .auth-tabs {
    display: flex; background: ${COLORS.bg}; border-radius: 8px;
    padding: 3px; border: 1px solid ${COLORS.border};
  }
  .auth-tab {
    flex: 1; padding: 8px; font-size: 12px; font-family: 'DM Sans', sans-serif;
    letter-spacing: 0.08em; text-transform: uppercase; background: none;
    border: none; color: ${COLORS.muted}; cursor: pointer; border-radius: 6px;
    transition: all 0.2s; font-weight: 500;
  }
  .auth-tab.active { background: ${COLORS.accent}; color: #0f0e0c; }
  .auth-field { display: flex; flex-direction: column; gap: 6px; }
  .auth-field label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.15em; color: ${COLORS.muted}; font-weight: 500; }
  .auth-field input {
    background: ${COLORS.bg}; border: 1px solid ${COLORS.border};
    border-radius: 8px; color: ${COLORS.text}; font-family: 'DM Sans', sans-serif;
    font-size: 14px; padding: 11px 14px; outline: none; transition: border-color 0.2s; width: 100%;
  }
  .auth-field input:focus { border-color: ${COLORS.accent}; }
  .auth-btn {
    background: ${COLORS.accent}; color: #0f0e0c; border: none;
    border-radius: 10px; padding: 14px; font-family: 'DM Sans', sans-serif;
    font-size: 13px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase;
    cursor: pointer; transition: all 0.2s; margin-top: 4px;
  }
  .auth-btn:hover { background: ${COLORS.accentLight}; }
  .auth-btn:disabled { opacity: 0.5; cursor: not-allowed; }
  .auth-error { font-size: 12px; color: #e06060; text-align: center; padding: 8px; background: #3a1a1a; border-radius: 8px; }
  .auth-success { font-size: 12px; color: ${COLORS.accent}; text-align: center; padding: 8px; background: ${COLORS.accent}18; border-radius: 8px; }
`;

export default function Auth() {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handle = async () => {
    setLoading(true); setError(""); setSuccess("");
    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError("Email ou mot de passe incorrect.");
    } else {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) setError("Erreur lors de l'inscription.");
      else setSuccess("Compte créé ! Vérifiez votre email pour confirmer.");
    }
    setLoading(false);
  };

  return (
    <>
      <style>{css}</style>
      <div className="auth-wrapper">
        <div className="auth-logo">Mon <span>Carnet</span></div>
        <div className="auth-sub">Agence de voyage personnelle</div>
        <div className="auth-card">
          <div className="auth-tabs">
            <button className={`auth-tab ${mode==="login"?"active":""}`} onClick={() => { setMode("login"); setError(""); setSuccess(""); }}>Connexion</button>
            <button className={`auth-tab ${mode==="signup"?"active":""}`} onClick={() => { setMode("signup"); setError(""); setSuccess(""); }}>Inscription</button>
          </div>
          <div className="auth-field">
            <label>Email</label>
            <input type="email" placeholder="votre@email.com" value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <div className="auth-field">
            <label>Mot de passe</label>
            <input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handle()} />
          </div>
          {error && <div className="auth-error">{error}</div>}
          {success && <div className="auth-success">{success}</div>}
          <button className="auth-btn" onClick={handle} disabled={loading || !email || !password}>
            {loading ? "..." : mode === "login" ? "Se connecter" : "Créer mon compte"}
          </button>
        </div>
      </div>
    </>
  );
}
