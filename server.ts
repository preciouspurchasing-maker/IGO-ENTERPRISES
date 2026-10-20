import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { parseReceiptWithGemini } from './src/server/receiptParser.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = parseInt(process.env.PORT || '3000', 10);

app.use(express.json({ limit: '30mb' }));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', hasApiKey: !!process.env.GEMINI_API_KEY });
});

app.post('/api/parse-receipt', async (req, res) => {
  try {
    const { image, mimeType } = req.body;
    if (!image) {
      return res.status(400).json({ error: 'Missing image data' });
    }

    const result = await parseReceiptWithGemini(image, mimeType || 'image/jpeg');
    res.json({ success: true, data: result });
  } catch (err: any) {
    console.error('Error in /api/parse-receipt:', err);
    res.status(500).json({ error: err.message || 'Failed to parse receipt' });
  }
});

// Serve static frontend assets
const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));

app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Server listening on port ${port}`);
});
