import express from "express";
import cors from "cors";
import OpenAI from "openai";

const app = express();

/* 🔥 FIXED CORS (ALLOW NETLIFY) */
app.use(cors({
  origin: "*",
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type"]
}));

app.use(express.json({ limit: "2mb" }));

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

app.get("/", (req, res) => {
  res.send("AI backend running ✅");
});

app.post("/generate-questions", async (req, res) => {
  try {
    const { syllabusText, subjectName } = req.body;

    if (!syllabusText) {
      return res.status(400).json({ error: "Missing syllabus text" });
    }

    const prompt = `
Generate Anna University question paper.

Return STRICT JSON:
{
  "partA": ["..."],
  "partB": [{ "a": "...", "b": "..." }],
  "partC": ["..."]
}

Subject: ${subjectName}
Syllabus:
${syllabusText}
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
      max_tokens: 1200
    });

    const text = completion.choices[0].message.content;
    const json = JSON.parse(text);

    res.json(json);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "AI generation failed" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Backend running"));
