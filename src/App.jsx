import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://bmasldizsbbgvrrdsfek.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJtYXNsZGl6c2JiZ3ZycmRzZmVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcxODA1MTksImV4cCI6MjA5Mjc1NjUxOX0.kvUbduSCcfqixg8zUqU27O3cWdw63jOlePxIe26cUVw";
const WHATSAPP_NUMBER = "254734944512";
const FIXED_PRICE = 1500;
const BUCKET_NAME = "products-images";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function getImageUrl(path) {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/${path}`;
}

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
      setDebug(data?.length ? `OK: ${data.length} products` : "No products");
    } catch (err) {
      setDebug("Error: " + err.message);
    }
  }

  function createWhatsAppLink(p) {
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent("Hi Gorosei, I want: " + p.Name)}`;
  }

  return (
    <div style={{ background: "#000", color: "#fff", minHeight: "100vh", fontFamily: "monospace" }}>
      <nav style={{ padding: 16, display: "flex", justifyContent: "space-between" }}>
        <span>GOROSEI</span>
        <a href="/admin" style={{ color: "#666" }}>ADMIN</a>
      </nav>
      <header style={{ padding: 80, borderBottom: "1px solid #333" }}>
        <h1 style={{ fontSize: 60 }}>GOROSEI<br/>KENYA</h1>
        <p style={{ color: "#666" }}>{FIXED_PRICE} KES</p>
      </header>
      <main style={{ padding: 16 }}>
        <p style={{ color: "#f0f", marginBottom: 16 }}>{debug}</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 1, background: "#333" }}>
          {products.map((p) => (
            <div key={p.id} style={{ background: "#000" }}>
              <div style={{ aspectRatio: 1, background: "#111" }}>
                {p.Image_url && <img src={getImageUrl(p.Image_url)} alt={p.Name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
              </div>
              <div style={{ padding: 16 }}>
                <p>{p.Name}</p>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12 }}>
                  <span>{FIXED_PRICE}</span>
                  <a href={createWhatsAppLink(p)} style={{ background: "#fff", color: "#000", padding: "8px 16px" }}>BUY</a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

function AdminPage() {
  const [name, setName] = useState("");
  const [size, setSize] = useState("M");
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [url, setUrl] = useState("");
  const [imageMode, setImageMode] = useState("file"); // "file" or "url"
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");
  const [products, setProducts] = useState([]);

  useEffect(() => { fetchProducts(); }, []);

  function handleFileChange(e) {
    const f = e.target.files?.[0];
    setFile(f);
    setPreview(f ? URL.createObjectURL(f) : null);
    setUrl(""); // Clear URL when file is selected
  }

  function handleUrlChange(e) {
    setUrl(e.target.value);
    setFile(null); // Clear file when URL is entered
    setPreview(null);
  }

  function toggleMode(mode) {
    setImageMode(mode);
    setFile(null);
    setPreview(null);
    setUrl("");
  }

  async function handleAdd() {
    if (!name) { setStatus("Name required"); return; }
    if (imageMode === "url" && !url) { setStatus("URL required"); return; }
    if (imageMode === "file" && !file) { setStatus("File required"); return; }
    
    setSaving(true);
    setStatus(imageMode === "url" ? "Saving..." : "Uploading...");
    
    try {
      let imagePath;
      
      if (imageMode === "url") {
        // For URL mode, skip storage and use URL directly
        imagePath = url.trim();
        
        const { error: err2 } = await supabase.from("products for Gorosei").insert({
          Name: name.trim(),
          Price: FIXED_PRICE,
          size,
          Image_url: imagePath,
          sold: false
        });
        
        if (err2) {
          throw new Error("DB: " + err2.message);
        }
      } else {
        // File upload mode
        const fileName = `img_${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
        console.log("Uploading:", fileName);
        
        const { data, error } = await supabase.storage.from(BUCKET_NAME).upload(fileName, file);
        
        if (error) {
          console.error("Storage error:", error);
          throw new Error("Storage: " + error.message);
        }
        
        imagePath = data.path;
        
        const { error: err2 } = await supabase.from("products for Gorosei").insert({
          Name: name.trim(),
          Price: FIXED_PRICE,
          size,
          Image_url: imagePath,
          sold: false
        });
        
        if (err2) {
          console.error("DB error:", err2);
          throw new Error("DB: " + err2.message);
        }
      }
      
      setStatus("Done!");
      setName("");
      setFile(null);
      setPreview(null);
      setUrl("");
      fetchProducts();
    } catch (err) {
      console.error("Full error:", err);
      setStatus("Error: " + err.message);
    } finally {
      setSaving(false);
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
      <h1>ADMIN</h1>
      <div>
        <h2>ADD DROP</h2>
        
        {/* Toggle Buttons */}
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <button 
            onClick={() => toggleMode("file")} 
            style={{ 
              flex: 1, 
              padding: 12, 
              background: imageMode === "file" ? "#fff" : "#111", 
              color: imageMode === "file" ? "#000" : "#666",
              border: "1px solid #333",
              cursor: "pointer"
            }}
          >
            UPLOAD FILE
          </button>
          <button 
            onClick={() => toggleMode("url")} 
            style={{ 
              flex: 1, 
              padding: 12, 
              background: imageMode === "url" ? "#fff" : "#111", 
              color: imageMode === "url" ? "#000" : "#666",
              border: "1px solid #333",
              cursor: "pointer"
            }}
          >
            PASTE URL
          </button>
        </div>
        
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="NAME" style={{ display: "block", width: "100%", padding: 14, margin: "8px 0", background: "#111", border: "1px solid #333", color: "#fff" }} />
        
        <div style={{ display: "flex", gap: 8 }}>
          <select value={size} onChange={(e) => setSize(e.target.value)} style={{ padding: 14, background: "#111", border: "1px solid #333", color: "#fff" }}>
            <option value="S">S</option>
            <option value="M">M</option>
            <option value="L">L</option>
            <option value="XL">XL</option>
            <option value="OS">OS</option>
          </select>
          
          {imageMode === "file" ? (
            <label style={{ flex: 1, padding: 14, background: "#111", border: "1px solid #333", color: "#666", cursor: "pointer", display: "flex", alignItems: "center" }}>
              {file ? file.name : "CHOOSE IMAGE"}
              <input type="file" accept="image/*" onChange={handleFileChange} style={{ display: "none" }} />
            </label>
          ) : (
            <input 
              value={url} 
              onChange={handleUrlChange} 
              placeholder="IMAGE URL (https://...)" 
              style={{ flex: 1, padding: 14, background: "#111", border: "1px solid #333", color: "#fff" }} 
            />
          )}
        </div>
        
        {preview && <img src={preview} style={{ width: 100, height: 100, marginTop: 12, objectFit: "cover" }} />}
        
        <button onClick={handleAdd} disabled={saving} style={{ width: "100%", padding: 16, marginTop: 12, background: "#fff", color: "#000", border: "none", cursor: "pointer" }}>
          {saving ? "..." : `ADD (${FIXED_PRICE} KES)`}
        </button>
        {status && <p style={{ color: "#f0f", marginTop: 12 }}>{status}</p>}
      </div>
      <div>
        <h2>STOCK ({products.length})</h2>
        {products.map((p) => (
          <div key={p.id} style={{ display: "flex", gap: 12, padding: 12, background: "#111", marginBottom: 8 }}>
            <img src={getImageUrl(p.Image_url)} style={{ width: 50, height: 50, objectFit: "cover", background: "#222" }} />
            <div style={{ flex: 1 }}>
              <p>{p.Name}</p>
              <p style={{ color: "#666" }}>{p.size} {FIXED_PRICE}</p>
              <span style={{ color: p.sold ? "#f00" : "#0f0" }}>{p.sold ? "SOLD" : "AVAIL"}</span>
            </div>
            <div>
              {!p.sold && <button onClick={() => markSold(p.id)} style={{ border: "1px solid #0f0", color: "#0f0", background: "none", padding: "6px 10px" }}>SOLD</button>}
              <button onClick={() => deleteProduct(p.id)} style={{ border: "1px solid #f00", color: "#f00", background: "none", padding: "6px 10px" }}>DEL</button>
            </div>
          </div>
        ))}
      </div>
      <a href="/" style={{ display: "block", marginTop: 32, color: "#666" }}>STORE</a>
    </div>
  );
}