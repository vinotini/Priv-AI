// api/analyze.js
import formidable from 'formidable';
import fs from 'fs';
import path from 'path';
import { extractText } from '../utils/extractText.js';
import { detectLeaksAI } from '../utils/detectLeaksAI.js';
import { calculateScore } from '../utils/calculateScore.js';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const form = new formidable.IncomingForm({
    uploadDir: './tmp',
    keepExtensions: true,
  });

  form.parse(req, async (err, fields, files) => {
    if (err || !files.document) {
      return res.status(400).json({ error: 'File upload failed' });
    }

    const filePath = files.document[0].filepath;
    try {
      const text = await extractText(filePath);
      const leaks = detectLeaksAI(text);
      const risk_score = calculateScore(text, leaks);

      res.status(200).json({
        preview: text.slice(0, 1000),
        leaks,
        risk_score,
      });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: 'Failed to analyze file' });
    } finally {
      fs.unlink(filePath, () => {});
    }
  });
}
