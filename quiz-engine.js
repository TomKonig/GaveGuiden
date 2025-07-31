// /quiz-engine.js

import { dot, norm } from './lib/math.js'; // Using the mathjs library we installed

// --- CONFIGURATION & STATE ---
const ALPHA = 0.6; // Balances TF-IDF and Semantic scores [cite: 172]

// Data stores
let allProducts = [];
let allQuestions = [];
let idfScores = {};
let productEmbeddings = {};
let tagEmbeddings = {};

// Quiz state
let remainingProducts = [];
let questionHistory = [];
let userAnswers = [];
let currentQuestion = null;
let isQuizInitialized = false;

// --- INITIALIZATION ---
export async function initializeQuizAssets() {
    if (isQuizInitialized) return;
    try {
        const [productsRes, questionsRes, idfRes, prodEmbRes, tagEmbRes] = await Promise.all([
            fetch('assets/products.json'),
            fetch('assets/questions.json'),
            fetch('assets/idf_scores.json'),
            fetch('assets/product_embeddings.json'),
            fetch('assets/tag_embeddings.json')
        ]);

        allProducts = await productsRes.json();
        allQuestions = await questionsRes.json();
        idfScores = await idfRes.json();

        // Convert embedding arrays to maps for faster lookup
        const productEmbeddingsList = await prodEmbRes.json();
        productEmbeddings = productEmbeddingsList.reduce((acc, item) => {
            acc[item.id] = item.embedding;
            return acc;
        }, {});

        const tagEmbeddingsList = await tagEmbRes.json();
        tagEmbeddings = tagEmbeddingsList.reduce((acc, item) => {
            acc[item.id] = item.embedding;
            return acc;
        }, {});

        isQuizInitialized = true;
    } catch (error) {
        console.error("Failed to load quiz assets:", error);
        throw error;
    }
}

export function resetQuizState() {
    remainingProducts = [...allProducts];
    questionHistory = [];
    userAnswers = [];
    currentQuestion = null;
    return selectNextQuestion();
}

// --- CORE SCORING & PRODUCT LOGIC ---

/**
 * Calculates the cosine similarity between two vectors.
 * @param {number[]} vecA - The first vector.
 * @param {number[]} vecB - The second vector.
 * @returns {number} The cosine similarity score (0 to 1).
 */
function cosineSimilarity(vecA, vecB) {
    if (!vecA || !vecB) return 0;
    const dotProduct = dot(vecA, vecB);
    const magnitudeA = norm(vecA);
    const magnitudeB = norm(vecB);
    if (magnitudeA === 0 || magnitudeB === 0) return 0;
    return dotProduct / (magnitudeA * magnitudeB); // [cite: 390]
}

export function getProductScores() {
    const allAnswerTags = userAnswers.flatMap(answer => answer.tags);
    if (allAnswerTags.length === 0) {
        return remainingProducts.map(p => ({ id: p.id, score: 0 }));
    }

    // 1. Calculate the user's semantic profile embedding by averaging their selected tags' embeddings [cite: 166]
    const userInterestEmbeddings = allAnswerTags
        .map(tag => tagEmbeddings[tag])
        .filter(Boolean);

    let userEmbedding = new Array(384).fill(0);
    if (userInterestEmbeddings.length > 0) {
        userInterestEmbeddings.forEach(emb => {
            emb.forEach((val, i) => userEmbedding[i] += val);
        });
        userEmbedding = userEmbedding.map(v => v / userInterestEmbeddings.length); // Averaging
    }

    // 2. Calculate scores for each product
    const scores = remainingProducts.map(product => {
        const productTags = new Set([...(product.tags || []), ...(product.differentiator_tags || [])]);

        // 2a. Calculate TF-IDF Score
        let tfidfScore = 0;
        const userTagCounts = allAnswerTags.reduce((acc, tag) => {
            acc[tag] = (acc[tag] || 0) + 1;
            return acc;
        }, {});

        productTags.forEach(tag => {
            if (userTagCounts[tag]) {
                const tf = userTagCounts[tag]; // Term Frequency
                const idf = idfScores[tag] || 0; // Inverse Document Frequency (fallback to 0)
                tfidfScore += tf * idf;
            }
        });

        // 2b. Calculate Semantic Similarity Score
        const productEmbedding = productEmbeddings[product.id];
        const semanticScore = cosineSimilarity(userEmbedding, productEmbedding); // 

        // 2c. Combine into Hybrid Score using alpha 
        const finalScore = (ALPHA * tfidfScore) + ((1 - ALPHA) * semanticScore);
        
        return { id: product.id, score: finalScore };
    });

    return scores.sort((a, b) => b.score - a.score);
}

// --- QUESTION SELECTION & ANSWER HANDLING (Simplified for now) ---
// Note: We will replace this with the Multi-Armed Bandit logic in Phase 3.
export async function selectNextQuestion() {
    const unaskedInitial = allQuestions.filter(q => q.is_initial && !questionHistory.some(h => h.id === q.id));

    if (unaskedInitial.length > 0) {
        currentQuestion = unaskedInitial[0];
        return { type: 'question', data: currentQuestion };
    }

    // If initial questions are done, show results.
    const scores = getProductScores();
    return { type: 'results', data: scores };
}

export function handleAnswer(answer) {
    const answerEntry = {
        question_text: currentQuestion.question_text,
        answer_text: answer.answer_text,
        tags: answer.tags || []
    };
    userAnswers.push(answerEntry);
    questionHistory.push(currentQuestion);
    return selectNextQuestion();
}

export function goBackLogic() {
    if (questionHistory.length === 0) return { type: 'start' };
    
    userAnswers.pop();
    const lastQuestion = questionHistory.pop();
    
    // Find the question before the last one to display it again
    currentQuestion = questionHistory.length > 0 ? questionHistory[questionHistory.length -1] : allQuestions[0];
    
    // This is a simplified back logic. We will refine this.
    return { type: 'question', data: currentQuestion };
}
