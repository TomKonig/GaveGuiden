const fs = require('fs').promises;
const path = require('path');

const ASSETS_DIR = path.join(__dirname, '..', 'assets');
const filePath = path.join(ASSETS_DIR, 'flags.json');

exports.handler = async (event, context) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const flagData = JSON.parse(event.body);

        if (!flagData.product_id || !flagData.issue_type) {
            return { statusCode: 400, body: 'Bad Request: Missing required fields.' };
        }

        // Ensure the assets directory exists
        await fs.mkdir(ASSETS_DIR, { recursive: true });
        
        let flags = [];
        try {
            const data = await fs.readFile(filePath, 'utf8');
            flags = JSON.parse(data);
        } catch (error) {
            if (error.code !== 'ENOENT') throw error;
        }

        flags.push(flagData);

        await fs.writeFile(filePath, JSON.stringify(flags, null, 2));

        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Flag submitted successfully' })
        };

    } catch (error) {
        console.error('Error processing flag:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Internal Server Error' })
        };
    }
};
