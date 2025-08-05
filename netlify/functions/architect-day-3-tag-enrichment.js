// netlify/functions/architect-day-3-tag-enrichment.js

const fs = require('fs').promises;
const path = require('path');
const { Octokit } = require('@octokit/rest');
const { connectToDatabase } = require('./utils/mongodb-client');
const { callAI } = require('./utils/ai-orchestrator');

// --- CONFIGURATION ---
const GITHUB_OWNER = 'TomKonig';
const GITHUB_REPO = 'GaveGuiden';
const PRODUCTS_FILE_PATH = 'assets/products.json';
const INTERESTS_FILE_PATH = 'assets/interests.json';
const AGENT_NAME = 'Day 3: Tag Enrichment Agent';

// --- PROMPT HELPERS ---

const getEnrichmentPrompt = (product, interestsTree, strategicGoal) => {
    return `
You are an expert e-commerce data curator and tag taxonomist for denrettegave.dk. Your task is to audit and enrich the metadata for a single product based on a specific strategic goal.

**Strategic Goal:** ${strategicGoal}

**Product Data:**
${JSON.stringify(product, null, 2)}

**Full Interest Hierarchy:**
${JSON.stringify(interestsTree, null, 2)}

**Your Task:**
Based on the strategic goal, analyze the product and its current tags. Propose a set of changes to enrich its data. This can include:
-   Adding new, relevant interest tags from the hierarchy.
-   Suggesting new interest tags that don't exist yet but should.
-   Correcting or updating values in the product's 'context' object (e.g., updating the 'season' or 'relevance_halflife_days').

**CRITICAL: Your output must be ONLY a single JSON object representing the *complete, updated product data***. Do not provide explanations. You must return the entire product object with your changes merged in.
`;
};

// --- MAIN HANDLER ---
exports.handler = async (event) => {
    console.log(`Starting ${AGENT_NAME} run...`);

    try {
        // --- 1. Gather Intelligence ---
        const db = await connectToDatabase();
        const reportsCollection = db.collection('strategic_reports');
        const [productCatalog, interests] = await Promise.all([
            fs.readFile(path.resolve(PRODUCTS_FILE_PATH), 'utf-8').then(JSON.parse),
            fs.readFile(path.resolve(INTERESTS_FILE_PATH), 'utf-8').then(JSON.parse)
        ]);

        const latestReport = await reportsCollection.findOne({}, { sort: { createdAt: -1 } });
        if (!latestReport || !latestReport.enrichment_tasks) {
            const message = "No enrichment tasks found from Day 7 agent. Ending run.";
            console.log(message);
            return { statusCode: 200, body: JSON.stringify({ message }) };
        }

        const tasks = latestReport.enrichment_tasks; // e.g., [{ product_id: "123", goal: "Improve seasonal relevance" }]
        let updatedProductCatalog = [...productCatalog];

        // --- 2. Process Each Enrichment Task ---
        for (const task of tasks) {
            const productToUpdate = updatedProductCatalog.find(p => p.id === task.product_id);
            if (!productToUpdate) continue;
            
            console.log(`Processing task for product ID ${task.product_id}: ${task.goal}`);

            const prompt = getEnrichmentPrompt(productToUpdate, interests, task.goal);
            const estimated_cost = 3000; // Moderate cost for analysis and output

            // --- 3. Delegate to the Engine ---
            const aiResponse = await callAI({
                model: 'gpt-o3',
                prompt: prompt,
                agent_name: AGENT_NAME,
                estimated_cost: estimated_cost,
                response_format: { type: "json_object" }
            });

            const updatedProduct = JSON.parse(aiResponse);

            // --- 4. Update the In-Memory Catalog ---
            const productIndex = updatedProductCatalog.findIndex(p => p.id === updatedProduct.id);
            if (productIndex !== -1) {
                updatedProductCatalog[productIndex] = updatedProduct;
            }
        }

        // --- 5. Commit the entire updated products.json back to GitHub ---
        const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
        const content = Buffer.from(JSON.stringify(updatedProductCatalog, null, 2)).toString('base64');
        
        // We must get the current SHA of the file to update it
        const { data: existingFile } = await octokit.repos.getContent({
            owner: GITHUB_OWNER,
            repo: GITHUB_REPO,
            path: PRODUCTS_FILE_PATH,
        });

        await octokit.repos.createOrUpdateFileContents({
            owner: GITHUB_OWNER,
            repo: GITHUB_REPO,
            path: PRODUCTS_FILE_PATH,
            message: `feat(data): ${AGENT_NAME} - Automated tag and metadata enrichment`,
            content: content,
            sha: existingFile.sha,
            branch: 'main'
        });

        console.log(`Successfully enriched metadata for ${tasks.length} products.`);
        return {
            statusCode: 200,
            body: JSON.stringify({ message: `${AGENT_NAME} complete.` })
        };

    } catch (error) {
        console.error(`Error in ${AGENT_NAME}:`, error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: `Failed to complete ${AGENT_NAME} run.` })
        };
    }
};
