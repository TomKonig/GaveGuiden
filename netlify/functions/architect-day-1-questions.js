// netlify/functions/architect-day-1-questions.js

const { Octokit } = require('@octokit/rest');

// --- CONFIGURATION ---
const GITHUB_OWNER = 'YOUR_GITHUB_USERNAME'; // IMPORTANT: Replace with your GitHub username
const GITHUB_REPO = 'gaveguiden'; // IMPORTANT: Replace if your repo name is different
const FILE_PATH = 'public/assets/questions.json';

// Helper function to get the AI prompt
const getArchitectPrompt = (categoryName, products, strategicFeedback) => {
    const productList = products.map(p => `- ${p.name}: ${p.description}`).join('\n');

    return `
You are a world-class e-commerce strategist and quiz designer for denrettegave.dk. Your tone is insightful and creative. Your task is to analyze a list of products within a specific category and generate a set of brilliant multiple-choice questions to help guide a user.

Analyze the following product list for the category: "${categoryName}"
${productList}

Last week's strategic feedback for you to consider: "${strategicFeedback}"

Based on your analysis of the products and the feedback, perform the following steps:
1. First, identify 3-4 distinct, meaningful sub-themes that a gift shopper would understand.
2. Then, for each theme, generate ONE insightful, situational, or personality-based multiple-choice question that helps a user express their preference for that specific theme over the others.
3. Finally, structure your entire output for this category as a JSON array of question objects.

STRICT Rules for the output:
- The final output MUST be only the JSON array, nothing else.
- Each question object must have this exact format: { "id": "q_ai_...", "category": "${categoryName}", "question_text": "...", "answers": [...] }
- Answer tags must be based on tags found in the product data.
- The LAST answer for every question MUST be an escape hatch: { "answer_text": "Ingen af disse passer...", "tags": ["freetext:true"] }.
`;
};

exports.handler = async (event) => {
    console.log("Starting Day 1: Question Architect run...");

    try {
        const { productCatalog, interests, strategicFeedback } = JSON.parse(event.body);
        const allQuestions = [];

        // Authenticate with GitHub
        const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

        for (const category of interests.categories) {
            const productsInCategory = productCatalog.filter(p => p.main_category === category.id);
            if (productsInCategory.length === 0) continue;

            console.log(`Processing category: ${category.name}`);
            const prompt = getArchitectPrompt(category.name, productsInCategory, strategicFeedback);

            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${process.env.OPENAI_API_KEY_GPT45}` // Using the powerful model's key
                },
                body: JSON.stringify({
                    model: 'gpt-4.5-preview',
                    messages: [{ role: 'user', content: prompt }],
                    temperature: 0.7,
                    max_tokens: 4096, // Setting a generous limit for this complex task
                    response_format: { type: "json_object" }
                })
            });

            if (!response.ok) throw new Error(`OpenAI API failure for category ${category.name}`);
            
            const data = await response.json();
            const categoryQuestions = JSON.parse(data.choices[0].message.content);
            allQuestions.push(...categoryQuestions);
        }

        // --- Commit the new questions.json file to GitHub ---
        const content = Buffer.from(JSON.stringify(allQuestions, null, 2)).toString('base64');
        
        let fileSha;
        try {
            const { data: existingFile } = await octokit.repos.getContent({
                owner: GITHUB_OWNER,
                repo: GITHUB_REPO,
                path: FILE_PATH,
            });
            fileSha = existingFile.sha;
        } catch (error) {
            // File doesn't exist, which is fine. We will create it.
            console.log("questions.json not found. Creating new file.");
        }

        await octokit.repos.createOrUpdateFileContents({
            owner: GITHUB_OWNER,
            repo: GITHUB_REPO,
            path: FILE_PATH,
            message: `feat: Day 1 - Automated question architecture run`,
            content: content,
            sha: fileSha, // If fileSha is undefined, a new file is created
            branch: 'main'
        });

        console.log("Successfully generated and committed new questions.json.");
        return {
            statusCode: 200,
            body: JSON.stringify({ message: `Day 1 complete. ${allQuestions.length} questions generated and committed.` })
        };

    } catch (error) {
        console.error('Error in Question Architect function:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to complete Question Architect run.' })
        };
    }
};
