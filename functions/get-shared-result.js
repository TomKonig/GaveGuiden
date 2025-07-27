const fs = require('fs').promises;
const path = require('path');

exports.handler = async (event, context) => {
    if (event.httpMethod !== 'GET') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const shareId = event.queryStringParameters.id;

        if (!shareId) {
            return { statusCode: 400, body: 'Bad Request: Missing share ID.' };
        }

        const filePath = path.join(__dirname, '..', 'assets', 'shares.json');
        
        let shares = [];
        try {
            const data = await fs.readFile(filePath, 'utf8');
            shares = JSON.parse(data);
        } catch (error) {
            if (error.code === 'ENOENT') {
                return { statusCode: 404, body: 'Not Found' };
            }
            throw error;
        }

        const sharedData = shares.find(s => s.id === shareId);

        if (sharedData) {
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
