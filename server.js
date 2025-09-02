import express from 'express';
import cors from 'cors';
import multer from 'multer';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Configure multer (5MB limit for safety)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }
});

// Initialize Gemini API client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

function bufferToGenerativePart(buffer, mimeType) {
  return {
    inlineData: {
      data: buffer.toString('base64'),
      mimeType,
    },
  };
}

const model = genAI.getGenerativeModel({
  model: 'gemini-2.0-flash',
  systemInstruction:
    "You are an expert image analyzer. Provide a detailed and well-structured response to the user's question about the image. Use clear markdown formatting, including headings, lists, and bold text. Include emojis where appropriate to make the response engaging and easy to read. Your response should be in a friendly and helpful tone. Wrap your final response in a markdown code block."
});

app.post('/api/analyze', upload.single('image'), async (req, res) => {
  try {
    if (!req.file || !req.body.prompt) {
      return res.status(400).json({ error: 'Image and prompt are required.' });
    }

    const parts = [
      bufferToGenerativePart(req.file.buffer, req.file.mimetype),
      { text: req.body.prompt },
    ];

    const result = await model.generateContent({
      contents: [{ role: 'user', parts }],
    });

    const text = result.response.text();
    res.json({ result: text });

  } catch (error) {
    console.error('Error calling Gemini API:', error.message);
    res.status(500).json({ error: 'Failed to generate content.' });
  }
});

app.listen(port, () => {
  console.log(`✅ Server running on http://localhost:${port}`);
});
