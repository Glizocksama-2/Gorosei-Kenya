import { Component } from "react";

export default class RouteErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidUpdate(prevProps) {
    if (prevProps.routeKey !== this.props.routeKey && this.state.error) {
      this.setState({ error: null });
    }
  }

  componentDidCatch(error, info) {
    console.error("Route render failed:", error, info);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div
        style={{
          minHeight: "100vh",
          background: "var(--bg)",
          color: "var(--text)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
          textAlign: "center",
        }}
      >
        <div style={{ maxWidth: 460 }}>
          <p
            className="font-mono"
            style={{
              color: "var(--crimson)",
              fontSize: 10,
              letterSpacing: "0.28em",
              marginBottom: 18,
            }}
          >
            PAGE RECOVERY
          </p>
          <h1 className="font-display" style={{ fontSize: "clamp(42px, 12vw, 76px)", lineHeight: 0.9 }}>
            THE PAGE DIDN'T LOAD
          </h1>
          <p
            className="font-mono"
            style={{
              color: "var(--text-muted)",
              fontSize: 12,
              lineHeight: 1.8,
              margin: "22px auto 0",
            }}
          >
            Refresh the page or head back to the drop. Your phone can still order directly on WhatsApp.
          </p>
          <div style={{ display: "flex", justifyContent: "center", gap: 10, flexWrap: "wrap", marginTop: 28 }}>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="font-mono"
              style={{
                padding: "13px 18px",
                background: "var(--crimson)",
                border: "1px solid var(--crimson)",
                color: "#fff",
                fontSize: 11,
                letterSpacing: "0.18em",
                cursor: "pointer",
              }}
            >
              RELOAD
            </button>
            <a
              href="/#drop"
              className="font-mono"
              style={{
                padding: "13px 18px",
                border: "1px solid var(--surface-light)",
                color: "var(--text)",
                textDecoration: "none",
                fontSize: 11,
                letterSpacing: "0.18em",
              }}
            >
              BACK TO DROP
            </a>
            <a
              href="https://wa.me/254734944512"
              className="font-mono"
              style={{
                padding: "13px 18px",
                border: "1px solid var(--surface-light)",
                color: "var(--text)",
                textDecoration: "none",
                fontSize: 11,
                letterSpacing: "0.18em",
              }}
            >
              WHATSAPP
            </a>
          </div>
        </div>
      </div>
    );
  }
}
