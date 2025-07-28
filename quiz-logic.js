// --- DOM Elements ---
const views = {
    landing: document.getElementById('landing-view'),
    quiz: document.getElementById('quiz-view'),
    results: document.getElementById('results-view')
};
const startQuizBtn = document.getElementById('start-quiz-btn');
const restartQuizBtn = document.getElementById('restart-quiz-btn');
const quizContainer = document.getElementById('quiz-container');
const questionTitle = document.getElementById('question-title');
const questionText = document.getElementById('question-text');
const answersContainer = document.getElementById('answers-container');
const earlyExitBtn = document.getElementById('early-exit-btn');
const resultsTitle = document.getElementById('results-title');
const resultsContainer = document.getElementById('results-container');

// Modals & Banners
const howItWorksModal = document.getElementById('how-it-works-modal');
const reportProblemModal = document.getElementById('report-problem-modal');
const shareModal = document.getElementById('share-modal');
const contactModal = document.getElementById('contact-modal');
const cookieBanner = document.getElementById('cookie-banner');

// --- CONFIGURATION ---
const SCORE_THRESHOLD = 1.8;
const MIN_ANSWERS_FOR_THRESHOLD = 3;
const TOP_N_PRODUCTS_FOR_DIFFERENTIATION = 5;
const DIFFERENTIATOR_BONUS = 10.0;
const TAG_WEIGHTS = {
    gender: 3.0,
    age: 2.5,
    price: 5.0,
    occasion: 1.5,
    interest: 4.0,
    "interest_low": 2.0,
};

// --- STATE ---
let allProducts = [];
let allQuestions = [];
let quizState = {};
let topProductResult = null;
let currentReportProductId = null;

// --- INITIALIZATION ---
const initializeQuizState = () => {
    quizState = {
        answers: {},
        productScores: {},
        askedQuestionIds: new Set(),
    };
};

const fetchData = async () => {
    try {
        const [productsRes, questionsRes] = await Promise.all([
            fetch('./assets/products.json'),
            fetch('./assets/questions.json')
        ]);
        allProducts = await productsRes.json();
        allQuestions = await questionsRes.json();
    } catch (error) {
        console.error("Failed to fetch initial data:", error);
        document.getElementById('app').innerHTML = `<p class="text-center text-red-500 p-8">Kunne ikke indlæse data. Prøv venligst igen senere.</p>`;
    }
};

// --- VIEW & MODAL MANAGEMENT ---
const switchView = (activeView) => {
    Object.values(views).forEach(view => view.classList.remove('active'));
    views[activeView].classList.add('active');
};

const handleModal = (modalElement, openTriggers, closeTriggers) => {
    openTriggers.forEach(trigger => trigger.addEventListener('click', () => modalElement.classList.add('visible')));
    closeTriggers.forEach(trigger => trigger.addEventListener('click', () => modalElement.classList.remove('visible')));
    modalElement.addEventListener('click', (e) => {
        if (e.target === modalElement) modalElement.classList.remove('visible');
    });
};

// --- QUIZ FLOW ---
const startQuiz = () => {
    initializeQuizState();
    switchView('quiz');
    const initialQuestion = allQuestions.find(q => q.is_initial && q.id === 'q_initial_gender');
    renderQuestion(initialQuestion || allQuestions[0]);
};

const handleAnswerSelection = (tag, questionId) => {
    const currentWrapper = quizContainer.querySelector('.question-wrapper');
    if (currentWrapper) currentWrapper.classList.add('exiting');

    setTimeout(() => {
        quizState.askedQuestionIds.add(questionId);
        const [key, value] = tag.split(':');

        quizState.answers[key] = value;
        updateScores();

        const nextStep = selectNextQuestion();

        if (nextStep.type === 'question') {
            renderQuestion(nextStep.question);
        } else if (nextStep.type === 'result') {
            showResults(nextStep.product);
        }
    }, 500);
};

// --- CORE LOGIC: SCORING & SELECTION ---
const updateScores = () => {
    const availableProducts = allProducts.filter(product => {
        if (quizState.answers.price) {
            const userPrice = quizState.answers.price;
            const productPriceTag = product.tags.find(t => t.startsWith('price:'));
            if (!productPriceTag) return true;

            const productPrice = productPriceTag.split(':')[1];

            if (userPrice === 'mellem' && productPrice === 'dyr') return false;
            if (userPrice === 'billig' && (productPrice === 'mellem' || productPrice === 'dyr')) return false;

            if (quizState.answers.price_preference === 'high_only') {
                if (userPrice === 'mellem' && productPrice === 'billig') return false;
                if (userPrice === 'dyr' && (productPrice === 'mellem' || productPrice === 'billig')) return false;
            }
        }
        return product.status === 'active';
    });

    const scores = {};
    availableProducts.forEach(product => {
        let score = 0;
        if (product.differentiator_tags) {
            product.differentiator_tags.forEach(d_tag => {
                const [key, value] = d_tag.split(':');
                if (quizState.answers[key] === value) score += DIFFERENTIATOR_BONUS;
            });
        }
        product.tags.forEach(tag => {
            const [key, value] = tag.split(':');
            const answerValue = quizState.answers[key];
            if (answerValue) {
                if (answerValue === value) score += TAG_WEIGHTS[key] || 1.0;
                else if (key === 'interest' && answerValue === `somewhat_${value}`) score += TAG_WEIGHTS["interest_low"] || 1.0;
                else if (key === 'gender' && value === 'alle') score += (TAG_WEIGHTS[key] || 1.0) / 2;
            }
        });
        scores[product.id] = score;
    });
    quizState.productScores = scores;
};

const selectNextQuestion = () => {
    const sortedProducts = Object.entries(quizState.productScores).sort((a, b) => b[1] - a[1]);
    if (sortedProducts.length === 0) return { type: 'result', product: null };
    const bestProduct = allProducts.find(p => p.id === sortedProducts[0][0]);

    const nextInitial = allQuestions.find(q => q.is_initial && !quizState.askedQuestionIds.has(q.id));
    if (nextInitial) return { type: 'question', question: nextInitial };

    const lastAnswerKey = Object.keys(quizState.answers).pop();
    const lastAnswerValue = quizState.answers[lastAnswerKey];
    const lastAnswerTag = `${lastAnswerKey}:${lastAnswerValue}`;
    const triggeredQuestion = allQuestions.find(q => q.trigger_tag === lastAnswerTag && !quizState.askedQuestionIds.has(q.id));
    if(triggeredQuestion) return { type: 'question', question: triggeredQuestion };

    const topScore = sortedProducts[0][1];
    const secondScore = sortedProducts.length > 1 ? sortedProducts[1][1] : 0;
    if (Object.keys(quizState.answers).length >= MIN_ANSWERS_FOR_THRESHOLD && topScore > 0 && (topScore / (secondScore + 0.1)) > SCORE_THRESHOLD) {
        return { type: 'result', product: bestProduct };
    }
    const topProducts = allProducts.filter(p => sortedProducts.slice(0, TOP_N_PRODUCTS_FOR_DIFFERENTIATION).map(sp => sp[0]).includes(p.id));
    const discoveryQuestion = findDiscoveryQuestion(topProducts, quizState.askedQuestionIds);
    if (discoveryQuestion) return { type: 'question', question: discoveryQuestion };
    if (sortedProducts.length >= 2 && isTieDefinitive(sortedProducts)) {
        const dynamicDifferentiator = findDynamicDifferentiatorQuestion(sortedProducts.slice(0, 2).map(p => allProducts.find(prod => prod.id === p[0])), quizState.askedQuestionIds);
        if (dynamicDifferentiator) return { type: 'question', question: dynamicDifferentiator };
    }
    return { type: 'result', product: bestProduct };
};

const isTieDefinitive = (sortedScores) => {
    if (sortedScores.length < 2) return false;
    const topScore = sortedScores[0][1];
    const challengerProducts = sortedScores.slice(2).map(p => allProducts.find(prod => prod.id === p[0]));
    const unaskedTags = new Set();
    allQuestions.forEach(q => {
        if (!quizState.askedQuestionIds.has(q.id) && !q.is_initial && !q.is_differentiator) {
            q.answers.forEach(a => unaskedTags.add(a.tag));
        }
    });
    for (const challenger of challengerProducts) {
        let maxPotentialScore = challenger.score;
        challenger.tags.forEach(tag => {
            if (unaskedTags.has(tag)) {
                const [key] = tag.split(':');
                maxPotentialScore += TAG_WEIGHTS[key] || 1.0;
            }
        });
        if (maxPotentialScore >= topScore) return false;
    }
    return true;
};

const findDynamicDifferentiatorQuestion = (topTwoProducts, askedIds) => {
    const product1 = topTwoProducts[0];
    const product2 = topTwoProducts[1];
    const allTags1 = new Set([...(product1.tags || []), ...(product1.differentiator_tags || [])]);
    const allTags2 = new Set([...(product2.tags || []), ...(product2.differentiator_tags || [])]);
    let difference = null;
    for (const tag of allTags1) {
        if (!allTags2.has(tag)) {
            difference = { productWithTag: product1, tag: tag };
            break;
        }
    }
    if (!difference) {
        for (const tag of allTags2) {
            if (!allTags1.has(tag)) {
                difference = { productWithTag: product2, tag: tag };
                break;
            }
        }
    }
    if (difference) {
        const [key, value] = difference.tag.split(':');
        const existingQuestion = allQuestions.find(q => !askedIds.has(q.id) && q.answers.some(a => a.tag.startsWith(key)));
        if (existingQuestion) return existingQuestion;
        const otherValue = (difference.productWithTag.id === product1.id ?
            [...allTags2].find(t => t.startsWith(key)) :
            [...allTags1].find(t => t.startsWith(key))
        )?.split(':')[1];
        if (otherValue) {
            return {
                id: `dynamic_${key}`,
                question_text: `Hvad er vigtigst: ${value} eller ${otherValue}?`,
                is_differentiator: true,
                answers: [
                    { text: value, tag: `${key}:${value}` },
                    { text: otherValue, tag: `${key}:${otherValue}` }
                ]
            }
        }
    }
    return null;
}

const findDiscoveryQuestion = (topProducts, askedIds) => {
    let bestQuestion = null;
    let maxDifferentiation = -1;
    const potentialQuestions = allQuestions.filter(q => !q.is_initial && !q.is_differentiator && !q.trigger_tag && !askedIds.has(q.id));
    potentialQuestions.forEach(question => {
        const tagsInQuestion = new Set(question.answers.map(a => a.tag.split(':')[1]));
        let differentiation = 0;
        for (const product of topProducts) {
            if (product.tags.some(t => tagsInQuestion.has(t.split(':')[1]))) {
                differentiation++;
            }
        }
        if (differentiation > 0 && differentiation < topProducts.length && differentiation > maxDifferentiation) {
            maxDifferentiation = differentiation;
            bestQuestion = question;
        }
    });
    return bestQuestion;
};

// --- UI RENDERING (XSS HARDENED) ---
const renderQuestion = (question) => {
    if (Object.keys(quizState.answers).length >= 2) earlyExitBtn.classList.remove('hidden');

    const wrapper = document.createElement('div');
    wrapper.className = 'question-wrapper active';

    const title = document.createElement('h3');
    title.className = 'text-2xl md:text-3xl font-bold text-center mb-8';
    title.textContent = question.question_text;
    wrapper.appendChild(title);

    if (question.answers) {
        const optionsGrid = document.createElement('div');
        optionsGrid.className = 'grid grid-cols-2 md:grid-cols-3 gap-4';
        question.answers.forEach(o => {
            const card = document.createElement('div');
            card.className = 'quiz-card bg-white p-4 rounded-lg shadow cursor-pointer';
            card.dataset.tag = o.tag;
            card.dataset.questionId = question.id;

            const text = document.createElement('span');
            text.className = 'font-semibold pointer-events-none';
            text.textContent = o.text;

            card.appendChild(text);
            optionsGrid.appendChild(card);
        });
        wrapper.appendChild(optionsGrid);
    }
    quizContainer.innerHTML = ''; // Clear previous content
    quizContainer.appendChild(wrapper);
};

const showResults = (product, sharedAnswers) => {
    topProductResult = product;
    if (sharedAnswers) quizState.answers = sharedAnswers;
    resultsTitle.textContent = 'Her er vores forslag!';
    resultsContainer.innerHTML = ''; // Clear previous content
    if (product) {
        resultsContainer.appendChild(createProductCard(product));
    } else {
        const message = document.createElement('p');
        message.className = 'text-center';
        message.textContent = 'Vi kunne desværre ikke finde et match. Prøv venligst igen.';
        resultsContainer.appendChild(message);
    }
    switchView('results');
};

const createProductCard = (product) => {
    const card = document.createElement('div');
    card.className = 'bg-white rounded-lg shadow-xl max-w-md mx-auto text-left overflow-hidden';

    const img = document.createElement('img');
    img.src = product.image;
    img.alt = product.name;
    img.className = 'w-full h-64 object-cover';
    img.onerror = () => { img.src = 'https://placehold.co/600x400/e2e8f0/475569?text=Billede+mangler'; };
    card.appendChild(img);

    card.innerHTML += `
        <div class="p-6">
            <h3 class="text-2xl font-bold mb-2">${escapeHTML(product.name)}</h3>
            <p class="text-slate-600 mb-4">${escapeHTML(product.description)}</p>
            <div class="flex justify-between items-center">
                <span class="text-3xl font-bold text-slate-800">${product.price} kr.</span>
                <a href="${product.url}" target="_blank" class="affiliate-link bg-blue-600 text-white font-bold py-2 px-5 rounded-lg hover:bg-blue-700" data-product-id="${product.id}">Se produkt</a>
            </div>
        </div>
        <div class="bg-slate-50 p-4 border-t">
            <div class="mb-4"><p class="text-sm font-semibold text-center mb-2">Hvor godt ramte vi plet?</p><div class="star-rating flex justify-center text-3xl" data-product-id="${product.id}">${[1,2,3,4,5].map(i => `<button data-value="${i}">★</button>`).join('')}</div></div>
            <div class="text-center"><button class="share-btn text-blue-600 font-semibold hover:underline">Del dit resultat</button></div>
            <div class="text-xs text-slate-400 mt-4 text-right"><button class="report-btn hover:underline" data-product-id="${product.id}">Rapportér et problem</button></div>
        </div>`;
    return card;
};

function escapeHTML(str) {
    const p = document.createElement('p');
    p.textContent = str;
    return p.innerHTML;
}

// --- EVENT LISTENERS & API CALLS ---
const setupEventListeners = () => {
    startQuizBtn.addEventListener('click', startQuiz);
    restartQuizBtn.addEventListener('click', () => { window.location.href = window.location.pathname; });
    earlyExitBtn.addEventListener('click', () => showResults(Object.values(quizState.productScores).length > 0 ? allProducts.find(p => p.id === Object.entries(quizState.productScores).sort((a,b) => b[1] - a[1])[0][0]) : null));
    
    quizContainer.addEventListener('click', e => {
        const target = e.target.closest('[data-tag]');
        if (target) handleAnswerSelection(target.dataset.tag, target.dataset.questionId);
    });
    
    resultsContainer.addEventListener('click', async e => {
        if (e.target.closest('.report-btn')) {
            currentReportProductId = e.target.closest('.report-btn').dataset.productId;
            document.getElementById('report-options').classList.remove('hidden');
            document.getElementById('report-feedback').classList.add('hidden');
            reportProblemModal.classList.add('visible');
        }
         if (e.target.closest('.share-btn')) {
             createShareLink(topProductResult.id, quizState.answers);
         }
         if (e.target.closest('.star-rating button')) {
            const button = e.target.closest('.star-rating button');
            const rating = parseInt(button.dataset.value, 10);
            const productId = button.parentElement.dataset.productId;
            submitRating(productId, rating);
            const stars = button.parentElement.querySelectorAll('button');
            stars.forEach(star => {
                star.classList.toggle('selected', star.dataset.value <= rating);
                star.disabled = true;
            });
        }
    });

     reportProblemModal.querySelector('#report-options').addEventListener('click', e => {
        if (e.target.tagName === 'BUTTON') {
            submitFlag(currentReportProductId, e.target.dataset.reportType);
            document.getElementById('report-options').classList.add('hidden');
            document.getElementById('report-feedback').classList.remove('hidden');
            setTimeout(() => reportProblemModal.classList.remove('visible'), 1500);
        }
    });
    
    document.getElementById('copy-share-link-button').onclick = () => {
        const link = document.getElementById('share-link-input').value;
        navigator.clipboard.writeText(link).then(() => {
            const feedback = document.getElementById('share-copy-feedback');
            feedback.classList.remove('hidden');
            setTimeout(() => feedback.classList.add('hidden'), 2000);
        });
    };

    const acceptCookiesBtn = document.getElementById('accept-cookies-btn');
    if (!localStorage.getItem('cookieConsent')) {
        cookieBanner.classList.remove('hidden');
        setTimeout(() => cookieBanner.classList.remove('translate-y-full'), 100);
    }
    acceptCookiesBtn.addEventListener('click', () => {
        localStorage.setItem('cookieConsent', 'true');
        cookieBanner.classList.add('translate-y-full');
        setTimeout(() => cookieBanner.classList.add('hidden'), 500);
    });

    handleModal(howItWorksModal, [document.getElementById('how-it-works-btn')], document.querySelectorAll('#how-it-works-modal .close-modal-btn'));
    handleModal(contactModal, [document.getElementById('contact-btn')], document.querySelectorAll('#contact-modal .close-modal-btn'));
    handleModal(reportProblemModal, [], document.querySelectorAll('#report-problem-modal .close-modal-btn'));
    handleModal(shareModal, [], document.querySelectorAll('#share-modal .close-modal-btn'));
};

const submitRating = async (productId, rating) => {
    try {
        await fetch('/api/submit-rating', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ productId, rating })
        });
    } catch (error) { console.error('Failed to submit rating:', error); }
};

const submitFlag = async (productId, reason) => {
    try {
        await fetch('/api/submit-flag', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ productId, reason, quizAnswers: quizState.answers })
        });
    } catch (error) { console.error('Failed to submit flag:', error); }
};

const createShareLink = async (productId, answers) => {
    try {
        const response = await fetch('/api/create-share-link', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ product_id: productId, quiz_answers: answers })
        });
        const { shareId } = await response.json();
        const link = `${window.location.origin}${window.location.pathname}?share=${shareId}`;
        document.getElementById('share-link-input').value = link;
        shareModal.classList.add('visible');
    } catch (error) { console.error('Failed to create share link:', error); }
};

const loadSharedResult = async (shareId) => {
    try {
        const response = await fetch(`/api/get-shared-result?id=${shareId}`);
        if (!response.ok) throw new Error('Share link not found');
        const { product_id, quiz_answers } = await response.json();
        const product = allProducts.find(p => p.id === product_id);
        if(product) {
            showResults(product, quiz_answers);
        } else { throw new Error('Product from share link not found'); }
    } catch (error) {
        console.error("Failed to load shared link:", error);
        document.getElementById('app').innerHTML = `<p class="text-red-500 text-center">Dette delingslink er ugyldigt eller udløbet.</p>`;
    }
};

// --- APP START ---
const startApp = async () => {
    await fetchData();
    if (allProducts.length > 0 && allQuestions.length > 0) {
        const urlParams = new URLSearchParams(window.location.search);
        const shareId = urlParams.get('share');
        if (shareId) {
            loadSharedResult(shareId);
        }
        setupEventListeners();
    }
};

document.addEventListener('DOMContentLoaded', startApp);
