// src/grokPrompts.js
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/* ---------- CONSTANTS ---------- */
export const GREETINGS = {
  en: 'bro',
  tr: 'kanka',
  de: 'bruder',
  fr: 'frérot',
  es: 'hermano',
  it: 'fratello',
};

export const getGreeting = (lang) =>
  GREETINGS[lang] || GREETINGS[lang?.split('-')[0]] || 'bro';

export const FOMO_LINES = [
  '⏳ Spots are vanishing fast – your future self will thank you.',
  '🚨 Blink and you’ll miss the presale gains!',
  '🔥 Supply is fixed, demand is not – whitelist or watch from the sidelines.',
];

export const pickFomo = () =>
  FOMO_LINES[Math.floor(Math.random() * FOMO_LINES.length)];

export const PROJECT_INFO =
  'XGROK Tokenomics → 666 B supply • Presale 33 % • LP 25 % • Marketing 15 % • Ecosystem 17 % • Team 10 %.\nPresale starts immediately after whitelist closes.';

export const WHITELIST_STEPS = `🔒 HOW TO JOIN THE WHITELIST ($5 fee)
1. Connect your wallet (MetaMask) 🔗
2. Click "Join Now" 🚀
3. Approve the $5 fee ✅
4. You’re in! Welcome to the XGROK army 🧠👑`;

/* ---------- MAIN REPLY FUNK ---------- */
export async function getAIResponse(message, lang = 'en') {
  const lower = message.toLowerCase();

  // whitelist intent
  if (/(whitelist|join|presale|kat(ı|i)l|signup|list)/i.test(lower)) {
    return `${WHITELIST_STEPS}\n\n${pickFomo()}`;
  }

  // tokenomics
  if (/(tokenomics|supply|burn|arz)/i.test(lower)) {
    return PROJECT_INFO;
  }

  // generic greeting
  if (/^(gm|hey|hi|hello|selam|yo)/i.test(lower)) {
    return `gm ${getGreeting(lang)} 👋`;
  }

  /* ---------- fallback → let OpenAI freestyle ---------- */
  try {
    const resp = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            'You are XGROK AI, a hype Web3 assistant. Answer concisely, meme-friendly, with a bit of swagger.',
        },
        { role: 'user', content: message },
      ],
      max_tokens: 120,
    });

    return resp.choices?.[0]?.message?.content?.trim() || '⚡️';
  } catch (err) {
    console.error('OpenAI error', err);
    return '⚠️ I seem offline right now, try again later.';
  }
}
