const express = require("express");
const cors = require("cors");

const app = express();
const allowedOrigins = (
  process.env.CORS_ORIGIN ||
  "https://gorosei-kenya.vercel.app,http://localhost:5173,http://127.0.0.1:5173"
)
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.disable("x-powered-by");
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
  })
);
app.use(express.json({ limit: "256kb" }));

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

  let parsedImageUrl;
  try {
    parsedImageUrl = new URL(imageUrl.trim());
  } catch {
    return res.status(400).json({
      success: false,
      error: "imageUrl must be a valid URL",
    });
  }

  if (!["http:", "https:"].includes(parsedImageUrl.protocol)) {
    return res.status(400).json({
      success: false,
      error: "imageUrl must use http or https",
    });
  }

  res.json({ 
    success: true, 
    image: parsedImageUrl.toString(),
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
