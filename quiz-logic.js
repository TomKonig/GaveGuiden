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
    let aiQuestionQueue = [];

    // --- NEW: State for multi-select ---
    let selectedMultiAnswers = new Set();

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
        'category': 4, // Added weight for the new category question
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
        aiQuestionQueue = [];
        selectedMultiAnswers.clear();
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

        // 3. Check if we have AI questions in our queue
        if (aiQuestionQueue.length > 0) {
            const nextAiQuestion = aiQuestionQueue.shift();
            displayQuestion(nextAiQuestion);
            return;
        }

        // 4. If queue is empty, call the AI to generate a new sequence
        try {
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
                aiQuestionQueue = newAiQuestions;
                const firstAiQuestion = aiQuestionQueue.shift();
                displayQuestion(firstAiQuestion);
            } else {
                // Fallback if AI returns empty array
                displayResults(scores);
            }
        } catch (error) {
            console.error("AI question generation failed, showing results instead:", error);
            hideLoadingState();
            displayResults(scores); // Show best results if AI fails
        }
    }

    function handleAnswer(answer) {
        userAnswers.push(answer);
        questionHistory.push(currentQuestion);
        askedQuestions.add(currentQuestion.id);
        if (answer.tags.some(t => t.includes("price:billig"))) {
            remainingProducts = remainingProducts.filter(p => p.price < 500);
        }
        selectNextQuestion();
    }
    
    // --- NEW: Handler for multi-select question ---
    function handleMultiSelect() {
        if (selectedMultiAnswers.size === 0) {
            // Optional: Add a small visual cue that they should select at least one
            return;
        }
        const combinedAnswer = {
            answer_text: 'Flere kategorier valgt',
            tags: Array.from(selectedMultiAnswers).flatMap(index => currentQuestion.answers[index].tags)
        };
        handleAnswer(combinedAnswer);
    }

    // --- UI RENDERING ---
    function displayQuestion(question) {
        currentQuestion = question;
        quizContainer.classList.remove('fade-out');
        quizContainer.classList.add('fade-in');
        questionEl.textContent = question.question_text;
        answersEl.innerHTML = '';
        selectedMultiAnswers.clear();

        if (question.is_multiselect) {
            // Render checkboxes for multi-select
            question.answers.forEach((answer, index) => {
                const wrapper = document.createElement('div');
                wrapper.className = "answer-btn w-full text-left bg-white p-4 rounded-lg border border-gray-200 hover:bg-gray-100 hover:border-blue-500 transition-all duration-200 ease-in-out shadow-sm cursor-pointer flex items-center";
                wrapper.innerHTML = `
                    <input type="checkbox" id="answer-${index}" class="mr-3 h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 pointer-events-none" data-index="${index}">
                    <label for="answer-${index}" class="cursor-pointer flex-1">${answer.answer_text}</label>
                `;
                wrapper.onclick = () => {
                    const checkbox = wrapper.querySelector('input');
                    checkbox.checked = !checkbox.checked;
                    const event = new Event('change', { bubbles: true });
                    checkbox.dispatchEvent(event);
                };
                const checkbox = wrapper.querySelector('input');
                checkbox.addEventListener('change', () => {
                     if (checkbox.checked) {
                        selectedMultiAnswers.add(index);
                        wrapper.classList.add('border-blue-500', 'bg-blue-50');
                    } else {
                        selectedMultiAnswers.delete(index);
                        wrapper.classList.remove('border-blue-500', 'bg-blue-50');
                    }
                });
                answersEl.appendChild(wrapper);
            });
            // Add a continue button for multi-select
            const continueButton = document.createElement('button');
            continueButton.textContent = 'Videre';
            continueButton.className = 'cta-btn w-full mt-4 px-6 py-3 text-white bg-blue-600 rounded-md hover:bg-blue-700';
            continueButton.onclick = handleMultiSelect;
            answersEl.appendChild(continueButton);
        } else {
            // Render buttons for single-select
            question.answers.forEach(answer => {
                const button = document.createElement('button');
                button.className = "answer-btn w-full text-left bg-white p-4 rounded-lg border border-gray-200 hover:bg-gray-100 hover:border-blue-500 transition-all duration-200 ease-in-out shadow-sm";
                button.textContent = answer.answer_text;
                button.onclick = () => handleAnswer(answer);
                answersEl.appendChild(button);
            });
        }
        backButton.classList.toggle('hidden', questionHistory.length === 0);
    }
    
    function goBack() {
        if (questionHistory.length === 0) return;
        const lastQuestion = questionHistory.pop();
        userAnswers.pop();
        askedQuestions.delete(lastQuestion.id);
        remainingProducts = [...allProducts];
        userAnswers.forEach(answer => {
            if (answer.tags.some(t => t.includes("price:billig"))) {
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

    function displayResults(scores) {
        quizContainer.classList.add('hidden');
        resultsContainer.classList.remove('hidden');
        resultsContainer.classList.add('fade-in');
        const top5 = scores.slice(0, 5).map(s => allProducts.find(p => p.id === s.id));
        primaryResultEl.innerHTML = createProductCard(top5[0], true);
        secondaryResultsEl.innerHTML = '';
        if (top5.length > 1) {
            top5.slice(1).forEach(p => {
                secondaryResultsEl.innerHTML += createProductCard(p, false);
            });
        }
    }

    function createProductCard(product, isPrimary) {
        if (!product) return '';
        const cardClass = isPrimary ? "bg-white p-6 rounded-lg shadow-lg flex flex-col md:flex-row items-center gap-6" : "bg-white p-4 rounded-lg shadow-md flex items-center gap-4";
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

    function showLoadingState() {
        questionEl.textContent = 'Et øjeblik, jeg tænker lige...';
        answersEl.innerHTML = '<div class="loader ease-linear rounded-full border-4 border-t-4 border-gray-200 h-12 w-12 mx-auto"></div>';
        backButton.classList.add('hidden');
        earlyExitButton.classList.add('hidden');
    }

    function hideLoadingState() {
        earlyExitButton.classList.remove('hidden');
    }

    backButton.addEventListener('click', goBack);
    restartButton.addEventListener('click', startQuiz);
    earlyExitButton.addEventListener('click', () => displayResults(getProductScores()));

    initializeQuiz();
});
