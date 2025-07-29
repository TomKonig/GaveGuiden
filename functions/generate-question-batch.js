// /functions/generate-question-batch.js
const { connectToDatabase } = require('./utils/mongodb-client');
const crypto = require('crypto');
const { OPENAI_API_KEY } = process.env;

const getBatchPrompt = (userAnswers, contenderThemes) => `
You are an expert Gift Detective creating a question sequence for denrettegave.dk. The user is clearly on a specific path. Generate a logical sequence of 2-3 follow-up questions (in Danish) to differentiate between the top gift options. 
The first question should be broader and the next one(s) more specific. Use a friendly, witty tone.
 
**Current User Profile:**
${userAnswers.map(a => `- ${a}`).join('\n')}
 
**Score-Weighted Contender Themes:**
${contenderThemes.map(theme => `- ${theme.tag} (Relevans: ${theme.score})`).join('\n')}
 
**Task:** Return a JSON object with an array "questions" of 2-3 question objects. Each question must include an escape-hatch answer ("Ingen af disse passer...") with tag ["freetext:true"].
Format example:
{
  "questions": [
    {
      "id": "q_ai_${crypto.randomBytes(4).toString('hex')}",
      "question_text": "FØRSTE SPØRGSMÅL?",
      "answers": [
        { "answer_text": "SVAR 1", "tags": ["key:value"] },
        { "answer_text": "SVAR 2", "tags": ["key:value"] },
        { "answer_text": "Ingen af disse passer...", "tags": ["freetext:true"] }
      ]
    },
    {
      "id": "q_ai_${crypto.randomBytes(4).toString('hex')}",
      "question_text": "NÆSTE SPØRGSMÅL?",
      "answers": [
        { "answer_text": "SVAR 1", "tags": ["key:value"] },
        { "answer_text": "SVAR 2", "tags": ["key:value"] },
        { "answer_text": "Ingen af disse passer...", "tags": ["freetext:true"] }
      ]
    }
  ]
}`;

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }
  // This line is for local testing if you don't have Netlify env vars set
  // require('dotenv').config();
  const { OPENAI_API_KEY } = process.env;
  const crypto = require('crypto');
  const { connectToDatabase } = require('./utils/mongodb-client');

  try {
    const { userAnswers, candidateProducts } = JSON.parse(event.body);
    const safeCandidates = (candidateProducts || []).filter(p => p && p.id && Array.isArray(p.tags));
    const sortedAnswers = [...userAnswers].sort().join(',');
    const sortedProductIds = safeCandidates.map(p => p.id).sort().join(',');
    const contextString = `batch|${sortedAnswers}|${sortedProductIds}`;
    const contextFingerprint = crypto.createHash('sha256').update(contextString).digest('hex');

    const db = await connectToDatabase();
    const cacheCollection = db.collection('question_cache');

    const cached = await cacheCollection.findOne({ _id: contextFingerprint });
    if (cached && cached.questions) {
      return { statusCode: 200, body: JSON.stringify({ message: "Batch already cached." }) };
    }

    const themeScores = new Map();
    safeCandidates.flatMap(p => 
        (p.tags || [])
          .filter(t => t.startsWith('interest:') || t.startsWith('category:'))
          .map(t => ({ themeKey: t.split(':')[1], score: p.score || 1 }))
    ).forEach(({ themeKey, score }) => {
        themeScores.set(themeKey, (themeScores.get(themeKey) || 0) + score);
    });
    
    const allSortedThemes = Array.from(themeScores.entries()).sort((a, b) => b[1] - a[1]);
    const topThemes = allSortedThemes.slice(0, 10);
    const samplingPool = allSortedThemes.slice(10, 35);
    const shuffledPool = samplingPool.sort(() => 0.5 - Math.random());
    const randomNicheThemes = shuffledPool.slice(0, 5);
    const finalThemesForPrompt = [...topThemes, ...randomNicheThemes]
      .map(([tag, score]) => ({ tag: tag.replace(/_/g, ' '), score: score.toFixed(1) }));
      
    const prompt = getBatchPrompt(userAnswers, finalThemesForPrompt);
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${OPENAI_API_KEY}` },
        body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.75
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
        console.error('OpenAI returned empty content for batch.');
        return { statusCode: 500, body: JSON.stringify({ error: 'AI returned no content for batch.' }) };
    }

    // --- THIS IS THE FIX ---
    // We must parse the AI's string response into a JSON object.
    const aiResponseObject = JSON.parse(rawContent);

    const questions = aiResponseObject.questions;
    if (!Array.isArray(questions) || questions.length === 0) {
        console.error('AI batch response has invalid structure:', aiResponseObject);
        return { statusCode: 500, body: JSON.stringify({ error: 'AI batch response structure invalid.' }) };
    }

    await cacheCollection.insertOne({ _id: contextFingerprint, questions, createdAt: new Date() });
    
    return { statusCode: 200, body: JSON.stringify({ message: "Successfully generated and cached batch." }) };

  } catch (error) {
    console.error('Error in generate-question-batch function:', error);
    return { statusCode: 500, body: JSON.stringify({ error: 'Failed to generate question batch.' }) };
  }
};
