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

    const TAG_WEIGHTS = { 'relation': 3, 'age': 3, 'price': 5, 'category': 4, 'interest': 4, 'occasion': 2, 'is_differentiator': 2 };
    const INITIAL_SCORE_THRESHOLD = 1.5;
    const AGGRESSIVE_SCORE_THRESHOLD = 1.2;

    async function initializeQuiz() {
        try {
            const [productsRes, questionsRes] = await Promise.all([ fetch('assets/products.json'), fetch('assets/questions.json') ]);
            allProducts = await productsRes.json();
            allQuestions = await questionsRes.json();
            startQuiz();
        } catch (error) {
            console.error("Failed to load quiz assets:", error);
            questionEl.textContent = "Der opstod en fejl. Prøv venligst igen senere.";
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

    // --- NEW: Centralized function to apply all filters based on userAnswers ---
    function recalculateRemainingProducts() {
        let products = [...allProducts];
        const userAnswerTags = new Set(userAnswers.flatMap(a => a.tags));

        // Handle price filtering logic
        if (userAnswerTags.has('price:billig')) {
            products = products.filter(p => p.price < 200);
        } else if (userAnswerTags.has('price_filter:strict')) {
            if (userAnswerTags.has('price:mellem')) {
                products = products.filter(p => p.price >= 200 && p.price <= 500);
            } else if (userAnswerTags.has('price:dyr')) {
                products = products.filter(p => p.price > 500);
            }
        }
        remainingProducts = products;
    }

    async function selectNextQuestion() {
        // --- UPDATED: Smarter initial question selection ---
        const unaskedInitialQuestions = allQuestions.filter(q => q.is_initial && !askedQuestions.has(q.id));
        const currentUserTags = new Set(userAnswers.flatMap(a => a.tags));
        
        let nextInitialQuestion = unaskedInitialQuestions.find(q => 
            q.trigger_tags && q.trigger_tags.some(tag => currentUserTags.has(tag))
        );

        if (!nextInitialQuestion) {
            nextInitialQuestion = unaskedInitialQuestions.find(q => !q.trigger_tags);
        }

        if (nextInitialQuestion) {
            displayQuestion(nextInitialQuestion);
            return;
        }
        
        earlyExitButton.classList.remove('hidden');

        const scores = getProductScores();
        if (scores.length > 1) {
            const threshold = askedQuestions.size > 7 ? AGGRESSIVE_SCORE_THRESHOLD : INITIAL_SCORE_THRESHOLD;
            if (scores[0].score >= scores[1].score * threshold) {
                displayResults(scores);
                return;
            }
        }

        if (aiQuestionQueue.length > 0) {
            displayQuestion(aiQuestionQueue.shift());
            return;
        }

        try {
            showLoadingState();
            const candidateProducts = scores.slice(0, 20).map(s => allProducts.find(p => p.id === s.id));
            const response = await fetch('/.netlify/functions/generate-ai-question', {
                method: 'POST',
                body: JSON.stringify({ userAnswers: userAnswers.map(a => a.tags).flat(), candidateProducts })
            });
            if (!response.ok) throw new Error('AI service failed');
            const newAiQuestions = await response.json();
            hideLoadingState();
            if (newAiQuestions && newAiQuestions.length > 0) {
                aiQuestionQueue = newAiQuestions;
                displayQuestion(aiQuestionQueue.shift());
            } else {
                displayResults(scores);
            }
        } catch (error) {
            console.error("AI question generation failed, showing results instead:", error);
            hideLoadingState();
            displayResults(scores);
        }
    }

    function handleAnswer(answer) {
        userAnswers.push(answer);
        questionHistory.push(currentQuestion);
        askedQuestions.add(currentQuestion.id);
        recalculateRemainingProducts(); // Use the new centralized filter function
        selectNextQuestion();
    }
    
    function handleMultiSelect() {
        if (selectedMultiAnswers.size === 0) return;
        const combinedAnswer = {
            answer_text: 'Flere kategorier valgt',
            tags: Array.from(selectedMultiAnswers).flatMap(index => currentQuestion.answers[index].tags)
        };
        handleAnswer(combinedAnswer);
    }

    async function handleFreeTextSubmit() {
        const inputEl = document.getElementById('freetext-input');
        const freeText = inputEl.value.trim();
        if (freeText.length === 0) return;

        showLoadingState();
        try {
            const response = await fetch('/.netlify/functions/interpret-freetext', {
                method: 'POST',
                body: JSON.stringify({
                    userAnswers: userAnswers.map(a => a.tags).flat(),
                    freeText: freeText
                })
            });
            if (!response.ok) throw new Error('AI interpretation failed');
            const newTags = await response.json();
            
            const freeTextAnswer = {
                answer_text: `Brugerinput: ${freeText}`,
                tags: newTags
            };
            handleAnswer(freeTextAnswer);

        } catch (error) {
            console.error("Free-text interpretation failed:", error);
            selectNextQuestion();
        }
    }

    function displayQuestion(question) {
        currentQuestion = question;
        quizContainer.classList.remove('fade-out');
        quizContainer.classList.add('fade-in');
        questionEl.textContent = question.question_text;
        answersEl.innerHTML = '';
        selectedMultiAnswers.clear();

        if (question.is_multiselect) {
            question.answers.forEach((answer, index) => {
                const wrapper = document.createElement('div');
                wrapper.className = "answer-btn w-full text-left bg-white p-4 rounded-lg border border-gray-200 hover:bg-gray-100 hover:border-blue-500 transition-all duration-200 ease-in-out shadow-sm cursor-pointer flex items-center";
                wrapper.innerHTML = `<input type="checkbox" id="answer-${index}" class="mr-3 h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 pointer-events-none"><label for="answer-${index}" class="cursor-pointer flex-1">${answer.answer_text}</label>`;
                wrapper.onclick = () => {
                    const cb = wrapper.querySelector('input');
                    cb.checked = !cb.checked;
                    cb.dispatchEvent(new Event('change', { bubbles: true }));
                };
                wrapper.querySelector('input').addEventListener('change', (e) => {
                    if (e.target.checked) {
                        selectedMultiAnswers.add(index);
                        wrapper.classList.add('border-blue-500', 'bg-blue-50');
                    } else {
                        selectedMultiAnswers.delete(index);
                        wrapper.classList.remove('border-blue-500', 'bg-blue-50');
                    }
                });
                answersEl.appendChild(wrapper);
            });
            const continueButton = document.createElement('button');
            continueButton.textContent = 'Videre';
            continueButton.className = 'cta-btn w-full mt-4 px-6 py-3 text-white bg-blue-600 rounded-md hover:bg-blue-700';
            continueButton.onclick = handleMultiSelect;
            answersEl.appendChild(continueButton);
        } else {
            question.answers.forEach(answer => {
                const button = document.createElement('button');
                button.className = "answer-btn w-full text-left bg-white p-4 rounded-lg border border-gray-200 hover:bg-gray-100 hover:border-blue-500 transition-all duration-200 ease-in-out shadow-sm";
                button.textContent = answer.answer_text;
                
                if (answer.tags.includes("freetext:true")) {
                    button.onclick = () => {
                        answersEl.innerHTML = `
                            <div class="w-full">
                                <textarea id="freetext-input" maxlength="250" class="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500" placeholder="Fortæl os lidt mere..."></textarea>
                                <div id="char-counter" class="text-right text-sm text-gray-500 mt-1">0 / 250</div>
                                <button id="freetext-submit" class="cta-btn w-full mt-2 px-6 py-3 text-white bg-blue-600 rounded-md hover:bg-blue-700">Send</button>
                            </div>
                        `;
                        const inputEl = document.getElementById('freetext-input');
                        const charCounter = document.getElementById('char-counter');
                        inputEl.addEventListener('input', () => {
                            charCounter.textContent = `${inputEl.value.length} / 250`;
                        });
                        document.getElementById('freetext-submit').onclick = handleFreeTextSubmit;
                    };
                } else {
                    button.onclick = () => handleAnswer(answer);
                }
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
        recalculateRemainingProducts(); // Recalculate after removing an answer
        displayQuestion(lastQuestion);
    }

    function getProductScores() {
        const scores = {};
        allProducts.forEach(p => scores[p.id] = { id: p.id, score: 0 });
        const allAnswerTags = userAnswers.flatMap(a => a.tags);
        for (const product of remainingProducts) { // Score only based on remaining products
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
