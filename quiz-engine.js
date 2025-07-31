// /quiz-engine.js

import { dot, norm } from './lib/math.js';
import { ThompsonSampling } from './lib/thompsonSampling.js';

// --- CONFIGURATION & STATE ---
const ALPHA = 0.6; // Balances TF-IDF and Semantic scores
const MAIN_CATEGORIES = [
    "Elektronik", "Tøj & Accessoirer", "Skønhed & Pleje", "Hjem & Indretning",
    "Køkken & Madlavning", "Oplevelser", "Hobby", "Bøger & Spil", "Børn & Baby"
];

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
let bandit; // The Thompson Sampling bandit instance

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
    // Initialize the Thompson Sampling bandit with our main categories
    bandit = new ThompsonSampling(MAIN_CATEGORIES);
    return selectNextQuestion();
}

// --- CORE SCORING & PRODUCT LOGIC ---
function cosineSimilarity(vecA, vecB) {
    if (!vecA || !vecB) return 0;
    const dotProduct = dot(vecA, vecB);
    const magnitudeA = norm(vecA);
    const magnitudeB = norm(vecB);
    if (magnitudeA === 0 || magnitudeB === 0) return 0;
    return dotProduct / (magnitudeA * magnitudeB);
}

export function getProductScores() {
    let eligibleProducts = [...allProducts];

    let recipientGender = null;
    let budget = null;
    userAnswers.forEach(answer => {
        const genderTag = answer.tags.find(t => t.startsWith('gender_'));
        if (genderTag) recipientGender = genderTag.split('_')[1];
        const budgetTag = answer.tags.find(t => t.startsWith('budget_'));
        if (budgetTag) budget = parseInt(budgetTag.split('_')[1], 10);
    });

    if (recipientGender) {
        eligibleProducts = eligibleProducts.filter(p => p.gender === recipientGender || p.gender === 'all');
    }
    if (budget !== null) {
        eligibleProducts = eligibleProducts.filter(p => p.price <= budget);
    }

    const allAnswerTags = userAnswers.flatMap(answer => answer.tags);
    if (allAnswerTags.length === 0) {
        return { scores: eligibleProducts.map(p => ({ id: p.id, score: 0 })), eligibleProductIds: eligibleProducts.map(p => p.id) };
    }

    const userInterestEmbeddings = allAnswerTags.map(tag => tagEmbeddings[tag]).filter(Boolean);
    let userEmbedding = new Array(384).fill(0);
    if (userInterestEmbeddings.length > 0) {
        userInterestEmbeddings.forEach(emb => emb.forEach((val, i) => userEmbedding[i] += val));
        userEmbedding = userEmbedding.map(v => v / userInterestEmbeddings.length);
    }

    const scores = eligibleProducts.map(product => {
        const productTags = new Set([...(product.tags || []), ...(product.differentiator_tags || [])]);
        let tfidfScore = 0;
        const userTagCounts = allAnswerTags.reduce((acc, tag) => { acc[tag] = (acc[tag] || 0) + 1; return acc; }, {});

        productTags.forEach(tag => {
            if (userTagCounts[tag]) {
                const tf = userTagCounts[tag];
                const idf = idfScores[tag] || 0;
                tfidfScore += tf * idf;
            }
        });

        const productEmbedding = productEmbeddings[product.id];
        const semanticScore = cosineSimilarity(userEmbedding, productEmbedding);
        const finalScore = (ALPHA * tfidfScore) + ((1 - ALPHA) * semanticScore);

        return { id: product.id, score: finalScore };
    });

    return {
        scores: scores.sort((a, b) => b.score - a.score),
        eligibleProductIds: eligibleProducts.map(p => p.id)
    };
}


// --- DYNAMIC QUESTION SELECTION & ANSWER HANDLING ---
export async function selectNextQuestion() {
    const { scores } = getProductScores();

    // End condition: If few products left or many questions asked, show results.
    if (scores.length <= 5 || questionHistory.length >= 8) {
        return { type: 'results', data: scores };
    }

    // Use the bandit to select the next category to explore
    const chosenCategory = bandit.selectArm();
    const potentialQuestions = allQuestions.filter(q =>
        q.category === chosenCategory && !questionHistory.some(h => h.id === q.id)
    );

    if (potentialQuestions.length > 0) {
        // For now, we just pick the first available question in the category
        currentQuestion = potentialQuestions[0];
    } else {
        // If no pre-written questions are left, fall back to any unasked question
        // In the future, this is where we would trigger a call to the AI.
        const anyUnasked = allQuestions.filter(q => !questionHistory.some(h => h.id === q.id));
        if (anyUnasked.length === 0) return { type: 'results', data: scores };
        currentQuestion = anyUnasked[0];
    }

    return { type: 'question', data: currentQuestion };
}

export async function handleAnswer(answer) {
    const { scores: scoresBefore } = getProductScores();
    const gapBefore = (scoresBefore[0]?.score || 0) - (scoresBefore[1]?.score || 0);

    const answerEntry = {
        question_text: currentQuestion.question_text,
        answer_text: answer.answer_text,
        tags: answer.tags || []
    };
    userAnswers.push(answerEntry);
    questionHistory.push(currentQuestion);

    const { scores: scoresAfter } = getProductScores();
    const gapAfter = (scoresAfter[0]?.score || 0) - (scoresAfter[1]?.score || 0);

    // REWARD: Did this question increase the score gap between the top 2 products?
    const reward = gapAfter > gapBefore ? 1 : 0;
    bandit.update(currentQuestion.category, reward);

    return selectNextQuestion();
}

export function goBackLogic() {
    if (questionHistory.length === 0) return { type: 'start' };

    userAnswers.pop();
    const lastQuestion = questionHistory.pop();
    currentQuestion = lastQuestion || allQuestions[0];

    return { type: 'question', data: currentQuestion };
}
