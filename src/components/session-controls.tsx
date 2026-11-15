"use client";
import { signIn, signOut } from "next-auth/react";
import { useEffect, useState } from "react";
function rememberNotice(value: "login" | "logout") {
  try { sessionStorage.setItem("kareghar-auth-notice", value); } catch { /* Navigation must work when browser storage is disabled. */ }
}
export function Logout({ label, hi = false }: { label: string; hi?: boolean }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(false);
  return <><button type="button" disabled={pending} onClick={async () => {
    setPending(true);
    setError(false);
    try {
      const result = await signOut({ redirect: false, callbackUrl: "/" });
      rememberNotice("logout");
      window.location.assign(result.url || "/");
    } catch {
      setError(true);
    } finally {
      setPending(false);
    }
  }}>{label}</button>{error && <p role="alert">{hi ? "लॉग आउट नहीं हो सका। फिर प्रयास करें।" : "Could not log out. Please try again."}</p>}</>;
}
export function AuthNotice({ hi }: { hi: boolean }) {
  const [notice, setNotice] = useState<"login" | "logout" | null>(null);
  useEffect(() => {
    let value: string | null;
    try {
      value = sessionStorage.getItem("kareghar-auth-notice");
      sessionStorage.removeItem("kareghar-auth-notice");
    } catch { return; }
    if (value !== "login" && value !== "logout") return;
    setNotice(value);
    const timer = window.setTimeout(() => setNotice(null), 5000);
    return () => window.clearTimeout(timer);
  }, []);
  if (!notice) return null;
  return <div className="auth-notice" role="status">
    <span aria-hidden="true">✓</span>
    <span>{notice === "login" ? (hi ? "आप लॉग इन हो गए हैं।" : "You are logged in.") : (hi ? "आप लॉग आउट हो गए हैं।" : "You are logged out.")}</span>
    <button type="button" onClick={() => setNotice(null)} aria-label={hi ? "संदेश बंद करें" : "Dismiss message"}>×</button>
  </div>;
}
export function Login({ hi, onboarding = false }: { hi: boolean; onboarding?: boolean }) {
  const [error, setError] = useState(false),
    [pending, setPending] = useState(false);
  return (
    <form
      method="post" className="stack"
      onSubmit={async (e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        setPending(true);
        setError(false);
        try {
          const result = await signIn("credentials", {
            username: data.get("username"),
            password: data.get("password"),
            redirect: false,
          });
          if (result?.ok) {
            rememberNotice("login");
            window.location.assign(onboarding ? "/profile?tab=portfolio&onboarding=1" : "/");
          }
          else setError(true);
        } catch {
          setError(true);
        } finally {
          setPending(false);
        }
      }}
    >
      <label>
        {hi ? "उपयोगकर्ता नाम" : "Username"}
        <input name="username" required autoComplete="username" autoCapitalize="none" spellCheck={false} maxLength={40} />
      </label>
      <label>
        {hi ? "पासवर्ड" : "Password"}
        <input
          name="password"
          type="password"
          required
          maxLength={128}
          autoComplete="current-password"
        />
      </label>
      <button className="button" disabled={pending}>
        {pending ? (hi ? "लॉग इन हो रहा है…" : "Logging in…") : (hi ? "लॉग इन करें" : "Log in")}
      </button>
      {error && (
        <p role="alert">
          {hi
            ? "लॉग इन विफल। जानकारी जाँचें या कुछ देर बाद प्रयास करें।"
            : "Login failed. Check your details or try again later."}
        </p>
      )}
    </form>
  );
}
