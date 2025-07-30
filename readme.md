# Den Rette Gave: Master Project Specification & Technical Report

Version: 9.0 (Master Blueprint – AI Integration & Serverless Architecture)

Date: July 30, 2025

Author: Gemini (Lead Developer & Copywriter)

## 1.0 Executive Summary & Vision

This document serves as the single, authoritative source of truth for the **Den Rette Gave** project. It is a comprehensive blueprint detailing the project's vision, business strategy, user experience, and the intricate, cost-optimized technical architecture that underpins our service. We articulate not only the "what" and "how" but also the critical "why" behind every strategic decision, from our hybrid recommendation engine to our serverless infrastructure. This report is designed to be fully self-contained, requiring no external context for a complete understanding by any stakeholder, whether they are developers scrutinizing our technical stack, business strategists analyzing our market position, or back-office personnel managing our affiliate partnerships.

Den Rette Gave is an automated, intelligent gift-finding quiz designed to deliver the perfect, personalized gift suggestion every time. Our core innovation lies in a **hybrid model** that synergizes highly sophisticated **client-side logic** with a seamlessly integrated **personal AI shopper**. We operate on a no-user-cost, affiliate marketing business model, which dictates our foundational strategy: to achieve and maintain profitability by delivering a premium, highly responsive user experience while keeping operational costs minuscule, often in the fractions of a cent per completed quiz.

This document meticulously details how we navigate this balance. It outlines our brutally cost-effective serverless architecture, the system of weighted tags and dynamic scoring that powers our initial filtering, and the finely tuned, minimal API calls that leverage our AI agent to ask the single smartest question needed to finalize a recommendation. It also addresses the strategic imperative of balancing user satisfaction with the needs of our diverse affiliate partners, ensuring discoverability for both large retailers and niche webshops, which ultimately serves the user's desire for truly tailored and unique gift ideas.

### 1.1 Project Vision

Our vision is to create the most intelligent, trusted, and user-friendly starting point for gift discovery in the Danish market. **Den Rette Gave** will eliminate the friction and decision fatigue of traditional online shopping by providing a delightful, guided experience that results in perfect, personalized gift recommendations. We aim to be the first thought for anyone struggling to find a meaningful gift, transforming a potentially stressful task into an effortless and enjoyable journey.

The intelligence of our platform is the cornerstone of this vision, delivered through a sophisticated **hybrid model** that marries the raw speed of client-side computation with the nuanced reasoning of a personal AI shopper. This process unfolds in three distinct stages:

1. **Initial Client-Side Filtering:** The user's journey begins with a core suite of questions (e.g., Relation, Occasion, Age, Gender, Budget). These answers are not merely filters; they trigger a dynamic scoring algorithm that runs entirely within the user's browser. It applies a series of hard and soft limits, instantly analyzing the entire product catalog (products.json) and assigning relevance scores to each item. This initial heavy lifting is performed at near-zero latency and at no operational cost to us, creating a lightning-fast and responsive foundation for the quiz.
2. **The Interests Hub:** Following the initial questions, the user is guided into our intuitive, multi-layered interest selection module. This system is powered by a deep, hierarchical structure of interests and their relationships (interests.json). It allows users to specify the recipient's passions with increasing granularity, from broad categories like "Sport & fitness" down to niche activities like "Fluebinding" (fly tying). The more specific the interest selected, the higher the score boost for corresponding products, a mechanism designed to ensure that highly relevant, niche items are surfaced effectively and can compete with more mainstream products.
3. **The AI Personal Shopper:** Once the client-side logic has produced a ranked shortlist of promising candidates, our integrated AI agent takes over. The AI does not review the entire product list; instead, it receives a concise summary of the top-scoring products, their associated tags, and their relative scores. Its task is to act as an expert personal shopper: analyze the remaining contenders and generate the single smartest question to differentiate between them. For example, if the top two gifts are similar but differ in material, the AI might ask, "Er de mere til hygge derhjemme, eller skal der ske noget ude i det fri?" to distinguish between a home-focused versus an outdoor-focused product. These surgical, context-aware prompts are the result of finely tuned, minimal API calls, providing the "magic" of a personal consultation without the exorbitant cost of a purely AI-driven model.

This combination of rapid client-side processing and precise AI inquiry allows us to deliver a deeply personalized experience that feels like getting advice from a knowledgeable friend or personal shopper who truly understands your needs. By guiding the user through this intelligent funnel, we solve the core problem of being overwhelmed by infinite choice, making the act of finding the perfect gift not just easy, but genuinely insightful and rewarding.

### 1.2 Business Model & Strategy

**Core Concept: Affiliate Marketing** – We build a highly useful, free-to-use tool that recommends products. When a user clicks our recommendation and purchases the product from the partner retailer's website, we earn a percentage of that sale (an affiliate commission). This provides revenue without charging the user or handling any inventory, logistics, or customer service ourselves. The user gets a great, personalized gift recommendation and a seamless buying experience; the retailer gets a qualified customer and a sale; we earn a commission for facilitating the connection—a win-win-win scenario.

The foundational business strategy is to achieve and maintain profitability by **radically minimizing operational costs** while scaling user adoption and delivering a premium experience. We accomplish this through a meticulously engineered **serverless architecture** coupled with a hybrid recommendation engine that strategically offloads computational work. This ensures that the vast majority of our affiliate revenue translates directly into profit rather than being consumed by infrastructure expenses.

What is a Serverless Architecture?

Traditionally, websites require a dedicated server running 24/7 to handle requests, which incurs constant costs and significant maintenance overhead. A serverless approach, as we have implemented it, eliminates the need to manage any long-running servers.

- **Static-First Delivery:** Our website is a collection of static files (HTML, CSS, JavaScript, and our core JSON data files like products.json and interests.json) served globally via a Content Delivery Network (CDN). This is extremely fast, reliable, and inexpensive.
- **Client-Side Execution:** The majority of the quiz logic—including the complex initial filtering and dynamic scoring of products—runs **client-side**, entirely within the user's web browser. This is a critical strategic decision that offloads the most intensive computational work from our infrastructure to the user's device, costing us nothing.
- **On-Demand Functions:** For any dynamic action that requires a secure backend process (like saving user feedback to our database, interacting with the OpenAI API, or authenticating an administrator), we use small, on-demand **serverless functions**. These functions execute in the cloud only when needed, typically for just a few hundred milliseconds, and we pay **only for the precise time they run**.

This architecture virtually eliminates the cost of idle capacity. If a thousand users complete a quiz simultaneously, our CDN handles the static file delivery effortlessly, and the core logic runs on their own devices. The only backend load comes from the few, brief function calls made at the end of the process, such as generating an AI question or saving a rating. The cost might be a few cents in total, whereas a traditional server capable of handling that peak traffic would cost significantly more per month, even when sitting idle most of the time.

This brutal cost-effectiveness extends to our use of AI. Our hybrid model is explicitly designed to use expensive LLM API calls as a final, surgical tool. The AI personal shopper is only invoked after our free, client-side logic has already narrowed the product selection down to a handful of strong contenders. The prompts sent to the AI are finely tuned to be concise and elicit a structured JSON response, further minimizing token usage and cost.

By avoiding server management, we sidestep concerns about server crashes, security patching, and scaling for peak holiday traffic. This allows us to focus our resources exclusively on building a superior product and curating high-quality gift suggestions, ensuring that even with modest initial affiliate revenue, the project remains sustainable and profitable from the outset.

### 1.3 Unique Selling Proposition (USP)

**Den Rette Gave’s** competitive advantage is the **superior intelligence and personalization** of its gift-finding experience, achieved through a unique hybrid engine that competitors cannot easily replicate. While competing sites offer either basic, rigid filters or costly, unpredictable AI chatbots, we provide a guided, conversational journey that is simultaneously efficient, insightful, and economically viable.

Our core USP is not merely "using AI"; it is the **strategic integration of rapid client-side logic with a surgical AI agent**. This creates a user experience that feels uniquely tailored and almost magical.

1. **Deeply Structured Data & Rapid Client-Side Scoring:** Our quiz doesn't just filter; it scores. The initial phase of the quiz leverages a deep repository of product tags and a multi-layered, hierarchical interest database (interests.json) to perform complex scoring calculations directly in the user's browser. This process is incredibly fast and responsive because it requires no server communication. It intelligently narrows hundreds of potential products down to a handful of top contenders based on the user's explicit inputs, handling the broad categorization with unmatched efficiency.
2. **Surgical AI for Differentiation:** This is where our true "magic" lies. Once our client-side engine has identified the top 5-10 products, we deploy our AI Personal Shopper—not as a general-purpose search tool, but as a specialist tie-breaker. The AI is fed a concise summary of the leading candidates and their differentiating tags. Its sole task is to generate the single most intelligent question to distinguish between these finalists. This surgical use of AI is our key innovation: it provides the nuanced, human-like insight of a personal shopper at the most critical moment of the decision process, while avoiding the high costs and latency of a fully AI-driven system.

This hybrid approach creates an experience that feels both logical and uncannily perceptive. Users are guided through a structured process that respects their time, culminating in a single, smart question that often crystallizes the perfect choice. This is what makes users feel the platform is "reading their mind"—a capability that goes far beyond the static lists and basic filters that define the current market.

Replicating this model would require a competitor to not only build a similarly sophisticated client-side application but also to curate an equally rich, structured product database and develop the specific, finely-tuned AI prompts that enable this "differentiator" strategy. It is this seamless fusion of structured data, client-side speed, and surgical AI that constitutes our defensible competitive advantage, allowing us to solve the user's problem of decision fatigue more effectively and efficiently than any other tool available.

## 2.0 The User Experience (UX) & Journey

The user's journey is meticulously designed to be a single, seamless, and progressively intelligent conversation. It unfolds within a single-page application interface, eliminating jarring page reloads and creating an experience that feels more like a polished, native application than a traditional website. Our primary UX goal is to guide the user from a state of uncertainty ("What should I buy?") to a moment of confident discovery ("This is the perfect gift!") with minimal friction and maximum insight. We achieve this by abstracting the underlying complexity of our hybrid engine—the user is never exposed to the scoring algorithms or the AI prompts; they simply experience a logical and intuitive sequence of questions that feel increasingly personal and relevant.

The journey can be summarized in five distinct stages that represent a gradual narrowing of the gift funnel, moving from broad, user-driven inputs to a precise, AI-refined conclusion:

1. **Welcome & Initiation**: The user lands on a clean, focused hero page and is invited to start the quiz.
2. **Foundation & Scoring (Client-Side Logic)**: The user answers a suite of initial, high-impact questions (Relation, Gender, Age, Occasion, Budget). These answers trigger a powerful, instantaneous scoring and filtering process that runs entirely within their browser, creating a ranked shortlist of potential products from our entire catalog. This is where the heavy lifting happens at zero cost and latency.
3. **Interest & Granularity (The Interests Hub)**: The user interacts with our multi-layered interest selection module. This crucial step allows for deep personalization, as users can select broad interests (e.g., "Sport & fitness") which then suggest more specific sub-interests (e.g., "Golf," "Yoga"). Selections here apply significant weight to the scoring algorithm, ensuring niche products can effectively surface.
4. **AI-Powered Differentiation**: With a narrowed field of top-scoring candidates, our AI Personal Shopper takes over. It analyzes the remaining contenders and generates smart, differentiating questions to break ties and move closer to a final recommendation.
5. **Final Tie-Breaker (Hard-Coded Logic)**: In the final stage, if the AI has narrowed the options to two or three nearly identical products that differ only by a simple variation (e.g., color, material), the system may retake control. It will ask a simple, hard-coded question (e.g., "Would they prefer stainless steel or teak wood?") to make the final distinction. This is a deliberate, cost-effective step to handle simple tie-breakers with perfect reliability.
6. **Recommendation**: The quiz concludes and presents the **Results Page**, where the top gift is displayed as a primary recommendation, supported by a few strong alternatives.

This entire flow is designed to feel like a natural conversation with a skilled gift consultant who first understands the basics, then dives into the recipient's passions, asks clever questions to narrow the field, and finally confirms a minor detail to select the perfect item.

### 2.1 User Journey Flowchart

**Overview:** The user’s journey is a dynamic and non-linear path from broad categorization to specific recommendation. The process begins on the **Landing Page** (index.html), where a clear call-to-action funnels the user into the **Quiz Section**. The quiz itself is not a static list of questions but a multi-stage, adaptive experience orchestrated by quiz-logic.js.

The journey unfolds as follows:

1. **Initial Foundational Questions**: The quiz always begins with a predefined set of foundational questions sourced from questions.json (e.g., Relation, Gender, Age, Occasion, Budget). As the user answers each question, the client-side engine performs two critical actions in real-time:
    - **Hard Filtering**: Non-negotiable limits are applied. For example, selecting a "low" budget will permanently filter out products tagged as "dyr" (expensive). Selecting "mand" (man) as the gender will filter out products tagged _exclusively_ for "kvinde" (woman).
    - **Dynamic Scoring**: All remaining products have their scores adjusted based on the user's answers. A product matching the selected tags (e.g., a product tagged for the chosen occasion) receives a score boost, causing it to "climb" the internal leaderboard. This entire process happens instantly in the browser after each answer.
2. **The Interests Hub**: After the foundational questions, the user is presented with the "Interests Hub" interface. This is a critical, interactive stage where the user defines the recipient's passions. The user can select from suggested top-level interest "pills" (e.g., "Mad & drikke"), which then reveal more specific child interests, or they can use a search bar to find any interest directly from our comprehensive interests.json hierarchy. Each selected interest, especially granular ones, provides a significant score boost to corresponding products, further refining the ranked list of candidates.
3. **AI Personal Shopper Intervention**: Once the user completes the Interests Hub, the quiz transitions to its most intelligent phase. The client-side logic analyzes the current product scores. If a clear winner has emerged with a score significantly higher than the runner-up, the quiz may conclude and show the results. More commonly, however, there will be several high-scoring contenders. At this point, quiz-logic.js makes a serverless API call to generate-ai-question.js. It sends a concise payload containing the user's answers and a summary of the top candidate products and their differentiating tags. The AI's task is to analyze this context and return a single, smart question designed to best differentiate between the leading options.
4. **Dynamic Question Loop**: The user is presented with the AI-generated question. Their answer provides new tags that are fed back into the scoring algorithm, further adjusting the product rankings. This loop can repeat: if there is still no clear winner, another API call is made to generate a subsequent differentiating question. Throughout this AI-driven phase, an **"early exit"** button ("Vis mig resultater nu") is available, allowing the user to bypass further questions and see the current top-ranked gifts at any time.
5. **Final Differentiation via Hard-Coded Variations**: In the final stage of the quiz, if the AI-driven questions have successfully narrowed the field to two or three top contenders that are nearly identical (e.g., the same piece of jewelry in gold vs. silver), the system is designed to "retake control" from the AI. Instead of making another costly and potentially unnecessary API call, quiz-logic.js will identify that the primary difference lies in the products' differentiator_tags (e.g., material:guld vs. material:sølv). It will then select a simple, pre-written, hard-coded question from questions.json that directly addresses this variation (e.g., "Foretrækker de guld eller sølv?"). The answer to this final question applies a heavily weighted score, acting as a definitive tie-breaker to finalize the top recommendation.
6. **Conclusion & Results Page**: The quiz concludes when a product achieves a dominant score, the pool of remaining products becomes very small, or the user opts for an early exit. The user is then transitioned to the **Results Page**, where the highest-scoring product is displayed as the primary recommendation, with the next 5-10 runners-up shown as secondary suggestions. Here, the user can click the affiliate link, share the result, or provide feedback before restarting the quiz if they wish.

### 2.2 Detailed Walkthrough: Example User “Maria”

To make the hybrid quiz flow concrete, let’s follow a typical user, Maria, using Den Rette Gave to find a birthday gift for her partner, Alex.

- **Landing Page & Initiation:** Maria arrives at denrettegave.dk. The page is clean and focused, presenting a clear headline: "Gaven, der altid rammer plet." and a single, prominent call-to-action button: “Tag quizzen nu!”. She clicks it, and the hero section smoothly transitions away to reveal the quiz interface without a page reload.
- **Quiz Phase 1: Foundational Questions & Client-Side Scoring:** The quiz begins with the core, hard-coded questions that build the foundation of the user profile.
    1. **"Hvem skal forkæles?"** (Who is the gift for?). Maria selects "Min partner". Instantly, quiz-logic.js processes this. It doesn't just store the answer; it iterates through all products in products.json and gives a score boost to every item tagged with relation:partner.
    2. **"Og er det en han, en hun, eller spiller det ingen rolle?"** (Is it a he, a she, or does it not matter?). She selects "Han" (He). The engine now applies a hard filter, immediately removing any products tagged exclusively as gender:kvinde (e.g., women's perfume) from the pool of remainingProducts. Products tagged gender:mand or gender:alle remain.
    3. Next are questions about age ("Ung og lovende (20-29 år)") and occasion ("Fødselsdag"). With each click, the client-side scoring algorithm continues its work in milliseconds, further refining the product leaderboard.
    4. Finally, she’s asked about budget: **"Hvad må gaven koste?"** (What should the gift cost?). She chooses "Noget lækkert (200-500 kr.)". The system then asks the follow-up question triggered by this price range: **"Skal vi kun vise gaver i den prisklasse...?"** (Should we only show gifts in this price range...?). Maria selects "Nej, hold dig til budgettet" (No, stick to the budget), applying a strict price filter. All products outside the 200-500 DKK range are now filtered out.
- **Quiz Phase 2: The Interests Hub:** With the foundational profile established, the interface transitions to the Interests Hub. The prompt reads: **"Hvad interesserer personen sig for?"**.
  - Maria sees several broad "pills" like "Tech & gadgets" and "Mode, tøj & smykker". She knows Alex appreciates well-made accessories, so she clicks on **"Mode, tøj & smykker"**.
  - She then uses the search bar to type "læder" (leather), as Alex likes leather goods. The autocomplete suggests "Læderarbejde" (leatherwork), which she clicks.
  - These two selected interests, "mode_tøj_smykker" and "læderarbejde," are added to her profile. Behind the scenes, products with these tags—especially the more specific læderarbejde tag—receive a significant score increase. The byRavn leather products in the catalog likely surge to the top of the rankings. However, a stylish Kreafunk portable speaker, tagged under gadgets but also with a broad mode_tøj_smykker parent interest, might still be a strong contender.
- **Quiz Phase 3: AI-Powered Differentiation:** Maria clicks "Videre" (Continue). The quiz engine determines that while leather goods are in the lead, there isn't a single clear winner. This is the trigger to engage the AI Personal Shopper.
  - quiz-logic.js sends a payload to the generate-ai-question function. The payload includes Maria's answers (relation:partner, gender:mand, interest:læderarbejde, etc.) and a summary of the top-scoring themes, for instance: "Contender themes: læderarbejde (Score: 8.5), mode (Score: 6.0), gadgets (Score: 5.5)...".
  - The AI analyzes this context. Its goal is to differentiate between the top candidates—a handmade leather item versus a cool tech gadget. It generates and returns a tailored question.
  - Maria now sees a new question on her screen: **"Perfekt! For at ramme helt plet: er Alex typen, der værdsætter unikt, håndlavet design, eller er han mere til smarte, tekniske gadgets, han kan bruge i hverdagen?"** (Perfect! To get it just right: is Alex the type who appreciates unique, handmade design, or is he more into smart, technical gadgets he can use every day?).
  - Maria knows Alex loves things with a personal story, so she selects the "Håndlavet design" option. This answer applies a massive score boost to products with tags like håndarbejde and kunsthåndværk, solidifying the byRavn products' lead and causing the Kreafunk speaker's score to fall behind relatively.
- **Quiz Phase 4: Final Tie-Breaker (Hard-Coded Logic):** The AI has successfully identified the _category_ of gift. Now, the scoring algorithm sees that the top two products are the byRavn TX10 Nøglering and the byRavn Skrivebordsunderlag, both with very high and nearly identical scores. The engine detects their primary difference lies in a differentiator_tag: the keychain has personalization:true, while the desk mat does not.
  - Instead of calling the AI again, quiz-logic.js retakes control. It finds a pre-written, hard-coded question in questions.json designed specifically to resolve this tie-breaker.
  - Maria sees the final question: **"En sidste ting: skal gaven kunne gøres personlig med en indgravering eller en særlig tekst?"** (One last thing: should it be possible to personalize the gift with an engraving or a special text?).
  - She clicks "Ja, det ville være perfekt!". This final answer applies a decisive score multiplier to the byRavn TX10 Nøglering, making it the undisputed winner.
- **Results Page & User Actions:** The quiz concludes. Maria is presented with the **Results Page**.
  - The primary recommendation is the **byRavn TX10 Nøglering med Personlig Tekst**, displayed prominently with a large image, description, price, and a "Se gaven" button that leads to the affiliate partner's site.
  - Below, a section titled "Andre gode forslag..." shows the runners-up, including the desk mat and perhaps other leather accessories.
  - Maria is delighted with the suggestion. She can now provide feedback via a 1-5 star rating, report a problem if she saw one, or click the **Share** button to get a unique link (denrettegave.dk/?share=ABC123) to send to a friend for a second opinion. Satisfied, she clicks the affiliate link to purchase the keychain, completing her journey.

### 2.3 The “Share Result” Viral Loop

To encourage organic growth and leverage the satisfaction of a successful gift recommendation, we have integrated a "Share Result" feature designed to create a viral loop. This mechanism transforms a happy user into a brand ambassador by making it effortless to share their specific discovery with others, introducing new potential users to our platform at zero acquisition cost.

On the results page, alongside the affiliate link and feedback options, the user sees a **“Del”** (Share) button. Clicking this initiates a seamless background process that generates a unique, permanent link to their specific gift recommendation.

**User Experience of Sharing (Maria's Perspective):**

Following our example, Maria is on the results page looking at the recommended byRavn TX10 Nøglering. Perhaps she wants to get a second opinion from Alex's best friend, or even subtly hint at the gift to Alex himself.

1. **Initiation**: Maria clicks the "Del" button.
2. **Modal Display**: A share modal window appears on the screen. It contains a pre-generated, read-only link (e.g., <https://denrettegave.dk/?share=68d8b1a2f3c4e5d6f7a8b9c0>) inside a text input field, along with a "Kopiér" (Copy) button.
3. **Action**: Maria clicks "Kopiér". The link is copied to her clipboard, and a small confirmation message, "Link kopieret!", appears briefly. She can now paste this link into a message, email, or social media post.

**The Experience for the Link Recipient:**

Let's say Maria sends the link to Alex's friend, Jonas.

1. **Accessing the Link**: Jonas clicks the link. His browser navigates to denrettegave.dk.
2. **Bypassing the Quiz**: Instead of seeing the landing page, the client-side script (quiz-logic.js) immediately detects the share parameter in the URL. It shows a brief loading state, "Henter delt resultat..." (Fetching shared result...).
3. **Displaying the Result**: The script makes an API call to retrieve the shared data. Once received, it reconstructs and displays the exact same results page that Maria saw, with the byRavn TX10 Nøglering as the primary recommendation and the same secondary suggestions. The quiz is completely bypassed.
4. **Onboarding a New User**: Jonas is now on our site and has seen a high-quality, personalized recommendation. The page will also feature clear calls-to-action inviting him to "Start forfra" (Start over) to find a gift for someone in his own life, effectively converting a shared link into a new user session.

**Technical Implementation:**

This viral loop is powered by two dedicated serverless functions and a MongoDB collection, ensuring the process is robust, secure, and scalable.

1. **Creating the Link (create-share-link.js):** When Maria clicks "Share", the frontend sends a POST request to the /api/create-share-link endpoint. The request body contains the primary product_id and the complete quiz_answers array that led to the recommendation.
    - The serverless function receives this data. As a critical privacy measure, it first sanitizes the quiz_answers object to ensure no personally identifiable information (like a recipient's name, should that question ever be added) is stored.
    - It then creates a new document containing the productId and the sanitized quizAnswers and inserts it into the shares collection in our MongoDB database.
    - MongoDB automatically assigns a unique, unguessable \_id (an ObjectId) to this new document. The function converts this \_id to a string and returns it in the JSON response to the client (e.g., { "shareId": "68d8b1a2f3c4e5d6f7a8b9c0" }).
2. **Retrieving the Result (get-shared-result.js):** When Jonas visits the shared URL, the frontend script parses the shareId from the query parameters and makes a GET request to /api/get-shared-result?id=&lt;shareId&gt;.
    - This function receives the shareId, validates it, and uses it to query the shares collection for a document with a matching \_id.
    - If a matching document is found, the function returns the stored product_id and quiz_answers to the client in a JSON response. If no document is found (e.g., an invalid ID or a deleted record), it returns a 404 Not Found error, which the frontend handles gracefully by showing an error message to Jonas.

This architecture ensures that the state of a quiz result can be captured and perfectly reproduced for a new user, providing a seamless sharing experience that serves as a powerful, built-in engine for organic user acquisition.

## 3.0 Technical Architecture & Infrastructure

To deliver the seamless user experience described above with maximum performance, high reliability, and radically minimal operational costs, we have engineered a modern web architecture based on a **serverless, static-first philosophy**. This section provides a high-level blueprint of the system's components and how they interact to power the Den Rette Gave platform. Our approach deliberately avoids traditional, monolithic server infrastructure in favor of a distributed, on-demand model that is inherently simple, secure, and scalable.

We leverage trusted third-party managed services for hosting, backend logic, and data storage, allowing us to focus our resources on application development and content curation rather than server maintenance. The architecture consists of three primary, interconnected layers:

- **Client (Browser)**: The user’s web browser acts as the primary runtime for the application. Upon visiting denrettegave.dk, the browser downloads a complete package of static files (HTML, CSS, JavaScript) and our core data catalogs (products.json, interests.json). This is a critical strategic decision: the browser is responsible for not only rendering the UI but also for executing the entire client-side portion of our hybrid recommendation engine. This includes managing the quiz state, applying hard filters, and performing the complex, real-time scoring of all products based on the user's initial answers and interest selections. By offloading this computational heavy lifting to the client, we achieve near-zero latency for the user and near-zero operational cost for us during the most intensive phase of the quiz.
- **Serverless Functions (APIs)**: Our backend logic is not a constantly running server but a collection of discrete, on-demand **serverless functions** hosted on Netlify. These functions act as secure, specialized micro-services that are invoked by the client via HTTPS requests to perform tasks that the browser cannot or should not handle directly. Their responsibilities are strictly defined and include:
  - Interfacing with secure third-party APIs that require secret keys, most notably calling the OpenAI API to generate AI-driven questions.
  - Securely writing and reading data from our private cloud database, such as submitting user feedback, creating shareable links, and handling administrator actions.
  - Enforcing security and authentication for the admin panel.
- **Data Storage (Hybrid Model)**: Our data is strategically split between two storage types to optimize for performance, cost, and security:
  - **Static JSON Files**: The core, read-only data that powers the quiz—such as the complete product catalog (products.json), the hierarchical interest data (interests.json), and the initial pool of questions (questions.json)—is stored as static JSON files within the /assets directory. These files are deployed as part of the static site and served globally via a Content Delivery Network (CDN), ensuring they are delivered to the user's browser with extreme speed.
  - **Cloud Database (MongoDB Atlas)**: Dynamic, user-generated, or sensitive data is stored securely in a managed MongoDB Atlas database. This includes collections for user-submitted ratings (ratings), problem reports (flags), and the data for our shareable links (shares). This database is not publicly accessible; it can only be queried and modified by our secure serverless functions, which connect using credentials stored in protected environment variables.

This serverless, hybrid architecture forms a robust, scalable, and brutally cost-effective foundation for Den Rette Gave, allowing us to deliver a sophisticated, AI-enhanced experience that remains profitable even at a small scale.

### 3.1 Hosting and Deployment

Our entire application is hosted on **Netlify**, a modern platform that specializes in our chosen **serverless, static-first architecture**. This choice is strategic, as Netlify's infrastructure and workflow are purpose-built to support our goals of high performance, automated scalability, robust security, and minimal operational overhead. Our deployment process is entirely Git-centric, treating our GitHub repository as the single source of truth for the entire application.

#### 3.1.1 Continuous Deployment (CD) Workflow

We employ a continuous deployment model, which automates the process of getting code changes from our repository to the live production environment. This creates a rapid, reliable, and low-risk release cycle.

1. **Git as the Source of Truth**: The main branch of our GitHub repository represents the definitive state of our live application. All changes, whether a code fix, a design tweak, or an update to the products.json catalog, are managed through Git commits.
2. **Automated Triggers**: Netlify is linked directly to our GitHub repository. Any git push to the main branch automatically triggers a new build and deployment process on the Netlify platform.
3. **Build & Deploy Process**: When a deployment is triggered, Netlify spins up a temporary environment, pulls the latest code, and builds the application. This process has two primary outputs:
    - **Static Assets**: All static files, including our root HTML files (index.html, admin.html, etc.), the style.css file, and the entire /assets directory (containing our JSON data files and images), are identified and prepared for distribution. These assets are then deployed to Netlify's global **Content Delivery Network (CDN)**. This ensures that when a user in Denmark visits our site, the files are served from a server geographically close to them, resulting in exceptionally fast load times.
    - **Serverless Functions**: Each JavaScript file within our /functions directory is individually packaged and deployed as a standalone, on-demand serverless function. Netlify automatically creates a corresponding API endpoint for each function. For example, the code in /functions/submit-rating.js becomes accessible at the URL <https://denrettegave.dk/.netlify/functions/submit-rating>.

This automated, atomic deployment process means that updates are rolled out seamlessly in minutes. A successful build results in the new version of the site being live instantly, while a failed build leaves the existing version untouched, preventing broken deployments.

#### 3.1.2 Configuration and Secrets Management

Security is a cornerstone of our architecture, particularly regarding sensitive credentials. We adhere to the best practice of never storing secrets directly in our codebase or Git repository.

- **Environment Variables**: All sensitive configuration data is stored as **environment variables** directly within the Netlify project settings. This includes:
  - Database credentials (MONGODB_URI).
  - Third-party API keys (OPENAI_API_KEY, GITHUB_TOKEN).
  - Application secrets (JWT_SECRET, ADMIN_PASSWORD).
- **Secure Runtime Access**: These environment variables are securely injected into the runtime environment of our serverless functions when they execute. Our function code accesses them via the process.env object in Node.js (e.g., process.env.MONGODB_URI). This data is never exposed to the client-side browser, ensuring that our API keys and database connection strings remain confidential.

This approach decouples our configuration from our code, allowing us to rotate secrets or change settings in the Netlify dashboard without needing to modify, commit, and redeploy the application code itself. This is both more secure and more flexible for long-term maintenance.

### 3.2 Component Overview (Client, CDN, Functions, Database)

- **User’s Browser (Client):** This is where the application’s frontend runs. When someone navigates to denrettegave.dk, their browser loads our static HTML/CSS/JS and essentially runs the app. The browser is responsible for rendering the UI, handling user input (quiz answers, button clicks), and performing all quiz logic locally. In effect, the browser becomes the “app runtime.” It also makes network calls to our backend functions when it needs to save or retrieve data that we don’t want to expose publicly.
  
- **Hosting Provider + CDN:** We host the site on Netlify, which serves our static files via a Content Delivery Network. The CDN ensures that no matter where the user is (in Denmark or potentially elsewhere), they fetch the files (HTML, JavaScript, CSS, images, and public JSON data) from a server node close to them, resulting in fast load times. The hosting platform also provides the environment for our serverless functions (as cloud functions). We do not maintain our own web server; we rely on the provider’s infrastructure. This drastically simplifies deployment: every time we update our site (e.g., add products or tweak code), we push changes to our Git repository and Netlify automates the build and globally deploys the updated static files and functions.
  
- **Serverless Functions (Backend Logic):** These are small pieces of backend code that run on-demand in response to specific HTTP requests from the client. Each function lives as an independent unit (like a mini API endpoint) responsible for one task (such as authenticating an admin, saving a rating, or retrieving data for a shareable link). They run in a secure, isolated environment and can access our protected data (like our database or private files) which the client cannot directly reach. Because these functions only run when invoked, they scale automatically with usage – if 10 users simultaneously submit ratings, 10 function instances will run in parallel; if no one is submitting anything, no functions run (and we incur no cost). The key benefit is **scalability and cost-efficiency** with minimal maintenance – we do not have to manage server processes or worry about traffic spikes. Each function is stateless (it executes and terminates, not holding any long-term session data beyond what’s in the request and what it might temporarily read/write from our storage).
  
- **Database (MongoDB Atlas):** For any data that needs to be persisted securely (like user feedback, flags, and share links), we use a cloud-hosted MongoDB database. This database is not directly accessible from the client; only our serverless functions can query or write to it using a secure connection string stored in environment variables. We chose MongoDB (a NoSQL document database) because our data is naturally document-oriented (JSON-like structures) and it allows flexible schemas. Additionally, MongoDB Atlas provides a generous free tier that suits our initial scale, aligning with our cost-minimization strategy. By using a managed database, we offload concerns like data replication, backups, and concurrency handling to the service – it ensures that if two users submit data at the same time, both writes are saved reliably. It also enhances security: sensitive data isn’t sitting in publicly accessible files, and we can enforce access rules at the database level if needed.

Now, let’s describe how these components interact in a typical user session from start to finish:

1. **Initial Page Load:** The user’s browser makes a request to denrettegave.dk. The Hosting Provider’s CDN responds by delivering the **index.html** page along with associated assets (CSS, JS, and the JSON data files under the assets folder). This initial payload contains everything needed for the frontend application to run. Because it’s served via CDN, this happens very quickly (often in a few hundred milliseconds), and the site loads almost instantly for the user.
   
2. **Front-end Logic and Quiz Interaction:** Once the browser has loaded our JavaScript, our single-page application (SPA) takes over. It immediately loads static data like the list of quiz questions (questions.json) and the list of products (products.json), which are fetched from the CDN (or might even be embedded in the page or pre-fetched to optimize performance). As the user proceeds through the quiz, all logic (like computing recommendation scores, determining the next question to ask, when to show the early-exit option, etc.) is done **locally in the browser** using that data. This design is intentional: it makes the quiz experience extremely responsive (no waiting for server responses between questions) and also reduces load on the backend (one less round-trip per question). The browser can compute on the fly which product seems best so far, maintain a running score for each product, and dynamically adjust the next question – all without needing to ask the server, because it has all necessary data loaded.

3. **Calling Serverless Functions (when needed):** At certain points, the frontend needs to perform actions that involve persistent data or sensitive operations – this is when it calls our serverless functions (the backend API). The key moments are:
   
3a. **Submitting a Rating:** When the user clicks a star rating on the results page, the browser will send an HTTP POST request to our submit-rating function endpoint (e.g., /api/submit-rating, which Netlify maps to our submit-rating.js function code). The payload includes the rating value (1-5), the ID and name of the product that was recommended, and the answers the user gave in the quiz (with any personal info removed, e.g., if the quiz asked for the recipient’s name, we exclude it). The function runs on the server side for a brief moment: it validates the input, then inserts this rating entry into our private **ratings collection in MongoDB** (our database). Once saved, it returns a success response (HTTP 200 OK). The browser, upon receiving a success, might show a quick “Tak for din feedback!” (“Thank you for your feedback!”) message to the user. From the user’s perspective, this is seamless – they clicked a star and got an acknowledgment. Under the hood, a serverless function securely saved their feedback in a database that only we can access.

3b. **Creating a Shareable Link:** When the user clicks “Del” (Share result), the browser calls the create-share-link function. This is another POST request, carrying the product ID of the recommended gift and perhaps the quiz answers or context. The function will generate a unique identifier for the share (a random ID) and store a record in our **shares collection in MongoDB**, mapping that ID to the product and quiz context (we store whatever is needed to reconstruct the result later). It then returns the unique share ID (e.g., XYZ123). The browser receives this and composes the share URL (e.g., denrettegave.dk/?share=XYZ123) to show to the user. Later, if someone uses that link, the front-end will detect the share parameter on page load and call the get-shared-result function to retrieve the stored recommendation details.

3c. **Reporting a Problem:** If the user clicks “Rapportér et problem” and selects an issue type (e.g., “Linket virker ikke”), the app calls the submit-flag function with details (which product was problematic and what the issue type was). This is also a POST request. The function will create a new entry in our **flags collection in MongoDB**, recording the product, issue type, the current timestamp, and even the quiz answers context (we include the answers here as well, to help us diagnose if a pattern emerges, but we omit any personal names). The flag’s status is set to "open/unresolved" initially. The function returns a simple success message. (On the front-end, we don’t actually wait for the reply beyond maybe logging it – we already showed the user a “thank you, we’ll look into it” message as immediate feedback.)

3d. **Analytics Event:** We have an update-analytics function that the frontend might call in the background to log certain events (like “user completed quiz” or “user clicked affiliate link”). This helps us gather usage stats without relying solely on third-party analytics. Each call writes an entry or updates counters in an analytics.json file stored in our assets (more on this in the data storage section). For example, when a quiz is completed, the front-end might POST { eventType: "suggestion", productId: 42 } to this function. The function will update our analytics data (increment counters for how many times product 42 was suggested, and how many quizzes have been completed overall, etc.)[\[10\]]. We keep this implementation simple; it’s not a full analytics pipeline, just a lightweight way to count key events.

3e. **Admin Actions:** Apart from the user-facing flows, we have an **admin panel** (a separate page, admin.html) for internal management. When an admin (e.g., the site owner) logs in, the admin interface can call various protected functions. For example, there’s a get-ratings function to fetch all accumulated ratings from the database so we can analyze them in a table or chart. There’s get-flags to fetch all open problem reports (flags) so we can see which products have issues reported. There’s also resolve-flag for the admin to mark an issue as resolved (which updates the database entry to “resolved” status). And we have an update-products function that allows the admin to update the product catalog. That function, when invoked, will take a new products JSON (submitted by the admin through the panel’s editor) and directly commit it to our GitHub repository via GitHub’s API. This triggers our deployment pipeline to rebuild the site with the updated products.json. Essentially, the admin panel is a thin client that uses these functions as an API for content management and quality control. All admin functions require authentication (only an authorized admin can invoke them, enforced via a token/cookie check on each request).

3f. **Secure Data Access:** It’s important to note that some data in our system is public (e.g., products.json and questions.json can be fetched by anyone’s browser; in fact the quiz depends on fetching them openly), whereas other data is private (user feedback like ratings, flags, and share links are not exposed directly). The serverless functions act as secure gatekeepers for private data. For example, the get-ratings function will only return data if the request is coming from an authenticated admin (it checks for a valid admin JWT before returning anything). If someone tried to directly access the ratings data by some URL, they wouldn’t succeed – that data isn’t available as a static file at all, and the only way to get it is through our function which enforces security. Similarly, our database is locked behind credentials; even if someone found our database connection string (which we don’t expose), the database itself requires authentication and is not directly reachable from the public internet (it’s configured to only accept connections from our serverless environment). This separation ensures user-generated or sensitive data isn’t leaking. It also means we can trust that data coming into the functions is validated because it goes through code we wrote (we validate input formats, strip out personal info like names in the function logic, etc., before saving anything).

4. **Data Storage Approach:** We use a hybrid approach for data storage:
   
4a. **Static JSON files** for data that doesn’t change often or that we want to serve quickly to the client (products list, questions list, etc.). These reside in the /assets directory of our project and are deployed with the site. The advantage is speed and simplicity – the client can fetch them directly from the CDN, and they can be cached in the browser. When we need to update these (e.g., add a new product), we go through our deployment process (or the admin panel’s GitHub integration which automates the commit). This is effectively treating JSON files as a read-optimized database. Since reads are extremely frequent (every quiz load fetches products.json) but writes are infrequent (we add products occasionally), this is ideal.
4b. **MongoDB database** for data that is generated by users or changes frequently and must be stored securely (ratings, flags, shares, etc.). This database acts as our system of record for these items. Each type of data is stored in its own **collection** (analogous to a table):

    - a **ratings** collection for star ratings feedback,
    - a **flags** collection for problem reports,
    - a **shares** collection for shareable links,
    - and potentially others like an **analytics** collection in the future (right now we log analytics to a file as mentioned, but we     could move it to DB if it grows). 

The database gives us persistence (data isn’t lost when the site redeploys, unlike if we tried to store it in memory or on ephemeral function storage) and concurrency safety (multiple function invocations can write to the same collection without clashing). MongoDB stores data in a JSON-like format (BSON), which made migrating from file-based JSON storage to the database straightforward – the structures we save (objects with fields for productId, rating, timestamp, etc.) remained the same, we just insert them into a collection instead of appending to a file.

4c. **No Traditional Web Server or Long-Running Database Server:** A notable aspect of our architecture is that we have **no always-on web server** that we maintain, and we do not self-host a database server either. Early on, we even avoided a database altogether by using JSON flat files as a lightweight datastore (which worked at a small scale). As we grew, we transitioned to a cloud database for the dynamic data, but still without managing any server ourselves – it’s a fully managed service. The result is an incredibly low-maintenance stack. We don’t worry about OS updates, or scaling webserver threads, or database patching – those are either abstracted away by the serverless model or handled by the managed database. Our focus stays on application code and content. The trade-off is that we must design our functions to be stateless and idempotent (which we have) and handle the slight latency of calls to external services (database calls, etc., which in our experience are all very fast on the same cloud network).

5. **Scalability:** The architecture is designed to scale effortlessly for our needs. Because the heavy per-user interaction (the quiz question logic and scoring) is done on the client side, our backend only has to handle relatively infrequent events (a few function calls per user at most). Our CDN can handle thousands of concurrent users fetching the static files, since that’s what CDNs excel at. If, say, 100 users are taking the quiz simultaneously, that’s no problem – they’re each mostly just downloading the files and running logic in their own browser. Now, if 100 users all submit a rating at roughly the same time, that triggers 100 calls to the submit-rating function. In a traditional setup, that could flood a small server, but in our serverless setup, the platform will spin up as many parallel function instances as needed to handle them. Each of those instances will briefly connect to the database, insert a record, and terminate. MongoDB Atlas (on a free or low-tier cluster) can handle that kind of burst of writes easily since these are tiny documents and well within its throughput limits. The point is, we don’t have a single chokepoint in the design – both the static content and the dynamic functions scale out horizontally by nature. This means the site can handle a spike of traffic (e.g., if we get featured in a news article and thousands of people come at once) without falling over. The only limits we might hit are the free-tier caps (e.g., if we exceed a certain number of function invocation hours per month or database operations per second), but those limits are high relative to our expected traffic, and if needed, upgrading those services is trivial and cost-efficient.

6. **Fault Tolerance:** With our static + serverless + managed DB approach, we inherently get good fault tolerance. If one of our serverless functions fails (say, due to a bug in code or a momentary network issue to the DB), it does not crash a persistent server – it only affects that one request. The rest of the site remains up. The user might see an error message for that action, but the site can continue to be used (e.g., if rating submission fails, the quiz itself is still fully functional). We log such errors, and the stateless nature means a retry will likely succeed if it was a transient issue. The CDN ensures our static content is always available globally; even if one edge node has an issue, the network will route requests to another node. Our database is a replica set (MongoDB Atlas free tier provides at least minimal redundancy), so there’s some resilience there as well (though heavy outages on a free tier are unlikely but possible, we consider the impact low for our use-case; worst case some feedback might not get recorded immediately, which we can tolerate). Also, because the site doesn’t depend on a complex web of services – it’s basically static files + a handful of functions + one database – there are fewer points of failure to begin with.

7. **Transition to a Cloud Database (from Flat-File Storage):** Initially, we did **not** run a traditional database server. Our MVP simply used JSON files as our data store, treating them like a lightweight flat-file database. This was feasible at small scale and had the benefit of zero setup and no separate hosting costs (reads were just file reads, writes were appends). However, as we prepared for more users and longer-term maintainability, we migrated to using MongoDB for persistent data. This change was driven by a few factors:

    7a. **Data Persistence and Concurrency:** With JSON files on a serverless function, we faced challenges in truly persisting data. Each function invocation in Netlify is stateless and isolated – writing to a local file in one invocation wouldn’t reliably be seen by the next invocation (they might run on different instances). We could have introduced a step to push file updates to a central store (or commit back to GitHub), but that adds complexity and potential race conditions. By moving to a database, we have a single source of truth that all function instances talk to, and it natively handles concurrent writes and reads.
    7b. **Security and Privacy:** Some data like flags were initially stored in a public JSON for convenience, which wasn’t ideal (anyone could fetch it, though it contained no personal info). Now, with a database, none of the user-generated data is exposed publicly. All access is funneled through our secure functions. This makes us more comfortable from a GDPR/privacy standpoint as well – e.g., ratings and quiz answers are definitely not directly accessible to anyone but us.
    7c. **Scalability of Writes:** While our volume is small, using a proper database ensures that if our write frequency increases (more feedback, more shares), we won’t hit file-locking or I/O issues. MongoDB can handle many more operations per second than writing to flat files (especially on our managed cluster which automatically indexes the data etc.).
    7d. **Cost:** Importantly, even after moving to a database, we remain within free tiers – MongoDB Atlas’s free tier is sufficient for our needs at this stage, and Netlify doesn’t charge for reasonable function usage on the dev plan. So we didn’t significantly increase our costs, but we gained reliability.

In summary, the **flow of data** in our system is: the user’s browser renders the app using static files from the CDN; when dynamic data needs to be read or written (ratings, flags, shares, etc.), the browser calls a serverless function; the function securely interacts with our database (or updates a file) and returns a response. This forms a triangle of interaction (Browser ↔ Function ↔ Data Store) mediated by the hosting platform. It’s a modern web architecture that emphasizes **speed, security, and low cost**, perfectly aligned with our project’s needs.

### 3.3 Detailed File Structure

Our repository is organized in a way to separate the static frontend, public data, private data, and serverless functions. Below is the structure (directories and key files) with explanations:

/ # Root of the project  
├── index.html # Landing page and container for the single-page app (quiz interface)  
├── admin.html # Admin Panel interface (secured by login)  
├── privacy-policy.html # Static page: Privacy Policy (legal info)  
├── terms-of-service.html # Static page: Terms of Service (legal info)  
|  
├── assets/ # Publicly accessible assets and data files  
│ ├── products.json # \*\*Public:\*\* The core database of all gift products (product catalog).  
│ ├── questions.json # \*\*Public:\*\* The pool of quiz questions (texts, options, etc.).  
│ ├── analytics.json # \*\*Public:\*\* Site analytics data (aggregate counters/logs for internal use).  
│ └── ... # Other assets like images (e.g., logo.jpeg), CSS, etc.  
|  
├── functions/ # Serverless function code (each file = one function endpoint)  
│ ├── admin-login.js # Securely handles admin login (authenticates password and sets auth cookie).  
│ ├── admin-logout.js # Logs out admin by clearing auth token (cookie invalidation).  
│ ├── check-auth.js # Verifies current admin authentication status (used on admin panel load).  
│ ├── get-ratings.js # Provides all ratings data to the admin panel (requires auth).  
│ ├── get-flags.js # Fetches all open flagged issue reports for admin panel (requires auth).  
│ ├── resolve-flag.js # Marks reported issues as resolved in the database (requires auth).  
│ ├── create-share-link.js# Creates a unique shareable link record (for "Share Results" feature).  
│ ├── get-shared-result.js# Retrieves a shared result by ID (for when someone opens a share link).  
│ ├── submit-rating.js # Handles user-submitted ratings securely (writes to DB).  
│ ├── submit-flag.js # Handles user submissions of product error reports (flags).  
│ ├── update-analytics.js # Records analytics events (page views, quiz actions, etc.) anonymously.  
│ └── update-products.js # Allows admin to update the products.json via GitHub commit (requires auth).  
|  
└── functions/utils/ # Utility modules used by the functions  
├── auth-middleware.js # Helper for requiring admin JWT auth in function endpoints\[19\]\[20\]  
├── mongodb-client.js # Sets up a reusable connection to MongoDB (reads MONGODB_URI env)\[17\]\[18\]  
└── ... # (Other utilities if any)

Let’s unpack each part of this structure:

- **Root HTML files:**
- index.html is the main application container. It includes the layout for the landing page and the embedded structure for the quiz and results interface. We built our app as a Single Page Application, meaning index.html actually contains (or references) the HTML for all the main views (landing, quiz questions, results) which are shown/hidden by the JavaScript as the user progresses. It pulls in the Tailwind CSS framework and our main script (either inline or via &lt;script&gt; tag) that bootstraps the quiz logic. Essentially, when you load index.html, you have the entire app shell in your browser, and from there the JS will manage the interactive flow.
- admin.html is a separate page for the admin dashboard. This page is not linked from the public site (security by obscurity; only those who know the URL and have credentials can use it). It contains the UI and scripts for our admin panel, including a login form and several tabs (for live editing products, viewing/editing products, reviewing flags, viewing ratings, and a settings/help tab). The admin panel is also built with Tailwind for styling and uses some JavaScript (inline in the HTML) to handle interactions like switching tabs, submitting changes, etc. We separate admin.html from the main app to keep the user bundle small (we don’t want to ship admin code to every user) and to clearly delineate admin functionality. It also loads its own scripts and uses an authentication flow to restrict access.
- privacy-policy.html and terms-of-service.html are static informational pages. They contain the legal text for our privacy policy and terms of service, respectively. They are linked in the footer of the site. We keep them as separate static files for simplicity – they’re mostly text and maybe basic HTML formatting. Serving them as static pages (rather than part of the SPA) also makes them easily crawlable by search engines and ensures that even if our main app were down, these pages could still be accessible (since they’re just static content).
- **Assets directory:**  
    This folder is hosted publicly via our CDN. Any file placed here is accessible via <https://denrettegave.dk/assets/&lt;filename>&gt;. We use this to store data and media that the client needs to fetch or display.
- products.json is **the heart of our product database**. It contains an array of all gift products available in the system. Each product object includes fields like:
  - **id:** a unique identifier for the product (we use string IDs like "p_kay_bojesen_abe" or numeric IDs; the exact format is up to us, but it must uniquely identify a product).
  - **name:** the product name (e.g., "Kay Bojesen Abe – Klassisk Træfigur").
  - **description:** a short, user-friendly description of the product highlighting what it is or why it’s a great gift.
  - **price:** the price in DKK (as a number, without currency sign).
  - **url:** the affiliate purchase URL for that product. This is the link that leads the user to the retailer’s page, with our affiliate tracking info. We construct these URLs using our affiliate network’s format (for example, Partner-Ads) as described in Section 7.1.2 (the AI generates them in the JSON when recommending new products).
  - **image:** a URL to an image of the product (usually an image from the retailer, or a CDN link if provided by the affiliate network).
  - **tags:** an array of strings representing the core tags (attributes) of the product for matching purposes. These cover categories like gender, age, interests, occasion, and price bracket. For example, a product might have \["gender:kvinde", "age:voksen", "interest:kaffe", "interest:hjemmet", "price:mellem", "occasion:fødselsdag"\]. These tags directly inform the quiz’s scoring algorithm: they will match against answers the user gives. We treat this almost like a fingerprint of the product’s target profile.
  - **differentiator_tags:** an array of strings for more granular attributes that differentiate this product from others. For example, for a coffee product, a differentiator tag might be "coffee_type:espresso" vs "coffee_type:filter", or "color:grøn", "brand:Bodum", etc. These come into play when the quiz engine is deciding which question to ask next – e.g., if two top products only differ in color, it might ask the user about color preference.
  - **status:** a field indicating if the product is active or not (e.g., "active" or "inactive"). We use this to softly remove products that are no longer available or we don’t want to recommend, without deleting them from the file (which helps for record-keeping and possibly reactivating seasonally).

This JSON file essentially serves as our product catalog database. The front-end fetches it at startup (or we even embed it in the page for faster load – though if it’s large, we fetch it). By having all product info in memory on the client, the quiz algorithm can rapidly score and filter products without any additional server calls. We made products.json public for simplicity – nothing in it is secret (it’s product info that’s likely on the retailers’ websites anyway, plus our affiliate links which are meant to be used). Hosting it publicly means the client can load it directly via AJAX, which is fast and avoids burdening a function. We just have to ensure not to include any truly sensitive data in it (and we don’t). One consideration: because it’s static, if we update the file, we need to redeploy the site (or use our admin function which commits to GitHub) to change it. This is fine for now; we’re not at a scale where new products must appear instantly. Even if we were, our admin tool effectively automates that.

- questions.json contains the _pool of all quiz questions_ that the engine can draw from. This file defines each quiz question’s content and metadata, but notably does **not** dictate when the question is asked. Each question object includes:
  - **id:** A unique identifier for the question (e.g., "q_relation" or "q_coffee_type"). This is used internally for tracking (like ensuring we don’t ask the same question twice).
  - **question:** The question text (in Danish) shown to the user. For example, "Hvem er gaven til?" or "Er de en eventyrlysten type?".
  - **key:** The category key that this question corresponds to. This ties the question to product attributes. For example, a question about the recipient’s gender might have "key": "gender" – the answers to that question will be things like "Mand" or "Kvinde", and the product tags also have gender tags, so the algorithm knows to boost products with matching tags. If a user answers "Kvinde" to the gender question, products tagged gender:kvinde will score higher.
  - **type:** The input type for the question. For example, "single-choice-card" for a multiple-choice question where the user picks one (displayed as cards or buttons), "multi-select-tag" for a question where multiple options can be selected (like interests), or "text-input" for a free text input. The front-end uses this to determine how to render the question (which HTML form elements to show).
  - **options:** An array of answer choices (if the type is a choice-based question). For instance, for the relation question, options might be \["Partner", "Forælder", "Ven", "Søskende", "Kollega", "Andet"\]. For a multi-select interests question, options could be a list of interests like \["Kaffe", "Hjemmet", "Sport", "Teknologi", ...\]. If the question is text-input or something that doesn’t have preset answers, this field might be omitted.
  - **placeholder:** (Optional) A placeholder text for text inputs, e.g., for the name question we might use "F.eks. Mormor eller Anders".
  - **is_discovery:** (Optional) A boolean indicating if this question is a “Discovery” question, which is a special kind of question not directly tied to narrowing down the same set of products, but rather introducing new angles. For example, a question like “Er de en eventyrlysten type?” doesn’t directly map to a specific tag in every product (not every product has an adventure tag), but it can open up our algorithm to consider products that might not have been obvious from prior answers (like an experience gift).
- **Important:** There are _no hard-coded trigger conditions or ordering rules in questions.json._ In early versions, we had a system where each question could specify when it should appear (e.g., only if gender=female). We removed all that to simplify content management and make the quiz fully dynamic. Now, questions.json is just a library of possible questions. The quiz engine (in JavaScript) decides at runtime which question to ask next based on the user’s answers and which products are currently top candidates, as detailed in Section 4.0. This separation means content managers can add/edit questions freely without worrying about breaking logic. If a new question is added, the engine will consider it when appropriate. questions.json is public because it doesn’t contain answers or anything user-specific – it’s just the question content.
- analytics.json is where we accumulate simple analytics data. This is a file rather than a database entry for now, to keep things ultra-simple. The idea is that each time a user triggers an event we care about (like completing the quiz or clicking the affiliate link), the update-analytics function updates this JSON. The structure is something we designed to hold counts (and potentially lists). For example, it might look like:
- {  
    "site_totals": {  
    "quizzes_completed": 57,  
    "total_clicks": 34  
    },  
    "products": {  
    "p_kay_bojesen_abe": { "suggestions": 5, "clicks": 2, "sales": 0 },  
    "p_outdoor_hammock": { "suggestions": 3, "clicks": 1, "sales": 0 }  
    }  
    }
- This would indicate 57 total quizzes have been finished (with a recommendation shown), 34 total affiliate link clicks, etc., and then per product how many times it was suggested, clicked, and marked as purchased (if we ever track actual sales via feedback). We chose to keep this as a public asset for simplicity (so the admin panel can fetch it directly without an auth call) – it contains no personal data, just aggregate numbers, so exposure is not a concern. The file being public also means we could integrate with some client-side dashboard or even let users see some stats if we wanted. The update-analytics.js function simply reads this file, updates the relevant counters, and writes it back[\[21\]](https://github.com/TomKonig/GaveGuiden/blob/2fd030095ad2f06ddd6aeafeafdaf23ddd3b6c9e/functions/update-analytics.js#L24-L32)[\[22\]](https://github.com/TomKonig/GaveGuiden/blob/2fd030095ad2f06ddd6aeafeafdaf23ddd3b6c9e/functions/update-analytics.js#L39-L47). On Netlify, the function has access to the file system where assets are, so this works, but it’s a bit of a hacky solution long-term because concurrent writes could conflict. However, given our low volume and that these events are not critical, this is acceptable for now. We have plans to eventually move analytics to the database or an external analytics service if needed.
- (Other assets: we have images like our logo in this folder, and possibly CSS or JS files if we had split our scripts. In our case, Tailwind is loaded from CDN and our main script might be inline, so not many separate files. But any static file the client needs would go here.)
- **Serverless Functions directory (functions/):**  
    Each JavaScript file in this directory is deployed as an independent serverless function (Netlify picks up these and makes them available at /api/&lt;function-name&gt;). We have each function focused on one piece of functionality:
- admin-login.js – This function handles authentication for the admin panel. It expects a POST request with a JSON body containing a password. It checks the password against the correct admin password stored in environment variables (ADMIN_PASSWORD). If it matches, the function generates a signed JWT (JSON Web Token) that serves as an auth token (we use the jsonwebtoken library). The token encodes a simple payload (like {"role": "admin"}) and is signed with our secret key (JWT_SECRET env var). The function then sets this token in an HTTP-only cookie in the response[\[23\]](https://github.com/TomKonig/GaveGuiden/blob/2fd030095ad2f06ddd6aeafeafdaf23ddd3b6c9e/functions/admin-login.js#L19-L27)[\[24\]](https://github.com/TomKonig/GaveGuiden/blob/2fd030095ad2f06ddd6aeafeafdaf23ddd3b6c9e/functions/admin-login.js#L28-L35). By using an HTTP-only cookie, the token is stored in the admin’s browser but not accessible to JavaScript (preventing XSS attacks from stealing it). The cookie is configured to last for about 8 hours (maxAge: 60\*60\*8) and is only sent over secure HTTPS connections. If the password check fails, we return a 401 Unauthorized. This login flow means the admin doesn’t have to manually copy tokens; the browser will automatically include the cookie in subsequent requests to our protected endpoints.
- admin-logout.js – This simply logs the admin out by clearing the auth cookie. When invoked (we use a GET request for logout for simplicity), it returns a response that sets the auth_token cookie with an expiration in the past, effectively instructing the browser to delete it[\[25\]](https://github.com/TomKonig/GaveGuiden/blob/2fd030095ad2f06ddd6aeafeafdaf23ddd3b6c9e/functions/admin-logout.js#L4-L12)[\[26\]](https://github.com/TomKonig/GaveGuiden/blob/2fd030095ad2f06ddd6aeafeafdaf23ddd3b6c9e/functions/admin-logout.js#L13-L21). The admin panel calls this when the admin clicks "Log Out".
- check-auth.js – A utility function that the admin panel calls on page load to check if the admin is already logged in (i.e., if a valid auth token cookie is present). This function just reads the auth_token cookie from the request, verifies the JWT signature using our secret, and returns 200 OK if valid or 401 if not[\[27\]](https://github.com/TomKonig/GaveGuiden/blob/9e1b654938d33c895e246b9652cf237043cd7fdf/functions/check-auth.js#L10-L18)[\[28\]](https://github.com/TomKonig/GaveGuiden/blob/9e1b654938d33c895e246b9652cf237043cd7fdf/functions/check-auth.js#L14-L22). This saves the admin from having to log in again if their session cookie is still fresh. It uses similar logic to our auth-middleware, but since it’s a standalone endpoint, it does the check inline.
- get-ratings.js – Provides the accumulated ratings data for admin analysis. This function is **protected** by our auth middleware; it will only run if the request has a valid admin JWT (the middleware checks the cookie before calling the handler)[\[16\]](https://github.com/TomKonig/GaveGuiden/blob/2fd030095ad2f06ddd6aeafeafdaf23ddd3b6c9e/functions/get-ratings.js#L22-L29). On execution, it connects to the database and queries the ratings collection for all documents. We project out \_id if we want (to not leak internal IDs)[\[29\]](https://github.com/TomKonig/GaveGuiden/blob/2fd030095ad2f06ddd6aeafeafdaf23ddd3b6c9e/functions/get-ratings.js#L12-L19). Then it returns the array of rating objects as JSON. The admin panel uses this to populate a table or list of all ratings and maybe compute averages, etc. This way, the raw ratings data (with quiz answers and stars) never has to be in a public file.
- get-flags.js – Similar to get-ratings, this returns all current issue flags from the database. It’s also auth-protected (admin only)[\[30\]](https://github.com/TomKonig/GaveGuiden/blob/2fd030095ad2f06ddd6aeafeafdaf23ddd3b6c9e/functions/get-flags.js#L4-L12)[\[31\]](https://github.com/TomKonig/GaveGuiden/blob/2fd030095ad2f06ddd6aeafeafdaf23ddd3b6c9e/functions/get-flags.js#L14-L18). It queries the flags collection for all documents where status is "open" (we generally only care to show unresolved issues in the main view). It returns these as JSON. The admin panel will call this to show a list of all reported problems that need attention.
- resolve-flag.js – This is invoked when an admin marks one or more flags as resolved. In our admin UI, for convenience, if an admin resolves an issue for a product (say a broken link for product X), we might resolve all open flags of that type for that product in one go (e.g., if 3 users reported broken link for the same product, one fix addresses all). This function takes a productId and an issue reason (e.g., "Linket virker ikke") in a POST request. It checks auth (middleware)[\[32\]](https://github.com/TomKonig/GaveGuiden/blob/2fd030095ad2f06ddd6aeafeafdaf23ddd3b6c9e/functions/resolve-flag.js#L2-L10), then in the database it finds all matching flag documents (productId + reason) that are still open, and updates them to status "resolved", adding a resolvedAt timestamp[\[33\]](https://github.com/TomKonig/GaveGuiden/blob/2fd030095ad2f06ddd6aeafeafdaf23ddd3b6c9e/functions/resolve-flag.js#L20-L28)[\[13\]](https://github.com/TomKonig/GaveGuiden/blob/2fd030095ad2f06ddd6aeafeafdaf23ddd3b6c9e/functions/resolve-flag.js#L23-L31). It then returns a message about how many were updated[\[34\]](https://github.com/TomKonig/GaveGuiden/blob/2fd030095ad2f06ddd6aeafeafdaf23ddd3b6c9e/functions/resolve-flag.js#L34-L41)[\[35\]](https://github.com/TomKonig/GaveGuiden/blob/2fd030095ad2f06ddd6aeafeafdaf23ddd3b6c9e/functions/resolve-flag.js#L35-L43). The admin UI, upon success, will update the display (e.g., remove those from the list or mark them resolved). This helps us keep track of what issues we’ve handled. If a flag isn’t found (maybe it was already resolved or the IDs didn’t match), it returns 404.
- submit-rating.js – This is called by the client when a user submits a star rating. It is not auth-protected (any user can rate). This function will parse the incoming data (product id, product name, rating value, and quiz answers object). For security, we ignore any fields we don’t expect and crucially ensure the name field (if present in quiz answers) is removed (we do that client-side already, but we double-check on server)[\[36\]](https://github.com/TomKonig/GaveGuiden/blob/9e1b654938d33c895e246b9652cf237043cd7fdf/readme.md#L18-L21)[\[37\]](https://github.com/TomKonig/GaveGuiden/blob/9e1b654938d33c895e246b9652cf237043cd7fdf/readme.md#L2-L9). Then we construct a rating document: we might include a generated rating_id (for example, we can use the timestamp or let Mongo assign an \_id), the product info, the rating value, the quiz answers, and a timestamp. We insert this into the ratings collection in MongoDB. If that succeeds, we return 200 OK (and perhaps a simple JSON message). If it fails (e.g., DB error), we return a 500 error. The client doesn’t necessarily need a response beyond knowing it worked; we already handle the UI optimistically. This data will later be pulled by get-ratings for analysis. Each rating entry looks like the examples given in Appendix A (product id, name, rating, answers, timestamp)[\[38\]](https://github.com/TomKonig/GaveGuiden/blob/9e1b654938d33c895e246b9652cf237043cd7fdf/readme.md#L961-L969)[\[39\]](https://github.com/TomKonig/GaveGuiden/blob/9e1b654938d33c895e246b9652cf237043cd7fdf/readme.md#L970-L978). Storing the quiz answers with the rating is extremely useful for analysis (we can filter feedback by context: are all low ratings coming from a certain demographic or interest combo? etc.). And because we strip personal info, it remains privacy-safe.
- submit-flag.js – Called when a user reports a problem. Not auth-protected (any user can submit a flag). It expects productId and reason in the request, and we now also include the quizAnswers context so we know in what scenario the user encountered the issue[\[40\]](https://github.com/TomKonig/GaveGuiden/blob/2fd030095ad2f06ddd6aeafeafdaf23ddd3b6c9e/index.html#L554-L561). The function validates inputs (productId should be non-empty, reason should be one of the expected strings, etc.)[\[41\]](https://github.com/TomKonig/GaveGuiden/blob/2fd030095ad2f06ddd6aeafeafdaf23ddd3b6c9e/functions/submit-flag.js#L10-L18). It also sanitizes the quiz answers (removing any name field, just like with ratings)[\[42\]](https://github.com/TomKonig/GaveGuiden/blob/2fd030095ad2f06ddd6aeafeafdaf23ddd3b6c9e/functions/submit-flag.js#L22-L30). Then it creates a new flag document with fields: productId, reason, the provided quizAnswers, status "open", and a createdAt timestamp[\[8\]](https://github.com/TomKonig/GaveGuiden/blob/2fd030095ad2f06ddd6aeafeafdaf23ddd3b6c9e/functions/submit-flag.js#L28-L36)[\[9\]](https://github.com/TomKonig/GaveGuiden/blob/2fd030095ad2f06ddd6aeafeafdaf23ddd3b6c9e/functions/submit-flag.js#L31-L39). This gets inserted into the flags collection. We return a 201 Created with a thank-you message. On the client side, we might not even wait for the reply beyond logging it; we already reassure the user that the report was received. The flags collection accumulates these reports for admin review. Each flag object might look like: { productId: "p_42", reason: "Linket virker ikke", quizAnswers: {interest: "Kaffe", ...}, status: "open", createdAt: ISODate("2025-07-28T12:00:00Z") }. By storing quizAnswers, we sometimes can reproduce the state or see if an issue might be context-specific.
- create-share-link.js – Called when a user wants to share a result. It expects a product_id and the quiz_answers (the context of that recommendation) in the POST body[\[43\]](https://github.com/TomKonig/GaveGuiden/blob/2fd030095ad2f06ddd6aeafeafdaf23ddd3b6c9e/index.html#L563-L571). The function generates a new entry in the shares collection: we include the productId, the provided quiz answers (again with any personal info removed)[\[44\]](https://github.com/TomKonig/GaveGuiden/blob/2fd030095ad2f06ddd6aeafeafdaf23ddd3b6c9e/functions/create-share-link.js#L18-L26), and a timestamp. When we insert this document, MongoDB will assign it a unique \_id (ObjectId). We take that ID (which is globally unique) and return it as a string in the response[\[6\]](https://github.com/TomKonig/GaveGuiden/blob/2fd030095ad2f06ddd6aeafeafdaf23ddd3b6c9e/functions/create-share-link.js#L24-L33)[\[7\]](https://github.com/TomKonig/GaveGuiden/blob/2fd030095ad2f06ddd6aeafeafdaf23ddd3b6c9e/functions/create-share-link.js#L34-L39). The front-end then uses this ID to build the share URL for the user. We do not require auth for this because any user can create a share link. We also do not expose any sensitive info in doing so. The share ID is unguessable (ObjectIds are large random values), and we don’t reveal any data unless someone actually has the ID.
- get-shared-result.js – This function is invoked when someone visits a share link (our front-end detects a query param like ?share=XYZ and calls this function with that ID). It’s a GET endpoint where the share ID is passed as a query parameter (e.g., /api/get-shared-result?id=XYZ123). The function will take that ID, connect to the database, and look up the corresponding document in the shares collection[\[45\]](https://github.com/TomKonig/GaveGuiden/blob/2fd030095ad2f06ddd6aeafeafdaf23ddd3b6c9e/functions/get-shared-result.js#L9-L17)[\[46\]](https://github.com/TomKonig/GaveGuiden/blob/2fd030095ad2f06ddd6aeafeafdaf23ddd3b6c9e/functions/get-shared-result.js#L26-L34). If found, it returns the stored data – in our implementation, that’s the productId and the quizAnswers that were saved[\[47\]](https://github.com/TomKonig/GaveGuiden/blob/2fd030095ad2f06ddd6aeafeafdaf23ddd3b6c9e/functions/get-shared-result.js#L32-L40). The front-end, upon receiving this, uses the productId to find the full product details from products.json (which it already has loaded)[\[48\]](https://github.com/TomKonig/GaveGuiden/blob/2fd030095ad2f06ddd6aeafeafdaf23ddd3b6c9e/index.html#L578-L584), and then calls the same function that normally displays the result to show that product as the recommendation, using the quiz_answers if needed for any contextual message. If the share ID is not found (or the link expired), the function returns a 404 and the front-end will show an error message (“invalid or expired link”). No auth is required to fetch a shared result – the link itself is the “secret”. This is similar to how unlisted YouTube videos work (anyone with the link can view).
- update-analytics.js – This function handles incoming analytics events. It expects a POST with some event info (we might send { eventType: "click", productId: "p_42" } for example). The function then reads the analytics.json file from the assets, parses it, updates the relevant fields (like incrementing the clicks count for that product and the global total)[\[10\]](https://github.com/TomKonig/GaveGuiden/blob/2fd030095ad2f06ddd6aeafeafdaf23ddd3b6c9e/functions/update-analytics.js#L38-L46), then writes the file back to disk[\[11\]](https://github.com/TomKonig/GaveGuiden/blob/2fd030095ad2f06ddd6aeafeafdaf23ddd3b6c9e/functions/update-analytics.js#L47-L55). If the file doesn’t exist yet (first time), it initializes a new structure. Because this operates on a file, there is a slight risk if two analytics events happen at the exact same time; one might overwrite the other’s update (last write wins). But given these events are low frequency and the data isn’t mission-critical, we accept this for now. If accuracy becomes important or volume increases, we’ll shift this to a collection in MongoDB or use an atomic update approach. The function returns a simple success response. We do not require auth because this is triggered by normal user actions (page views, etc.).
- update-products.js – This is an administrative function that allows updating the products.json file via the admin panel. It is auth-protected (only an admin with a valid token can invoke it, enforced by our requireAuth wrapper on export)[\[49\]](https://github.com/TomKonig/GaveGuiden/blob/2fd030095ad2f06ddd6aeafeafdaf23ddd3b6c9e/functions/update-products.js#L60-L62). The admin UI’s “Save to GitHub” button takes whatever JSON is in the editor and sends it here. The function expects a JSON body with a content field (which is a string containing the entire new products.json content). The function first verifies the content is valid JSON (attempts a JSON.parse on it, just to ensure no syntax errors)[\[50\]](https://github.com/TomKonig/GaveGuiden/blob/2fd030095ad2f06ddd6aeafeafdaf23ddd3b6c9e/functions/update-products.js#L22-L28). Then it uses the GitHub API (we have an @octokit/rest client configured with a token) to push this content to our repository[\[51\]](https://github.com/TomKonig/GaveGuiden/blob/2fd030095ad2f06ddd6aeafeafdaf23ddd3b6c9e/functions/update-products.js#L29-L37). Specifically, it fetches the current products.json file to get the latest sha (commit hash of that file), then calls GitHub’s createOrUpdateFileContents endpoint to commit the new content to the assets/products.json path on the repo[\[14\]](https://github.com/TomKonig/GaveGuiden/blob/2fd030095ad2f06ddd6aeafeafdaf23ddd3b6c9e/functions/update-products.js#L34-L42)[\[15\]](https://github.com/TomKonig/GaveGuiden/blob/2fd030095ad2f06ddd6aeafeafdaf23ddd3b6c9e/functions/update-products.js#L35-L43). We include a commit message like "feat: Update products.json via admin panel \[skip ci\]". Netlify is configured to auto-deploy on push to main, so within a minute or so of this commit, the live site will have the updated products.json. We return a success message to the admin UI so it can inform the admin that changes will be live shortly. This mechanism turns our GitHub repo into a headless CMS of sorts, and by using GitHub’s infrastructure we ensure consistency (edits aren’t lost, we have version history of product changes, and if two admins somehow tried to edit at once, GitHub would handle conflict via git).
- **Utilities (functions/utils/):**  
    In this folder we keep shared code for the functions, to avoid repetition.
- auth-middleware.js exports a requireAuth(handler) function that we use to wrap any admin-only function. It works by inspecting the incoming request’s cookies for the auth_token, verifying the JWT using our secret, and only proceeding to call the real handler if the token is valid[\[19\]](https://github.com/TomKonig/GaveGuiden/blob/2fd030095ad2f06ddd6aeafeafdaf23ddd3b6c9e/functions/utils/auth-middleware.js#L6-L15)[\[20\]](https://github.com/TomKonig/GaveGuiden/blob/2fd030095ad2f06ddd6aeafeafdaf23ddd3b6c9e/functions/utils/auth-middleware.js#L21-L28). If not, it returns a 401 Unauthorized. We use this in get-ratings.js, get-flags.js, resolve-flag.js, update-products.js, etc., to ensure those cannot be invoked without login. This keeps the auth logic centralized.
- mongodb-client.js sets up the MongoDB connection. It reads the MONGODB_URI environment variable (which contains our connection string to the Atlas cluster)[\[17\]](https://github.com/TomKonig/GaveGuiden/blob/2fd030095ad2f06ddd6aeafeafdaf23ddd3b6c9e/functions/utils/mongodb-client.js#L3-L10). It then creates a new MongoClient instance and exports an async function to connect to the database[\[52\]](https://github.com/TomKonig/GaveGuiden/blob/2fd030095ad2f06ddd6aeafeafdaf23ddd3b6c9e/functions/utils/mongodb-client.js#L17-L25). We implement a simple caching so that if the function is “warm” (already connected from a previous invocation on the same lambda instance), it reuses the existing connection rather than reconnecting each time (connecting can be slow). The database we use is named "GaveGuiden" (we chose this name in our cluster)[\[18\]](https://github.com/TomKonig/GaveGuiden/blob/2fd030095ad2f06ddd6aeafeafdaf23ddd3b6c9e/functions/utils/mongodb-client.js#L23-L31), and within it the collections are ratings, flags, shares, etc. By using this utility, our actual functions’ code stays cleaner (they just call connectToDatabase() to get the db and then db.collection('ratings') for example).
- (Other utils could include things like input validation helpers or a shared config of constants, but for now these are the main ones.)

This structure keeps our code organized and understandable. The separation between public assets and private functions is clear. By looking at the file tree, one can guess what each part does. Future developers should find it straightforward to extend: - Adding a new quiz question? -> Edit questions.json (and possibly adjust scoring logic in front-end code if it introduces a new key/tag we haven’t handled before, though generally it should just work). - Adding a new product? -> Use our admin panel or directly edit products.json. Our admin panel provides a UI to add a product (it generates the JSON snippet and appends it), then it uses update-products to save it. - Changing the design? -> Modify the Tailwind CSS classes in the HTML or adjust the Tailwind config if needed (for global changes). - Changing function behavior or fixing a bug? -> Modify the respective file in functions/ (each is pretty small and focused).

By maintaining this structured approach, the project remains **approachable and maintainable**, which is crucial for a small team or open source collaborators. New features can be added by following the established patterns (for example, if we wanted to add a “wishlist” feature, we might introduce a new JSON file or DB collection for wishlists and corresponding functions to add/remove items in a wishlist – all without altering unrelated parts of the system).

### 3.4 Security Considerations

Given we handle user input (quiz answers, feedback) and have an admin portal that can modify data, security is paramount. Here are key measures in place: - **Admin Authentication:** As described, the admin panel is protected by a single password (stored securely as an env var). The admin-login function sets a secure JWT cookie upon successful login. All subsequent admin function calls require that cookie. The cookie is HTTP-only and marked Secure, so it’s not accessible via client JS and only sent over HTTPS. The token inside is signed and expires in 8 hours, limiting the window of misuse if it were somehow intercepted (which is mitigated by being HTTP-only and HTTPS). We deliberately do not use any default or easily guessable credentials, and since it’s one account, the attack surface is small (no user enumeration etc.). - **No admin credentials in code:** The admin password and JWT secret are not in the repo – they are set in Netlify environment config. This means even if our code were leaked, an attacker wouldn’t find the login secret. We can rotate these secrets easily from Netlify’s dashboard if needed (our admin Settings tab in the UI provides instructions for the admin on how to do this). - **Rate limiting (future consideration):** Currently, functions like submit-rating and submit-flag do not have explicit rate limiting. We rely on the fact that a user typically will only submit one rating per quiz, and perhaps one flag rarely. However, to prevent abuse (like someone spamming flags), we may implement basic rate limiting at the function level (e.g., check the source IP and if too many requests, ignore) or via Netlify’s add-ons. Given our early user base is small and generally well-behaved, this hasn’t been a problem. - **Database security:** Our MongoDB Atlas instance is configured to accept connections only from our serverless environment (we use 0.0.0.0/0 allow but with the secret, or we could narrow IP ranges if we had static IPs from Netlify). The credentials (URI) are stored in Netlify and not visible to the public. Each function that uses the DB gets the URI at runtime and connects. We do not expose any direct DB queries to the client; everything goes through our code which sanitizes inputs. For example, we ensure that when we use values from the client (like productId in a query), we treat them as data, not as part of a query structure (to avoid injection attacks). - **XSS and Content Security:** Since our site is mostly an SPA, we control the content. We do not directly inject user-provided strings into the DOM in a way that could execute script. (Quiz answers are mostly predefined or simple text like a name; we don’t currently allow arbitrary HTML in answers, and when displaying anything user-provided we would escape it). We have a Content Security Policy via Netlify that restricts what domains scripts can be loaded from (essentially just our domain and known CDN origins for Tailwind/Google Fonts). - **Sensitive Data:** We deliberately do not collect sensitive personal data. For instance, the quiz asks for the recipient’s first name solely to personalize the on-screen text (“gift idea for \[Name\]”), but we never store that. Ratings and flags strip out any names. We do not ask for emails, addresses, or anything personal from users. The admin data (like feedback) is all anonymized or aggregated. This not only simplifies GDPR compliance, it also means even if there were a breach, the impact is minimal (no passwords, no personal identities in our database). - **HTTPS:** The site is always served over HTTPS, which means all interactions (quiz, feedback submissions, admin login, etc.) are encrypted in transit. Netlify provides SSL for our custom domain. - **Validation:** Every function that accepts input performs validation on that input. We check types and allowed values. For example, submit-rating ensures rating is 1-5 and productId matches one in our catalog (we can cross-verify against products.json if needed). submit-flag ensures the reason is one of the known options. This prevents malicious or malformed data from polluting our database or causing errors. In update-products, we parse the JSON to ensure it’s valid before committing – to avoid pushing a broken file that might crash the client app. - **Robots and security through obscurity:** We have a robots.txt that disallows indexing of the admin page. The admin page is not linked publicly. This won’t stop a determined attacker who knows our structure, but it prevents casual discovery. Even if someone finds admin.html, they can’t do anything without the password. Our functions URLs are also not advertised, but security doesn’t rely on that – they each have their checks as described.

In summary, our architecture is designed with a defense-in-depth mindset: minimal exposure (only what’s necessary is public), strong authentication for admin, and cautious handling of all input and data. We will continuously review security as we add features, but at this stage we are in a good place: the attack surface is very small (basically one admin password to protect, and otherwise just making sure our code is robust).

## 4.0 The Dynamic Recommendation Engine (Core Logic)

One of the defining features of Den Rette Gave is our dynamic recommendation engine, which works in real-time as the user answers the quiz. This engine has two major parts: 1. **The Scoring Algorithm** – which evaluates how well each product matches the user’s answers so far. 2. **The Dynamic Question Engine** – which determines which question to ask next (potentially adding follow-up questions based on previous answers).

Traditional online quizzes might have a fixed sequence of questions or a simple filter approach. Ours is adaptive: it doesn’t treat all questions equally or follow a predetermined order. Instead, it continuously decides the most _informative_ question to ask next, based on the current state of knowledge about the user’s needs.

### 4.1 Scoring Algorithm (Matching User to Products)

Every product in our products.json has a set of tags that describe its ideal recipient or context (as discussed in Section 3.3 under products.json). The role of the scoring algorithm is to compute a score for each product given the answers the user has provided so far. The higher the score, the better the product is considered a match.

**How scoring works:** We use a simple additive scoring system with weighted matches: - At the start of a quiz, all products start with a base score (e.g., 0). - For each answer the user gives, we adjust product scores: - If a product has tags that match the answer, we increase its score. - If a product lacks those tags or has conflicting tags, we might decrease its score or leave it unchanged. - Some answers might be considered more important than others and thus carry a higher weight in scoring. - Example: Suppose the user says the recipient is “Kvinde” (female). For every product tagged gender:kvinde or gender:alle (unisex), we add, say, 10 points. For products tagged gender:mand only, we might deduct points or set their score to 0 because they’re not appropriate. Next, the user says the occasion is “Fødselsdag”. Products tagged occasion:fødselsdag get another boost. Then interests: the user picks “Kaffe” and “Hjemmet”. Products that have both tags interest:kaffe and interest:hjemmet get a significant boost, those with just one get a smaller boost, those with none get none. Over multiple questions, some products will accumulate high scores because they consistently match what the user is saying; others will fall behind. - We also incorporate price preferences. If the user didn’t explicitly give a price range, we consider all. But if the quiz deduced a price sensitivity (perhaps via an indirect question or an early exit scenario where we choose a moderate suggestion), we ensure very expensive items might rank lower if the user indicated budget concerns. - Negative scoring: Instead of complex negative points, we typically structure tags such that absence of a tag doesn’t penalize unless it’s a hard disqualifier. For instance, if a user says they want something for “Outdoor” interest, a product with no outdoor-related tags isn’t explicitly penalized, it just doesn’t gain the points that outdoor-tagged products did, thus effectively it falls behind. However, if a user selects something mutually exclusive (like they answered a question that implies a strict filter), we might remove incompatible products entirely from consideration (setting their score to -∞ or some flag). An example would be if we ask “Does the recipient have a car?” and they say “No”, and we have car accessories as products tagged for car owners – we might drop those entirely. - At any point in the quiz, we can sort products by their current score to see the frontrunners. If at any time one product is far ahead, the engine might decide we have enough info.

This scoring mechanism is straightforward to compute in the browser and can be updated after each answer near-instantly (we’re talking maybe 200 products and a handful of tags – trivial for modern JS engines).

### 4.2 Dynamic Question Selection

Instead of a fixed sequence of questions, our system decides on the fly which question to ask next based on what will most effectively differentiate between the remaining top products.

**Process after each answer:** 1. **Update Scores:** Whenever the user provides an answer, we immediately update the score of all products as described above. 2. **Identify Candidate Pool:** We look at the current scores and identify the top N candidates – say the top 10 or 15 scoring products at this moment[\[53\]](https://github.com/TomKonig/GaveGuiden/blob/9e1b654938d33c895e246b9652cf237043cd7fdf/readme.md#L31-L39). These are essentially the front-runners for recommendation given what we know so far. 3. **Question Pool:** We maintain a list of which questions have not been asked yet (initially, all questions are unasked). 4. **Calculate Information Gain for Each Question:** For each remaining question in questions.json, we conceptually simulate or consider how that question might help distinguish the products: - We look at the candidate products and see how they differ on the attribute that question targets (the question’s key). For example, if the question is about "coffee type", we check among the top products: do some have coffee_type:espresso and others coffee_type:filter? If yes, then asking the user could eliminate one group or the other and thus is informative. If all top products share the same coffee_type (they’re all espresso items, for instance), then asking the user would not actually change the ranking (whichever way they answer, all current candidates align, so it doesn't differentiate). - We quantify this using an information gain or variance measure. One simple metric: count how many distinct tag values the candidates have for that key. If there are many different values present, that question can really narrow things down (high score). If there’s only one value present (or effectively one cluster), that question has no value right now (score 0). - Another approach: simulate splitting the candidates by each possible answer and see the balance. Ideally a question splits the candidates into groups (some would be very favored if the user answers A, others favored if user answers B). If a question would eliminate about half the candidates whichever way it’s answered, it’s extremely useful. - We also factor in question type: discovery questions (marked is_discovery) might be given a slight chance even if not the top differentiator, just to occasionally explore off-path ideas (e.g., a random 20% chance after 3 questions to throw one in, as per our design). 5. **Choose Next Question:** We pick the question with the highest score (the most differentiation power) to ask next[\[54\]](https://github.com/TomKonig/GaveGuiden/blob/9e1b654938d33c895e246b9652cf237043cd7fdf/readme.md#L32-L40)[\[55\]](https://github.com/TomKonig/GaveGuiden/blob/9e1b654938d33c895e246b9652cf237043cd7fdf/readme.md#L43-L51). If that question is a discovery question and we have a rule to only occasionally do discovery, we account for that (maybe we only consider it every few questions). 6. **Ask Question:** We render that question to the user in the UI, mark it as asked (remove from the pool). 7. **Loop:** When the user answers, we loop back to scoring (step 1) and repeat.

This loop continues until we meet a stopping condition.

**Example of the Engine in Action (Hypothetical):** - Initially, user has given no answers, so all products are equally considered. The engine might decide the most generally differentiating question is “Who is the gift for?” (relation) because products in our catalog vary a lot by recipient relation. - User says “It’s for my father-in-law” (which we map to “Mand” gender and maybe an implied age range, but let’s say we stick with just relation). - Now the top products might be those tagged for men, older demographic. Next, the engine might see that among the top candidates, some are hobby gadgets and some are alcohol-related, etc. It could ask an interests question next, like “Hvad interesserer han sig for?” (What is he interested in?). That’s a broad question, but suppose it picks a more specific one based on product differences: maybe half the top gifts are in “Outdoor” category and half in “Kitchen”, so it asks something like “Er han glad for udendørs aktiviteter?” (Does he enjoy outdoor activities?). - Depending on that answer, it will eliminate one set of products. If user says “Yes, he loves outdoors”, all the kitchen ones drop off and now outdoor ones lead. - Next, maybe among outdoor ones, some are camping gear, some are fishing gear. The engine might ask an even more specific question like “Har han en yndlingsfriluft aktivitet?” (Does he have a favorite outdoor activity?) with options like hiking, fishing, etc. - And so on... If at some point all remaining top products share a characteristic or we have very few left, the engine stops asking (no value in more questions).

### 4.3 Stopping Conditions

We don’t want to ask questions forever. The quiz should end when we are confident in a recommendation or when we’ve exhausted useful questions. We have defined a few stopping criteria: - **No More Informative Questions:** If our calculation shows that none of the remaining unanswered questions would meaningfully distinguish the top products (i.e., for all remaining questions, all the current candidate products are similar on those attributes), then asking further questions won’t improve the result. Essentially, all top candidates look the same in terms of tags, so whichever is currently top is as good as it gets. In this case, we end the quiz. - **Clear Winner Identified:** If at any point one product’s score jumps significantly ahead of all others – e.g., it’s, say, 30-50% higher than the next highest – we consider that a confident recommendation and can stop. We define a threshold for what “significantly ahead” means (could be an absolute score gap or relative). The idea is if one product fits so perfectly that the others are far behind, additional questions might not change the outcome (they’d likely only confirm that choice). - **Maximum Questions or Early Exit:** We also impose a practical limit on quiz length. Even if theoretically questions remain useful, we don’t want the user to fatigue. We plan the quiz to usually ask about 5-7 questions before naturally concluding. But with the early exit option, the user might end it sooner. If the user clicks the “Vis mig resultater nu” button at any time, that immediately triggers the recommendation to be shown, bypassing further questions. We treat that as a stopping condition initiated by the user. - **Exhausted Question Pool:** In the unlikely case the user kept answering and we actually ran out of questions (they answered everything in questions.json), then we have nothing left to ask – we must stop. (In practice, the quiz will stop by other conditions before this ever happens.)

When the quiz ends, the engine finalizes the recommendation.

### 4.4 Selecting the Final Recommendation (and Secondary Options)

Upon termination, the engine has a score for every product based on all the answers given. It then: - Sorts all products by their final score, highest first. - The product with the highest score is chosen as the **primary recommendation** – this is what we present as “the perfect gift” on the results page. - We also take the next few high-scoring products as **secondary suggestions**. In our UI, we plan to show maybe up to 3 alternative ideas (often users appreciate having a small set of options rather than a single take-it-or-leave-it suggestion). These secondary options are there in case the top recommendation isn’t exactly to the user’s liking; they might see one of the alternatives and go “Oh actually that one’s interesting too.” - These secondary suggestions are typically the 2nd, 3rd (and maybe 4th) highest scoring products. However, we ensure they are somewhat distinct – if the top scores are very similar items (like the same product in different colors or nearly identical products from two brands), we might skip some to show variety. Our differentiator_tags help here: if the top item and the second item only differ by color, showing both isn’t as useful. We’d prefer to show something that represents a different choice. We handle this logic in code by checking the tags of the next candidates and possibly jumping further down the list to find a sufficiently different alternative. - All recommendations (primary and secondary) are presented with their name, image, price, and a brief description of _why_ they were recommended (we often tailor a sentence that highlights the matching criteria, e.g., “Because he loves hiking and this is perfect for outdoor adventures”).

By providing a primary recommendation and a few secondaries, we increase the chance the user finds something appealing. Even if the top choice is slightly off, one of the next ones might catch their eye. And if they’re all off, that’s what the feedback is for (we learn from that). In testing, we’ve found that usually the primary is on target if the user gave us honest answers, with secondaries serving as confirmation or different style alternatives.

### 4.5 Adapting and Learning

The beauty of our engine is that it can improve over time in two ways: - **Manual updates:** As we see patterns in the feedback (e.g., consistently low ratings for a certain type of result), we can adjust product tags or add new questions to address that. For example, if many users downvote tech gadget gifts for “Partner” scenarios, maybe we need to ask a question about whether their partner likes gadgets or not, to better filter. - **Dynamic weighting:** We haven’t implemented full machine learning yet (that would require a larger dataset), but we can tweak the weight of certain answers in the scoring as we learn. For instance, maybe we realize that “relation” is very important (should have a heavy weight), whereas “age” perhaps is a softer factor in some cases. Currently those weights are set by intuition, but with enough data, we could derive optimal weights. In our code, it’s easy to change a weight constant and redeploy. - **Content expansion:** The engine’s adaptability means if we add a whole new category of products and corresponding questions, the system can incorporate them seamlessly. For example, if we start adding a lot of “travel” related gifts, we might introduce a question “Do they enjoy traveling?” with tags like interest:rejse. Once that question and tags are in place, the engine will automatically ask it when relevant (i.e., when travel gifts are in contention) and those products will be properly scored when the user answers. - **Edge cases and fallbacks:** We also built in some simple fallbacks: if somehow the quiz ends and no product has a clearly higher score (maybe user gave very vague answers), we still pick one – in such cases, it might almost be random among a top cluster. That’s rare, but in those cases the secondary suggestions become even more important (since the top choice is a toss-up, the user might prefer one of the others). If the user provided contradictory answers (like they said interested in outdoors and also said doesn’t like outdoors in a hypothetical scenario), the tags might cancel out – we try to prevent asking contradictory questions, but if it happened, the engine just scores as best as possible. - **Early exit logic:** When the user triggers early exit, behind the scenes the engine actually already had a notion of what the top product was at that moment (after, say, 3 answers). It will use that. We ensure that the early exit button only appears after certain key questions have been answered (so we’re not giving a wild guess after just 1 question). Typically relation + one interest + perhaps age give us enough to make a decent early guess. The early exit is calibrated to trade off some accuracy for user convenience, but thanks to the adaptive algorithm, even an early guess is often quite relevant.

In summary, our recommendation engine is a combination of deterministic scoring and heuristic-driven question selection. It’s designed to behave intelligently with relatively simple rules, leveraging the structured data we have. By continuously enriching that data (more products, more tags) and refining the questions, we effectively make the system smarter. The result for the user is that uncanny feeling that the quiz “really understood me” with only a few questions.

_(The details of the algorithm’s implementation in code are further documented in the quizLogic.md technical guide, but the above outlines the key concepts. Next, we’ll discuss how we source and maintain the content – our product catalog – including the integration of AI assistance in that process.)_

In conclusion, the dynamic question engine makes the quiz **adaptive, efficient, and personalized**. By replacing a rigid question tree with an algorithmic approach, we ensure that **we only ask what we need to ask**. This keeps users more engaged (since every question is relevant to them), reduces dropout rates (shorter, smarter quizzes are more likely to be completed), and improves recommendation quality (because we gather just enough key information for a confident match). It’s a cutting-edge feature of Den Rette Gave that elevates the user experience beyond what a typical static quiz or filter list can offer. The beauty of this system is that as we expand our product range or add new questions, the engine naturally incorporates them – always seeking the best question to ask next – making the platform increasingly intelligent over time.

## 5.0 Visual Identity & Design Language

This section defines the aesthetic principles of the **Den Rette Gave** brand, ensuring a consistent and professional user experience across the application. A strong visual identity is crucial for building trust with users (they should feel they’re using a credible, modern service) and for making the experience delightful (appealing design reduces friction and leaves a positive impression).

### 5.1 Design Philosophy

Our design philosophy is rooted in **minimalism and clarity**. We recognize that users come to Den Rette Gave with a specific mission: to find a great gift, quickly and easily. The interface must therefore be a **frictionless tool** that aids them, not an obstacle or a source of confusion. Every design decision is made to streamline the experience and keep the user’s attention on the content (the questions and the gift suggestions) rather than on any extraneous UI elements.

Key principles: - **Purpose-driven Elements:** Every element on the screen serves a purpose in guiding the user through the quiz. We avoid any clutter such as unnecessary images, decorative graphics, or blocks of text that don’t add value to the current step. For example, on the quiz questions, we present a clean card with the question and the answer options; we don’t have sidebars or ads or unrelated links that could distract. - **Avoiding Cognitive Overload:** By keeping the design simple, we reduce the cognitive load on users. There is generous use of whitespace to create a calm and focused environment. This means spacing out components so nothing feels cramped or overwhelming. Users aren’t confronted with, say, 20 options at once or walls of text – instead, one question at a time, plenty of breathing room around content, and clear visuals. - **Consistency:** We use a consistent style for typography, buttons, and colors, so that once users get familiar with one part of the site, everything else feels intuitive. For instance, our primary action color (a specific shade of blue) is always used for clickable buttons like “Start Guiden” and “Next” and “Submit”, so users subconsciously know which elements can be interacted with. Headings and body text have consistent sizes and weights across pages. - **Emotional Tone:** The design should feel **friendly and modern**. We opted for a warm yet professional aesthetic. Friendly, because we want users to feel comfortable and delighted (finding a gift is an emotional task; the UI should support positive emotions like excitement to find something great). Professional, because we want to be seen as trustworthy experts (users are taking our recommendation seriously, so the site shouldn’t look like a casual hobby project). - **Restraint with Enhancements:** While we incorporate animations and interactive feedback (as mentioned in micro-interactions), we do so sparingly and tastefully. We don’t use flashy animations that distract or slow down the experience – only subtle ones that improve feedback. For instance, the cross-fade transitions gently guide the eye rather than sudden jumps. Hover effects on buttons are quick and slight, just enough to signal interactivity. - **No Competing Calls-to-Action:** On any given view, we ensure that the user’s primary action is obvious and stands out. On landing, the “Start Guiden” button is big and bold, while any secondary info (like a tagline or the “How it works” link) is more subdued. During the quiz, the “Next” button is prominent once an answer is selected, guiding them forward. On the results page, the primary call-to-action is the “Buy now” affiliate link, which we style as the standout button (with maybe a secondary style for “Share” and a tertiary style for “Report issue”). By establishing a clear hierarchy, we avoid confusing the user about what to do at each step. - **Mobile-first Responsiveness:** Although not explicitly mentioned earlier, our design is implemented to work well on mobile devices (a lot of users might be on phone when quickly searching gifts). The minimalistic layout and large tappable buttons lend themselves well to mobile. We ensure text is legible on small screens (using adequate font sizes like 16px+ for body, etc.), and we use responsive design through Tailwind classes to adjust spacing and font sizes for smaller vs larger screens. Mobile design also benefits from our one-question-at-a-time approach, as it fits nicely on a small screen without overwhelming the user with too much at once. - **Color usage for guidance:** We use color functionally. The primary brand color (Slate Blue) draws attention to interactive elements (like the start button, next buttons, selected options), which naturally guides the user’s eyes to what they should do. Neutral colors (grays, whites) make up the backgrounds and text to ensure high contrast and readability. We avoid using too many different colors which could cause visual confusion or seem unprofessional. - **Imagery:** We do have product images on the results page, which are important. Elsewhere, we keep imagery minimal. Our logo is simple (perhaps a small gift icon or just our name in a stylish font with a small graphic). We don’t flood the interface with stock photos or irrelevant graphics, which aligns with our clean approach.

In summary, our interface tries to “get out of the user’s way” and let them accomplish their goal effortlessly. It should feel **light, open, and intuitive**. By reducing clutter and focusing on the essentials, we also implicitly communicate that we respect the user’s time and attention. Users shouldn’t need a tutorial to use the site – the design itself should make the path obvious.

We believe this design philosophy contributes greatly to user satisfaction: a user may not consciously note the design decisions, but they will feel the ease and focus the design provides. And since the service is about solving a problem (gift searching), making that process as smooth as possible is part of delivering on our core value proposition.

### 5.2 Color Palette

The color palette is intentionally limited to create a clean, modern, and trustworthy aesthetic. We use a few key colors consistently throughout the UI. Here is a summary of our palette and how each color is used:

| **Role**              | **Color Name** | **Hex Code** | **Tailwind Class** | **Usage**                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| --------------------- | -------------- | ------------ | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Primary (Action)**  | Slate Blue     | #4F46E5      | bg-blue-600        | Used for primary buttons (e.g., "Start Guiden", Next/Submit buttons) and other key interactive elements or highlights. This bold blue draws user attention to actions they can take. It’s a color that conveys trust and stability (blue is often associated with reliability), but with a modern vibrant twist in this shade.                                                                                                                         |
| **Text & Headers**    | Charcoal       | #1F2937      | text-slate-800     | Used for nearly all text (headings and body text). It’s a very dark gray (almost black) which ensures maximum readability against light backgrounds without the harshness of pure black. This color choice for text provides excellent contrast (meeting accessibility standards) on our off-white background, making sure content is easy to read.                                                                                                    |
| **Background**        | Off-White      | #F9FAFB      | bg-slate-50        | Used as the main background color of the application (pages, sections). It’s a very light gray with a hint of warmth, rather than stark white, to be easier on the eyes. This forms the base that everything sits on – it keeps the interface feeling open and uncluttered. Large portions of the app use this color to create that clean canvas look.                                                                                                 |
| **Borders & Accents** | Light Gray     | #E5E7EB      | border-slate-200   | Used for subtle dividers, borders of cards or inputs, and background of inactive elements. For example, cards containing questions or results might have a light gray border or shadow to distinguish them from the background. Also used for things like the border of text input fields, dividing lines in the admin table, or the background of disabled buttons. It’s a neutral tone that adds structure without drawing much attention to itself. |

By limiting ourselves to these core colors (with some variations like hover or lighter/darker shades provided by Tailwind automatically), we ensure a cohesive look. It also simplifies the user's cognitive load – they subconsciously learn that blue elements are interactive, gray elements are structural, etc.

**Examples in UI:** - The **Landing page** likely has a white/off-white background with a big blue button ("Start Guiden"). The heading text might be charcoal, any subtext gray. This contrasts nicely: blue button on a very light background immediately visible. - **Quiz cards** (questions): they might be on a white surface (#FFFFFF or slate-50) with a light gray border to delineate them. The question text is charcoal. The option buttons might be white with gray borders until selected; when selected or hovered, we fill them or outline them in blue to show selection. - **Results card:** likely white background with gray border/shadow, containing text in charcoal. The "Buy now" button in that card is blue (primary action). Secondary actions like "Share" might just be text links (perhaps in blue but less emphasized, or gray button). - **Admin panel:** Uses the same palette for consistency. The tab buttons active state might be blue underline, etc. Even though it's an internal tool, keeping the same palette is good for consistency (and if the admin panel were ever to be more widely used, it looks like part of the same brand).

We also pay attention to **accessibility** with colors: - Sufficient contrast: Our text color (slate-800 on slate-50) is well above the recommended contrast ratio for readability. The blue (#4F46E5) on white also has good contrast for large text and is used carefully for buttons with white text on blue (white on #4F46E5 also is a decent contrast, we should check it's at least around 4.5:1, which it is). - We avoid color alone to convey information whenever possible (for example, selected states not only rely on color but also an icon or border difference, so colorblind users can still identify selection). - The palette’s simplicity also helps users with cognitive or visual processing issues – the interface isn't noisy or rainbow-colored; it’s straightforward and calming.

In summary, our color choices support the brand personality: **Trustworthy (blue), Clear (high contrast text), and Friendly/Calm (soft background and gray accents).** By using Tailwind classes, we maintain consistency easily (no risk of someone accidentally using an off-spec color code, since we stick to the classes).

### 5.3 Typography

We carefully chose typography to complement our minimalistic, modern design and to enhance readability across devices:

- **Font Family:** We use **'Poppins'** as our primary (and essentially only) font, served via Google Fonts. Poppins is a clean **geometric sans-serif** typeface.
- _Why Poppins?_ It has a friendly, approachable feel due to its geometric shapes (circles and curves in letters like O, P, a, etc.), aligning with our brand’s friendly tone. Yet it's also modern and professional. Poppins has excellent legibility on screens at various sizes, which is crucial for a web app. It offers a wide range of weights (100 thin up to 900 black), allowing for flexibility in creating a visual hierarchy without needing multiple font families (which could bloat loading and cause style inconsistency).
- By using one font family throughout, we ensure consistency and quick load (one HTTP request). The uniform font also helps the app feel cohesive. And Poppins supports the necessary characters for Danish (accents, etc.), which is obviously important for correct rendering of Danish text.
- **Font Weights and Hierarchy:**
- **Headings (H1, H2):** We use a **bold weight (700)** for main titles and section headers. For example, the landing page main headline “Find den perfekte gave. Hver gang.” might be H2 in bold, making it stand out. Bold Poppins has enough weight to catch attention but its geometric forms keep it from feeling too heavy or old-fashioned. We pair the bold weight with larger font sizes for headings, giving clear section delineation.
- **Subheadings (H3, etc.):** We apply a **semi-bold weight (600)** to sub-section headers or important labels inside sections. For instance, in the admin panel, section labels like "User Reported Flags" might be semi-bold if they are not top-level but need emphasis. Semi-bold is a step down from bold, providing hierarchy: visually you can distinguish main vs sub by both size and weight.
- **Body Text:** The bulk of our text (paragraphs, descriptions, quiz questions, option labels, button text, etc.) uses **regular weight (400)**. This provides optimal readability, as heavier weights can cause eye strain for paragraph text. Poppins at 400 has a nice clean look. We use adequate font sizing (e.g., 1rem (16px) or above for body) to ensure it’s easy to read on both desktop and mobile without zoom.
- **Other text:** For very minor or secondary text (like maybe footnote, or placeholder text), we might use a lighter gray color but still regular weight. We generally avoid using lighter weights (like 300) because very thin fonts can be hard to read, especially against light backgrounds or on lower-resolution screens. Our approach is high contrast and sufficiently weighted text for legibility.
- **Text spacing and line heights:** We likely use Tailwind’s default line-heights or slightly increased for body text to ensure breathing space in paragraphs. White space is part of typography as well – by not cramming lines, we let the eye comfortably move. For headings, sometimes a tighter line-height (e.g., 1.1) looks good for multi-line big text, whereas for body we use ~1.5 for readability.
- **Language and Tone in text:** Though not about the font itself, consistency in **style** is important. We address the user in a friendly but respectful tone (in Danish, using an informal tone that’s customary in consumer apps). Our text is concise, avoiding jargon. This consistency in content plus using one font yields a unified voice for the brand.
- **System fonts fallback:** If for some reason Poppins fails to load, our CSS likely specifies a fallback stack (like sans-serif) which will pick a system UI font. This ensures content is still shown in a decent font. But normally, Google Fonts are reliable and Poppins will load quickly (we may use preconnect and font-display: swap so text appears in default font then swaps to Poppins quickly without a flash of invisible text).

By sticking to **one font family with a clear weight hierarchy**, new developers or designers picking up the project know exactly what to use for any new UI element: Poppins, and choose weight according to importance. It simplifies design decisions and ensures no mismatch (like one page accidentally using a different font or weight for similar heading).

**The effect on user experience:** A good typographic hierarchy allows users to parse content structure at a glance. For example, on the results page, the product name might be in semi-bold larger text, the description in normal weight, smaller text. The user can immediately see what's the name vs description vs action. On the admin panel, table headers might be semi-bold small caps or similar, and table content normal – making it easy to scan.

All in all, our typographic choices reinforce clarity: nothing too decorative or complex, just straightforward, modern text that matches the clean aesthetic of the whole site.

With the visual identity established, we ensure that whether a user is taking the quiz or an admin is editing content, the look and feel remain consistent – reinforcing the brand at every touchpoint.

## 6.0 Admin Panel & Operations Dashboard

The **admin panel** (accessible via admin.html) is a comprehensive internal tool for managing the application. It’s essentially our command center for content and quality control. While end users never see this, it is crucial for us (the team) to efficiently maintain and improve the system without directly editing code or JSON through a repository for every little change.

The admin interface is built as a single-page dashboard with multiple tabs, each focusing on a certain aspect of the operations. The design and functionality of the admin panel aim to make managing the site **easy and secure** for the administrator.

### 6.1 Secure Access

Because the admin panel has powerful capabilities (like editing products and viewing user feedback), it is locked down by a security barrier to prevent unauthorized access: - **Password Protection:** When someone navigates to admin.html, they are presented with a login screen. This consists of a simple password input field and a login button. There are no user accounts or usernames – just a single, shared admin password for the site (since likely it’s just the site owner or a very small team using it). - **Environment Variable Storage:** The admin password is **not stored in the front-end code** or anywhere in the public repository. Instead, it’s set as an environment variable (ADMIN_PASSWORD) in our hosting platform (Netlify). This way, if someone inspects our client-side code or even the functions code, they won’t find the actual password. It’s securely injected server-side for the login function to use. - **Admin Login Flow:** When the admin enters the password and hits login, a request is sent to the admin-login serverless function (as described in section 3.3). That function checks the password against the environment variable. If correct, it generates a temporary auth token and sends it back. The browser then transitions from the login view to the main admin dashboard view. If the password is wrong, an error message (“Incorrect password”) is shown and the admin remains on the login screen. - **Auth Token & Session:** After successful login, the admin panel uses the auth token for any further requests to protected functions (like get-ratings). The token is stored in sessionStorage (which means it stays for the duration of the browser session). This token prevents others from invoking admin functions – the functions expect this token and will reject requests that don’t have it. The token likely has an expiry (for example, it could be a JWT valid for a couple hours). We did this to avoid the need for a persistent session store; and since the usage is infrequent and by a known admin, this lightweight approach suffices. If the token expires, the admin might be prompted to log in again. - **No Password in Code:** Since the password is an env var, we can update it without code changes – just by changing the Netlify setting. This is important if we suspect the password was compromised; we can rotate it easily. - **Single Admin vs Multi-admin:** Our current design assumes a single admin user (or at least a single credential shared by the small team). There’s no concept of multiple accounts or roles. That keeps things simple and is fine given the project’s scale. If we needed to extend to multiple admins, we might move to a slightly different approach (like Netlify Identity or a custom users DB) but that’s beyond current needs. - **Page not indexed:** We likely ensure admin.html is not indexed by search engines (via perhaps a robots.txt disallow or meta noindex) and not linked from anywhere public. This “security by obscurity” layer means casual users won’t stumble upon it. However, one could find it by guessing or if they know the project structure. But even if they load the page, the password gate stops them. - **Session Security:** Since we use sessionStorage for the token, if the admin closes the browser or tab, the token is gone and they’d have to log in again next time (which is fine; it’s probably better than leaving it persistent because on shared computers you wouldn’t want a token lingering). If we used localStorage, it would persist, but we chose sessionStorage for that reason. - **Communication:** All admin interactions happen over HTTPS (because the site is served via HTTPS), so the password and tokens are not exposed in plain text over the network. - **Changing Password Procedure:** The admin Settings tab in the panel provides instructions on how to change the admin password via Netlify’s dashboard (since that’s where it’s stored). This is a bit manual but fine for our use. Essentially, the admin would log into Netlify, navigate to the environment variables settings for the site, update ADMIN_PASSWORD, and redeploy (or trigger a rebuild). We outline these steps clearly so a future maintainer or a less technical admin could follow them if needed. This way, no code needs to be changed to update credentials – keeping security management separate from app logic.

In summary, the admin panel is strongly gated to prevent anyone but authorized personnel from using it. We take a least-privilege approach: only if you know the secret password can you even see the dashboard. This mitigates risk of malicious edits or data exposure.

### 6.2 Dashboard Tabs

Once logged in, the admin sees the **Operations Dashboard**, which is divided into several tabs each focusing on a particular set of tasks. The interface is designed to be intuitive, even for a non-developer, so that routine content updates or checks can be done without diving into code or raw JSON manually. Here’s a breakdown of the tabs and their functionality:

- **Live Editor:** This tab provides a direct text editor interface for products.json (and potentially other asset files). It displays the entire JSON content of our product database in a large text area. The admin can scroll through or search within it and make edits as needed (like editing a product’s description, adding a new product JSON object, etc.).
- We included this for advanced edits or bulk changes, as it gives full control over the JSON structure. It’s essentially like editing the file in an IDE but in the browser.
- Below the text area, there's a "Copy to Clipboard" button. Since we currently can’t save directly to the server (the static site cannot be directly modified permanently from the browser without a backend process which we avoided), the workflow is: admin makes changes in the text area, then clicks "Copy". This copies the entire JSON content with the edits to their clipboard.
- The admin is then expected to paste this content into the actual products.json file in the GitHub repository (or in Netlify CMS if configured, but here likely via GitHub). Essentially, Live Editor lets them prepare changes easily and then they do the final commit externally. This is a bit of a workaround, but it avoids building a full file-write API (which would have complexities and potential security issues).
- We provide feedback like a small “Copied!” message to confirm the action.
- This approach ensures no direct unauthorized changes happen to products.json without going through our code review or deploy process (unless we set up a direct API in future). It is somewhat manual but given product updates aren’t daily, it’s manageable.
- In the future, we might automate this with a GitHub API integration or similar, but currently, it’s a safe semi-manual process.
- **Edit Product:** This tab is a user-friendly form-driven way to modify individual products without dealing with raw JSON. It’s especially useful for quick tweaks (like fixing a typo in a description, updating a price, or toggling an “active” status).
- At the top, there’s a dropdown **Select a Product** which lists all products (maybe by name or ID). The admin selects the product they want to edit.
- Once selected, a form appears with fields corresponding to that product’s data: Name, Description, Price, Image URL, Tags, etc.
  - The Tags field might be a text input expecting comma-separated values or a JSON snippet for the tags object. Currently, we just expose it as a text input for simplicity, expecting the admin to input something like gender: \["Mand","alle"\], age: \["18-25"\], interests: \["Outdoor"\] maybe. (This is a bit technical, so we might instruct that or improve it later with multi-select UI).
  - If differentiator_tags are present, perhaps we show those too or manage them behind the scenes.
- After the admin edits any fields, they click **Update in Editor** (or Save Changes). This doesn’t directly save to server, rather it updates the JSON in the underlying Live Editor text area to reflect the changes for that product.
- Essentially, under the hood, the Edit Product form modifies the products.json content loaded in memory and updates the Live Editor accordingly. It’s like a GUI for the JSON.
- Then, the admin still needs to go to Live Editor tab and copy-paste to GitHub. However, we could streamline by combining – possibly the copy button could be accessible from here too or an alert “don’t forget to save these changes by copying to clipboard and updating the file in GitHub”.
- The reason for this separation: it reduces human error in JSON editing (less chance of breaking JSON syntax or forgetting a bracket if they use the form for typical fields).
- This tab makes things like marking a product inactive easier: if we included an "Active" checkbox in the form, the admin can tick it off, and under the hood it might add "active": false in the JSON for that product. (We should incorporate that in the product schema soon, if not already).
- It also helps in adding a new product: we currently have "Edit Existing Product". If we wanted to add new, we might either allow selecting "New Product" in the dropdown which clears fields, or instruct to use the Live Editor for now. Possibly in future we’ll add an “Add Product” function.
- **Flagged Items:** This tab is dedicated to handling user-submitted error reports (the flags).
- It displays an **aggregated table** of issues. Each row typically represents a unique combination of product and issue type, with columns like:
  - _Product:_ (Name or ID of the product that’s been reported)
  - _Issue Type:_ (e.g., “Billedet mangler” (Image missing), “Linket virker ikke” (Broken link), “Prisen er forkert” (Price is wrong), “Andet” (Other))
  - _Reports:_ how many times that issue has been reported for that product.
  - _Last Reported:_ a timestamp or date of the most recent report.
  - _Action:_ an action button, like **Resolve** or **Mark as Fixed**.
- When admin opens this tab, a script fetches flags.json (via our flagsData loaded earlier or it might call the function – but since flags.json is public, we might fetch it directly).
- The data is aggregated so that if, say, 3 users all reported "Image missing" for Product X, it shows as one row: Product X, Issue: Image missing, Reports: 3, Last reported: \[most recent timestamp\].
- The admin can use this info to prioritize what to fix. If something has crossed the **Alert Threshold** (which is displayed at top or configurable), we highlight or show an alert (the red alert box "You have products with a high number of error reports").
  - There’s an input for Alert Threshold at the top, default 3 (meaning if 3 or more reports on an issue, consider it urgent).
  - The admin can adjust this threshold number if needed, say if they want to be alerted only if 5+ reports.
  - The logic in the interface will highlight any row that has Reports >= threshold and also show the big alert box if any such exists.
  - This draws attention to potentially serious widespread issues (for example, if 5 people reported broken link for the same product, likely that link is dead and should be fixed ASAP, maybe mark product inactive until fixed).
- The **Resolve action:** When the admin believes an issue is handled (like they updated the product’s data or confirmed it’s a false alarm), they click "Resolve" on that row. Currently, clicking this in the UI sets those flags status to "resolved" in our local flagsData and ideally would call an API to update flags.json. In our code, we left a comment "This would ideally send an update to a 'resolve-flags' function".
  - We haven't implemented that function yet, so as a temporary measure, resolving might just hide it from the UI (the code sets status=resolved in memory and maybe filters it out of display). The actual flags.json remains unchanged unless we manually clear it or provide an offline step.
  - In the future, we plan to have a resolve-flag function or allow the admin to download the updated flags.json or something. Currently, a pragmatic approach is that after resolving, the admin might manually edit flags.json (via GitHub or a direct method) to remove or mark those entries. Or simply note that all issues in that row are resolved and ignore them going forward.
- The key is that this tab gives visibility into recurring problems:
  - If multiple reports have come in, the admin knows there’s a systemic issue (like a consistently broken image link).
  - They can then go to Edit Product or Live Editor to fix that (update image URL or price).
  - Once fixed (and maybe deployed), they can mark resolved so it doesn't keep showing as active.
  - If something is resolved, but more reports come later (maybe the issue recurred or users still experiencing it), new unresolved flags would show up again, thereby "reopening" effectively.
- Also note, flags have timestamps, so "Last Reported" helps see recency. If something had 3 reports but last one was a year ago, maybe not urgent now (maybe it was fixed already, just never resolved in system).
- We also have an **Alert Banner** at the top of admin panel that appears if highAlert is true (meaning at least one issue >= threshold). It's styled with a red left border etc., to catch attention. The admin will see a bold "Alert!" and a message. This appears upon loading admin if severe issues exist.
- **Ratings:** This tab allows the admin to view user feedback in the form of star ratings and the context of those ratings.
- It presents a table where each row is one rating entry from ratings.json. The columns are likely:
  - _Product:_ (Name of the product that was recommended and rated)
  - _Rating:_ (the star value 1-5, possibly shown as stars or numeric)
  - _Date:_ (when it was submitted)
  - _Quiz Answers:_ (the anonymized answers that lead to that recommendation)
- On load, the admin panel calls the get-ratings function (with the auth token) to retrieve the latest ratings data. This fills the ratingsData array and we then render the table.
- We might sort by date by default (most recent first) so the admin sees the latest feedback easily.
- The purpose of showing quiz answers along with each rating is to help identify patterns:
  - e.g., If the admin sees that for relation "Kollega" with interest "Tech", the user gave a 2-star rating, they might wonder if the suggestion for colleagues interested in tech is not good and check what product it was (the product name is right there).
  - If multiple low ratings cluster around certain criteria (like all the 1-star ratings are for age 60+ recipients, or for occasion "Årsdag"), it might signal those segments are not well served by the current product pool or logic.
  - Conversely, high ratings reinforce what's working.
- The admin can use this data to adjust content: maybe add better products for a category that’s underperforming, or adjust tags to make the matching better.
- It’s essentially our feedback loop to improve the recommendation engine over time (right now manual via admin insight, possibly in the future automated).
- We keep user answers anonymous (no names as we said). So "relation: Friend, gender: Female, interests: \[Hjemmet, Kaffe\]" etc. This should be enough context to understand the scenario without identifying who it was.
- There’s no direct "respond" or anything – this is purely for internal insight. We don’t tie it back to a user email or anything (there’s no user accounts).
- This tab might allow sorting or filtering in future (like filter by product to see all ratings for product X, or by rating value to see all 1-stars quickly). Currently, it's just a raw table. If we find it unwieldy as data grows, we’ll consider adding such features.
- **Settings:** This tab is for administrative settings and instructions for maintenance tasks:
- Right now, the main focus is **Change Admin Password** instructions. We include a step-by-step as we wrote in the code:
  1. Log in to Netlify.
  2. Go to the site’s settings.
  3. Navigate to Environment variables.
  4. Find ADMIN_PASSWORD, edit it.
  5. Save and redeploy.
  6. We provided these steps in simple language in case the person managing the site is not very technical but knows how to follow this guide (or for memory’s sake).
  7. The reason we do this manually: implementing an in-app password change would require a function to update environment var (which Netlify doesn’t allow directly at runtime) or some storage, so it’s simpler to document how to do it outside the app.
- If we had any other settings (like analytics or integration keys, threshold default etc.), we could put them here too.
- Essentially, anything not directly related to content or user feedback but rather system config could live under Settings.
- The design is straightforward: maybe a list of subheadings and text. We don't have interactive elements here except maybe a link to Netlify.

The admin panel’s **design** aligns with the main site but with a more utilitarian bent: - It uses the same Tailwind styles and fonts for consistency. - It likely has a tab navigation at top (which we do in code via buttons styled as tabs). - Active tab is highlighted (blue border-bottom). - Tables are styled with light gray headers and alternating row colors or lines for readability. - Buttons like "Copy to Clipboard", "Update in Editor", "Login", etc., use the same blue styling or green for the save changes (we did use a green for "Update" to differentiate it as a positive action and maybe to avoid confusion with primary site actions). - The layout is responsive to some degree, but since admin might often be used on desktop, it's okay if it's not perfect on mobile (though we did make it flexible).

**Admin Workflow Example:** - Admin logs in. Sees an alert about 1 flagged item beyond threshold. - Goes to Flagged Items, sees "Product Y – Link broken – 4 reports". - Clicks the product name or switches to Edit Product tab, selects Product Y. - The link field shows an outdated URL. Admin fixes it to the correct one (maybe got a new affiliate link). - Clicks "Update", then goes to Live Editor, copy content, paste to GitHub and commit "Fix link for Product Y". - Marks the flag as resolved in the UI. The alert clears (for now). - Then checks Ratings tab, sees mostly 5 and 4 stars but one 2-star for a certain scenario. Takes note to investigate product matching for that scenario. - Possibly adds a new product via Live Editor if needed or adjusts tags on an existing one via Edit Product. - That’s how continuous improvement happens through the admin panel.

Overall, the admin panel greatly enhances our ability to manage the platform **efficiently**: - We can react to user feedback quickly (fix issues, remove problematic products). - We can keep the content fresh (add new products, update prices). - And do all this in a relatively friendly interface, rather than editing JSON in a code editor and manually parsing ratings logs.

It is an essential tool especially as the site grows, preventing small problems from accumulating and giving us insights to refine the user experience. It's basically the behind-the-scenes engine room that keeps the public-facing experience high quality.

## 7.0 Automated Content Generation & AI Integration

One of our most innovative operational strategies is leveraging AI (Large Language Models) to assist in discovering and adding new products to our catalog. Rather than relying solely on manual research, we’ve developed a workflow where an AI agent can autonomously browse partner webshops and generate well-structured product entries for us. This helps keep our platform’s offerings fresh and diverse with minimal manual effort.

The AI is guided by carefully crafted prompts – essentially detailed instructions that tell it how to perform the task of product discovery and catalog entry creation. We maintain these master prompt templates in separate documentation (see masterprompts.md in our repo for the full text of these prompts). Here we’ll summarize how the AI-driven workflow functions and how it integrates with our system.

### 7.1 AI-Driven Workflow: Autonomous Product Discovery & Curation

To maintain a competitive and diverse product catalog, we employ an automated, AI-driven workflow for product discovery and curation. This process is orchestrated by a sophisticated, agentic AI tasked with browsing our affiliate partner webshops, identifying high-potential gift items, and generating perfectly structured data for our products.json file. The workflow is initiated via a **master prompt** designed to guide the AI through a multi-stage process of curation and analysis.

#### 7.1.1 The Philosophy and Structure of the Discovery Prompt

The master prompt is not merely a set of instructions; it is a carefully engineered blueprint that instills our strategic goals and quality standards into the AI agent. It’s quite literally a conversation script that the AI follows to ensure it performs as an expert product scout and data analyst for our team. The prompt is broken down into several key components, each serving a purpose:

- **Role & Goal Definition:** The prompt begins by assigning the AI a specific role: _“You are an expert E-commerce Strategist and Product Discovery Specialist for denrettegave.dk.”_ This role-definition is critical in prompt engineering. By giving the AI a persona with expertise (in e-commerce strategy, gift curation, etc.), we prime it to utilize knowledge and reasoning patterns relevant to that domain. It’s akin to telling it, “Think like an experienced buyer and marketer.” The goal is clearly stated: autonomously browse given webshops, find great gift products, and produce JSON entries for our database. By articulating this upfront, we set the AI’s high-level direction and end output.
- **Two-Stage Task (Curation then Analysis):** We explicitly instruct the AI that its job has two phases:
- **Discovery & Curation:** Act like a skilled human shopper or gift curator. This means browsing the site organically, considering product appeal, diversity, and gift suitability. The AI is told to pick at least 5 unique products per site that it deems excellent gifts. We provide heuristics (discussed below in Section 7.1.3) for what “excellent gifts” mean, e.g., broad appeal, high quality images, price variety, giftability, etc.[\[58\]](https://github.com/TomKonig/GaveGuiden/blob/2fd030095ad2f06ddd6aeafeafdaf23ddd3b6c9e/masterprompts.md#L34-L42)[\[59\]](https://github.com/TomKonig/GaveGuiden/blob/2fd030095ad2f06ddd6aeafeafdaf23ddd3b6c9e/masterprompts.md#L36-L44). In this phase, we want the AI to be creative and insightful, not just grab the first items – it should imitate how an experienced curator would pick a balanced list of suggestions.
- **Analysis & Generation:** Once products are selected, the AI switches mode to an analytical role – “now put on your e-commerce analyst hat”. For each chosen product, it must dig deeper: gather details (name, description, price, image link, etc.), and then generate a JSON object following our schema exactly[\[57\]](https://github.com/TomKonig/GaveGuiden/blob/2fd030095ad2f06ddd6aeafeafdaf23ddd3b6c9e/masterprompts.md#L43-L51)[\[60\]](https://github.com/TomKonig/GaveGuiden/blob/2fd030095ad2f06ddd6aeafeafdaf23ddd3b6c9e/masterprompts.md#L64-L72). This includes assigning all relevant tags and differentiator_tags as per our system.

This separation ensures the AI first focuses on _what_ to include (discovery) and then on _how_ to structure it (analysis). It reduces the chance of it skipping good options or formatting things incorrectly, since it knows it will handle formatting in a dedicated step.


#### **7.1.2 The Technical & Human Workflow for Product Discovery**

The execution of this prompt follows a precise operational sequence:

1. **Input:** The Human Partner provides the agentic AI with a list of one or more partner webshop URLs (e.g., \[ "https://www.imerco.dk/", "https://www.ditur.dk/" \]).  
2. AI Execution (Autonomous):

a. The agent fetches and parses the live products.json file.  
b. It navigates to the first webshop URL.  
c. It browses the site and selects at least five promising gift products that are not already in its fetched catalog data.  
d. For each of the five selected products, it performs the full analysis and generation loop, creating a perfectly formatted JSON object.  
e. It repeats this process for every other webshop URL in the input list.

3. **Output:** The agent's final output is a single, clean JSON array containing all the newly discovered and analyzed product objects.

4. **Human Action:** The Human Partner copies this JSON array and pastes it into the "Live Editor" in the admin.html panel, appending it to the existing list of products. After a final review, the "Save to GitHub" button is clicked, and the new products are committed to the repository and deployed to the live site.

### **7.2 AI-Driven Workflow: Single Product Analysis & Enrichment**

For situations where a specific product has been pre-vetted or needs to be added to the catalog quickly, we utilize a second, more focused master prompt. This workflow tasks the agentic AI with performing the same deep analysis and data generation, but for a single, pre-given product URL.

The complete, unabridged master prompt for this task is maintained externally in the **Appendix** of the document: product-discovery-prompt-blueprint.md.

#### **7.2.1 The Philosophy and Structure of the Analysis Prompt**

While the single-URL prompt shares the same core logic as the discovery prompt, its structure is optimized for depth over breadth. The key philosophical underpinnings are focused on creating the richest possible dataset from a single source.

* **The Tagging Philosophy (The Core of Our Data Strategy):** The most critical section of the prompt is the detailed explanation of our tagging methodology. This is how we translate a product's features into a structured format that our quiz engine can understand and leverage. The philosophy is divided into two tag types:  
  * **Core Tags (tags):** These are the broad, foundational attributes that map directly to the initial, user-facing questions in our quiz (e.g., gender, age, price). They allow the engine to perform the first major filtering and scoring pass. A crucial instruction here is for the interest tag to be **analytical and open-ended**. The prompt explicitly tells the agent *not* to use a predefined list, but to identify all specific interests a product serves (e.g., a cookbook might generate interest:madlavning, interest:foodie, and interest:italiensk\_mad). This approach ensures we capture nuanced data that can be used to build more intelligent quiz questions in the future.

  * **Differentiator Tags (differentiator\_tags):** This is the key to the advanced intelligence and future scalability of our quiz engine. The prompt instructs the agent to be **exhaustive** in extracting every relevant technical specification and granular attribute. The philosophy here is **"collect now, use later."** By instructing the agent to err on the side of too much detail (e.g., for a watch, capturing case\_size, band\_material, dial\_color, movement, water\_resistance, etc.), we are building a rich, structured dataset. In the future, as we analyze this data, we can identify common differentiators and build new, highly specific questions into our quiz ("Do they prefer a watch with a leather or steel band?"). This transforms our products.json file from a simple catalog into a dynamic, evolving knowledge base that powers the continuous improvement of our recommendation engine.

* **Automated Affiliate Link Construction:** The prompt hard-codes the structure of our Partner-ads affiliate links. The agent is instructed to take the product's direct URL and append it to a static base URL. This removes the possibility of human error in link creation and fully automates a critical part of our monetization strategy.

#### **7.2.2 The Technical & Human Workflow for Single Product Enrichment**

1. **Input:** The Human Partner provides the agentic AI with a single product URL.  
2. AI Execution (Autonomous):  
   a. The agent fetches the live products.json file to use as context for de-duplication.  
   b. It verifies that the input URL is not already in the catalog.  
   c. It performs the deep analysis and tagging of the product.  
   d. It constructs the affiliate link.  
3. **Output:** The agent's final output is a single, perfectly formatted JSON object.  
4. **Human Action:** The Human Partner copies the JSON object, adds it to the array in the "Live Editor" of the admin.html panel, reviews, and saves the changes to GitHub.

## 8.0 Go-to-Market & Launch Strategy (Phase 1)

With the product design and content in place, we also planned how to actually launch Den Rette Gave and acquire our initial users, all while keeping costs minimal. Phase 1 (the launch phase) is about implementing the core features (the Minimum Viable Product) and getting the word out effectively.

### 8.1 Minimum Viable Product (MVP) Feature Set

For launch, we focused on a few key features that provide the core value and also help with initial growth through virality and SEO:

- **"Share Results" Viral Loop:** On the results page, we included a **Share button** that allows users to get a shareable link to their gift recommendation. This feature is a growth mechanism:
- If a user finds the recommendation interesting, they might share it with the gift recipient (“Look, this is what I'm thinking to get you”) or with a friend (“What do you think about this idea for Dad's birthday?”).
- When the recipient or friend clicks that link, they see the results page with that product recommendation, and possibly a note like “This gift idea was shared with you.” Importantly, on that page we can encourage the new visitor to try the quiz themselves ("Find a gift for someone in your life").
- This creates a potential **viral loop**: one user’s result can bring in a new user. Even if only a fraction share, those shares might reach people who have never heard of our site but now visit because a friend recommended it indirectly.
- Technically, as described, this involved our create-share-link function generating an ID and the site handling a URL param or /share route to display it. We made sure the share links are anonymous (they don't reveal the user's identity or any personal data – they just show the gift). This lowers privacy concerns and friction.
- By including this at MVP, we baked in a way for organic user-driven distribution from day one.
- **Occasion-Specific SEO Landing Pages:** We created static HTML pages targeting specific high-intent search terms related to gifting. For example, a page like denrettegave.dk/julegaveideer (meaning "Christmas gift ideas") or .../fødselsdagsgaver (birthday gifts), etc.
- The idea is that many people search Google for terms like "best Christmas gifts for mom" or "gift ideas anniversary". We want to capture some of that search traffic.
- Each of these landing pages is tailored to an occasion or category. It might have:
  - An introductory paragraph with SEO keywords (in Danish) about finding gifts for that occasion.
  - Perhaps a few example products or suggestions (maybe statically listed or periodically updated) relevant to that occasion.
  - A prominent call-to-action to use our quiz (“Take the quiz to find the perfect X gift”).
- By hosting these as static pages, they can be indexed by Google. Unlike the dynamic quiz (which might be difficult for Google to crawl fully), these pages provide crawlable content.
- They target "high-intent" terms, meaning someone searching those is likely actively looking for a gift to buy – the exact audience we want.
- This strategy leverages SEO to funnel searchers into our quiz. Over time, as we build domain credibility, these pages could rank and bring in steady organic traffic at no cost.
- We chose a few key occasions to start (like Jul (Christmas), Fødselsdag (Birthday), maybe Mors dag (Mother's Day) etc., whichever are relevant in Denmark).
- The content on these pages will need to be good and perhaps occasionally updated to remain relevant (we might highlight new products or trending gifts there).
- But they are relatively easy to set up and don't require back-end logic (just static suggestions and links into our quiz or product pages).

These two features are the main additions beyond the core quiz that we prioritized for launch because they directly contribute to user acquisition: - The share feature turns users into evangelists (if they share). - The SEO pages aim to capture users who haven't heard of us but are searching for gift ideas.

We identified these as high ROI features that are not too costly to implement (the share needed some backend and the SEO pages are just content work and some SEO knowledge).

Of course, our MVP also includes: - The core quiz experience (which we've detailed). - The results with affiliate link clicking (our revenue mechanism). - The admin panel to manage things (though admin isn't user-facing, it's crucial for us). - Basic legal pages (privacy policy, terms) to be compliant and build trust. - The site branding and a simple homepage (which is basically the quiz landing as described). - Maybe a "How it works" modal or info for new users for transparency.

By focusing on these core elements, we avoided scope creep. Notably, we did _not_ include things like user accounts, wishlists, multi-language support, etc., in MVP – those are Phase 2 or beyond. We wanted to launch quickly but effectively.

### 8.2 Cost & Resource Optimization

In line with our business model of minimizing costs, we planned our infrastructure and marketing to take advantage of free or low-cost resources, especially at the beginning:

- **Hosting & Domain:**
- We used Netlify (or Vercel) largely within free tier limits. For a static site with occasional function calls, Netlify's free plan is very generous (they allow a good number of function invocations and bandwidth which likely suffice until we scale).
- That means our hosting cost initially is $0. We did, however, pay for the domain name registration (denrettegave.dk) which is usually on the order of $10-15/year (which is negligible monthly).
- So projected initial monthly hosting + domain cost: **<$20** (basically domain amortized monthly plus any minor overages on free tier, which we expect none initially).
- We also keep costs down by not using heavy databases or servers. All static/CDN and functions only on demand keeps usage low.
- If we had used services like AWS directly or a traditional server, it could easily be $20-50+ a month even if idle. So our approach is very cost-efficient.
- We also avoid any paid software tools at start (like analytics we start with free Google Analytics or our custom JSON logging, etc).
- **Initial User Acquisition (Advertising):**
- We planned to capitalize on sign-up offers from major ad networks. E.g., Google Ads often has promotions like "Spend $25, get $100 credit for new accounts". Microsoft Advertising (Bing Ads) similarly might have $50 or $100 free credits.
- We budget nearly $0 from our own pocket initially; instead, we use these credits to test advertising.
- With such offers, we could potentially get a few hundred dollars worth of ads in the first month or two without actually spending more than a token amount.
- This can drive initial traffic to our site. Likely we would target specific keywords (maybe "gaveidéer" etc) or run some display ads remarketing to share link visitors (just brainstorming).
- It's a one-time boost but useful to seed initial users and see how they interact (which gives us data to improve).
- We have to be mindful that ad credits often require a spend first (like you spend the first $25 then they grant the credit). So a tiny budget is needed, but that’s fine.
- We chose Google and Microsoft specifically because they have those promos and cover the majority of search market (Google mostly, but Bing has some share in Denmark too).
- We presumably didn't consider Facebook or others in initial plan because their free credit offers are less common or smaller. But we might in future or if they have any startup offers.
- By using these offers, we essentially get some initial marketing at no/low cost, aligning with our low-expense philosophy.

Combining the above: - We expect to launch and run initially well within a $50 monthly expense if even that, likely much less. - Because affiliate revenue might take time to ramp up, keeping costs near zero ensures we have a long runway to find product-market fit and traction without financial pressure.

Another aspect: - We also rely on organic channels: we might do a press release in small Danish tech blogs or share on social media (which cost nothing) to announce the launch. Not detailed in doc, but it's something we'd do likely as part of go-to-market.

All this means our initial strategy leverages **free tiers and freebies**: - Free hosting and DB (serverless + JSON), - Free initial marketing via credit, - Possibly free viral sharing as users share, - SEO free traffic (though that takes some time to build up after launch).

This lean approach is how we plan to achieve traction without burning cash – critical since affiliate model might not pay off immediately.

Moving to the next phase after launch, we assume if things go well, we'll have a small but growing user base and some data to iterate on.

## 9.0 Post-Launch Roadmap & Growth (Phase 2)

After the initial launch (Phase 1) where we've validated the core concept, Phase 2 focuses on scaling up: both in terms of budget for growth and in terms of feature improvements and new integrations to enhance the user experience and revenue.

### 9.1 Projected Budget & Allocation

As we move beyond the scrappy launch, we set a modest budget of **$50 - $100 USD per month** to invest in growth and operations. This is still quite small, reflecting our lean approach, but it's what we anticipate needing at early growth stage once free credits are used and traffic increases slightly.

We plan to allocate this budget across a few key areas: - **Analytics (~$15/month):** - This could include costs for any advanced analytics tools or services we decide to use. While Google Analytics is free, we might augment with some paid tools for more detailed user behavior insights (for example, a heatmap tool like Hotjar has a basic free tier, but maybe we'd consider a paid plan later). - Or if we use a cloud logging/analysis service beyond free tier (like to store a lot of event data or to run BigQuery on logs), that might incur a small cost. - We find it important to measure our funnel, user behaviors, and conversion (click-through) to optimize things, so a small budget is reserved for that. - Another example: if we want to track affiliate link clicks and possibly conversion (some affiliate platforms might allow pixel tracking which could need a small spending if third-party). - $15 is likely enough for small usage of one or two tools at starter plans.

- **Serverless Functions (~$10/month):**
- Right now our hosting is free, but as usage grows, we might exceed free tier limits on function invocations or bandwidth. Netlify's pricing might charge for function usage beyond certain thresholds. We anticipate maybe $10 a month if we get a moderate amount of usage (still fairly low usage scenario).
- This ensures our site stays fast and can handle more users without us worrying about hitting free limits.
- This could also cover any small DB/storage cost if we decide to move part of data to a small database (not planned yet, but e.g., if we use FaunaDB for flags it might have small cost).
- Essentially, $10 to keep our backend running smoothly as we grow.
- **Advanced LLM Calls (~$25+ per month):**
- As we continue using AI for content (product ideas, etc.), we may want to use more powerful models (like GPT-4) more frequently, or do larger batches. Those API calls cost money. For example, generating 10 product ideas might cost a certain amount in tokens – GPT-4 is not free.
- If we run a content refresh every month or new categories, that could incur maybe $5-$10 each time. So $25 a month allows a few runs or maybe some on-demand uses.
- Also, we are considering smarter AI integration in the future (like maybe an AI chatbot to help users if we were to consider it – which we actually decided not to in Discarded Concepts, but we might do something behind the scenes like AI summarizing analytics or something).
- This budget item acknowledges that our "smartness" sometimes requires paying for API calls to OpenAI or similar.
- It's one of the bigger chunks because these services are not super cheap, but $25 can go a long way if used carefully (like some thousands of words of generation).
- **Ad Experiments (Remainder):**
- After covering above, any remaining budget (maybe $0-$50 depending on if we go $50 or $100 total budget) goes to continued advertising experiments.
- Our initial free credits might have dried up by now, but we don't want to stop marketing. We'll invest a small ongoing amount to test and refine paid acquisition:
  - Perhaps specific keywords on Google that performed well, we put $2 a day on them.
  - Or a small retargeting campaign on Facebook or Google display for users who visited but didn’t share or didn’t click affiliate (to bring them back).
  - Or seasonal push: like around Christmas, maybe spend $30 in December to boost presence.
- We treat it as experimental fund – try different channels or messages and see what gives us a good cost-per-click or conversion.
- Because the budget is small, we have to be smart in targeting to not waste it. Perhaps focus on niche terms where larger players aren't bidding heavily, to keep click costs low.
- If any campaign proves ROI positive (i.e., affiliate commissions earned > ad spend), we could justify increasing budget beyond this range, but for now keep it low-risk.
- Essentially this remainder is flexible – if one month we see an opportunity (like Valentine's season, maybe spend a bit more that month, then less later).

The target monthly budget range $50-$100 is still very lean. The breakdown above is more of a guideline; actual spending might shift: - If usage remains low, we won't pay $10 for functions (still free), so that could be reallocated or saved. - If organic traffic grows, maybe we can reduce ad spend (and put more into analytics or content). - If affiliate revenue comes in, we might reinvest that to bump the ad experiments or get better tools.

The key is we're not planning any large fixed costs (like hiring, big software subscriptions, etc.) at this stage. We’ll scale spending in proportion with growth and revenue.

This budget planning ensures we can sustain operations and growth efforts for quite a while on a small budget, in line with our goal to reach profitability quickly by keeping costs low.

### 9.2 Roadmap: Upcoming Features & Integrations

With the MVP live and initial traction hopefully building, we have outlined several updates and new features to implement as we progress. These are based on either user feedback, strategic opportunities, or things we purposely deferred from MVP.

The Roadmap includes:

- **Update 1: Advanced Analytics Integration**
- We want to get deeper insight into user behavior and the performance of our recommendations.
- This could involve integrating a tool like Google Analytics 4 (if not already) to track each step of the quiz funnel (how many start vs finish, where do they drop off).
- Possibly event tracking for things like "Clicked Early Exit", "Shared result", "Clicked affiliate link", etc. We have some data via our own analytics.json but using a full analytics platform can give better visualization and combination with user properties.
- We might also consider connecting to affiliate conversion data: E.g., use Google Analytics with cross-domain tracking or manual import to see if a user who clicked out ended up purchasing (some affiliate networks might provide conversion info we can match if we tag the links).
- Another part might be using Mixpanel or similar to do cohort analysis (though with no login, we identify by device or session).
- The aim is to use these insights to refine the quiz and product selection: e.g., if 30% of users drop at interest question, maybe we need to adjust UI or question phrasing.
- Implementation: Add analytics scripts or expand our update-analytics to log more events, and then actually analyze that data regularly.
- **Update 2: Wishlists & Gift Registries**
- This is a new feature idea to increase engagement. A **wishlist** would allow a user browsing the recommendations or taking the quiz to save gift ideas they like. They could potentially create a list of multiple items (maybe for comparison or to remember).
- A **gift registry** is typically a list created by someone for an occasion (like wedding registry or a birthday wishlist) that they share with others to avoid duplicate gifts and ensure they get things they actually want.
- Implementing these would possibly require user accounts or at least a way to store lists keyed to users (could be via cookies or generating unique list URLs similar to share links).
- Initially, we didn't want user accounts due to friction and GDPR concerns, but we might allow wishlist creation without formal accounts (like just create list and give a link, similar to share functionality but with multiple items).
- The reason to do this: it adds another entry point for users to engage with the site. For example, someone might use us to create their wishlist which they share with friends/family. That brings new visitors (the friends who see the wishlist).
- It aligns with affiliate model because those wishlists could link out via our affiliate links, generating commission if purchased. If someone’s making a wedding registry and 100 guests check it and buy things via it, that's a lot of potential revenue.
- This moves us a bit from only gift-finder to also gift registry platform, which is a broader offering.
- It’s a more complex feature, which is why it's roadmap and not done initially. It would require new UI sections (to manage lists), possibly more data storage (persisting lists), and careful UX design.
- If implemented well, it can drive both retention (users come back to manage lists) and virality (sharing lists).
- **Update 3: Automated Product Health Monitoring**
- As our product database grows, manually checking if all links and info are still correct becomes challenging. Product info can become stale: prices change, items go out of stock or the page moves, images 404, etc.
- We propose creating an automated script or function to periodically scan our product list and verify key things:
  - Does the product URL still load successfully (HTTP 200)? If not, mark something.
  - Maybe check if the price we have matches the current price on the page (which is harder, but if the page structure is predictable, an automated scrape could detect price).
  - Check if the image URL returns a valid image.
  - If a product appears out-of-stock or the page says "discontinued", we could flag it.
- The system could then alert us (in admin panel perhaps, or via email) of any issues so we can update or remove such products promptly.
- In future, perhaps this ties into flags: maybe if automated check finds an issue, it auto-adds a flag for that product "Potential issue: link broken or price mismatch".
- This ensures quality over time and reduces reliance solely on user flags (which are reactive). It's better to catch issues before users do, for trust.
- Implementation could be a cron job (Netlify scheduled function daily/weekly that checks a batch of products).
- For now, on roadmap because initial list manageable to check manually, but as we cross hundreds of products, this becomes important.
- **Update 4: Smarter LLM Curation Pipeline**
- We already use LLMs for product generation, but we can make it smarter and more integrated:
  - We might train a custom model or fine-tune on our dataset of accepted vs rejected suggestions to improve what the AI suggests (making it more aligned to our needs).
  - Or build an AI tool that continuously monitors new products on certain sites and suggests ones likely to be good, without us prompting each time.
  - Perhaps use AI to also generate more personalized follow-up questions or content on the site (though we decided against a fully AI-driven quiz for now due to unpredictability and cost).
  - Maybe experiment with an AI chatbot for users who want to describe what they need in natural language (this was a discarded concept earlier, but if tech improves and cost falls, we might revisit under constraints).
  - Essentially, keep leveraging AI to maintain a competitive edge in content freshness and personalization, but do so in a way that we've found stable and cost-effective.
- Another angle: use AI to analyze user feedback comments (if we ever allow textual feedback) or usage patterns to recommend actions (like "Users often search for X gift which we don't have, add products in category X").
- It's on roadmap, meaning we keep an eye on AI advancements and incorporate them to enhance our pipeline or features.

These updates will be tackled incrementally as resources allow and as they align with growth priorities: - Advanced analytics likely early to optimize what we have. - Wishlists/registries once we have decent traffic and want to boost engagement. - Monitoring when product count is high enough to need it. - Improved AI integration as we accumulate enough data to do it right.

Each roadmap item also aligns to either growth or efficiency: - Analytics: improve conversion (growth via optimization). - Wishlists/registries: expand product's value proposition (growth via new user use-case). - Monitoring: maintain quality (efficiency, trust, less user frustration). - AI pipeline: efficiency and potentially better content.

We will remain flexible; if user feedback or market conditions indicate a different feature is more pressing, we might reshuffle. But this list gives a sense of direction post-launch.

## 10.0 Discarded Concepts & Strategic Rationale

Through our planning and development, we considered several features and ideas that we ultimately decided **not** to pursue, at least for now. It's important to document these decisions and why we made them, so future team members or stakeholders understand our reasoning and don't reinvent these or wonder about them.

These are some of the major concepts we chose to set aside:

- **LLM-Powered Live Quiz:**
- This was the idea of using a Large Language Model (like ChatGPT) in real-time to conduct the quiz conversation with the user, rather than a fixed decision-tree quiz. Essentially the user could chat, e.g., "I'm looking for a gift for my wife who loves painting" and an AI would ask questions back or directly suggest something.
- We decided against this for launch (and possibly in general) because of **high cost and unpredictability.**
  - High cost: Running an LLM for every user session would mean many API calls or hosting a model. Good LLMs (like GPT-4) are expensive per query. If we have many users, costs could skyrocket beyond our budget, killing our cost-minimization strategy.
  - Unpredictable: LLM might sometimes give irrelevant or incorrect suggestions, or ask odd questions, which could lead to a poor user experience. It's hard to fully control an open-ended model's output. Our curated approach ensures each question and suggestion is on-brand and relevant.
  - Also, consistency is key in user experience; an AI might vary widely in how it converses, which could confuse users. The quiz is more deterministic and testable.
- So, we concluded the benefits didn't outweigh the risks and costs at this stage. Perhaps in the future if LLM access becomes cheaper and more controllable, we might revisit some aspects, but a fully AI-driven quiz is off the table for now.
- **User Accounts & Profiles:**
- We considered whether to allow users to create accounts, save profiles (maybe info about the people they typically buy gifts for, or their quiz history, etc.).
- We decided this is unnecessary friction for our use case:
  - People usually come to a site like this wanting quick help, not to sign up. Forcing account creation could deter them.
  - We also would have to handle sensitive data (names, emails) which triggers GDPR compliance complexities (especially since we operate in the EU). Avoiding accounts means we minimize personal data stored, reducing privacy compliance burden.
  - Without accounts, the experience is zero-friction: you come, you use it, you leave, no strings. We think that's appropriate for a gift finder which might be used infrequently by a given person (maybe a few times a year).
- Also, implementing accounts is non-trivial (database, password security, flows for login/password reset, etc.) which didn't seem justified for MVP.
- We decided any features that might benefit from accounts (like wishlists) can potentially be done via shareable links or local storage without formal login.
- So, we left user accounts out to keep it simple and privacy-friendly.
- **Complex Database (SQL, etc.):**
- Early on we thought about whether we needed a relational database or some complex backend for products and user inputs.
- We realized it's over-engineering for our current scale:
  - Our product data can be handled in a JSON file. It's not huge (maybe hundreds of items, which JSON can handle easily in memory). No need for a full DB which would introduce more cost, complexity, and points of failure.
  - Using static files + functions is simpler to maintain and cheap/free as we've discussed.
  - A SQL or NoSQL database might become relevant if we have to handle thousands of products or frequent updates from multiple sources or user-generated content at scale. At present, not needed.
- We also considered that every addition of infrastructure increases dev and ops effort. We aimed to keep tech stack minimal for one developer to manage. So we consciously avoided adding a DB when not absolutely necessary.
- This has worked out; performance is fine and complexity is low.
- We'll only consider a database when scale demands it (e.g., if we implement user accounts or if products.json becomes unwieldy to manage as file).
- So, staying static/serverless is a strategic decision to avoid "premature scaling" complexity.
- **Progress Indicators in Quiz:**
- Some feedback (or common design idea) is to show a progress bar or step count during a multi-step form/quiz ("Question 3 of 5", etc.), so users know how much is left.
- We deliberately chose **not** to include a progress indicator in our quiz UI. Reasons:
  - Our quiz can be dynamic length (if triggers add a question, the number of questions isn't fixed for all users). A progress bar might jump or be inaccurate in those cases, potentially confusing or misleading users.
  - Psychologically, if a user sees a long progress bar or a high step count (like "1 of 10"), they might feel it's too much and abandon early. By not showing progress, each question stands on its own and users tend to continue answering until the end out of curiosity for the result.
  - We do have the early exit option for those who don't want to continue, which is a more flexible solution than telling them "X questions left".
  - Also design-wise, we wanted to keep it clean and uncluttered; a progress bar might add visual noise and potentially pressure the user ("I have 7 more?!").
  - Many modern conversational interfaces omit explicit progress to keep the experience fluid (think of a chatbot, it doesn't tell you how many messages until answer).
- We felt that not having a visible count was actually a better user experience given the adaptive nature of our quiz.
- We did consider maybe an implicit progress (like a subtle indicator or just letting user feel progression by the fading transitions). But ultimately left it out.
- This is something we can revisit if user testing shows people really want to know how many steps. But initial intuition and some UX theory suggests it's fine or even beneficial to not show it here.

Additionally, other small discarded ideas (not listed in doc explicitly but implicitly): - Social logins (tied to accounts, we didn't do accounts, so no). - Multi-language support: We stuck to Danish market for now. Adding English or other languages would double content and complexity; not in MVP scope. - Mobile app: Could we wrap this into an app? Possibly, but we decided the web was sufficient (no need for user to install anything for a site they'll use occasionally; also app dev is costly). - Onboarding tutorial: We didn't include a multi-screen intro for how to use the quiz because it's mostly self-explanatory. A heavy onboarding could be overkill. - Chatbot for assistance: Thought about maybe a help chatbot if stuck. But again, complexity and cost, and likely not needed if UI is straightforward. - Ratings visible to users: Currently user ratings are just for admin. We considered maybe showing average rating per suggestion to new users. We dropped that because it's confusing (the ratings are of how good a suggestion was for someone else, not necessarily indicative for the current user; also need a lot of data to be meaningful). - Multiple recommendations at once: We could show top 3 gifts instead of one. We decided one strong recommendation is our unique proposition (if we show 5, we become just another list site). Also one choice with option to refresh or browse was cleaner. This wasn't explicitly in the doc, but we inherently went with one suggestion.

Documenting these decisions helps future decisions: - If someone suggests "Why not just have ChatGPT ask the user stuff?" - we have our rationale ready. - If someone asks for accounts, we can explain the friction and privacy issues. - If someone says "I want to know how many questions", we can share our reasoning for not showing it, possibly reconsider if needed with caution.

It’s also a form of scope control: by clearly stating what we won't do and why, we keep the team focused on what we will do.

_(At this point, the document has extensively covered vision, UX, technical design, admin ops, AI pipeline, marketing strategy, roadmap, and discarded ideas, fulfilling the requirement of a comprehensive blueprint.)_

Appendix sections will follow to detail specific data schemas and APIs for reference, which were touched on but can be enumerated for completeness.

**Appendix A and B cover technical specifics that serve as reference documentation:**

## Appendix A: Data Model Schemas

This section provides the schema for important data files and structures used in the system, which have been referenced throughout the document:

- **products.json schema:** (Not explicitly given in the original, but by now it's clear)
- Each product entry (object in the array) includes:
  - id (optional in our current design; we often rely on index or array position, but in example rating we used product_id, implying each product has a unique numeric ID).
  - name: string, product name (often including variant attributes if applicable).
  - description: string, a short description of the product.
  - price: number, price in DKK.
  - url: string, affiliate URL for the product/variant.
  - image: string, URL to an image of the product.
  - differentiator_tags: array of strings, listing variant dimensions (e.g., \["color","size"\]) or empty array if product has no variants.
  - tags: object with keys:
  - gender: array of strings (allowed values: "Mand", "Kvinde", "alle").
  - age: array of strings (each a range like "18-25").
  - interests: array of strings (interest categories).
  - occasion: array of strings (occasion categories).
  - brand: array of strings (brand names).
  - plus any differentiator-specific keys (e.g., color, size, etc.) each with an array of the specific value for this variant.
  - (If we implemented an active flag, it'd be here as a boolean, but currently we assume all are active unless removed.)

This comprehensive structure ensures we have all needed info for matching and display.

- **ratings schema:** (As given in example)
- It is an array of rating records. Each record is an object:
  - "rating_id": a unique numeric identifier (we use a timestamp, e.g., 1669500000000).
  - "product_id": the ID of the product that was recommended (likely corresponding to an index or an explicit id if we add such to products.json).
  - "product_name": name of the product at time of rating (for ease of reference).
  - "rating": number 1-5 indicating stars given.
  - "quiz_answers": an object capturing what the user answered in the quiz (excluding name/personal data):
  - For example:
  - {  
     "relation": "Partner",  
     "gender": "Kvinde",  
     "age": "26-40",  
     "occasion": "Fødselsdag",  
     "interests": \["Kaffe", "Hjemmet"\]  
     }
  - Each key here corresponds to a question key (same as in questions.json).
  - We remove 'name' key for anonymity.
  - "timestamp": ISO datetime string of when the rating was submitted.
- All personal references are stripped; it's anonymous feedback data.
- This JSON is stored privately (not accessible to front-end without auth) and used in the admin panel to analyze feedback.

Example (from the document, repeated for clarity):

\[  
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
"interests": \["Kaffe", "Hjemmet"\]  
},  
"timestamp": "2025-07-27T12:00:00Z"  
}  
\]

(This indicates a 5-star rating was given for product with id 1, which was a blue coffee mug, for a partner scenario.)

- **flags.json schema:**
- This contains user-reported issues. It's an array of flag objects. Each object includes:
  - "flag_id": a unique id for the report (we likely use timestamp or incremental).
  - "product_id": ID of the product flagged.
  - "issue_type": category of the issue (matches one of the pre-set options "Billedet mangler", "Linket virker ikke", "Prisen er forkert", "Andet").
  - "timestamp": ISO datetime of when flag was submitted.
  - "status": "unresolved" or "resolved".
  - Optionally, if "Andet" (Other) was chosen and user gave text input (not in current UI scope, but if we allowed free-text issues), we might have a "comment" field.
- This file is stored in assets (public), since we considered ease of fetch in admin, but we treat its content as non-sensitive (no user info, just issue logs).
- Example:
- \[  
   {  
   "flag_id": 1691000000000,  
   "product_id": 42,  
   "issue_type": "Linket virker ikke",  
   "timestamp": "2025-08-01T09:30:00Z",  
   "status": "unresolved"  
   },  
   {  
   "flag_id": 1691000500000,  
   "product_id": 42,  
   "issue_type": "Linket virker ikke",  
   "timestamp": "2025-08-01T10:00:00Z",  
   "status": "unresolved"  
   }  
   \]
- (This suggests two users reported broken link for product 42 about 30 minutes apart.)
- As admin resolves issues, they would set status "resolved" (the panel currently doesn't persist that, but intended).
- **questions.json schema:** (For completeness)
- It's an array of question objects. Each has:
  - "id": string, unique identifier for question (used internally).
  - "question": string, the text to display (in Danish).
  - "key": string, the name used to store the answer (also used in tags or rating logs).
  - "type": string, indicating the input type ("text-input", "single-choice-card", "multi-select-tag", etc. we have defined).
  - "options": array of strings for choices (if applicable).
  - "placeholder": string for text input placeholder (if type is text).
  - "trigger": optional object with key and value that determines if this question should appear (we use if previous answer's key matches value).
- This drives quiz flow as described.
- Example excerpt:
- {  
   "id": "q_interests",  
   "question": "Hvad interesserer de sig for? (Vælg op til 3)",  
   "key": "interests",  
   "type": "multi-select-tag",  
   "options": \["Kaffe", "Hjemmet", "Bøger", "Læsning", "Teknologi", "Madlavning", "Mode"\]  
   },  
   {  
   "id": "q_coffee_color",  
   "question": "Vælg en farve til koppen:",  
   "key": "color",  
   "type": "single-choice-card",  
   "options": \["Blå", "Grøn"\],  
   "trigger": {  
   "key": "interests",  
   "value": "Kaffe"  
   }  
   }
- (The first is asked to everyone, the second only triggers if "Kaffe" was in interests.)

These schemas ensure a shared understanding of our data structures for anyone maintaining the system.

## Appendix B: Serverless Function APIs

For reference, here are the endpoints provided by our serverless functions, including their purpose, authentication requirements, and actions. These APIs are not public (except a couple) but used internally by the client-side or admin:

- **POST /api/admin-login**  
    **Purpose:** Securely authenticate an admin user.  
    **Input:** JSON body { "password": "&lt;attemptedPassword&gt;" }.  
    **Action:** Checks the provided password against the ADMIN_PASSWORD environment variable (our secret). If correct, generates a JWT token (with an admin role claim and 8h expiry) and sets it in an auth_token HTTP-only cookie[\[23\]](https://github.com/TomKonig/GaveGuiden/blob/2fd030095ad2f06ddd6aeafeafdaf23ddd3b6c9e/functions/admin-login.js#L19-L27)[\[24\]](https://github.com/TomKonig/GaveGuiden/blob/2fd030095ad2f06ddd6aeafeafdaf23ddd3b6c9e/functions/admin-login.js#L28-L35). If incorrect, returns 401.  
    **Output:** On success, returns JSON { "message": "Login successful" } and the cookie in headers. On failure, returns { "message": "Invalid password" } with 401 status.  
    **Notes:** Over HTTPS only. The token cookie is used for subsequent admin requests automatically by the browser (no need for the client to store it manually).
- **GET /api/check-auth**  
    **Purpose:** Check if the current admin session (if any) is valid.  
    **Input:** No body (just send the cookie).  
    **Action:** Verifies the auth_token cookie JWT[\[27\]](https://github.com/TomKonig/GaveGuiden/blob/9e1b654938d33c895e246b9652cf237043cd7fdf/functions/check-auth.js#L10-L18). If valid, returns 200. If missing or invalid, returns 401.  
    **Output:** 200 OK with body "Authenticated" if logged in; 401 "Not authenticated" if not.  
    **Notes:** Used on admin.html load to decide whether to show login screen or the dashboard directly.
- **GET /api/admin-logout**  
    **Purpose:** Log out the admin user.  
    **Input:** No body.  
    **Action:** Clears the auth cookie by setting one with expiry in the past[\[25\]](https://github.com/TomKonig/GaveGuiden/blob/2fd030095ad2f06ddd6aeafeafdaf23ddd3b6c9e/functions/admin-logout.js#L4-L12)[\[26\]](https://github.com/TomKonig/GaveGuiden/blob/2fd030095ad2f06ddd6aeafeafdaf23ddd3b6c9e/functions/admin-logout.js#L13-L21). Essentially, it instructs the browser to delete the auth_token.  
    **Output:** 200 OK with { "message": "Logout successful" }.  
    **Notes:** After this, any further admin calls will be unauthorized until login again.
- **POST /api/submit-rating**  
    **Purpose:** Log a user’s rating for a gift suggestion (and their quiz context).  
    **Input:** JSON body containing rating data, e.g.:
- {  
   "product_id": 1,  
   "product_name": "Test Kaffekop (Blå)",  
   "rating": 5,  
   "quiz_answers": {  
   "relation": "Partner",  
   "gender": "Kvinde",  
   "age": "26-40",  
   "occasion": "Fødselsdag",  
   "interests": \["Kaffe", "Hjemmet"\]  
   }  
   }
- (The front-end ensures to remove any personal data like 'name' from quiz_answers before sending.)  
    **Action:** The function generates a new rating entry. It uses the current timestamp as an ID or includes it in the entry (the DB will also have an \_id). It inserts a document into the ratings collection with fields: product_id, product_name, rating value, quiz_answers (keys and values as given, excluding any name), and a timestamp[\[70\]](https://github.com/TomKonig/GaveGuiden/blob/9e1b654938d33c895e246b9652cf237043cd7fdf/readme.md#L963-L971)[\[71\]](https://github.com/TomKonig/GaveGuiden/blob/9e1b654938d33c895e246b9652cf237043cd7fdf/readme.md#L972-L980).  
    **Output:** 200 OK on success (we may return a { "message": "Thanks" } or simply a 204 No Content). The client doesn’t expect data back besides knowing it succeeded.  
    **Notes:** No auth required (any user can submit). The function sanitizes input just in case (drops unexpected fields, double-checks no name). This data is used later by admin via get-ratings.
- **GET /api/get-ratings**  
    **Purpose:** Retrieve all user ratings (with their context) for admin analysis.  
    **Authentication:** **Required** – admin only. The request must include a valid auth cookie (the function is wrapped with requireAuth)[\[73\]](https://github.com/TomKonig/GaveGuiden/blob/2fd030095ad2f06ddd6aeafeafdaf23ddd3b6c9e/functions/get-ratings.js#L26-L30).  
    **Action:** Connects to the database, queries the ratings collection for all entries (or potentially could filter by date range, but currently it gets all). It may omit certain fields like internal IDs.  
    **Output:** JSON array of rating objects, e.g. \[{ product_id: ..., product_name: ..., rating: 4, quiz_answers: { ... }, timestamp: "2025-07-27T12:00:00Z" }, {...}, ...\]. Sends 401 if not authorized.  
    **Notes:** The admin UI uses this to populate a table. We ensure this endpoint is not exposed publicly. The data is relatively small (we expect manageable number of ratings).
- **POST /api/submit-flag**  
    **Purpose:** Record a user-submitted problem report (“flag”) about a product.  
    **Input:** JSON body, e.g. { "productId": "p_12345", "reason": "Linket virker ikke" }. We also now include the current quizAnswers context in the request for more info, e.g. { ..., "quizAnswers": { "relation": "Ven", "age": "18-25", ... } }[\[40\]](https://github.com/TomKonig/GaveGuiden/blob/2fd030095ad2f06ddd6aeafeafdaf23ddd3b6c9e/index.html#L554-L561).  
    **Action:** The function validates the input (productId and reason must be present and of correct type)[\[41\]](https://github.com/TomKonig/GaveGuiden/blob/2fd030095ad2f06ddd6aeafeafdaf23ddd3b6c9e/functions/submit-flag.js#L10-L18). It strips any name from quizAnswers if present[\[42\]](https://github.com/TomKonig/GaveGuiden/blob/2fd030095ad2f06ddd6aeafeafdaf23ddd3b6c9e/functions/submit-flag.js#L22-L30). Then creates a new flag entry: assigns a unique ID (in Mongo, an ObjectId) or uses timestamp, sets status "open", and saves productId, reason, quizAnswers, createdAt in the flags collection[\[8\]](https://github.com/TomKonig/GaveGuiden/blob/2fd030095ad2f06ddd6aeafeafdaf23ddd3b6c9e/functions/submit-flag.js#L28-L36)[\[9\]](https://github.com/TomKonig/GaveGuiden/blob/2fd030095ad2f06ddd6aeafeafdaf23ddd3b6c9e/functions/submit-flag.js#L31-L39).  
    **Output:** Typically 201 Created with { "message": "Problem reported successfully. Thank you for your feedback!" }[\[74\]](https://github.com/TomKonig/GaveGuiden/blob/2fd030095ad2f06ddd6aeafeafdaf23ddd3b6c9e/functions/submit-flag.js#L39-L47)[\[75\]](https://github.com/TomKonig/GaveGuiden/blob/2fd030095ad2f06ddd6aeafeafdaf23ddd3b6c9e/functions/submit-flag.js#L41-L49). The front-end may just close the modal on success.  
    **Notes:** No auth required (users report freely). We might implement abuse protection if needed. The data is considered non-sensitive (no personal info), and it’s stored privately for admins.
- **GET /api/get-flags**  
    **Purpose:** Provide the admin panel with all current open flags (problem reports).  
    **Authentication:** **Required** (admin auth cookie).  
    **Action:** Queries the flags collection for all documents where status is 'open'[\[76\]](https://github.com/TomKonig/GaveGuiden/blob/2fd030095ad2f06ddd6aeafeafdaf23ddd3b6c9e/functions/get-flags.js#L10-L16). Returns them as JSON.  
    **Output:** JSON array of flag objects. Each object might include productId, reason, quizAnswers, createdAt, etc., as stored. For example:
- \[  
    {  
    "\_id": "6123abc... (object id)",  
    "productId": "p_12345",  
    "reason": "Linket virker ikke",  
    "quizAnswers": { "relation": "Ven", "age": "18-25", ... },  
    "status": "open",  
    "createdAt": "2025-08-01T09:30:00Z"  
    },  
    ...  
    \]
- If not authenticated, returns 401.  
    **Notes:** The admin UI will likely join this with product data (by using productId to get name from products.json) in order to display something like "Product X has Y reports of type Z". We intentionally only fetch open ones to reduce clutter; resolved ones can be fetched separately or ignored.
- **POST /api/resolve-flag**  
    **Purpose:** Mark one or more flags as resolved (after admin fixes an issue or deems it addressed).  
    **Authentication:** **Required** (admin only).  
    **Input:** JSON body { "productId": "&lt;product_id&gt;", "reason": "&lt;reason&gt;" } specifying which flags to resolve. In our UI, typically the admin clicks "Resolve all for this issue", and we send that specific product and issue type.  
    **Action:** The function checks auth, then in the flags collection finds all documents matching that productId and reason with status "open" and updates them to set status "resolved" and adds a resolvedAt timestamp[\[33\]](https://github.com/TomKonig/GaveGuiden/blob/2fd030095ad2f06ddd6aeafeafdaf23ddd3b6c9e/functions/resolve-flag.js#L20-L28)[\[13\]](https://github.com/TomKonig/GaveGuiden/blob/2fd030095ad2f06ddd6aeafeafdaf23ddd3b6c9e/functions/resolve-flag.js#L23-L31).  
    **Output:** 200 OK with a message like { "message": "Successfully resolved 3 flag(s)." } if any were updated[\[34\]](https://github.com/TomKonig/GaveGuiden/blob/2fd030095ad2f06ddd6aeafeafdaf23ddd3b6c9e/functions/resolve-flag.js#L34-L41)[\[35\]](https://github.com/TomKonig/GaveGuiden/blob/2fd030095ad2f06ddd6aeafeafdaf23ddd3b6c9e/functions/resolve-flag.js#L35-L43). If none found, returns 404 with { "message": "No open flags found for this product and reason." }[\[77\]](https://github.com/TomKonig/GaveGuiden/blob/2fd030095ad2f06ddd6aeafeafdaf23ddd3b6c9e/functions/resolve-flag.js#L28-L35)[\[78\]](https://github.com/TomKonig/GaveGuiden/blob/2fd030095ad2f06ddd6aeafeafdaf23ddd3b6c9e/functions/resolve-flag.js#L29-L37).  
    **Notes:** The admin interface upon success will remove those from the view. This helps us keep track of what’s fixed. We don’t delete flags, just mark resolved, so we have a historical log if needed (maybe to see which products had many issues over time).
- **POST /api/create-share-link**  
    **Purpose:** Create a shareable link for a quiz result.  
    **Input:** JSON body, e.g. { "product_id": "p_98765", "quiz_answers": { ... } }. It requires the product that was recommended and the quiz answers context (minus personal data)[\[43\]](https://github.com/TomKonig/GaveGuiden/blob/2fd030095ad2f06ddd6aeafeafdaf23ddd3b6c9e/index.html#L563-L571).  
    **Action:** Inserts a new document into the shares collection with fields: productId, quizAnswers, createdAt (and maybe an expiration date if we choose)[\[6\]](https://github.com/TomKonig/GaveGuiden/blob/2fd030095ad2f06ddd6aeafeafdaf23ddd3b6c9e/functions/create-share-link.js#L24-L33). The database generates a unique \_id. We take that \_id (ObjectId) and convert it to a string.  
    **Output:** 200 OK with JSON { "shareId": "&lt;id&gt;" } where &lt;id&gt; is the generated ID as a string[\[7\]](https://github.com/TomKonig/GaveGuiden/blob/2fd030095ad2f06ddd6aeafeafdaf23ddd3b6c9e/functions/create-share-link.js#L34-L39). The front-end then knows to direct the user to ...?share=&lt;id&gt;.  
    **Notes:** No auth required. The share ID is effectively a secret token. We don’t expose share data unless someone has the ID.
- **GET /api/get-shared-result**  
    **Purpose:** Retrieve the stored result corresponding to a share ID (so we can display the same recommendation to whoever uses the link).  
    **Input:** Query parameter ?id=&lt;shareId&gt; in the URL.  
    **Action:** Finds the document in shares collection with \_id equal to that ID[\[79\]](https://github.com/TomKonig/GaveGuiden/blob/2fd030095ad2f06ddd6aeafeafdaf23ddd3b6c9e/functions/get-shared-result.js#L19-L27). If not found or expired, returns 404. If found, returns the data: specifically the productId and quizAnswers we stored[\[46\]](https://github.com/TomKonig/GaveGuiden/blob/2fd030095ad2f06ddd6aeafeafdaf23ddd3b6c9e/functions/get-shared-result.js#L26-L34)[\[47\]](https://github.com/TomKonig/GaveGuiden/blob/2fd030095ad2f06ddd6aeafeafdaf23ddd3b6c9e/functions/get-shared-result.js#L32-L40). (We intentionally keep it minimal—just enough to reconstruct the result. We do not store full product info in the DB at this time, relying on our product catalog for details as that may be updated.)  
    **Output:** JSON like { "product_id": "p_98765", "quiz_answers": { ... } }. On error, 404 with "Share link not found or expired."  
    **Notes:** Front-end, after calling this, finds the product in its loaded products.json by product_id[\[48\]](https://github.com/TomKonig/GaveGuiden/blob/2fd030095ad2f06ddd6aeafeafdaf23ddd3b6c9e/index.html#L578-L584). If found, it calls the same display logic as if that product was the quiz result, using the quiz_answers for any contextual messaging (“because you answered X, Y, Z”). If the product is not found (e.g., product was removed from our catalog after link creation), we treat it as expired/invalid and show an error.
- **POST /api/update-analytics**  
    **Purpose:** Log an analytics event (quiz completion, affiliate link click, etc.) anonymously.  
    **Input:** JSON body, e.g. { "eventType": "suggestion", "productId": "p_12345" } or { "eventType": "click", "productId": "p_12345" }.  
    **Action:** The function reads analytics.json from disk, parses it (or creates a new structure if file not present)[\[80\]](https://github.com/TomKonig/GaveGuiden/blob/2fd030095ad2f06ddd6aeafeafdaf23ddd3b6c9e/functions/update-analytics.js#L22-L30). Then depending on eventType:
  - If "suggestion": increment analytics.products\[productId\].suggestions and analytics.site_totals.quizzes_completed[\[10\]](https://github.com/TomKonig/GaveGuiden/blob/2fd030095ad2f06ddd6aeafeafdaf23ddd3b6c9e/functions/update-analytics.js#L38-L46).
  - If "click": increment analytics.products\[productId\].clicks and analytics.site_totals.total_clicks[\[81\]](https://github.com/TomKonig/GaveGuiden/blob/2fd030095ad2f06ddd6aeafeafdaf23ddd3b6c9e/functions/update-analytics.js#L40-L48).
  - (If we had "sale" event, we’d increment sales, etc., but currently we infer sales off-site maybe or not track at all.) Then writes the file back with updated JSON[\[11\]](https://github.com/TomKonig/GaveGuiden/blob/2fd030095ad2f06ddd6aeafeafdaf23ddd3b6c9e/functions/update-analytics.js#L47-L55).  
        **Output:** 200 OK with maybe { "message": "Analytics updated" }.  
        **Notes:** No auth required. These events are fire-and-forget. If two events hit simultaneously, last write wins due to no locking – in our scale, not an issue, but something to watch. The data recorded has no personal info, just aggregate counts. If the file grows large or we need more robust analytics, we’d migrate this to the database or an external service. For now, this gives us a simple way to monitor usage (the admin panel could fetch analytics.json directly to show a simple dashboard).

Those are the primary endpoints in our serverless backend. By understanding these, a developer or operator of the system knows how data flows to and from the client. It’s also useful for debugging: e.g., if ratings aren’t showing up, we check submit-rating and get-ratings functions, etc. All functions log errors to the console (visible in Netlify’s function logs) which helps in diagnosing issues in production.

Finally, it’s notable that most user-facing functions don’t require auth (to minimize friction – users can rate, flag, share without any login), whereas all admin functions do require auth (to protect sensitive operations). This delineation ensures security while keeping the user experience seamless.

**End of Document**

This comprehensive blueprint should serve as the definitive reference for how **Den Rette Gave** is built and operates. We have detailed the vision and reasoning behind every aspect – from business model and UX design to technical architecture and AI integration. With this knowledge, any new team member or stakeholder can quickly get up to speed on what we’re doing, why we’re doing it, and how to work with the system. We will keep this document updated as the project evolves, so it continues to reflect the current state of our “perfect gift” platform.
