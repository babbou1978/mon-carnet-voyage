import { useState, useEffect } from "react";
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
    errorLogin: "Email ou mot de passe incorrect.",
    errorNoAccount: "Aucun compte associé à cette adresse email.",
    errorWrongPassword: "Mot de passe incorrect.",
    errorSignup: "Erreur lors de l'inscription.",
    errorDuplicate: "Cette adresse email est déjà utilisée. Essayez de vous connecter ou utilisez une autre adresse.",
    errorPasswordShort: "Le mot de passe doit contenir au moins 6 caractères.",
    errorPasswordWeak: "Le mot de passe doit contenir au moins une minuscule, une majuscule et un chiffre.",
    errorEmail: "Adresse email invalide.",
    errorName: "Prénom et nom requis.", welcome: "Bienvenue sur Outsy AI !" },
  en: { logo: "Outsy AI", tagline: "Save & Share places you love.\nDiscover more.", login: "Sign in", signup: "Sign up",
    firstName: "First name", lastName: "Last name", email: "Email", password: "Password",
    connect: "Sign in", create: "Create account",
    forgot: "Forgot password?", resetTitle: "Reset password", resetBtn: "Send reset link",
    resetSent: "✓ Link sent! Check your email.", backToLogin: "← Back",
    errorLogin: "Incorrect email or password.",
    errorNoAccount: "No account found for this email address.",
    errorWrongPassword: "Incorrect password.",
    errorSignup: "Error during registration.",
    errorDuplicate: "This email is already registered. Try signing in or use a different email address.",
    errorPasswordShort: "Password must be at least 6 characters.",
    errorPasswordWeak: "Password must contain at least one lowercase, one uppercase letter and one digit.",
    errorEmail: "Invalid email address.",
    errorName: "First and last name required.",
    errorNotConfirmed: "Please confirm your email first. Check your inbox (and spam folder).",
    signupSuccess: "Welcome {name}! 🎉  A confirmation email has been sent. Please check your inbox (and spam folder) then come back to sign in.",
    emailConfirmed: "✓ Email confirmed! You can now sign in.",
    welcome: "Welcome to Outsy AI!" },
  es: { logo: "Outsy AI", tagline: "Save & Share places you love.\nDiscover more.", login: "Iniciar sesión", signup: "Registrarse",
    firstName: "Nombre", lastName: "Apellido", email: "Email", password: "Contraseña",
    connect: "Iniciar sesión", create: "Crear cuenta",
    forgot: "¿Olvidaste la contraseña?", resetTitle: "Restablecer", resetBtn: "Enviar enlace",
    resetSent: "✓ ¡Enlace enviado! Revisa tu email.", backToLogin: "← Volver",
    errorLogin: "Email o contraseña incorrectos.",
    errorNoAccount: "No se encontró ninguna cuenta con este email.",
    errorWrongPassword: "Contraseña incorrecta.",
    errorSignup: "Error en el registro.",
    errorDuplicate: "Este email ya está registrado. Intenta iniciar sesión o usa otra dirección.",
    errorPasswordShort: "La contraseña debe tener al menos 6 caracteres.",
    errorPasswordWeak: "La contraseña debe contener al menos una minúscula, una mayúscula y un número.",
    errorEmail: "Dirección de email inválida.",
    errorName: "Nombre y apellido requeridos.", welcome: "¡Bienvenido a Outsy AI!" },
  de: { logo: "Outsy AI", tagline: "Save & Share places you love.\nDiscover more.", login: "Anmelden", signup: "Registrieren",
    firstName: "Vorname", lastName: "Nachname", email: "Email", password: "Passwort",
    connect: "Anmelden", create: "Konto erstellen",
    forgot: "Passwort vergessen?", resetTitle: "Zurücksetzen", resetBtn: "Link senden",
    resetSent: "✓ Link gesendet! Prüfe deine E-Mail.", backToLogin: "← Zurück",
    errorLogin: "Falsche E-Mail oder Passwort.",
    errorNoAccount: "Kein Konto mit dieser E-Mail-Adresse gefunden.",
    errorWrongPassword: "Falsches Passwort.",
    errorSignup: "Fehler bei der Registrierung.",
    errorDuplicate: "Diese E-Mail ist bereits registriert. Versuche dich anzumelden oder verwende eine andere Adresse.",
    errorPasswordShort: "Das Passwort muss mindestens 6 Zeichen lang sein.",
    errorPasswordWeak: "Das Passwort muss mindestens einen Kleinbuchstaben, einen Großbuchstaben und eine Ziffer enthalten.",
    errorEmail: "Ungültige E-Mail-Adresse.",
    errorName: "Vor- und Nachname erforderlich.", welcome: "Willkommen bei Outsy AI!" },
  it: { logo: "Outsy AI", tagline: "Save & Share places you love.\nDiscover more.", login: "Accedi", signup: "Registrati",
    firstName: "Nome", lastName: "Cognome", email: "Email", password: "Password",
    connect: "Accedi", create: "Crea account",
    forgot: "Password dimenticata?", resetTitle: "Reimposta", resetBtn: "Invia link",
    resetSent: "✓ Link inviato! Controlla la tua email.", backToLogin: "← Indietro",
    errorLogin: "Email o password non corretti.",
    errorNoAccount: "Nessun account trovato per questo indirizzo email.",
    errorWrongPassword: "Password non corretta.",
    errorSignup: "Errore durante la registrazione.",
    errorDuplicate: "Questa email è già registrata. Prova ad accedere o usa un altro indirizzo.",
    errorPasswordShort: "La password deve contenere almeno 6 caratteri.",
    errorPasswordWeak: "La password deve contenere almeno una minuscola, una maiuscola e un numero.",
    errorEmail: "Indirizzo email non valido.",
    errorName: "Nome e cognome richiesti.", welcome: "Benvenuto su Outsy AI!" },
  pt: { logo: "Outsy AI", tagline: "Save & Share places you love.\nDiscover more.", login: "Entrar", signup: "Registar",
    firstName: "Nome", lastName: "Apelido", email: "Email", password: "Palavra-passe",
    connect: "Entrar", create: "Criar conta",
    forgot: "Esqueceu a palavra-passe?", resetTitle: "Redefinir", resetBtn: "Enviar link",
    resetSent: "✓ Link enviado! Verifique o email.", backToLogin: "← Voltar",
    errorLogin: "Email ou palavra-passe incorretos.",
    errorNoAccount: "Nenhuma conta encontrada para este endereço de email.",
    errorWrongPassword: "Palavra-passe incorreta.",
    errorSignup: "Erro no registo.",
    errorDuplicate: "Este email já está registado. Tente entrar ou use outro endereço.",
    errorPasswordShort: "A palavra-passe deve ter pelo menos 6 caracteres.",
    errorPasswordWeak: "A palavra-passe deve conter pelo menos uma minúscula, uma maiúscula e um número.",
    errorEmail: "Endereço de email inválido.",
    errorName: "Nome e apelido obrigatórios.", welcome: "Bem-vindo ao Outsy AI!" },
  nl: { logo: "Outsy AI", tagline: "Save & Share places you love.\nDiscover more.", login: "Inloggen", signup: "Registreren",
    firstName: "Voornaam", lastName: "Achternaam", email: "Email", password: "Wachtwoord",
    connect: "Inloggen", create: "Account maken",
    forgot: "Wachtwoord vergeten?", resetTitle: "Herstellen", resetBtn: "Link versturen",
    resetSent: "✓ Link verstuurd! Controleer je email.", backToLogin: "← Terug",
    errorLogin: "Onjuist email of wachtwoord.",
    errorNoAccount: "Geen account gevonden voor dit e-mailadres.",
    errorWrongPassword: "Onjuist wachtwoord.",
    errorSignup: "Fout bij registratie.",
    errorDuplicate: "Dit email is al geregistreerd. Probeer in te loggen of gebruik een ander adres.",
    errorPasswordShort: "Het wachtwoord moet minimaal 6 tekens bevatten.",
    errorPasswordWeak: "Het wachtwoord moet minstens één kleine letter, één hoofdletter en één cijfer bevatten.",
    errorEmail: "Ongeldig e-mailadres.",
    errorName: "Voor- en achternaam vereist.", welcome: "Welkom bij Outsy AI!" },
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

  const at = AUTH_T["en"];
  // Auth page always in English for international audience

  // Detect return from email confirmation
  // App.jsx cleans the hash before Auth mounts, so we read the sessionStorage flag instead
  useEffect(() => {
    try {
      if (sessionStorage.getItem("outsy_email_confirmed")) {
        setSuccess(at.emailConfirmed || "✓ Email confirmed! You can now sign in.");
        setMode("login");
        sessionStorage.removeItem("outsy_email_confirmed");
      }
    } catch {}
  }, []);

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
      if (error) {
        console.log("Login error:", error.status, error.message);
        const msg = error.message?.toLowerCase() || "";
        if (msg.includes("not confirmed") || msg.includes("confirm")) {
          setError(at.errorNotConfirmed);
        } else {
          // Auth failed — check profiles to give a specific error message
          const { data: existingProfile } = await supabase
            .from('profiles')
            .select('user_id')
            .eq('email', email.trim().toLowerCase())
            .maybeSingle();

          if (existingProfile) {
            // Profile exists → email is known → wrong password
            setError(at.errorWrongPassword);
          } else {
            // No profile found → email unknown
            setError(at.errorNoAccount);
          }
        }
      }
    } else {
      if (!firstName.trim() || !lastName.trim()) { setError(at.errorName); setLoading(false); return; }
      if (password.length < 6) { setError(at.errorPasswordShort); setLoading(false); return; }
      if (!/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) { setError(at.errorPasswordWeak); setLoading(false); return; }
      const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { first_name: firstName, last_name: lastName } } });
      if (error) {
        console.log("Signup error:", error.status, error.message);
        const msg = error.message?.toLowerCase() || "";
        if (msg.includes("already") || msg.includes("exists") || msg.includes("registered") || msg.includes("unique")) {
          setError(at.errorDuplicate);
        } else if (msg.includes("password")) {
          setError(at.errorPasswordWeak);
        } else if (msg.includes("invalid") || msg.includes("not valid")) {
          setError(at.errorEmail);
        } else {
          setError(error.message || at.errorSignup);
        }
      }
      else if (data.user && data.user.identities && data.user.identities.length === 0) {
        // Supabase returns empty identities when email already exists (no error thrown)
        setError(at.errorDuplicate);
      }
      else {
        if (data.user) {
          // Always try to create profile (works if RLS allows, otherwise App.jsx handles it on first login)
          try {
            await supabase.from('profiles').upsert({ user_id: data.user.id, email, first_name: firstName, last_name: lastName });
          } catch {}
          try { await fetch("/api/notify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ firstName, lastName, email, userId: data.user.id }) }); } catch {}
        }
        setSuccess(at.signupSuccess.replace("{name}", firstName));
        setTimeout(() => setMode("login"), 3000);
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
            <form onSubmit={e=>{e.preventDefault();handle();}} style={{display:"flex",flexDirection:"column",gap:16}}>
              <div style={{fontFamily:"'Cormorant Garamond', serif", fontSize:20, color:COLORS.accent, fontStyle:"italic"}}>{at.resetTitle}</div>
              <div className="auth-field"><label>{at.email}</label><input type="email" placeholder="you@email.com" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" /></div>
              {error && <div className="auth-error">{error}</div>}
              {success && <div className="auth-success">{success}</div>}
              {!success && <button type="submit" className="auth-btn" disabled={loading || !email}>{loading ? "..." : at.resetBtn}</button>}
              <button type="button" className="auth-link" onClick={() => { setMode("login"); setError(""); setSuccess(""); }}>{at.backToLogin}</button>
            </form>
          ) : (
            <form onSubmit={e=>{e.preventDefault();handle();}} autoComplete="on" style={{display:"flex",flexDirection:"column",gap:16}}>
              <div className="auth-tabs">
                <button type="button" className={`auth-tab ${mode==="login"?"active":""}`} onClick={() => { setMode("login"); setError(""); setSuccess(""); }}>{at.login}</button>
                <button type="button" className={`auth-tab ${mode==="signup"?"active":""}`} onClick={() => { setMode("signup"); setError(""); setSuccess(""); }}>{at.signup}</button>
              </div>
              {mode === "signup" && (
                <div className="auth-row">
                  <div className="auth-field"><label>{at.firstName}</label><input placeholder="John" value={firstName} onChange={e => setFirstName(e.target.value)} autoComplete="given-name" /></div>
                  <div className="auth-field"><label>{at.lastName}</label><input placeholder="Smith" value={lastName} onChange={e => setLastName(e.target.value)} autoComplete="family-name" /></div>
                </div>
              )}
              <div className="auth-field"><label>{at.email}</label><input type="email" placeholder="you@email.com" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" /></div>
              <div className="auth-field"><label>{at.password}</label><input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} autoComplete={mode==="login"?"current-password":"new-password"} /></div>
              {error && <div className="auth-error">{error}</div>}
              {success && <div className="auth-success">{success}</div>}
              <button type="submit" className="auth-btn" disabled={loading || !email || !password}>
                {loading ? "..." : mode === "login" ? at.connect : at.create}
              </button>
              {mode === "login" && <button type="button" className="auth-link" onClick={() => { setMode("reset"); setError(""); setSuccess(""); }}>{at.forgot}</button>}
            </form>
          )}
        </div>
      </div>
    </>
  );
}
