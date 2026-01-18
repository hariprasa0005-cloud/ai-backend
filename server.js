import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" }));

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/* =====================================
   AI QUESTION GENERATION API
===================================== */
app.post("/generate-questions", async (req, res) => {
  try {
    const { syllabusText, subjectName } = req.body;

    if (!syllabusText) {
      return res.status(400).json({ error: "No syllabus text provided" });
    }

    const prompt = `
You are an Anna University question paper setter.

Rules:
- Use ONLY syllabus content
- STRICTLY Unit-wise (UNIT I to UNIT V)
- Ignore page numbers, COs, hours
- Do NOT mention UNIT names in questions
- Follow Anna University pattern

Return ONLY valid JSON:

{
  "partA": ["10 short questions (2 marks)"],
  "partB": [
    { "a": "13-mark question", "b": "OR question" }
  ],
  "partC": ["One 15-mark question"]
}

SUBJECT: ${subjectName}

SYLLABUS:
${syllabusText}
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a university exam paper expert." },
        { role: "user", content: prompt }
      ],
      temperature: 0.4
    });

    const output = completion.choices[0].message.content;
    const questions = JSON.parse(output);

    res.json(questions);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "AI generation failed" });
  }
});

app.listen(process.env.PORT, () => {
  console.log(`Backend running on port ${process.env.PORT}`);
});
