const express = require("express");
const cors = require("cors");

const app = express();
const allowedOrigin = process.env.CORS_ORIGIN || "*";

app.use(cors({ origin: allowedOrigin }));
app.use(express.json({ limit: "2mb" }));

const PORT = process.env.PORT || 5000;

app.get("/", (req, res) => {
  res.json({ status: "ok", message: "Gorosei backend is running" });
});

app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "gorosei-backend" });
});

app.post("/generate-mockup", async (req, res) => {
  const { imageUrl, productName } = req.body;
  
  if (typeof imageUrl !== "string" || typeof productName !== "string") {
    return res.status(400).json({
      success: false,
      error: "imageUrl and productName must be strings",
    });
  }

  if (!imageUrl.trim() || !productName.trim()) {
    return res.status(400).json({
      success: false,
      error: "imageUrl and productName are required",
    });
  }

  res.json({ 
    success: true, 
    image: imageUrl.trim(),
    productName: productName.trim(),
    message: "Using original image as mockup (AI mockup unavailable)"
  });
});

app.use((req, res) => {
  res.status(404).json({ success: false, error: "Endpoint not found" });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ success: false, error: "Internal server error" });
});

app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
