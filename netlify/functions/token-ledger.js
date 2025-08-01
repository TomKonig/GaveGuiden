// netlify/functions/token-ledger.js

const { connectToDatabase } = require('./utils/mongodb-client');

// The operational limit, including our 5% safety buffer.
const DAILY_OPERATIONAL_LIMIT = 237500;

const getTodaysDateString = () => {
    const now = new Date();
    // Use a consistent timezone like UTC for a global standard
    return now.toISOString().split('T')[0]; 
};

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { action, agent_name, estimated_cost, actual_cost } = JSON.parse(event.body);
        const db = await connectToDatabase();
        const ledgerCollection = db.collection('daily_token_ledger');
        const today = getTodaysDateString();

        // Find or create today's ledger document
        let ledger = await ledgerCollection.findOne({ _id: today });
        if (!ledger) {
            await ledgerCollection.insertOne({
                _id: today,
                tokens_remaining: DAILY_OPERATIONAL_LIMIT,
                usage_log: []
            });
            ledger = await ledgerCollection.findOne({ _id: today });
        }
        
        // --- ACTION: REQUEST ---
        // An agent asks for permission to spend tokens.
        if (action === 'request') {
            if (!agent_name || !estimated_cost) {
                return { statusCode: 400, body: JSON.stringify({ error: 'Agent name and estimated cost are required for a request.' }) };
            }

            if (ledger.tokens_remaining >= estimated_cost) {
                // Reserve the tokens and approve the request
                await ledgerCollection.updateOne({ _id: today }, { $inc: { tokens_remaining: -estimated_cost } });
                return { statusCode: 200, body: JSON.stringify({ status: 'approved' }) };
            } else {
                // Deny the request
                return { statusCode: 200, body: JSON.stringify({ status: 'denied', tokens_remaining: ledger.tokens_remaining }) };
            }
        }
        
        // --- ACTION: REPORT ---
        // An agent reports its actual usage after a task is complete.
        if (action === 'report') {
            if (!agent_name || !estimated_cost || !actual_cost) {
                return { statusCode: 400, body: JSON.stringify({ error: 'Agent name, estimated cost, and actual cost are required for reporting.' }) };
            }
            
            // Calculate the difference and refund any unused tokens
            const refund = estimated_cost - actual_cost;
            
            await ledgerCollection.updateOne(
                { _id: today },
                {
                    $inc: { tokens_remaining: refund },
                    $push: { usage_log: { agent: agent_name, cost: actual_cost, timestamp: new Date() } }
                }
            );

            return { statusCode: 200, body: JSON.stringify({ status: 'reported' }) };
        }

        return { statusCode: 400, body: JSON.stringify({ error: 'Invalid action specified.' }) };

    } catch (error) {
        console.error('Error in Token Ledger function:', error);
        return { statusCode: 500, body: JSON.stringify({ error: 'Failed to process token ledger request.' }) };
    }
};
