// /quiz-logic.js
document.addEventListener('DOMContentLoaded', () => {
    // --- CONFIGURATION CONSTANTS (NEWLY ADDED) ---
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
    
    // --- GLOBAL STATE ---
    let allProducts = [];
    let allQuestions = [];
    let interestHierarchy = [];
    let allInterestTags = [];
    let remainingProducts = [];

    let questionHistory = [];
    let userAnswers = [];
    let aiQuestionQueue = [];
    let currentQuestion = null;
    let isQuizInitialized = false;
    let currentRecommendationId = null; // track primary recommendation product ID for feedback
    let interestDepthsMap = new Map();

    // --- DOM ELEMENTS ---
    
    // --- NEW HELPER FUNCTIONS FOR AI DATA PREPARATION ---

    // This function calculates the "depth" of each interest and stores it in a map for fast access.
    async function calculateAndStoreInterestDepths() {
        if (!interestHierarchy || interestHierarchy.length === 0) {
             console.error("Interest hierarchy not loaded, cannot calculate depths.");
             return;
        }
        
        const interestsMap = new Map(interestHierarchy.map(i => [i.key, i]));
        const depthCache = new Map();

        const calculateDepth = (interestKey) => {
            if (depthCache.has(interestKey)) return depthCache.get(interestKey);
            
            const interest = interestsMap.get(interestKey);
            // If a tag is not in the hierarchy, give it a default depth of 1.
            if (!interest) return 1;

            if (!interest.parents || interest.parents.length === 0) {
                depthCache.set(interestKey, 1);
                return 1;
            }

            const parentDepths = interest.parents.map(parentKey => calculateDepth(parentKey));
            const maxDepth = Math.max(...parentDepths) + 1;
            depthCache.set(interestKey, maxDepth);
            return maxDepth;
        };

        // We now need to use `allInterestTags` which holds all possible interest keys.
        for (const interestKey of allInterestTags) {
            // The key in allInterestTags might be prefixed, e.g., "interest:sport". We need the raw key.
            const rawKey = interestKey.includes(':') ? interestKey.split(':')[1] : interestKey;
            calculateDepth(rawKey);
        }
        
        // This is a global variable we need to declare at the top.
        interestDepthsMap = depthCache;
        console.log("Interest depths have been pre-calculated.");
    }

    // This function prepares the final data payload for our AI functions.
    function getThemesForAI(candidateProducts) {
        const themeScores = {};
        
        // Use allInterestTags to identify valid interest tags on products.
        const validInterestKeys = new Set(allInterestTags);

        candidateProducts.forEach(p => {
            if (!p || !p.tags) return;
            const pScore = p.score || 1;
            // Check both regular tags and differentiator tags for interests.
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

        const themesWithDetails = finalThemes.map(([tagKey, score]) => {
            const rawKey = tagKey.includes(':') ? tagKey.split(':')[1] : tagKey;
            return {
                tag: tagKey, // Send the full tag, e.g., "interest:sport"
                score: Math.round(score),
                specificity: interestDepthsMap.get(rawKey) || 1
            };
        });

        return themesWithDetails;
    }
    
    let heroSection, quizSection, questionContainer, backButton, earlyExitButton, resultsSection;
    let primaryResultEl, secondaryResultsEl, restartButton, shareButton;
    let feedbackContainer, starRatingContainer;
    let howItWorksBtn, closeModalBtn, modal;
    let shareModal, closeShareModalBtn, shareLinkInput, copyShareLinkBtn, copyFeedback;

    function setupDOMElements() {
        heroSection = document.getElementById('hero-section');
        quizSection = document.getElementById('quiz-section');
        questionContainer = document.getElementById('question-container');
        backButton = document.getElementById('back-button');
        earlyExitButton = document.getElementById('early-exit-button');
        resultsSection = document.getElementById('results-section');
        primaryResultEl = document.getElementById('primary-result');
        secondaryResultsEl = document.getElementById('secondary-results');
        restartButton = document.getElementById('restart-button');
        shareButton = document.getElementById('share-button');
        feedbackContainer = document.getElementById('feedback-container');
        starRatingContainer = document.getElementById('star-rating');
        howItWorksBtn = document.getElementById('how-it-works-btn');
        closeModalBtn = document.getElementById('close-modal-btn');
        modal = document.getElementById('how-it-works-modal');
        shareModal = document.getElementById('share-modal');
        closeShareModalBtn = document.getElementById('close-share-modal-btn');
        shareLinkInput = document.getElementById('share-link-input');
        copyShareLinkBtn = document.getElementById('copy-share-link-btn');
        copyFeedback = document.getElementById('copy-feedback');
    }

    async function initializeQuizAssets() {
        if (isQuizInitialized) return;
        try {
            const [productsRes, questionsRes, interestsRes, standardizationRes] = await Promise.all([
                fetch('assets/products.json'),
                fetch('assets/questions.json'),
                fetch('assets/interests.json'),
                fetch('assets/standardization.json')
            ]);
            allProducts = await productsRes.json();
            remainingProducts = [...allProducts];
            allQuestions = await questionsRes.json();
            interestHierarchy = await interestsRes.json();
            allInterestTags = standardizationRes.ok ? (await standardizationRes.json()).interest_tags : [];
            isQuizInitialized = true;
            await calculateAndStoreInterestDepths();
        } catch (error) {
            console.error("Failed to load quiz assets:", error);
            questionContainer.innerHTML = `<h2 class="text-2xl font-bold text-center text-red-600">Fejl: Kunne ikke indlæse quizzen. Prøv venligst igen senere.</h2>`;
        }
    }

    function attachEventListeners() {
        document.querySelectorAll('.start-quiz-btn').forEach(btn => btn.addEventListener('click', startQuiz));
        backButton.addEventListener('click', goBack);
        restartButton.addEventListener('click', startQuiz);
        earlyExitButton.addEventListener('click', () => displayResults(getProductScores()));
        howItWorksBtn.addEventListener('click', () => modal.classList.remove('hidden'));
        closeModalBtn.addEventListener('click', () => modal.classList.add('hidden'));
        modal.addEventListener('click', e => { if (e.target === modal) modal.classList.add('hidden'); });
        shareButton.addEventListener('click', handleShare);
        closeShareModalBtn.addEventListener('click', () => shareModal.classList.add('hidden'));
        shareModal.addEventListener('click', e => { if (e.target === shareModal) shareModal.classList.add('hidden'); });
        copyShareLinkBtn.addEventListener('click', copyShareLink);
        // Star rating events
        starRatingContainer.querySelectorAll('button').forEach(btn => {
            btn.addEventListener('click', () => {
                const rating = parseInt(btn.getAttribute('data-value'));
                if (!currentRecommendationId || !rating) return;
                // Submit rating to backend
                fetch('/.netlify/functions/submit-rating', {
                    method: 'POST',
                    body: JSON.stringify({ productId: currentRecommendationId, rating: rating })
                }).catch(err => console.error('Rating submission failed:', err));
                // Visually indicate selection
                starRatingContainer.querySelectorAll('button').forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
            });
        });
        // Report problem events will be delegated (added when results are rendered)
    }

    async function startQuiz() {
        // If starting from scratch or restarting, reset state
        heroSection.classList.add('hidden');
        resultsSection.classList.add('hidden');
        quizSection.classList.remove('hidden');
        quizSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        showLoadingState('Indlæser guiden...');
        await initializeQuizAssets();
        remainingProducts = [...allProducts];
        questionHistory = [];
        userAnswers = [];
        aiQuestionQueue = [];
        currentQuestion = null;
        currentRecommendationId = null;
        earlyExitButton.classList.add('hidden');
        backButton.classList.add('hidden');
        feedbackContainer.classList.add('hidden');
        selectNextQuestion();
    }

    function recalculateRemainingProducts() {
        let products = [...allProducts];
        const userTags = new Set(userAnswers.flatMap(a => a.tags));
        // Price filtering
        if (userTags.has('price:billig')) {
            products = products.filter(p => p.price < 200);
        } else if (userTags.has('price_filter:strict')) {
            if (userTags.has('price:mellem')) {
                products = products.filter(p => p.price >= 200 && p.price <= 500);
            } else if (userTags.has('price:dyr')) {
                products = products.filter(p => p.price > 500);
            }
        }
        // Interest/category filtering: if any interest or category tags selected, keep products that have at least one of those tags
        const interestTagsSelected = [...userTags].filter(t => t.startsWith('interest:') || t.startsWith('category:'));
        if (interestTagsSelected.length > 0) {
            products = products.filter(p => {
                const prodTags = new Set([...(p.tags || []), ...(p.differentiator_tags || [])]);
                return interestTagsSelected.some(tag => prodTags.has(tag));
            });
        }
        remainingProducts = products;
    }

    async function selectNextQuestion() {
        hideLoadingState(); // Hide loader from any previous step

        // --- Logic for static, non-AI questions ---
        const unaskedInitial = allQuestions.filter(q => q.is_initial && !questionHistory.some(h => h.id === q.id));
        const currentTags = new Set(userAnswers.flatMap(a => a.tags));
        
        let nextInitialQuestion = unaskedInitial.find(q => q.trigger_tags && q.trigger_tags.some(tag => currentTags.has(tag)));
        if (!nextInitialQuestion) {
            nextInitialQuestion = unaskedInitial.find(q => !q.trigger_tags);
        }

        if (nextInitialQuestion) {
            if (nextInitialQuestion.type === 'interest_hub' || nextInitialQuestion.id === 'q_interest_placeholder') {
                questionHistory.push(nextInitialQuestion);
                selectNextQuestion(); // Move to the next question
                return;
            }
            displayQuestion(nextInitialQuestion);
            return;
        }

        if (!questionHistory.some(q => q.id === 'q_interest_hub')) {
            const interestQuestion = { id: 'q_interest_hub', question_text: 'Hvad interesserer personen sig for?' };
            displayInterestHub(interestQuestion);
            return;
        }

        // --- Logic for AI questions and quiz progression ---
        earlyExitButton.classList.remove('hidden');
        const scores = getProductScores();

        // Check if we should end the quiz based on scores
        if (scores.length > 1) {
            const threshold = questionHistory.length > 7 ? AGGRESSIVE_SCORE_THRESHOLD : INITIAL_SCORE_THRESHOLD;
            if (scores[0].score >= scores[1].score * threshold || remainingProducts.length <= 5) {
                displayResults(scores);
                return;
            }
        }
        
        // First, check if we have a pre-fetched question ready to go
        if (aiQuestionQueue.length > 0) {
            const nextQ = aiQuestionQueue.shift(); // Take the next question from the queue
            if (isQuestionStillRelevant(nextQ, scores.slice(0, 5).map(s => allProducts.find(p => p.id === s.id)))) {
                console.log("Displaying a pre-fetched AI question.");
                displayQuestion(nextQ);
                // Trigger a *new* batch call to keep the queue full
                triggerPredictiveBatch(scores);
                return; // We're done for this turn
            } else {
                // If the cached question is no longer relevant, clear the queue and fetch a new one
                console.log("Cached question no longer relevant. Clearing queue.");
                aiQuestionQueue = []; 
            }
        }

        // If the queue is empty, we must fetch a JIT question
        try {
            console.log("Queue is empty. Fetching JIT question.");
            showLoadingState(); // Show the loading animation

            const candidateProducts = scores.slice(0, 15).map(s => {
                const p = allProducts.find(prod => prod.id === s.id);
                return p ? { id: p.id, tags: p.tags, score: s.score } : null;
            }).filter(x => x);

            // Use our new helper function to prepare the data
            const themesWithDetails = getThemesForAI(candidateProducts);

            // The actual API call for a single question, now with a simpler payload
            const response = await fetch('/.netlify/functions/generate-ai-question', {
                method: 'POST',
                body: JSON.stringify({
                    userAnswers: userAnswers.flatMap(a => a.tags),
                    themesWithDetails // Send the processed themes instead of raw products
                })
            });

            if (!response.ok) throw new Error('AI question generation failed');
            
            const jitQuestion = await response.json();
            hideLoadingState(); // Hide the loading animation

            // --- THIS IS THE FIX ---
            // Check the properties of the question object directly.
            if (jitQuestion && jitQuestion.id && Array.isArray(jitQuestion.answers)) {
                displayQuestion(jitQuestion);
                
                // **CRITICAL STEP:** Immediately trigger the background batch call
                console.log("JIT question received. Triggering background batch call...");
                triggerPredictiveBatch(scores); 

            } else {
                // If the JIT call fails or returns invalid data, show results
                console.log("JIT call returned invalid data, showing results.");
                displayResults(scores);
            }
        } catch (error) {
            console.error("AI question generation failed, showing results instead:", error);
            hideLoadingState();
            displayResults(scores);
        }
    }

    function displayQuestion(question) {
        currentQuestion = question;
        let template;

        if (question.answers) {
            template = document.getElementById('single-choice-template').content.cloneNode(true);
            template.querySelector('.question-text').textContent = question.question_text;
            const answersContainer = template.querySelector('.answers-container');
            answersContainer.innerHTML = ''; // Clear old answers

            question.answers.forEach((answer, index) => {
                const btn = document.createElement('button');
                btn.className = "answer-btn w-full text-left bg-white p-4 rounded-lg border border-gray-200 hover:bg-gray-100 hover:border-blue-500 transition-all duration-200 ease-in-out shadow-sm";
                btn.textContent = answer.answer_text;
                
                if (answer.tags && answer.tags.includes("freetext:true")) {
                    btn.onclick = () => {
                        answersContainer.innerHTML = `
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
                    btn.onclick = () => handleAnswer(answer);
                }
                answersContainer.appendChild(btn);
            });
        } else {
            template = document.getElementById('single-choice-template').content.cloneNode(true);
            template.querySelector('.question-text').textContent = question.question_text;
        }

        questionContainer.innerHTML = '';
        questionContainer.appendChild(template);
        const wrapper = questionContainer.querySelector('.question-wrapper');
        if (wrapper) wrapper.classList.add('active');
        backButton.classList.toggle('hidden', questionHistory.length === 0);
    }
    
    function displayInterestHub(question) {
        currentQuestion = question;
        const template = document.getElementById('interest-hub-template').content.cloneNode(true);
        template.querySelector('.question-text').textContent = question.question_text;
        questionContainer.innerHTML = '';
        questionContainer.appendChild(template);
        const wrapper = questionContainer.querySelector('.question-wrapper');
        if (wrapper) wrapper.classList.add('active');
        const suggestionsEl = document.getElementById('interest-suggestions');
        const searchInput = document.getElementById('interest-search');
        const selectedEl = document.getElementById('selected-interests');
        const submitBtn = document.getElementById('interest-submit-btn');
        const autocompleteEl = document.getElementById('autocomplete-results');
        let displayedPills = [];
        let pillPool = [...interestHierarchy];
        let userSelectedSet = new Set();
        const updateSubmitButton = () => {
            submitBtn.disabled = userSelectedSet.size === 0;
        };
        const renderSuggestions = () => {
            suggestionsEl.innerHTML = '';
            displayedPills.forEach(pill => {
                const btn = document.createElement('button');
                btn.className = "interest-tag bg-blue-50 text-blue-700 border border-blue-200 px-4 py-2 rounded-full hover:bg-blue-100";
                btn.textContent = pill.name;
                btn.dataset.key = pill.key;
                btn.onclick = () => selectPill(pill);
                suggestionsEl.appendChild(btn);
            });
        };
        const addSelectedPill = (name, key) => {
            if (userSelectedSet.has(key)) return;
            userSelectedSet.add(key);
            const pillDiv = document.createElement('div');
            pillDiv.className = "selected-pill bg-blue-600 text-white px-3 py-1 rounded-full flex items-center text-sm";
            pillDiv.innerHTML = `<span>${name}</span><button class="ml-2 font-bold">&times;</button>`;
            pillDiv.querySelector('button').onclick = () => {
                userSelectedSet.delete(key);
                pillDiv.remove();
                updateSubmitButton();
            };
            selectedEl.appendChild(pillDiv);
            updateSubmitButton();
        };
        const selectPill = (pill) => {
            if (!userSelectedSet.has(pill.key)) {
                addSelectedPill(pill.name, pill.key);
            }
            const idx = displayedPills.findIndex(p => p.key === pill.key);
            if (idx > -1) {
                const hasSubs = pill.subInterests && pill.subInterests.length > 0;
                const newPill = hasSubs ? pill.subInterests[Math.floor(Math.random() * pill.subInterests.length)] : pillPool.pop();
                if (newPill) {
                    displayedPills.splice(idx, 1, newPill);
                } else {
                    displayedPills.splice(idx, 1);
                }
                renderSuggestions();
            }
            updateSubmitButton();
        };
        const initialFill = () => {
            while (displayedPills.length < 8 && pillPool.length > 0) {
                const randIndex = Math.floor(Math.random() * pillPool.length);
                displayedPills.push(pillPool.splice(randIndex, 1)[0]);
            }
            renderSuggestions();
        };
        searchInput.addEventListener('input', () => {
            const query = searchInput.value.toLowerCase();
            if (query.length < 2) {
                autocompleteEl.classList.add('hidden');
                return;
            }
            const results = allInterestTags.filter(tag => tag.toLowerCase().replace(/_/g, ' ').includes(query)).slice(0, 5);
            autocompleteEl.innerHTML = '';
            if (results.length > 0) {
                results.forEach(result => {
                    const div = document.createElement('div');
                    div.className = 'p-2 hover:bg-gray-100 cursor-pointer';
                    div.textContent = result.replace(/_/g, ' ');
                    div.onclick = () => {
                        addSelectedPill(div.textContent, `interest:${result}`);
                        searchInput.value = '';
                        autocompleteEl.classList.add('hidden');
                    };
                    autocompleteEl.appendChild(div);
                });
                autocompleteEl.classList.remove('hidden');
            } else {
                autocompleteEl.classList.add('hidden');
            }
        });
        initialFill();
        submitBtn.onclick = () => {
            if (userSelectedSet.size === 0) return;
            const selectedTags = Array.from(userSelectedSet);
            const answer = { answer_text: 'Valgte interesser', tags: selectedTags };
            handleAnswer(answer);
        };
        backButton.classList.toggle('hidden', questionHistory.length === 0);
    }
    
    function showLoadingState(message = 'Et øjeblik, jeg tænker lige...') {
        questionContainer.innerHTML = ''; // Clear previous content
        const loaderTemplate = document.getElementById('loading-template').content.cloneNode(true);
        loaderTemplate.querySelector('h2').textContent = message;
        questionContainer.appendChild(loaderTemplate);
        backButton.classList.add('hidden');
        earlyExitButton.classList.add('hidden');
    }

    function hideLoadingState() {
        // Find the loading indicator within questionContainer and remove it
        const loader = questionContainer.querySelector('#loading-indicator-wrapper'); // Assuming the template has a wrapper with this ID
        if (loader) {
            loader.remove();
        }
        
        // Unhide early exit if applicable
        if (questionHistory.length > 2) {
            earlyExitButton.classList.remove('hidden');
        }
    }

    function getProductScores() {
        const allAnswerTags = userAnswers.flatMap(a => a.tags);
        if (allAnswerTags.length === 0) {
            return remainingProducts.map(p => ({ id: p.id, score: 0 })).sort((a,b) => b.score - a.score);
        }
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

    function displayResults(scores) {
        questionContainer.classList.add('hidden');
        resultsSection.classList.remove('hidden');
        resultsSection.classList.add('fade-in');
        backButton.classList.add('hidden');
        earlyExitButton.classList.add('hidden');

        const top5 = scores.slice(0, 5).map(s => allProducts.find(p => p.id === s.id)).filter(p => p);
        
        primaryResultEl.innerHTML = top5.length > 0 ? createProductCard(top5[0], true) : '<p>Ingen gaver fundet. Prøv igen.</p>';
        secondaryResultsEl.innerHTML = '';
        if (top5.length > 1) {
            top5.slice(1).forEach(p => {
                secondaryResultsEl.innerHTML += createProductCard(p, false);
            });
        }
        currentRecommendationId = top5.length ? top5[0].id : null;
        document.querySelectorAll('.report-problem-btn').forEach(btn => {
            btn.addEventListener('click', () => openFlagModal(btn.getAttribute('data-product')));
        });
        feedbackContainer.classList.remove('hidden');
    }

    function createProductCard(product, isPrimary) {
        if (!product) return '';
        const cardClass = isPrimary ? "bg-white p-6 rounded-lg shadow-lg flex flex-col md:flex-row items-center gap-6" : "bg-white p-4 rounded-lg shadow-md flex items-center gap-4";
        const imageClass = isPrimary ? "w-full md:w-1/3 h-64 object-cover rounded-md" : "w-24 h-24 object-cover rounded-md";
        const titleClass = isPrimary ? "text-3xl font-bold text-gray-900" : "text-xl font-semibold text-gray-800";
        const descriptionClass = isPrimary ? "text-gray-700 mt-2 leading-relaxed" : "text-gray-600 text-sm mt-1";
        const priceFormatted = product.price.toFixed(2).replace('.', ',') + ' kr.';
        return `
            <div class="${cardClass}">
                <img src="${product.image}" alt="${product.name}" class="${imageClass}">
                <div class="flex-1 text-center md:text-left">
                    <h3 class="${titleClass}">${product.name}</h3>
                    <p class="text-lg text-blue-600 font-semibold mt-1">${priceFormatted}</p>
                    ${isPrimary ? `<p class="${descriptionClass}">${product.description}</p>` : ''}
                    <a href="${product.url}" target="_blank" rel="noopener noreferrer" class="cta-btn inline-block mt-4 px-6 py-3 text-white bg-blue-600 rounded-md hover:bg-blue-700">Se gaven</a>
                    <p class="text-sm text-gray-500 mt-2 cursor-pointer report-problem-btn" data-product="${product.id}">Rapportér et problem</p>
                </div>
            </div>
        `;
    }

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

    function handleAnswer(answer) {
        const prevQuestion = currentQuestion;
        const answerEntry = {
            question_text: prevQuestion.question_text,
            answer_text: answer.answer_text,
            tags: answer.tags || []
        };
        userAnswers.push(answerEntry);
        questionHistory.push(prevQuestion);
        recalculateRemainingProducts();
        selectNextQuestion();
    }

    async function handleFreeTextSubmit() {
        const inputEl = document.getElementById('freetext-input');
        const freeText = inputEl.value.trim();
        if (freeText.length === 0) return;
        showLoadingState('Analyserer besvarelsen...');
        try {
            const response = await fetch('/.netlify/functions/interpret-freetext', {
                method: 'POST',
                body: JSON.stringify({
                    userAnswers: userAnswers.flatMap(a => a.tags),
                    freeText: freeText
                })
            });
            if (!response.ok) throw new Error('AI free-text interpretation failed');
            const result = await response.json();
            const freeTextAnswer = { answer_text: `Brugerinput: ${freeText}`, tags: result.tags || [] };
            handleAnswer(freeTextAnswer);
        } catch (error) {
            console.error("Free-text interpretation failed:", error);
            hideLoadingState();
            selectNextQuestion();
        }
    }

    async function handleShare() {
        try {
            const scores = getProductScores();
            if (scores.length === 0) throw new Error("No products to share.");
            const primaryProductId = scores[0].id;
            const response = await fetch('/.netlify/functions/create-share-link', {
                method: 'POST',
                body: JSON.stringify({ product_id: primaryProductId, quiz_answers: userAnswers })
            });
            if (!response.ok) throw new Error('Failed to create share link');
            const { shareId } = await response.json();
            const shareUrl = `${window.location.origin}/?share=${shareId}`;
            shareLinkInput.value = shareUrl;
            shareModal.classList.remove('hidden');
            copyFeedback.textContent = '';
        } catch (error) {
            console.error('Share link creation failed:', error);
            alert('Kunne ikke oprette delingslink. Prøv venligst igen.');
        }
    }

    function copyShareLink() {
        shareLinkInput.select();
        document.execCommand('copy');
        copyFeedback.textContent = 'Link kopieret!';
        setTimeout(() => { copyFeedback.textContent = ''; }, 2000);
    }

    function openFlagModal(productId) {
        const reason = prompt("Rapportér et problem med produktet. Vælg grund:\n- Link virker ikke\n- Billedet mangler\n- Prisen passer ikke\n- Andet (uddyb)");
        if (!reason) return;
        fetch('/.netlify/functions/submit-flag', {
            method: 'POST',
            body: JSON.stringify({ productId: productId, reason: reason, quizAnswers: userAnswers })
        })
        .then(() => alert('Tak for din feedback!'))
        .catch(err => {
            console.error('Error reporting problem:', err);
            alert('Kunne ikke rapportere problemet. Prøv igen senere.');
        });
    }

    // --- NEWLY ADDED/FIXED FUNCTIONS ---
    
    function goBack() {
        if (questionHistory.length === 0) return;
        
        // Remove the last answer and the question that prompted it
        userAnswers.pop();
        questionHistory.pop();
        
        // Get the "new" current question from the end of the history
        const prevQuestion = questionHistory[questionHistory.length - 1];
        
        // If results were showing, hide them and show the quiz
        if (!resultsSection.classList.contains('hidden')) {
            resultsSection.classList.add('hidden');
            quizSection.classList.remove('hidden');
        }

        // We need to re-render the previous question
        if (prevQuestion) {
            if (prevQuestion.id === 'q_interest_hub') {
                displayInterestHub(prevQuestion);
            } else {
                displayQuestion(prevQuestion);
            }
        } else {
            // If there's no previous question, go back to the start
            startQuiz();
        }
    }

    function triggerPredictiveBatch(scores, cacheKey = null) {
        console.log("Triggering predictive batch call...");
        const candidateProducts = scores.slice(0, 15).map(s => {
            const p = allProducts.find(prod => prod.id === s.id);
            return p ? { id: p.id, tags: p.tags, score: s.score } : null;
        }).filter(x => x);

        if (candidateProducts.length > 0) {
            // Use our new helper function here as well
            const themesWithDetails = getThemesForAI(candidateProducts);

            const payload = {
                userAnswers: userAnswers.flatMap(a => a.tags),
                themesWithDetails // Send the processed themes
            };
            if(cacheKey) payload.cacheKey = cacheKey;

            fetch('/.netlify/functions/generate-question-batch', {
                method: 'POST',
                body: JSON.stringify(payload)
            })
            .then(res => res.json())
            .then(data => {
                if (data.questions && Array.isArray(data.questions)) {
                    aiQuestionQueue.push(...data.questions);
                    console.log(`Added ${data.questions.length} questions to the prefetch queue.`);
                }
            })
            .catch(error => {
                console.warn('Predictive batch call failed:', error);
            });
        }
    }

    // On page load, initialize and handle shared result if present
    setupDOMElements();
    attachEventListeners();
    const params = new URLSearchParams(window.location.search);
    if (params.has('share')) {
        const shareId = params.get('share');
        showLoadingState('Henter delt resultat...');
        fetch(`/.netlify/functions/get-shared-result?id=${shareId}`)
            .then(res => {
                if (!res.ok) throw new Error("Shared result not found or invalid.");
                return res.json();
            })
            .then(data => {
                if (!data.product_id || !data.quiz_answers) throw new Error("Invalid shared data");
                initializeQuizAssets().then(() => {
                    userAnswers = Array.isArray(data.quiz_answers) ? data.quiz_answers : Object.values(data.quiz_answers);
                    recalculateRemainingProducts();
                    const finalScores = getProductScores();
                    displayResults(finalScores);
                    heroSection.classList.add('hidden');
                    quizSection.classList.remove('hidden');
                });
            })
            .catch(err => {
                console.error("Failed to load shared result:", err);
                hideLoadingState();
                alert("Ugyldigt eller udløbet delingslink.");
            });
    }
});
