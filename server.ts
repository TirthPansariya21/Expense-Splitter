import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json());

// Initialize Gemini client with telemetry header
const apiKey = process.env.GEMINI_API_KEY;
const ai = apiKey
  ? new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', hasGeminiKey: Boolean(apiKey) });
});

// Heuristic fallback parser function
function heuristicParse(prompt: string, members: string[] = [], categories: string[] = []) {
  const text = prompt.trim();
  const lower = text.toLowerCase();

  // Extract amount
  let amount = 0;
  const kMatch = text.match(/(\d+(?:\.\d+)?)\s*k\b/i);
  if (kMatch) {
    amount = parseFloat(kMatch[1]) * 1000;
  } else {
    const numMatch = text.match(/(?:₹|rs\.?|inr)?\s*(\d+(?:\.\d{1,2})?)/i);
    if (numMatch) {
      amount = parseFloat(numMatch[1]);
    }
  }

  // Infer category
  let category = 'Other';
  if (
    lower.includes('dinner') ||
    lower.includes('lunch') ||
    lower.includes('food') ||
    lower.includes('pizza') ||
    lower.includes('cafe') ||
    lower.includes('maggie') ||
    lower.includes('chai') ||
    lower.includes('tea') ||
    lower.includes('breakfast') ||
    lower.includes('restaurant')
  ) {
    category = 'Food';
  } else if (
    lower.includes('cab') ||
    lower.includes('taxi') ||
    lower.includes('bus') ||
    lower.includes('flight') ||
    lower.includes('train') ||
    lower.includes('travel') ||
    lower.includes('petrol') ||
    lower.includes('diesel') ||
    lower.includes('fuel') ||
    lower.includes('auto')
  ) {
    category = 'Travel';
  } else if (
    lower.includes('hotel') ||
    lower.includes('room') ||
    lower.includes('stay') ||
    lower.includes('resort') ||
    lower.includes('cottage') ||
    lower.includes('airbnb') ||
    lower.includes('hostel')
  ) {
    category = 'Stay';
  } else if (
    lower.includes('bill') ||
    lower.includes('wifi') ||
    lower.includes('electricity') ||
    lower.includes('rent') ||
    lower.includes('recharge') ||
    lower.includes('internet')
  ) {
    category = 'Bills';
  } else if (
    lower.includes('shopping') ||
    lower.includes('shawl') ||
    lower.includes('clothes') ||
    lower.includes('souvenir') ||
    lower.includes('market')
  ) {
    category = 'Shopping';
  }

  // Infer payer
  let paidByName = members[0] || '';
  for (const member of members) {
    const firstName = member.split(' ')[0].toLowerCase();
    if (
      lower.includes(`paid by ${firstName}`) ||
      lower.includes(`by ${firstName}`) ||
      lower.includes(member.toLowerCase())
    ) {
      paidByName = member;
      break;
    }
  }

  // Infer participants
  const splitWithNames: string[] = [];
  for (const member of members) {
    const firstName = member.split(' ')[0].toLowerCase();
    if (lower.includes(firstName) || lower.includes(member.toLowerCase())) {
      splitWithNames.push(member);
    }
  }

  const finalSplitWith =
    splitWithNames.length > 0 &&
    !lower.includes('everyone') &&
    !lower.includes('all') &&
    !lower.includes('equally')
      ? splitWithNames
      : members.length > 0
      ? members
      : [paidByName || 'Everyone'];

  // Clean description
  let description = text
    .replace(/(?:paid by\s+\w+|for\s+everyone|split\s+between.*)/gi, '')
    .trim();
  if (!description) description = `${category} Expense`;

  return {
    description,
    amount: amount || 500,
    category,
    paidByName,
    splitWithNames: finalSplitWith,
    splitType: 'EQUAL',
    notes: `Parsed from: "${text}"`,
  };
}

// Quick Add with AI endpoint
app.post('/api/gemini/parse-expense', async (req, res) => {
  const { prompt, members = [], categories = [] } = req.body;

  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ error: 'Prompt text is required.' });
  }

  const memberListStr = members.length > 0 ? members.join(', ') : 'None specified';
  const categoryListStr =
    categories.length > 0 ? categories.join(', ') : 'Food, Travel, Stay, Shopping, Bills, Other';

  const systemInstruction = `You are an AI assistant specialized in parsing natural language expense entries for a group expense sharing app like Splitwise.
Analyze the user's input and extract:
1. "description": A concise, clean description of the expense (e.g. "Dinner at cafe", "Taxi to airport").
2. "amount": The total numerical amount in INR (Indian Rupees). If formatted as "1.2k" convert to 1200.
3. "category": Must be one of: [Food, Travel, Stay, Shopping, Bills, Other]. Choose the closest match.
4. "paidByName": The name of the person who paid. Match closely against group members: [${memberListStr}]. If unclear, pick the closest member or empty string.
5. "splitWithNames": Array of member names who share the expense. If the input implies "everyone", "split equally", or doesn't mention specific participants, include all members: [${memberListStr}]. If specific names are mentioned (e.g. "between Amit and Rahul"), include only those matching members.
6. "splitType": One of "EQUAL", "EXACT", "PERCENT", "SHARES". Usually "EQUAL" unless specific amounts or percentages are described.
7. "notes": Any additional notes or context detected.`;

  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      description: {
        type: Type.STRING,
        description: 'Title or description of the expense',
      },
      amount: {
        type: Type.NUMBER,
        description: 'Total amount in INR (Rupees)',
      },
      category: {
        type: Type.STRING,
        description: 'Category: Food, Travel, Stay, Shopping, Bills, or Other',
      },
      paidByName: {
        type: Type.STRING,
        description: 'Name of the member who paid',
      },
      splitWithNames: {
        type: Type.ARRAY,
        items: {
          type: Type.STRING,
        },
        description: 'Names of members who share this expense',
      },
      splitType: {
        type: Type.STRING,
        description: 'EQUAL, EXACT, PERCENT, or SHARES',
      },
      notes: {
        type: Type.STRING,
        description: 'Explanation or breakdown notes',
      },
    },
    required: ['description', 'amount', 'category', 'splitWithNames'],
  };

  // Helper to attempt Gemini model call
  async function callModel(modelName: string) {
    if (!ai) throw new Error('No AI client');
    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.1,
        responseMimeType: 'application/json',
        responseSchema,
      },
    });
    const parsedText = response.text ? response.text.trim() : '{}';
    return JSON.parse(parsedText);
  }

  if (ai) {
    try {
      const result = await callModel('gemini-3.8-flash');
      return res.json({ success: true, data: result, source: 'gemini-3.8-flash' });
    } catch (primaryErr: any) {
      console.warn('Gemini 3.8 Flash temporary failure, trying gemini-3.1-flash-lite:', primaryErr?.message);
      try {
        const result = await callModel('gemini-3.1-flash-lite');
        return res.json({ success: true, data: result, source: 'gemini-3.1-flash-lite' });
      } catch (fallbackErr: any) {
        console.warn('Gemini models unavailable, using smart heuristic parser:', fallbackErr?.message);
      }
    }
  }

  // Fallback to heuristic parser so the user experience is resilient and never blocked
  const heuristicResult = heuristicParse(prompt, members, categories);
  return res.json({ success: true, data: heuristicResult, source: 'heuristic-fallback' });
});

// Setup Vite in dev mode or serve static files in production
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`SplitEasy server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
