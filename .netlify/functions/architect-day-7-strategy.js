// netlify/functions/architect-day-7-strategy.js

const { connectToDatabase } = require('./utils/mongodb-client');
const { callAI } = require('./utils/ai-orchestrator');
const fs = require('fs').promises;
const path = require('path');

const AGENT_NAME = 'Day 7: Strategy & Analytics Agent';

// --- PROMPT HELPER ---
const getStrategySynthesisPrompt = (weeklyData) => {
    return `
You are the Chief Strategy Officer for denrettegave.dk. It is the end of the week, and you have been provided with all reports and data from your team of autonomous agents. Your sole task is to synthesize this information into a single, comprehensive strategic plan for the upcoming week.

**Weekly Data Dossier:**
${JSON.stringify(weeklyData, null, 2)}

**Your Task:**
Produce a final strategic report in JSON format. The report must contain:
1.  **summary:** A concise, high-level summary of the week's performance, key findings, and the main strategic focus for the next week.
2.  **enrichment_tasks:** A list of specific tasks for the Day 3 agent. This should include data corrections, tag enrichment suggestions, and products needing metadata updates.
3.  **deep_dive_tasks:** An object containing the product IDs assigned to the Day 5 and Day 6 agents for deep-dive analysis next week, based on the triage of urgent, scheduled, and anomalous products.
4.  **content_strategy_directives:** High-level guidance for the Day 2 SEO agent (e.g., "Focus on products in the 'outdoor' category due to high seasonal engagement").
5.  **simulation_focus:** A directive for the Day 6 Simulation agent (e.g., "Focus simulations on user personas with low budgets to test our value-oriented question paths").

**CRITICAL: Your output must be ONLY the structured JSON object containing these five keys.**
`;
};


// --- MAIN HANDLER ---
exports.handler = async (event) => {
    console.log(`Starting ${AGENT_NAME} run...`);

    try {
        // --- 1. Gather Intelligence ---
        const db = await connectToDatabase();
        const reportsCollection = db.collection('strategic_reports');
        const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

        // Fetch all relevant reports from the past week
        const [day4Report, day5Briefing, day6Report, productCatalog] = await Promise.all([
            reportsCollection.findOne({ agent: 'Day 4: Catalog Gap Analysis Agent', createdAt: { $gte: oneWeekAgo } }),
            db.collection('human_review_briefings').findOne({ agent: 'Day 5: Human Review & Maintenance Agent', createdAt: { $gte: oneWeekAgo } }),
            reportsCollection.findOne({ agent: 'Day 6: Simulation & A/B Testing Agent', createdAt: { $gte: oneWeekAgo } }),
            fs.readFile(path.resolve('assets/products.json'), 'utf-8').then(JSON.parse)
        ]);

        // --- 2. Perform Triage for Next Week's Deep Dives (Lightweight Logic) ---
        // This is a simplified triage. A full implementation would use real analytics data.
        const allProductIds = productCatalog.map(p => p.id);
        const productsToReview = allProductIds.slice(0, 20); // Placeholder: Select first 20 products for rotation
        const deep_dive_tasks = {
            day5: productsToReview.slice(0, 10), // Assign first 10 to Day 5
            day6: productsToReview.slice(10, 20) // Assign next 10 to Day 6
        };

        const weeklyData = {
            day4_gap_analysis: day4Report,
            day5_human_briefing: day5Briefing,
            day6_simulation_report: day6Report,
            next_week_triage: deep_dive_tasks
        };

        // --- 3. Delegate to the Engine for Synthesis ---
        const prompt = getStrategySynthesisPrompt(weeklyData);
        const estimated_cost = 15000; // High estimate for synthesizing all weekly data

        const aiResponse = await callAI({
            model: 'gpt-o3',
            prompt: prompt,
            agent_name: AGENT_NAME,
            estimated_cost: estimated_cost,
            response_format: { type: "json_object" }
        });

        const finalReport = JSON.parse(aiResponse);

        // --- 4. Store the Final Strategic Report for the New Week ---
        await reportsCollection.insertOne({
            agent: AGENT_NAME,
            ...finalReport, // Spread the AI's response to populate the document
            createdAt: new Date()
        });

        console.log("Successfully generated and stored the new weekly strategic plan.");
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
