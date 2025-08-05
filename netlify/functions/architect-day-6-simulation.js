// netlify/functions/architect-day-6-simulation.js

const { connectToDatabase } = require('./utils/mongodb-client');
const { callAI } = require('./utils/ai-orchestrator');
// We will need a local copy of the quiz engine logic to run simulations
// This is a placeholder for now until we structure the shared library.
const { runQuizSimulation } = require('./utils/simulation-engine'); 

const AGENT_NAME = 'Day 6: Simulation & A/B Testing Agent';

// --- PROMPT HELPERS ---

const getPersonaGenerationPrompt = (interests, productCatalog) => {
    return `
You are a master market researcher and user persona generator. Your task is to create 500 diverse user personas to test a gift-finding quiz.

The personas must be varied and cover a wide range of potential users. Use the provided interest and product data to ensure the personas are grounded in the types of gifts we offer.

Generate personas with different:
-   **Initial Filters:** Combinations of gender, age, budget, occasion.
-   **Interest Profiles:** Some users know exactly what they want (e.g., "smartwatch"), while others have only vague interests (e.g., "something for the home"). Some will have multiple, conflicting interests.
-   **Goals:** Some are looking for a highly personal gift, others for something practical.

**DATA PROVIDED:**
Full Interest Hierarchy:
${JSON.stringify(interests, null, 2)}
Full Product Catalog:
${JSON.stringify(productCatalog, null, 2)}

**CRITICAL: Your output must be a single JSON object with a key "personas" containing an array of 500 persona objects. Each object must have this format: { "persona_id": "...", "initial_filters": { "gender": "...", "budget": "..." }, "interests": ["...", "..."], "goal_description": "..." }**
`;
};

const getReportSynthesisPrompt = (simulationResults) => {
    return `
You are a senior data scientist. You have just run a large-scale simulation of a gift-finding quiz with 500 virtual users. Your task is to analyze the raw results and synthesize them into a concise, insightful performance report.

**Raw Simulation Data:**
${JSON.stringify(simulationResults, null, 2)}

**Your Report Must Cover:**
-   **Quiz Efficiency:** What was the average number of questions asked? Were there any dead-end paths where users frequently bailed?
-   **Niche Product Performance:** How often were products from the "long tail" (less popular items) recommended and clicked?
-   **Funnel Analysis:** Where in the quiz funnel did most users drop off or get the most relevant recommendations?
-   **Key Findings:** What are the top 3-5 most important, actionable insights from this simulation?

**CRITICAL: Your output must be a single JSON object in this format: { "simulation_summary": "...", "key_findings": ["...", "..."] }**
`;
};


// --- MAIN HANDLER ---
exports.handler = async (event) => {
    console.log(`Starting ${AGENT_NAME} run...`);

    try {
        // --- 1. Gather Intelligence ---
        const db = await connectToDatabase();
        const reportsCollection = db.collection('strategic_reports');
        const [productCatalog, interests, questions] = await Promise.all([
            fs.readFile(path.resolve('assets/products.json'), 'utf-8').then(JSON.parse),
            fs.readFile(path.resolve('assets/interests.json'), 'utf-8').then(JSON.parse),
            fs.readFile(path.resolve('assets/questions.json'), 'utf-8').then(JSON.parse)
        ]);

        // --- 2. Step 1: Generate User Personas (GPT) ---
        console.log("Step 1: Generating user personas...");
        const personaPrompt = getPersonaGenerationPrompt(interests, productCatalog);
        const personaResponse = await callAI({
            model: 'gpt-o3',
            prompt: personaPrompt,
            agent_name: AGENT_NAME,
            estimated_cost: 20000, // High cost for generating many personas
            response_format: { type: "json_object" }
        });
        const { personas } = JSON.parse(personaResponse);

        // --- 3. Step 2: Run Simulations (Local) ---
        console.log("Step 2: Running simulations...");
        const simulationResults = [];
        for (const persona of personas) {
            // This is a local function that runs our quiz logic against a persona.
            // It will return a log of the simulated user's journey and final recommendations.
            const result = await runQuizSimulation({ persona, questions, interests, productCatalog });
            simulationResults.push(result);
        }

        // --- 4. Step 3: Synthesize Performance Report (GPT) ---
        console.log("Step 3: Synthesizing performance report...");
        const reportPrompt = getReportSynthesisPrompt(simulationResults);
        const reportResponse = await callAI({
            model: 'gpt-o3',
            prompt: reportPrompt,
            agent_name: AGENT_NAME,
            estimated_cost: 10000,
            response_format: { type: "json_object" }
        });
        const { simulation_summary, key_findings } = JSON.parse(reportResponse);

        // --- 5. Store the Report ---
        await reportsCollection.insertOne({
            agent: AGENT_NAME,
            summary: simulation_summary,
            details: {
                key_findings: key_findings,
                raw_simulation_data: simulationResults // Store raw data for deeper analysis if needed
            },
            createdAt: new Date()
        });
        
        console.log("Successfully generated and stored simulation report.");
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
