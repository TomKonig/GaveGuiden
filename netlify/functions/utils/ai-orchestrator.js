// netlify/functions/utils/ai-orchestrator.js

const fetch = require('node-fetch');

// The endpoint for our own Token Ledger service
const LEDGER_ENDPOINT = `${process.env.URL}/.netlify/functions/token-ledger`;

/**
 * A centralized utility to handle all interactions with AI models and our token ledger.
 * @param {object} params - The parameters for the AI call.
 * @param {string} params.model - The AI model to use ('gpt-4.5-preview' or 'gemini-2.5-flash').
 * @param {string} params.prompt - The user prompt for the AI.
 * @param {string} params.agent_name - The name of the agent making the call.
 * @param {number} params.estimated_cost - The estimated token cost (only for 'gpt-4.5-preview').
 * @returns {Promise<string>} - The content response from the AI model.
 */
async function callAI(params) {
    const { model, prompt, agent_name, estimated_cost = 0 } = params;

    // --- Step 1: Handle GPT-4.5-preview (Budgeted) ---
    if (model === 'gpt-4.5-preview') {
        // --- A: Request permission from Token Ledger ---
        const ledgerRequest = await fetch(LEDGER_ENDPOINT, {
            method: 'POST',
            body: JSON.stringify({ action: 'request', agent_name, estimated_cost })
        });
        const ledgerResponse = await ledgerRequest.json();

        if (ledgerResponse.status !== 'approved') {
            // Log the halt and stop execution for this agent.
            console.error(`CRITICAL: ${agent_name} halted. Reason: Token request denied.`);
            throw new Error('Token budget request denied.');
        }

        // --- B: Call the OpenAI API ---
        const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY_GPT45}`
            },
            body: JSON.stringify({
                model: 'gpt-4.5-preview',
                messages: [{ role: 'user', content: prompt }],
                // Add other parameters like temperature, response_format etc. as needed
            })
        });
        const openaiData = await openaiResponse.json();
        
        if (!openaiResponse.ok) {
            throw new Error(`OpenAI API Failure: ${openaiData.error?.message}`);
        }

        const actual_cost = openaiData.usage.total_tokens;

        // --- C: Report actual usage back to Token Ledger ---
        await fetch(LEDGER_ENDPOINT, {
            method: 'POST',
            body: JSON.stringify({ action: 'report', agent_name, estimated_cost, actual_cost })
        });
        
        return openaiData.choices[0].message.content;
    }

    // --- Step 2: Handle Gemini 2.5 Flash (Free Tier) ---
    if (model === 'gemini-2.5-flash') {
        const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${process.env.GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });
        const geminiData = await geminiResponse.json();

        if (!geminiResponse.ok) {
            throw new Error(`Gemini API Failure: ${geminiData.error?.message}`);
        }

        return geminiData.candidates[0].content.parts[0].text;
    }

    throw new Error(`Invalid model specified: ${model}`);
}

module.exports = { callAI };
