const fs = require('fs').promises;
const path = require('path');

// Path now points to the secure 'data' folder, not the public 'assets' folder.
const DATA_DIR = path.join(__dirname, '..', 'data');
const filePath = path.join(DATA_DIR, 'shares.json');

exports.handler = async (event, context) => {
    // Only allow GET requests
    if (event.httpMethod !== 'GET') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const shareId = event.queryStringParameters.id;

        if (!shareId) {
            return { statusCode: 400, body: 'Bad Request: Missing share ID.' };
        }

        let shares = [];
        try {
            const data = await fs.readFile(filePath, 'utf8');
            shares = JSON.parse(data);
        } catch (error) {
            // If the shares file doesn't exist yet, it's a 404.
            if (error.code === 'ENOENT') {
                return { statusCode: 404, body: 'Not Found' };
            }
            throw error;
        }

        const sharedData = shares.find(s => s.id === shareId);

        if (sharedData) {
            // Return the stored data object associated with the share ID
            return {
                statusCode: 200,
                body: JSON.stringify(sharedData.data)
            };
        } else {
            return {
                statusCode: 404,
                body: JSON.stringify({ error: 'Share link not found.' })
            };
        }

    } catch (error) {
        console.error('Error getting shared result:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Internal Server Error' })
        };
    }
};
