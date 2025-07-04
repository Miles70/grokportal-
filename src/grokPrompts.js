// src/grokPrompts.js
/* Frontend helper – tarayıcıda OpenAI yok. */

export async function getAIResponse(message) {
  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message }),
    });
    const data = await res.json();
    return data.reply || '⚡ AI cevap vermedi.';
  } catch (err) {
    console.error('Fetch error:', err);
    return '⚠️ XGROK AI şu an offline, sonra dene!';
  }
}

/* Belleği tarayıcı tarafında sıfırlamak anlamsız – sadece placeholder. */
export const resetMemory = () => {
  console.warn('resetMemory sadece backend tarafında kullanılır.');
};
