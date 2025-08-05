// netlify/functions/architect-day-1-questions.js

const fs = require('fs').promises;
const path = require('path');
const { Octokit } = require('@octokit/rest');
const { connectToDatabase } = require('./utils/mongodb-client');
const { callAI } = require('./utils/ai-orchestrator');

// --- CONFIGURATION ---
const GITHUB_OWNER = 'TomKonig';
const GITHUB_REPO = 'GaveGuiden';
const AGENT_NAME = 'Day 1: Question Architect (Manual)';

// --- CORRECTED FILE PATHS ---
// This creates a reliable path from the function's location to the project root.
const PROJECT_ROOT = path.resolve(__dirname, '../../');
const QUESTIONS_FILE_PATH = path.join(PROJECT_ROOT, 'assets/questions.json');
const PRODUCTS_FILE_PATH = path.join(PROJECT_ROOT, 'assets/products.json');
const INTERESTS_FILE_PATH = path.join(PROJECT_ROOT, 'assets/interests.json');

// --- HELPER: The Master Prompt ---
const getArchitectPrompt = (category, products, interestsTree, strategicFeedback) => {
    // Corrected to include the full tag list for each product.
    const productList = products.map(p => `- ${p.name}: ${p.description} (Tags: ${p.tags.join(', ')})`).join('\n');
    
    return `
You are a world-class Quiz Architect and e-commerce strategist for denrettegave.dk. Your primary goal is to create a dynamic, multi-step conversational path that intelligently guides a user from a broad category interest to a specific, actionable product preference.

Execution Context: How Your Questions Will Be Used
The question paths you design will be used in a real-time "tournament" powered by a Thompson Sampling algorithm. A meaningful answer from the user is a "win" for that category, increasing its score and its chance of asking more questions. Choosing the "Ingen af disse passer..." escape hatch is a significant "loss," drastically reducing its score. Your questions must be expertly crafted to get a clear signal of user preference and avoid unnecessary "losses".

You will be given a top-level category, the full product catalog for that category, the full hierarchical tree of interests, and strategic feedback from previous weeks. Your task is to generate a questions.json structure for this single category.

**CRITICAL INSTRUCTIONS:**
1.  **Hierarchical Path Generation:** Do not create a flat list of questions. Analyze the interests hierarchy. Your first question should differentiate between the most logical, high-level sub-categories for the given top-level category: "${category.name}". Subsequent questions must narrow the user's choice down the interest tree.
2.  **Conditional Path Mandate:** You must also consider the core user filters (age, gender, budget), paying special attention to the **hard filters**: \`gender\` and \`budget\`. These filters will prune the available product list. If these filters create a significantly different set of products for a given category, you **must generate separate, conditional question paths** for that context. Each question object in your output must include a \`context\` field specifying the filter permutation it applies to (e.g., { "context": { "gender": "man" } }). If a question is generic and applies to all contexts, the context can be null.
3.  **Pronoun Templating Mandate:** When writing question text, if you need to use a gendered pronoun, you MUST use the following placeholders instead of a hardcoded word: \`{{pronoun1}}\` (han/hun/de), \`{{pronoun2}}\` (ham/hende/dem), and \`{{pronoun3}}\` (hans/hendes/deres). Example: 'Hvad er {{pronoun3}} yndlingsfarve?'
4.  **Semantic Variations:** For each logical question you create, you MUST provide at least 3 distinct, human-like \`phrasings\`.
5.  **JSON Output:** The output MUST be a JSON object adhering to this exact structure: { "questions": [ { "question_id": "...", "context": { "gender": "man" }, "parent_answer_id": "...", "phrasings": ["...", "..."], "answers": [ { "answer_id": "...", "answer_text": "...", "tags": ["..."] } ] } ] }

**DATA PROVIDED:**
Category to process: ${category.name} (ID: ${category.id})
Strategic Feedback: "${strategicFeedback}"
Full Interest Tree:
${JSON.stringify(interestsTree, null, 2)}
Products in this Category:
${productList}
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
        const strategicFeedback = latestReport ? latestReport.summary : "No specific feedback this week.";
        
        const allNewQuestions = [];
        const topLevelCategories = interests.filter(i => !i.parent);

        // --- 2. Process Each Category ---
        for (const category of topLevelCategories) {
            console.log(`Processing category: ${category.name}`);
            const productsInCategory = productCatalog.filter(p => p.tags.includes(category.id));
            if (productsInCategory.length === 0) continue;

            const prompt = getArchitectPrompt(category, productsInCategory, interests, strategicFeedback);
            const estimated_cost = 25000; // Generous estimate for this complex task

            // --- 3. Delegate to the Engine ---
            const aiResponse = await callAI({
                model: 'gpt-o3',
                prompt: prompt,
                agent_name: AGENT_NAME,
                estimated_cost: estimated_cost,
                response_format: { type: "json_object" } // Enforce JSON output
            });

            const categoryQuestions = JSON.parse(aiResponse).questions;
            allNewQuestions.push(...categoryQuestions);
        }

        // --- 4. Commit New questions.json to GitHub ---
        const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
        const content = Buffer.from(JSON.stringify(allNewQuestions, null, 2)).toString('base64');
        let fileSha;
        try {
            const { data: existingFile } = await octokit.repos.getContent({
                owner: GITHUB_OWNER,
                repo: GITHUB_REPO,
                path: 'assets/questions.json',
            });
            fileSha = existingFile.sha;
        } catch (error) {
            console.log(`${'assets/questions.json'} not found. Creating new file.`);
        }

        await octokit.repos.createOrUpdateFileContents({
            owner: GITHUB_OWNER,
            repo: GITHUB_REPO,
            path: 'assets/questions.json',
            message: `feat(content): ${AGENT_NAME} - Automated weekly question architecture`,
            content: content,
            sha: fileSha,
            branch: 'main'
        });

        console.log(`Successfully generated and committed ${allNewQuestions.length} questions.`);
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
