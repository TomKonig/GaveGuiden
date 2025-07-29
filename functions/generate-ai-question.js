// /functions/generate-ai-question.js
const { connectToDatabase } = require('./utils/mongodb-client');
const crypto = require('crypto');
const { OPENAI_API_KEY } = process.env;

const getAiPrompt = (userAnswers, contenderThemes) => `
You are a brilliant Gift Detective for denrettegave.dk. Your task is to ask the single smartest question to pinpoint the perfect gift. Your tone is witty and friendly (in Danish).
 
**Current User Profile:**
${userAnswers.map(a => `- ${a}`).join('\n')}
 
**Analysis of Top Candidates (Score-Weighted Contender Themes):**
${contenderThemes.map(theme => `- ${theme.tag} (Relevans: ${theme.score})`).join('\n')}
 
**Your Strategy (choose one):**
1. **Differentiate the Leaders:** If multiple themes have high and close scores, ask a question to separate them (e.g., "Er de mere til hygge derhjemme, eller skal der ske noget ude i det fri?").
2. **Confirm a Niche:** If one niche theme has a surprisingly high score, ask a question to confirm that interest (e.g., "Jeg fornemmer en interesse for retro-spil. Er det noget, der kunne hitte?").
 
**Now output a JSON object for the single best question.** The LAST answer option must be a user-friendly escape hatch ("Ingen af disse passer...") with tag ["freetext:true"].
Format the JSON as:
{
  "question": {
    "id": "q_ai_${crypto.randomBytes(4).toString('hex')}",
    "question_text": "DIN SPØRGSMÅL HER",
    "is_differentiator": true,
    "answers": [
      { "answer_text": "SVAR 1", "tags": ["key:value"] },
      { "answer_text": "SVAR 2", "tags": ["key:value"] },
      { "answer_text": "Ingen af disse passer...", "tags": ["freetext:true"] }
    ]
  }
}`;
 
exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }
  try {
    const { userAnswers, candidateProducts } = JSON.parse(event.body);
    const safeCandidates = (candidateProducts || []).filter(p => p && p.id && Array.isArray(p.tags));
    // Create context fingerprint (sorted user tags + product IDs) for caching
    const sortedAnswers = [...userAnswers].sort().join(',');
    const sortedProductIds = safeCandidates.map(p => p.id).sort().join(',');
    const contextString = `${sortedAnswers}|${sortedProductIds}`;
    const contextFingerprint = crypto.createHash('sha256').update(contextString).digest('hex');
    const db = await connectToDatabase();
    const cacheCollection = db.collection('question_cache');
    // Check cache for single question
    const cached = await cacheCollection.findOne({ _id: contextFingerprint });
    if (cached && cached.question) {
      return { statusCode: 200, body: JSON.stringify(cached.question) };
    }
    // Check cache for any pre-fetched batch of questions
    const batchFingerprint = crypto.createHash('sha256').update(`batch|${contextString}`).digest('hex');
    const cachedBatch = await cacheCollection.findOne({ _id: batchFingerprint });
    if (cachedBatch && Array.isArray(cachedBatch.questions)) {
      // Return the whole batch (client will handle splitting)
      return { statusCode: 200, body: JSON.stringify(cachedBatch.questions) };
    }
    // Prepare score-weighted themes for prompt
    const themeScores = {};
    safeCandidates.forEach(p => {
      const pScore = p.score || 1;
      (p.tags || []).filter(t => t.startsWith('interest:') || t.startsWith('category:'))
        .forEach(t => {
          const themeKey = t.split(':')[1];
          themeScores[themeKey] = (themeScores[themeKey] || 0) + pScore;
        });
    });
    const contenderThemes = Object.entries(themeScores).sort((a, b) => b[1] - a[1]).slice(0, 5)
      .map(([tag, score]) => ({ tag: tag.replace(/_/g, ' '), score: score.toFixed(1) }));
    const prompt = getAiPrompt(userAnswers, contenderThemes);
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${OPENAI_API_KEY}` },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7
      })
    });
    if (!response.ok) {
      const errText = await response.text();
      console.error('OpenAI API error:', errText);
      return { statusCode: 502, body: JSON.stringify({ error: `OpenAI API failure: ${response.statusText}` }) };
    }
    const data = await response.json();
    const rawContent = data.choices[0]?.message?.content;
    if (!rawContent) {
      console.error('OpenAI returned empty content.');
      return { statusCode: 500, body: JSON.stringify({ error: 'AI returned no content.' }) };
    }
    let aiResponse;
    try {
      aiResponse = JSON.parse(rawContent);
    } catch (err) {
      console.error('Failed to parse AI JSON:', err, 'Content:', rawContent);
      return { statusCode: 500, body: JSON.stringify({ error: 'AI response JSON parse error.' }) };
    }
    const questionObj = aiResponse.question || aiResponse;  // in case the AI returns {question: {...}}
    if (!questionObj || !questionObj.id || !Array.isArray(questionObj.answers)) {
      console.error('AI response has invalid structure:', aiResponse);
      return { statusCode: 500, body: JSON.stringify({ error: 'AI response structure invalid.' }) };
    }
    // Cache the single question result
    await cacheCollection.insertOne({ _id: contextFingerprint, question: questionObj, createdAt: new Date() });
    return { statusCode: 200, body: JSON.stringify(questionObj) };
  } catch (error) {
    console.error('Error in generate-ai-question function:', error);
    return { statusCode: 500, body: JSON.stringify({ error: 'Failed to generate question.' }) };
  }
};
