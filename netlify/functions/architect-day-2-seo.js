// netlify/functions/architect-day-2-seo.js

const fs = require('fs').promises;
const path = require('path');
const { connectToDatabase } = require('./utils/mongodb-client');
const { callAI } = require('./utils/ai-orchestrator');

// --- CONFIGURATION ---
const PRODUCTS_FILE_PATH = 'assets/products.json';
const INTERESTS_FILE_PATH = 'assets/interests.json';
const AGENT_NAME = 'Day 2: SEO Content Agent';

// --- PROMPT HELPERS ---

const getProductSelectionPrompt = (productCatalog, strategicFeedback, recentProductIds) => {
    return `
You are a strategic e-commerce analyst for denrettegave.dk. Your task is to select 3-5 products from our catalog that would be ideal subjects for this week's blog posts.

Your selection should be based on a combination of factors:
-   **Opportunity:** Products in categories with high user engagement but low conversion.
-   **Seasonality:** Products that are currently in season.
-   **Novelty:** New or interesting products.
-   **Strategic Goals:** Align with the provided strategic feedback.

**Strategic Guideline on Recency:** The following product IDs have been featured in the last two weeks: [${recentProductIds.join(', ')}]. To keep our content fresh, you should generally AVOID selecting these products. However, you have the authority to override this guideline if a product is exceptionally timely (e.g., it has suddenly gone viral, is peaking in seasonal demand, or is tied to a major cultural event). Weigh the benefit of fresh content against the opportunity to capitalize on a current trend.

Strategic Feedback: "${strategicFeedback}"
Product Catalog:
${JSON.stringify(productCatalog, null, 2)}

STRICT: Output ONLY a JSON array of the product IDs you have selected, like ["1", "15", "42"].
`;
};

const getResearchPrompt = (products) => {
    const productDetails = products.map(p => `Product ID ${p.id}: ${p.name} - URL: ${p.url}`).join('\n');
    return `
You are a world-class research assistant. For each of the following products, perform a deep analysis based on their provided URL and your knowledge of the web.

${productDetails}

For EACH product, provide the following in a structured JSON object:
1.  **summary:** A concise summary of the product's key features and benefits from its retail page.
2.  **blog_topics:** An array of 2-3 distinct, engaging blog post topic ideas (e.g., listicles, how-tos, comparisons) that are useful to a reader and where this product would be a natural fit.
3.  **competitors:** A list of 1-2 similar but alternative products, including their names and descriptions, that could be mentioned in the blog posts for a fair comparison.
4.  **trends:** A brief summary of any recent news, social media trends, or search interest related to these types of products.

STRICT: Your final output must be a single JSON object where keys are the Product IDs.
`;
};

const getWriterPrompt = (product, research, topLevelCategories) => {
    return `
You are a world-class SEO expert and e-commerce copywriter for the Danish market. Your task is to write a compelling, keyword-rich, and helpful blog post.

**Topic:** You will write about one of the blog topics suggested in the research material. Choose the one you believe will be most engaging and helpful to a gift shopper.
**Product to Feature:** ${product.name}
**Provided Research Material:**
${JSON.stringify(research, null, 2)}

**CRITICAL INSTRUCTIONS:**
1.  **Write an extensive, high-quality blog post** of at least 600 words. It should be optimized for human readability first, SEO second. Use SEO-optimized headings.
2.  **Incorporate the research naturally.** Mention the alternative products for comparison where it feels appropriate.
3.  **Keyword Generation Mandate:** After the blog post, you MUST generate a JSON array named \`keywords\`. This list must contain 10-15 keywords.
    -   You MUST select at least one relevant top-level category from this list for navigation: ${topLevelCategories.join(', ')}.
    -   For the rest, generate a creative mix of short-tail and long-tail keywords relevant to the post.
4.  **Final Output:** Your output must be a single JSON object in this exact format: { "blog_post_markdown": "...", "keywords": [...] }

`;
};


// --- MAIN HANDLER ---
exports.handler = async (event) => {
    console.log(`Starting ${AGENT_NAME} run...`);

    try {
        // --- 1. Gather Intelligence ---
        const db = await connectToDatabase();
        const reportsCollection = db.collection('strategic_reports');
        const contentPipelineCollection = db.collection('content_pipeline');
        const [productCatalog, interests] = await Promise.all([
            fs.readFile(path.resolve(PRODUCTS_FILE_PATH), 'utf-8').then(JSON.parse),
            fs.readFile(path.resolve(INTERESTS_FILE_PATH), 'utf-8').then(JSON.parse)
        ]);

        const topLevelCategories = interests.filter(i => !i.parents || i.parents.length === 0).map(i => i.key);
        const latestReport = await reportsCollection.findOne({}, { sort: { createdAt: -1 } });
        const strategicFeedback = latestReport ? latestReport.summary : "No specific feedback this week.";

        const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
        const recentPosts = await contentPipelineCollection.find({ createdAt: { $gte: twoWeeksAgo } }).toArray();
        const recentProductIds = recentPosts.map(post => post.product_id);

        // --- 2. Step 1: Select Products (GPT-4.5) ---
        console.log("Step 1: Selecting strategic products...");
        const selectionPrompt = getProductSelectionPrompt(productCatalog, strategicFeedback, recentProductIds);
        const selectedIdsResponse = await callAI({
            model: 'gpt-4.5-preview',
            prompt: selectionPrompt,
            agent_name: AGENT_NAME,
            estimated_cost: 2000
        });
        const selectedIds = JSON.parse(selectedIdsResponse);
        const selectedProducts = productCatalog.filter(p => selectedIds.includes(p.id));

        // --- 3. Step 2: Research Products (Gemini) ---
        console.log("Step 2: Researching products with Gemini...");
        const researchPrompt = getResearchPrompt(selectedProducts);
        const researchResponse = await callAI({
            model: 'gemini-2.5-flash',
            prompt: researchPrompt,
            agent_name: AGENT_NAME
        });
        const researchData = JSON.parse(researchResponse);

        // --- 4. Step 3: Write Blog Posts (GPT-4.5) ---
        console.log("Step 3: Writing blog posts...");
        for (const product of selectedProducts) {
            const productResearch = researchData[product.id];
            if (!productResearch) continue;

            const writerPrompt = getWriterPrompt(product, productResearch, topLevelCategories);
            const writerResponse = await callAI({
                model: 'gpt-4.5-preview',
                prompt: writerPrompt,
                agent_name: AGENT_NAME,
                estimated_cost: 5000 // Generous estimate for writing
            });
            
            const { blog_post_markdown, keywords } = JSON.parse(writerResponse);

            // --- 5. Save to Content Pipeline ---
            await contentPipelineCollection.insertOne({
                product_id: product.id,
                product_name: product.name,
                blog_post_markdown: blog_post_markdown,
                keywords: keywords,
                status: 'needs_media', // Ready for manual review and media addition
                createdAt: new Date()
            });
            console.log(`Blog post for ${product.name} saved to pipeline.`);
        }

        return {
            statusCode: 200,
            body: JSON.stringify({ message: `${AGENT_NAME} complete. ${selectedProducts.length} blog posts generated.` })
        };

    } catch (error) {
        console.error(`Error in ${AGENT_NAME}:`, error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: `Failed to complete ${AGENT_NAME} run.` })
        };
    }
};
