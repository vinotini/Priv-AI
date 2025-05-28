import express from "express";
import multer from "multer";
import path from "path";
import { extractText } from "../utils/extractText.js";
import { detectLeaksAI } from "../utils/detectLeaksAI.js";
import { calculateScore } from "../utils/calculateScore.js";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

router.post("/api/analyze", upload.single("document"), async (req, res) => {
  try {
    const filePath = req.file.path;
    const mimetype = req.file.mimetype;

    const text = await extractText(filePath, mimetype);

    if (!text || text.trim() === "") {
      return res.status(400).json({ error: "Failed to extract text from document" });
    }

    const leaks = detectLeaksAI(text);
    const riskScore = calculateScore(text, leaks);

    return res.json({ text, leaks, riskScore });
  } catch (err) {
    console.error("Analyze error:", err);
    return res.status(500).json({ error: "Server error during analysis" });
  }
});

export default router;
