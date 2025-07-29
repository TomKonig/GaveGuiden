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
  // Background function: no immediate client response required
  try {
    const { userAnswers, candidateProducts } = JSON.parse(event.body);
    const safeCandidates = (candidateProducts || []).filter(p => p && p.id && Array.isArray(p.tags));
    // Create unique fingerprint for this batch context
    const sortedAnswers = [...userAnswers].sort().join(',');
    const sortedIds = safeCandidates.map(p => p.id).sort().join(',');
    const contextString = `batch|${sortedAnswers}|${sortedIds}`;
    const contextFingerprint = crypto.createHash('sha256').update(contextString).digest('hex');
    const db = await connectToDatabase();
    const cacheCollection = db.collection('question_cache');
    // Skip if already cached
    const existing = await cacheCollection.findOne({ _id: contextFingerprint });
    if (existing && existing.questions) {
      console.log("Batch already exists in cache for context:", contextFingerprint);
      return { statusCode: 204, body: '' };
    }
    // Compute contender themes (score-weighted)
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
    const prompt = getBatchPrompt(userAnswers, contenderThemes);
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
      console.error("OpenAI batch API error:", await response.text());
      return { statusCode: 500, body: 'Batch generation API error.' };
    }
    const data = await response.json();
    const rawContent = data.choices[0]?.message?.content;
    if (!rawContent) {
      console.error("OpenAI batch returned empty content.");
      return { statusCode: 500, body: 'No batch content from AI.' };
    }
    let batchQuestions;
    try {
      const parsed = JSON.parse(rawContent);
      batchQuestions = Array.isArray(parsed.questions) ? parsed.questions : [];
    } catch (err) {
      console.error("Failed to parse batch JSON:", err, rawContent);
      return { statusCode: 500, body: 'Batch JSON parse error.' };
    }
    if (batchQuestions.length === 0) {
      console.log("No questions generated in batch.");
      return { statusCode: 204, body: '' };
    }
    // Store the batch in cache
    await cacheCollection.insertOne({ _id: contextFingerprint, questions: batchQuestions, createdAt: new Date() });
    console.log(`Cached ${batchQuestions.length} questions for context ${contextFingerprint}`);
    return { statusCode: 202, body: '' };  // Accepted
  } catch (error) {
    console.error("Error in generate-question-batch:", error);
    return { statusCode: 500, body: 'Internal Server Error' };
  }
};
