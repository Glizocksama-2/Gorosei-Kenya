import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

// 🔥 SUPABASE CONFIG
const supabase = createClient(
  "https://bmasldizsbbgvrrdsfek.supabase.co",
  "sb_publishable_JltFfRChEfp_HY_svzf_5A_QIn9dwl-"
);

export default function App() {
  const [products, setProducts] = useState([]);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [image, setImage] = useState(null);

  const [mockup, setMockup] = useState(null);
  const [loading, setLoading] = useState(false);

  const WHATSAPP = "254734944512";

  // 🔄 FETCH PRODUCTS
  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) console.error(error);
    else setProducts(data);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // 📦 UPLOAD IMAGE
  const uploadImage = async (file) => {
    const fileName = `${Date.now()}-${file.name}`;

    const { error } = await supabase.storage
      .from("products")
      .upload(fileName, file);

    if (error) {
      console.error(error);
      return null;
    }

    const { data } = supabase.storage
      .from("products")
      .getPublicUrl(fileName);

    return data.publicUrl;
  };

  // 🤖 AI MOCKUP
  const generateMockup = async (imageUrl) => {
    try {
      setLoading(true);

      const res = await fetch("http://localhost:5000/generate-mockup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ imageUrl })
      });

      const data = await res.json();

      setMockup(data.image);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  // ➕ ADD PRODUCT
  const addProduct = async () => {
    if (!name || !price || !image) return alert("Fill everything");

    const imageUrl = await uploadImage(image);

    // 🔥 AI GENERATION
    await generateMockup(imageUrl);

    await supabase.from("products").insert([
      {
        name,
        price,
        image_url: imageUrl
      }
    ]);

    setName("");
    setPrice("");
    setImage(null);

    fetchProducts();
  };

  // 📲 WHATSAPP ORDER
  const order = (product) => {
    const msg = `Hi, I want ${product.name} for KSh ${product.price}`;
    window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(msg)}`);
  };

  return (
    <div style={{ background: "#000", color: "#fff", minHeight: "100vh", padding: 20 }}>
      <h1 style={{ textAlign: "center" }}>FRESH MTUMBA DRIP</h1>

      {/* ADMIN */}
      <div style={{ marginBottom: 30 }}>
        <h3>Add Product</h3>
        <input
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        /><br /><br />

        <input
          placeholder="Price"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
        /><br /><br />

        <input
          type="file"
          onChange={(e) => setImage(e.target.files[0])}
        /><br /><br />

        <button onClick={addProduct}>Upload</button>
      </div>

      {/* PRODUCTS */}
      <div>
        <h2>Available T-Shirts</h2>
        {products.map((p) => (
          <div key={p.id} style={{ marginBottom: 20 }}>
            <img src={p.image_url} width="200" />
            <h3>{p.name}</h3>
            <p>KSh {p.price}</p>
            <button onClick={() => order(p)}>Order on WhatsApp</button>
          </div>
        ))}
      </div>

      {/* AI MOCKUP */}
      {loading && <p>Generating AI mockup...</p>}

      {mockup && (
        <div style={{ marginTop: 40 }}>
          <h2>AI Model Preview</h2>
          <img src={mockup} width="300" />
        </div>
      )}
    </div>
  );
}