const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;
const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;

app.post("/generate-mockup", async (req, res) => {
  const { imageUrl, productName } = req.body;
  
  if (!imageUrl || !productName) {
    return res.status(400).json({ error: "imageUrl and productName required" });
  }

  try {
    const response = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Token ${REPLICATE_API_TOKEN}`,
      },
      body: JSON.stringify({
        version: "4e38eb73c48c3f5d94137c6d39cd54967588372f1f9f46c078c8c29e32872379",
        input: {
          image: imageUrl,
          prompt: `white t-shirt mockup of ${productName}, product photography, white background, high quality`,
          reference_image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800",
          num_inference_steps: 50,
        },
      }),
    });

    const data = await response.json();
    
    if (data.error) {
      return res.status(500).json({ error: data.error });
    }

    res.json({ prediction: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));