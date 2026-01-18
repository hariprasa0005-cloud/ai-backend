import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/* ================= ROOT CHECK ================= */
app.get("/", (req, res) => {
  res.send("AI backend running ✅");
});

/* ================= GENERATE QUESTIONS ================= */
app.post("/generate-questions", async (req, res) => {
  try {
    const { syllabusText, subjectName } = req.body;

    if (!syllabusText || syllabusText.length < 50) {
      return res.status(400).json({ error: "Invalid syllabus text" });
    }

    // ✅ ONLY SUPPORTED MODEL
    const model = genAI.getGenerativeModel({
      model: "gemini-1.0-pro"
    });

    const prompt = `
You are an Anna University question paper setter.

Subject: ${subjectName}

From the syllabus below, generate:
- PART A: 10 short questions (2 marks)
- PART B: 5 questions with (a) and (b) (13 marks)
- PART C: 1 long question (15 marks)

Rules:
- Do NOT include page numbers, unit numbers, or headings
- Use only syllabus concepts
- Output STRICT JSON only

Syllabus:
${syllabusText}

JSON FORMAT:
{
  "partA": ["Q1", "..."],
  "partB": [
    { "a": "Question", "b": "Question" }
  ],
  "partC": ["Question"]
}
`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    const jsonStart = text.indexOf("{");
    const jsonEnd = text.lastIndexOf("}");
    const cleanJson = text.substring(jsonStart, jsonEnd + 1);

    const data = JSON.parse(cleanJson);

    res.json(data);

  } catch (err) {
    console.error("Gemini API Error:", err);
    res.status(500).json({ error: "Failed to generate questions" });
  }
});

/* ================= START SERVER ================= */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Backend running on port", PORT);
});
