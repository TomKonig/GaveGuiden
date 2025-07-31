// /ui-handler.js
import * as engine from './quiz-engine.js';

// --- DOM ELEMENTS ---
let heroSection, quizSection, questionContainer, backButton, earlyExitButton, resultsSection;
let primaryResultEl, secondaryResultsEl, restartButton, shareButton;
let feedbackContainer, starRatingContainer;
let howItWorksBtn, closeModalBtn, modal;
let shareModal, closeShareModalBtn, shareLinkInput, copyShareLinkBtn, copyFeedback;
let currentRecommendationId = null; // Track primary recommendation for feedback

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    setupDOMElements();
    attachEventListeners();
    handleSharedResult();
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
        btn.addEventListener('click', () => submitRating(parseInt(btn.getAttribute('data-value'))));
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
    } finally {
        hideLoadingState();
    }
}

async function processEngineResponse(response) {
    showLoadingState(); // Show loader while processing
    const { type, data } = await Promise.resolve(response); // Handle sync/async responses
    hideLoadingState();

    backButton.classList.toggle('hidden', data?.id === 'q_relation' || !data);
    earlyExitButton.classList.toggle('hidden', type !== 'question' && type !== 'interest_hub');

    switch (type) {
        case 'question':
            displayQuestion(data);
            break;
        case 'interest_hub':
            displayInterestHub(data);
            break;
        case 'results':
            displayResults(data);
            break;
        case 'restart':
            startQuiz();
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
        btn.className = "answer-btn w-full text-left bg-white p-4 rounded-lg border border-gray-200 hover:bg-gray-100 hover:border-blue-500 transition-all";
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
}

function displayInterestHub(question) {
    const template = document.getElementById('interest-hub-template').content.cloneNode(true);
    template.querySelector('.question-text').textContent = question.question_text;
    questionContainer.innerHTML = '';
    questionContainer.appendChild(template);
    
    // Simplified: Hooking up the submit button. The complex internal logic of the hub remains the same.
    document.getElementById('interest-submit-btn').onclick = () => {
        const selectedEl = document.getElementById('selected-interests');
        const selectedTags = Array.from(selectedEl.querySelectorAll('.selected-pill')).map(p => p.dataset.key);
        if (selectedTags.length > 0) {
            processEngineResponse(engine.handleAnswer({ answer_text: 'Valgte interesser', tags: selectedTags }));
        }
    };
}

function displayResults(scores) {
    questionContainer.classList.add('hidden');
    resultsSection.classList.remove('hidden');
    backButton.classList.add('hidden');
    earlyExitButton.classList.add('hidden');
    
    const top5 = scores.slice(0, 5).map(s => engine.allProducts.find(p => p.id === s.id)).filter(p => p);
    
    primaryResultEl.innerHTML = top5.length > 0 ? createProductCard(top5[0], true) : '<p>Ingen gaver fundet. Prøv igen.</p>';
    secondaryResultsEl.innerHTML = top5.length > 1 ? top5.slice(1).map(p => createProductCard(p, false)).join('') : '';
    
    currentRecommendationId = top5.length ? top5[0].id : null;
    document.querySelectorAll('.report-problem-btn').forEach(btn => {
        btn.addEventListener('click', () => openFlagModal(btn.getAttribute('data-product')));
    });
    feedbackContainer.classList.remove('hidden');
}

function createProductCard(product, isPrimary) {
    // This function remains largely the same as in the original file
    const cardClass = isPrimary ? "bg-white p-6 rounded-lg shadow-lg flex flex-col md:flex-row items-center gap-6" : "bg-white p-4 rounded-lg shadow-md flex items-center gap-4";
    const imageClass = isPrimary ? "w-full md:w-1/3 h-64 object-cover rounded-md" : "w-24 h-24 object-cover rounded-md";
    const titleClass = isPrimary ? "text-3xl font-bold text-gray-900" : "text-xl font-semibold text-gray-800";
    const priceFormatted = product.price.toFixed(2).replace('.', ',') + ' kr.';
    return `<div class="${cardClass}"><img src="${product.image}" alt="${product.name}" class="${imageClass}"><div class="flex-1 text-center md:text-left"><h3 class="${titleClass}">${product.name}</h3><p class="text-lg text-blue-600 font-semibold mt-1">${priceFormatted}</p>${isPrimary ? `<p class="text-gray-700 mt-2 leading-relaxed">${product.description}</p>` : ''}<a href="${product.url}" target="_blank" rel="noopener noreferrer" class="cta-btn inline-block mt-4 px-6 py-3">Se gaven</a><p class="text-sm text-gray-500 mt-2 cursor-pointer report-problem-btn" data-product="${product.id}">Rapportér et problem</p></div></div>`;
}

// --- EVENT HANDLERS & HELPERS ---
function showFreeTextInput(container) {
    container.innerHTML = `<div class="w-full"><textarea id="freetext-input" maxlength="250" class="w-full p-3 border rounded-md"></textarea><button id="freetext-submit" class="cta-btn w-full mt-2">Send</button></div>`;
    document.getElementById('freetext-submit').onclick = () => {
        const freeText = document.getElementById('freetext-input').value.trim();
        if (freeText) processEngineResponse(engine.handleFreeText(freeText));
    };
}

function submitRating(rating) {
    if (!currentRecommendationId || !rating) return;
    fetch('/.netlify/functions/submit-rating', {
        method: 'POST',
        body: JSON.stringify({ productId: currentRecommendationId, rating: rating })
    }).catch(err => console.error('Rating submission failed:', err));
    starRatingContainer.querySelectorAll('button').forEach(b => b.classList.remove('selected'));
    starRatingContainer.querySelector(`[data-value="${rating}"]`).classList.add('selected');
}

// Share, flag, and other utility functions remain the same as the original file
// ...
