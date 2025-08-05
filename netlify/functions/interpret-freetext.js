// /functions/interpret-freetext.js
const { connectToDatabase } = require('./utils/mongodb-client');
const crypto = require('crypto');
const { OPENAI_API_KEY } = process.env;

const getAnalystPrompt = (userAnswers, freeText) => `
You are an expert data analyst. Interpret the user's free-text answer and convert it into structured tags for our gift quiz engine.
 
**Previous Answers (context):**
${userAnswers.map(a => `- For question ${a.question_id}, the user chose an answer associated with these tags: ${a.tags.join(', ')}`).join('\n')}
 
**User's Free-Text Input:**
"${freeText}"
 
**Task:** Extract key interests or attributes from the input and return them as an array of tags in JSON format.
Each tag must be formatted as "interest:tag_name" or "differentiator:key_value", using underscores for spaces. 
Respond ONLY with a JSON object like:
{ "tags": ["interest:tag1", "interest:tag2"] }
`;

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }
  try {
    const { userAnswers = [], freeText = '' } = JSON.parse(event.body);
    if (!freeText || freeText.length > 250) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Invalid input.' }) };
    }
    // Basic sanitization
    const sanitizedText = freeText.replace(/<[^>]*>/g, '').trim();
    // Create context fingerprint for caching
    const sortedAnswers = [...userAnswers].sort().join(',');
    const contextString = `${sortedAnswers}|${sanitizedText}`;
    const contextFingerprint = crypto.createHash('sha256').update(contextString).digest('hex');
    const db = await connectToDatabase();
    const cacheCollection = db.collection('freetext_cache');
    const cachedEntry = await cacheCollection.findOne({ _id: contextFingerprint });
    if (cachedEntry && cachedEntry.tags) {
      return { statusCode: 200, body: JSON.stringify(cachedEntry.tags) };
    }
    const prompt = getAnalystPrompt(userAnswers, sanitizedText);
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-o4-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.5,
        max_tokens: 1000
      })
    });
    if (!response.ok) {
      const err = await response.text();
      console.error('OpenAI API error:', err);
      throw new Error(`OpenAI API returned status ${response.status}`);
    }
    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    const aiResponse = JSON.parse(content || '{}');
    const extractedTags = Array.isArray(aiResponse.tags) ? aiResponse.tags : [];
    // Cache the result
    await cacheCollection.insertOne({ _id: contextFingerprint, tags: extractedTags, createdAt: new Date() });
    return { statusCode: 200, body: JSON.stringify(extractedTags) };
  } catch (error) {
    console.error('Error in interpret-freetext function:', error);
    return { statusCode: 500, body: JSON.stringify({ error: 'Failed to interpret text.' }) };
  }
};
