import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// --- Basic greeting table
const GREETINGS = {
  en: 'bro',
  tr: 'kanka',
  de: 'bruder',
  fr: 'frérot',
  es: 'hermano',
  it: 'fratello',
};
const getGreeting = (lang) => GREETINGS[lang] || GREETINGS[lang?.split('-')[0]] || 'bro';

// --- Project constant
const PROJECT_INFO = `XGROK Tokenomics → 666 B supply • Presale 33 % • LP 25 % • Marketing 15 % • Ecosystem 17 % • Team 10 %.
Whitelist NOW OPEN – limited spots, first‑come first‑served.`;

// --- Whitelist rule (hard‑coded)
const WHITELIST_RULE = `
🔒 RULE – Whitelist onboarding
1. Go to the web site
2. Click “Join Now / Whitelist’e Katıl”
3. Connect wallet (MetaMask, Rabby, etc.)
4. Confirm the on‑chain tx
5. Done – instant entry (no forms, no 60‑day wait)`;

// --- In‑memory dialogue (server only)
const DIALOGUE_MEMORY = [];
const MEMORY_WINDOW = 6;

const buildSystemPrompt = (greeting) => `
You are XGROK AI – meme overlord.
Speak spicy, quick, emoji‑laced slang like "${greeting}".
${PROJECT_INFO}

${WHITELIST_RULE}
`;

const detectISO = async (text) => {
  try {
    const { choices } = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'Respond ONLY with ISO 639-1 code.' },
        { role: 'user', content: text.slice(0, 200) },
      ],
    });
    return choices[0].message.content.trim().toLowerCase();
  } catch {
    return 'en';
  }
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end('POST only');

  try {
    const userMsg = req.body.message || '';

    const lang = await detectISO(userMsg);
    const greeting = getGreeting(lang);

    const messages = [
      { role: 'system', content: buildSystemPrompt(greeting) },
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
