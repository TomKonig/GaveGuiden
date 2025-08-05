// netlify/functions/generate-ai-question.js

const fs = require('fs').promises;
const path = require('path');

const PRODUCTS_FILE_PATH = 'assets/products.json';
const INTERESTS_FILE_PATH = 'assets/interests.json';

const getAIQuestionPrompt = (userProfile, topProducts, interests) => {
    return `
You are an expert personal shopper running a live gift-finding quiz. The user is stuck between a few choices, and you need to generate ONE smart, insightful, multiple-choice question to help them decide. Your tone is friendly and youthful. Your language is Danish.

**User's Profile:**
-   **Filters:** ${JSON.stringify(userProfile.filters)}
-   **Expressed Interests:** ${JSON.stringify(userProfile.interests)}

**Top Product Contenders:**
(These are the products with the highest scores so far)
${topProducts.map(p => `- ${p.name}: ${p.description}`).join('\n')}

**Task:**
Analyze the user's profile and the top products. Identify the most important differentiating factor between the products that the user has not yet provided a preference for. Generate a single, situational, or personality-based question to clarify this.

**CRITICAL Rules:**
-   The question must help the user choose between the top products.
-   Answer options MUST map to existing interest tags from our system.
-   The LAST answer option MUST be an escape hatch: { "answer_text": "Ingen af disse passer...", "tags": ["freetext:true"] }.
-   Your final output MUST be ONLY a single JSON object for the question, in this exact format: { "question": { "question_id": "q_live_ai_...", "phrasings": ["..."], "answers": [...] } }
`;
};

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { userProfile, topProductIds } = JSON.parse(event.body);
        if (!userProfile || !topProductIds) {
            return { statusCode: 400, body: 'Missing userProfile or topProductIds in request body.' };
        }

        const [productCatalog, interests] = await Promise.all([
            fs.readFile(path.resolve(PRODUCTS_FILE_PATH), 'utf-8').then(JSON.parse),
            fs.readFile(path.resolve(INTERESTS_FILE_PATH), 'utf-8').then(JSON.parse)
        ]);

        const topProducts = productCatalog.filter(p => topProductIds.includes(p.id));
        const prompt = getAIQuestionPrompt(userProfile, topProducts, interests);

        // This function calls the gpt-o4-mini model directly.
        // It does NOT use our token ledger.
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}` // Using the key for our frontend models
            },
            body: JSON.stringify({
                model: 'o4-mini',
                messages: [{ role: 'user', content: prompt }],
                response_format: { type: "json_object" }
            })
        });

        if (!response.ok) {
            throw new Error(`OpenAI API failure: ${await response.text()}`);
        }

        const data = await response.json();
        const { question } = JSON.parse(data.choices[0].message.content);

        return {
            statusCode: 200,
            body: JSON.stringify({ question })
        };

    } catch (error) {
        console.error('Error in generate-ai-question function:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to generate AI question.' })
        };
    }
};
