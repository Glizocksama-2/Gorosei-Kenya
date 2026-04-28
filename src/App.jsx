import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://bmasldizsbbgvrrdsfek.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJtYXNsZGl6c2JiZ3ZycmRzZmVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcxODA1MTksImV4cCI6MjA5Mjc1NjUxOX0.kvUbduSCcfqixg8zUqU27O3cWdw63jOlePxIe26cUVw";
const WHATSAPP_NUMBER = "254734944512";
const FIXED_PRICE = 1500;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export default function App() {
  const path = window.location.pathname.toLowerCase();
  if (path === "/admin" || path === "/admin.html") return <AdminPage />;
  return <CustomerPage />;
}

function CustomerPage() {
  const [products, setProducts] = useState([]);
  const [debug, setDebug] = useState("Loading...");

  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    try {
      const { data, error } = await supabase.from("products for Gorosei").select("*").order("created_at", { ascending: false });
      if (error) {
        setDebug("ERROR: " + error.message);
        return;
      }
      const available = (data || []).filter(p => p.sold !== true);
      setProducts(available);
      setDebug(available.length > 0 ? "OK: " + available.length + " products" : "No products found");
    } catch (err) {
      setDebug("EXCEPTION: " + err.message);
    }
  }

  function createWhatsAppLink(product) {
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent("Hi Gorosei, I want: " + product.Name)}`;
  }

  return (
    <div style={{ background: "#000", color: "#fff", minHeight: "100vh", fontFamily: "monospace" }}>
      <nav style={{ padding: 16, display: "flex", justifyContent: "space-between", borderBottom: "1px solid #333" }}>
        <span>GOROSEI</span>
        <a href="/admin" style={{ color: "#666" }}>ADMIN</a>
      </nav>
      <h1 style={{ padding: 40, fontSize: 48 }}>GOROSEI<br/>KENYA</h1>
      <p style={{ color: "#666", padding: "0 16px" }}>1500 KES</p>
      
      <div style={{ padding: 16 }}>
        <p style={{ color: "#f0f", background: "#222", padding: 16, marginBottom: 16 }}>{debug}</p>
      </div>
      
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 1, background: "#333" }}>
        {products.map((p) => (
          <div key={p.id} style={{ background: "#000", padding: 16 }}>
            <img src={p.Image_url} alt={p.Name} style={{ width: "100%", aspectRatio: "1", objectFit: "cover" }} />
            <p style={{ margin: "8px 0" }}>{p.Name}</p>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>1500 KES</span>
              <a href={createWhatsAppLink(p)} style={{ background: "#fff", color: "#000", padding: "8px 16px" }}>BUY</a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AdminPage() {
  const [name, setName] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [status, setStatus] = useState("");
  
  async function handleAdd() {
    if (!name || !imageUrl) { setStatus("Fill name + URL"); return; }
    setStatus("Adding...");
    try {
      await supabase.from("products for Gorosei").insert({ Name: name, Price: FIXED_PRICE, Image_url: imageUrl, sold: false });
      setStatus("Done!");
    } catch (err) { setStatus("Error: " + err.message); }
  }
  
  return (
    <div style={{ padding: 20, background: "#000", color: "#fff", fontFamily: "monospace" }}>
      <h1>ADMIN</h1>
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Product Name" style={{ display: "block", width: "100%", padding: 12, margin: "8px 0", background: "#111", border: "1px solid #333", color: "#fff" }} />
      <input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="Image URL" style={{ display: "block", width: "100%", padding: 12, margin: "8px 0", background: "#111", border: "1px solid #333", color: "#fff" }} />
      <button onClick={handleAdd} style={{ width: "100%", padding: 16, background: "#fff", color: "#000", border: "none" }}>ADD (1500 KES)</button>
      <p style={{ marginTop: 16, color: "#f0f" }}>{status}</p>
      <a href="/" style={{ display: "block", marginTop: 16, color: "#666" }}>STORE</a>
    </div>
  );
}