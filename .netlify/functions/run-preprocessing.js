// netlify/functions/run-preprocessing.js

import { pipeline } from '@xenova/transformers';
import fs from 'fs/promises';
import path from 'path';

// --- Helper Functions ---

// Function to calculate Inverse Document Frequency (IDF)
const calculateIDF = (products) => {
    console.log("Calculating IDF scores...");
    const idf = {};
    const tagDocCount = {};
    const totalDocs = products.length;

    // Count how many products each tag appears in
    for (const product of products) {
        const uniqueTags = new Set(product.tags);
        for (const tag of uniqueTags) {
            tagDocCount[tag] = (tagDocCount[tag] || 0) + 1;
        }
    }

    // Calculate the IDF score for each tag
    for (const tag in tagDocCount) {
        idf[tag] = Math.log(totalDocs / (1 + tagDocCount[tag]));
    }
    console.log("IDF scores calculated successfully.");
    return idf;
};

// Function to generate embeddings using a pre-trained model
const generateEmbeddings = async (texts, model) => {
    console.log(`Generating embeddings for ${texts.length} items...`);
    const extractor = await pipeline('feature-extraction', model);
    const embeddings = [];
    for (let i = 0; i < texts.length; i++) {
        const text = texts[i];
        const output = await extractor(text, { pooling: 'mean', normalize: true });
        // Convert Float32Array to a standard array for JSON serialization
        embeddings.push(Array.from(output.data));
        // Log progress
        if ((i + 1) % 50 === 0 || i + 1 === texts.length) {
            console.log(`Processed ${i + 1} / ${texts.length} items.`);
        }
    }
    return embeddings;
};


// --- Main Serverless Function ---

export const handler = async (event, context) => {
    console.log("Starting pre-computation process...");

    try {
        const modelName = 'Xenova/all-MiniLM-L6-v2';

        // Define paths relative to the function's execution context
        const rootPath = path.resolve(process.cwd());
        const assetsPath = path.join(rootPath, 'public', 'assets');
        const productsPath = path.join(assetsPath, 'products.json');
        const interestsPath = path.join(assetsPath, 'interests.json');

        // Read source files
        console.log("Reading source files...");
        const productsData = await fs.readFile(productsPath, 'utf-8');
        const interestsData = await fs.readFile(interestsPath, 'utf-8');
        const products = JSON.parse(productsData);
        const interests = JSON.parse(interestsData);
        console.log(`Loaded ${products.length} products and ${interests.tags.length} tags.`);

        // --- 1. Calculate and Save IDF Scores ---
        const idfScores = calculateIDF(products);
        const idfOutputPath = path.join(assetsPath, 'idf_scores.json');
        await fs.writeFile(idfOutputPath, JSON.stringify(idfScores, null, 2));
        console.log(`IDF scores saved to ${idfOutputPath}`);

        // --- 2. Generate and Save Product Embeddings ---
        const productTexts = products.map(p => `${p.name}. ${p.description}`);
        const productEmbeddings = await generateEmbeddings(productTexts, modelName);
        const productEmbeddingsOutput = products.map((p, i) => ({
            id: p.id,
            embedding: productEmbeddings[i]
        }));
        const productEmbeddingsPath = path.join(assetsPath, 'product_embeddings.json');
        await fs.writeFile(productEmbeddingsPath, JSON.stringify(productEmbeddingsOutput, null, 2));
        console.log(`Product embeddings saved to ${productEmbeddingsPath}`);


        // --- 3. Generate and Save Tag Embeddings ---
        const tagTexts = interests.tags.map(t => t.name);
        const tagEmbeddings = await generateEmbeddings(tagTexts, modelName);
        const tagEmbeddingsOutput = interests.tags.map((t, i) => ({
            id: t.id,
            embedding: tagEmbeddings[i]
        }));
        const tagEmbeddingsPath = path.join(assetsPath, 'tag_embeddings.json');
        await fs.writeFile(tagEmbeddingsPath, JSON.stringify(tagEmbeddingsOutput, null, 2));
        console.log(`Tag embeddings saved to ${tagEmbeddingsPath}`);

        console.log("Pre-computation process completed successfully!");

        return {
            statusCode: 200,
            body: JSON.stringify({ message: "Pre-computation successful. New data files generated." }),
        };

    } catch (error) {
        console.error("An error occurred during pre-computation:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Failed to run pre-computation.", details: error.message }),
        };
    }
};
