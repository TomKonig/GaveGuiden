const fs = require('fs').promises;
const path = require('path');

exports.handler = async (event, context) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const payload = JSON.parse(event.body);
        const { eventType, productId } = payload;

        if (!eventType || !productId) {
            return { statusCode: 400, body: 'Bad Request: Missing eventType or productId.' };
        }

        const filePath = path.join(__dirname, '..', 'assets', 'analytics.json');
        
        let analytics = { products: {}, site_totals: {} };
        try {
            const data = await fs.readFile(filePath, 'utf8');
            analytics = JSON.parse(data);
        } catch (error) {
            if (error.code !== 'ENOENT') throw error;
        }

        // Initialize product entry if it doesn't exist
        if (!analytics.products[productId]) {
            analytics.products[productId] = { suggestions: 0, clicks: 0, sales: 0 };
        }
        // Initialize site totals if they don't exist
        if (!analytics.site_totals.quizzes_completed) analytics.site_totals.quizzes_completed = 0;
        if (!analytics.site_totals.total_clicks) analytics.site_totals.total_clicks = 0;


        if (eventType === 'suggestion') {
            analytics.products[productId].suggestions++;
            analytics.site_totals.quizzes_completed++;
        } else if (eventType === 'click') {
            analytics.products[productId].clicks++;
            analytics.site_totals.total_clicks++;
        }

        await fs.writeFile(filePath, JSON.stringify(analytics, null, 2));

        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Analytics updated successfully' })
        };

    } catch (error)
        console.error('Error processing analytics:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Internal Server Error' })
        };
    }
};
