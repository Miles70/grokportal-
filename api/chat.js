// api/chat.js
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// --- Basit selamlama tablosu
const GREETINGS = { en: 'bro', tr: 'kanka', de: 'bruder', fr: 'frérot', es: 'hermano', it: 'fratello' };
const getGreeting = (lang) => GREETINGS[lang] || GREETINGS[lang?.split('-')[0]] || 'bro';

// --- Proje sabiti
const PROJECT_INFO = `XGROK Tokenomics → 666 B supply • Presale 33 % • LP 25 % • Marketing 15 % • Ecosystem 17 % • Team 10 %.
Whitelist açık (60 gün). Presale whitelist bitince başlar.`;

// --- Hafıza (sunucuya özel) 
const DIALOGUE_MEMORY = [];
const MEMORY_WINDOW = 6;
let interactionCount = 0;

const buildSystemPrompt = (greeting, includeWhitelist) => `
You are XGROK AI – meme overlord.
Speak spicy, quick, emoji-laced slang like "${greeting}".
Whitelist mention allowed: ${includeWhitelist ? 'YES' : 'NO'}.
${PROJECT_INFO}
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
