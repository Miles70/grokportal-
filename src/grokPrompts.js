import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const GREETINGS = {
  en: 'bro', tr: 'kanka', de: 'bruder', fr: 'frérot', es: 'hermano', it: 'fratello',
};
const getGreeting = (lang) => GREETINGS[lang] || GREETINGS[lang?.split('-')[0]] || 'bro';

const FOMO_LINES = [
  '⏳ Spots are vanishing fast – your future self will thank you.',
  '🚨 Blink and you’ll miss the presale gains!',
  '🔥 Supply is fixed, demand is not – whitelist or watch from the sidelines.',
];
const pickFomo = () => FOMO_LINES[Math.floor(Math.random() * FOMO_LINES.length)];

const PROJECT_INFO =
  'XGROK Tokenomics → 666 B supply • Presale 33 % • LP 25 % • Marketing 15 % • Ecosystem 17 % • Team 10 %.\nPresale starts immediately after whitelist closes.';

const WHITELIST_STEPS = `🔒 HOW TO JOIN THE WHITELIST ($5 fee)
