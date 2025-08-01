// /quiz-engine.js

import { ThompsonSampling } from './lib/thompsonSampling.ts';

// --- CONFIGURATION & STATE ---
let allProducts = [];
let allQuestions = [];
let interests = [];

// Quiz state
let userProfile = {
    filters: {}, // For hard filters like gender, budget
    answers: [], // Log of all answers given
};
let questionHistory = [];
let bandit; // The Thompson Sampling bandit instance for categories
let topLevelCategories = [];

// Pronoun map for personalization
const pronounMap = {
    mand: { pronoun1: 'han', pronoun2: 'ham', pronoun3: 'hans' },
    kvinde: { pronoun1: 'hun', pronoun2: 'hende', pronoun3: 'hendes' },
    alle: { pronoun1: 'de', pronoun2: 'dem', pronoun3: 'deres' },
};

// --- INITIALIZATION ---
export async function initializeQuizAssets() {
    try {
        const [productsRes, questionsRes, interestsRes] = await Promise.all([
            fetch('assets/products.json'),
            fetch('assets/questions.json'),
            fetch('assets/interests.json')
        ]);
        allProducts = await productsRes.json();
        allQuestions = await questionsRes.json();
        interests = await interestsRes.json();
        topLevelCategories = interests.filter(i => !i.parents || i.parents.length === 0).map(i => i.key);
        return true;
    } catch (error) {
        console.error("Failed to load quiz assets:", error);
        throw error;
    }
}

export function resetQuizState() {
    userProfile = { filters: {}, answers: [] };
    questionHistory = [];
    bandit = new ThompsonSampling(topLevelCategories);
    return getNextQuestion();
}

// --- CORE SCORING & PRODUCT LOGIC ---

function applyHardFilters(products) {
    let filtered = [...products];
    const { gender, budget, age } = userProfile.filters;

    if (gender) {
        filtered = filtered.filter(p => p.context.gender === gender || p.context.gender === 'alle');
    }
    if (age) {
        filtered = filtered.filter(p => p.context.age && p.context.age.includes(age));
    }
    if (budget) {
        // Assuming budget is a category like 'billig', 'mellem', 'dyr'
        // This logic will need to be refined based on strict/flexible price filtering.
        const priceLimits = { billig: 200, mellem: 500, dyr: Infinity };
        const maxPrice = priceLimits[budget];
        if (maxPrice) {
            filtered = filtered.filter(p => p.context.price <= maxPrice);
        }
    }
    return filtered;
}

export function getProductScores() {
    const eligibleProducts = applyHardFilters(allProducts);
    const interestTags = userProfile.answers.flatMap(a => a.tags);

    if (interestTags.length === 0) {
        return eligibleProducts.map(p => ({ id: p.id, score: 1 })); // Start with a base score
    }

    const scores = eligibleProducts.map(product => {
        let score = 1;
        interestTags.forEach(tag => {
            if (product.tags.includes(tag)) {
                // This is a simplified scoring model. We will replace this with
                // the TF-IDF + Semantic Similarity model in the next phase.
                score += 10;
            }
        });
        return { id: product.id, score };
    });

    return scores.sort((a, b) => b.score - a.score);
}

// --- DYNAMIC QUESTION SELECTION & ANSWER HANDLING ---

function findQuestionById(id) {
    return allQuestions.find(q => q.question_id === id);
}

function personalizeQuestionText(text) {
    const gender = userProfile.filters.gender || 'alle';
    const pronouns = pronounMap[gender];
    if (!pronouns) return text;

    return text
        .replace(/{{pronoun1}}/g, pronouns.pronoun1)
        .replace(/{{pronoun2}}/g, pronouns.pronoun2)
        .replace(/{{pronoun3}}/g, pronouns.pronoun3);
}

export function getNextQuestion() {
    // This function will contain the full TS-C logic.
    // For now, it will use a simplified logic.

    // 1. Find initial, unanswered questions first
    const initialQuestions = allQuestions.filter(q => q.is_initial && !questionHistory.includes(q.question_id));
    if (initialQuestions.length > 0) {
        const nextQ = initialQuestions[0];
        return { type: 'question', data: formatQuestionForDisplay(nextQ) };
    }

    // Placeholder for the "Interests Hub"
    if (!userProfile.answers.some(a => a.question_id === 'interest_hub')) {
         return { type: 'interest_hub', data: { question_text: "Hvad interesserer personen sig for?" }};
    }

    // Placeholder for AI question logic
    // const scores = getProductScores();
    // if (we need an AI question) {
    //   return { type: 'loading_ai' } -> then call serverless function
    // }

    // If no more questions, show results
    return { type: 'results', data: getProductScores() };
}

function formatQuestionForDisplay(question) {
    if (!question) return null;
    questionHistory.push(question.question_id);
    
    // Choose a random phrasing and personalize it
    const phrasing = question.phrasings[Math.floor(Math.random() * question.phrasings.length)];
    const personalizedText = personalizeQuestionText(phrasing);

    return {
        ...question,
        question_text: personalizedText, // Overwrite with the chosen, personalized phrasing
    };
}


export function handleAnswer(question, answer) {
    // Store hard filters separately
    if (question.is_initial) {
        const key = question.key; // e.g., 'gender'
        const value = answer.tags[0].split(':')[1]; // e.g., 'mand'
        userProfile.filters[key] = value;
    } else {
         userProfile.answers.push({
            question_id: question.question_id,
            tags: answer.tags
        });
    }
    
    // In a full implementation, we would update the bandit here based on reward
    // bandit.update(chosenCategory, reward);

    return getNextQuestion();
}

export function goBackLogic() {
    if (questionHistory.length === 0) return { type: 'start' };

    const lastQuestionId = questionHistory.pop();
    // Find the answer that corresponds to the last question and remove it
    const answerIndex = userProfile.answers.findIndex(a => a.question_id === lastQuestionId);
    if (answerIndex > -1) {
        userProfile.answers.splice(answerIndex, 1);
    }
    
    // Also remove from filters if it was an initial question
    const lastQuestion = allQuestions.find(q => q.question_id === lastQuestionId);
    if (lastQuestion && lastQuestion.is_initial) {
        delete userProfile.filters[lastQuestion.key];
    }

    return { type: 'question', data: formatQuestionForDisplay(lastQuestion) };
}
