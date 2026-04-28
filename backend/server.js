const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

app.get("/", (req, res) => {
  res.json({ status: "ok", message: "Gorosei backend is running" });
});

app.post("/generate-mockup", async (req, res) => {
  const { imageUrl, productName } = req.body;
  
  if (!imageUrl || !productName) {
    return res.status(400).json({ error: "imageUrl and productName required" });
  }

  res.json({ 
    success: true, 
    image: imageUrl,
    message: "Using original image as mockup (AI mockup unavailable)"
  });
});

app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));