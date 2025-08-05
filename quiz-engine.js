// /quiz-engine.js

import { ThompsonSampling } from './lib/thompsonSampling.js';
import { dot, norm } from 'mathjs';

// --- CONFIGURATION & STATE ---
let allProducts = [];
let allQuestions = [];
let interests = [];
// --- NEW: Pre-computed data for advanced scoring ---
let idfScores = {};
let productEmbeddings = {};
let tagEmbeddings = {};

const ALPHA = 0.6; // Balances TF-IDF (precision) vs. Semantic (recall)

// Quiz state
let userProfile = {
    filters: {},
    interests: {}, // e.g., { 'sport': 2, 'fodbold': 3 }
    answers: [],
};
let questionHistory = [];
let currentQuestion = null;
let categoryBandit;

const pronounMap = {
    mand: { pronoun1: 'han', pronoun2: 'ham', pronoun3: 'hans' },
    kvinde: { pronoun1: 'hun', pronoun2: 'hende', pronoun3: 'hendes' },
    alle: { pronoun1: 'de', pronoun2: 'dem', pronoun3: 'deres' }
        }

// --- INITIALIZATION ---
export async function initializeQuizAssets() {
    try {
        const [productsRes, questionsRes, interestsRes, idfRes, pEmbRes, tEmbRes] = await Promise.all([
            fetch('assets/products.json'),
            fetch('assets/questions.json'),
            fetch('assets/interests.json'),
            fetch('assets/idf_scores.json'),
            fetch('assets/product_embeddings.json'),
            fetch('assets/tag_embeddings.json')
        ]);
        allProducts = await productsRes.json();
        allQuestions = await questionsRes.json();
        interests = await interestsRes.json();
        idfScores = await idfRes.json();
        productEmbeddings = await pEmbRes.json();
        tagEmbeddings = await tEmbRes.json();
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
    const topLevelCategories = interests.filter(i => !i.parents || i.parents.length === 0).map(i => i.key);
    const categoryKeys = Object.keys(selectedInterests).length > 0 ? Object.keys(selectedInterests) : topLevelCategories;
    categoryBandit = new ThompsonSampling(categoryKeys.length, categoryKeys);
    return getNextQuestion();
}

// --- HELPER FUNCTIONS ---
function cosineSimilarity(vecA, vecB) {
    if (!vecA || !vecB) return 0;
    return dot(vecA, vecB) / (norm(vecA) * norm(vecB));
}

// --- SCORING ENGINE ---

function applyHardFilters(products) {
    let filtered = [...products];
    const { gender, budget, age } = userProfile.filters;

    if (gender) {
        filtered = filtered.filter(p => !p.context.gender || p.context.gender === gender || p.context.gender === 'alle');
    }
    // ... other filter logic ...
    return filtered;
}

export function getProductScores() {
    const eligibleProducts = applyHardFilters(allProducts);

    // --- 1. Calculate User's Semantic Profile ---
    let userEmbedding = new Array(384).fill(0);
    const userInterestTags = Object.keys(userProfile.interests);
    if (userInterestTags.length > 0) {
        userInterestTags.forEach(tag => {
            const tagVector = tagEmbeddings[tag];
            if (tagVector) {
                tagVector.forEach((val, i) => userEmbedding[i] += val * userProfile.interests[tag]);
            }
        });
        userEmbedding = userEmbedding.map(v => v / userInterestTags.length);
    }

    const scores = eligibleProducts.map(product => {
        // --- 2. Calculate TF-IDF Score ---
        let tfidfScore = 0;
        product.tags.forEach(tag => {
            if (userProfile.interests[tag] && idfScores[tag]) {
                const tf = userProfile.interests[tag]; // Term Frequency
                const idf = idfScores[tag];             // Inverse Document Frequency
                tfidfScore += tf * idf;
            }
        });

        // --- 3. Calculate Semantic Similarity Score ---
        const productVector = productEmbeddings[product.id];
        const semanticScore = cosineSimilarity(userEmbedding, productVector);

        // --- 4. Combine into Final Hybrid Score ---
        const finalScore = (ALPHA * tfidfScore) + ((1 - ALPHA) * semanticScore);

        return { ...product, score: finalScore };
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
    // This is the "Tournament of Interests" using Thompson Sampling
    const winningCategoryKey = categoryBandit.selectArm();
    
    // This logic needs to be smarter to find a relevant, unanswered question
    // for the winning category. For now, we'll use a simplified approach.
    const nextQ = findQuestion(/* This needs a parent answer ID or null */);
    
    if (nextQ) {
        return { type: 'question', data: formatQuestionForDisplay(nextQ) };
    }

    // If no more pre-written questions are found, handoff to the AI.
    // We will add more sophisticated rules for this later.
    if (questionHistory.length > 3 && questionHistory.length < 8) { // Example condition
        return { type: 'loading_ai' }; // Signal to the UI to show a loading state
    }

    // If all else fails, show results.
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

export function goBackLogic() {
    if (questionHistory.length === 0) {
        // If there's no history, we can't go back further than the start.
        return { type: 'start' };
    }

    // Remove the last question from history so we can ask it again.
    const lastQuestionId = questionHistory.pop();
    const lastQuestion = allQuestions.find(q => q.question_id === lastQuestionId);

    // Find the last answer given and remove it from the user's profile.
    const answerIndex = userProfile.answers.findIndex(a => a.question_id === lastQuestionId);
    if (answerIndex > -1) {
        const lastAnswer = userProfile.answers[answerIndex];
        
        // Reverse the score change from the last answer
        lastAnswer.tags.forEach(tag => {
            if (userProfile.interests[tag]) {
                userProfile.interests[tag] -= 1;
                if (userProfile.interests[tag] <= 0) {
                    delete userProfile.interests[tag];
                }
            }
        });

        userProfile.answers.splice(answerIndex, 1);
    }
    
    // Return the previous question to be re-rendered by the UI handler.
    return { type: 'question', data: formatQuestionForDisplay(lastQuestion) };
}

export async function handleFreeText(freeText) {
    const userAnswersForContext = userProfile.answers.map(a => a.tags).flat();
    
    try {
        const response = await fetch('/.netlify/functions/interpret-freetext', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userAnswers: userAnswersForContext,
                freeText: freeText
            })
        });

        if (!response.ok) {
            throw new Error('Failed to interpret free text.');
        }

        const { tags } = await response.json();
        
        // Create a temporary answer object to process the new tags
        const freeTextAnswer = {
            answer_text: freeText,
            tags: tags
        };

        // This re-uses the existing answer handling logic to update scores
        return handleAnswer(currentQuestion, freeTextAnswer);

    } catch (error) {
        console.error("Free text handling failed:", error);
        // If the API fails, just move on to the next question
        return getNextQuestion();
    }
}

export function loadSharedState(sharedData) {
    if (!sharedData || !sharedData.filters || !sharedData.answers) {
        console.error("Invalid shared data provided.");
        return { type: 'start' }; // Fallback to start screen on error
    }

    // Restore the user's profile from the shared data
    userProfile = {
        filters: sharedData.filters,
        answers: sharedData.answers,
        interests: {} // Recalculate interests from the answers
    };

    // Recalculate the interest scores based on the restored answers
    userProfile.answers.forEach(answer => {
        answer.tags.forEach(tag => {
            if (!tag.includes(':')) {
                userProfile.interests[tag] = (userProfile.interests[tag] || 0) + 1;
            }
        });
    });

    // We don't need to replay the quiz, just show the final results
    // based on the restored state.
    return { type: 'results', data: getProductScores() };
}

async function fetchAIQuestion() {
    console.log("Handoff to AI for question generation...");
    const topScores = getProductScores().slice(0, 5);
    const topProductIds = topScores.map(p => p.id);

    try {
        const response = await fetch('/.netlify/functions/generate-ai-question', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userProfile: getUserProfile(),
                topProductIds: topProductIds
            })
        });

        if (!response.ok) {
            throw new Error('AI question generation failed.');
        }

        const { question } = await response.json();
        // Add the new question to our in-memory list for this session
        allQuestions.push(question);
        return { type: 'question', data: formatQuestionForDisplay(question) };

    } catch (error) {
        console.error("AI Handoff Error:", error);
        // If AI fails, gracefully exit to results.
        return { type: 'results', data: getProductScores() };
    }
}

// Add this line at the very end of quiz-engine.js
export function getUserProfile() { return userProfile; }
