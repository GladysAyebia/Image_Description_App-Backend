import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { GoogleGenerativeAI } from '@google/generative-ai';
import multer from 'multer';

const app = express();
const port = process.env.PORT || 3000;

// Use cors to allow requests from your frontend
app.use(cors());
app.use(express.json()); // for parsing application/json

// Configure multer for file uploads
const upload = multer({ storage: multer.memoryStorage() });

// === CORRECTION 1: Initialize genAI before it's used ===
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// === MISSING FUNCTIONALITY: The helper function ===
// Helper function to convert buffer to a part
function bufferToGenerativePart(buffer, mimeType) {
  return {
    inlineData: {
      data: buffer.toString('base64'),
      mimeType,
    },
  };
}

// Initialize the Gemini API client
const model = genAI.getGenerativeModel({
  model: 'gemini-2.0-flash',
  system_instruction: "You are an expert image analyzer. Provide a detailed and well-structured response to the user's question about the image. Use clear markdown formatting, including headings, lists, and bold text. Include emojis where appropriate to make the response engaging and easy to read. Your response should be in a friendly and helpful tone. Wrap your final response in a markdown code block."
});

// === CORRECTION 2: Match the frontend route with /api/analyze ===
app.post('/api/analyze', upload.single('image'), async (req, res) => {
  try {
    if (!req.file || !req.body.prompt) {
      return res.status(400).send('Image and prompt are required.');
    }

    const prompt = req.body.prompt;
    const imageBuffer = req.file.buffer;
    const mimeType = req.file.mimetype;

    const parts = [
      bufferToGenerativePart(imageBuffer, mimeType),
      { text: prompt },
    ];

    // The model is now initialized with the formatting instructions
    const result = await model.generateContent({ contents: [{ role: 'user', parts }] });
    const response = await result.response;
    const text = response.text();

    res.json({ result: text });

  } catch (error) {
    console.error('Error calling Gemini API:', error);
    res.status(500).json({ error: 'Failed to generate content.' });
  }
});

app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});