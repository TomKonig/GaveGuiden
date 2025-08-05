// netlify/functions/architect-day-4-gap-analysis.js

const fs = require('fs').promises;
const path = require('path');
const { connectToDatabase } = require('./utils/mongodb-client');
const { callAI } = require('./utils/ai-orchestrator');

// --- CONFIGURATION ---
const PRODUCTS_FILE_PATH = 'assets/products.json';
const INTERESTS_FILE_PATH = 'assets/interests.json';
const AGENT_NAME = 'Day 4: Catalog Gap Analysis Agent';

// --- PROMPT HELPERS ---

const getGapAnalysisPrompt = (productCatalog, interestsTree, strategicFeedback) => {
    return `
You are an expert e-commerce strategist for denrettegave.dk. Your sole task is to perform a detailed catalog gap analysis.

Based on the provided product catalog, interest hierarchy, and last week's strategic feedback, provide a written report that identifies key gaps and opportunities in our product offerings.

Your report should cover:
-   Which high-level categories are sparse or have low product diversity?
-   Are there popular sub-interests with very few corresponding products?
-   Suggest 3-5 specific product types or niche categories we should consider adding to improve our catalog depth and better serve user interests.

**DATA PROVIDED:**
Strategic Feedback: "${strategicFeedback}"
Full Product Catalog:
${JSON.stringify(productCatalog, null, 2)}
Full Interest Tree:
${JSON.stringify(interestsTree, null, 2)}

**CRITICAL: Your output must be a single JSON object in this exact format: { "gap_analysis_report": "..." }**
`;
};

const getContentReviewPrompt = (contentForReview) => {
    return `
You are an expert content editor and SEO analyst for denrettegave.dk. Your sole task is to review a list of recently generated blog posts.

For EACH post provided below, provide a quality score (1-10) and a brief, constructive justification based on:
-   Readability, engagement, and tone.
-   Effective use of SEO (headings, keyword placement).
-   Natural and strategic integration of the featured products and their alternatives.

**Content for Review:**
${JSON.stringify(contentForReview, null, 2)}

**CRITICAL: Your final output must be a single JSON object in this exact format: { "content_scores": [ { "product_id": "...", "blog_title": "...", "score": X, "justification": "..." } ] }**
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

        const latestReport = await reportsCollection.findOne({ agent: 'Day 7: Strategy & Analytics Agent' }, { sort: { createdAt: -1 } });
        const strategicFeedback = latestReport ? latestReport.summary : "No specific feedback this week.";

        // --- 2. Step 1: Perform Gap Analysis ---
        console.log("Step 1: Performing catalog gap analysis...");
        const gapAnalysisPrompt = getGapAnalysisPrompt(productCatalog, interests, strategicFeedback);
        const gapAnalysisResponse = await callAI({
            model: 'gpt-o3',
            prompt: gapAnalysisPrompt,
            agent_name: AGENT_NAME,
            estimated_cost: 4000,
            response_format: { type: "json_object" }
        });
        const { gap_analysis_report } = JSON.parse(gapAnalysisResponse);

        // --- 3. Step 2: Perform Content Review ---
        const contentForReview = await contentPipelineCollection.find({ status: 'needs_media' }).toArray();
        let content_scores = [];

        if (contentForReview.length > 0) {
            console.log("Step 2: Performing content review...");
            const contentReviewPrompt = getContentReviewPrompt(contentForReview);
            const contentReviewResponse = await callAI({
                model: 'gpt-o3',
                prompt: contentReviewPrompt,
                agent_name: AGENT_NAME,
                estimated_cost: 4000,
                response_format: { type: "json_object" }
            });
            content_scores = JSON.parse(contentReviewResponse).content_scores;
        } else {
            console.log("No new content to review.");
        }

        // --- 4. Store the Combined Report ---
        await reportsCollection.insertOne({
            agent: AGENT_NAME,
            summary: gap_analysis_report,
            details: {
                content_scores: content_scores,
            },
            createdAt: new Date()
        });

        console.log("Successfully generated and stored combined analysis report.");
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
