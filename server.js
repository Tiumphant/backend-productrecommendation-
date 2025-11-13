import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import dotenv from "dotenv"; // ✅ add this
import OpenAI from "openai";

dotenv.config(); // ✅ this loads your .env file

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // ✅ now it will read correctly
});
app.post("/recommend", async (req, res) => {
  const { input, products } = req.body;

  const prompt = `
  You are a product recommendation system.
  User preference: "${input}".
  Given this list of products: ${JSON.stringify(products)}.
  Recommend the top 3 products that best match the user's request. 
  Return only product names in JSON format like: 
  [{"name": "Product1"}, {"name": "Product2"}]
  `;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
    });

    let text = completion.choices[0].message.content.trim();
    text = text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    let recommendedNames = [];
    try {
      recommendedNames = JSON.parse(text);
    } catch (err) {
      console.error("⚠️ Failed to parse AI response:", text);
      return res.status(500).json({
        message: "Invalid AI response format. Try again.",
        raw: text,
      });
    }

    const filtered = products.filter((p) =>
      recommendedNames.some((r) => r.name === p.name)
    );

    res.json({ recommendations: filtered });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error generating recommendations" });
  }
});

app.listen(5000, () => console.log(" Server running on http://localhost:5000"));
