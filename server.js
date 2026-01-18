import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

console.log("Gemini key loaded:", !!process.env.GEMINI_API_KEY);

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/* ================= HEALTH ================= */
app.get("/", (req, res) => {
  res.send("AI backend running ✅");
});

/* ================= TEST ================= */
app.get("/test", async (req, res) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent("Reply only with OK");
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

    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const prompt = `
Generate Anna University question paper.

Return STRICT JSON ONLY:

{
  "partA": ["10 short questions"],
  "partB": [
    { "a": "Question", "b": "Question" }
  ],
  "partC": ["1 long question"]
}

Syllabus:
${syllabusText}
`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    const json = JSON.parse(text.match(/\{[\s\S]*\}/)[0]);
    res.json(json);

  } catch (err) {
    console.error("Gemini error:", err);
    res.status(500).json({ error: "Gemini failed" });
  }
});

/* ================= START ================= */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Backend running on port", PORT);
});
