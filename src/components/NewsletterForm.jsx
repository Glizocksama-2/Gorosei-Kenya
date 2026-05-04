import { useState } from "react";
import { supabase } from "../lib/supabase.js";

export default function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("");
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email.includes("@")) { setStatus("Enter a valid email."); return; }
    setStatus("...");
    try {
      const { error } = await supabase
        .from("newsletter")
        .insert({ email: email.trim(), created_at: new Date().toISOString() });

      if (error) { setStatus("Error. Try again."); return; }

      setSubmitted(true);
      setStatus("You're in!");
    } catch {
      setStatus("Error. Try again.");
    }
  }

  if (submitted) {
    return (
      <div style={{ marginTop: 48, padding: 32, border: "1px solid var(--crimson)", display: "inline-block" }}>
        <p className="font-display" style={{ fontSize: 24 }}>WELCOME TO THE BROTHERHOOD</p>
        <p className="font-mono" style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 8 }}>
          We'll reach you via email.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ marginTop: 48 }}>
      <div style={{ display: "flex", gap: 0, maxWidth: 480, flexWrap: "wrap" }}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Your email"
          required
          style={{
            flex: "1 1 260px",
            padding: "16px 20px",
            background: "var(--surface)",
            border: "1px solid var(--surface-light)",
            borderRight: "none",
            color: "var(--text)",
            fontFamily: "var(--font-mono)",
            fontSize: 12,
            outline: "none",
            minWidth: 0,
          }}
        />
        <button
          type="submit"
          style={{
            padding: "16px 24px",
            background: "var(--crimson)",
            border: "none",
            color: "#fff",
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            letterSpacing: "0.2em",
            cursor: "pointer",
            whiteSpace: "nowrap",
          }}
        >
          JOIN
        </button>
      </div>
      {status && (
        <p className="font-mono" style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 12 }}>
          {status}
        </p>
      )}
    </form>
  );
}

