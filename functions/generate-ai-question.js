// /functions/generate-ai-question.js

const { MongoClient } = require('mongodb');
const crypto = require('crypto');

const { MONGODB_URI, OPENAI_API_KEY } = process.env;

const getAiPrompt = (userAnswers, topProductsSummary) => `
You are a brilliant and friendly Gift Detective for denrettegave.dk. Your personality is youthful, helpful, and a little tongue-in-cheek. Your goal is to generate a short, logical sequence of clarifying questions to help narrow down the perfect gift.

**Current User Profile:**
${userAnswers.map(a => `- ${a}`).join('\n')}

**Top 5 Remaining Product Themes:**
${topProductsSummary}

**Your Task:**
1.  Analyze the user profile and the remaining product themes.
2.  Generate a JSON object containing an array of 1 to 3 question objects.
3.  **Crucially, all questions and answers must be in Danish and match our friendly, colloquial, and slightly witty tone of voice.**
4.  For each question, the LAST answer option MUST always be an escape hatch for the user.
5.  The JSON object must follow this exact schema:
    {
      "questions": [
        {
          "id": "q_ai_generated_UNIQUE_ID_1",
          "question_text": "YOUR_FIRST_QUESTION_IN_DANISH",
          "answers": [
            {"answer_text": "ANSWER_1_IN_DANISH", "tags": ["key:value"]},
            {"answer_text": "ANSWER_2_IN_DANISH", "tags": ["key:value"]},
            {"answer_text": "Ingen af disse passer...", "tags": ["freetext:true"]}
          ],
          "is_differentiator": true
        }
      ]
    }
6.  The 'tags' for the free-text option must be exactly ["freetext:true"].
7.  Your entire response must be ONLY the raw JSON object, with no other text or explanations.
`;

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };
    try {
        const { userAnswers, candidateProducts } = JSON.parse(event.body);
        
        // --- FIX: Harden against malformed candidateProducts ---
        const safeCandidates = (candidateProducts || []).filter(p => p && p.id && Array.isArray(p.tags));

        const sortedAnswers = [...userAnswers].sort().join(',');
        const sortedProductIds = safeCandidates.slice(0, 20).map(p => p.id).sort().join(',');
        const contextString = `${sortedAnswers}|${sortedProductIds}`;
        const contextFingerprint = crypto.createHash('sha256').update(contextString).digest('hex');

        const client = new MongoClient(MONGODB_URI);
        await client.connect();
        const db = client.db('gaveguiden');
        const cacheCollection = db.collection('question_cache');
        const cachedResult = await cacheCollection.findOne({ _id: contextFingerprint });

        if (cachedResult) {
            await client.close();
            return { statusCode: 200, body: JSON.stringify(cachedResult.questions) };
        }

        const themes = safeCandidates.flatMap(p => p.tags.filter(t => t.startsWith('interest:') || t.startsWith('category:')).map(t => t.split(':')[1]));
        const topProductsSummary = `Top themes: ${[...new Set(themes)].slice(0, 5).join(', ')}.`;
        
        const prompt = getAiPrompt(userAnswers, topProductsSummary);

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${OPENAI_API_KEY}` },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.7,
                response_format: { type: "json_object" },
            }),
        });

        if (!response.ok) {
            const errorBody = await response.text();
            console.error('OpenAI API Error:', errorBody);
            throw new Error(`OpenAI API error: ${response.statusText}`);
        }
        const data = await response.json();
        const newQuestionData = JSON.parse(data.choices[0].message.content);

        await cacheCollection.insertOne({ _id: contextFingerprint, questions: newQuestionData.questions, createdAt: new Date() });
        await client.close();
        return { statusCode: 200, body: JSON.stringify(newQuestionData.questions) };
    } catch (error) {
        console.error('Error in generate-ai-question function:', error);
        return { statusCode: 500, body: JSON.stringify({ error: 'Failed to generate question.' }) };
    }
};
