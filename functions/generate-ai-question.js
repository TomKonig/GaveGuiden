// /functions/generate-ai-question.js

const { MongoClient } = require('mongodb');
const crypto = require('crypto');

// Securely access environment variables
const { MONGODB_URI, OPENAI_API_KEY } = process.env;

// --- PROMPT TEMPLATE FOR THE "DETECTIVE" AI ---
// This prompt is engineered to be efficient and produce structured JSON output.
// It now requests an array of up to 3 logically sequential questions.
const getAiPrompt = (userAnswers, topProductsSummary) => `
You are a brilliant Gift Detective for denrettegave.dk. Your goal is to generate a short, logical sequence of clarifying questions to help narrow down the perfect gift.

**Current User Profile:**
${userAnswers.map(a => `- ${a}`).join('\n')}

**Top 5 Remaining Product Themes:**
${topProductsSummary}

**Your Task:**
1.  Analyze the user profile and the remaining product themes.
2.  Identify the most effective sequence of questions to ask next. Start broad and get more specific.
3.  Generate a JSON object containing an array of 1 to 3 question objects. The questions should be in Danish.
4.  The JSON object must follow this exact schema:
    {
      "questions": [
        {
          "id": "q_ai_generated_UNIQUE_ID_1",
          "question_text": "YOUR_FIRST_QUESTION_IN_DANISH",
          "answers": [
            {"answer_text": "ANSWER_1_IN_DANISH", "tags": ["key:value"]},
            {"answer_text": "ANSWER_2_IN_DANISH", "tags": ["key:value"]}
          ],
          "is_differentiator": true
        },
        {
          "id": "q_ai_generated_UNIQUE_ID_2",
          "question_text": "YOUR_SECOND_QUESTION_IN_DANISH",
          "answers": [
            {"answer_text": "ANSWER_1_IN_DANISH", "tags": ["key:value"]},
            {"answer_text": "ANSWER_2_IN_DANISH", "tags": ["key:value"]}
          ],
          "is_differentiator": true
        }
      ]
    }
5.  The 'tags' should be specific and useful for scoring. Each 'id' must be unique.
6.  Your entire response must be ONLY the raw JSON object, with no other text or explanations.
`;

// --- MAIN HANDLER FUNCTION ---
exports.handler = async (event) => {
    // Only allow POST requests
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { userAnswers, candidateProducts } = JSON.parse(event.body);

        // 1. --- GENERATE CONTEXT FINGERPRINT FOR CACHING ---
        const sortedAnswers = [...userAnswers].sort().join(',');
        const sortedProductIds = [...candidateProducts].slice(0, 20).sort().join(',');
        const contextString = `${sortedAnswers}|${sortedProductIds}`;
        const contextFingerprint = crypto.createHash('sha256').update(contextString).digest('hex');

        // 2. --- CONNECT TO MONGODB AND CHECK CACHE ---
        const client = new MongoClient(MONGODB_URI);
        await client.connect();
        const db = client.db('gaveguiden');
        const cacheCollection = db.collection('question_cache');

        const cachedResult = await cacheCollection.findOne({ _id: contextFingerprint });

        if (cachedResult) {
            await client.close();
            // ** CACHE HIT **: Return the stored array of questions
            return {
                statusCode: 200,
                body: JSON.stringify(cachedResult.questions), // Return the array directly
            };
        }

        // ** CACHE MISS **: Proceed to generate a new question sequence with the AI

        // 3. --- PREPARE DATA FOR THE AI PROMPT ---
        const topProductsSummary = `Based on our analysis, the top gift ideas fall into these categories: ${[...new Set(candidateProducts.flatMap(p => p.tags.filter(t => t.startsWith('interest:')).map(t => t.split(':')[1])))].slice(0, 5).join(', ')}.`;
        const prompt = getAiPrompt(userAnswers, topProductsSummary);

        // 4. --- CALL OPENAI API ---
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENAI_API_KEY}`,
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.7,
                response_format: { type: "json_object" },
            }),
        });

        if (!response.ok) {
            throw new Error(`OpenAI API error: ${response.statusText}`);
        }

        const data = await response.json();
        const aiResponseText = data.choices[0].message.content;
        const newQuestionData = JSON.parse(aiResponseText); // This will be an object like { questions: [...] }

        // 5. --- POPULATE THE CACHE FOR FUTURE USE ---
        await cacheCollection.insertOne({
            _id: contextFingerprint,
            questions: newQuestionData.questions, // Store the array of questions
            createdAt: new Date(),
        });

        await client.close();

        // 6. --- RETURN THE NEWLY GENERATED QUESTION ARRAY ---
        return {
            statusCode: 200,
            body: JSON.stringify(newQuestionData.questions), // Return the array directly
        };

    } catch (error) {
        console.error('Error in generate-ai-question function:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to generate question.' }),
        };
    }
};
