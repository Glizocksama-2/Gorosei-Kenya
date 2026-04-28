import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://bmasldizsbbgvrrdsfek.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJtYXNsZGl6c2JiZ3ZycmRzZmVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcxODA1MTksImV4cCI6MjA5Mjc1NjUxOX0.kvUbduSCcfqixg8zUqU27O3cWdw63jOlePxIe26cUVw";
const WHATSAPP_NUMBER = "254734944512";
const FIXED_PRICE = 1500;
const BUCKET_NAME = "products-images";

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
      setProducts(data || []);
      setDebug(data && data.length > 0 ? "OK: " + data.length + " products" : "No products");
    } catch (err) {
      setDebug("Error: " + err.message);
    }
  }

  function getImageUrl(path) {
    if (!path) return null;
    if (path.startsWith("http")) return path;
    return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/${path}`;
  }

  function createWhatsAppLink(product) {
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent("Hi Gorosei, I want: " + product.Name)}`;
  }

  return (
    <div style={{ background: "#000", color: "#fff", minHeight: "100vh", fontFamily: "monospace" }}>
      <nav style={{ padding: 16, display: "flex", justifyContent: "space-between", borderBottom: "1px solid #333" }}>
        <span style={{ fontWeight: "bold", letterSpacing: "4px" }}>GOROSEI</span>
        <a href="/admin" style={{ color: "#666" }}>ADMIN</a>
      </nav>
      <header style={{ padding: "80px 16px", borderBottom: "1px solid #333" }}>
        <h1 style={{ fontSize: "clamp(40px, 15vw, 100px)", margin: 0, lineHeight: 1 }}>GOROSEI<br/>KENYA</h1>
        <p style={{ color: "#666", marginTop: 16, letterSpacing: "2px" }}>STREETWEAR // {FIXED_PRICE} KES</p>
      </header>
      
      <main style={{ padding: 16 }}>
        <p style={{ color: "#f0f", background: "#222", padding: 16, marginBottom: 16, fontSize: 12 }}>{debug}</p>
      
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 1, background: "#333" }}>
          {products.map((p) => (
            <div key={p.id} style={{ background: "#000", padding: 0 }}>
              <div style={{ aspectRatio: "1", background: "#111", position: "relative" }}>
                {p.Image_url ? (
                  <img src={getImageUrl(p.Image_url)} alt={p.Name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#666" }}>NO IMG</div>
                )}
                <span style={{ position: "absolute", top: 12, left: 12, background: "#fff", color: "#000", padding: "4px 8px", fontSize: 10, fontWeight: "bold" }}>{p.size || "OS"}</span>
              </div>
              <div style={{ padding: 16 }}>
                <p style={{ margin: "0 0 12px", fontSize: 14 }}>{p.Name}</p>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontWeight: "bold" }}>KSh {FIXED_PRICE}</span>
                  <a href={createWhatsAppLink(p)} style={{ background: "#fff", color: "#000", padding: "8px 16px", fontSize: 11, fontWeight: "bold" }}>BUY</a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      <footer style={{ padding: 48, borderTop: "1px solid #333", textAlign: "center", color: "#666", fontSize: 12 }}>
        <p>GOROSEI // KENYA</p>
        <p>WA: {WHATSAPP_NUMBER}</p>
        <p>©2026</p>
      </footer>
    </div>
  );
}

function AdminPage() {
  const [name, setName] = useState("");
  const [size, setSize] = useState("M");
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState("");
  const [products, setProducts] = useState([]);

  useEffect(() => {
    fetchProducts();
  }, []);

  function handleFileChange(e) {
    const f = e.target.files[0];
    if (f) {
      setFile(f);
      setPreview(URL.createObjectURL(f));
    }
  }

  async function handleAdd() {
    if (!name || !file) { setStatus("Fill name + select image"); return; }
    setUploading(true);
    setStatus("Uploading...");
    try {
      const fileName = `${Date.now()}-${file.name}`;
      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(fileName, file);
      
      if (error) throw error;
      
      await supabase.from("products for Gorosei").insert({
        Name: name,
        Price: FIXED_PRICE,
        size,
        Image_url: data.path,
        sold: false
      });
      
      setStatus("Done!");
      setName("");
      setFile(null);
      setPreview("");
      fetchProducts();
    } catch (err) {
      setStatus("Error: " + err.message);
    } finally {
      setUploading(false);
    }
  }

  async function fetchProducts() {
    const { data } = await supabase.from("products for Gorosei").select("*").order("created_at", { ascending: false });
    setProducts(data || []);
  }

  async function markSold(id) {
    await supabase.from("products for Gorosei").update({ sold: true }).eq("id", id);
    fetchProducts();
  }

  async function deleteProduct(id) {
    await supabase.from("products for Gorosei").delete().eq("id", id);
    fetchProducts();
  }

  return (
    <div style={{ padding: 20, background: "#000", color: "#fff", fontFamily: "monospace" }}>
      <h1 style={{ marginBottom: 24 }}>ADMIN</h1>
      
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 16, marginBottom: 12 }}>ADD DROP</h2>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="PRODUCT NAME" style={{ display: "block", width: "100%", padding: 14, margin: "8px 0", background: "#111", border: "1px solid #333", color: "#fff", fontSize: 12, fontFamily: "inherit" }} />
        
        <div style={{ display: "flex", gap: 8 }}>
          <select value={size} onChange={(e) => setSize(e.target.value)} style={{ padding: 14, background: "#111", border: "1px solid #333", color: "#fff", fontSize: 12, fontFamily: "inherit" }}>
            <option value="S">S</option>
            <option value="M">M</option>
            <option value="L">L</option>
            <option value="XL">XL</option>
            <option value="OS">OS</option>
          </select>
          <label style={{ flex: 1, padding: 14, background: "#111", border: "1px solid #333", color: "#666", fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center" }}>
            {file ? file.name : "CHOOSE IMAGE"}
            <input type="file" accept="image/*" onChange={handleFileChange} style={{ display: "none" }} />
          </label>
        </div>
        
        {preview && (
          <img src={preview} alt="Preview" style={{ width: 100, height: 100, marginTop: 12, objectFit: "cover" }} />
        )}
        
        <button onClick={handleAdd} disabled={uploading} style={{ width: "100%", padding: 16, marginTop: 12, background: "#fff", color: "#000", border: "none", fontSize: 12, fontWeight: "bold", cursor: "pointer" }}>
          {uploading ? "UPLOADING..." : `ADD (${FIXED_PRICE} KES)`}
        </button>
        {status && <p style={{ marginTop: 12, color: "#f0f" }}>{status}</p>}
      </div>

      <div>
        <h2 style={{ fontSize: 16, marginBottom: 12 }}>STOCK ({products.length})</h2>
        {products.map((p) => (
          <div key={p.id} style={{ display: "flex", gap: 12, padding: 12, background: "#111", marginBottom: 8 }}>
            <img src={getImageUrl(p.Image_url)} alt={p.Name} style={{ width: 50, height: 50, objectFit: "cover", background: "#222" }} />
            <div style={{ flex: 1 }}>
              <p style={{ margin: "0 0 4px", fontSize: 13 }}>{p.Name}</p>
              <p style={{ margin: 0, fontSize: 11, color: "#666" }}>{p.size} // {FIXED_PRICE} KES</p>
              <span style={{ fontSize: 10, color: p.sold ? "#f00" : "#0f0" }}>{p.sold ? "SOLD" : "AVAIL"}</span>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              {!p.sold && <button onClick={() => markSold(p.id)} style={{ border: "1px solid #0f0", color: "#0f0", background: "none", padding: "6px 10px", fontSize: 10 }}>SOLD</button>}
              <button onClick={() => deleteProduct(p.id)} style={{ border: "1px solid #f00", color: "#f00", background: "none", padding: "6px 10px", fontSize: 10 }}>DEL</button>
            </div>
          </div>
        ))}
      </div>

      <a href="/" style={{ display: "block", marginTop: 32, color: "#666" }}>STORE</a>
    </div>
  );
}