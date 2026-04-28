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

function getDirectImageUrl(url) {
  if (!url) return null;
  if (url.includes("drive.google.com")) {
    const match = url.match(/\/d\/([a-zA-Z0-9_-]+)\//);
    if (match) return `https://drive.google.com/uc?export=view&id=${match[1]}`;
  }
  return url;
}

function CustomerPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [debug, setDebug] = useState("");

  async function fetchProducts() {
    console.log("Fetching products...");
    console.log("URL:", SUPABASE_URL);
    
    try {
      const { data, error } = await supabase.from("products for Gorosei").select("*").order("created_at", { ascending: false });
      console.log("Raw data:", data);
      console.log("Error:", error);
      
      if (error) {
        setDebug("Query error: " + error.message);
      }
      
      // Show ALL products (sold=false OR undefined/null)
      setProducts((data || []).filter(p => p.sold !== true));
      setDebug(`Found ${data?.length || 0} products, showing ${products?.length || 0}`);
    } catch (err) {
      setDebug("Exception: " + err.message);
    }
    setLoading(false);
  }

  useEffect(() => { fetchProducts(); }, []);

  console.log("Debug:", debug);

  function createWhatsAppLink(product) {
    const msg = encodeURIComponent(`Hi Gorosei, I want: ${product.Name} (${product.size || 'OS'}) - KSh ${FIXED_PRICE}`);
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`;
  }

  return (
    <>
      <nav className="nav">
        <a href="/" className="logo">GOROSEI</a>
        <button className="menu-btn" onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? "CLOSE" : "MENU"}</button>
        {menuOpen && <div className="menu"><a href="#drops" onClick={() => setMenuOpen(false)}>DROPS</a><a href="/admin" onClick={() => setMenuOpen(false)}>ADMIN</a></div>}
      </nav>
      <header className="hero">
        <p className="hero-tag">[-_-]</p>
        <h1 className="hero-title">GOROSEI<br/>KENYA</h1>
        <p className="hero-sub">STREETWEAR // {FIXED_PRICE} KES</p>
      </header>
      <main id="drops">
        <div className="section-header"><span>[01]</span><h2>AVAILABLE</h2></div>
        {debug && <p className="debug">{debug}</p>}
        {loading && <div className="loader"></div>}
        {!loading && products.length === 0 && <div className="empty"><p>NO DROPS</p><p>8PM DAILY</p></div>}
        <div className="grid">
          {products.map((p) => (
            <div key={p.id} className="card">
              <div className="card-img">
                {p.Image_url ? <img src={getDirectImageUrl(p.Image_url)} alt={p.Name} loading="lazy" /> : <div className="no-img">NO IMG</div>}
                <span className="card-size">{p.size || 'OS'}</span>
              </div>
              <div className="card-body">
                <h3>{p.Name}</h3>
                <div className="card-footer"><span>KSh {FIXED_PRICE}</span><a href={createWhatsAppLink(p)} target="_blank">BUY</a></div>
              </div>
            </div>
          ))}
        </div>
      </main>
      <footer className="footer"><p>GOROSEI // KENYA</p><p>WA: {WHATSAPP_NUMBER}</p><p>©2026</p></footer>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&display=swap');
        *{margin:0;padding:0;box-sizing:border-box}:root{--bg:#000;--bg2:#0a0a0a;--text:#fff;--text2:#666;--line:#333}body{background:var(--bg);color:var(--text);font-family:'JetBrains Mono',monospace;min-height:100vh}a{color:inherit;text-decoration:none}
        .nav{display:flex;justify-content:space-between;padding:24px;position:fixed;top:0;left:0;right:0;background:rgba(0,0,0,0.95);z-index:100}.logo{font-size:14px;font-weight:700;letter-spacing:4px}.menu-btn{background:none;border:1px solid var(--line);color:var(--text);padding:8px 16px;font-family:inherit;font-size:11px;letter-spacing:2px;cursor:pointer}
        .menu{position:fixed;inset:0;background:var(--bg);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:24px;z-index:99}.menu a{font-size:24px;font-weight:700;letter-spacing:4px}
        .hero{min-height:100vh;display:flex;flex-direction:column;justify-content:center;padding:120px 24px 80px;border-bottom:1px solid var(--line)}.hero-tag{font-size:12px;color:var(--text2);margin-bottom:16px}.hero-title{font-size:clamp(40px,15vw,140px);font-weight:700;line-height:0.9;margin-bottom:24px}.hero-sub{font-size:14px;color:var(--text2);letter-spacing:4px}
        .section-header{display:flex;gap:16px;padding:48px 24px 24px;border-bottom:1px solid var(--line)}.section-header span{color:var(--text2);font-size:12px}.section-header h2{font-size:20px;font-weight:700;letter-spacing:2px}
        .grid{display:grid;grid-template-columns:repeat(2,1fr);gap:1px;background:var(--line)}@media(min-width:768px){.grid{grid-template-columns:repeat(4,1fr)}}.card{background:var(--bg)}.card-img{aspect-ratio:1;background:var(--bg2);position:relative;overflow:hidden}.card-img img{width:100%;height:100%;object-fit:cover}.no-img{width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:var(--text2);font-size:10px}.card-size{position:absolute;top:12px;left:12px;background:var(--text);color:var(--bg);font-size:9px;font-weight:700;padding:4px 8px}.card-body{padding:16px}.card-body h3{font-size:14px;font-weight:500;margin-bottom:12px}.card-footer{display:flex;justify-content:space-between;align-items:center}.card-footer span{font-size:14px;font-weight:700}.card-footer a{background:var(--text);color:var(--bg);font-size:11px;font-weight:700;padding:8px 16px}
        .loader{width:24px;height:24px;border:2px solid var(--line);border-top-color:var(--text);border-radius:50%;animation:spin 1s linear infinite;margin:60px auto}@keyframes spin{to{transform:rotate(360deg)}}.empty{text-align:center;padding:60px;color:var(--text2)}.empty p:first-child{font-size:20px;font-weight:700;margin-bottom:8px}
        .footer{padding:48px 24px;border-top:1px solid var(--line);text-align:center}.footer p{font-size:12px;letter-spacing:2px}.footer p:nth-child(2){color:var(--text2);margin:8px 0}.debug{color:#f0f;padding:16px;background:#222;border:1px solid #f0f;font-size:12px;margin:16px}
      `}</style>
    </>
  );
}

function AdminPage() {
  const [name, setName] = useState("");
  const [size, setSize] = useState("M");
  const [imageUrl, setImageUrl] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);

  function convertGoogleDriveLink(url) {
    if (!url) return "";
    const match = url.match(/\/d\/([a-zA-Z0-9_-]+)\//);
    if (match) return `https://drive.google.com/uc?export=view&id=${match[1]}`;
    return url;
  }

  async function handleAdd(e) {
    e.preventDefault();
    if (!name || !imageUrl) { setStatus("Fill name + image URL"); return; }
    setLoading(true);
    setStatus("Saving...");
    try {
      await supabase.from("products for Gorosei").insert({
        "Name": name,
        "Price": FIXED_PRICE,
        "size": size,
        "Image_url": convertGoogleDriveLink(imageUrl),
        "sold": false
      });
      setStatus("Done!");
      setName("");
      setImageUrl("");
      fetchProducts();
    } catch (err) { setStatus("Error: " + err.message); }
    finally { setLoading(false); }
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

  useEffect(() => { fetchProducts(); }, []);

  return (
    <>
      <nav className="nav"><a href="/" className="logo">GOROSEI</a><a href="/" className="menu-btn">STORE</a></nav>
      <main className="admin">
        <div className="section-header"><span>[01]</span><h2>ADD DROP</h2></div>
        <form onSubmit={handleAdd} className="form">
          <input placeholder="PRODUCT NAME" value={name} onChange={(e) => setName(e.target.value)} />
          <div className="form-row">
            <select value={size} onChange={(e) => setSize(e.target.value)}>
              <option value="S">S</option><option value="M">M</option><option value="L">L</option><option value="XL">XL</option><option value="OS">OS</option>
            </select>
            <input placeholder="GOOGLE DRIVE IMAGE LINK" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} />
          </div>
          <button type="submit" disabled={loading} className="btn">{loading ? "..." : `ADD (${FIXED_PRICE} KES)`}</button>
          {status && <p className="status">{status}</p>}
        </form>
        <div className="section-header"><span>[02]</span><h2>STOCK ({products.length})</h2></div>
        <div className="list">
          {products.map((p) => (
            <div key={p.id} className="item">
              <img src={getDirectImageUrl(p.Image_url)} alt={p.Name} />
              <div className="item-info"><p>{p.Name}</p><p>{p.size} // {FIXED_PRICE} KES</p><span className={p.sold ? "red" : "green"}>{p.sold ? "SOLD" : "AVAIL"}</span></div>
              <div className="item-actions">
                {!p.sold && <button onClick={() => markSold(p.id)} className="green">SOLD</button>}
                <button onClick={() => deleteProduct(p.id)} className="red">DEL</button>
              </div>
            </div>
          ))}
        </div>
      </main>
      <style>{`
        .admin{padding:100px 24px 48px;max-width:500px}.section-header{display:flex;gap:16px;margin-bottom:24px;padding-top:24px}.section-header span{color:var(--text2);font-size:12px}.section-header h2{font-size:18px;font-weight:700}
        .form{display:flex;flex-direction:column;gap:12px}.form-row{display:flex;gap:8px}input,select{background:var(--bg2);border:1px solid var(--line);color:var(--text);padding:14px;font-family:inherit;font-size:12px}input::placeholder{color:var(--text2)}.btn{background:var(--text);color:var(--bg);border:none;padding:16px;font-family:inherit;font-size:12px;font-weight:700;cursor:pointer}.status{color:var(--text);font-size:12px}
        .list{display:flex;flex-direction:column;gap:8px}.item{display:flex;gap:12px;background:var(--bg2);padding:12px;align-items:center}.item img{width:50px;height:50px;object-fit:cover}.item-info{flex:1}.item-info p:first-child{font-size:13px;margin-bottom:4px}.item-info p:nth-child(2){font-size:11px;color:var(--text2)}.green{color:#4ade80;font-size:10px}.red{color:#f87171;font-size:10px}.item-actions{display:flex;gap:8px}.item-actions button{background:none;border:1px solid var(--line);padding:6px 10px;font-size:10px;cursor:pointer}.item-actions .green{border-color:#4ade80;color:#4ade80}.item-actions .red{border-color:#f87171;color:#f87171}
      `}</style>
    </>
  );
}