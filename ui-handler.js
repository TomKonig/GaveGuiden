// /ui-handler.js
import { initializeQuizAssets, startQuiz, handleAnswer, getProductScores, goBackLogic } from './quiz-engine.js';

// --- DOM ELEMENTS & UI STATE ---
let heroSection, quizSection, questionContainer, backButton, earlyExitButton, resultsSection;
let primaryResultEl, secondaryResultsEl, restartButton, shareButton;
let feedbackContainer, starRatingContainer;
let howItWorksBtn, closeModalBtn, modal;
let shareModal, closeShareModalBtn, shareLinkInput, copyShareLinkBtn, copyFeedback;
let interestHubContainer, interestSearchInput, interestPillsContainer, showMoreInterestsBtn, continueFromHubBtn;

let allInterests = [];
let displayedInterests = 15;
let selectedInterests = {}; // For the hub

let currentQuestion = null; // Store the current question object for handleAnswer
let currentRecommendationId = null; 
let allProducts = [];

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', async () => {
    setupDOMElements();
    attachEventListeners();
    try {
        await initializeQuizAssets();
        // The quiz will now be started by a user action
    } catch (error) {
        console.error("Fatal Error: Could not initialize quiz assets.", error);
        // Display a global error message on the page
        document.body.innerHTML = '<p style="text-align: center; padding: 2rem;">Kunne ikke indlæse quizzen. Prøv venligst igen senere.</p>';
    }
});

function setupDOMElements() {
    // This function remains largely the same as your original, grabbing all necessary elements
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

// REPLACE the existing attachEventListeners function with this one.

function attachEventListeners() {
    document.querySelectorAll('.start-quiz-btn').forEach(btn => btn.addEventListener('click', runQuiz));
    restartButton.addEventListener('click', runQuiz);
    backButton.addEventListener('click', goBack);
    
    // --- NEW: Re-implemented the Early Exit button logic ---
    earlyExitButton.addEventListener('click', () => {
        // This directly calls the results step, skipping any remaining questions.
        renderStep({ type: 'results', data: getProductScores() });
    });

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
async function runQuiz() {
    heroSection.classList.add('hidden');
    resultsSection.classList.add('hidden');
    quizSection.classList.remove('hidden');
    showLoadingState('Indlæser guiden...');

    // The new quiz-engine handles the logic of what to ask first.
    // We provide mock initial filters for now. This should come from a pre-hub UI step.
    const mockInitialFilters = { gender: 'mand', budget: 'mellem', age: 'voksen' };
    
    // The new engine's first step might be a question or the hub.
    // We pass an empty interest object to start. The hub will populate it.
    const nextStep = startQuiz(mockInitialFilters, {}); 
    renderStep(nextStep);
}

function renderStep(step) {
    hideLoadingState();
    questionContainer.classList.add('hidden');
    resultsSection.classList.add('hidden');
    
    if (step.type === 'question') {
        renderQuestion(step.data);
    } else if (step.type === 'interest_hub') {
        renderInterestHub();
    } else if (step.type === 'loading_ai') {
        // This is the new, correct logic
        showLoadingState('Et øjeblik, jeg finder på et rigtig godt spørgsmål til dig...');
        // The fetchAIQuestion function from the engine will now be called by the UI
        fetchAIQuestion().then(nextStep => renderStep(nextStep));
    } else if (step.type === 'results') {
        renderResults(step.data);
    } else {
        console.warn("Unknown step type:", step.type);
        renderResults(getProductScores());
    }
}

function goBack() {
    const previousStep = goBackLogic();
    renderStep(previousStep);
}

// --- RENDERING FUNCTIONS (RE-INTEGRATED) ---

function showLoadingState(message = 'Et øjeblik, jeg tænker lige...') {
    // This function is now simplified as renderStep handles showing/hiding main containers
    questionContainer.classList.remove('hidden');
    questionContainer.innerHTML = `<div class="text-center p-8"><h2 class="text-2xl font-bold">${message}</h2><p class="mt-2">Vi finder de bedste gaveidéer til dig...</p></div>`;
}

function hideLoadingState() {
    // No longer needed as renderStep clears content
}

function renderQuestion(question) {
    if (!question) { return renderResults(getProductScores()); }
    currentQuestion = question; // Store current question

    const template = document.getElementById('single-choice-template').content.cloneNode(true);
    template.querySelector('.question-text').textContent = question.question_text;
    const answersContainer = template.querySelector('.answers-container');
    answersContainer.innerHTML = '';
    
question.answers.forEach(answer => {
    const btn = document.createElement('button');
    btn.className = "answer-btn"; // Add your styling classes
    btn.textContent = answer.answer_text;
    
    if (answer.tags && answer.tags.includes("freetext:true")) {
        btn.onclick = () => showFreeTextInput(answersContainer);
    } else {
        btn.onclick = () => {
            const nextStep = handleAnswer(currentQuestion, answer);
            renderStep(nextStep);
        };
    }
    answersContainer.appendChild(btn);
});
    
    questionContainer.innerHTML = '';
    questionContainer.appendChild(template);
    questionContainer.classList.remove('hidden');
}

async function renderResults(scores) {
    if (!allProducts.length) {
        const res = await fetch('assets/products.json');
        allProducts = await res.json();
    }
    
    questionContainer.classList.add('hidden');
    resultsSection.classList.remove('hidden');

    const topProducts = scores.slice(0, 5).map(s => {
        return allProducts.find(p => p.id === s.id);
    }).filter(p => p);
    
    primaryResultEl.innerHTML = topProducts.length > 0 ? createProductCard(topProducts[0], true) : '<p>Ingen gaver fundet.</p>';
    secondaryResultsEl.innerHTML = '';
    if (topProducts.length > 1) {
        topProducts.slice(1).forEach(p => {
            secondaryResultsEl.innerHTML += createProductCard(p, false);
        });
    }

    currentRecommendationId = topProducts.length ? topProducts[0].id : null;
    feedbackContainer.classList.remove('hidden');
}

function createProductCard(product, isPrimary) {
    // This function can be the same as your detailed original version
    if (!product) return '';
    const priceFormatted = product.context.price.toFixed(2).replace('.', ',') + ' kr.';
    return `
        <div class="${isPrimary ? 'primary-card-styles' : 'secondary-card-styles'}">
            <img src="${product.image}" alt="${product.name}">
            <div>
                <h3>${product.name}</h3>
                <p>${priceFormatted}</p>
                ${isPrimary ? `<p>${product.description}</p>` : ''}
                <a href="${product.url}" target="_blank">Se gaven</a>
            </div>
        </div>
    `;
}

function showFreeTextInput(container) {
    container.innerHTML = `
        <div class="w-full p-4 bg-gray-50 rounded-lg">
            <label for="freetext-input" class="block text-sm font-medium text-gray-700 mb-1">Beskriv hvad du leder efter:</label>
            <textarea id="freetext-input" maxlength="250" class="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"></textarea>
            <button id="freetext-submit" class="cta-btn w-full mt-2 bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700">Send</button>
        </div>
    `;

    document.getElementById('freetext-submit').onclick = () => {
        const freeTextInput = document.getElementById('freetext-input');
        const freeText = freeTextInput.value.trim();
        if (freeText) {
            // Show loading state while the AI thinks
            showLoadingState('Et øjeblik, jeg analyserer dit svar...');
            handleFreeText(freeText).then(nextStep => {
                renderStep(nextStep);
            });
        }
    };
}

// --- INTEREST HUB LOGIC (RE-INTEGRATED) ---
async function renderInterestHub() {
    if (!allInterests.length) {
        const res = await fetch('assets/interests.json');
        allInterests = await res.json();
    }

    const template = document.getElementById('interest-hub-template').content.cloneNode(true);
    interestHubContainer = template.querySelector('.interest-hub-container');
    interestSearchInput = template.querySelector('.interest-search-input');
    interestPillsContainer = template.querySelector('.interest-pills-container');
    showMoreInterestsBtn = template.querySelector('.show-more-interests-btn');
    continueFromHubBtn = template.querySelector('.continue-from-hub-btn');

    interestSearchInput.addEventListener('input', () => filterAndRenderInterests(interestSearchInput.value));
    showMoreInterestsBtn.addEventListener('click', () => {
        displayedInterests += 15;
        filterAndRenderInterests(interestSearchInput.value);
    });
    continueFromHubBtn.addEventListener('click', () => {
        // Here we transition from the hub to the main question tournament
        // The quiz engine needs to be re-started with the selected interests
        const mockInitialFilters = { gender: 'mand', budget: 'mellem', age: 'voksen' }; // This should be preserved from the first step
        const nextStep = startQuiz(mockInitialFilters, selectedInterests);
        renderStep(nextStep);
    });

    questionContainer.innerHTML = '';
    questionContainer.appendChild(template);
    questionContainer.classList.remove('hidden');

    filterAndRenderInterests();
}

function filterAndRenderInterests(searchTerm = '') {
    const lowerCaseSearch = searchTerm.toLowerCase();
    const filtered = allInterests.filter(interest => 
        interest.name.toLowerCase().includes(lowerCaseSearch) ||
        (interest.keywords && interest.keywords.some(k => k.toLowerCase().includes(lowerCaseSearch)))
    );

    interestPillsContainer.innerHTML = '';
    filtered.slice(0, displayedInterests).forEach(interest => {
        const pill = document.createElement('button');
        pill.className = "interest-pill"; // Add your styling
        pill.textContent = interest.name;
        pill.dataset.interestKey = interest.key;
        if (selectedInterests[interest.key]) {
            pill.classList.add('selected');
        }
        pill.onclick = () => toggleInterest(interest.key, pill);
        interestPillsContainer.appendChild(pill);
    });
    
    showMoreInterestsBtn.style.display = filtered.length > displayedInterests ? 'inline-block' : 'none';
}

function toggleInterest(interestKey, pillElement) {
    if (selectedInterests[interestKey]) {
        delete selectedInterests[interestKey];
        pillElement.classList.remove('selected');
    } else {
        selectedInterests[interestKey] = 1; // Add with a base strength of 1
        pillElement.classList.add('selected');
    }
    continueFromHubBtn.disabled = Object.keys(selectedInterests).length === 0;
}

// --- EVENT HANDLERS & HELPERS (from original file, now refactored) ---

function submitRating(rating) {
    if (!currentRecommendationId || !rating) return;
    const userProfile = getUserProfile(); // Get current quiz state for context

    fetch('/.netlify/functions/submit-rating', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            productId: currentRecommendationId, 
            rating: rating,
            quizAnswers: userProfile.answers // Pass the new answer format
        })
    }).catch(err => console.error('Rating submission failed:', err));

    // UI feedback for star selection
    starRatingContainer.querySelectorAll('button').forEach(b => {
        b.classList.remove('selected');
        const starValue = parseInt(b.dataset.value);
        if(starValue <= rating) {
            b.querySelector('svg').classList.add('text-yellow-400');
            b.querySelector('svg').classList.remove('text-gray-300');
        } else {
            b.querySelector('svg').classList.add('text-gray-300');
            b.querySelector('svg').classList.remove('text-yellow-400');
        }
    });

    // Provide confirmation to the user
    const feedbackText = document.createElement('p');
    feedbackText.textContent = 'Tak for din feedback!';
    feedbackText.className = 'text-green-600 text-center mt-2';
    feedbackContainer.appendChild(feedbackText);
    setTimeout(() => feedbackText.remove(), 3000);
}

async function handleShare() {
    const userProfile = getUserProfile();
    if (!userProfile || userProfile.answers.length === 0) {
        alert("Du skal gennemføre guiden for at kunne dele dit resultat.");
        return;
    }

    try {
        const response = await fetch('/.netlify/functions/create-share-link', {
            method: 'POST',
            body: JSON.stringify({ 
                productId: currentRecommendationId, 
                quizAnswers: userProfile.answers,
                filters: userProfile.filters
            })
        });
        const data = await response.json();
        if (data.shareId) {
            const shareUrl = `${window.location.origin}${window.location.pathname}?share=${data.shareId}`;
            shareLinkInput.value = shareUrl;
            shareModal.classList.remove('hidden');
        }
    } catch (error) {
        console.error('Failed to create share link:', error);
        alert('Der opstod en fejl under oprettelse af delingslink.');
    }
}

function copyShareLink() {
    shareLinkInput.select();
    document.execCommand('copy');
    copyFeedback.textContent = 'Link kopieret!';
    setTimeout(() => { copyFeedback.textContent = ''; }, 2000);
}

function openFlagModal(productId) {
    const reason = prompt("Rapportér et problem med produktet:\n- Link virker ikke\n- Billedet mangler\n- Prisen passer ikke\n- Andet");
    if (!reason) return;
    const userProfile = getUserProfile();

    fetch('/.netlify/functions/submit-flag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            productId: productId, 
            reason: reason, 
            quizAnswers: userProfile.answers 
        })
    })
    .then(() => alert('Tak for din feedback!'))
    .catch(err => {
        console.error('Error reporting problem:', err);
        alert('Kunne ikke rapportere problemet. Prøv igen senere.');
    });
}

async function handleSharedResult(shareId) {
    showLoadingState('Henter delt resultat...');
    try {
        const res = await fetch(`/.netlify/functions/get-shared-result?id=${shareId}`);
        if (!res.ok) throw new Error("Shared result not found or invalid.");
        
        const sharedData = await res.json();
        
        // Initialize assets before loading state
        await initializeQuizAssets();
        
        // Use the new engine function to load the state
        const nextStep = loadSharedState(sharedData);

        heroSection.classList.add('hidden');
        quizSection.classList.remove('hidden');
        
        // Render the results directly
        renderStep(nextStep);

    } catch (err) {
        console.error("Failed to load shared result:", err);
        hideLoadingState();
        alert("Ugyldigt eller udløbet delingslink.");
        heroSection.classList.remove('hidden');
        quizSection.classList.add('hidden');
    }
}

