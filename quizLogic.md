Den Rette Gave: Dynamic Quiz Engine & Content Guide
Version: 2.0
Purpose: This document provides a comprehensive guide to the design, implementation, and expansion of the score-driven, dynamic quiz engine for Den Rette Gave. It replaces all previous documentation on conditional logic.

1.0 The Philosophy: A Dynamic Conversation
This section outlines the new, more intelligent approach to our quiz.

1.1 The Core Principle: From Static Script to Dynamic Engine

We are moving away from a pre-written "script" of questions (questions.json with trigger rules). Instead, we are building an intelligent engine in index.html. This engine's only goal is to ask the single most effective question at any given moment to narrow down the gift search.

The questions.json file will no longer contain complex rules. It will become a simple "pool" of all possible questions the engine can choose from. This makes it incredibly easy for you to manage.

1.2 The Funnel, Reimagined

The quiz is still a funnel, but it's now a flexible, self-optimizing one.

Start Wide: The user begins with all products in consideration.

Initial Questions: The engine will always ask a few foundational questions (like relation and age) to make the first big cuts.

Intelligent Narrowing: After each answer, the engine re-evaluates all product scores. It then analyzes the top-scoring products and asks: "What is the one question I can ask that will best differentiate these front-runners?"

Non-Linear Paths: This means the quiz is no longer linear. A user who mentions "Kaffe" might be asked about color next. A user who mentions "Mode" (Fashion) might be asked about size. The path is unique to each user's answers.

1.3 How to Add New Questions (The New Workflow)

Your workflow is now much simpler and more powerful. You no longer need to worry about complex trigger rules.

Add New Products: As you add new products, you will naturally create new tag categories (e.g., adding jewelry introduces a material tag with values like "Guld" and "Sølv").

Create a Corresponding Question: You will then instruct me to add a single, simple question object to the questions.json pool. For example:

{
  "id": "q_material",
  "question": "Hvilket materiale foretrækker de?",
  "key": "material",
  "type": "single-choice-card",
  "options": ["Guld", "Sølv", "Ligegyldigt"]
}

The Engine Does the Rest: You don't need to tell the engine when to ask this question. The engine will automatically discover that when a user's answers lead to a group of top-scoring jewelry items, asking the "material" question is the most logical next step.

1.4 The "Discovery" Question: Broadening the Funnel

To prevent the quiz from narrowing down too quickly, we will introduce "Discovery" questions.

What they are: These are slightly more general questions (e.g., "Er de en eventyrlysten type?") that can open up new, unexpected gift categories.

How they work: The engine will be programmed to occasionally (e.g., a 20% chance after the third question) inject a random Discovery question instead of the most "logically" differentiating one. This adds an element of serendipity and ensures we don't miss potential matches by being too focused.

2.0 The Engine Room: Technical Implementation Details
This section provides a detailed, technical overview of the new quiz engine for a developer with zero prior context.

2.1 System Overview: The Engine is King

The intelligence of our application now resides almost entirely within the JavaScript of index.html. The data files (products.json, questions.json) are simple data sources.

questions.json (New Structure): This file is now a simple array of question objects. The trigger property is completely removed.

[
  {
    "id": "q_relation",
    "question": "Hvem er gaven til?",
    "key": "relation",
    "type": "single-choice-card",
    "options": ["Partner", "Forælder", "Ven", "..."]
  },
  {
    "id": "q_material",
    "question": "Hvilket materiale foretrækker de?",
    "key": "material",
    "type": "single-choice-card",
    "options": ["Guld", "Sølv"],
    "is_discovery": false 
  }
]

2.2 The Quiz Lifecycle: The Dynamic Loop

The new quiz loop is driven by continuous analysis.

Initialize: On quiz start, create two lists: askedQuestions (initially empty) and questionPool (containing all questions from questions.json). Ask the first 2-3 foundational questions (e.g., relation, age).

Score & Analyze: After each answer is stored in userAnswers, immediately re-calculate the scores for all products.

Identify Candidate Pool: Create a temporary list of the top 10-15 highest-scoring products. These are our "candidates".

Find Best Next Question: The engine now performs its core task:
a.  It identifies all questions in the questionPool that have not been asked yet.
b.  For each unasked question, it calculates an "information gain" score based on the current candidate pool. It does this by looking at the question's key (e.g., "color") and checking how many different values for that key exist among the candidate products. A question that splits the candidates into multiple groups (e.g., 5 are "Blå", 6 are "Grøn") gets a high score. A question where all candidates have the same value gets a score of 0.
c.  The question with the highest "information gain" score is selected as the next one to ask.

Ask: The selected question is moved from the questionPool to the askedQuestions list and is rendered to the user.

Loop: The process repeats from Step 2 until a stopping condition is met.

2.3 Stopping Conditions

The quiz will end when one of these conditions is true:

No More Useful Questions: The engine calculates that no remaining unasked question can further differentiate the top products (i.e., all remaining questions have an "information gain" score of 0).

Clear Winner: The top-scoring product is significantly ahead of the second-place product (e.g., its score is 50% higher). This indicates a very strong match has been found.

User Action: The user clicks the "Vis mig resultater nu" button.

2.4 Populating Secondary Results

When the quiz ends, the engine performs a final sort of all products by score.

The product with the highest score is the primary recommendation.

The products with the 2nd, 3rd, and 4th highest scores are the secondary recommendations.

