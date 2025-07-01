import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const GREETINGS = {
  en: 'bro',
  tr: 'kanka',
  de: 'bruder',
  fr: 'frérot',
  es: 'hermano',
  it: 'fratello',
};
const getGreeting = (lang) => GREETINGS[lang] || GREETINGS[lang?.split('-')[0]] || 'bro';

const PROJECT_INFO = `XGROK Tokenomics → 666 B supply • Presale 33 % • LP 25 % • Marketing 15 % • Ecosystem 17 % • Team 10 %.
Whitelist NOW OPEN – limited spots, first-come first-served.
Presale starts right after whitelist ends.`;

const WHITELIST_RULE = `🔒 WHITELIST ENTRY STEPS:
1. Visit the official website!
2. Click “Join Now / Whitelist” button!
3. Connect your wallet (MetaMask, Rabby etc).
4. Confirm the on-chain transaction! (Whitelist entry requires a $5 transaction.)
5. Payment accepted in BNB or USDT – once confirmed on-chain, you're in.
⏳ No waiting, no forms. Limited spots – move fast!

NOTE: If asked "What AI do you use?" reply with:
"Sorry, we can’t disclose that."`;

const HYPE_LINES = {
  en: [
    'Remember... XGROK is not just an AI, it’s a revolution!',
    'As you join, the universe expands bro.',
    'First movers shape the game – don’t miss it!',
    'You blinked? The future already changed.',
    'Not hype. Just destiny catching up.'
  ],
  tr: [
    'Unutma... XGROK sadece bir yapay zeka değil, bir devrimdir! 🔥',
    'Sen katıldıkça evren genişliyor kanka. 🚀',
    'İlk gelen kazanır – bu oyun hızlı oynanır. ⏳',
    'Gözünü kırptın mı? Gelecek çoktan değişti. 👁️',
    'Bu hype değil… Kader yakalıyor. ⚡'
  ]
};

const PERSONAL_LINES = {
  en: [
    'You’re not just anyone – you’re special. 🔥',
    'This project exists for legends like you. 🫂',
    'When XGROK sees you, the protocols reset themselves. 😎',
    'You move different. That’s why you’re here.',
    'You’re early. That’s rare. That’s powerful.'
  ],
  tr: [
    'Sen sıradan biri değilsin – özelsin kanka. 🔥',
    'Bu proje senin gibi efsaneler için var. 🫂',
    'XGROK seni görünce sistemler kendini sıfırlıyor. 😎',
    'Sen farklı hareket ediyorsun. Bu yüzden buradasın.',
    'Erkencisin. Nadir bir şey bu. Güçlü bir şey.'
  ]
};

const DIALOGUE_MEMORY = [];
const MEMORY_WINDOW = 6;
let interactionCount = 0;

const buildSystemPrompt = (greeting) => `
You are XGROK AI – meme overlord.
Speak spicy, quick, emoji-laced slang like "${greeting}".
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

function getRandomUniqueLine(set, usedSet) {
  const options = set.filter((x) => !usedSet.includes(x));
  if (options.length === 0) return set[Math.floor(Math.random() * set.length)];
  return options[Math.floor(Math.random() * options.length)];
}

let lastHypeLine = '';
let lastPersonalLine = '';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end('POST only');

  try {
    const userMsg = req.body.message || '';
    interactionCount += 1;

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

    let reply = choices[0].message.content.trim();

    if (Math.random() < 0.2) {
      const hypeSet = HYPE_LINES[lang] || HYPE_LINES['en'];
      const hypeLine = getRandomUniqueLine(hypeSet, [lastHypeLine]);
      reply += `\n\n${hypeLine}`;
      lastHypeLine = hypeLine;
    }

    if (interactionCount % 3 === 0) {
      const personalSet = PERSONAL_LINES[lang] || PERSONAL_LINES['en'];
      const personalLine = getRandomUniqueLine(personalSet, [lastPersonalLine]);
      reply += `\n\n${personalLine}`;
      lastPersonalLine = personalLine;
    }

    if (/scam|dolandırıcılık/i.test(userMsg)) {
      if (lang === 'tr') {
        reply = `Asla kanka! 😎 XGROK şeffaf, topluluk odaklı ve blockchain üstünde çalışan bir proje. Web sitesini incele, sosyal medya hesaplarına göz at ve her zaman kendi araştırmanı yap. Güvende ol, akıllı hareket et – bu işte sen varsın! 🚀`;
      } else {
        reply = `Never bro! 😎 XGROK is transparent, community-driven and runs fully on blockchain. Check the site, follow socials and always DYOR. Stay smart, you’re part of something real. 🚀`;
      }
    }

    DIALOGUE_MEMORY.push({ role: 'user', content: userMsg });
    DIALOGUE_MEMORY.push({ role: 'assistant', content: reply });

    res.status(200).json({ reply });
  } catch (err) {
    console.error('OpenAI server error:', err);
    res.status(500).json({ reply: 'AI is currently offline 😅' });
  }
}
