const fs = require('fs').promises;
const path = require('path');

// Helper function to generate a short random ID
const generateId = () => Math.random().toString(36).substring(2, 8);

exports.handler = async (event, context) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const payload = JSON.parse(event.body);

        if (!payload.product_id || !payload.quiz_answers) {
            return { statusCode: 400, body: 'Bad Request: Missing required fields.' };
        }

        // GDPR Compliance: Anonymize data by removing the name field before saving
        if (payload.quiz_answers && payload.quiz_answers.name) {
            delete payload.quiz_answers.name;
        }

        const filePath = path.join(__dirname, '..', 'assets', 'shares.json');
        
        let shares = [];
        try {
            const data = await fs.readFile(filePath, 'utf8');
            shares = JSON.parse(data);
        } catch (error) {
            if (error.code !== 'ENOENT') throw error; // Re-throw if it's not a "file not found" error
        }

        const newShare = {
            id: generateId(),
            data: payload,
            timestamp: new Date().toISOString()
        };

        shares.push(newShare);

        await fs.writeFile(filePath, JSON.stringify(shares, null, 2));

        return {
            statusCode: 200,
            body: JSON.stringify({ shareId: newShare.id })
        };

    } catch (error) {
        console.error('Error creating share link:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Internal Server Error' })
        };
    }
};
