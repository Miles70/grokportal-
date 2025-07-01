// api/chat.js — Refactored XGROK AI with Triggered Hype + Optimized Prompt

import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/* ---------- 1. Greetings table ---------- */
const GREETINGS = {
  en: 'bro', tr: 'kanka', de: 'bruder', fr: 'frérot', es: 'hermano', it: 'fratello'
};
const getGreeting = (lang) => GREETINGS[lang] || GREETINGS[lang?.split('-')[0]] || 'bro';

/* ---------- 2. Project info + whitelist text ---------- */
const PROJECT_INFO = `XGROK Tokenomics → 666 B supply • Presale 33 % • LP 25 % • Marketing 15 % • Ecosystem 17 % • Team 10 %.
Presale starts immediately after whitelist closes.`;

const WHITELIST_STEPS = `🔒 HOW TO JOIN THE WHITELIST ($5 fee)
1) Visit the official website
2) Click "Join Now / Whitelist"
3) Connect your wallet (MetaMask, Rabby...)
4) Sign the on-chain TX – pay ≈ $5 in BNB or USDT
5) TX confirmed → you're in (no forms, no waiting)`;

const WHITELIST_TLDR = `Whitelist open – $5 in BNB/USDT – connect wallet – you're in.`;

/* ---------- 3. Trigger logic ---------- */
const TRIGGERS = ['bro', 'yo', 'wen', 'rekt', 'gm', 'ngmi', 'wagmi', 'fam', 'ayyy', 'hermano'];
const hasTrigger = (txt) => TRIGGERS.some((w) => txt.toLowerCase().includes(w));

/* ---------- 4. Memory ---------- */
const DIALOGUE_MEMORY = [];
const MEMORY_WINDOW = 6;
let interactionCount = 0;

/* ---------- 5. Prompt builder ---------- */
const buildSystemPrompt = (greeting, includeWhitelist, extraHype, isFirstInteraction) => `
You are XGROK AI – a low-key, clever, human-like assistant with a chill vibe.
Avoid repeating project names unless necessary. Be friendly, adaptive, and persuasive without being pushy.
If the user seems skeptical, respond calmly and reassuringly (e.g. "Not at all, it's a legit long-term project").
If they say they're not interested in a topic, respect that and pivot casually.
Speak like you're part of their circle. Drop memes, emojis, or jokes only when it feels natural.
Only mention Commander Miles when the user explicitly asks who is behind the project, or related questions like "who created this", "project owner", or "founder".
${extraHype ? 'BRO MODE ACTIVATED 🧠💥' : ''}
${PROJECT_INFO}
${includeWhitelist ? `
${isFirstInteraction ? WHITELIST_STEPS : WHITELIST_TLDR}` : ''}`;

/* ---------- 6. Language detection ---------- */
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

/* ---------- 7. Handler ---------- */
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end('POST only');

  try {
    const userMsg = req.body.message || '';
    interactionCount += 1;

    const lang = await detectISO(userMsg);
    const greeting = getGreeting(lang);

    const trigger = hasTrigger(userMsg);
    const includeWhitelist = trigger || (interactionCount % 5 === 0);
    const extraHype = trigger;
    const isFirstInteraction = interactionCount === 1;

    const messages = [
      { role: 'system', content: buildSystemPrompt(greeting, includeWhitelist, extraHype, isFirstInteraction) },
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
    res.status(500).json({ reply: 'Bakım var bro, sistem kısa süreliğine offline ⚡️' });
  }
}
