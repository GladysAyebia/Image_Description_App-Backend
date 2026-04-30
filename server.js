import express from 'express';
import cors from 'cors';
import multer from 'multer';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

const allowedOrigins = [
  'https://image-description-app-frontend.vercel.app',
  'http://localhost:5173'
];
app.use(cors({ origin: allowedOrigins }));
app.use(express.json());

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '';
const MODEL = process.env.OPENROUTER_MODEL || 'nvidia/nemotron-nano-12b-v2-vl:free';

const sessions = {};

async function callOpenRouter(messages, model = MODEL) {
  const response = await fetch(OPENROUTER_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'HTTP-Referer': 'https://image-description-app-frontend.vercel.app',
      'X-OpenRouter-Title': 'Image Description App',
    },
    body: JSON.stringify({
      model,
      messages,
      stream: false,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenRouter API error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

app.post('/api/analyze', upload.single('image'), async (req, res) => {
  try {
    if (!req.file || !req.body.prompt) {
      return res.status(400).json({ error: 'Image and prompt are required.' });
    }

    const sessionId = Date.now().toString();
    const base64Image = req.file.buffer.toString('base64');
    const dataUri = `data:${req.file.mimetype};base64,${base64Image}`;

    const messages = [
      {
        role: 'system',
        content: 'You are an expert image analyzer. Provide structured **GitHub-Flavored Markdown (GFM)**. Always include tables for tabular data, with headers and proper formatting. Do not include extra text outside the table unless explicitly asked. Align numbers properly.',
      },
      {
        role: 'user',
        content: [
          { type: 'text', text: req.body.prompt },
          { type: 'image_url', image_url: { url: dataUri } },
        ],
      },
    ];

    const text = await callOpenRouter(messages);

    sessions[sessionId] = [
      { role: 'system', content: messages[0].content },
      { role: 'user', content: [{ type: 'text', text: req.body.prompt }, { type: 'image_url', image_url: { url: '[image]' } }] },
      { role: 'assistant', content: text },
    ];

    res.json({ sessionId, result: text });
  } catch (error) {
    console.error('❌ Error in /api/analyze:', error.message);
    res.status(500).json({ error: 'Failed to analyze image.' });
  }
});

app.post('/api/followup', async (req, res) => {
  try {
    const { sessionId, prompt } = req.body;

    if (!sessionId || !prompt) return res.status(400).json({ error: 'sessionId and prompt are required.' });
    if (!sessions[sessionId]) return res.status(404).json({ error: 'Session not found.' });

    sessions[sessionId].push({ role: 'user', content: prompt });

    const text = await callOpenRouter(sessions[sessionId]);

    sessions[sessionId].push({ role: 'assistant', content: text });

    res.json({ result: text });
  } catch (error) {
    console.error('❌ Error in /api/followup:', error.message);
    res.status(500).json({ error: 'Failed to handle follow-up.' });
  }
});

app.listen(port, () => {
  console.log(`✅ Server running on port ${port}`);
});
