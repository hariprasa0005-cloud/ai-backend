import express from "express";
import cors from "cors";
import { GoogleGenerativeAI } from "@google/generative-ai";

const app = express();
app.use(cors({ origin: "*", methods: ["GET", "POST"] }));
app.use(express.json({ limit: "2mb" }));

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/* ===============================
   HEALTH CHECK
================================ */
app.get("/", (req, res) => {
  res.send("Gemini AI backend running ✅");
});

/* ===============================
   GENERATE QUESTIONS
================================ */
app.post("/generate-questions", async (req, res) => {
  try {
    const { syllabusText, subjectName } = req.body;

    if (!syllabusText) {
      return res.status(400).json({ error: "Syllabus text missing" });
    }

    const prompt = `
You are an Anna University question paper setter.

Generate questions STRICTLY from the syllabus below.

Return ONLY valid JSON in this format:
{
  "partA": ["question1", "question2", "..."],
  "partB": [
    { "a": "question", "b": "question" }
  ],
  "partC": ["question"]
}

Rules:
- Part A: 10 short questions (2 marks)
- Part B: 5 either-or questions (13 marks)
- Part C: 1 long question (15 marks)
- No unit titles
- No page numbers
- No syllabus sentences copied directly

Subject: ${subjectName}

SYLLABUS:
${syllabusText}
`;

    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash"
    });

    const result = await model.generateContent(prompt);
    const response = result.response.text();

    // Clean & parse JSON
    const cleanJson = response
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    const data = JSON.parse(cleanJson);

    res.json(data);
  } catch (err) {
    console.error("❌ Gemini Error:", err);
    res.status(500).json({ error: "Gemini generation failed" });
  }
});

/* ===============================
   START SERVER
================================ */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Gemini backend running on port ${PORT}`);
});
