// netlify/functions/seo-day-2-content.js

const { Octokit } = require('@octokit/rest');

// --- CONFIGURATION ---
const GITHUB_OWNER = 'YOUR_GITHUB_USERNAME'; // IMPORTANT: Replace with your GitHub username
const GITHUB_REPO = 'gaveguiden'; // IMPORTANT: Replace if your repo name is different
const BASE_PATH = 'public/assets/seo_content';

// Helper function to get the AI prompt
const getSeoPrompt = (categoryName, productNames, strategicFeedback) => {
    const productList = productNames.join(', ');

    return `
You are a world-class SEO expert and e-commerce copywriter for the Danish market, specializing in gift guides. Your task is to write a compelling, keyword-rich, and helpful category description for denrettegave.dk.

The target category is: "${categoryName}"

This category includes products like: ${productList}.

Last week's strategic feedback for you to consider: "${strategicFeedback}"

Write an engaging ~250-word description for the top of this category page. The description should:
1.  Be written in Danish.
2.  Be warm, helpful, and inspiring to someone looking for a gift.
3.  Seamlessly integrate relevant long-tail keywords that a user might search for on Google (e.g., "gave til manden der har alt," "bæredygtige gaver," "oplevelsesgave til par").
4.  Subtly guide the user towards starting the gift-finding quiz.
5.  Be formatted in simple markdown.

STRICT: Output ONLY the markdown text, nothing else.
`;
};

// Main handler
exports.handler = async (event) => {
    console.log("Starting Day 2: SEO Content Agent run...");

    try {
        const { productCatalog, interests, strategicFeedback } = JSON.parse(event.body);
        const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

        for (const category of interests.categories) {
            const productsInCategory = productCatalog.filter(p => p.main_category === category.id);
            if (productsInCategory.length < 5) continue; // Skip categories with too few products

            console.log(`Generating SEO content for category: ${category.name}`);
            const productNames = productsInCategory.map(p => p.name);
            const prompt = getSeoPrompt(category.name, productNames, strategicFeedback);

            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${process.env.OPENAI_API_KEY_GPT45}`
                },
                body: JSON.stringify({
                    model: 'gpt-4.5-preview',
                    messages: [{ role: 'user', content: prompt }],
                    temperature: 0.8,
                    max_tokens: 1000
                })
            });

            if (!response.ok) throw new Error(`OpenAI API failure for SEO category ${category.name}`);

            const data = await response.json();
            const markdownContent = data.choices[0].message.content;
            const content = Buffer.from(markdownContent).toString('base64');
            const filePath = `${BASE_PATH}/${category.id}.md`;

            let fileSha;
            try {
                const { data: existingFile } = await octokit.repos.getContent({
                    owner: GITHUB_OWNER,
                    repo: GITHUB_REPO,
                    path: filePath,
                });
                fileSha = existingFile.sha;
            } catch (error) {
                console.log(`Content for ${category.id}.md not found. Creating new file.`);
            }

            await octokit.repos.createOrUpdateFileContents({
                owner: GITHUB_OWNER,
                repo: GITHUB_REPO,
                path: filePath,
                message: `feat(content): Day 2 - Automated SEO content for ${category.name}`,
                content: content,
                sha: fileSha,
                branch: 'main'
            });
        }

        console.log("Successfully generated and committed SEO content files.");
        return {
            statusCode: 200,
            body: JSON.stringify({ message: `Day 2 complete. SEO content generated for ${interests.categories.length} categories.` })
        };

    } catch (error) {
        console.error('Error in SEO Content Agent function:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to complete SEO Content Agent run.' })
        };
    }
};
