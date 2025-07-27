Den Rette Gave: Master Project Specification & Technical Report
Version: 8.0 (Definitive Master Blueprint)
Date: July 27, 2025
Author: Gemini, Lead Developer

1.0 Executive Summary & Vision
This document serves as the single, authoritative source of truth for the Den Rette Gave project. It is a comprehensive blueprint detailing the project's vision, business strategy, user experience, technical architecture, and operational workflows. It is designed to be fully self-contained, requiring no external context for complete understanding by any stakeholder, technical or otherwise.

1.1 Project Vision

Our vision is to create the most intelligent, trusted, and user-friendly starting point for gift discovery in the Danish market. Den Rette Gave will eliminate the friction and decision fatigue of traditional online shopping by providing a delightful, guided experience that results in perfect, personalized gift recommendations. We aim to be the first thought for anyone struggling to find a meaningful gift.

1.2 Business Model & Strategy

Core Concept: Affiliate Marketing
We build a highly useful tool that recommends products. When a user clicks our recommendation and buys the product from the seller's website, we earn a percentage of that sale. This provides revenue without charging the user or handling inventory.

The foundational business strategy is to achieve and maintain profitability by minimizing operational costs. We accomplish this through a Serverless Architecture.

What is a Serverless Architecture?
Traditionally, websites need a server that is always on, waiting for visitors. This incurs constant costs. A serverless approach means we don't manage a server. Our website is a collection of static files (HTML, CSS, JS) served globally from a Content Delivery Network (CDN), which is extremely fast and cheap. For dynamic actions (like tracking clicks or saving feedback), we use small, on-demand "serverless functions" that run for a few milliseconds, and we only pay for that exact execution time.

1.3 Unique Selling Proposition (USP)

Den Rette Gave's competitive advantage is a superior, intelligent, and adaptive user experience. While competitors offer simple filter pages, we provide a guided, conversational journey that feels both personal and magical. Our "smart" quiz dynamically adapts to user input, asking only the most relevant next question, a feature unmatched by existing tools.

2.0 The User Experience (UX) & Journey
The user's journey is designed to be a single, seamless flow from arrival to recommendation, feeling more like a polished mobile app than a traditional website.

2.1 User Journey Flowchart

The user's journey begins on the Landing Page. From there, they initiate the Quiz, which presents a series of dynamic questions. At any point after the first few questions, the user has an optional path to get an immediate recommendation. Otherwise, they complete the quiz naturally. Both paths lead to the Results Page, where they see the recommended product(s) and can rate, report, or share the suggestion. The final step is clicking through to the partner's affiliate store to make a purchase.

2.2 Detailed Interaction Design

Transitions: All view changes (e.g., landing to quiz) will use a gentle cross-fade and slight vertical slide animation. This prevents jarring page reloads and maintains a sense of place.

Micro-interactions: Buttons will subtly change size or shadow on hover. Selected quiz options will have a clear, colored border and checkmark. These small details make the interface feel responsive and alive.

The "Early Exit": This button will appear with a soft fade-in animation, ensuring it doesn't distract from the question at hand but is available once the user has provided enough information for a basic recommendation.

Feedback Loops: Users can rate suggestions and report issues directly from the results card, making them active participants in quality control.

3.0 Technical Architecture & System Design
3.1 System Architecture Diagram

The system has three core components: the User's Browser, the Hosting Provider, and our Serverless Functions.

The User's Browser loads the initial public website files (index.html, products.json, etc.) from the Hosting Provider.

All quiz logic happens within the browser for speed.

When a dynamic action is needed (like submitting a rating or creating a share link), the browser sends an API call to a specific Serverless Function.

The Serverless Function then securely accesses our private data files (like ratings.json and shares.json), which are stored in a non-public location, performs its task, and returns a response.

3.2 Technology Stack & Rationale

Languages: HTML5, CSS3, JavaScript (ES6+).

Styling: Tailwind CSS.

Hosting & Backend: Netlify or Vercel.

If you deploy to Netlify, be sure its **Functions directory** points to `functions`. You can either set this in your site settings or include a `netlify.toml` file:

```
[build]
  functions = "functions"
  publish = "."
```

Without this configuration, requests like `/.netlify/functions/admin-login` will return 404.

3.3 Detailed File Structure

/
├── index.html
├── admin.html
├── privacy-policy.html
├── terms-of-service.html
|
├── assets/                 // Publicly accessible folder
│   ├── products.json       // Public: The core database of all gift products.
│   ├── questions.json      // Public: The script for the quiz flow.
│   ├── flags.json          // Public: User-submitted error reports.
│   └── analytics.json      // Public: stores site analytics.
|
├── data/                   // PRIVATE: This folder is NOT publicly accessible.
│   ├── ratings.json        // PRIVATE: Stores user ratings and anonymized answers.
│   └── shares.json         // PRIVATE: Stores data for shareable links.
|
└── functions/              // Directory for our serverless backend logic.
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

5.0 Visual Identity & Design Language
This section defines the aesthetic principles of the Den Rette Gave brand, ensuring a consistent and professional user experience.

5.1 Design Philosophy

Our design philosophy is rooted in minimalism and clarity. The user is on a mission to solve a problem (finding a gift), and our interface must be a frictionless tool to help them achieve that goal. We avoid clutter, unnecessary animations, and competing calls-to-action. Every element on the screen serves a purpose in guiding the user through the quiz. The generous use of white space creates a calm, focused environment, reducing cognitive load and making the process feel effortless.

5.2 Color Palette

The color palette is intentionally limited to create a clean, modern, and trustworthy aesthetic.

Role

Color Name

Hex Code

Tailwind Class

Usage

Primary (Action)

Slate Blue

#4F46E5

bg-blue-600

Primary buttons ("Start Guiden"), selected states, key interactive elements.

Text & Headers

Charcoal

#1F2937

text-slate-800

All primary text for maximum readability.

Background

Off-White

#F9FAFB

bg-slate-50

The main background color of the application.

Borders & Accents

Light Gray

#E5E7EB

border-slate-200

Subtle dividers, borders, and inactive element backgrounds.

5.3 Typography

Font Family: 'Poppins' (served from Google Fonts).

Why Poppins?: We chose Poppins for its clean, geometric letterforms and friendly, modern character. It is highly legible on screens of all sizes and offers a range of weights that allow us to create a clear typographic hierarchy without needing multiple fonts.

Hierarchy:

Headings (H1, H2): Bold weight (700) for maximum impact and clear section definition.

Subheadings (H3): Semi-bold weight (600) to guide the user within sections.

Body Text: Regular weight (400) for optimal readability in paragraphs.

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

**Role:** You are an expert e-commerce curator and data analyst specializing in unique and high-quality gifts available in Denmark.

**Objective:** Find 10 unique gift *ideas* that fit a specific niche. For each product idea, you must perform detailed analysis to provide its name, a short compelling description, its exact price in DKK, the direct URL to the product page, a direct URL to a high-quality product image, and a comprehensive set of structured tags based on the product page's content.

**CRITICAL INSTRUCTION: Before you begin, you MUST visit the following URL, retrieve its contents, and use the "name" and "url" of every product in that file as an exclusion list. Do NOT suggest any product that is already on this list.**
**Exclusion List URL:** https://denrettegave.dk/assets/products.json

**Variation Handling Clause:**
If a product you select has multiple variations (e.g., 3 colors and 4 sizes), you must create a separate JSON object for *each individual variant*. For example, a t-shirt in 3 colors and 4 sizes should result in 12 separate JSON objects. **These variations do not count towards your goal of finding 10 unique product ideas.** You must still find 10 distinct products, and then expand them with all their variations.

**Tagging & Variation Analysis Instructions:**
For each product variant, you must deduce the following attributes and structure them in a `tags` object.
1.  **Analyze Variations:** Examine the product page for options like color, size, material, or subscription duration. List these variation types in the `differentiator_tags` array. This array should be identical for all variants of the same product.
2.  **Populate Tags:** Based on the product's description, title, and category, populate the `tags` object. Use your best judgment.
    * `gender`: "Mand", "Kvinde", or "alle".
    * `age`: Estimate appropriate age ranges (e.g., "18-25", "26-40", "41-60", "60+").
    * `interests`: Deduce relevant interests (e.g., "Mode", "Gaming", "Madlavning", "Outdoor").
    * `occasion`: Suggest suitable occasions (e.g., "Fødselsdag", "Jul", "Årsdag").
    * `brand`: Identify the product's brand name.
    * `color`, `size`, etc.: If you identified these as differentiators, list the specific option for the product URL you are providing (e.g., `color: ["Blå"]`, `size: ["Medium"]`).

**Output Format (Strict):**
The output MUST be a valid JSON array. Each object must follow this exact structure.

```json
[
  {
    "name": "Klassisk T-shirt (Blå, Medium)",
    "description": "En blød og komfortabel t-shirt i høj kvalitet, perfekt til hverdagsbrug.",
    "price": 299,
    "url": "[https://www.example.dk/tshirt-blue-m-affiliate](https://www.example.dk/tshirt-blue-m-affiliate)",
    "image": "[https://www.example.dk/images/tshirt-blue.jpg](https://www.example.dk/images/tshirt-blue.jpg)",
    "differentiator_tags": ["color", "size"],
    "tags": {
      "gender": ["Mand", "alle"],
      "age": ["18-25", "26-40"],
      "interests": ["Mode", "Fritid"],
      "occasion": ["Fødselsdag", "Bare fordi"],
      "brand": ["BrandX"],
      "color": ["Blå"],
      "size": ["Medium"]
    }
  }
]

7.1.1 LLM Prompt for Processing Pre-selected Affiliate Links

**Role:** You are an expert e-commerce curator and data analyst. Your task is to process a list of provided product URLs, visit each one, and convert them into a structured JSON format.

**Objective:** For each affiliate URL provided in the list below, you must visit the webpage and perform a detailed analysis. Extract the product's name, a short compelling description, its exact price in DKK, a direct URL to a high-quality product image, and a comprehensive set of structured tags.

**CRITICAL INSTRUCTION: The `url` field in your final JSON output for each product MUST be the exact affiliate URL I provide below.**

**Tagging & Variation Analysis Instructions:**
For each product, you must deduce the following attributes and structure them in a `tags` object.
1.  **Analyze Variations:** Examine the product page for options like color, size, material, or subscription duration. List these variation types in the `differentiator_tags` array.
2.  **Populate Tags:** Based on the product's description, title, and category, populate the `tags` object. Use your best judgment.
    * `gender`: "Mand", "Kvinde", or "alle".
    * `age`: Estimate appropriate age ranges (e.g., "18-25", "26-40", "41-60", "60+").
    * `interests`: Deduce relevant interests (e.g., "Mode", "Gaming", "Madlavning", "Outdoor").
    * `occasion`: Suggest suitable occasions (e.g., "Fødselsdag", "Jul", "Årsdag").
    * `brand`: Identify the product's brand name.
    * `color`, `size`, etc.: If you identified these as differentiators, list the specific option for the product URL you are providing (e.g., `color: ["Blå"]`, `size: ["Medium"]`).

**Product List to Process:**
[
  "[https://www.partner-site.dk/product-a?affiliate_id=123](https://www.partner-site.dk/product-a?affiliate_id=123)",
  "[https://www.another-site.com/item-b?ref=xyz](https://www.another-site.com/item-b?ref=xyz)",
  "[https://www.example-store.com/product-c/variant-1?tracking_code=abc](https://www.example-store.com/product-c/variant-1?tracking_code=abc)"
]

**Output Format (Strict):**
The output MUST be a valid JSON array. Each object must follow this exact structure, corresponding to one of the URLs I provided.

```json
[
  {
    "name": "Produkt A Navn",
    "description": "En fantastisk beskrivelse af produkt A.",
    "price": 899,
    "url": "https://www.partner-site.dk/product-a?affiliate_id=123",
    "image": "https://www.partner-site.dk/images/product-a.jpg",
    "differentiator_tags": ["material"],
    "tags": {
      "gender": ["alle"], "age": ["26-40"], "interests": ["Hjemmet", "Design"],
      "occasion": ["Indflyttergave"], "brand": ["BrandA"], "material": ["Eg"]
    }
  }
]

7.2 Content Curation Workflow

The workflow for turning automated leads into live products is as follows:

The process begins with an Automated LLM Run, which generates a list of product leads in JSON format.

This list undergoes Human Review & Curation.

During the review, products are either Discarded (if low quality) or Approved.

Approved products move to a Verify & Enhance Data step, where the curator confirms the accuracy of all information.

Finally, the verified data is published to the live site via the Admin Panel.

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

