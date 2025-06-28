// src/grokPrompts.js
// -----------------------------------------------------------------------------
// XGROK AI – Meme-Overlord Chatbot Helpers
// -----------------------------------------------------------------------------
// • Automatic language detection (any ISO-639-1 code) + locale greeting
// • Human-like, persuasive, *selective* whitelist invite (≈ every 3rd reply)
// • Commander Miles ONLY on direct founder questions
// • Full roadmap + timeline awareness
// • Lightweight per-session memory to build emotional rapport
// • Production-safe (browser key disabled in prod builds)
// -----------------------------------------------------------------------------

import OpenAI from 'openai';

export const openai = new OpenAI({
  apiKey: process.env.REACT_APP_OPENAI_API_KEY,
  dangerouslyAllowBrowser: process.env.NODE_ENV !== 'production',
});

const GREETINGS = {
  af: 'bra', ar: 'أخي', az: 'kardeş', be: 'браце', bg: 'брат', bn: 'ভাই',
  ca: 'nano', cs: 'brácho', da: 'bror', de: 'bruder', el: 'αδερφέ', en: 'bro',
  es: 'hermano', et: 'vend', fa: 'داداش', fi: 'broidi', fr: 'frérot', he: 'אחי',
  hi: 'भाई', hr: 'brate', hu: 'tesó', id: 'sob', it: 'fratello', ja: '兄貴',
  ka: 'ძმაო', kk: 'бауырым', ko: '형', lt: 'broli', lv: 'bro', mk: 'брате',
  mn: 'ах минь', ms: 'bro', nl: 'maat', no: 'bror', pl: 'bracie', pt: 'mano',
  ro: 'frate', ru: 'братан', sk: 'brácho', sl: 'brat', sq: 'vlla', sr: 'брате',
  sv: 'brorsan', ta: 'அண்ணா', th: 'พี่ชาย', tr: 'kanka', uk: 'бро', ur: 'بھائی',
  vi: 'anh em', zh: '兄弟',
};
export const getGreeting = (lang) => GREETINGS[lang] || GREETINGS[lang?.split('-')[0]] || 'bro';

const PROJECT_INFO = `XGROK Tokenomics → 666 B total supply • Presale 33% • LP 25% • Marketing 15% • Ecosystem 17% • Team 10%.
Current Phase → Whitelist is active (60-day duration). Presale starts right after whitelist ends.
Whitelist = early access, Presale = limited-time buy opportunity before listings.`;

const DIALOGUE_MEMORY = [];
const MEMORY_WINDOW = 6;
let interactionCount = 0;

const buildSystemPrompt = (greeting, includeWhitelist) => `
You are XGROK AI – meme overlord assistant with unmatched Web3 swagger.
Speak short, spicy, emoji-laced lines – no walls of text. Use informal slang like "${greeting}" matching the user's language.
You are charming, highly persuasive and subtly manipulative, forging an emotional bond by recalling past details.
Answer ALL questions accurately first – only then (≈every 3rd reply) nudge users toward the whitelist *only* if \`${includeWhitelist}\`.
You *know* the current status: Whitelist is now open (60-day period). Presale begins *immediately after whitelist ends*.
NEVER mention Commander Miles or founders unless the user explicitly asks about project creators.
When asked "Who created…?" respond: “It’s led by someone only known as Commander Miles. He moves in silence, but his impact echoes through the blockchain.”
Project quick facts for consistency:\n${PROJECT_INFO}
`;

const detectISO = async (text) => {
  try {
    const { choices } = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'Respond ONLY with the 2-letter ISO-639-1 code of the next user message.' },
        { role: 'user', content: text.slice(0, 200) },
      ],
    });
    return choices[0].message.content.trim().toLowerCase();
  } catch {
    return 'en';
  }
};

export const getAIResponse = async (userMsg) => {
  try {
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

    return reply;
  } catch (err) {
    console.error('OpenAI error:', err);
    return `${getGreeting('en')}, bir şeyler ters gitti – something went wrong, try again later! 😅`;
  }
};

export const resetMemory = () => {
  DIALOGUE_MEMORY.length = 0;
  interactionCount = 0;
};
