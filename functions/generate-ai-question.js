// /functions/generate-ai-question.js
const { connectToDatabase } = require('./utils/mongodb-client');
const crypto = require('crypto');
const { OPENAI_API_KEY } = process.env;

const getAiPrompt = (userAnswers, contenderThemes) => `
You are a brilliant Gift Detective for denrettegave.dk. Your task is to ask the single smartest question to pinpoint the perfect gift. **Be concise!** Your tone is witty and friendly (in Danish).
 
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

  const { OPENAI_API_KEY } = process.env;

  try {
    const { userAnswers, candidateProducts } = JSON.parse(event.body);
    const safeCandidates = (candidateProducts || []).filter(p => p && p.id && Array.isArray(p.tags));

    const sortedAnswers = [...userAnswers].sort().join(',');
    const sortedProductIds = safeCandidates.map(p => p.id).sort().join(',');
    const contextString = `${sortedAnswers}|${sortedProductIds}`;
    const contextFingerprint = crypto.createHash('sha256').update(contextString).digest('hex');

    const db = await connectToDatabase();
    const cacheCollection = db.collection('question_cache');

    const cached = await cacheCollection.findOne({ _id: contextFingerprint });
    if (cached && cached.question) {
      return { statusCode: 200, body: JSON.stringify(cached.question) };
    }
    
    const batchFingerprint = crypto.createHash('sha256').update(`batch|${contextString}`).digest('hex');
    const cachedBatch = await cacheCollection.findOne({ _id: batchFingerprint });
    if (cachedBatch && Array.isArray(cachedBatch.questions) && cachedBatch.questions.length > 0) {
      const firstQuestion = cachedBatch.questions.shift();
      if (cachedBatch.questions.length > 0) {
          cacheCollection.updateOne({ _id: batchFingerprint }, { $set: { questions: cachedBatch.questions } }).catch(console.error);
      } else {
          cacheCollection.deleteOne({ _id: batchFingerprint }).catch(console.error);
      }
      return { statusCode: 200, body: JSON.stringify(firstQuestion) };
    }

    // --- OPTIMIZED THEME CALCULATION ---
    const themeScores = new Map();
    safeCandidates.flatMap(p => 
        (p.tags || [])
          .filter(t => t.startsWith('interest:') || t.startsWith('category:'))
          .map(t => ({ themeKey: t.split(':')[1], score: p.score || 1 }))
    ).forEach(({ themeKey, score }) => {
        themeScores.set(themeKey, (themeScores.get(themeKey) || 0) + score);
    });

    const allSortedThemes = Array.from(themeScores.entries()).sort((a, b) => b[1] - a[1]);
    // --- End of Optimization ---

    const topThemes = allSortedThemes.slice(0, 10);
    const samplingPool = allSortedThemes.slice(10, 35);
    const shuffledPool = samplingPool.sort(() => 0.5 - Math.random());
    const randomNicheThemes = shuffledPool.slice(0, 5);
    
    const finalThemesForPrompt = [...topThemes, ...randomNicheThemes]
      .map(([tag, score]) => ({ tag: tag.replace(/_/g, ' '), score: score.toFixed(1) }));

    const prompt = getAiPrompt(userAnswers, finalThemesForPrompt);
console.log("--> Attempting to call OpenAI with model:", 'gpt-4o-mini');
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${OPENAI_API_KEY}` },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7
      })
    });
 console.log("<-- OpenAI responded with status:", response.status);
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

    const questionObj = aiResponse.question || aiResponse;
    if (!questionObj || !questionObj.id || !Array.isArray(questionObj.answers)) {
      console.error('AI response has invalid structure:', aiResponse);
      return { statusCode: 500, body: JSON.stringify({ error: 'AI response structure invalid.' }) };
    }

    await cacheCollection.insertOne({ _id: contextFingerprint, question: questionObj, createdAt: new Date() });
    return { statusCode: 200, body: JSON.stringify(questionObj) };

  } catch (error) {
    console.error('Error in generate-ai-question function:', error);
    return { statusCode: 500, body: JSON.stringify({ error: 'Failed to generate question.' }) };
  }
};
