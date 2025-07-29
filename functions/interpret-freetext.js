// /functions/interpret-freetext.js

// Securely access environment variables
const { OPENAI_API_KEY } = process.env;

// --- PROMPT TEMPLATE FOR THE "ANALYST" AI ---
const getAnalystPrompt = (userAnswers, freeText) => `
You are an expert data analyst. Your task is to interpret a user's free-text input and convert it into structured tags for a gift recommendation engine.

**Current User Profile (previous answers):**
${userAnswers.map(a => `- ${a}`).join('\n')}

**User's Free-Text Input:**
"${freeText}"

**Your Task:**
1.  Analyze the user's free-text input in the context of their previous answers.
2.  Extract the key interests, attributes, or concepts.
3.  Convert these concepts into an array of structured tags in Danish.
4.  The tags must be in the format "interest:tag_name" or "differentiator_key:value". Use underscores for spaces.
5.  Your entire response must be ONLY a raw JSON object containing the array of tags, like this:
    {
      "tags": ["interest:italiensk_mad", "interest:madlavning"]
    }
`;

// --- MAIN HANDLER FUNCTION ---
exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { userAnswers, freeText } = JSON.parse(event.body);

        // --- SECURITY & COST CONTROL ---
        // 1. Server-side validation of text length
        if (!freeText || freeText.length > 250) {
            return { statusCode: 400, body: JSON.stringify({ error: 'Invalid input.' }) };
        }
        // 2. Basic sanitization
        const sanitizedText = freeText.replace(/<[^>]*>/g, '');

        const prompt = getAnalystPrompt(userAnswers, sanitizedText);

        // --- CALL OPENAI API ---
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENAI_API_KEY}`,
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.5,
                response_format: { type: "json_object" },
            }),
        });

        if (!response.ok) {
            throw new Error(`OpenAI API error: ${response.statusText}`);
        }

        const data = await response.json();
        const aiResponse = JSON.parse(data.choices[0].message.content);

        // --- RETURN THE EXTRACTED TAGS ---
        return {
            statusCode: 200,
            body: JSON.stringify(aiResponse.tags || []), // Return tags array, or empty if none found
        };

    } catch (error) {
        console.error('Error in interpret-freetext function:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to interpret text.' }),
        };
    }
};
