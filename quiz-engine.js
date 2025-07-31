// /quiz-engine.js

// --- CONFIGURATION & STATE ---
const TAG_WEIGHTS = {
    'gender': 1.5,
    'age': 1.5,
    'interest': 2.0,
    'category': 1.8,
    'personality': 1.2,
    'price': 1.0,
    'differentiator': 2.5
};
const INITIAL_SCORE_THRESHOLD = 2.0;
const AGGRESSIVE_SCORE_THRESHOLD = 3.0;

let allProducts = [];
let allQuestions = [];
let interestHierarchy = [];
let allInterestTags = [];
let remainingProducts = [];
let interestDepthsMap = new Map();
let questionHistory = [];
let userAnswers = [];
let aiQuestionQueue = [];
let currentQuestion = null;
let isQuizInitialized = false;

// --- INITIALIZATION ---

export async function initializeQuizAssets() {
    if (isQuizInitialized) return;
    try {
        // We no longer need to fetch 'standardization.json' here.
        const [productsRes, questionsRes, interestsRes] = await Promise.all([
            fetch('assets/products.json'),
            fetch('assets/questions.json'),
            fetch('assets/interests.json')
        ]);

        allProducts = await productsRes.json();
        remainingProducts = [...allProducts];
        allQuestions = await questionsRes.json();
        interestHierarchy = await interestsRes.json();
        
        // --- THIS IS THE FIX ---
        // We now build the list of all interest tags directly from interests.json,
        // which is the single source of truth.
        allInterestTags = interestHierarchy.map(interest => interest.key);
        // --- END OF FIX ---

        isQuizInitialized = true;
        await calculateAndStoreInterestDepths();

    } catch (error) {
        console.error("Failed to load quiz assets:", error);
        throw error; // Re-throw to be caught by the UI handler
    }
}

export function resetQuizState() {
    remainingProducts = [...allProducts];
    questionHistory = [];
    userAnswers = [];
    aiQuestionQueue = [];
    currentQuestion = null;
    return selectNextQuestion();
}


// --- SCORING & PRODUCT LOGIC ---
function recalculateRemainingProducts() {
    let products = [...allProducts];
    const userTags = new Set(userAnswers.flatMap(a => a.tags));
    if (userTags.has('price:billig')) {
        products = products.filter(p => p.price < 200);
    } else if (userTags.has('price_filter:strict')) {
        if (userTags.has('price:mellem')) products = products.filter(p => p.price >= 200 && p.price <= 500);
        else if (userTags.has('price:dyr')) products = products.filter(p => p.price > 500);
    }
    const interestTagsSelected = [...userTags].filter(t => t.startsWith('interest:') || t.startsWith('category:'));
    if (interestTagsSelected.length > 0) {
        products = products.filter(p => {
            const prodTags = new Set([...(p.tags || []), ...(p.differentiator_tags || [])]);
            return interestTagsSelected.some(tag => prodTags.has(tag));
        });
    }
    remainingProducts = products;
}

export function getProductScores() {
    const allAnswerTags = userAnswers.flatMap(a => a.tags);
    if (allAnswerTags.length === 0) return remainingProducts.map(p => ({ id: p.id, score: 0 })).sort((a,b) => b.score - a.score);

    const scores = remainingProducts.map(product => {
        let score = 0;
        const productTags = new Set([...(product.tags || []), ...(product.differentiator_tags || [])]);
        for (const tag of allAnswerTags) {
            if (productTags.has(tag)) {
                const key = tag.split(':')[0];
                const weight = TAG_WEIGHTS[key] || 1;
                score += weight;
            }
        }
        return { id: product.id, score };
    });
    return scores.sort((a, b) => b.score - a.score);
}


// --- QUESTION SELECTION LOGIC ---
export async function selectNextQuestion() {
    const unaskedInitial = allQuestions.filter(q => q.is_initial && !questionHistory.some(h => h.id === q.id));
    const currentTags = new Set(userAnswers.flatMap(a => a.tags));
    
    let nextInitialQuestion = unaskedInitial.find(q => q.trigger_tags && q.trigger_tags.some(tag => currentTags.has(tag))) || unaskedInitial.find(q => !q.trigger_tags);

    if (nextInitialQuestion) {
        if (nextInitialQuestion.type === 'interest_hub' || nextInitialQuestion.id === 'q_interest_placeholder') {
            questionHistory.push(nextInitialQuestion);
            return selectNextQuestion();
        }
        currentQuestion = nextInitialQuestion;
        return { type: 'question', data: currentQuestion };
    }

    if (!questionHistory.some(q => q.id === 'q_interest_hub')) {
        currentQuestion = { id: 'q_interest_hub', question_text: 'Hvad interesserer personen sig for?' };
        return { type: 'interest_hub', data: currentQuestion };
    }

    const scores = getProductScores();
    if (scores.length > 1) {
        const threshold = questionHistory.length > 7 ? AGGRESSIVE_SCORE_THRESHOLD : INITIAL_SCORE_THRESHOLD;
        if (scores[0].score >= scores[1].score * threshold || remainingProducts.length <= 5) {
            return { type: 'results', data: scores };
        }
    }
    
    // AI Question Logic
    if (aiQuestionQueue.length > 0) {
        const nextQ = aiQuestionQueue.shift();
        if (isQuestionStillRelevant(nextQ, scores.slice(0, 5).map(s => allProducts.find(p => p.id === s.id)))) {
            triggerPredictiveBatch(scores);
            currentQuestion = nextQ;
            return { type: 'question', data: currentQuestion };
        }
        aiQuestionQueue = [];
    }
    
    try {
        const candidateProducts = scores.slice(0, 15).map(s => ({ ...allProducts.find(p => p.id === s.id), score: s.score })).filter(x => x);
        const themesWithDetails = getThemesForAI(candidateProducts);

        const response = await fetch('/.netlify/functions/generate-ai-question', {
            method: 'POST',
            body: JSON.stringify({ userAnswers: userAnswers.flatMap(a => a.tags), themesWithDetails })
        });
        if (!response.ok) throw new Error('AI question generation failed');
        
        const jitQuestion = await response.json();
        if (jitQuestion && jitQuestion.id && Array.isArray(jitQuestion.answers)) {
            triggerPredictiveBatch(scores);
            currentQuestion = jitQuestion;
            return { type: 'question', data: currentQuestion };
        }
        throw new Error("Invalid AI question format");
    } catch (error) {
        console.error("AI logic failed, showing results:", error);
        return { type: 'results', data: scores };
    }
}


// --- ANSWER HANDLING ---
export function handleAnswer(answer) {
    const answerEntry = {
        question_text: currentQuestion.question_text,
        answer_text: answer.answer_text,
        tags: answer.tags || []
    };
    userAnswers.push(answerEntry);
    questionHistory.push(currentQuestion);
    recalculateRemainingProducts();
    triggerPredictiveBatch(getProductScores());
    return selectNextQuestion();
}

export async function handleFreeText(freeText) {
    try {
        const response = await fetch('/.netlify/functions/interpret-freetext', {
            method: 'POST',
            body: JSON.stringify({ userAnswers: userAnswers.flatMap(a => a.tags), freeText })
        });
        if (!response.ok) throw new Error('AI free-text interpretation failed');
        const result = await response.json();
        return handleAnswer({ answer_text: `Brugerinput: ${freeText}`, tags: result.tags || [] });
    } catch (error) {
        console.error("Free-text interpretation failed:", error);
        return selectNextQuestion(); // Move on even if it fails
    }
}

export function goBackLogic() {
    if (questionHistory.length === 0) return { type: 'start' };
    userAnswers.pop();
    questionHistory.pop();
    const prevQuestion = questionHistory[questionHistory.length - 1];
    currentQuestion = prevQuestion;
    if (prevQuestion) {
        return prevQuestion.id === 'q_interest_hub' ? { type: 'interest_hub', data: prevQuestion } : { type: 'question', data: prevQuestion };
    }
    return { type: 'restart' };
}


// --- HELPER & AI FUNCTIONS ---
function isQuestionStillRelevant(question, topProductsList) {
    if (!question || !Array.isArray(question.answers)) return false;
    const topProductTags = new Set(topProductsList.flatMap(p => p.tags || []));
    let differentiatingAnswers = 0;
    question.answers.forEach(ans => {
        if (ans.tags && ans.tags.some(tag => topProductTags.has(tag))) {
            differentiatingAnswers++;
        }
    });
    return differentiatingAnswers >= 2;
}

function triggerPredictiveBatch(scores) {
    const candidateProducts = scores.slice(0, 15).map(s => ({ ...allProducts.find(p => p.id === s.id), score: s.score })).filter(x => x);
    if (candidateProducts.length > 0) {
        const themesWithDetails = getThemesForAI(candidateProducts);
        fetch('/.netlify/functions/generate-question-batch', {
            method: 'POST',
            body: JSON.stringify({ userAnswers: userAnswers.flatMap(a => a.tags), themesWithDetails })
        })
        .then(res => res.json())
        .then(data => {
            if (data.questions && Array.isArray(data.questions)) aiQuestionQueue.push(...data.questions);
        })
        .catch(error => console.warn('Predictive batch call failed:', error));
    }
}

async function calculateAndStoreInterestDepths() {
    if (!interestHierarchy || interestHierarchy.length === 0) return;
    const interestsMap = new Map(interestHierarchy.map(i => [i.key, i]));
    const depthCache = new Map();
    const calculateDepth = (interestKey) => {
        if (depthCache.has(interestKey)) return depthCache.get(interestKey);
        const interest = interestsMap.get(interestKey);
        if (!interest || !interest.parents || interest.parents.length === 0) {
            depthCache.set(interestKey, 1);
            return 1;
        }
        const maxDepth = Math.max(...interest.parents.map(p => calculateDepth(p))) + 1;
        depthCache.set(interestKey, maxDepth);
        return maxDepth;
    };
    for (const interestKey of allInterestTags) {
        const rawKey = interestKey.includes(':') ? interestKey.split(':')[1] : interestKey;
        calculateDepth(rawKey);
    }
    interestDepthsMap = depthCache;
}

function getThemesForAI(candidateProducts) {
    const themeScores = {};
    const validInterestKeys = new Set(allInterestTags);
    candidateProducts.forEach(p => {
        if (!p || !p.tags) return;
        const pScore = p.score || 1;
        const allProductTags = [...(p.tags || []), ...(p.differentiator_tags || [])];
        allProductTags.filter(t => validInterestKeys.has(t)).forEach(t => {
            themeScores[t] = (themeScores[t] || 0) + pScore;
        });
    });
    const allSortedThemes = Object.entries(themeScores).sort((a, b) => b[1] - a[1]);
    const topThemes = allSortedThemes.slice(0, 10);
    const samplingPool = allSortedThemes.slice(10, 35);
    const shuffledPool = samplingPool.sort(() => 0.5 - Math.random());
    const randomNicheThemes = shuffledPool.slice(0, 5);
    const finalThemes = [...topThemes, ...randomNicheThemes];
    return finalThemes.map(([tagKey, score]) => {
        const rawKey = tagKey.includes(':') ? tagKey.split(':')[1] : tagKey;
        return { tag: tagKey, score: Math.round(score), specificity: interestDepthsMap.get(rawKey) || 1 };
    });
}
