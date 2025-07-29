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

  // NOTE: This assumes OPENAI_API_KEY is set in your Netlify environment variables
  const { OPENAI_API_KEY } = process.env;

  try {
    const { userAnswers, candidateProducts } = JSON.parse(event.body);
    const safeCandidates = (candidateProducts || []).filter(p => p && p.id && Array.isArray(p.tags));
    
    // Create context fingerprint for batch caching
    const sortedAnswers = [...userAnswers].sort().join(',');
    const sortedProductIds = safeCandidates.map(p => p.id).sort().join(',');
    const contextString = `batch|${sortedAnswers}|${sortedProductIds}`; // Add "batch" prefix
    const contextFingerprint = crypto.createHash('sha256').update(contextString).digest('hex');

    const db = await connectToDatabase();
    const cacheCollection = db.collection('question_cache');

    // Check cache for existing batch
    const cached = await cacheCollection.findOne({ _id: contextFingerprint });
    if (cached && cached.questions) {
      // If a batch is already cached, no need to do anything
      return { statusCode: 200, body: JSON.stringify({ message: "Batch already cached." }) };
    }

    // --- LOGIC UPDATED BELOW ---

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

    // Convert to array and sort
    const allSortedThemes = Object.entries(themeScores).sort((a, b) => b[1] - a[1]);

    // 1. Always take the top 10 themes
    const topThemes = allSortedThemes.slice(0, 10);
    
    // 2. Define the pool for random sampling (the next 25)
    const samplingPool = allSortedThemes.slice(10, 35);

    // 3. Shuffle the pool and take 5 random themes
    const shuffledPool = samplingPool.sort(() => 0.5 - Math.random());
    const randomNicheThemes = shuffledPool.slice(0, 5);
    
    // 4. Combine and format for the prompt
    const finalThemesForPrompt = [...topThemes, ...randomNicheThemes]
      .map(([tag, score]) => ({ tag: tag.replace(/_/g, ' '), score: score.toFixed(1) }));

    const prompt = getBatchPrompt(userAnswers, finalThemesForPrompt);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${OPENAI_API_KEY}` },
        body: JSON.stringify({
            model: 'gpt-4.1-nano', // Using the faster model
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.75 // Slightly higher temp for more creative batch questions
        })
    });

    // --- ALL LOGIC BELOW THIS LINE IS YOURS AND HAS BEEN PRESERVED ---

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

    let aiResponse;
    try {
        aiResponse = JSON.parse(rawContent);
    } catch (err) {
        console.error('Failed to parse AI JSON for batch:', err, 'Content:', rawContent);
        return { statusCode: 500, body: JSON.stringify({ error: 'AI batch response JSON parse error.' }) };
    }

    const questions = aiResponse.questions;
    if (!Array.isArray(questions) || questions.length === 0) {
        console.error('AI batch response has invalid structure:', aiResponse);
        return { statusCode: 500, body: JSON.stringify({ error: 'AI batch response structure invalid.' }) };
    }

    // Cache the entire batch of questions
    await cacheCollection.insertOne({ _id: contextFingerprint, questions: questions, createdAt: new Date() });

    return { statusCode: 200, body: JSON.stringify({ message: "Successfully generated and cached batch." }) };

  } catch (error) {
    console.error('Error in generate-question-batch function:', error);
    return { statusCode: 500, body: JSON.stringify({ error: 'Failed to generate question batch.' }) };
  }
};
