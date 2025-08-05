// netlify/functions/architect-day-5-maintenance.js

const fs = require('fs').promises;
const path = require('path');
const { Octokit } = require('@octokit/rest');
const { connectToDatabase } = require('./utils/mongodb-client');
const { callAI } = require('./utils/ai-orchestrator');

// --- CONFIGURATION ---
const GITHUB_OWNER = 'TomKonig';
const GITHUB_REPO = 'GaveGuiden';
const PRODUCTS_FILE_PATH = 'assets/products.json';
const AGENT_NAME = 'Day 5: Human Review & Maintenance Agent';

// --- PROMPT HELPERS ---

const getMaintenancePrompt = (errorLogs) => {
    return `
You are an autonomous maintenance agent. Your task is to investigate and propose solutions for a list of logged errors. Use your web search capabilities extensively.

**Logged Errors for Investigation:**
${JSON.stringify(errorLogs, null, 2)}

**Instructions:**
For each error, investigate the root cause.
-   If it's a broken image URL, find the correct, publicly accessible URL for the product.
-   If it's a potential price discrepancy, visit the product's retail URL and find the current price.
-   If an affiliate link seems broken, verify the link structure.

**CRITICAL: Your output must be a single JSON object with a key "solutions" containing an array. Each item in the array should have this format: { "log_id": "...", "status": "solved/unsolved", "solution": "...", "details": "..." }**
-   For "solved" issues, the "solution" should be a concrete, actionable fix (e.g., a new URL, a new price).
-   For "unsolved" issues, the "details" should explain why it could not be solved.
`;
};

const getDeepDiveResearchPrompt = (product) => {
    return `
You are a research assistant. Perform a deep-dive analysis on the following product using web search.

**Product:** ${product.name}
**URL:** ${product.url}

**Research Goals:**
1.  **Market Positioning:** Identify its main competitors. What are its unique selling points?
2.  **Consumer Sentiment:** Summarize recent user reviews or social media mentions.
3.  **Cultural Relevance:** Are there any current trends, news, or events that make this product more or less relevant right now?

**CRITICAL: Your output must be a concise, well-structured summary of your findings in markdown format.**
`;
};

const getBriefingSynthesisPrompt = (maintenanceReport, deepDiveReports, contentNeedingMedia) => {
    return `
You are a senior project manager. Your task is to synthesize reports from multiple autonomous agents into a single, clear, human-readable weekly briefing for your manager.

**1. Maintenance & Error Report:**
(This section details both solved and unsolved issues from the maintenance agent)
${JSON.stringify(maintenanceReport, null, 2)}

**2. Deep-Dive Analysis Summaries:**
(This section contains research summaries for a selection of products)
${JSON.stringify(deepDiveReports, null, 2)}

**3. Content Awaiting Media:**
(This is a list of blog posts ready for images/videos)
${JSON.stringify(contentNeedingMedia, null, 2)}

**Your Task:**
Write a comprehensive but concise weekly briefing in markdown format. The briefing must have three sections:
-   **"Action Required":** A clear, bulleted list of tasks for the manager (e.g., "Review unsolved error for product X," "Add media to 3 new blog posts").
-   **"Autonomous Actions Taken":** A summary of the maintenance tasks that were successfully solved automatically (e.g., "Updated prices for 2 products, fixed 1 broken image URL").
-   **"Strategic Insights":** A high-level summary of the key findings from this week's deep-dive product analyses.
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
        const agentLogsCollection = db.collection('agent_logs');
        const briefingCollection = db.collection('human_review_briefings');
        
        const productCatalog = await fs.readFile(path.resolve(PRODUCTS_FILE_PATH), 'utf-8').then(JSON.parse);
        const latestReport = await reportsCollection.findOne({ agent: 'Day 7: Strategy & Analytics Agent' }, { sort: { createdAt: -1 } });
        const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const errorLogs = await agentLogsCollection.find({ level: 'error', timestamp: { $gte: oneWeekAgo } }).toArray();

        // --- 2. Part 1: Autonomous Maintenance (Gemini) ---
        console.log("Step 1: Running autonomous maintenance...");
        const maintenancePrompt = getMaintenancePrompt(errorLogs);
        const maintenanceResponse = await callAI({
            model: 'gemini-2.5-flash',
            prompt: maintenancePrompt,
            agent_name: AGENT_NAME
        });
        const maintenanceReport = JSON.parse(maintenanceResponse);

        // (In a full implementation, we would now attempt to apply the "solved" fixes from the report)

        // --- 3. Part 2: Distributed Deep-Dive (GPT + Gemini) ---
        console.log("Step 2: Running distributed deep-dive analysis...");
        const deepDiveTasks = latestReport ? latestReport.deep_dive_tasks.day5 : [];
        const deepDiveReports = [];
        for (const task of deepDiveTasks) {
            const product = productCatalog.find(p => p.id === task.product_id);
            if (!product) continue;

            // Using Gemini directly for research as it's a pure research task
            const researchPrompt = getDeepDiveResearchPrompt(product);
            const researchSummary = await callAI({
                model: 'gemini-2.5-flash',
                prompt: researchPrompt,
                agent_name: AGENT_NAME
            });
            deepDiveReports.push({ product_id: product.id, product_name: product.name, summary: researchSummary });
        }

        // --- 4. Part 3: Final Briefing Synthesis (GPT) ---
        console.log("Step 3: Synthesizing final briefing...");
        const contentNeedingMedia = await contentPipelineCollection.find({ status: 'needs_media' }).toArray();
        const briefingPrompt = getBriefingSynthesisPrompt(maintenanceReport, deepDiveReports, contentNeedingMedia);
        
        const finalBriefing = await callAI({
            model: 'gpt-o3',
            prompt: briefingPrompt,
            agent_name: AGENT_NAME,
            estimated_cost: 5000
        });

        // --- 5. Store the Briefing for the Admin Panel ---
        await briefingCollection.insertOne({
            agent: AGENT_NAME,
            briefing_markdown: finalBriefing,
            createdAt: new Date()
        });

        console.log("Successfully generated and stored the weekly briefing.");
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
