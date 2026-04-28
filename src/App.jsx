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
  if (path.startsWith("/product/")) {
    const id = path.replace("/product/", "").replace("/", "");
    return <ProductPage id={id} />;
  }
  return <CustomerPage />;
}

function CustomerPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    try {
      const { data } = await supabase.from("products for Gorosei").select("*").order("created_at", { ascending: false });
      setProducts((data || []).filter(p => !p.sold));
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }

  return (
    <div style={styles.page}>
      <nav style={styles.nav}>
        <a href="/" style={styles.logo}>GOROSEI</a>
        <button style={styles.menuBtn} onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? "CLOSE" : "MENU"}
        </button>
        {menuOpen && (
          <div style={styles.menu}>
            <a href="#drops" onClick={() => setMenuOpen(false)} style={styles.menuLink}>DROPS</a>
            <a href="/admin" onClick={() => setMenuOpen(false)} style={styles.menuLink}>ADMIN</a>
          </div>
        )}
      </nav>

      <header style={styles.hero}>
        <p style={styles.heroTag}>[-_-]</p>
        <h1 style={styles.heroTitle}>GOROSEI<br/>KENYA</h1>
        <p style={styles.heroSub}>STREETWEAR // {FIXED_PRICE} KES</p>
      </header>

      <main id="drops" style={styles.main}>
        <div style={styles.sectionHeader}>
          <span>[01]</span>
          <h2>AVAILABLE</h2>
        </div>

        {loading && <div style={styles.loader}></div>}

        {!loading && products.length === 0 && (
          <div style={styles.empty}>
            <p>NO DROPS</p>
            <p>8PM DAILY</p>
          </div>
        )}

        <div style={styles.grid}>
          {products.map((p) => (
            <a href={`/product/${p.id}`} key={p.id} style={styles.cardLink}>
              <div style={styles.card}>
                <div style={styles.cardImg}>
                  {p.Image_url ? (
                    <img src={getImageUrl(p.Image_url)} alt={p.Name} style={styles.cardImgInner} loading="lazy" />
                  ) : (
                    <div style={styles.noImg}>NO IMG</div>
                  )}
                  <span style={styles.cardSize}>{p.size || "OS"}</span>
                </div>
                <div style={styles.cardBody}>
                  <h3 style={styles.cardTitle}>{p.Name}</h3>
                  <div style={styles.cardFooter}>
                    <span>KSh {FIXED_PRICE}</span>
                  </div>
                </div>
              </div>
            </a>
          ))}
        </div>
      </main>

      <footer style={styles.footer}>
        <p>GOROSEI // KENYA</p>
        <p>WA: {WHATSAPP_NUMBER}</p>
        <p>©2026</p>
      </footer>
    </div>
  );
}

function ProductPage({ id }) {
  const [product, setProduct] = useState(null);
  const [angles, setAngles] = useState([]);
  const [currentAngle, setCurrentAngle] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProduct();
  }, [id]);

  async function fetchProduct() {
    try {
      const { data } = await supabase.from("products for Gorosei").select("*").eq("id", id).single();
      setProduct(data);
      
      // Try to get multiple angles from the product
      // For now, use the main image - could expand to store array of images
      const images = data?.angle_images || data?.Image_url ? [data.Image_url] : [];
      setAngles(images.length > 0 ? images : []);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }

  function createWhatsAppLink() {
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(`Hi Gorosei, I want: ${product?.Name} (${product?.size || 'OS'}) - KSh ${FIXED_PRICE}`)}`;
  }

  function nextAngle() {
    if (angles.length > 1) {
      setCurrentAngle((currentAngle + 1) % angles.length);
    }
  }

  function prevAngle() {
    if (angles.length > 1) {
      setCurrentAngle((currentAngle - 1 + angles.length) % angles.length);
    }
  }

  if (loading) return <div style={styles.page}><div style={styles.loader}></div></div>;
  if (!product) return <div style={styles.page}><p style={styles.empty}>Product not found</p></div>;

  return (
    <div style={styles.page}>
      <nav style={styles.nav}>
        <a href="/" style={styles.logo}>GOROSEI</a>
        <a href="/" style={styles.backBtn}>← BACK</a>
      </nav>

      <main style={styles.productMain}>
        <div style={styles.productGallery} onClick={nextAngle}>
          {angles.length > 0 ? (
            <img 
              src={getImageUrl(angles[currentAngle])} 
              alt={product.Name} 
              style={styles.productImage}
            />
          ) : (
            <div style={styles.productNoImg}>NO IMAGE</div>
          )}
          
          {angles.length > 1 && (
            <>
              <button style={styles.angleBtnLeft} onClick={(e) => { e.stopPropagation(); prevAngle(); }}>‹</button>
              <button style={styles.angleBtnRight} onClick={(e) => { e.stopPropagation(); nextAngle(); }}>›</button>
              <div style={styles.angleIndicator}>
                {currentAngle + 1} / {angles.length}
              </div>
            </>
          )}
        </div>

        <div style={styles.productInfo}>
          <span style={styles.productSize}>{product.size || "OS"}</span>
          <h1 style={styles.productName}>{product.Name}</h1>
          <p style={styles.productPrice}>KSh {FIXED_PRICE}</p>
          
          <a href={createWhatsAppLink()} style={styles.buyBtn}>BUY NOW</a>
          
          <div style={styles.productDetails}>
            <p>Dark aesthetic // Limited drops</p>
            <p>8PM DAILY // Kenya based</p>
          </div>
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
  const [imageMode, setImageMode] = useState("file");
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");
  const [products, setProducts] = useState([]);

  useEffect(() => { fetchProducts(); }, []);

  function handleFileChange(e) {
    const f = e.target.files?.[0];
    setFile(f);
    setPreview(f ? URL.createObjectURL(f) : null);
    setUrl("");
  }

  function handleUrlChange(e) {
    setUrl(e.target.value);
    setFile(null);
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
        imagePath = url.trim();
      } else {
        const fileName = `img_${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
        const { data, error } = await supabase.storage.from(BUCKET_NAME).upload(fileName, file);
        if (error) throw error;
        imagePath = data.path;
      }
      
      const { error: err2 } = await supabase.from("products for Gorosei").insert({
        Name: name.trim(),
        Price: FIXED_PRICE,
        size,
        Image_url: imagePath,
        sold: false
      });
      
      if (err2) throw err2;
      
      setStatus("Done!");
      setName("");
      setFile(null);
      setPreview(null);
      setUrl("");
      fetchProducts();
    } catch (err) {
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
    <div style={styles.page}>
      <nav style={styles.nav}>
        <a href="/" style={styles.logo}>GOROSEI</a>
        <a href="/" style={styles.menuBtn}>STORE</a>
      </nav>

      <main style={styles.adminMain}>
        <div style={styles.sectionHeader}>
          <span>[01]</span>
          <h2>ADD DROP</h2>
        </div>

        <div style={styles.formToggle}>
          <button 
            style={imageMode === "file" ? styles.formToggleActive : styles.formToggleBtn}
            onClick={() => toggleMode("file")}
          >
            UPLOAD FILE
          </button>
          <button 
            style={imageMode === "url" ? styles.formToggleActive : styles.formToggleBtn}
            onClick={() => toggleMode("url")}
          >
            PASTE URL
          </button>
        </div>

        <input 
          value={name} 
          onChange={(e) => setName(e.target.value)} 
          placeholder="PRODUCT NAME" 
          style={styles.input}
        />
        
        <div style={styles.formRow}>
          <select value={size} onChange={(e) => setSize(e.target.value)} style={styles.select}>
            <option value="S">S</option>
            <option value="M">M</option>
            <option value="L">L</option>
            <option value="XL">XL</option>
            <option value="OS">OS</option>
          </select>
          
          {imageMode === "file" ? (
            <label style={styles.fileLabel}>
              {file ? file.name : "CHOOSE IMAGE"}
              <input type="file" accept="image/*" onChange={handleFileChange} style={{ display: "none" }} />
            </label>
          ) : (
            <input 
              value={url} 
              onChange={handleUrlChange} 
              placeholder="IMAGE URL" 
              style={styles.inputFlex}
            />
          )}
        </div>
        
        {preview && <img src={preview} style={styles.preview} />}
        
        <button 
          onClick={handleAdd} 
          disabled={saving} 
          style={styles.submitBtn}
        >
          {saving ? "..." : `ADD (${FIXED_PRICE} KES)`}
        </button>
        {status && <p style={styles.status}>{status}</p>}

        <div style={styles.sectionHeader}>
          <span>[02]</span>
          <h2>STOCK ({products.length})</h2>
        </div>

        <div style={styles.productList}>
          {products.map((p) => (
            <div key={p.id} style={styles.productItem}>
              <img src={getImageUrl(p.Image_url)} alt={p.Name} style={styles.productThumb} />
              <div style={styles.productItemInfo}>
                <p>{p.Name}</p>
                <p>{p.size} // {FIXED_PRICE} KES</p>
                <span style={p.sold ? styles.soldTag : styles.availTag}>
                  {p.sold ? "SOLD" : "AVAIL"}
                </span>
              </div>
              <div style={styles.productActions}>
                {!p.sold && (
                  <button onClick={() => markSold(p.id)} style={styles.soldBtn}>SOLD</button>
                )}
                <button onClick={() => deleteProduct(p.id)} style={styles.deleteBtn}>DEL</button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

const styles = {
  page: {
    background: "#000",
    color: "#fff",
    fontFamily: "'JetBrains Mono', monospace",
    minHeight: "100vh",
  },
  nav: {
    display: "flex",
    justifyContent: "space-between",
    padding: 24,
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    background: "rgba(0,0,0,0.95)",
    zIndex: 100,
  },
  logo: {
    fontSize: 14,
    fontWeight: "bold",
    letterSpacing: "4px",
    color: "#fff",
    textDecoration: "none",
  },
  menuBtn: {
    background: "none",
    border: "1px solid #333",
    color: "#fff",
    padding: "8px 16px",
    fontFamily: "inherit",
    fontSize: 11,
    letterSpacing: "2px",
    cursor: "pointer",
    textDecoration: "none",
  },
  backBtn: {
    background: "none",
    border: "1px solid #333",
    color: "#fff",
    padding: "8px 16px",
    fontFamily: "inherit",
    fontSize: 11,
    letterSpacing: "2px",
    cursor: "pointer",
    textDecoration: "none",
  },
  menu: {
    position: "fixed",
    inset: 0,
    background: "#000",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 24,
    zIndex: 99,
  },
  menuLink: {
    fontSize: 24,
    fontWeight: "bold",
    letterSpacing: "4px",
    color: "#fff",
    textDecoration: "none",
  },
  hero: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    padding: "120px 24px 80px",
    borderBottom: "1px solid #333",
  },
  heroTag: {
    fontSize: 12,
    color: "#666",
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: "clamp(40px, 15vw, 140px)",
    fontWeight: "bold",
    lineHeight: 0.9,
    marginBottom: 24,
  },
  heroSub: {
    fontSize: 14,
    color: "#666",
    letterSpacing: "4px",
  },
  main: {
    padding: "0 0 48px",
  },
  sectionHeader: {
    display: "flex",
    gap: 16,
    padding: "48px 24px 24px",
    borderBottom: "1px solid #333",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: 1,
    background: "#333",
  },
  cardLink: {
    textDecoration: "none",
    color: "inherit",
  },
  card: {
    background: "#000",
  },
  cardImg: {
    aspectRatio: "1",
    background: "#0a0a0a",
    position: "relative",
    overflow: "hidden",
  },
  cardImgInner: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  noImg: {
    width: "100%",
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#666",
    fontSize: 10,
  },
  cardSize: {
    position: "absolute",
    top: 12,
    left: 12,
    background: "#fff",
    color: "#000",
    fontSize: 9,
    fontWeight: "bold",
    padding: "4px 8px",
  },
  cardBody: {
    padding: 16,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: 500,
    marginBottom: 12,
  },
  cardFooter: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  loader: {
    width: 24,
    height: 24,
    border: "2px solid #333",
    borderTopColor: "#fff",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
    margin: "60px auto",
  },
  empty: {
    textAlign: "center",
    padding: 60,
    color: "#666",
  },
  footer: {
    padding: 48,
    borderTop: "1px solid #333",
    textAlign: "center",
    color: "#666",
    fontSize: 12,
  },

  // Product detail page
  productMain: {
    paddingTop: 80,
    display: "flex",
    flexDirection: "column",
    minHeight: "100vh",
  },
  productGallery: {
    position: "relative",
    aspectRatio: "1",
    background: "#0a0a0a",
    cursor: "pointer",
  },
  productImage: {
    width: "100%",
    height: "100%",
    objectFit: "contain",
  },
  productNoImg: {
    width: "100%",
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#666",
    fontSize: 24,
  },
  angleBtnLeft: {
    position: "absolute",
    left: 16,
    top: "50%",
    transform: "translateY(-50%)",
    background: "rgba(255,255,255,0.1)",
    border: "none",
    color: "#fff",
    fontSize: 32,
    width: 48,
    height: 48,
    cursor: "pointer",
  },
  angleBtnRight: {
    position: "absolute",
    right: 16,
    top: "50%",
    transform: "translateY(-50%)",
    background: "rgba(255,255,255,0.1)",
    border: "none",
    color: "#fff",
    fontSize: 32,
    width: 48,
    height: 48,
    cursor: "pointer",
  },
  angleIndicator: {
    position: "absolute",
    bottom: 16,
    left: "50%",
    transform: "translateX(-50%)",
    background: "rgba(0,0,0,0.7)",
    padding: "8px 16px",
    fontSize: 12,
  },
  productInfo: {
    padding: 24,
    flex: 1,
  },
  productSize: {
    display: "inline-block",
    background: "#fff",
    color: "#000",
    padding: "4px 8px",
    fontSize: 10,
    fontWeight: "bold",
    marginBottom: 16,
  },
  productName: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 16,
  },
  productPrice: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 24,
  },
  buyBtn: {
    display: "block",
    background: "#fff",
    color: "#000",
    padding: 16,
    textAlign: "center",
    fontSize: 14,
    fontWeight: "bold",
    textDecoration: "none",
    marginBottom: 24,
  },
  productDetails: {
    color: "#666",
    fontSize: 12,
  },

  // Admin
  adminMain: {
    padding: "100px 24px 48px",
    maxWidth: 500,
  },
  formToggle: {
    display: "flex",
    gap: 8,
    marginBottom: 12,
  },
  formToggleBtn: {
    flex: 1,
    padding: 12,
    background: "#111",
    border: "1px solid #333",
    color: "#666",
    cursor: "pointer",
  },
  formToggleActive: {
    flex: 1,
    padding: 12,
    background: "#fff",
    border: "1px solid #333",
    color: "#000",
    cursor: "pointer",
  },
  input: {
    display: "block",
    width: "100%",
    padding: 14,
    margin: "8px 0",
    background: "#111",
    border: "1px solid #333",
    color: "#fff",
    fontSize: 12,
    fontFamily: "inherit",
  },
  inputFlex: {
    flex: 1,
    padding: 14,
    background: "#111",
    border: "1px solid #333",
    color: "#fff",
    fontSize: 12,
    fontFamily: "inherit",
  },
  formRow: {
    display: "flex",
    gap: 8,
  },
  select: {
    padding: 14,
    background: "#111",
    border: "1px solid #333",
    color: "#fff",
    fontSize: 12,
    fontFamily: "inherit",
  },
  fileLabel: {
    flex: 1,
    padding: 14,
    background: "#111",
    border: "1px solid #333",
    color: "#666",
    fontSize: 12,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
  },
  preview: {
    width: 100,
    height: 100,
    objectFit: "cover",
    marginTop: 12,
  },
  submitBtn: {
    width: "100%",
    padding: 16,
    marginTop: 12,
    background: "#fff",
    color: "#000",
    border: "none",
    fontSize: 12,
    fontWeight: "bold",
    cursor: "pointer",
  },
  status: {
    color: "#f0f",
    marginTop: 12,
    fontSize: 12,
  },
  productList: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  productItem: {
    display: "flex",
    gap: 12,
    padding: 12,
    background: "#111",
    alignItems: "center",
  },
  productThumb: {
    width: 50,
    height: 50,
    objectFit: "cover",
    background: "#222",
  },
  productItemInfo: {
    flex: 1,
  },
  soldTag: {
    color: "#f00",
    fontSize: 10,
  },
  availTag: {
    color: "#4ade80",
    fontSize: 10,
  },
  productActions: {
    display: "flex",
    gap: 8,
  },
  soldBtn: {
    border: "1px solid #4ade80",
    color: "#4ade80",
    background: "none",
    padding: "6px 10px",
    fontSize: 10,
    cursor: "pointer",
  },
  deleteBtn: {
    border: "1px solid #f00",
    color: "#f00",
    background: "none",
    padding: "6px 10px",
    fontSize: 10,
    cursor: "pointer",
  },
};

// Add keyframes for spinner
if (typeof document !== "undefined") {
  const style = document.createElement("style");
  style.textContent = `
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(style);
}