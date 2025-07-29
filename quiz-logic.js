// /quiz-logic.js
document.addEventListener('DOMContentLoaded', () => {
    // --- GLOBAL STATE ---
    let allProducts = [];
    let allQuestions = [];
    let interestHierarchy = [];
    let allInterestTags = [];
    
    let questionHistory = [];
    let userAnswers = [];
    let aiQuestionQueue = [];
    let currentQuestion = null;
    let isQuizInitialized = false;
    let currentRecommendationId = null;  // track primary recommendation product ID for feedback
    
    // --- DOM ELEMENTS ---
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
            allQuestions = await questionsRes.json();
            interestHierarchy = await interestsRes.json();
            allInterestTags = standardizationRes.ok ? (await standardizationRes.json()).interest : [];
            isQuizInitialized = true;
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
        closeShareModalBtn.addEventListener('click', () => shareModal.classList.remove('visible'));
        shareModal.addEventListener('click', e => { if (e.target === shareModal) shareModal.classList.remove('visible'); });
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

    function goBack() {
        if (questionHistory.length === 0) return;

        // Remove the last answer and question from history
        userAnswers.pop();
        const lastQuestion = questionHistory.pop();

        // If going back from the results view, hide it and show the quiz
        if (!resultsSection.classList.contains('hidden')) {
            resultsSection.classList.add('hidden');
            questionContainer.classList.remove('hidden');
        }

        // If we are back to the first question, hide the back button
        if (questionHistory.length === 0) {
            backButton.classList.add('hidden');
        }

        // Re-display the previous question
        displayQuestion(lastQuestion);
    }

    function triggerPredictiveBatch(scores) {
        // This is a "fire-and-forget" call to warm up the AI cache
        const candidateProducts = scores.slice(0, 20).map(s => {
            const p = allProducts.find(prod => prod.id === s.id);
            return p ? { id: p.id, tags: p.tags, score: s.score } : null;
        }).filter(x => x);

        if (candidateProducts.length > 0) {
            fetch('/.netlify/functions/generate-question-batch', {
                method: 'POST',
                body: JSON.stringify({
                    userAnswers: userAnswers.flatMap(a => a.tags),
                    candidateProducts
                })
            }).catch(error => {
                // We don't block the user on this, but we log the error
                console.warn('Predictive batch call failed:', error);
            });
        }
    }
    
    async function startQuiz() {
        // If starting from scratch or restarting, reset state
        heroSection.classList.add('hidden');
        quizSection.classList.remove('hidden');
        quizSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        showLoadingState('Indlæser guiden.');
        await initializeQuizAssets();
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
    
    function switchView(sectionId) {
        // Utility to switch visible view (unused in current logic, but here for completeness)
        document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
        const target = document.getElementById(sectionId);
        if (target) target.classList.add('active');
    }
    
    function recalculateRemainingProducts() {
        // Filter remainingProducts based on userAnswers tags (e.g., strict price filters, interest filters)
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
        const scores = calculateScores();
        const topProductIds = scores.slice(0, 10).map(s => s.id);

        let usedDifferentiators = new Set(questionHistory.map(q => q.differentiator).filter(d => d));

        // Find the best static question that hasn't been used
        let nextQuestion = findBestDifferentiatingQuestion(topProductIds, usedDifferentiators);

        if (nextQuestion) {
            displayQuestion(nextQuestion);
            // Fire background batch call when a static question is found
            triggerPredictiveBatch(scores);
        } else {
            // No suitable static question, call the AI for a JIT question
            console.log("No suitable static question, calling AI for a single question...");
            displayLoading(true);

            const aiQuestion = await fetchAIQuestion(scores); // JIT call happens here
            displayLoading(false);

            if (aiQuestion) {
                // AI returned a valid question
                allQuestions.push(aiQuestion);
                displayQuestion(aiQuestion);

                // NOW, fire the background batch call after the JIT call is complete
                console.log("JIT question received. Triggering background batch call...");
                triggerPredictiveBatch(scores);
            } else {
                // AI failed, fallback to showing results
                console.log("AI failed to generate a question. Showing results instead.");
                displayResults();
            }
        }
    }
    
    function displayQuestion(question) {
        currentQuestion = question;
        // Use appropriate template
        let template;
        if (question.answers) {
            // Standard single/multi-choice question
            template = document.getElementById('single-choice-template').content.cloneNode(true);
            template.querySelector('.question-text').textContent = question.question_text;
            const answersContainer = template.querySelector('.answers-container');
            question.answers.forEach((answer, index) => {
                if (question.is_multiselect) {
                    // For multi-select questions (if any in static questions)
                    const wrapper = document.createElement('div');
                    wrapper.className = "answer-btn w-full text-left bg-white p-4 rounded-lg border border-gray-200 hover:bg-gray-100 hover:border-blue-500 transition-all duration-200 ease-in-out shadow-sm cursor-pointer flex items-center";
                    wrapper.innerHTML = `<input type="checkbox" id="answer-${index}" class="mr-3 h-5 w-5 rounded border-gray-300 text-blue-600 pointer-events-none"><label for="answer-${index}" class="cursor-pointer flex-1">${answer.answer_text}</label>`;
                    wrapper.onclick = () => {
                        const cb = wrapper.querySelector('input');
                        cb.checked = !cb.checked;
                        cb.dispatchEvent(new Event('change', { bubbles: true }));
                    };
                    wrapper.querySelector('input').addEventListener('change', e => {
                        if (e.target.checked) {
                            selectedMultiAnswers.add(index);
                            wrapper.classList.add('border-blue-500', 'bg-blue-50');
                        } else {
                            selectedMultiAnswers.delete(index);
                            wrapper.classList.remove('border-blue-500', 'bg-blue-50');
                        }
                    });
                    answersContainer.appendChild(wrapper);
                } else {
                    const btn = document.createElement('button');
                    btn.className = "answer-btn w-full text-left bg-white p-4 rounded-lg border border-gray-200 hover:bg-gray-100 hover:border-blue-500 transition-all duration-200 ease-in-out shadow-sm";
                    btn.textContent = answer.answer_text;
                    if (answer.tags.includes("freetext:true")) {
                        btn.onclick = () => {
                            // Show free-text input field
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
                }
            });
        } else {
            // In case question object doesn't have answers (should not happen normally)
            template = document.getElementById('single-choice-template').content.cloneNode(true);
            template.querySelector('.question-text').textContent = question.question_text;
        }
        // Render the question template
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
        // Get interactive elements
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
            // Adaptive replacement: show a subInterest or a new pill
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
        // Autocomplete search
        searchInput.addEventListener('input', () => {
            const query = searchInput.value.toLowerCase();
            if (query.length < 2) {
                autocompleteEl.classList.add('hidden');
                return;
            }
            const results = allInterestTags.filter(tag => tag.toLowerCase().includes(query)).slice(0, 5);
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
        // Initialize suggestions and button
        initialFill();
        submitBtn.onclick = () => {
            if (userSelectedSet.size === 0) return;
            const selectedTags = Array.from(userSelectedSet);
            const answer = {
                answer_text: 'Valgte interesser',
                tags: selectedTags
            };
            handleAnswer(answer);
        };
        backButton.classList.toggle('hidden', questionHistory.length === 0);
    }
    
    function showLoadingState(message = 'Et øjeblik, jeg tænker lige...') {
        questionContainer.innerHTML = '';
        const loaderTemplate = document.getElementById('loading-template').content.cloneNode(true);
        loaderTemplate.querySelector('h2').textContent = message;
        questionContainer.appendChild(loaderTemplate);
        backButton.classList.add('hidden');
        earlyExitButton.classList.add('hidden');
    }
    
    function hideLoadingState() {
        // Once AI response arrives or we move on, allow early exit again if applicable
        earlyExitButton.classList.remove('hidden');
    }
    
    function getProductScores() {
        const allAnswerTags = userAnswers.flatMap(a => a.tags);
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
        const top5 = scores.slice(0, 5).map(s => allProducts.find(p => p.id === s.id)).filter(p => p);
        primaryResultEl.innerHTML = createProductCard(top5[0], true);
        secondaryResultsEl.innerHTML = '';
        if (top5.length > 1) {
            top5.slice(1).forEach(p => {
                secondaryResultsEl.innerHTML += createProductCard(p, false);
            });
        }
        // Store current recommendation's primary product ID for share/feedback
        currentRecommendationId = top5.length ? top5[0].id : null;
        // Attach report-problem events for each result card
        document.querySelectorAll('.report-problem-btn').forEach(btn => {
            btn.addEventListener('click', () => openFlagModal(btn.getAttribute('data-product')));
        });
        // Show feedback (rating) section
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
        const topProductTags = new Set(topProductsList.flatMap(p => p.tags));
        let differentiatingAnswers = 0;
        question.answers.forEach(ans => {
            if (ans.tags.some(tag => topProductTags.has(tag))) {
                differentiatingAnswers++;
            }
        });
        // relevant if at least two answer options correspond to different tags present in top products
        return differentiatingAnswers >= 2;
    }
    
    function handleAnswer(answer) {
        const prevQuestion = currentQuestion;
        const answerEntry = {
            question_text: prevQuestion.question_text,
            answer_text: answer.answer_text,
            tags: answer.tags || []
        };
        // Add to history and answers
        userAnswers.push(answerEntry);
        questionHistory.push(prevQuestion);
        recalculateRemainingProducts();
        // If an AI-generated question was just answered, trigger background fetch for next batch
        if (prevQuestion.id && prevQuestion.id.startsWith('q_ai')) {
            const scores = getProductScores();
            triggerPredictiveBatch(scores);
        }
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
            const newTags = await response.json();
            const freeTextAnswer = { answer_text: `Brugerinput: ${freeText}`, tags: newTags };
            handleAnswer(freeTextAnswer);
        } catch (error) {
            console.error("Free-text interpretation failed:", error);
            selectNextQuestion();
        }
    }
    
    async function handleShare() {
        try {
            const primaryProductId = getProductScores()[0].id;
            const response = await fetch('/.netlify/functions/create-share-link', {
                method: 'POST',
                body: JSON.stringify({ product_id: primaryProductId, quiz_answers: userAnswers })
            });
            if (!response.ok) throw new Error('Failed to create share link');
            const { shareId } = await response.json();
            const shareUrl = `${window.location.origin}/?share=${shareId}`;
            shareLinkInput.value = shareUrl;
            shareModal.classList.add('visible');
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
        // Simple prompt for now – ideally would be a nice modal form
        const reason = prompt("Rapportér et problem med produktet. Vælg grund:\n- Link virker ikke\n- Billedet mangler\n- Prisen passer ikke\n- Andet (uddyb)");
        if (!reason) return;
        // Submit flag via API
        fetch('/.netlify/functions/submit-flag', {
            method: 'POST',
            body: JSON.stringify({ productId: productId, reason: reason, quizAnswers: userAnswers })
        })
        .then(res => res.json())
        .then(data => {
            alert('Tak for din feedback!');  // Acknowledge submission
        })
        .catch(err => {
            console.error('Error reporting problem:', err);
            alert('Kunne ikke rapportere problemet. Prøv igen senere.');
        });
    }
    
    // On page load, initialize and handle shared result if present
    setupDOMElements();
    attachEventListeners();
    const params = new URLSearchParams(window.location.search);
    if (params.has('share')) {
        // If a share ID is present in URL, load the shared result
        const shareId = params.get('share');
        fetch(`/.netlify/functions/get-shared-result?id=${shareId}`)
            .then(res => res.json())
            .then(data => {
                if (!data.product_id || !data.quiz_answers) throw new Error("Invalid shared data");
                // Initialize quiz (load assets) then use shared answers to compute results
                initializeQuizAssets().then(() => {
                    userAnswers = Array.isArray(data.quiz_answers) ? data.quiz_answers : Object.values(data.quiz_answers);
                    // Recalculate products and display results directly
                    recalculateRemainingProducts();
                    const finalScores = getProductScores();
                    displayResults(finalScores);
                    // Hide the start screen since we're directly showing results
                    heroSection.classList.add('hidden');
                    quizSection.classList.remove('hidden');
                });
            })
            .catch(err => {
                console.error("Failed to load shared result:", err);
                alert("Ugyldigt eller udløbet delingslink.");
            });
    }
});
