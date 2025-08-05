// netlify/functions/utils/simulation-engine.js

// This engine is a simplified, server-side replica of the core logic
// found in the client-side quiz-engine.js.

function findQuestion(allQuestions, questionHistory, userFilters, parentId = null) {
    const matchingQuestions = allQuestions.filter(q => {
        if (q.parent_answer_id !== parentId) return false;
        if (q.context) {
            return Object.entries(q.context).every(([key, value]) => userFilters[key] === value);
        }
        return true;
    });
    return matchingQuestions.find(q => !questionHistory.includes(q.question_id));
}

function chooseBestAnswer(question, personaInterests) {
    let bestAnswer = null;
    let maxScore = -1;

    // Prioritize the escape hatch if no good options exist
    const escapeHatch = question.answers.find(a => a.tags.includes("freetext:true"));
    bestAnswer = escapeHatch;

    question.answers.forEach(answer => {
        if (answer.tags.includes("freetext:true")) return;

        let score = 0;
        answer.tags.forEach(tag => {
            if (personaInterests.includes(tag)) {
                score++;
            }
        });

        if (score > maxScore) {
            maxScore = score;
            bestAnswer = answer;
        }
    });

    // If no answer aligns with the persona's interests, choose the escape hatch
    if (maxScore === 0) {
        return escapeHatch;
    }

    return bestAnswer;
}


async function runQuizSimulation(params) {
    const { persona, questions, interests, productCatalog } = params;

    const sessionLog = {
        persona_id: persona.persona_id,
        journey: [],
        final_recommendations: [],
        drop_off: false,
    };

    let currentQuestion = findQuestion(questions, [], persona.initial_filters, null);
    const questionHistory = [];
    const userAnswers = [];

    // Simulate up to 10 question steps to prevent infinite loops
    for (let i = 0; i < 10 && currentQuestion; i++) {
        questionHistory.push(currentQuestion.question_id);

        const chosenAnswer = chooseBestAnswer(currentQuestion, persona.interests);

        sessionLog.journey.push({
            question_id: currentQuestion.question_id,
            question_text: currentQuestion.phrasings[0],
            chosen_answer_id: chosenAnswer.answer_id,
            chosen_answer_text: chosenAnswer.answer_text,
        });

        if (chosenAnswer.tags.includes("freetext:true")) {
            sessionLog.drop_off = true;
            break; // End simulation if the persona bails
        }

        userAnswers.push({
            question_id: currentQuestion.question_id,
            tags: chosenAnswer.tags
        });

        currentQuestion = findQuestion(questions, questionHistory, persona.initial_filters, chosenAnswer.answer_id);
    }
    
    // Simple scoring based on final answers
    const interestTags = userAnswers.flatMap(a => a.tags);
    const scores = productCatalog.map(product => {
        let score = 0;
        interestTags.forEach(tag => {
            if (product.tags.includes(tag)) {
                score++;
            }
        });
        return { id: product.id, name: product.name, score };
    });

    sessionLog.final_recommendations = scores.sort((a, b) => b.score - a.score).slice(0, 5);

    return sessionLog;
}

module.exports = { runQuizSimulation };
