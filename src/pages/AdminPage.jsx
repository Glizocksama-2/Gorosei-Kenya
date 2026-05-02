import { useEffect, useState } from "react";
import AdminDashboard from "../admin/AdminDashboard.jsx";
import { supabase } from "../lib/supabase.js";
export default function AdminPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [signingIn, setSigningIn] = useState(false);
  const [error, setError] = useState("");
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setAuthed(true);
    });
  }, []);

  async function handleLogin(e) {
    e.preventDefault();
    setSigningIn(true);
    setError("");
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    if (err) { setError(err.message); }
    else { setAuthed(true); }
    setSigningIn(false);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    setAuthed(false);
  }

  if (!authed) {
    return (
      <div
        style={{
          background: "var(--bg)",
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
        }}
      >
        <div style={{ width: "100%", maxWidth: 400 }}>
          <p className="font-display" style={{ fontSize: 32, marginBottom: 40 }}>ADMIN</p>
          <form onSubmit={handleLogin}>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              required
              style={{
                width: "100%",
                padding: 16,
                background: "var(--surface)",
                border: "1px solid var(--surface-light)",
                color: "var(--text)",
                fontSize: 14,
                marginBottom: 12,
                boxSizing: "border-box",
                outline: "none",
              }}
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              required
              style={{
                width: "100%",
                padding: 16,
                background: "var(--surface)",
                border: "1px solid var(--surface-light)",
                color: "var(--text)",
                fontSize: 14,
                boxSizing: "border-box",
                outline: "none",
              }}
            />
            {error && (
              <p style={{ color: "var(--crimson)", marginTop: 12, fontSize: 12 }}>{error}</p>
            )}
            <button
              type="submit"
              disabled={signingIn}
              className="font-mono"
              style={{
                width: "100%",
                marginTop: 24,
                padding: 16,
                background: "var(--crimson)",
                border: "none",
                color: "#fff",
                fontSize: 12,
                letterSpacing: "0.2em",
                cursor: signingIn ? "not-allowed" : "pointer",
              }}
            >
              {signingIn ? "..." : "ENTER"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return <AdminDashboard onLogout={handleLogout} />;
}

