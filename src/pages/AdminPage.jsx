import { useCallback, useEffect, useState } from "react";
import AdminDashboard from "../admin/AdminDashboard.jsx";
import { supabase } from "../lib/supabase.js";
export default function AdminPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [signingIn, setSigningIn] = useState(false);
  const [error, setError] = useState("");
  const [authed, setAuthed] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  const verifyAdminUser = useCallback(async () => {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) return false;

    const { data, error: adminError } = await supabase
      .from("admin_users")
      .select("user_id")
      .eq("user_id", userData.user.id)
      .maybeSingle();

    return !adminError && Boolean(data);
  }, []);

  const verifySession = useCallback(async () => {
    setCheckingSession(true);
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      setAuthed(false);
      setCheckingSession(false);
      return;
    }

    const isAdmin = await verifyAdminUser();
    if (isAdmin) {
      setAuthed(true);
    } else {
      await supabase.auth.signOut();
      setAuthed(false);
      setError("This account is not authorized for admin access.");
    }
    setCheckingSession(false);
  }, [verifyAdminUser]);

  useEffect(() => {
    const task = setTimeout(verifySession, 0);
    return () => clearTimeout(task);
  }, [verifySession]);

  async function handleLogin(e) {
    e.preventDefault();
    setSigningIn(true);
    setError("");

    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    if (err) {
      setError(err.message);
      setSigningIn(false);
      return;
    }

    const isAdmin = await verifyAdminUser();
    if (isAdmin) {
      setAuthed(true);
    } else {
      await supabase.auth.signOut();
      setAuthed(false);
      setError("This account is not authorized for admin access.");
    }
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
          {checkingSession && (
            <p className="font-mono" style={{ color: "var(--text-muted)", fontSize: 11, letterSpacing: "0.18em", marginBottom: 16 }}>
              CHECKING SESSION...
            </p>
          )}
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

