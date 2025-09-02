import express from 'express';
import cors from 'cors';
import multer from 'multer';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

// Multer for image upload (5MB limit)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

// Store sessions in memory
const sessions = {};

// Helper: Convert buffer to generative part
function bufferToGenerativePart(buffer, mimeType) {
  return {
    inlineData: {
      data: buffer.toString('base64'),
      mimeType,
    },
  };
}

// Start a new analysis session with an image + prompt
app.post('/api/analyze', upload.single('image'), async (req, res) => {
  try {
    if (!req.file || !req.body.prompt) {
      return res.status(400).json({ error: 'Image and prompt are required.' });
    }

    const sessionId = Date.now().toString();
    const imagePart = bufferToGenerativePart(req.file.buffer, req.file.mimetype);

    // Explicit instruction for Markdown tables (GFM)
    const messages = [
      {
        role: 'user',
        parts: [
          imagePart,
          {

  text: `You are an expert image analyzer. Provide structured **GitHub-Flavored Markdown (GFM)**. Always include tables for tabular data, with headers and proper formatting. Do not include extra text outside the table unless explicitly asked. Align numbers properly. \n\nQuestion: ${req.body.prompt}`,

          },
        ],
      },
    ];

    const result = await model.generateContent({ contents: messages });
    const text = result.response.text();

    // Save session history
    sessions[sessionId] = messages.concat({ role: 'model', parts: [{ text }] });

    res.json({ sessionId, result: text });
  } catch (error) {
    console.error('❌ Error in /api/analyze:', error.message);
    res.status(500).json({ error: 'Failed to analyze image.' });
  }
});

// Follow-up question
app.post('/api/followup', async (req, res) => {
  try {
    const { sessionId, prompt } = req.body;

    if (!sessionId || !prompt) return res.status(400).json({ error: 'sessionId and prompt are required.' });
    if (!sessions[sessionId]) return res.status(404).json({ error: 'Session not found.' });

    sessions[sessionId].push({ role: 'user', parts: [{ text: prompt }] });

    const result = await model.generateContent({ contents: sessions[sessionId] });
    const text = result.response.text();

    sessions[sessionId].push({ role: 'model', parts: [{ text }] });

    res.json({ result: text });
  } catch (error) {
    console.error('❌ Error in /api/followup:', error.message);
    res.status(500).json({ error: 'Failed to handle follow-up.' });
  }
});

app.listen(port, () => {
  console.log(`✅ Server running on http://localhost:${port}`);
});
