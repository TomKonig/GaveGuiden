// /functions/generate-ai-question.js
const { connectToDatabase } = require('./utils/mongodb-client');
const crypto = require('crypto');
// No longer need fs or path

const getAiPrompt = (tagsString, profileString) => `You are an expert personal shopper for denrettegave.dk. Your task is to ask the single smartest question to get closer to pinpointing the perfect gift for the customer's chosen recipient. Be concise! Your tone is friendly and youthful. Answer in Danish.

The top product categories (referred to as tags) being considered are in a single string below. After each tag is a parenthesis containing two numbers. First, the specificity (or niche-level) of the tag, secondly its interest score. We are particularly interested confirming or eliminating highly specific and niche tags, as they are closer to a purchase decision.

You must either:
Try to differentiate the leaders: If multiple tags have high and close scores, ask a question to separate them (e.g., "Er de mere til hygge derhjemme, eller skal der ske noget ude i det fri?")
Or confirm a niche: If one niche tag has a surprisingly high score compared to its relative obscurity, ask a question to confirm that interest (e.g., "Jeg fornemmer en interesse for retro-spil. Er det noget, der kunne hitte?"). 

Your answer options must either be multiple-choice or yes/no/I don't know/escape hatch.

STRICT: Output ONLY a JSON object containing the single best question to further narrow down the field. 
STRICT: Your answer options must ONLY contain interest keys exactly identical to any (or multiple) of the tags in your received prompt. (E.g. if you receive a string containing “fiskeri (3,3), naturliv (2,4), sexlegetøj (5,2), you may choose "fiskeri, naturliv" or "sexlegetøj" but not “fluefiskeri” or “camping”). You MUST not invent new tags. Your answer options can focus on more than one tag at a time, if they fit naturally together. 
STRICT: If an answer option includes multiple tags, they MUST be natural fits with each other. For example, "personlig pleje, smykker" is a sensible combination, whereas "computerspil, lædermøbler" is not. Equally, "sexlegetøj" fits naturally with "romantik" but not with "brætspil".
STRICT: The LAST answer option MUST be a user-friendly escape hatch ("Ingen af disse passer...") with tag ["freetext:true"]. Provide a maximum of four options, escape hatch included.
STRICT: Format the JSON EXACTLY as: { "question": { "id": "q_ai_${crypto.randomBytes(4).toString('hex')}", "question_text": "DIT SPØRGSMÅL HER", "answers": [ { "answer_text": "SVAR 1", "tags": ["en_interesse_key"] }, { "answer_text": "SVAR 2", "tags": ["en_anden_key", "endnu_en_key"] }, { "answer_text": "Ingen af disse passer...", "tags": ["freetext:true"] } ] } }

${tagsString}
${profileString}`;

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { userAnswers, themesWithDetails } = JSON.parse(event.body);

        const sortedAnswers = [...new Set(userAnswers)].sort().join(',');
        const sortedThemes = (themesWithDetails || []).map(t => `${t.tag}(${t.specificity},${t.score})`).sort().join(',');
        const contextString = `${sortedAnswers}|${sortedThemes}`;
        const contextFingerprint = crypto.createHash('sha256').update(contextString).digest('hex');

        const db = await connectToDatabase();
        const cacheCollection = db.collection('question_cache');

        const cached = await cacheCollection.findOne({ _id: contextFingerprint });
        if (cached && cached.question) {
            console.log("Returning single question from cache.");
            return { statusCode: 200, body: JSON.stringify(cached.question) };
        }

        const tagsString = "Tags: " + (themesWithDetails || [])
            .map(t => `${t.tag.replace(/_/g, ' ')} (${t.specificity},${t.score})`)
            .join(', ');

        const profileString = "Profile: " + [...new Set(userAnswers)].join(' - ');
        const prompt = getAiPrompt(tagsString, profileString);

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}` },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.7,
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
            throw new Error('AI returned no content.');
        }

        const aiResponseObject = JSON.parse(rawContent);
        await cacheCollection.insertOne({ _id: contextFingerprint, question: aiResponseObject, createdAt: new Date() });

        return { statusCode: 200, body: JSON.stringify(aiResponseObject) };

    } catch (error) {
        console.error('Error in generate-ai-question function:', error);
        return { statusCode: 500, body: JSON.stringify({ error: 'Failed to generate question.' }) };
    }
};
