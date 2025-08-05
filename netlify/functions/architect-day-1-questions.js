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
const getArchitectPrompt = (category, products, interestsTree, strategicFeedback) => {
    // ... (The master prompt we designed is unchanged)
    const productList = products.map(p => `- ${p.name}: ${p.description} (Tags: ${p.tags.join(', ')})`).join('\n');
    return `... [Full Master Prompt] ...`;
};

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
