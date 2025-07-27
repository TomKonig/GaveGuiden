Den Rette Gave: Master Project Specification & Technical Report
Version: 8.0 (Definitive Master Blueprint)
Date: July 27, 2025
Author: Gemini, Lead Developer

1.0 Executive Summary & Vision
This document serves as the single source of truth for the Den Rette Gave project. It is a comprehensive blueprint detailing the project's vision, business strategy, user experience, technical architecture, and operational workflows. It is designed to be fully self-contained, requiring no external context for complete understanding.

1.1 Project Vision
Our vision is to create the most intelligent, trusted, and user-friendly starting point for gift discovery in the Danish market. Den Rette Gave will eliminate the friction and decision fatigue of traditional online shopping by providing a delightful, guided experience that results in perfect, personalized gift recommendations.

1.2 Business Model & Strategy
Core Concept: Affiliate Marketing
We build a highly useful tool that recommends products. When a user clicks our recommendation and buys the product from the seller's website, we earn a percentage of that sale.

The foundational business strategy is to achieve and maintain profitability by minimizing operational costs. We accomplish this through a Serverless Architecture.

What is a Serverless Architecture?
Traditionally, websites need a server that is always on, waiting for visitors. This incurs constant costs. A serverless approach means we don't manage a server. Our website is a collection of static files (HTML, CSS, JS) served globally from a Content Delivery Network (CDN), which is extremely fast and cheap. For dynamic actions (like tracking clicks or saving feedback), we use small, on-demand "serverless functions" that run for a few milliseconds, and we only pay for that exact execution time.

1.3 Unique Selling Proposition (USP)
Den Rette Gave's competitive advantage is a superior, intelligent, and adaptive user experience. While competitors offer simple filter pages, we provide a guided, conversational journey that feels both personal and magical. Our "smart" quiz dynamically adapts to user input, asking only the most relevant next question, a feature unmatched by existing tools.

2.0 The User Experience (UX) & Journey
The user's journey is designed to be a single, seamless flow from arrival to recommendation, feeling more like a polished mobile app than a traditional website.

2.1 User Journey Flowchart
The user's journey through the application is illustrated below:

2.2 Detailed Interaction Design
Transitions: All view changes (e.g., landing to quiz) will use a gentle cross-fade and slight vertical slide animation.

Micro-interactions: Buttons will have clear hover states, and selected quiz options will be visually distinct.

The "Early Exit": A button will appear after a few questions, allowing users to get results sooner.

Feedback Loops: Users can rate suggestions and report issues directly from the results card, making them active participants in quality control.

3.0 Technical Architecture & System Design
3.1 System Architecture Diagram
The diagram below illustrates the technical architecture, including the secure handling of sensitive data.

3.2 Technology Stack & Rationale
Languages: HTML5, CSS3, JavaScript (ES6+).

Styling: Tailwind CSS.

Hosting & Backend: Netlify or Vercel.

3.3 Detailed File Structure
/
├── index.html
├── admin.html
├── assets/
│   ├── products.json       // Public: The core database of all gift products.
│   ├── questions.json      // Public: The script for the quiz flow.
│   ├── flags.json          // Public: User-submitted error reports.
│   └── shares.json         // PRIVATE: Stores data for shareable links.
│   └── ratings.json        // PRIVATE: Stores user ratings and anonymized answers.
└── functions/
    ├── admin-login.js      // Securely handles admin login.
    ├── create-share-link.js// Securely creates a share ID.
    ├── get-shared-result.js// Securely retrieves a shared result.
    ├── get-ratings.js      // Securely provides ratings to the admin panel.
    ├── submit-flag.js      // Handles user submissions of product errors.
    ├── submit-rating.js    // Securely handles user-submitted ratings.
    └── update-analytics.js // Handles anonymous analytics events.

4.0 The Dynamic Recommendation Engine (Core Logic)
4.1 The Scoring Algorithm
After every answer, this algorithm re-evaluates all active products.

Example Walkthrough:
A user selects "Mand" (Gender) and "Kaffe" (Interest).

Product A (Coffee Machine): tags: { gender: ["alle"], interests: ["Kaffe"] } -> Score: 13

Product B (Perfume): tags: { gender: ["Mand"], interests: ["Mode"] } -> Score: 3

The Coffee Machine is now the clear front-runner.

4.2 The Dynamic Question Engine
The engine now reads from questions.json to determine the quiz flow. It asks all questions without a trigger first. Then, after each answer, it checks if any conditional questions in questions.json have had their trigger condition met and adds them to the queue.

Example Walkthrough:
User answers interests question and selects "Kaffe".

The engine checks questions.json and finds a question with trigger: { key: "interests", value: "Kaffe" }.

It adds this new question (e.g., "Vælg en farve til koppen:") to the end of the quiz queue.

5.0 Visual Identity & Design System
Brand Name: Den Rette Gave

Core Values: Simplicity, Clarity, Trust, Intelligence.

Color Palette: Slate Blue (Primary), Charcoal (Text), Off-White (Background), Light Gray (Accents).

Typography: 'Poppins' (from Google Fonts).

6.0 Admin Panel & Operations Dashboard
The admin.html page is a comprehensive internal tool for managing the application.

6.1 Secure Access
The admin panel is protected by a server-side password check. The password is not stored in the code but as a secure environment variable on Netlify. A successful login provides a temporary, secure token for the session.

6.2 Dashboard Tabs
Live Editor: A direct text editor for products.json for advanced edits.

Edit Product: A user-friendly form to select and modify individual products.

Flagged Items: An aggregated view of user-reported errors, with an alert system for issues that cross a set threshold.

Ratings: A secure view of user ratings and the anonymized answer paths that led to them.

Settings: Instructions on how to securely change the admin password via Netlify environment variables.

7.0 Automated Lead Generation & Workflow
7.1 LLM Prompt for Automated Discovery
**Role:** You are an expert e-commerce curator...
**Objective:** Find 10 unique gift *ideas*...
**CRITICAL INSTRUCTION: ...use the following URL as an exclusion list...**
**Exclusion List URL:** https://denrettegave.dk/assets/products.json
**Variation Handling Clause:** If a product has multiple variations, create a separate JSON object for *each individual variant*...
...

7.2 Content Curation Workflow
The workflow for turning automated leads into live products is shown below:

8.0 Go-to-Market & Launch Strategy (Phase 1)
8.1 Minimum Viable Product (MVP) Feature Set
The "Share Results" Viral Loop: A button on the results page that calls a serverless function to create a secure, anonymous, shareable link.

Occasion-Specific SEO Landing Pages: Static HTML pages targeting high-intent search terms (e.g., denrettegave.dk/julegaveideer).

8.2 Cost & Resource Optimization
Hosting & Domain: Use the free tiers of Netlify or Vercel. Projected initial cost: <$20.

Initial User Acquisition: Capitalize on sign-up offers from Google Ads and Microsoft Advertising.

9.0 Post-Launch Roadmap & Growth (Phase 2)
9.1 Projected Budget & Allocation
Target Monthly Budget: $50 - $100 USD.

Allocation: Analytics (~$15), Serverless Functions (~$10), Advanced LLM Calls (~$25+), Ad Experiments (Remainder).

9.2 Roadmap: Upcoming Features & Integrations
Update 1: Advanced Analytics Integration

Update 2: Wishlists & Gift Registries

Update 3: Automated Product Health Monitoring

Update 4: Smarter LLM Curation Pipeline

10.0 Discarded Concepts & Strategic Rationale
LLM-Powered Live Quiz: High cost, unpredictable.

User Accounts & Profiles: Unnecessary friction, GDPR risk.

Complex Database (SQL, etc.): Over-engineering for our current scale.

Appendix A: Data Model Schemas
ratings.json (Stored Privately)
[
  {
    "rating_id": 1669500000000,
    "product_id": 1,
    "product_name": "Test Kaffekop (Blå)",
    "rating": 5,
    "quiz_answers": {
      "relation": "Partner",
      "gender": "Kvinde",
      "age": "26-40",
      "occasion": "Fødselsdag",
      "interests": ["Kaffe", "Hjemmet"]
    },
    "timestamp": "2025-07-27T12:00:00Z"
  }
]

Appendix B: Serverless Function APIs
POST /.netlify/functions/submit-rating
Purpose: To securely log a user's rating and anonymized answers.

Action: Receives rating data, removes the name field, and appends it to the private ratings.json file.

GET /.netlify/functions/get-ratings
Purpose: To securely provide ratings data to the admin panel.

Authentication: Requires a valid temporary auth token in the request header.

Action: If authenticated, reads and returns the contents of the private ratings.json file.
