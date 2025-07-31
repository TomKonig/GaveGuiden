// /quiz-engine.js

import { dot, norm } from './lib/math.js';

// --- CONFIGURATION & STATE ---
const ALPHA = 0.6; // Balances TF-IDF and Semantic scores

// Data stores
let allProducts = [];
let allQuestions = [];
let idfScores = {};
let productEmbeddings = {};
let tagEmbeddings = {};

// Quiz state
let userAnswers = [];
let questionHistory = [];
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
    return dotProduct / (magnitudeA * magnitudeB);
}

export function getProductScores() {
    // --- PRE-FILTERING ---
    let eligibleProducts = [...allProducts];

    // 1. Find gender and budget from answers
    let recipientGender = null;
    let budget = null;
    userAnswers.forEach(answer => {
        const genderTag = answer.tags.find(t => t.startsWith('gender_'));
        if (genderTag) {
            recipientGender = genderTag.split('_')[1]; // e.g., 'man' or 'woman'
        }
        const budgetTag = answer.tags.find(t => t.startsWith('budget_'));
        if (budgetTag) {
            budget = parseInt(budgetTag.split('_')[1], 10); // e.g., 500 or 1000
        }
    });

    // 2. Apply Gender Filter based on exclusivity
    if (recipientGender) {
        eligibleProducts = eligibleProducts.filter(p => {
            return p.gender === recipientGender || p.gender === 'all';
        });
    }

    // 3. Apply Budget Filter (Hard Ceiling)
    if (budget !== null) {
        eligibleProducts = eligibleProducts.filter(p => p.price <= budget);
    }
    // --- END PRE-FILTERING ---


    const allAnswerTags = userAnswers.flatMap(answer => answer.tags);
    if (allAnswerTags.length === 0) {
        return eligibleProducts.map(p => ({ id: p.id, score: 0 }));
    }

    // Calculate the user's semantic profile embedding
    const userInterestEmbeddings = allAnswerTags
        .map(tag => tagEmbeddings[tag])
        .filter(Boolean);

    let userEmbedding = new Array(384).fill(0);
    if (userInterestEmbeddings.length > 0) {
        userInterestEmbeddings.forEach(emb => {
            emb.forEach((val, i) => userEmbedding[i] += val);
        });
        userEmbedding = userEmbedding.map(v => v / userInterestEmbeddings.length);
    }

    // Calculate scores for each *eligible* product
    const scores = eligibleProducts.map(product => {
        const productTags = new Set([...(product.tags || []), ...(product.differentiator_tags || [])]);

        // Calculate TF-IDF Score
        let tfidfScore = 0;
        const userTagCounts = allAnswerTags.reduce((acc, tag) => {
            acc[tag] = (acc[tag] || 0) + 1;
            return acc;
        }, {});

        productTags.forEach(tag => {
            if (userTagCounts[tag]) {
                const tf = userTagCounts[tag];
                const idf = idfScores[tag] || 0;
                tfidfScore += tf * idf;
            }
        });

        // Calculate Semantic Similarity Score
        const productEmbedding = productEmbeddings[product.id];
        const semanticScore = cosineSimilarity(userEmbedding, productEmbedding);

        // Combine into Hybrid Score
        const finalScore = (ALPHA * tfidfScore) + ((1 - ALPHA) * semanticScore);
        
        return { id: product.id, score: finalScore };
    });

    return scores.sort((a, b) => b.score - a.score);
}

// --- QUESTION SELECTION & ANSWER HANDLING (Simplified for Phase 2) ---
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
    
    currentQuestion = lastQuestion || allQuestions[0];
    
    return { type: 'question', data: currentQuestion };
}
