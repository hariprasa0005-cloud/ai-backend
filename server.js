import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/* ======================================================
   HEALTH CHECK
====================================================== */

app.get("/", (req, res) => {
  res.send("AI backend running ✅");
});

/* ======================================================
   GENERATE QUESTIONS (GEMINI)
====================================================== */

app.post("/generate-questions", async (req, res) => {
  try {
    const { syllabusText, subjectName } = req.body;

    if (!syllabusText) {
      return res.status(400).json({ error: "No syllabus text provided" });
    }

    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash"
    });

    const prompt = `
You are an Anna University question paper setter.

Subject: ${subjectName}

STRICT RULES:
- Use ONLY the given syllabus text
- Ignore page numbers, headers, footers
- No hallucination
- No extra topics
- Academic exam language

SYLLABUS:
${syllabusText}

OUTPUT FORMAT (JSON ONLY):

{
  "partA": [
    "Question",
    "Question"
  ],
  "partB": [
    { "a": "Question", "b": "Question" }
  ],
  "partC": [
    "Question"
  ]
}

Generate:
- Part A: 10 very short 2-mark questions
- Part B: 5 either-or 13-mark questions
- Part C: 1 long 15-mark question
`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    // Extract JSON safely
    const jsonStart = text.indexOf("{");
    const jsonEnd = text.lastIndexOf("}");

    const jsonString = text.substring(jsonStart, jsonEnd + 1);
    const questions = JSON.parse(jsonString);

    res.json(questions);

  } catch (error) {
    console.error("Gemini Error:", error);
    res.status(500).json({ error: "Gemini API failed" });
  }
});

/* ======================================================
   START SERVER
====================================================== */

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
