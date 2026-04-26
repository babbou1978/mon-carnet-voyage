import { useState } from "react";
import { supabase } from "./supabase.js";

// Change to "dark" to revert to dark theme
const THEME = "light";

const THEMES = {
  dark: {
    bg: "#0f0e0c", card: "#1a1814", border: "#2e2b25",
    accent: "#c9a84c", accentLight: "#e8c97a", text: "#f0ead8", muted: "#8a8070",
  },
  light: {
    bg: "#f9f7f4", card: "#ffffff", border: "#e5dfd5",
    accent: "#b8922a", accentLight: "#c9a84c", text: "#1a1410", muted: "#6a5a40",
  },
};

const COLORS = THEMES[THEME];

const AUTH_T = {
  fr: { logo: "Outsy AI", tagline: "Save & Share places you love.\nDiscover more.", login: "Connexion", signup: "Inscription",
    firstName: "Prénom", lastName: "Nom", email: "Email", password: "Mot de passe",
    connect: "Se connecter", create: "Créer mon compte",
    forgot: "Mot de passe oublié ?", resetTitle: "Réinitialiser", resetBtn: "Envoyer le lien",
    resetSent: "✓ Lien envoyé ! Vérifiez votre email.", backToLogin: "← Retour",
    errorLogin: "Email ou mot de passe incorrect.", errorSignup: "Erreur lors de l'inscription.",
    errorName: "Prénom et nom requis.", welcome: "Bienvenue sur Outsy AI !" },
  en: { logo: "Outsy AI", tagline: "Save & Share places you love.\nDiscover more.", login: "Sign in", signup: "Sign up",
    firstName: "First name", lastName: "Last name", email: "Email", password: "Password",
    connect: "Sign in", create: "Create account",
    forgot: "Forgot password?", resetTitle: "Reset password", resetBtn: "Send reset link",
    resetSent: "✓ Link sent! Check your email.", backToLogin: "← Back",
    errorLogin: "Incorrect email or password.", errorSignup: "Error during registration.",
    errorName: "First and last name required.", welcome: "Welcome to Outsy AI!" },
};

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=DM+Sans:wght@300;400;500&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: ${COLORS.bg}; color: ${COLORS.text}; font-family: 'DM Sans', sans-serif; min-height: 100vh; }
  .auth-wrapper { max-width: 400px; margin: 0 auto; min-height: 100vh; display: flex; flex-direction: column; justify-content: center; padding: 40px 24px; }
  .auth-logo { font-family: 'Cormorant Garamond', serif; font-size: 40px; font-weight: 300; letter-spacing: 0.05em; text-align: center; margin-bottom: 4px; }
  .auth-logo span { color: ${COLORS.accent}; font-style: italic; }
  .auth-tagline { font-size: 12px; color: ${COLORS.muted}; letter-spacing: 0.2em; text-transform: uppercase; text-align: center; margin-bottom: 40px; }
  .auth-card { background: ${COLORS.card}; border: 1px solid ${COLORS.border}; border-radius: 16px; padding: 28px; display: flex; flex-direction: column; gap: 16px; box-shadow: 0 4px 24px rgba(0,0,0,0.06); }
  .auth-tabs { display: flex; background: ${COLORS.bg}; border-radius: 8px; padding: 3px; border: 1px solid ${COLORS.border}; }
  .auth-tab { flex: 1; padding: 8px; font-size: 12px; font-family: 'DM Sans', sans-serif; letter-spacing: 0.08em; text-transform: uppercase; background: none; border: none; color: ${COLORS.muted}; cursor: pointer; border-radius: 6px; transition: all 0.2s; font-weight: 500; }
  .auth-tab.active { background: ${COLORS.accent}; color: ${COLORS.bg}; }
  .auth-row { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  .auth-field { display: flex; flex-direction: column; gap: 6px; }
  .auth-field label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.15em; color: ${COLORS.muted}; font-weight: 500; }
  .auth-field input { background: ${COLORS.bg}; border: 1px solid ${COLORS.border}; border-radius: 8px; color: ${COLORS.text}; font-family: 'DM Sans', sans-serif; font-size: 16px; padding: 11px 14px; outline: none; transition: border-color 0.2s; width: 100%; }
  .auth-field input:focus { border-color: ${COLORS.accent}; }
  .auth-btn { background: ${COLORS.accent}; color: ${COLORS.bg}; border: none; border-radius: 10px; padding: 14px; font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; cursor: pointer; transition: all 0.2s; margin-top: 4px; }
  .auth-btn:hover { background: ${COLORS.accentLight}; }
  .auth-btn:disabled { opacity: 0.5; cursor: not-allowed; }
  .auth-link { background: none; border: none; color: ${COLORS.muted}; font-size: 12px; cursor: pointer; font-family: 'DM Sans', sans-serif; text-decoration: underline; text-align: center; padding: 4px; transition: color 0.2s; }
  .auth-link:hover { color: ${COLORS.accent}; }
  .auth-error { font-size: 12px; color: #e06060; text-align: center; padding: 8px; background: #fce8e8; border-radius: 8px; }
  .auth-success { font-size: 12px; color: ${COLORS.accent}; text-align: center; padding: 8px; background: ${COLORS.accent}18; border-radius: 8px; }
`;

export default function Auth() {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const browserLang = navigator.language?.slice(0, 2) || "en";
  const at = AUTH_T[browserLang] || AUTH_T["en"];

  const handle = async () => {
    setLoading(true); setError(""); setSuccess("");
    if (mode === "reset") {
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin });
      if (error) setError(error.message);
      else setSuccess(at.resetSent);
      setLoading(false);
      return;
    }
    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(at.errorLogin);
    } else {
      if (!firstName.trim() || !lastName.trim()) { setError(at.errorName); setLoading(false); return; }
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) { setError(error.message || at.errorSignup); }
      else {
        if (data.session && data.user) {
          await supabase.from('profiles').upsert({ user_id: data.user.id, email, first_name: firstName, last_name: lastName });
          try { await fetch("/api/notify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ firstName, lastName, email }) }); } catch {}
        } else if (data.user) {
          try { await fetch("/api/notify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ firstName, lastName, email, userId: data.user.id }) }); } catch {}
        }
        setSuccess(`${at.welcome} ${firstName}!`);
      }
    }
    setLoading(false);
  };

  return (
    <>
      <style>{css}</style>
      <div className="auth-wrapper">
        <div className="auth-logo">Outsy <span>AI</span></div>
        <div className="auth-tagline" style={{lineHeight:1.8}}>{at.tagline.split("\n").map((l,i)=><div key={i}>{l}</div>)}</div>
        <div className="auth-card">
          {mode === "reset" ? (
            <>
              <div style={{fontFamily:"'Cormorant Garamond', serif", fontSize:20, color:COLORS.accent, fontStyle:"italic"}}>{at.resetTitle}</div>
              <div className="auth-field"><label>{at.email}</label><input type="email" placeholder="you@email.com" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === "Enter" && handle()} /></div>
              {error && <div className="auth-error">{error}</div>}
              {success && <div className="auth-success">{success}</div>}
              {!success && <button className="auth-btn" onClick={handle} disabled={loading || !email}>{loading ? "..." : at.resetBtn}</button>}
              <button className="auth-link" onClick={() => { setMode("login"); setError(""); setSuccess(""); }}>{at.backToLogin}</button>
            </>
          ) : (
            <>
              <div className="auth-tabs">
                <button className={`auth-tab ${mode==="login"?"active":""}`} onClick={() => { setMode("login"); setError(""); setSuccess(""); }}>{at.login}</button>
                <button className={`auth-tab ${mode==="signup"?"active":""}`} onClick={() => { setMode("signup"); setError(""); setSuccess(""); }}>{at.signup}</button>
              </div>
              {mode === "signup" && (
                <div className="auth-row">
                  <div className="auth-field"><label>{at.firstName}</label><input placeholder="John" value={firstName} onChange={e => setFirstName(e.target.value)} /></div>
                  <div className="auth-field"><label>{at.lastName}</label><input placeholder="Smith" value={lastName} onChange={e => setLastName(e.target.value)} /></div>
                </div>
              )}
              <div className="auth-field"><label>{at.email}</label><input type="email" placeholder="you@email.com" value={email} onChange={e => setEmail(e.target.value)} /></div>
              <div className="auth-field"><label>{at.password}</label><input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === "Enter" && handle()} /></div>
              {error && <div className="auth-error">{error}</div>}
              {success && <div className="auth-success">{success}</div>}
              <button className="auth-btn" onClick={handle} disabled={loading || !email || !password}>
                {loading ? "..." : mode === "login" ? at.connect : at.create}
              </button>
              {mode === "login" && <button className="auth-link" onClick={() => { setMode("reset"); setError(""); setSuccess(""); }}>{at.forgot}</button>}
            </>
          )}
        </div>
      </div>
    </>
  );
}
