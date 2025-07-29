// /quiz-logic.js

document.addEventListener('DOMContentLoaded', () => {
    // --- GLOBAL STATE VARIABLES ---
    let allProducts = [];
    let allQuestions = [];
    let remainingProducts = [];
    let askedQuestions = new Set();
    let userAnswers = [];
    let currentQuestion = null;
    let questionHistory = [];

    // --- NEW: AI Question Queue ---
    // This array will store the sequence of questions received from the AI.
    let aiQuestionQueue = [];

    const quizContainer = document.getElementById('quiz-container');
    const questionEl = document.getElementById('question');
    const answersEl = document.getElementById('answers');
    const backButton = document.getElementById('back-button');
    const earlyExitButton = document.getElementById('early-exit-button');
    const resultsContainer = document.getElementById('results-container');
    const primaryResultEl = document.getElementById('primary-result');
    const secondaryResultsEl = document.getElementById('secondary-results');
    const restartButton = document.getElementById('restart-button');
    const shareButton = document.getElementById('share-button');

    // --- CONSTANTS AND WEIGHTS ---
    const TAG_WEIGHTS = {
        'relation': 3,
        'age': 3,
        'price': 5,
        'interest': 4,
        'occasion': 2,
        'is_differentiator': 2
    };
    const INITIAL_SCORE_THRESHOLD = 1.5;
    const AGGRESSIVE_SCORE_THRESHOLD = 1.2;

    // --- INITIALIZATION ---
    async function initializeQuiz() {
        try {
            const [productsRes, questionsRes] = await Promise.all([
                fetch('assets/products.json'),
                fetch('assets/questions.json')
            ]);
            allProducts = await productsRes.json();
            allQuestions = await questionsRes.json();
            startQuiz();
        } catch (error) {
            console.error("Failed to load quiz assets:", error);
            questionEl.textContent = "Der opstod en fejl under indlæsning af guiden. Prøv venligst igen senere.";
        }
    }

    function startQuiz() {
        remainingProducts = [...allProducts];
        askedQuestions.clear();
        userAnswers = [];
        questionHistory = [];
        aiQuestionQueue = []; // Clear AI queue on restart
        resultsContainer.classList.add('hidden');
        quizContainer.classList.remove('hidden');
        earlyExitButton.classList.add('hidden');
        backButton.classList.add('hidden');
        selectNextQuestion();
    }

    // --- CORE QUIZ LOGIC ---
    async function selectNextQuestion() {
        // 1. Ask initial questions first
        const initialQuestion = allQuestions.find(q => q.is_initial && !askedQuestions.has(q.id));
        if (initialQuestion) {
            displayQuestion(initialQuestion);
            return;
        }

        // Show early exit button after initial questions
        earlyExitButton.classList.remove('hidden');

        // 2. Check for a clear winner
        const scores = getProductScores();
        if (scores.length > 1) {
            const threshold = askedQuestions.size > 5 ? AGGRESSIVE_SCORE_THRESHOLD : INITIAL_SCORE_THRESHOLD;
            if (scores[0].score >= scores[1].score * threshold) {
                displayResults(scores);
                return;
            }
        }

        // --- NEW: AI QUESTION LOGIC ---
        // 3. Check if we have AI questions in our queue
        if (aiQuestionQueue.length > 0) {
            const nextAiQuestion = aiQuestionQueue.shift(); // Get the next question from the queue
            displayQuestion(nextAiQuestion);
            return;
        }

        // 4. If queue is empty, call the AI to generate a new sequence of questions
        const isReadyForAI = !initialQuestion && askedQuestions.size >= 3; // Trigger AI after a few questions
        if (isReadyForAI) {
            try {
                // Show loading state
                showLoadingState();
                const candidateProducts = scores.slice(0, 20).map(s => allProducts.find(p => p.id === s.id));
                const response = await fetch('/.netlify/functions/generate-ai-question', {
                    method: 'POST',
                    body: JSON.stringify({
                        userAnswers: userAnswers.map(a => a.tags).flat(),
                        candidateProducts: candidateProducts
                    })
                });

                if (!response.ok) throw new Error('AI service failed');

                const newAiQuestions = await response.json();
                hideLoadingState();

                if (newAiQuestions && newAiQuestions.length > 0) {
                    aiQuestionQueue = newAiQuestions; // Populate the queue
                    const firstAiQuestion = aiQuestionQueue.shift(); // Get the first question
                    displayQuestion(firstAiQuestion);
                    return;
                }
            } catch (error) {
                console.error("AI question generation failed, falling back to static questions:", error);
                hideLoadingState();
                // Fallback to static logic if AI fails
            }
        }
        // --- END OF AI LOGIC ---

        // 5. Fallback: Find the best static differentiator question
        const bestStaticQuestion = findBestStaticQuestion(scores);
        if (bestStaticQuestion) {
            displayQuestion(bestStaticQuestion);
        } else {
            displayResults(scores);
        }
    }

    function findBestStaticQuestion(scores) {
        const top5ProductIds = new Set(scores.slice(0, 5).map(s => s.id));
        const top5Products = allProducts.filter(p => top5ProductIds.has(p.id));

        let bestQuestion = null;
        let maxCoverage = 0;

        for (const q of allQuestions) {
            if (askedQuestions.has(q.id) || q.is_initial) continue;

            const relevantTags = new Set(q.answers.flatMap(a => a.tags));
            let coverage = 0;

            for (const p of top5Products) {
                const productTags = new Set([...p.tags, ...p.differentiator_tags]);
                if ([...relevantTags].some(tag => productTags.has(tag))) {
                    coverage++;
                }
            }

            if (coverage > maxCoverage) {
                maxCoverage = coverage;
                bestQuestion = q;
            }
        }
        return bestQuestion;
    }

    function handleAnswer(answer) {
        userAnswers.push(answer);
        questionHistory.push(currentQuestion);
        askedQuestions.add(currentQuestion.id);

        // Filter products based on the answer
        const answerTags = new Set(answer.tags);
        if (answerTags.has("price:billig")) {
            remainingProducts = remainingProducts.filter(p => p.price < 500);
        }

        selectNextQuestion();
    }

    function goBack() {
        if (questionHistory.length === 0) return;

        // Reset state from the last question
        const lastQuestion = questionHistory.pop();
        const lastAnswer = userAnswers.pop();
        askedQuestions.delete(lastQuestion.id);
        remainingProducts = [...allProducts]; // A simple reset, can be optimized

        // Re-apply filters from previous answers
        userAnswers.forEach(answer => {
            if (new Set(answer.tags).has("price:billig")) {
                remainingProducts = remainingProducts.filter(p => p.price < 500);
            }
        });

        displayQuestion(lastQuestion);
    }

    function getProductScores() {
        const scores = {};
        allProducts.forEach(p => scores[p.id] = { id: p.id, score: 0 });

        const allAnswerTags = userAnswers.flatMap(a => a.tags);

        for (const product of remainingProducts) {
            let score = 0;
            const productTags = new Set([...product.tags, ...product.differentiator_tags]);

            for (const answerTag of allAnswerTags) {
                if (productTags.has(answerTag)) {
                    const key = answerTag.split(':')[0];
                    const weight = TAG_WEIGHTS[key] || 1;
                    score += weight;
                }
            }
            scores[product.id].score = score;
        }
        return Object.values(scores).sort((a, b) => b.score - a.score);
    }

    // --- UI RENDERING ---
    function displayQuestion(question) {
        currentQuestion = question;
        quizContainer.classList.remove('fade-out');
        quizContainer.classList.add('fade-in');

        questionEl.textContent = question.question_text;
        answersEl.innerHTML = '';

        question.answers.forEach(answer => {
            const button = document.createElement('button');
            button.className = "answer-btn w-full text-left bg-white p-4 rounded-lg border border-gray-200 hover:bg-gray-100 hover:border-blue-500 transition-all duration-200 ease-in-out shadow-sm";
            button.textContent = answer.answer_text;
            button.onclick = () => handleAnswer(answer);
            answersEl.appendChild(button);
        });

        backButton.classList.toggle('hidden', questionHistory.length === 0);
    }

    function displayResults(scores) {
        quizContainer.classList.add('hidden');
        resultsContainer.classList.remove('hidden');
        resultsContainer.classList.add('fade-in');

        const top5 = scores.slice(0, 5).map(s => allProducts.find(p => p.id === s.id));

        // Primary result
        primaryResultEl.innerHTML = createProductCard(top5[0], true);

        // Secondary results
        secondaryResultsEl.innerHTML = '';
        if (top5.length > 1) {
            top5.slice(1).forEach(p => {
                secondaryResultsEl.innerHTML += createProductCard(p, false);
            });
        }
    }

    function createProductCard(product, isPrimary) {
        const cardClass = isPrimary ?
            "bg-white p-6 rounded-lg shadow-lg flex flex-col md:flex-row items-center gap-6" :
            "bg-white p-4 rounded-lg shadow-md flex items-center gap-4";
        const imageClass = isPrimary ? "w-full md:w-1/3 h-64 object-cover rounded-md" : "w-24 h-24 object-cover rounded-md";
        const titleClass = isPrimary ? "text-3xl font-bold text-gray-900" : "text-xl font-semibold text-gray-800";
        const descriptionClass = isPrimary ? "text-gray-700 mt-2 leading-relaxed" : "text-gray-600 text-sm mt-1";

        return `
            <div class="${cardClass}">
                <img src="${product.image}" alt="${product.name}" class="${imageClass}">
                <div class="flex-1 text-center md:text-left">
                    <h3 class="${titleClass}">${product.name}</h3>
                    <p class="text-lg text-blue-600 font-semibold mt-1">${product.price.toFixed(2)} kr.</p>
                    ${isPrimary ? `<p class="${descriptionClass}">${product.description}</p>` : ''}
                    <a href="${product.url}" target="_blank" rel="noopener noreferrer" class="cta-btn inline-block mt-4 px-6 py-3 text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-transform transform hover:scale-105">Se gaven</a>
                </div>
            </div>
        `;
    }

    // --- NEW: Loading State UI ---
    function showLoadingState() {
        questionEl.textContent = 'Finder det næste perfekte spørgsmål...';
        answersEl.innerHTML = '<div class="loader ease-linear rounded-full border-4 border-t-4 border-gray-200 h-12 w-12 mx-auto"></div>';
        backButton.classList.add('hidden');
        earlyExitButton.classList.add('hidden');
    }

    function hideLoadingState() {
        // Content will be replaced by displayQuestion, so no action needed here.
        // Re-enable buttons that were hidden.
        earlyExitButton.classList.remove('hidden');
    }

    // --- EVENT LISTENERS ---
    backButton.addEventListener('click', goBack);
    restartButton.addEventListener('click', startQuiz);
    earlyExitButton.addEventListener('click', () => displayResults(getProductScores()));

    // --- START THE APP ---
    initializeQuiz();
});
