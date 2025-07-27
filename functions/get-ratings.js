const fs = require('fs').promises;
const path = require('path');

// This path points to a directory *outside* the public-facing build folder.
// For example, if your site publishes from a 'public' or 'dist' folder,
// this 'data' folder at the root will not be accessible from the web.
const DATA_DIR = path.join(__dirname, '..', 'data');
const filePath = path.join(DATA_DIR, 'ratings.json');

exports.handler = async (event, context) => {
    // Only allow POST requests
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const ratingData = JSON.parse(event.body);

        // Basic validation
        if (!ratingData.product_id || !ratingData.rating || !ratingData.quiz_answers) {
            return { statusCode: 400, body: 'Bad Request: Missing required fields.' };
        }

        // GDPR Compliance: Anonymize data by removing the name field before saving
        if (ratingData.quiz_answers && ratingData.quiz_answers.name) {
            delete ratingData.quiz_answers.name;
        }

        // Ensure the data directory exists before trying to write to it
        await fs.mkdir(DATA_DIR, { recursive: true });
        
        let ratings = [];
        try {
            const data = await fs.readFile(filePath, 'utf8');
            ratings = JSON.parse(data);
        } catch (error) {
            // If the file doesn't exist, we start with an empty array.
            // This is expected on the first run.
            if (error.code !== 'ENOENT') throw error;
        }

        ratings.push(ratingData);

        // Write the updated array back to the private file
        await fs.writeFile(filePath, JSON.stringify(ratings, null, 2));

        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Rating submitted successfully' })
        };

    } catch (error) {
        console.error('Error processing rating:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Internal Server Error' })
        };
    }
};
