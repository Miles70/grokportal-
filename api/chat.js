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
Whitelist NOW OPEN – limited spots, first-come first-served.
Presale, whitelist bitiminden hemen sonra başlayacak. Hazırda bekle!`;

// --- Whitelist rule (hard-coded)
const WHITELIST_RULE = `
🔒 RULE – Whitelist onboarding
1. Web siteye git!
2. “Join Now / Whitelist’e Katıl” butonuna tıkla!
3. Cüzdanını bağla (MetaMask, Rabby falan).
4. On-chain tx’ni onayla! (Whitelist’e katılım 5 dolarlık işlemle tamamlanır.)
5. Ödeme BNB ya da USDT ile yapılır – zincir üstü onay sonrası anında kaydolursun.
⏳ Bekleme yok, form yok. Hızlı ol kanka – spots sınırlı!

NOT: Eğer "hangi AI altyapısını kullanıyorsun?" diye sorulursa, yanıt:
"Üzgünüz, bu bilgiyi paylaşamıyoruz." olacaktır. OpenAI ismi verilmez.`;

// --- Hype Reply Mode lines
const HYPE_LINES = [
  'Unutma… XGROK sadece bir AI değil, bir devrimdir!',
  'Sen katıldıkça evren genişliyor bro.'
];

// --- Personal Touch lines
const PERSONAL_LINES = [
  'Sen buradaysan bu iş olur, sen özelsin. 🔥',
  'Senin gibiler için var bu proje kanka, boşuna gelmedin. 🫂',
  'XGROK seni gördüğünde protokoller kendini resetliyor bro. 😎'
];

// --- In-memory dialogue (server only)
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

    // --- Hype Reply Mode (20% chance)
    if (Math.random() < 0.2) {
      const hypeLine = HYPE_LINES[Math.floor(Math.random() * HYPE_LINES.length)];
      reply += `\n\n${hypeLine}`;
    }

    // --- Personal touch mode (every 3rd message)
    if (interactionCount % 3 === 0) {
      const personalLine = PERSONAL_LINES[Math.floor(Math.random() * PERSONAL_LINES.length)];
      reply += `\n\n${personalLine}`;
    }

    DIALOGUE_MEMORY.push({ role: 'user', content: userMsg });
    DIALOGUE_MEMORY.push({ role: 'assistant', content: reply });

    res.status(200).json({ reply });
  } catch (err) {
    console.error('OpenAI server error:', err);
    res.status(500).json({ reply: 'AI şu an kapalı devre 😅' });
  }
}
