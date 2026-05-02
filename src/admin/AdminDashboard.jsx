import { useEffect, useState } from "react";
import { BUCKET_NAME, FIXED_PRICE, ORDER_STATUSES, PRODUCT_CATEGORIES, PRODUCT_CONDITIONS } from "../config/constants.js";
import { formatMeasurements, getImageUrl, getProductImages, isMissingGalleryColumn, parseMeasurementInput } from "../lib/productUtils.js";
import { supabase } from "../lib/supabase.js";
export default function AdminDashboard({ onLogout }) {
  const [activeTab, setActiveTab] = useState("collections");
  const [collections, setCollections] = useState([]);
  const [collectionName, setCollectionName] = useState("");
  const [selectedCollection, setSelectedCollection] = useState(null);
  const [products, setProducts] = useState([]);
  const [newProduct, setNewProduct] = useState({
    name: "", size: "M", price: "2000", originalPrice: "", category: "tshirts", url: "", imageUrls: [],
    condition: "thrifted", fitNotes: "", measurements: "", story: "",
  });
  const [editDrafts, setEditDrafts] = useState({});
  const [uploading, setUploading] = useState(false);
  const [uploadingProductId, setUploadingProductId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");
  const [orders, setOrders] = useState([]);
  const [analytics, setAnalytics] = useState({ orders: 0, views: 0, clicks: 0, newsletter: 0, waitlist: 0 });

  // Drop management
  const [drops, setDrops] = useState([]);
  const [newDrop, setNewDrop] = useState({ collection_name: "", drop_date: "" });
  const [waitlistCount, setWaitlistCount] = useState(0);

  useEffect(() => {
    fetchCollections();
    fetchDrops();
    fetchOrders();
    fetchAnalytics();
  }, []);

  // ── Image upload ────────────────────────────────────────────────────────
  async function uploadProductFiles(files) {
    const uploadedPaths = [];
    for (const file of files) {
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const fileName = `products/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(fileName, file, { contentType: file.type || "image/jpeg" });
      if (error) throw error;
      uploadedPaths.push(data.path);
    }
    return uploadedPaths;
  }

  async function handleFileSelect(e) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    try {
      const uploadedPaths = await uploadProductFiles(files);
      setNewProduct((prev) => {
        const imageUrls = [...prev.imageUrls, ...uploadedPaths];
        return { ...prev, imageUrls, url: prev.url || imageUrls[0] || "" };
      });
      setStatus(`${uploadedPaths.length} image${uploadedPaths.length === 1 ? "" : "s"} uploaded!`);
    } catch {
      setStatus("Upload failed. Check storage bucket.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function addImagesToProduct(product, files) {
    const selectedFiles = Array.from(files || []);
    if (!selectedFiles.length) return;
    setUploadingProductId(product.id);
    try {
      const uploadedPaths = await uploadProductFiles(selectedFiles);
      const existingImages = getProductImages(product);
      const imageUrls = [...new Set([...existingImages, ...uploadedPaths])];
      const { error } = await supabase
        .from("products for Gorosei")
        .update({
          Image_url: product.Image_url || imageUrls[0],
          Image_urls: imageUrls,
        })
        .eq("id", product.id);
      if (error) throw error;
      setStatus(`${uploadedPaths.length} photo${uploadedPaths.length === 1 ? "" : "s"} added to ${product.Name || "product"}.`);
      fetchProductsForCollection(selectedCollection);
    } catch (error) {
      setStatus(`Upload failed: ${error.message || "Check storage bucket and Image_urls column."}`);
    } finally {
      setUploadingProductId(null);
    }
  }

  // ── Collections ─────────────────────────────────────────────────────────
  async function fetchCollections() {
    const { data } = await supabase.from("collections").select("*").order("created_at", { ascending: false });
    setCollections(data || []);
  }

  async function createCollection() {
    if (!collectionName.trim()) { setStatus("Name required"); return; }
    setSaving(true);
    try {
      const { error } = await supabase.from("collections").insert({ name: collectionName.trim(), active: true });
      if (error) { setStatus(`Error: ${error.message}`); return; }
      setStatus("Collection created!");
      setCollectionName("");
      fetchCollections();
    } finally {
      setSaving(false);
    }
  }

  async function deleteCollection(id) {
    if (!confirm("Delete this collection and all its products?")) return;
    await supabase.from("products for Gorosei").delete().eq("collection_id", id);
    await supabase.from("collections").delete().eq("id", id);
    fetchCollections();
  }

  // ── Products ─────────────────────────────────────────────────────────────
  async function fetchProductsForCollection(colId) {
    if (!colId) return;
    const query = colId === "default"
      ? supabase.from("products for Gorosei").select("*").is("collection_id", null)
      : supabase.from("products for Gorosei").select("*").eq("collection_id", colId);
    const { data } = await query.order("created_at", { ascending: false });
    setProducts(data || []);
  }

  async function addProductToCollection() {
    if (!selectedCollection) { setStatus("Select a collection first"); return; }
    if (!newProduct.name || !newProduct.url) { setStatus("Name and image required"); return; }
    setSaving(true);
    try {
      const payload = {
        Name: newProduct.name.trim(),
        Price: parseInt(newProduct.price) || FIXED_PRICE,
        original_price: newProduct.originalPrice ? parseInt(newProduct.originalPrice) : null,
        category: newProduct.category || "tshirts",
        size: newProduct.size,
        Image_url: newProduct.url,
        Image_urls: newProduct.imageUrls.length ? newProduct.imageUrls : [newProduct.url],
        condition: newProduct.condition || "thrifted",
        fit_notes: newProduct.fitNotes.trim() || null,
        measurements: parseMeasurementInput(newProduct.measurements),
        story: newProduct.story.trim() || null,
        collection_id: selectedCollection === "default" ? null : selectedCollection,
        sold: false,
      };
      const { error } = await supabase.from("products for Gorosei").insert(payload);
      if (error && isMissingGalleryColumn(error)) {
        const fallbackPayload = { ...payload };
        delete fallbackPayload.Image_urls;
        delete fallbackPayload.condition;
        delete fallbackPayload.fit_notes;
        delete fallbackPayload.measurements;
        delete fallbackPayload.story;
        const fallback = await supabase.from("products for Gorosei").insert(fallbackPayload);
        if (fallback.error) { setStatus(`Error: ${fallback.error.message}`); return; }
        setStatus("Product added with core fields. Run 06 and 08 SQL helpers to save galleries and trust fields.");
      } else if (error) {
        setStatus(`Error: ${error.message}`);
        return;
      } else {
        setStatus("Product added!");
      }
      setNewProduct({
        name: "", size: "M", price: "2000", originalPrice: "", category: "tshirts", url: "", imageUrls: [],
        condition: "thrifted", fitNotes: "", measurements: "", story: "",
      });
      fetchProductsForCollection(selectedCollection);
    } finally {
      setSaving(false);
    }
  }

  async function deleteProduct(id) {
    if (!confirm("Delete this product?")) return;
    await supabase.from("products for Gorosei").delete().eq("id", id);
    fetchProductsForCollection(selectedCollection);
  }

  async function updateProduct(id) {
    const draft = editDrafts[id];
    if (!draft) return;
    const payload = {
      Name: draft.name?.trim() || "UNTITLED",
      Price: parseInt(draft.price) || FIXED_PRICE,
      original_price: draft.originalPrice ? parseInt(draft.originalPrice) : null,
      category: draft.category || "tshirts",
      size: draft.size || "M",
      condition: draft.condition || draft.condition === "" ? draft.condition || null : undefined,
      fit_notes: draft.fitNotes ?? draft.fit_notes ?? null,
      measurements: typeof draft.measurements === "string" ? parseMeasurementInput(draft.measurements) : draft.measurements,
      story: draft.story ?? null,
    };
    Object.keys(payload).forEach((key) => payload[key] === undefined && delete payload[key]);
    const { error } = await supabase.from("products for Gorosei").update(payload).eq("id", id);
    if (error && isMissingGalleryColumn(error)) {
      const fallbackPayload = { ...payload };
      delete fallbackPayload.condition;
      delete fallbackPayload.fit_notes;
      delete fallbackPayload.measurements;
      delete fallbackPayload.story;
      const fallback = await supabase.from("products for Gorosei").update(fallbackPayload).eq("id", id);
      if (fallback.error) { setStatus(`Error: ${fallback.error.message}`); return; }
      setStatus("Product updated. Run 08_business_growth.sql to save trust fields.");
      setEditDrafts((prev) => { const next = { ...prev }; delete next[id]; return next; });
      fetchProductsForCollection(selectedCollection);
      return;
    }
    if (error) { setStatus(`Error: ${error.message}`); return; }
    setStatus("Product updated!");
    // Clear draft for this product after save
    setEditDrafts((prev) => { const next = { ...prev }; delete next[id]; return next; });
    fetchProductsForCollection(selectedCollection);
  }

  async function toggleSold(id, currentSold) {
    await supabase.from("products for Gorosei").update({ sold: !currentSold }).eq("id", id);
    fetchProductsForCollection(selectedCollection);
  }

  // ── Drops ─────────────────────────────────────────────────────────────────
  async function fetchDrops() {
    const { data } = await supabase.from("drops").select("*").order("created_at", { ascending: false });
    setDrops(data || []);

    // Waitlist count
    const { count } = await supabase.from("waitlist").select("*", { count: "exact", head: true });
    setWaitlistCount(count || 0);
  }

  async function fetchOrders() {
    try {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(80);
      if (error) throw error;
      setOrders(data || []);
    } catch {
      setOrders([]);
    }
  }

  async function updateOrderStatus(id, nextStatus) {
    const { error } = await supabase.from("orders").update({ status: nextStatus }).eq("id", id);
    if (error) { setStatus(`Order update failed: ${error.message}`); return; }
    setStatus("Order updated.");
    fetchOrders();
    fetchAnalytics();
  }

  async function fetchAnalytics() {
    try {
      const [ordersRes, viewsRes, clicksRes, newsletterRes, waitlistRes] = await Promise.all([
        supabase.from("orders").select("*", { count: "exact", head: true }),
        supabase.from("product_events").select("*", { count: "exact", head: true }).eq("event_type", "view"),
        supabase.from("product_events").select("*", { count: "exact", head: true }).in("event_type", ["whatsapp_order", "whatsapp_order_fallback"]),
        supabase.from("newsletter").select("*", { count: "exact", head: true }),
        supabase.from("waitlist").select("*", { count: "exact", head: true }),
      ]);
      setAnalytics({
        orders: ordersRes.count || 0,
        views: viewsRes.count || 0,
        clicks: clicksRes.count || 0,
        newsletter: newsletterRes.count || 0,
        waitlist: waitlistRes.count || 0,
      });
    } catch {
      setAnalytics((prev) => prev);
    }
  }

  async function createDrop() {
    if (!newDrop.collection_name.trim() || !newDrop.drop_date) {
      setStatus("Collection name and date required");
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.from("drops").insert({
        collection_name: newDrop.collection_name.trim(),
        drop_date: newDrop.drop_date,
        active: false,
        locked: true,
      });
      if (error) { setStatus(`Error: ${error.message}`); return; }
      setStatus("Drop created!");
      setNewDrop({ collection_name: "", drop_date: "" });
      fetchDrops();
    } finally {
      setSaving(false);
    }
  }

  // Persist the active drop to Supabase so storefront countdowns use the same source of truth.
  async function setActiveDrop(id) {
    setSaving(true);
    try {
      // Deactivate all drops first
      await supabase.from("drops").update({ active: false }).neq("id", id);
      // Activate the selected one
      await supabase.from("drops").update({ active: true }).eq("id", id);
      setStatus("Drop activated!");
      fetchDrops();
    } catch {
      setStatus("Failed to activate drop.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleDropLock(id, locked) {
    await supabase.from("drops").update({ locked }).eq("id", id);
    fetchDrops();
  }

  async function deleteDrop(id) {
    if (!confirm("Delete this drop?")) return;
    await supabase.from("drops").delete().eq("id", id);
    fetchDrops();
  }

  // ── Styles ─────────────────────────────────────────────────────────────────
  const inputStyle = {
    padding: 14,
    background: "var(--surface)",
    border: "1px solid var(--surface-light)",
    color: "var(--text)",
    fontSize: 13,
    outline: "none",
    fontFamily: "inherit",
  };

  const TABS = [
    { id: "collections", label: "COLLECTIONS" },
    { id: "products", label: "PRODUCTS" },
    { id: "orders", label: "ORDERS" },
    { id: "analytics", label: "GROWTH" },
    { id: "drops", label: "DROPS" },
  ];

  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh", padding: "100px 32px 80px" }}>
      {/* Top nav */}
      <nav style={{ marginBottom: 48, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span className="font-display" style={{ fontSize: 28 }}>ADMIN</span>
        <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
          <a href="/" className="font-mono" style={{ fontSize: 11, color: "var(--text-muted)", textDecoration: "none" }}>
            ← STORE
          </a>
          <button
            onClick={onLogout}
            className="font-mono"
            style={{ fontSize: 11, color: "var(--crimson)", background: "none", border: "none", cursor: "pointer" }}
          >
            LOGOUT
          </button>
        </div>
      </nav>

      {/* Tab bar */}
      <div style={{ display: "flex", gap: 0, marginBottom: 48, borderBottom: "1px solid var(--surface-light)" }}>
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className="font-mono"
            style={{
              padding: "12px 24px",
              fontSize: 11,
              letterSpacing: "0.2em",
              background: "none",
              border: "none",
              borderBottom: activeTab === t.id ? "2px solid var(--crimson)" : "2px solid transparent",
              color: activeTab === t.id ? "var(--crimson)" : "var(--text-muted)",
              cursor: "pointer",
              transition: "color 0.2s",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Status message */}
      {status && (
        <div
          style={{
            padding: "12px 20px",
            background: status.toLowerCase().includes("error") || status.toLowerCase().includes("failed")
              ? "rgba(220,38,38,0.1)"
              : "rgba(16,185,129,0.1)",
            border: `1px solid ${status.toLowerCase().includes("error") || status.toLowerCase().includes("failed") ? "var(--crimson)" : "#10b981"}`,
            marginBottom: 32,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span className="font-mono" style={{ fontSize: 12 }}>{status}</span>
          <button
            onClick={() => setStatus("")}
            style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: 16 }}
          >
            ×
          </button>
        </div>
      )}

      {/* ── COLLECTIONS TAB ───────────────────────────────────────────── */}
      {activeTab === "collections" && (
        <div>
          <span className="font-mono" style={{ fontSize: 10, letterSpacing: "0.3em", color: "var(--crimson)" }}>
            CREATE COLLECTION
          </span>
          <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
            <input
              value={collectionName}
              onChange={(e) => setCollectionName(e.target.value)}
              placeholder="Collection name"
              style={{ ...inputStyle, flex: 1 }}
              onKeyDown={(e) => e.key === "Enter" && createCollection()}
            />
            <button
              onClick={createCollection}
              disabled={saving}
              className="font-mono"
              style={{
                padding: "14px 28px",
                background: "var(--crimson)",
                border: "none",
                color: "#fff",
                fontSize: 11,
                letterSpacing: "0.2em",
                cursor: "pointer",
              }}
            >
              {saving ? "..." : "CREATE"}
            </button>
          </div>

          <div style={{ marginTop: 48 }}>
            <span className="font-mono" style={{ fontSize: 10, letterSpacing: "0.3em", color: "var(--crimson)" }}>
              COLLECTIONS ({collections.length})
            </span>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
                gap: 16,
                marginTop: 24,
              }}
            >
              {collections.map((c) => (
                <div
                  key={c.id}
                  style={{ padding: 20, background: "var(--surface)", border: "1px solid var(--surface-light)" }}
                >
                  <p style={{ fontSize: 14, marginBottom: 8 }}>{c.name}</p>
                  <p className="font-mono" style={{ fontSize: 10, color: "var(--text-muted)" }}>
                    {c.active ? "ACTIVE" : "INACTIVE"}
                  </p>
                  <button
                    onClick={() => deleteCollection(c.id)}
                    style={{
                      marginTop: 16,
                      padding: "8px 16px",
                      border: "1px solid var(--crimson)",
                      color: "var(--crimson)",
                      background: "none",
                      fontSize: 10,
                      cursor: "pointer",
                      width: "100%",
                      fontFamily: "var(--font-mono)",
                      letterSpacing: "0.15em",
                    }}
                  >
                    DELETE
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── PRODUCTS TAB ─────────────────────────────────────────────── */}
      {activeTab === "products" && (
        <div>
          {/* Collection selector */}
          <div style={{ display: "flex", gap: 16, marginBottom: 40, flexWrap: "wrap" }}>
            <select
              value={selectedCollection || ""}
              onChange={(e) => { setSelectedCollection(e.target.value); fetchProductsForCollection(e.target.value); }}
              style={{ ...inputStyle, minWidth: 200 }}
            >
              <option value="">Select collection</option>
              <option value="default">— Uncollected —</option>
              {collections.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          {/* Add product form */}
          <span className="font-mono" style={{ fontSize: 10, letterSpacing: "0.3em", color: "var(--crimson)" }}>
            ADD PRODUCT
          </span>
          <div style={{ display: "flex", gap: 12, marginTop: 16, flexWrap: "wrap" }}>
            <input
              value={newProduct.name}
              onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
              placeholder="Product name"
              style={{ ...inputStyle, flex: "1 1 200px", minWidth: 180 }}
            />
            <select
              value={newProduct.size}
              onChange={(e) => setNewProduct({ ...newProduct, size: e.target.value })}
              style={inputStyle}
            >
              {["S", "M", "L", "XL"].map((s) => <option key={s}>{s}</option>)}
            </select>
            <select
              value={newProduct.category}
              onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
              style={inputStyle}
            >
              {PRODUCT_CATEGORIES.map((s) => <option key={s}>{s}</option>)}
            </select>
            <input
              value={newProduct.price}
              onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
              placeholder="Price (KSh)"
              style={{ ...inputStyle, width: 120 }}
            />
            <input
              value={newProduct.originalPrice || ""}
              onChange={(e) => setNewProduct({ ...newProduct, originalPrice: e.target.value })}
              placeholder="Original price"
              style={{ ...inputStyle, width: 130 }}
            />
            <select
              value={newProduct.condition}
              onChange={(e) => setNewProduct({ ...newProduct, condition: e.target.value })}
              style={inputStyle}
            >
              {PRODUCT_CONDITIONS.map((condition) => <option key={condition} value={condition}>{condition}</option>)}
            </select>
            <input
              value={newProduct.fitNotes}
              onChange={(e) => setNewProduct({ ...newProduct, fitNotes: e.target.value })}
              placeholder="Fit notes"
              style={{ ...inputStyle, flex: "1 1 180px", minWidth: 160 }}
            />
            <input
              value={newProduct.measurements}
              onChange={(e) => setNewProduct({ ...newProduct, measurements: e.target.value })}
              placeholder="Measurements: chest: 22in, length: 28in"
              style={{ ...inputStyle, flex: "1 1 260px", minWidth: 220 }}
            />
            <input
              value={newProduct.story}
              onChange={(e) => setNewProduct({ ...newProduct, story: e.target.value })}
              placeholder="Product story / caption"
              style={{ ...inputStyle, flex: "1 1 260px", minWidth: 220 }}
            />
            {/* Image upload */}
            <label
              style={{ ...inputStyle, cursor: "pointer", display: "flex", alignItems: "center", gap: 12 }}
            >
              {uploading ? (
                <span className="font-mono" style={{ fontSize: 10 }}>UPLOADING...</span>
              ) : newProduct.imageUrls.length ? (
                <>
                  <img src={getImageUrl(newProduct.imageUrls[0], 120, 70)} style={{ width: 40, height: 40, objectFit: "cover" }} alt="preview" />
                  <span className="font-mono" style={{ fontSize: 10 }}>{newProduct.imageUrls.length} PHOTOS</span>
                </>
              ) : (
                <span className="font-mono" style={{ fontSize: 10, color: "var(--text-muted)" }}>+ IMAGES</span>
              )}
              <input type="file" accept="image/*" multiple onChange={handleFileSelect} style={{ display: "none" }} />
            </label>
          </div>

          {newProduct.imageUrls.length > 1 && (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
              {newProduct.imageUrls.map((image, index) => (
                <button
                  key={image}
                  type="button"
                  onClick={() => setNewProduct((prev) => ({ ...prev, url: image }))}
                  title={index === 0 ? "First uploaded image" : "Set as cover image"}
                  style={{
                    width: 52,
                    height: 64,
                    padding: 0,
                    border: newProduct.url === image ? "1px solid var(--crimson)" : "1px solid var(--surface-light)",
                    background: "none",
                    cursor: "pointer",
                  }}
                >
                  <img src={getImageUrl(image, 120, 70)} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                </button>
              ))}
            </div>
          )}

          <button
            onClick={addProductToCollection}
            disabled={saving || uploading}
            className="font-mono"
            style={{
              marginTop: 20,
              padding: "14px 32px",
              background: "var(--crimson)",
              border: "none",
              color: "#fff",
              fontSize: 11,
              letterSpacing: "0.2em",
              cursor: saving ? "not-allowed" : "pointer",
            }}
          >
            {saving ? "SAVING..." : "ADD PRODUCT"}
          </button>

          {/* Product list */}
          {selectedCollection && products.length > 0 && (
            <div style={{ marginTop: 56 }}>
              <span className="font-mono" style={{ fontSize: 10, letterSpacing: "0.3em", color: "var(--crimson)" }}>
                PRODUCTS IN COLLECTION ({products.length})
              </span>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
                  gap: 16,
                  marginTop: 24,
                }}
              >
                {products.map((p) => (
                  <div
                    key={p.id}
                    style={{
                      padding: 16,
                      background: "var(--surface)",
                      border: p.sold ? "1px solid #333" : "1px solid var(--surface-light)",
                      opacity: p.sold ? 0.6 : 1,
                    }}
                  >
                    {(() => {
                      const images = getProductImages(p);
                      return images.length > 0 && (
                        <>
                          <img
                            src={getImageUrl(images[0], 400, 70)}
                            alt={p.Name}
                            style={{ width: "100%", aspectRatio: "3/4", objectFit: "cover", display: "block" }}
                          />
                          {images.length > 1 && (
                            <div style={{ display: "flex", gap: 6, marginTop: 8, overflowX: "auto", paddingBottom: 2 }}>
                              {images.slice(0, 6).map((image) => (
                                <img
                                  key={image}
                                  src={getImageUrl(image, 80, 65)}
                                  alt=""
                                  loading="lazy"
                                  style={{ width: 32, height: 40, objectFit: "cover", border: "1px solid var(--surface-light)", flex: "0 0 auto" }}
                                />
                              ))}
                              {images.length > 6 && (
                                <span className="font-mono" style={{ fontSize: 9, color: "var(--text-muted)", alignSelf: "center" }}>
                                  +{images.length - 6}
                                </span>
                              )}
                            </div>
                          )}
                        </>
                      );
                    })()}
                    <label
                      className="font-mono"
                      style={{
                        display: "block",
                        marginTop: 8,
                        padding: "9px 0",
                        border: "1px dashed var(--surface-light)",
                        color: uploadingProductId === p.id ? "var(--text-muted)" : "var(--crimson)",
                        textAlign: "center",
                        fontSize: 9,
                        letterSpacing: "0.12em",
                        cursor: uploadingProductId ? "not-allowed" : "pointer",
                      }}
                    >
                      {uploadingProductId === p.id ? "UPLOADING..." : "+ ADD PHOTOS"}
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        disabled={Boolean(uploadingProductId)}
                        onChange={(e) => {
                          addImagesToProduct(p, e.target.files);
                          e.target.value = "";
                        }}
                        style={{ display: "none" }}
                      />
                    </label>
                    {/* Editable name */}
                    <input
                      value={editDrafts[p.id]?.name ?? p.Name ?? ""}
                      onChange={(e) => setEditDrafts((prev) => ({ ...prev, [p.id]: { ...(prev[p.id] || p), name: e.target.value } }))}
                      style={{ ...inputStyle, width: "100%", marginTop: 12, padding: 10, fontSize: 12, boxSizing: "border-box" }}
                    />
                    {/* Price + original price */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 8 }}>
                      <input
                        value={editDrafts[p.id]?.price ?? p.Price ?? ""}
                        onChange={(e) => setEditDrafts((prev) => ({ ...prev, [p.id]: { ...(prev[p.id] || p), price: e.target.value } }))}
                        placeholder="Price"
                        style={{ ...inputStyle, width: "100%", padding: 10, fontSize: 12, boxSizing: "border-box" }}
                      />
                      <input
                        value={editDrafts[p.id]?.originalPrice ?? p.original_price ?? ""}
                        onChange={(e) => setEditDrafts((prev) => ({ ...prev, [p.id]: { ...(prev[p.id] || p), originalPrice: e.target.value } }))}
                        placeholder="Original"
                        style={{ ...inputStyle, width: "100%", padding: 10, fontSize: 12, boxSizing: "border-box" }}
                      />
                    </div>
                    {/* Category */}
                    <select
                      value={editDrafts[p.id]?.category ?? p.category ?? "tshirts"}
                      onChange={(e) => setEditDrafts((prev) => ({ ...prev, [p.id]: { ...(prev[p.id] || p), category: e.target.value } }))}
                      style={{ ...inputStyle, width: "100%", marginTop: 8, padding: 10, fontSize: 12, boxSizing: "border-box" }}
                    >
                      {PRODUCT_CATEGORIES.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                    <select
                      value={editDrafts[p.id]?.condition ?? p.condition ?? "thrifted"}
                      onChange={(e) => setEditDrafts((prev) => ({ ...prev, [p.id]: { ...(prev[p.id] || p), condition: e.target.value } }))}
                      style={{ ...inputStyle, width: "100%", marginTop: 8, padding: 10, fontSize: 12, boxSizing: "border-box" }}
                    >
                      {PRODUCT_CONDITIONS.map((condition) => <option key={condition} value={condition}>{condition}</option>)}
                    </select>
                    <input
                      value={editDrafts[p.id]?.fitNotes ?? editDrafts[p.id]?.fit_notes ?? p.fit_notes ?? ""}
                      onChange={(e) => setEditDrafts((prev) => ({ ...prev, [p.id]: { ...(prev[p.id] || p), fitNotes: e.target.value } }))}
                      placeholder="Fit notes"
                      style={{ ...inputStyle, width: "100%", marginTop: 8, padding: 10, fontSize: 12, boxSizing: "border-box" }}
                    />
                    <input
                      value={typeof editDrafts[p.id]?.measurements === "string" ? editDrafts[p.id].measurements : formatMeasurements(p.measurements)}
                      onChange={(e) => setEditDrafts((prev) => ({ ...prev, [p.id]: { ...(prev[p.id] || p), measurements: e.target.value } }))}
                      placeholder="Measurements"
                      style={{ ...inputStyle, width: "100%", marginTop: 8, padding: 10, fontSize: 12, boxSizing: "border-box" }}
                    />
                    <input
                      value={editDrafts[p.id]?.story ?? p.story ?? ""}
                      onChange={(e) => setEditDrafts((prev) => ({ ...prev, [p.id]: { ...(prev[p.id] || p), story: e.target.value } }))}
                      placeholder="Story / caption"
                      style={{ ...inputStyle, width: "100%", marginTop: 8, padding: 10, fontSize: 12, boxSizing: "border-box" }}
                    />
                    {/* Actions */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 12 }}>
                      <button
                        onClick={() => toggleSold(p.id, p.sold)}
                        className="font-mono"
                        style={{
                          padding: "8px 0",
                          border: "1px solid var(--surface-light)",
                          color: p.sold ? "var(--crimson)" : "var(--text-muted)",
                          background: "none",
                          fontSize: 9,
                          cursor: "pointer",
                          letterSpacing: "0.1em",
                        }}
                      >
                        {p.sold ? "MARK AVAILABLE" : "MARK SOLD"}
                      </button>
                      <button
                        onClick={() => deleteProduct(p.id)}
                        className="font-mono"
                        style={{
                          padding: "8px 0",
                          border: "1px solid var(--crimson)",
                          color: "var(--crimson)",
                          background: "none",
                          fontSize: 9,
                          cursor: "pointer",
                          letterSpacing: "0.1em",
                        }}
                      >
                        DELETE
                      </button>
                    </div>
                    <button
                      onClick={() => updateProduct(p.id)}
                      className="font-mono"
                      style={{
                        marginTop: 8,
                        width: "100%",
                        padding: "10px 0",
                        border: "1px solid var(--surface-light)",
                        color: "var(--text)",
                        background: editDrafts[p.id] ? "var(--crimson)" : "transparent",
                        fontSize: 9,
                        cursor: "pointer",
                        letterSpacing: "0.15em",
                        transition: "background 0.2s",
                      }}
                    >
                      {editDrafts[p.id] ? "SAVE CHANGES ●" : "SAVE"}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {selectedCollection && products.length === 0 && (
            <p className="font-mono" style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 40 }}>
              No products in this collection yet.
            </p>
          )}
        </div>
      )}

      {/* ── ORDERS TAB ────────────────────────────────────────────────── */}
      {activeTab === "orders" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
            <span className="font-mono" style={{ fontSize: 10, letterSpacing: "0.3em", color: "var(--crimson)" }}>
              ORDER BOARD ({orders.length})
            </span>
            <button
              onClick={fetchOrders}
              className="font-mono"
              style={{ padding: "9px 14px", border: "1px solid var(--surface-light)", color: "var(--text-muted)", fontSize: 9, letterSpacing: "0.14em" }}
            >
              REFRESH
            </button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16, marginTop: 24 }}>
            {orders.map((order) => (
              <div key={order.id} style={{ padding: 18, background: "var(--surface)", border: "1px solid var(--surface-light)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                  <p className="font-display" style={{ fontSize: 20, lineHeight: 1 }}>{order.product_name || "ORDER"}</p>
                  <span className="font-mono" style={{ fontSize: 9, color: "var(--crimson)", letterSpacing: "0.12em" }}>
                    {(order.status || "new").toUpperCase()}
                  </span>
                </div>
                <p className="font-mono" style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 12, lineHeight: 1.7 }}>
                  {order.customer_name || "No name"} / {order.phone || "No phone"}<br />
                  Size {order.selected_size || "-"} / KSh {Number(order.price || 0).toLocaleString()}
                </p>
                <select
                  value={order.status || "new"}
                  onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                  style={{ ...inputStyle, width: "100%", marginTop: 14, padding: 10, fontSize: 12 }}
                >
                  {ORDER_STATUSES.map((statusOption) => <option key={statusOption} value={statusOption}>{statusOption}</option>)}
                </select>
                {order.phone && (
                  <a
                    href={`https://wa.me/${order.phone}`}
                    target="_blank"
                    rel="noreferrer"
                    className="font-mono"
                    style={{ display: "block", marginTop: 10, color: "var(--crimson)", fontSize: 10, letterSpacing: "0.15em" }}
                  >
                    OPEN WHATSAPP →
                  </a>
                )}
              </div>
            ))}
          </div>
          {orders.length === 0 && (
            <p className="font-mono" style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 32 }}>
              No saved orders yet. Run the business growth SQL if this stays empty after testing an order.
            </p>
          )}
        </div>
      )}

      {/* ── GROWTH TAB ────────────────────────────────────────────────── */}
      {activeTab === "analytics" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
            <span className="font-mono" style={{ fontSize: 10, letterSpacing: "0.3em", color: "var(--crimson)" }}>
              GROWTH SIGNALS
            </span>
            <button
              onClick={fetchAnalytics}
              className="font-mono"
              style={{ padding: "9px 14px", border: "1px solid var(--surface-light)", color: "var(--text-muted)", fontSize: 9, letterSpacing: "0.14em" }}
            >
              REFRESH
            </button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 16, marginTop: 24 }}>
            {[
              ["ORDERS", analytics.orders],
              ["PRODUCT VIEWS", analytics.views],
              ["WHATSAPP INTENT", analytics.clicks],
              ["NEWSLETTER", analytics.newsletter],
              ["WAITLIST", analytics.waitlist],
            ].map(([label, value]) => (
              <div key={label} style={{ padding: 22, background: "var(--surface)", border: "1px solid var(--surface-light)" }}>
                <p className="font-display" style={{ fontSize: 42, color: "var(--crimson)", lineHeight: 1 }}>{value}</p>
                <p className="font-mono" style={{ fontSize: 10, color: "var(--text-muted)", letterSpacing: "0.16em", marginTop: 10 }}>{label}</p>
              </div>
            ))}
          </div>
          <p className="font-mono" style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 28, lineHeight: 1.8, maxWidth: 620 }}>
            Use this to see whether products are getting attention before they sell. Views show curiosity, WhatsApp intent shows buying pressure, and orders show the actual lead pipeline.
          </p>
        </div>
      )}

      {/* ── DROPS TAB ────────────────────────────────────────────────── */}
      {activeTab === "drops" && (
        <div>
          <span className="font-mono" style={{ fontSize: 10, letterSpacing: "0.3em", color: "var(--crimson)" }}>
            CREATE DROP
          </span>
          <div style={{ display: "flex", gap: 12, marginTop: 16, flexWrap: "wrap" }}>
            <input
              value={newDrop.collection_name}
              onChange={(e) => setNewDrop({ ...newDrop, collection_name: e.target.value })}
              placeholder="Collection name (e.g., Stoic Samurai Edition)"
              style={{ ...inputStyle, flex: "1 1 250px", minWidth: 220 }}
            />
            <input
              type="datetime-local"
              value={newDrop.drop_date}
              onChange={(e) => setNewDrop({ ...newDrop, drop_date: e.target.value })}
              style={inputStyle}
            />
          </div>
          <button
            onClick={createDrop}
            disabled={saving}
            className="font-mono"
            style={{
              marginTop: 20,
              padding: "14px 32px",
              background: "var(--crimson)",
              border: "none",
              color: "#fff",
              fontSize: 11,
              letterSpacing: "0.2em",
              cursor: "pointer",
            }}
          >
            {saving ? "..." : "CREATE DROP"}
          </button>

          {/* Drop cards */}
          <div style={{ marginTop: 56 }}>
            <span className="font-mono" style={{ fontSize: 10, letterSpacing: "0.3em", color: "var(--crimson)" }}>
              MANAGE DROPS ({drops.length})
            </span>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                gap: 16,
                marginTop: 24,
              }}
            >
              {drops.map((drop) => (
                <div
                  key={drop.id}
                  style={{
                    padding: 20,
                    background: "var(--surface)",
                    border: drop.active ? "1px solid var(--crimson)" : "1px solid var(--surface-light)",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                    <p style={{ fontSize: 14 }}>{drop.collection_name}</p>
                    {drop.active && (
                      <span
                        className="font-mono"
                        style={{ fontSize: 9, background: "var(--crimson)", color: "#fff", padding: "3px 8px", letterSpacing: "0.1em" }}
                      >
                        ACTIVE
                      </span>
                    )}
                  </div>
                  <p className="font-mono" style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 8 }}>
                    {drop.drop_date
                      ? new Date(drop.drop_date).toLocaleString("en-KE", { timeZone: "Africa/Nairobi" })
                      : "No date set"}
                  </p>
                  <p className="font-mono" style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 6 }}>
                    {drop.locked ? "🔒 LOCKED" : "🔓 UNLOCKED"}
                  </p>
                  <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
                    {/* FIX: was setActiveDrop (undefined in old code) — now persists to Supabase */}
                    <button
                      onClick={() => setActiveDrop(drop.id)}
                      disabled={saving || drop.active}
                      className="font-mono"
                      style={{
                        flex: 1,
                        padding: "9px 12px",
                        background: drop.active ? "var(--surface-light)" : "var(--crimson)",
                        border: "none",
                        color: drop.active ? "var(--text-muted)" : "#fff",
                        fontSize: 9,
                        cursor: drop.active ? "default" : "pointer",
                        letterSpacing: "0.15em",
                      }}
                    >
                      {drop.active ? "ACTIVE" : "SET ACTIVE"}
                    </button>
                    <button
                      onClick={() => toggleDropLock(drop.id, !drop.locked)}
                      disabled={saving}
                      className="font-mono"
                      style={{
                        flex: 1,
                        padding: "9px 12px",
                        background: "none",
                        border: "1px solid var(--crimson)",
                        color: "var(--crimson)",
                        fontSize: 9,
                        cursor: "pointer",
                        letterSpacing: "0.15em",
                      }}
                    >
                      {drop.locked ? "UNLOCK" : "LOCK"}
                    </button>
                  </div>
                  <button
                    onClick={() => deleteDrop(drop.id)}
                    className="font-mono"
                    style={{
                      width: "100%",
                      marginTop: 8,
                      padding: "9px 0",
                      border: "1px solid #333",
                      color: "#555",
                      background: "none",
                      fontSize: 9,
                      cursor: "pointer",
                      letterSpacing: "0.15em",
                    }}
                  >
                    DELETE DROP
                  </button>
                </div>
              ))}
            </div>
          </div>

          {waitlistCount > 0 && (
            <div style={{ marginTop: 48, padding: 20, background: "var(--surface)", border: "1px solid var(--crimson)" }}>
              <span className="font-mono" style={{ fontSize: 11, letterSpacing: "0.2em" }}>
                👥 WAITLIST: {waitlistCount} {waitlistCount === 1 ? "person" : "people"}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── ROUTER ────────────────────────────────────────────────────────────────
