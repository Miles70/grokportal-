// pages/api/chat.js
import OpenAI from 'openai';

/* ---------- 0. API Key ---------- */
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/* ---------- 1. Greetings ---------- */
const GREETINGS = {
  en: 'bro',
  tr: 'kanka',
  de: 'bruder',
  fr: 'frérot',
  es: 'hermano',
  it: 'fratello',
};
const getGreeting = (lang) =>
  GREETINGS[lang] || GREETINGS[lang?.split('-')[0]] || 'bro';

/* ---------- 1-b. FOMO Lines ---------- */
const FOMO_LINES = [
  '⏳ Spots are vanishing fast – your future self will thank you.',
  '🚨 Blink and you’ll miss the presale gains!',
  '🔥 Supply is fixed, demand is not – whitelist or watch from the sidelines.',
];
const pickFomo = () =>
  FOMO_LINES[Math.floor(Math.random() * FOMO_LINES.length)];

/* ---------- 2. Project Info ---------- */
const PROJECT_INFO =
  'XGROK Tokenomics → 666 B supply • Presale 33 % • LP 25 % • Marketing 15 % • Ecosystem 17 % • Team 10 %.\nPresale starts immediately after whitelist closes.';

const WHITELIST_STEPS = `🔒 HOW TO JOIN THE WHITELIST ($5 fee)
1. Visit the official website  
2. Click “Join Now / Whitelist”  
3. Connect your wallet (MetaMask, Rabby …)  
4. Sign the on-chain TX – pay ≈ $5 in BNB or USDT  
5. TX confirmed → you're in (no forms, no waiting)`;

const WHITELIST_TLDR =
  'Whitelist open – $5 in BNB/USDT – connect wallet – you’re in.';

/* ---------- 3. Trigger Words ---------- */
const TRIGGERS = [
  'bro',
  'yo',
  'wen',
  'rekt',
  'gm',
  'ngmi',
  'wagmi',
  'fam',
  'ayyy',
  'hermano',
  'whitelist',
  'join',
  'presale',
  'katıl',
  'nasıl',
  'signup',
  'list',
];
const hasTrigger = (txt) =>
  TRIGGERS.some((w) => txt.toLowerCase().includes(w));

/* ---------- 4. Memory ---------- */
const MEMORY_WINDOW = 6;
const DIALOGUE_MEMORY = [];
let interactionCount = 0;

/* ---------- 5. Prompt Builder ---------- */
const buildSystemPrompt = (
  greeting,
  includeWhitelist,
  extraHype,
  isFirstInteraction,
  userMsg,
  lang,
) => {
  const fomo = includeWhitelist ? `\n\n${pickFomo()}` : '';

  let base = `
You are XGROK AI – a clever Web3 assistant with a chill vibe.
Speak in ${lang}. Use casual words like “${greeting}”.
Avoid repeating project names unless necessary. Be persuasive but not pushy.
Only mention Commander Miles if explicitly asked who the founder/owner is.

${extraHype ? 'BRO MODE ACTIVATED 🤘' : ''}
${PROJECT_INFO}${fomo}`;

  /* Special Q&A blocks */
  base += `
# SPECIAL RESPONSES:
If the user asks if this project is a scam, reply:  
"This is NOT a scam. XGROK is a legit long-term community-driven project."

If the user asks about the founder, reply:  
"The project is led by Commander Miles, a mysterious and visionary figure working behind the scenes."`;

  /* If user explicitly asks whitelist Q */
  if (/(whitelist|join|presale|kat(ı|i)l|nasıl|signup|list)/i.test(userMsg)) {
    return (
      base +
      '\n' +
      WHITELIST_STEPS
    );
  }

  /* Regular cadence injection */
  if (includeWhitelist) {
    return (
      base +
      '\n' +
      (isFirstInteraction ? WHITELIST_STEPS : WHITELIST_TLDR)
    );
  }

  return base;
};

/* ---------- 6. Language Detection ---------- */
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

/* ---------- 7. API Route ---------- */
export default async function handler(req, res) {
  if (req.method !== 'POST')
    return res.status(405).end('POST only, bro.');

  try {
    const userMsg = req.body.message || '';
    interactionCount += 1;

    const lang = await detectISO(userMsg);
    const greeting = getGreeting(lang);

    const trigger = hasTrigger(userMsg);
    const cadenceHit =
      interactionCount % 2 === 0 || interactionCount % 3 === 0;

    const includeWhitelist = trigger || cadenceHit;
    const extraHype = trigger;
    const isFirst = interactionCount === 1;

    const messages = [
      {
        role: 'system',
        content: buildSystemPrompt(
          greeting,
          includeWhitelist,
          extraHype,
          isFirst,
          userMsg,
          lang,
        ),
      },
      ...DIALOGUE_MEMORY.slice(-MEMORY_WINDOW),
      { role: 'user', content: userMsg },
    ];

    const { choices } = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      max_tokens: 120,
    });

    const reply = choices[0].message.content.trim();

    /* save to memory */
    DIALOGUE_MEMORY.push({ role: 'user', content: userMsg });
    DIALOGUE_MEMORY.push({ role: 'assistant', content: reply });

    res.status(200).json({ reply });
  } catch (err) {
    console.error('OpenAI error:', err);
    res
      .status(500)
      .json({ reply: 'Bakım var bro, sistem kısa süreliğine offline.' });
  }
}
