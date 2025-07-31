// /ui-handler.js
import * as engine from './quiz-engine.js';

// --- DOM ELEMENTS & UI STATE---
let heroSection, quizSection, questionContainer, backButton, earlyExitButton, resultsSection;
let primaryResultEl, secondaryResultsEl, restartButton, shareButton;
let feedbackContainer, starRatingContainer;
let howItWorksBtn, closeModalBtn, modal;
let shareModal, closeShareModalBtn, shareLinkInput, copyShareLinkBtn, copyFeedback;
let currentRecommendationId = null; 

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    setupDOMElements();
    attachEventListeners();
    const params = new URLSearchParams(window.location.search);
    if (params.has('share')) {
        handleSharedResult(params.get('share'));
    }
});

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

function attachEventListeners() {
    document.querySelectorAll('.start-quiz-btn').forEach(btn => btn.addEventListener('click', startQuiz));
    backButton.addEventListener('click', goBack);
    restartButton.addEventListener('click', startQuiz);
    earlyExitButton.addEventListener('click', () => processEngineResponse({ type: 'results', data: engine.getProductScores() }));
    howItWorksBtn.addEventListener('click', () => modal.classList.remove('hidden'));
    closeModalBtn.addEventListener('click', () => modal.classList.add('hidden'));
    modal.addEventListener('click', e => { if (e.target === modal) modal.classList.add('hidden'); });
    shareButton.addEventListener('click', handleShare);
    closeShareModalBtn.addEventListener('click', () => shareModal.classList.add('hidden'));
    shareModal.addEventListener('click', e => { if (e.target === shareModal) shareModal.classList.add('hidden'); });
    copyShareLinkBtn.addEventListener('click', copyShareLink);
    starRatingContainer.querySelectorAll('button').forEach(btn => {
        btn.addEventListener('click', () => {
            const rating = parseInt(btn.getAttribute('data-value'));
            submitRating(rating);
        });
    });
}


// --- CORE UI FLOW ---
async function startQuiz() {
    heroSection.classList.add('hidden');
    resultsSection.classList.add('hidden');
    quizSection.classList.remove('hidden');
    quizSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    showLoadingState('Indlæser guiden...');

    try {
        await engine.initializeQuizAssets();
        const nextStep = engine.resetQuizState();
        processEngineResponse(nextStep);
    } catch (error) {
        questionContainer.innerHTML = `<h2 class="text-2xl font-bold text-center text-red-600">Fejl: Kunne ikke indlæse quizzen. Prøv venligst igen senere.</h2>`;
    }
}

async function processEngineResponse(responsePromise) {
    showLoadingState();
    const response = await Promise.resolve(responsePromise);
    hideLoadingState();

    const isFirstQuestion = response.data?.id === 'q_relation';
    backButton.classList.toggle('hidden', isFirstQuestion || !response.data);
    earlyExitButton.classList.toggle('hidden', response.type !== 'question' && response.type !== 'interest_hub');

    switch (response.type) {
        case 'question':
            displayQuestion(response.data);
            break;
        case 'interest_hub':
            displayInterestHub(response.data);
            break;
        case 'results':
            displayResults(response.data);
            break;
        case 'restart':
            await startQuiz();
            break;
        case 'start':
            heroSection.classList.remove('hidden');
            quizSection.classList.add('hidden');
            break;
    }
}

function goBack() {
    const response = engine.goBackLogic();
    processEngineResponse(response);
}

// --- RENDERING FUNCTIONS ---
function showLoadingState(message = 'Et øjeblik, jeg tænker lige...') {
    questionContainer.innerHTML = '';
    const loaderTemplate = document.getElementById('loading-template').content.cloneNode(true);
    loaderTemplate.querySelector('h2').textContent = message;
    questionContainer.appendChild(loaderTemplate);
    backButton.classList.add('hidden');
    earlyExitButton.classList.add('hidden');
}

function hideLoadingState() {
    const loader = questionContainer.querySelector('#loading-indicator-wrapper');
    if (loader) loader.remove();
}

function displayQuestion(question) {
    const template = document.getElementById('single-choice-template').content.cloneNode(true);
    template.querySelector('.question-text').textContent = question.question_text;
    const answersContainer = template.querySelector('.answers-container');
    answersContainer.innerHTML = '';

    question.answers.forEach(answer => {
        const btn = document.createElement('button');
        btn.className = "answer-btn w-full text-left bg-white p-4 rounded-lg border border-gray-200 hover:bg-gray-100 hover:border-blue-500 transition-all duration-200 ease-in-out shadow-sm";
        btn.textContent = answer.answer_text;
        
        if (answer.tags?.includes("freetext:true")) {
            btn.onclick = () => showFreeTextInput(answersContainer);
        } else {
            btn.onclick = () => processEngineResponse(engine.handleAnswer(answer));
        }
        answersContainer.appendChild(btn);
    });
    
    questionContainer.innerHTML = '';
    questionContainer.appendChild(template);

    // --- THIS IS THE FIX ---
    // We find the newly added question wrapper and add the 'active' class to make it visible.
    const wrapper = questionContainer.querySelector('.question-wrapper');
    if (wrapper) {
        wrapper.classList.add('active');
    }
}

function displayInterestHub(question) {
    const template = document.getElementById('interest-hub-template').content.cloneNode(true);
    template.querySelector('.question-text').textContent = question.question_text;
    questionContainer.innerHTML = '';
    questionContainer.appendChild(template);

    // --- THIS IS THE FIX ---
    // We do the same for the interest hub to ensure it becomes visible.
    const wrapper = questionContainer.querySelector('.question-wrapper');
    if (wrapper) {
        wrapper.classList.add('active');
    }
    
    // The rest of the original, complex logic for the hub remains the same...
    const suggestionsEl = document.getElementById('interest-suggestions');
    const searchInput = document.getElementById('interest-search');
    const selectedEl = document.getElementById('selected-interests');
    const submitBtn = document.getElementById('interest-submit-btn');
    const autocompleteEl = document.getElementById('autocomplete-results');
    let displayedPills = [];
    let pillPool = [...engine.interestHierarchy];
    let userSelectedSet = new Set();
    
    const updateSubmitButton = () => { submitBtn.disabled = userSelectedSet.size === 0; };
    
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
        pillDiv.dataset.key = key;
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
        const results = engine.allInterestTags.filter(tag => tag.toLowerCase().replace(/_/g, ' ').includes(query)).slice(0, 5);
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
        const answer = { answer_text: 'Valgte interesser', tags: Array.from(userSelectedSet) };
        processEngineResponse(engine.handleAnswer(answer));
    };
}
    
    searchInput.addEventListener('input', () => {
        const query = searchInput.value.toLowerCase();
        if (query.length < 2) {
            autocompleteEl.classList.add('hidden');
            return;
        }
        const results = engine.allInterestTags.filter(tag => tag.toLowerCase().replace(/_/g, ' ').includes(query)).slice(0, 5);
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
        const answer = { answer_text: 'Valgte interesser', tags: Array.from(userSelectedSet) };
        processEngineResponse(engine.handleAnswer(answer));
    };
}

function displayResults(scores) {
    questionContainer.classList.add('hidden');
    resultsSection.classList.remove('hidden');
    resultsSection.classList.add('fade-in');
    backButton.classList.add('hidden');
    earlyExitButton.classList.add('hidden');

    const top5 = scores.slice(0, 5).map(s => {
        return engine.allProducts.find(p => p.id === s.id);
    }).filter(p => p);
    
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

// --- EVENT HANDLERS & HELPERS ---
function showFreeTextInput(container) {
    container.innerHTML = `<div class="w-full"><textarea id="freetext-input" maxlength="250" class="w-full p-3 border border-gray-300 rounded-md"></textarea><button id="freetext-submit" class="cta-btn w-full mt-2">Send</button></div>`;
    document.getElementById('freetext-submit').onclick = () => {
        const freeText = document.getElementById('freetext-input').value.trim();
        if (freeText) {
            processEngineResponse(engine.handleFreeText(freeText));
        }
    };
}

function submitRating(rating) {
    if (!currentRecommendationId || !rating) return;
    fetch('/.netlify/functions/submit-rating', {
        method: 'POST',
        body: JSON.stringify({ productId: currentRecommendationId, rating: rating })
    }).catch(err => console.error('Rating submission failed:', err));
    starRatingContainer.querySelectorAll('button').forEach(b => b.classList.remove('selected'));
    starRatingContainer.querySelector(`button[data-value="${rating}"]`).classList.add('selected');
}

async function handleShare() {
    try {
        const scores = engine.getProductScores();
        if (scores.length === 0) throw new Error("No products to share.");
        const primaryProductId = scores[0].id;
        const response = await fetch('/.netlify/functions/create-share-link', {
            method: 'POST',
            body: JSON.stringify({ product_id: primaryProductId, quiz_answers: engine.userAnswers })
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
        body: JSON.stringify({ productId: productId, reason: reason, quizAnswers: engine.userAnswers })
    })
    .then(() => alert('Tak for din feedback!'))
    .catch(err => {
        console.error('Error reporting problem:', err);
        alert('Kunne ikke rapportere problemet. Prøv igen senere.');
    });
}

function handleSharedResult(shareId) {
    showLoadingState('Henter delt resultat...');
    fetch(`/.netlify/functions/get-shared-result?id=${shareId}`)
        .then(res => {
            if (!res.ok) throw new Error("Shared result not found or invalid.");
            return res.json();
        })
        .then(data => {
            if (!data.product_id || !data.quiz_answers) throw new Error("Invalid shared data");
            engine.initializeQuizAssets().then(() => {
                engine.userAnswers = Array.isArray(data.quiz_answers) ? data.quiz_answers : Object.values(data.quiz_answers);
                engine.recalculateRemainingProducts();
                const finalScores = engine.getProductScores();
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
