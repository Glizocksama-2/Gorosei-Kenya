import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
const WHATSAPP_NUMBER = "254734944512";

export default function App() {
  const currentPath = window.location.pathname;

  if (currentPath === "/admin") {
    return <AdminPage />;
  }

  return <CustomerLandingPage />;
}

function CustomerLandingPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  async function getProducts() {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error) {
      setProducts(data || []);
    }

    setLoading(false);
  }

  useEffect(() => {
    getProducts();
  }, []);

  function whatsappLink(product) {
    const image = product.mockup_url || product.image_url;

    const message = encodeURIComponent(
      `Hi Gorosei Kenya, I want to order this T-shirt:\n\nName: ${product.name}\nPrice: KSh ${product.price}\nImage: ${image}`
    );

    return `https://wa.me/${WHATSAPP_NUMBER}?text=${message}`;
  }

  return (
    <div className="app">
      <section className="hero">
        <div className="badge">GOROSEI KENYA MTUMBA</div>

        <h1>Clean Mtumba Tees for Everyday Streetwear</h1>

        <p>
          Fresh second-hand T-shirts, handpicked for clean fits, unique graphics,
          and affordable streetwear energy.
        </p>

        <a href="#products" className="mainBtn">
          Shop the Drop
        </a>
      </section>

      <section className="productsSection" id="products">
        <div className="sectionTop">
          <h2>Available T-Shirts</h2>
          <p>Pick your tee and order directly on WhatsApp.</p>
        </div>

        {loading && <p className="notice">Loading T-shirts...</p>}

        {!loading && products.length === 0 && (
          <p className="notice">No T-shirts uploaded yet.</p>
        )}

        <div className="productGrid">
          {products.map((product) => (
            <div className="productCard" key={product.id}>
              <img
                src={product.mockup_url || product.image_url}
                alt={product.name}
              />

              <div className="productInfo">
                <h3>{product.name}</h3>
                <p>KSh {product.price}</p>

                <a
                  href={whatsappLink(product)}
                  target="_blank"
                  rel="noreferrer"
                  className="orderBtn"
                >
                  Order on WhatsApp
                </a>
              </div>
            </div>
          ))}
        </div>
      </section>

      <style>{css}</style>
    </div>
  );
}

function AdminPage() {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  async function uploadProduct(e) {
    e.preventDefault();

    if (!name || !price || !imageFile) {
      setStatus("Add product name, price, and image.");
      return;
    }

    try {
      setLoading(true);
      setStatus("Uploading image to Supabase...");

      const fileName = `${Date.now()}-${imageFile.name}`;

      const { error: uploadError } = await supabase.storage
        .from("products")
        .upload(fileName, imageFile);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("products").getPublicUrl(fileName);
      const imageUrl = data.publicUrl;

      setStatus("Generating AI mockup...");

      const mockupRes = await fetch(`${BACKEND_URL}/generate-mockup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ imageUrl })
      });

      const mockupData = await mockupRes.json();

      if (!mockupRes.ok) {
        throw new Error(mockupData.error || "Mockup generation failed.");
      }

      setStatus("Saving product...");

      const { error: insertError } = await supabase.from("products").insert({
        name,
        price,
        image_url: imageUrl,
        mockup_url: mockupData.image
      });

      if (insertError) throw insertError;

      setName("");
      setPrice("");
      setImageFile(null);
      setStatus("Product uploaded successfully.");
    } catch (error) {
      setStatus(error.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="app">
      <section className="adminPage">
        <div className="badge">ADMIN</div>
        <h1>Upload T-Shirt</h1>
        <p>Add a new mtumba tee, generate mockup, and save it to Supabase.</p>

        <form onSubmit={uploadProduct} className="adminForm">
          <input
            type="text"
            placeholder="Product name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <input
            type="text"
            placeholder="Price e.g. 850"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />

          <input
            type="file"
            accept="image/*"
            onChange={(e) => setImageFile(e.target.files[0])}
          />

          {imageFile && <small>Selected: {imageFile.name}</small>}

          <button disabled={loading}>
            {loading ? "Uploading..." : "Upload Product"}
          </button>

          {status && <p className="notice">{status}</p>}
        </form>

        <a href="/" className="adminLink">View Customer Page</a>
      </section>

      <style>{css}</style>
    </div>
  );
}

const css = `
* {
  box-sizing: border-box;
}

body {
  margin: 0;
  background: #050505;
}

.app {
  min-height: 100vh;
  background: #050505;
  color: white;
  font-family: Arial, Helvetica, sans-serif;
}

.hero {
  min-height: 100vh;
  padding: 28px 18px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  background:
    radial-gradient(circle at top right, rgba(255, 200, 0, 0.24), transparent 35%),
    linear-gradient(180deg, #080808, #050505);
}

.badge {
  color: #f5c518;
  font-weight: 900;
  letter-spacing: 2px;
  font-size: 13px;
  margin-bottom: 18px;
}

.hero h1 {
  font-size: clamp(42px, 13vw, 76px);
  line-height: 0.92;
  margin: 0 0 20px;
  max-width: 760px;
}

.hero p {
  color: #c9c9c9;
  font-size: 17px;
  line-height: 1.6;
  max-width: 560px;
  margin-bottom: 30px;
}

.mainBtn {
  background: #f5c518;
  color: #050505;
  text-decoration: none;
  font-weight: 900;
  padding: 15px 22px;
  border-radius: 999px;
  width: fit-content;
}

.productsSection {
  padding: 35px 16px 60px;
}

.sectionTop h2 {
  font-size: 30px;
  margin: 0 0 8px;
}

.sectionTop p,
.notice {
  color: #bdbdbd;
}

.productGrid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(165px, 1fr));
  gap: 16px;
  margin-top: 24px;
}

.productCard {
  background: #111;
  border: 1px solid #242424;
  border-radius: 24px;
  overflow: hidden;
}

.productCard img {
  width: 100%;
  aspect-ratio: 9 / 12;
  object-fit: cover;
  background: #181818;
}

.productInfo {
  padding: 14px;
}

.productInfo h3 {
  margin: 0 0 8px;
  font-size: 16px;
}

.productInfo p {
  margin: 0 0 12px;
  color: #f5c518;
  font-weight: 900;
}

.orderBtn {
  display: block;
  text-align: center;
  background: #25d366;
  color: #050505;
  padding: 12px;
  border-radius: 14px;
  font-weight: 900;
  text-decoration: none;
}

.adminPage {
  max-width: 600px;
  margin: 0 auto;
  padding: 35px 18px;
}

.adminPage h1 {
  font-size: 42px;
  margin: 0 0 12px;
}

.adminPage p {
  color: #c9c9c9;
}

.adminForm {
  display: grid;
  gap: 14px;
  margin-top: 25px;
}

.adminForm input {
  width: 100%;
  padding: 15px;
  border-radius: 14px;
  border: 1px solid #333;
  background: #111;
  color: white;
  font-size: 16px;
}

.adminForm small {
  color: #f5c518;
}

.adminForm button {
  padding: 16px;
  border: none;
  border-radius: 16px;
  background: #f5c518;
  color: #050505;
  font-weight: 900;
  font-size: 16px;
  cursor: pointer;
}

.adminForm button:disabled {
  opacity: 0.6;
}

.adminLink {
  display: inline-block;
  margin-top: 25px;
  color: #f5c518;
}
`;
