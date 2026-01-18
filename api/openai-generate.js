import OpenAI from 'openai';

// Simple in-memory rate limit (per IP) to reduce abuse
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 20; // max requests per window
const rateMap = new Map();

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';

    // Basic rate limit
    const now = Date.now();
    const state = rateMap.get(ip) || { count: 0, start: now };
    if (now - state.start > RATE_LIMIT_WINDOW_MS) {
      state.count = 0;
      state.start = now;
    }
    state.count += 1;
    rateMap.set(ip, state);
    if (state.count > RATE_LIMIT_MAX) {
      return res.status(429).json({ error: 'Too many requests' });
    }

    const body = req.body && Object.keys(req.body).length ? req.body : await parseJson(req);
    const { action, payload } = body || {};
    if (!action) return res.status(400).json({ error: 'Missing action' });

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error('OPENAI_API_KEY not configured');
      return res.status(500).json({ error: 'OpenAI API key not configured on the server' });
    }

    const openai = new OpenAI({ apiKey });

    let messages = [];
    let max_tokens = 150;
    let temperature = 0.7;

    switch (action) {
      case 'commentary': {
        // payload: { team1, team2, status }
        messages = [
          { role: 'system', content: 'You are an experienced sports commentator. Provide exciting, brief commentary in Hinglish (Hindi-English mix).' },
          { role: 'user', content: `Match: ${payload.team1} vs ${payload.team2}\nCurrent situation: ${payload.status}\nGenerate a brief, exciting commentary line (max 100 characters).` }
        ];
        max_tokens = 80;
        temperature = 0.8;
        break;
      }

      case 'analysis': {
        // payload: full match object
        messages = [
          { role: 'system', content: 'You are a professional sports analyst. Provide a concise match analysis in Hinglish for an Indian audience.' },
          { role: 'user', content: `Analyze this match:\n${payload.team1.name} ${payload.team1.score} vs ${payload.team2.name} ${payload.team2.score}\nStatus: ${payload.status}\nProvide key insights and turning points (max 250 words).` }
        ];
        max_tokens = 400;
        temperature = 0.7;
        break;
      }

      case 'insights': {
        // payload: { playerName, performance }
        messages = [
          { role: 'system', content: 'You are a sports analyst. Provide player performance insights in Hinglish.' },
          { role: 'user', content: `Player: ${payload.playerName}\nPerformance: ${payload.performance}\nProvide brief insights (max 120 words).` }
        ];
        max_tokens = 150;
        temperature = 0.7;
        break;
      }

      default:
        return res.status(400).json({ error: 'Unknown action' });
    }

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages,
      max_tokens,
      temperature
    });

    const text = response.choices?.[0]?.message?.content?.trim() || '';
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'private, s-maxage=30, stale-while-revalidate=60');
    return res.status(200).json({ text });
  } catch (err) {
    console.error('openai-generate error:', err);
    return res.status(500).json({ error: 'OpenAI generation failed' });
  }
}

// Helper to parse JSON body in environments that don't pre-parse it
async function parseJson(req) {
  try {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const raw = Buffer.concat(chunks).toString('utf8') || '{}';
    return JSON.parse(raw);
  } catch (e) {
    return {};
  }
}
