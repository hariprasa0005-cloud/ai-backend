import express from "express";
import cors from "cors";
import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

app.use(cors());
app.use(express.json({ limit: "2mb" }));

// Health check
app.get("/", (req, res) => {
  res.send("AI backend running ✅");
});

// 🔥 REAL AI QUESTION GENERATION
app.post("/generate-questions", async (req, res) => {
  try {
    const { syllabusText, subjectName } = req.body;

    if (!syllabusText) {
      return res.status(400).json({ error: "No syllabus text received" });
    }

    console.log("Syllabus length:", syllabusText.length);

    const prompt = `
You are an Anna University question paper setter.

Using ONLY the syllabus content below, generate a question paper.

Rules:
- Do NOT add outside knowledge
- Do NOT invent topics
- Ignore page numbers, headers, footers
- Use only syllabus concepts

Generate:
PART A: 10 questions (2 marks each)
PART B: 5 questions with (a) and (b) (13 marks)
PART C: 1 long question (15 marks)

Format output strictly as JSON:

{
  "partA": ["Q1", "Q2", ...],
  "partB": [
    { "a": "Question", "b": "Question" }
  ],
  "partC": ["Question"]
}

SYLLABUS:
${syllabusText}
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "user", content: prompt }
      ],
      temperature: 0.3,
      max_tokens: 1200
    });

    const aiText = completion.choices[0].message.content;

    const questions = JSON.parse(aiText);

    res.json(questions);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "AI generation failed" });
  }
});

app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
