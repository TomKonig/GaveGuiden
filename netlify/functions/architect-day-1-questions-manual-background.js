// netlify/functions/architect-day-1-questions.js

const fs = require('fs').promises;
const path = require('path');
const { Octokit } = require('@octokit/rest');
const { connectToDatabase } = require('./utils/mongodb-client');
// We no longer need the full callAI orchestrator for this agent
// as we are calling the gpt-o4-mini model directly.

// --- CONFIGURATION ---
const GITHUB_OWNER = 'TomKonig';
const GITHUB_REPO = 'GaveGuiden';
const AGENT_NAME = 'Day 1: Question Architect';
const RUN_ID = `weekly-${new Date().toISOString().split('T')[0]}`;

const PROJECT_ROOT = path.resolve(__dirname, '../../');
const QUESTIONS_FILE_PATH_GIT = 'assets/questions.json';
const QUESTIONS_FILE_PATH_FS = path.join(PROJECT_ROOT, 'assets/questions.json');
const PRODUCTS_FILE_PATH = path.join(PROJECT_ROOT, 'assets/products.json');
const INTERESTS_FILE_PATH = path.join(PROJECT_ROOT, 'assets/interests.json');

// --- HELPER: Scopes the interest tree ---
function getScopedInterestTree(allInterests, parentKey) {
    const scopedTree = new Map();
    const queue = [parentKey]; 

    while (queue.length > 0) {
        const currentKey = queue.shift(); 

        if (scopedTree.has(currentKey)) {
            continue; 
        }

        const category = allInterests.find(i => i.key === currentKey);
        if (category) {
            scopedTree.set(currentKey, category);

            // --- THE FIX is in the next line ---
            // We must use the parent's ID (category.id) to find its children, not its key.
            const children = allInterests.filter(child => 
                Array.isArray(child.parents) && child.parents.includes(category.id)
            );

            children.forEach(child => {
                if (!scopedTree.has(child.key)) {
                    queue.push(child.key);
                }
            });
        }
    }
    return Array.from(scopedTree.values());
}

// --- HELPER: The Master Prompt (with your new instruction) ---
const getArchitectPrompt = (category, productsInCategory, scopedTree, strategicFeedback) => {
    const productList = productsInCategory.map(p => `- ${p.name}: ${p.description} (Tags: ${p.tags.join(', ')}) (Context: ${JSON.stringify(p.context)})`).join('\n');
    
    return `
You are a world-class Quiz Architect and e-commerce strategist for denrettegave.dk. Your primary goal is to create a dynamic, multi-step conversational path that intelligently guides a user from a broad category interest to a specific, actionable product preference.

Execution Context: How Your Questions Will Be Used
The question paths you design will be used in a real-time "tournament" powered by a Thompson Sampling algorithm. A meaningful answer from the user is a "win" for that category, increasing its score and its chance of asking more questions. Choosing the "Ingen af disse passer..." escape hatch is a significant "loss," drastically reducing its score. Your questions must be expertly crafted to get a clear signal of user preference and avoid unnecessary "losses".

You will be given a top-level category and a tree of its child categories, a list of products ONLY for that category and its child categories (including their context tags), the scoped hierarchical tree of interests for that category, and strategic feedback. Your task is to generate a questions.json structure for this single category and any relevant child categories as you progress.

**CRITICAL INSTRUCTIONS:**
1.  **Hierarchical Path Generation:** Do not create a flat list of questions. Analyze the interests hierarchy. Your first question should differentiate between the most logical, high-level sub-categories for the given top-level category: "${category.name}". Subsequent questions must narrow the user's choice down the interest tree.
2.  **Strict Data Adherence:** You MUST ONLY use the tags and context keys provided in the product data.
    -   **YOU MUST NOT INVENT NEW TAGS.** All tags in your answer options must exist in the provided 'Scoped Interest Tree' or the product 'Tags' lists.
    -   **YOU MUST NOT INVENT NEW CONTEXT KEYS.** For the 'context' object in your questions, you must only use the keys and values found in the provided product data (e.g., "gender": "mand", "budget": "billig"). Do not create new budget tiers or other context values.
3.  **Conditional Path Mandate:** You must use the provided product 'Context' data to respect our hard filters (\`gender\` and \`budget\`). If these filters create a significantly different set of products, you **must generate separate, conditional question paths**. Each question object must include a \`context\` field specifying the filter permutation it applies to (e.g., { "context": { "gender": "man" } }). If a question is generic, the context can be null.
4.  **Pronoun Templating Mandate:** When writing question text, if you need to use a gendered pronoun, you MUST use the following placeholders: \`{{pronoun1}}\` (han/hun/de), \`{{pronoun2}}\` (ham/hende/dem), and \`{{pronoun3}}\` (hans/hendes/deres).
5.  **Semantic Variations:** For each logical question you create, you MUST provide at least 3 distinct, human-like \`phrasings\`.
6.  **JSON Output:** The output MUST be a JSON object adhering to this exact structure: { "questions": [ { "question_id": "...", "context": {}, "parent_answer_id": null, "phrasings": ["..."], "answers": [ { "answer_id": "...", "answer_text": "...", "tags": ["..."] } ] } ] }

**DATA PROVIDED:**
Category to process: ${category.name} (ID: ${category.id})
Strategic Feedback: "${strategicFeedback}"
Scoped Interest Tree for this Category:
${JSON.stringify(scopedTree, null, 2)}
Products in this Category:
${productList}
`;
};

// REPLACE the existing exports.handler function with this one.

// --- MAIN HANDLER ---
exports.handler = async (event) => {
    console.log(`Starting ${AGENT_NAME} run...`);
    const db = await connectToDatabase();
    const stateCollection = db.collection('agent_state');
    
    try {
        let runState = await stateCollection.findOne({ _id: RUN_ID });

        // --- FIX: This block is now fully implemented ---
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

        const nextCategoryKey = runState.categories_to_process.find(key => !runState.processed_categories.includes(key));

        if (!nextCategoryKey) {
            // --- FINALIZATION STEP (Updated) ---
            console.log("All categories processed. Merging and committing questions...");
            const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
            
            const existingQuestionsRaw = await fs.readFile(QUESTIONS_FILE_PATH_FS, 'utf-8');
            const existingQuestions = JSON.parse(existingQuestionsRaw);
            const staticQuestions = existingQuestions.filter(q => q.is_static === true);
            const finalQuestions = [...staticQuestions, ...runState.questions_in_progress];

            const content = Buffer.from(JSON.stringify(finalQuestions, null, 2)).toString('base64');
            let fileSha;
            try {
                const { data } = await octokit.repos.getContent({ owner: GITHUB_OWNER, repo: GITHUB_REPO, path: QUESTIONS_FILE_PATH_GIT });
                fileSha = data.sha;
            } catch (error) { /* File doesn't exist */ }

            await octokit.repos.createOrUpdateFileContents({ owner: GITHUB_OWNER, repo: GITHUB_REPO, path: QUESTIONS_FILE_PATH_GIT, message: `feat(content): ${AGENT_NAME} - Weekly question architecture`, content, sha: fileSha, branch: 'main' });
            await stateCollection.updateOne({ _id: RUN_ID }, { $set: { status: 'complete' } });
            return { statusCode: 200, body: JSON.stringify({ message: "Run complete. Final file committed." }) };
        }

        // --- PROCESS SINGLE CATEGORY ---
        const [productCatalog, interests] = await Promise.all([
            fs.readFile(PRODUCTS_FILE_PATH, 'utf-8').then(JSON.parse),
            fs.readFile(INTERESTS_FILE_PATH, 'utf-8').then(JSON.parse)
        ]);
        const category = interests.find(i => i.key === nextCategoryKey);
        const productsInCategory = productCatalog.filter(p => p.tags.includes(category.key));
        const scopedTree = getScopedInterestTree(interests, category.key);
        const strategicFeedback = "No specific feedback this week.";
        const prompt = getArchitectPrompt(category, productsInCategory, scopedTree, strategicFeedback);

        // --- Using o4-mini directly ---
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: 'o4-mini',
                messages: [{ role: 'user', content: prompt }],
                response_format: { type: "json_object" }
            })
        });

        if (!response.ok) throw new Error(`OpenAI API Failure: ${await response.text()}`);
        const data = await response.json();
        const { questions } = JSON.parse(data.choices[0].message.content);

        await stateCollection.updateOne({ _id: RUN_ID }, {
            $push: { processed_categories: nextCategoryKey, questions_in_progress: { $each: questions } }
        });

        console.log(`Successfully processed category ${nextCategoryKey}. State saved.`);
        return { statusCode: 200, body: JSON.stringify({ message: `Processed ${nextCategoryKey}.` }) };

    } catch (error) {
        console.error(`Error in ${AGENT_NAME}:`, error);
        await stateCollection.updateOne({ _id: RUN_ID }, { $set: { status: 'failed', error: error.message } });
        return { statusCode: 500, body: JSON.stringify({ error: `Failed to complete ${AGENT_NAME} run.` }) };
    }
};
