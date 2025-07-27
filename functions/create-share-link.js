const fs = require('fs').promises;
const path = require('path');

// Helper function to generate a short random ID
const generateId = () => Math.random().toString(36).substring(2, 8);

// Path now points to the secure 'data' folder, not the public 'assets' folder.
const DATA_DIR = path.join(__dirname, '..', 'data');
const filePath = path.join(DATA_DIR, 'shares.json');

exports.handler = async (event, context) => {
    // Only allow POST requests
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const payload = JSON.parse(event.body);

        // Basic validation
        if (!payload.product_id || !payload.quiz_answers) {
            return { statusCode: 400, body: 'Bad Request: Missing required fields.' };
        }

        // GDPR Compliance: Anonymize data by removing the name field before saving
        if (payload.quiz_answers && payload.quiz_answers.name) {
            delete payload.quiz_answers.name;
        }
        
        // Ensure the data directory exists before trying to write to it
        await fs.mkdir(DATA_DIR, { recursive: true });

        let shares = [];
        try {
            const data = await fs.readFile(filePath, 'utf8');
            shares = JSON.parse(data);
        } catch (error) {
            // If the file doesn't exist, we start with an empty array.
            if (error.code !== 'ENOENT') throw error;
        }

        const newShare = {
            id: generateId(),
            data: payload,
            timestamp: new Date().toISOString()
        };

        shares.push(newShare);

        // Write the updated array back to the private file
        await fs.writeFile(filePath, JSON.stringify(shares, null, 2));

        // Return only the unique ID to the frontend
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
