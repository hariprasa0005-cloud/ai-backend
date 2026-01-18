import express from "express";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: "1mb" }));

// Health check
app.get("/", (req, res) => {
  res.send("Backend is alive ✅");
});

// Test endpoint (confirms frontend connection)
app.post("/generate-questions", (req, res) => {
  console.log("✅ Request received from frontend");

  const { syllabusText, subjectName } = req.body;
  console.log("Syllabus length:", syllabusText?.length);

  res.json({
    partA: [
      "Define management.",
      "What is planning?"
    ],
    partB: [
      {
        a: "Explain principles of management.",
        b: "Discuss functions of management."
      }
    ],
    partC: [
      "Explain management concepts in detail."
    ]
  });
});

app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
