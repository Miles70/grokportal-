// src/grokPrompts.js  – frontend helper
// Tarayıcıda OpenAI YOK. Sadece /api/chat'a fetch atar.

export async function getAIResponse(message) {
  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message }),
    });
    const data = await res.json();
    return data.reply || '⚠️ AI cevap vermedi.';
  } catch (err) {
    console.error('Fetch error:', err);
    return '❌ AI şu an offline, sonra dene!';
  }
}

export const resetMemory = () => {
  console.warn('resetMemory sadece backend tarafında anlamlı.');
};
