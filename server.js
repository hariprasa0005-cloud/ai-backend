import express from "express";
import cors from "cors";
import { GoogleGenerativeAI } from "@google/generative-ai";

const app = express();

/* ===============================
   MIDDLEWARE
================================ */
app.use(cors({
  origin: "*",
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type"]
}));

app.use(express.json({ limit: "2mb" }));

/* ===============================
   GEMINI INIT
================================ */
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/* ===============================
   HEALTH CHECK
================================ */
app.get("/", (req, res) => {
  res.send("Gemini AI backend running ✅");
});

/* ===============================
   GENERATE QUESTIONS API
================================ */
app.post("/generate-questions", async (req, res) => {
  try {
    const { syllabusText, subjectName } = req.body;

    if (!syllabusText || syllabusText.length < 50) {
      return res.status(400).json({
        error: "Invalid or empty syllabus text"
      });
    }

    const prompt = `
You are an Anna University question paper setter.

Create a question paper STRICTLY from the syllabus given.

Return ONLY valid JSON in this exact format:
{
  "partA": ["question1", "question2", "..."],
  "partB": [
    { "a": "question", "b": "question" }
  ],
  "partC": ["question"]
}

Rules:
- Part A: 10 short answer questions (2 marks each)
- Part B: 5 either-or questions (13 marks each)
- Part C: 1 long answer question (15 marks)
- Academic exam language
- Do NOT copy syllabus sentences directly
- No unit numbers
- No page numbers

Subject: ${subjectName}

SYLLABUS:
${syllabusText}
`;

    /* ✅ CORRECT MODEL */
    const model = genAI.getGenerativeModel({
      model: "gemini-1.0-pro"
    });

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    /* CLEAN JSON */
    const cleanJson = responseText
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();

    const parsed = JSON.parse(cleanJson);

    /* BASIC VALIDATION */
    if (!parsed.partA || !parsed.partB || !parsed.partC) {
      throw new Error("Invalid AI response format");
    }

    res.json(parsed);

  } catch (err) {
    console.error("❌ Gemini API Error:", err.message);
    res.status(500).json({
      error: "Question generation failed"
    });
  }
});

/* ===============================
   START SERVER
================================ */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Gemini backend running on port ${PORT}`);
});
