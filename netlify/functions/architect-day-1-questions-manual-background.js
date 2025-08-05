// netlify/functions/architect-day-1-questions.js

const fs = require('fs').promises;
const path = require('path');
const { Octokit } = require('@octokit/rest');
const { connectToDatabase } = require('./utils/mongodb-client');
const { callAI } = require('./utils/ai-orchestrator');

// --- CONFIGURATION ---
const GITHUB_OWNER = 'TomKonig';
const GITHUB_REPO = 'GaveGuiden';
const AGENT_NAME = 'Day 1: Question Architect';
const RUN_ID = `weekly-${new Date().toISOString().split('T')[0]}`; // Unique ID for this week's run

const PROJECT_ROOT = path.resolve(__dirname, '../../');
const PRODUCTS_FILE_PATH = path.join(PROJECT_ROOT, 'assets/products.json');
const INTERESTS_FILE_PATH = path.join(PROJECT_ROOT, 'assets/interests.json');

// --- PROMPT HELPER (remains the same) ---
// REPLACE IT WITH THIS...
const scopedTree = getScopedInterestTree(interests, category.key);
const prompt = getArchitectPrompt(category, productsInCategory, scopedTree, strategicFeedback);
// Corrected to include the full tag list for each product.
const productList = productsInCategory.map(p => `- ${p.name}: ${p.description} (Tags: ${p.tags.join(', ')})`).join('\n');
    
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

// ADD THIS NEW HELPER FUNCTION

// --- HELPER: Scopes the interest tree to only the relevant branch ---
function getScopedInterestTree(allInterests, parentKey) {
    const relevantInterests = new Map();
    const parentCategory = allInterests.find(i => i.key === parentKey);

    if (!parentCategory) return [];

    const findChildrenRecursive = (key) => {
        if (relevantInterests.has(key)) return; // Avoid circular dependencies
        const category = allInterests.find(i => i.key === key);
        if (category) {
            relevantInterests.set(key, category);
            const children = allInterests.filter(i => i.parents && i.parents.includes(key));
            children.forEach(child => findChildrenRecursive(child.key));
        }
    };

    findChildrenRecursive(parentKey);
    return Array.from(relevantInterests.values());
}

// --- MAIN HANDLER ---
exports.handler = async (event) => {
    console.log(`Starting ${AGENT_NAME} run...`);
    const db = await connectToDatabase();
    const stateCollection = db.collection('agent_state');

    try {
        // --- 1. Find or Create this week's run state ---
        let runState = await stateCollection.findOne({ _id: RUN_ID });

        if (!runState) {
            console.log("No state found for this week. Initializing new run...");
            const interests = await fs.readFile(INTERESTS_FILE_PATH, 'utf-8').then(JSON.parse);
            const topLevelCategories = interests.filter(i => !i.parents || i.parents.length === 0);
            
            runState = {
                _id: RUN_ID,
                agent: AGENT_NAME,
                status: 'in_progress',
                categories_to_process: topLevelCategories.map(c => c.key),
                processed_categories: [],
                questions_in_progress: []
            };
            await stateCollection.insertOne(runState);
        }

        if (runState.status === 'complete') {
            console.log("This week's run is already complete. Exiting.");
            return { statusCode: 200, body: JSON.stringify({ message: "Run already complete." }) };
        }

        // --- 2. Find the next category to process ---
        const nextCategoryKey = runState.categories_to_process.find(key => !runState.processed_categories.includes(key));

        if (!nextCategoryKey) {
            // --- FINALIZATION STEP ---
            console.log("All categories processed. Committing final questions.json to GitHub...");
            const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
            const content = Buffer.from(JSON.stringify(runState.questions_in_progress, null, 2)).toString('base64');
            let fileSha;
            try {
                const { data: existingFile } = await octokit.repos.getContent({ owner: GITHUB_OWNER, repo: GITHUB_REPO, path: 'assets/questions.json' });
                fileSha = existingFile.sha;
            } catch (error) { /* File doesn't exist, create it */ }

            await octokit.repos.createOrUpdateFileContents({
                owner: GITHUB_OWNER,
                repo: GITHUB_REPO,
                path: 'assets/questions.json',
                message: `feat(content): ${AGENT_NAME} - Weekly question architecture`,
                content,
                sha: fileSha,
                branch: 'main'
            });

            await stateCollection.updateOne({ _id: RUN_ID }, { $set: { status: 'complete' } });
            console.log("Final questions.json committed. Run complete.");
            return { statusCode: 200, body: JSON.stringify({ message: "Run complete. Final file committed." }) };
        }

        // --- 3. Process the single category ---
        console.log(`Processing next category: ${nextCategoryKey}`);
        const [productCatalog, interests] = await Promise.all([
            fs.readFile(PRODUCTS_FILE_PATH, 'utf-8').then(JSON.parse),
            fs.readFile(INTERESTS_FILE_PATH, 'utf-8').then(JSON.parse)
        ]);
        const category = interests.find(i => i.key === nextCategoryKey);
        const productsInCategory = productCatalog.filter(p => p.tags.includes(category.key));

        const strategicFeedback = "No specific feedback this week."; // Placeholder
        const prompt = getArchitectPrompt(category, productsInCategory, interests, strategicFeedback);
        
        const aiResponse = await callAI({
            model: 'gpt-o3',
            prompt,
            agent_name: AGENT_NAME,
            estimated_cost: 25000,
            response_format: { type: "json_object" }
        });
        
        const { questions } = JSON.parse(aiResponse);

        // --- 4. Update the state in MongoDB ---
        await stateCollection.updateOne(
            { _id: RUN_ID },
            {
                $push: { 
                    processed_categories: nextCategoryKey,
                    questions_in_progress: { $each: questions }
                }
            }
        );

        console.log(`Successfully processed category ${nextCategoryKey}. State saved.`);
        return {
            statusCode: 200,
            body: JSON.stringify({ message: `Processed ${nextCategoryKey}.` })
        };

    } catch (error) {
        console.error(`Error in ${AGENT_NAME}:`, error);
        await stateCollection.updateOne({ _id: RUN_ID }, { $set: { status: 'failed', error: error.message } });
        return {
            statusCode: 500,
            body: JSON.stringify({ error: `Failed to complete ${AGENT_NAME} run.` })
        };
    }
};
