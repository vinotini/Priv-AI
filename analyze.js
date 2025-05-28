import formidable from 'formidable';
import fs from 'fs';
import pdfParse from 'pdf-parse';
import { extractTextFromFile } from '../utils/extractText.js';
import { detectLeaksAI } from '../utils/detectLeaksAI.js';
import { calculateRiskScore } from '../utils/calculateScore.js';

export const config = {
  api: {
    bodyParser: false,  // We'll handle parsing manually
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const form = new formidable.IncomingForm();

  form.parse(req, async (err, fields, files) => {
    if (err) {
      res.status(500).json({ error: 'Error parsing the file' });
      return;
    }

    const file = files.document;

    if (!file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    try {
      const fileBuffer = fs.readFileSync(file.filepath);

      // Extract text (supports PDF, TXT, DOCX planned)
      let extractedText = '';

      if (file.originalFilename.endsWith('.pdf')) {
        const data = await pdfParse(fileBuffer);
        extractedText = data.text;
      } else if (file.originalFilename.endsWith('.txt')) {
        extractedText = fileBuffer.toString('utf8');
      } else {
        // Extend for docx here if needed
        extractedText = fileBuffer.toString('utf8');
      }

      // Run AI/ML inspired leak detection
      const leaks = detectLeaksAI(extractedText);

      // Calculate risk score
      const riskScore = calculateRiskScore(extractedText, leaks);

      // Prepare a text preview (first 500 chars)
      const preview = extractedText.slice(0, 500) + (extractedText.length > 500 ? '...' : '');

      res.status(200).json({
        preview,
        leaks,
        risk_score: riskScore,
      });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });
}
