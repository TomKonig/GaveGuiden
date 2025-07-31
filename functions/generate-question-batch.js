// /functions/generate-question-batch.js
const { connectToDatabase } = require('./utils/mongodb-client');
const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');
const { OPENAI_API_KEY } = process.env;

const getBatchPrompt = (tagsString, profileString) => `You are an expert personal shopper for denrettegave.dk. Your task is to create a logical sequence of 2-3 follow-up questions to pinpoint the perfect gift. The first question should be broader, the next ones more specific. Be concise, friendly, and youthful. Answer in Danish.

The top product categories (tags) being considered are below, each with a (specificity, interest score). High specificity is good.

You must create a logical path for the user.
- Start by confirming or differentiating between the most prominent or interesting tags.
- Follow up with more specific questions based on a likely positive answer to the first.

STRICT: Output ONLY a JSON object with an array "questions" containing 2-3 question objects.
STRICT: For each question, your answer options must ONLY contain interest keys identical to the tags you received. Do not invent new tags.
STRICT: You can combine multiple tags in one answer if they are a natural fit (e.g., "personlig pleje, smykker").
STRICT: The LAST answer option for EACH question MUST be an escape hatch ("Ingen af disse passer...") with tag ["freetext:true"].
STRICT: Format the JSON EXACTLY as: { "questions": [ { "id": "q_ai_${crypto.randomBytes(4).toString('hex')}", "question_text": "...", "answers": [ { "answer_text": "...", "tags": ["some_tag"] }, { "answer_text": "...", "tags": ["freetext:true"] } ] }, { "id": "q_ai_${crypto.randomBytes(4).toString('hex')}", "question_text": "...", "answers": [ { "answer_text": "...", "tags": ["another_tag"] } ] } ] }

${tagsString}
${profileString}`;

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const interestsPath = path.join(__dirname, '..', 'assets', 'interests.json');
    const interestsData = await fs.readFile(interestsPath, 'utf8');
    const interests = JSON.parse(interestsData);
    const interestsMap = new Map(interests.map(i => [i.key, i]));
    const depthCache = new Map();

    const calculateDepth = (interestKey) => {
        if (depthCache.has(interestKey)) return depthCache.get(interestKey);
        const interest = interestsMap.get(interestKey);
        if (!interest) return 1;
        if (!interest.parents || interest.parents.length === 0) {
            depthCache.set(interestKey, 1);
            return 1;
        }
        const parentDepths = interest.parents.map(parentKey => calculateDepth(parentKey));
        const maxDepth = Math.max(...parentDepths) + 1;
        depthCache.set(interestKey, maxDepth);
        return maxDepth;
    };

    const { userAnswers, candidateProducts } = JSON.parse(event.body);
    const safeCandidates = (candidateProducts || []).filter(p => p && p.id && Array.isArray(p.tags));
    const sortedAnswers = [...new Set(userAnswers)].sort().join(',');
    const sortedProductIds = safeCandidates.map(p => p.id).sort().join(',');
    const contextString = `batch|${sortedAnswers}|${sortedProductIds}`;
    const contextFingerprint = crypto.createHash('sha256').update(contextString).digest('hex');

    const db = await connectToDatabase();
    const cacheCollection = db.collection('question_cache');

    const cached = await cacheCollection.findOne({ _id: contextFingerprint });
    if (cached && cached.questions) {
      return { statusCode: 200, body: JSON.stringify({ message: "Batch already cached." }) };
    }

    const themeScores = {};
    const interestKeys = new Set(interests.map(i => i.key));
    safeCandidates.forEach(p => {
        const pScore = p.score || 1;
        (p.tags || []).filter(t => interestKeys.has(t)).forEach(t => {
            themeScores[t] = (themeScores[t] || 0) + pScore;
        });
    });
    
    const allSortedThemes = Object.entries(themeScores).sort((a, b) => b[1] - a[1]);
    const topThemes = allSortedThemes.slice(0, 10);
    const samplingPool = allSortedThemes.slice(10, 35);
    const shuffledPool = samplingPool.sort(() => 0.5 - Math.random());
    const randomNicheThemes = shuffledPool.slice(0, 5);
    const finalThemes = [...topThemes, ...randomNicheThemes];

    const finalThemesWithDetails = finalThemes.map(([tagKey, score]) => ({
        tag: tagKey,
        score: Math.round(score),
        specificity: calculateDepth(tagKey)
    }));

    const tagsString = "Tags: " + finalThemesWithDetails
        .map(t => `${t.tag.replace(/_/g, ' ')} (${t.specificity},${t.score})`)
        .join(', ');

    const profileString = "Profile: " + [...new Set(userAnswers)].join(' - ');
      
    const prompt = getBatchPrompt(tagsString, profileString);
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}` },
        body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.75,
            response_format: { type: "json_object" }
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

    const aiResponseObject = JSON.parse(rawContent);
    await cacheCollection.insertOne({ _id: contextFingerprint, questions: aiResponseObject.questions, createdAt: new Date() });
    
    return { statusCode: 200, body: JSON.stringify({ message: "Successfully generated and cached batch." }) };

  } catch (error) {
    console.error('Error in generate-question-batch function:', error);
    return { statusCode: 500, body: JSON.stringify({ error: 'Failed to generate question batch.' }) };
  }
};
