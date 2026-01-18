import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

if (!process.env.GEMINI_API_KEY) {
  console.error("❌ GEMINI_API_KEY missing");
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/* ================= HEALTH CHECK ================= */
app.get("/", (req, res) => {
  res.send("AI backend running ✅");
});

/* ================= TEST GEMINI ================= */
app.get("/test", async (req, res) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.0-pro" });
    const result = await model.generateContent("Say OK");
    res.json({ reply: result.response.text() });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

/* ================= GENERATE QUESTIONS ================= */
app.post("/generate-questions", async (req, res) => {
  try {
    const { syllabusText } = req.body;

    if (!syllabusText || syllabusText.length < 100) {
      return res.status(400).json({ error: "Syllabus too short" });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.0-pro" });

    const prompt = `
Create Anna University questions from this syllabus.

Return STRICT JSON only.

{
  "partA": ["Q1", "..."],
  "partB": [
    { "a": "Question", "b": "Question" }
  ],
  "partC": ["Question"]
}

Syllabus:
${syllabusText}
`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    const json = JSON.parse(text.match(/\{[\s\S]*\}/)[0]);
    res.json(json);

  } catch (e) {
    console.error("❌ Gemini error:", e);
    res.status(500).json({ error: "Gemini failed" });
  }
});

/* ================= START ================= */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Backend running on port", PORT);
});
