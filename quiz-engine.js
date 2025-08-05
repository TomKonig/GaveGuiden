// /quiz-engine.js

import { ThompsonSampling } from './lib/thompsonSampling.js';

// --- CONFIGURATION & STATE ---
let allProducts = [];
let allQuestions = [];
let interests = [];
// Placeholders for pre-computed data. In a real app, these would be fetched.
let idfScores = {};
let productEmbeddings = {};
let tagEmbeddings = {};


// Quiz state
let userProfile = {
    filters: {}, // { gender: 'mand', budget: 'mellem' }
    interests: {}, // { 'sport': 2, 'elektronik': 1 } - Key: interest tag, Value: strength
    answers: [],
};
let questionHistory = [];
let categoryBandit; // Thompson Sampling for categories

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
        // In a real app, fetch idfScores, productEmbeddings etc. here
        return true;
    } catch (error) {
        console.error("Failed to load quiz assets:", error);
        return false;
    }
}

export function startQuiz(initialFilters, selectedInterests) {
    userProfile = {
        filters: initialFilters,
        interests: selectedInterests,
        answers: [],
    };
    questionHistory = [];
    const categoryKeys = Object.keys(selectedInterests);
    categoryBandit = new ThompsonSampling(categoryKeys.length, categoryKeys);
    return getNextQuestion();
}


// --- SCORING ENGINE ---

function applyHardFilters(products) {
    // This function remains the same as previously defined
    let filtered = [...products];
    const { gender, budget, age } = userProfile.filters;

    if (gender) {
        filtered = filtered.filter(p => p.context.gender === gender || p.context.gender === 'alle');
    }
    if (age) {
        filtered = filtered.filter(p => p.context.age && p.context.age.includes(age));
    }
    if (budget) {
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
    // This is where the final, sophisticated scoring model from the Theoretical Framework
    // will be fully implemented. For now, it uses a simplified interest-matching score.
    
    const scores = eligibleProducts.map(product => {
        let score = 0;
        for (const [interestTag, strength] of Object.entries(userProfile.interests)) {
            if (product.tags.includes(interestTag)) {
                // Simplified TF-IDF placeholder: score = strength * rarity
                const tf = strength;
                const idf = idfScores[interestTag] || 1; // Default IDF to 1 if not found
                score += tf * idf;
            }
        }
        return { id: product.id, name: product.name, score: score, url: product.url, description: product.description };
    });

    return scores.sort((a, b) => b.score - a.score);
}


// --- QUESTION ENGINE ---

function findQuestion(parentId = null) {
    const userContext = userProfile.filters;
    const matchingQuestions = allQuestions.filter(q => {
        // Match parent
        if (q.parent_answer_id !== parentId) return false;
        // Check if question has a context requirement
        if (q.context) {
            return Object.entries(q.context).every(([key, value]) => userContext[key] === value);
        }
        return true; // No context means it's generic
    });
    
    // Naive selection for now. Could be randomized or prioritized.
    return matchingQuestions.find(q => !questionHistory.includes(q.question_id));
}


function personalizeQuestionText(text) {
    const gender = userProfile.filters.gender || 'alle';
    const pronouns = pronounMap[gender];
    if (!pronouns) return text;
    return text.replace(/{{pronoun1}}/g, pronouns.pronoun1)
               .replace(/{{pronoun2}}/g, pronouns.pronoun2)
               .replace(/{{pronoun3}}/g, pronouns.pronoun3);
}

function formatQuestionForDisplay(question) {
    if (!question) return null;
    questionHistory.push(question.question_id);
    const phrasing = question.phrasings[Math.floor(Math.random() * question.phrasings.length)];
    const personalizedText = personalizeQuestionText(phrasing);
    return { ...question, question_text: personalizedText };
}


export function getNextQuestion() {
    // The "Tournament of Interests" using Thompson Sampling
    const winningCategoryKey = categoryBandit.selectArm();
    
    // Find a root question for the winning category that hasn't been asked
    const rootQuestion = findQuestion(null); // This needs to be smarter to pick from the winningCategory
    
    if (rootQuestion) {
        return { type: 'question', data: formatQuestionForDisplay(rootQuestion) };
    }

    // Placeholder for AI handoff logic
    // if (condition for AI is met) {
    //    return { type: 'loading_ai' };
    // }

    // If no more questions, show results
    console.log("No more questions, showing results.");
    return { type: 'results', data: getProductScores() };
}

export function handleAnswer(question, answer) {
    userProfile.answers.push({
        question_id: question.question_id,
        answer_id: answer.answer_id,
        tags: answer.tags
    });

    // Update user interests based on answer tags
    answer.tags.forEach(tag => {
        if (!tag.includes(':')) { // Exclude special tags like freetext
            userProfile.interests[tag] = (userProfile.interests[tag] || 0) + 1;
        }
    });

    // Update the bandit
    const reward = answer.tags.includes("freetext:true") ? 0 : 1;
    const categoryOfQuestion = interests.find(i => i.id === question.category)?.key; // Simplified
    if(categoryOfQuestion){
        categoryBandit.update(categoryOfQuestion, reward);
    }
    
    // Find the next question that follows from this answer
    const nextQ = findQuestion(answer.answer_id);
    if(nextQ) {
        return { type: 'question', data: formatQuestionForDisplay(nextQ) };
    }

    // If no child question, try to get another top-level question
    return getNextQuestion();
}
