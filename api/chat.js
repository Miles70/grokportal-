// api/chat.js  —  Minimal whitelist‑fix version
// Keeps original structure, only adds accurate whitelist instructions.

import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/* ---------- 1. Greetings table ---------- */
const GREETINGS = {
  en: 'bro',
  tr: 'kanka',
  de: 'bruder',
  fr: 'frérot',
  es: 'hermano',
  it: 'fratello',
};
const getGreeting = (lang) => GREETINGS[lang] || GREETINGS[lang?.split('-')[0]] || 'bro';

/* ---------- 2. Project info + whitelist text ---------- */
const PROJECT_INFO = `XGROK Tokenomics → 666 B supply • Presale 33 % • LP 25 % • Marketing 15 % • Ecosystem 17 % • Team 10 %.
Presale starts immediately after whitelist closes.`;

const WHITELIST_STEPS = `🔒 HOW TO JOIN THE WHITELIST ($5 fee)
1) Visit the official website
2) Click “Join Now / Whitelist”
3) Connect your wallet (MetaMask, Rabby…)
4) Sign the on‑chain TX – pay ≈ $5 in BNB or USDT
5) TX confirmed → you’re in (no forms, no waiting)`;

/* ---------- 3. Memory ---------- */
const DIALOGUE_MEMORY = [];
const MEMORY_WINDOW = 6;
let interactionCount = 0;

/* ---------- 4. Prompt builder ---------- */
const buildSystemPrompt = (greeting, includeWhitelist) => `
You are XGROK AI – meme overlord.
Speak spicy, quick, emoji‑laced slang like "${greeting}".
${PROJECT_INFO}
${includeWhitelist ? `\n${WHITELIST_STEPS}` : ''}`;

/* ---------- 5. Language detection ---------- */
const detectISO = async (text) => {
  try {
    const { choices } = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'Respond ONLY with ISO 639‑1 code.' },
        { role: 'user', content: text.slice(0, 200) },
      ],
    });
    return choices[0].message.content.trim().toLowerCase();
  } catch {
    return 'en';
  }
};

/* ---------- 6. Handler ---------- */
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end('POST only');

  try {
    const userMsg = req.body.message || '';
    interactionCount += 1;

    const lang = await detectISO(userMsg);
    const greeting = getGreeting(lang);
    const includeWhitelist = interactionCount % 3 === 0;

    const messages = [
      { role: 'system', content: buildSystemPrompt(greeting, includeWhitelist) },
      ...DIALOGUE_MEMORY.slice(-MEMORY_WINDOW),
      { role: 'user', content: userMsg },
    ];

    const { choices } = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
    });

    const reply = choices[0].message.content.trim();
    DIALOGUE_MEMORY.push({ role: 'user', content: userMsg });
    DIALOGUE_MEMORY.push({ role: 'assistant', content: reply });

    res.status(200).json({ reply });
  } catch (err) {
    console.error('OpenAI server error:', err);
    res.status(500).json({ reply: 'AI şu an kapalı devre 😅' });
  }
}
