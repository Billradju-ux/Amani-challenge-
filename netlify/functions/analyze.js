exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Allow-Methods': 'POST, OPTIONS' }, body: '' };
  }
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };
  try {
    const { imageBase64, mediaType, officialNumbers } = JSON.parse(event.body);
    const numsText = officialNumbers ? Object.entries(officialNumbers).filter(([,v])=>v).map(([k,v])=>`${k}: ${v}`).join(', ') : 'Non configurés';
    const prompt = `You are an expert at reading Mobile Money payment receipt screenshots from DRC Congo. Extract: montant_fc (integer FC, USD*2800), operateur (Airtel Money/M-Pesa/Orange Money/Inconnu), numero_destinataire, reference, est_valide (true/false). Official numbers: ${numsText}. Reply ONLY with raw JSON: {"montant_fc":<int>,"operateur":"<str>","numero_destinataire":"<str>","reference":"<str>","est_valide":<bool>}`;
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`, 'HTTP-Referer': 'https://stalwart-shortbread-688058.netlify.app', 'X-Title': 'Amani Challenge' },
      body: JSON.stringify({ model: 'google/gemma-3-27b-it:free', messages: [{ role: 'user', content: [{ type: 'image_url', image_url: { url: `data:${mediaType||'image/jpeg'};base64,${imageBase64}` } }, { type: 'text', text: prompt }] }], max_tokens: 300, temperature: 0.1 })
    });
    const data = await response.json();
    if (data.error) throw new Error(data.error.message || JSON.stringify(data.error));
    const text = data.choices?.[0]?.message?.content || '';
    return { statusCode: 200, headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' }, body: JSON.stringify({ text }) };
  } catch (e) {
    return { statusCode: 500, headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' }, body: JSON.stringify({ error: e.message }) };
  }
};
