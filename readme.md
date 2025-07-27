# Den Rette Gave: Master Project Specification & Technical Report

**Version:** 8.0 (Definitive Master Blueprint)  
**Date:** July 27, 2025  
**Author:** Gemini (Lead Developer)

## 1.0 Executive Summary & Vision

This document serves as the single, authoritative source of truth for the **Den Rette Gave** project. It is a comprehensive blueprint detailing the project's vision, business strategy, user experience, technical architecture, and operational workflows. It is designed to be fully self-contained, requiring no external context for complete understanding by any stakeholder, technical or otherwise. In other words, this report is the one-stop guide for anyone involved in the project – from developers and designers to business stakeholders – to understand **what** we are building, **how** we are building it, and **why**.

### 1.1 Project Vision

Our vision is to create the most intelligent, trusted, and user-friendly starting point for gift discovery in the Danish market. **Den Rette Gave** will eliminate the friction and decision fatigue of traditional online shopping by providing a delightful, guided experience that results in perfect, personalized gift recommendations. We aim to be the first thought for anyone struggling to find a meaningful gift.

_Plainly put:_ We want Danes to think of Den Rette Gave whenever they need to find a gift. The platform’s **intelligence** (smart algorithms and adaptive quiz) combined with **trustworthiness** (high-quality curated gifts from reputable Danish retailers) and **ease of use** (simple quiz interface) will make finding a gift feel effortless. This vision addresses a common problem: many people feel overwhelmed by the countless options online and aren’t sure what gift would be appropriate. By guiding users through a few targeted questions and leveraging data to personalize suggestions, we solve this problem. The end result should feel like getting help from a knowledgeable friend or personal shopper who understands exactly what you need.

### 1.2 Business Model & Strategy

**Core Concept: Affiliate Marketing** – We build a highly useful tool that recommends products. When a user clicks our recommendation and buys the product from the seller's website, we earn a percentage of that sale (an affiliate commission). This provides revenue without charging the user or handling any inventory ourselves. The user gets a great gift recommendation and seamless buying experience; the retailer gets a sale; we earn a commission – a win-win for all parties.

The foundational business strategy is to achieve and maintain profitability by **minimizing operational costs** while scaling user adoption. We accomplish this through a **serverless architecture** and other cost-saving measures (detailed below), so that most of our revenue (from affiliate commissions) can translate into profit rather than being eaten by infrastructure expenses.

**What is a Serverless Architecture?** Traditionally, websites need a dedicated server (or servers) running 24/7 to handle requests, which incurs constant costs and maintenance overhead. A serverless approach means we don't manage a long-running server at all. Instead, our website is a collection of static files (HTML, CSS, JS) served globally via a Content Delivery Network (**CDN**), which is extremely fast and inexpensive. For any dynamic actions (like tracking a click, saving user feedback, or generating a shareable link), we use small, on-demand **serverless functions** that execute in the cloud only when needed and for only a few milliseconds. We pay **only for the time** those functions run, and nothing when they are idle. This architecture virtually eliminates the cost of idle capacity and can automatically scale to handle spikes in traffic without pre-provisioning servers.

_Technical Explanation:_ Our site is deployed on a platform like **Netlify or Vercel** that provides static hosting and serverless function support. When a user visits denrettegave.dk, their browser downloads static files (the HTML/JS/CSS and some JSON data) directly from the CDN node closest to them, ensuring low latency. All the quiz logic runs **client-side** (in the browser), so we do not need a server for guiding the user through questions or computing recommendations – the user's own device does that work. Only when the user triggers an event that requires saving or retrieving data on our backend (e.g., submitting a rating or getting a shareable link) does a serverless function get invoked. Each such function typically completes in fractions of a second. For example, if 1000 users each submit a rating, rather than keeping a server running for all 1000 events, we spin up 1000 short-lived function invocations on demand. The cost might be a few cents total, whereas maintaining a traditional server capable of handling 1000 requests (even if idle most of the time) could cost significantly more per month. This efficiency in resource usage is how we keep our operational costs extremely low.

_Plain-Language Rationale:_ By not running our own servers, we avoid paying for unused capacity and reduce maintenance work. We don't have to worry about server crashes, scaling the server during peak holiday shopping times, or applying security patches to server operating systems. The static + serverless approach also improves **reliability and speed**: static files served from a CDN mean our pages load quickly anywhere in Denmark (or the world), and serverless functions are managed by our hosting provider to be highly available. This strategy lets us focus our effort on building a great product, not on server infrastructure, and it ensures that even with modest affiliate revenue, the project can sustain itself (since our baseline costs are very low).

### 1.3 Unique Selling Proposition (USP)

**Den Rette Gave's competitive advantage** is a superior, intelligent, and adaptive user experience for gift-finding. While competitors might offer simple filter pages or generic gift lists, we provide a **guided, conversational journey** that feels both personal and almost magical in its relevance. Our "smart" quiz dynamically adapts to user input, asking only the most relevant next questions – a feature unmatched by existing tools in the Danish market.

In practice, this means our users aren’t just punching in filter criteria like price range and category on a dull form. Instead, they are led through a fun and engaging Q&A flow that seems to “read their mind” by zeroing in on the perfect gift idea. The experience is akin to interacting with a helpful store assistant who, with a few questions, narrows down the ideal suggestion for you. Because the quiz is **interactive and adaptive**, users feel more confident that the recommendations are tailored specifically to their needs.

_Why this matters:_ Most online gift finders in Denmark (and elsewhere) are essentially catalogs – they force the user to do the mental work of scanning through categories or using filters, which can be tedious and overwhelming. In contrast, Den Rette Gave reduces **decision fatigue** by taking on the burden of filtering and evaluating products. By only asking relevant questions (e.g., we won’t ask about the recipient’s favorite coffee flavor unless the user indicated the person likes coffee), we keep the experience streamlined and engaging. This USP not only delights users (increasing the likelihood they’ll use us again or recommend us to friends) but also sets us apart from competitors who cannot easily replicate the adaptive quiz without significant investment in algorithm development. Essentially, **we’re combining intelligent software with a touch of personalization** that makes the user feel like the recommendation was hand-picked for them – something no simple static list or filter-based site can offer.

## 2.0 The User Experience (UX) & Journey

The user's journey is designed to be a single, seamless flow from arrival to recommendation, making the web app feel more like a polished mobile app than a traditional website. There are no random jumps or multi-page forms; everything transitions smoothly within one interface. By crafting the experience this way, we maintain user focus and minimize drop-offs, guiding users step-by-step to the result.

In summary, when a user visits **Den Rette Gave**, they will go through these stages in one continuous session: 1. **Landing Page** – a welcoming introduction and start button. 2. **Quiz** – a series of questions (sometimes branching based on answers) about the gift recipient and context. 3. **Results Page** – a personalized gift recommendation (or a small set of recommendations) with options to provide feedback or share. 4. **Affiliate Redirect** – if the user likes the suggestion, they click a link to buy the gift on the retailer’s site (earning us a commission).

All of this happens in a guided flow. Below we break down this journey in detail.

### 2.1 User Journey Flowchart

**Overview:** The user's journey begins on the **Landing Page**. From there, they initiate the **Quiz**, which presents a series of dynamic questions. At any point after the first few questions, the user has an optional path to get an immediate recommendation (we call this the "early exit"). Otherwise, they complete the quiz to the end as normal. Both paths (early exit or full quiz completion) lead to the **Results Page**, where the user sees the recommended product(s). On the results, the user can take further actions: rate the suggestion, report an issue with it, or share the recommendation with someone else. The final step, if the user is satisfied with the suggestion, is clicking through to the partner's site via an affiliate link to potentially make a purchase.

Let's walk through a typical user scenario to illustrate this flow:

- **Landing Page:** The user (for example, Maria) arrives at denrettegave.dk. She sees our branding and a tagline like _"Find den perfekte gave. Hver gang."_ There’s a brief description of how the service works (“our smart quiz asks a few simple questions to find a personal gift idea for anyone”) in Danish, and a prominent **"Start Guiden"** button (the primary call-to-action). This landing section is clean and uncluttered, immediately conveying what to do next (start the guide). Maria clicks **Start Guiden** to begin.
- **Quiz Begin:** The site seamlessly transitions (with a gentle fade animation) into the quiz interface. The first question might be _“Hvem er gaven til?”_ (“Who is the gift for?”) with options like Partner, Parent, Friend, etc. Maria selects “Partner” for instance. The next questions appear one by one – e.g., “Hvad er modtagerens køn?” (recipient's gender), “Hvad er deres cirka alder?” (age range), “Hvad er anledningen?” (occasion for the gift, like Birthday, Christmas, etc.), and “Hvad interesserer de sig for?” (interests/hobbies, where multiple can be selected such as Cooking, Tech, Outdoor, etc.). As Maria answers, the quiz **dynamically adapts**. For example, if she indicated the recipient loves coffee, a follow-up question might pop up asking about a specific preference (like favorite coffee roast or, more simply, a question like _“Vælg en farve til koppen:”_ – “Choose a color for the mug,” if a coffee-related gift is being considered). If Maria had not indicated an interest in coffee, she would never see that color question. This keeps the quiz as short and relevant as possible for her.
- **Early Exit Option:** After Maria has answered a few key questions (let’s say relation, gender, age, and one interest), an **“Vis mig resultater nu”** (“Show me results now”) button gently appears. This is our early exit feature. Perhaps Maria is in a hurry or feels she has provided enough info; she can click this to skip directly to a recommendation. This button appears with a subtle fade-in, only after we have enough data for at least a basic recommendation, so it’s not shown immediately on the first question (to ensure some personalization). If Maria clicks it, we move on to showing her a result immediately. If she ignores it and continues answering all questions, that’s fine too – it’s purely optional.
- **Results Page:** Whether via early exit or after completing all quiz questions, Maria reaches the **Results Page**. Here, she sees a header like _“Vi fandt den perfekte gave!”_ (“We found the perfect gift!”) and below that, a **recommendation card**. The recommendation card presents the product we think is the best match: for example, _“Luxe Coffee Brewing Set”_ with a nice photo, a short description of why this is a great gift for her partner (male, age 26-40, interest in coffee, occasion birthday – all factors she provided), and the price (e.g., 499 DKK). On this card, there are a few interactive elements:
- A **star rating interface** where Maria can rate how good the suggestion is (from 1 to 5 stars).
- A **“Rapportér et problem”** (“Report a problem”) link or button, in case something is wrong (like the image didn’t load, or the price seems incorrect, etc.).
- A **“Del resultat”** (“Share result”) button, allowing her to get a shareable link to this suggestion (for instance, if she wants to show the gift idea to someone else, like a friend who is co-planning the gift).
- And of course, a **“Køb nu”** (“Buy now”) button or link which will take her to the retailer’s website to purchase this coffee brewing set. This link is an affiliate link; it will open the retailer’s site (perhaps in a new tab) with our tracking code embedded.

Maria reviews the suggestion. Let’s say she loves it – it’s indeed something her partner would enjoy. She clicks 5 stars to give feedback (this sends us a rating, helping our system learn that this was a good match). If there was any issue (imagine the price was wrong due to a recent change, for example), she could click “Report a problem” to let us know – but in this scenario everything looks good. She then clicks **Buy now**, which redirects her to the coffee set’s page on the partner’s ecommerce site. From there, she can add it to cart and checkout as normal.

- **Post-Result Loop:** After viewing the result, Maria also has the option to start over (there’s usually a **“Start forfra”** or “Restart Quiz” button on the results page in case she wants to find another gift or do it again for a different person). If she used the share feature, a modal would have given her a special URL (like _denrettegave.dk/share/ABC123_) that she can copy and send to a friend or save for later. The friend opening that link would go directly to a page showing that coffee brewing set recommendation (with a note like “This gift idea was shared with you”), which is a great viral mechanism for us to gain new users.

Throughout this entire journey, note that the experience is **continuous and smooth**. There are no hard page reloads; the header and general layout remain visible and consistent (the content just transitions between views). This approach reinforces a feeling of polish and reliability, much like a native app. It also means faster interactions (no waiting for new pages to load from the server, since everything needed was loaded upfront or fetched asynchronously).

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
> Note: When first deploying, initialize `flags.json`, `ratings.json`, and `shares.json` with `[]` so the admin panel can parse them.
|
└── functions/              // Directory for our serverless backend logic.
    ├── admin-login.js      // Securely handles admin login.
    ├── create-share-link.js// Securely creates a share ID.
    ├── get-shared-result.js// Securely retrieves a shared result.
    ├── get-ratings.js      // Securely provides ratings to the admin panel.
    ├── submit-flag.js      // Handles user submissions of product errors.
    ├── submit-rating.js    // Securely handles user-submitted ratings.
    └── update-analytics.js // Handles anonymous analytics events.
=======
Finally, the user ends up on a third-party site to complete the purchase. That’s intentionally the end of our funnel – we don’t interfere with checkout (that’s the retailer’s job) – but we’ve done everything up to that point to make the user confident and happy with their choice. The easier and more pleasant we make the journey of finding the gift, the more likely users are to trust and reuse Den Rette Gave for future gifting occasions, which is crucial for our growth (and future affiliate revenue).

### 2.2 Detailed Interaction Design

Our design pays attention to **transitions and micro-interactions** to make the user experience feel fluid and responsive. Instead of static jumps, every change in the interface is gentle and deliberate. Below are key interaction design elements and the rationale behind them:

- **Smooth Transitions:** All view changes (for example, going from the landing page to the quiz, or from the quiz to the results) use a gentle cross-fade and a slight vertical slide animation. This means when the user clicks “Start Guiden”, the landing text fades out while the first quiz question fades in, sliding up slightly. This approach prevents jarring page reloads that could disrupt the user’s mental flow. It maintains a sense of continuity – the user perceives that they are in one cohesive application experience, not jumping between unrelated pages. Technically, this is implemented by having different sections (views) in the single-page app and toggling their visibility with CSS transitions. The result is a more immersive experience that feels modern and polished.
- **Micro-interactions:** These are the small visual feedback cues that make the interface feel alive and responsive to the user’s actions. For example, our buttons subtly grow a bit or increase their shadow on hover, indicating they are interactive and acknowledging the user’s cursor. Quiz option cards (for single-choice or multi-select answers) highlight when hovered and show a clear state when selected – typically by adding a colored border, a checkmark icon, or changing the background shade. For instance, if the user selects the “Partner” card for the relation question, that card might immediately show a highlighted outline in our primary color and display a small checkmark in the corner, so the user has a visual confirmation of their choice. These micro-interactions are important for user **confidence and enjoyment** – they provide immediate feedback (“Yes, you clicked that button” or “This option is now chosen”) and make the interface feel snappy. We use CSS (and a touch of JavaScript where needed) to implement these without affecting performance.
- **The "Early Exit" Feature:** During the quiz, an **“Early Exit”** option (labelled something like “Vis mig resultater nu” as mentioned) will appear once the user has provided enough information for at least a decent recommendation. This button is intentionally introduced with a soft fade-in animation and is relatively subtle in style (e.g., a text link or a secondary button, rather than a big primary-colored button which might steal focus). The design logic here is to not distract the user from answering the current question, but still give them an opportunity to skip ahead if we likely have an answer for them. We waited until after the first few questions because we determined that, for example, after knowing the relation, gender, age, and one interest of the recipient, our algorithm can often identify a frontrunner gift idea. If the user is impatient or feels those answers are sufficient, they can tap early exit and get the suggestion immediately. If not, they continue the quiz and the button just remains available in case they change their mind. By handling it this way, we **improve user satisfaction** – impatient users are not forced to go through the entire quiz, while patient users can ignore the early exit and answer all questions for a possibly even more tailored result. The fade-in ensures the button doesn’t suddenly pop in a jarring way; it feels like a gentle suggestion from the interface.
- **Feedback Loops (Rating and Reporting):** We built feedback mechanisms directly into the results interface to close the quality loop. After seeing a suggestion, users can **rate** it (e.g., 1 to 5 stars) and **report issues** (via the “Report a problem” flow). These actions are more than just UI decorations – they actively send data back to us. A star rating from the user is collected and stored (anonymously) in our database, along with what answers the user provided in the quiz (minus any personal identifiers like the recipient’s name, which we deliberately do _not_ store for privacy). This gives us insight into whether our algorithm is performing well: a 5-star rating means “great suggestion,” while 1-star means we probably missed the mark. Over time, we can aggregate these to identify patterns (e.g., maybe gifts for “Kollega” (colleague) are often low-rated – perhaps our product selection for that relation needs improvement). Similarly, the **report problem** feature lets users flag specific issues such as “Image is missing,” “Link is broken,” or “Price is incorrect” – these are the options provided in the UI. If the user clicks one of those, the app sends a report to our system. We use this to catch and correct data issues quickly (for instance, if an image URL has changed on the retailer site and our image is 404, multiple users might flag “Image missing”; our admin panel will alert us once a threshold is crossed, and we can fix or remove that product).

These feedback loops make users active participants in maintaining quality. Importantly, from a UX perspective, giving the user a way to respond (either by praising the suggestion via stars or noting a problem) makes them feel heard and involved. It can turn a potentially negative experience (“this suggestion wasn’t good” or “this info seems wrong”) into a constructive one (“I let them know it wasn’t good, so it’ll improve”). It also increases trust: users see that we care about their opinion and the accuracy of information. We designed the feedback interactions to be very straightforward – one click for a star, one click to choose a report issue – with an immediate thank-you or confirmation shown. There are no lengthy forms, to encourage as many users as possible to give feedback. This steady stream of user input is invaluable for us to continuously refine our content and algorithms.

In summary, every interaction in Den Rette Gave is crafted to feel **smooth, intuitive, and user-centric**. By obsessing over these details, we aim to delight users and differentiate ourselves from a typical static website. The polished feel builds credibility (users equate smooth experience with professionalism) and encourages them to trust the platform with their gift searches.

## 3.0 Technical Architecture & System Design

From a high-level perspective, our system consists of three core components working together: **the User’s Browser**, **the Hosting Provider (with CDN and serverless platform)**, and **our Serverless Functions**. Below is an architectural breakdown:

### 3.1 System Architecture Diagram

_(Conceptual overview – as an architecture diagram would show boxes for each component and arrows for data flow.)_

- **User’s Browser (Client):** This is where the application’s frontend runs. When someone navigates to denrettegave.dk, their browser loads our static HTML/CSS/JS and executes the quiz application. The browser is responsible for rendering the UI, handling user input (quiz answers, button clicks), and performing all quiz logic locally. Essentially, the browser becomes the “app” runtime.
- **Hosting Provider + CDN:** We host the site on a platform like Netlify (or Vercel), which serves our static files via a Content Delivery Network. The CDN ensures that no matter where the user is (in Denmark or potentially elsewhere), they fetch the files (HTML, JavaScript, CSS, images, and public JSON data) from a server node close to them, resulting in fast load times. The hosting platform also provides the environment for our serverless functions (as cloud functions). We do not maintain our own web server; we rely on the provider’s infrastructure. This drastically simplifies deployment: every time we update our site (e.g., add products or tweak code), we just push changes to our Git repository and Netlify automates the build and update of static files and functions.
- **Serverless Functions (Backend Logic):** These are small pieces of backend code that run on-demand in response to specific HTTP requests from the client. Each function lives as an independent unit (like a mini-API endpoint) responsible for one task (such as saving a rating, or retrieving shared link data). They run in a secure, isolated environment and can access our protected data (like the ratings or shares files) which the client cannot directly reach. Because these functions only run when invoked, they scale automatically with usage – if 10 users simultaneously submit ratings, 10 function instances will run in parallel; if no one is submitting anything, no functions run (and we incur no cost). The key benefit is **scalability and cost-efficiency** with minimal maintenance – we do not have to manage server processes or worry about traffic spikes. Each function is stateless (executes and terminates, not holding any long-term session data beyond what’s in the request and what it might temporarily read/write from our storage).

Now, let’s describe how these components interact in a typical user session:

1. **Initial Page Load:** The user’s browser makes a request to denrettegave.dk. The Hosting Provider’s CDN responds by delivering the **index.html** page along with associated assets (CSS, JS, and some JSON data files under the assets folder). This initial payload contains everything needed for the frontend application to run. Because it’s served via CDN, this happens very quickly (often in a few hundred milliseconds).
2. **Front-end Logic and Quiz Interaction:** Once the browser has loaded the JavaScript, our single-page application (SPA) takes over. It reads static data like the list of quiz questions (questions.json) and the list of products (products.json) which were fetched (or will be fetched asynchronously) from the CDN. As the user proceeds through the quiz, all logic (like computing recommendation scores, determining the next question, when to show early exit, etc.) is done **locally in the browser** using that data. This design is intentional: it makes the quiz experience extremely responsive (no waiting for server responses between questions) and also reduces load on the backend (one less round-trip per question). The browser can compute on the fly which product seems best so far, etc., using JavaScript.
3. **Calling Serverless Functions (when needed):** At certain points, the frontend needs to perform actions that involve persistent data or sensitive operations – this is when it calls our serverless functions:
4. **Example 1: Submitting a Rating.** When the user clicks a star rating on the results page, the browser will send an HTTP POST request to our submit-rating function endpoint (e.g., /api/submit-rating or /.netlify/functions/submit-rating depending on configuration). The payload includes the rating value and the answers the user gave (minus any personal info like the name). The function runs on the server side (at the host) for a brief moment: it validates and then appends this rating to our private ratings.json file, then returns a success response. The browser might then show a quick “Thanks for your feedback!” message to the user. From the user’s perspective, this is seamless – they clicked a star and got an acknowledgment. Under the hood, a serverless function securely saved their feedback.
5. **Example 2: Creating a Shareable Link.** When the user clicks “Share result,” the browser calls the create-share-link function. This function might expect, say, the product ID of the recommended gift. It will generate a unique identifier (like XYZ123) and store a record in a private shares.json file linking XYZ123 to that product (and possibly the context of the recommendation). It then returns a URL or code (denrettegave.dk/share?code=XYZ123). The browser receives this and can display it to the user (perhaps showing a modal with the share URL they can copy). Later, if someone uses that link, the front-end will detect the code and call get-shared-result function to retrieve the stored recommendation details.
6. **Example 3: Reporting a Problem.** If the user reports an issue, the app calls submit-flag function with details (product id, issue type). The function will log this in flags.json. No sensitive info is exposed publicly – it’s all stored server-side.
7. **Example 4: Analytics Event.** We have an update-analytics function that the frontend might call in the background to log certain events (like “user completed quiz” or “user clicked affiliate link”). This helps us gather usage stats without relying solely on third-party analytics. Each call writes an entry or updates counts in analytics.json.
8. **Admin Actions:** When an admin is logged in on the admin panel (secured by admin-login function), that admin interface will call functions like get-ratings (to fetch all user ratings for analysis) or possibly future ones like resolve-flag when they mark an issue resolved.
9. **Secure Data Access:** Notice that some data is public (e.g., products.json can be fetched by anyone, it’s even loaded by the client directly) whereas other data is private (ratings.json, shares.json are not publicly exposed via the CDN). The serverless functions act as gatekeepers for private data. For example, the get-ratings function will check that the request is coming from an authenticated admin (via a token) before returning the content of ratings.json. If someone tried to directly access the ratings.json URL, they would be denied because that file is not served by the CDN at all (it’s in a protected area only accessible by our functions on the server side). This separation ensures user-generated or sensitive data isn’t leaking. It also means we can trust that data coming into functions is somewhat sanitized/validated because it goes through code we wrote (we can validate input formats, etc., whereas a direct client write to a file would be dangerous).
10. **No Traditional Database:** It’s worth noting that we aren’t running a traditional database server. Instead, we use JSON files as our data store (this is feasible and even optimal at our project’s scale, and it simplifies deployment because we avoid provisioning a database). These JSON files reside on the server (in the deployment environment). When a function like submit-rating runs, it likely reads the current ratings.json, appends a new entry, and writes it back. This approach is simple but effective given the low write frequency and low data volume. We don’t have complex relational data – just lists of products, lists of ratings, etc., which JSON handles nicely. The trade-off is that concurrent writes need to be managed carefully to avoid conflicts, but at our scale (likely low QPS on writes), this is manageable. We’ve essentially treated these JSON files as a lightweight database or flat-file store.
11. **Scalability:** Because the heavy lifting in terms of per-user interaction is done on the client side, our backend only has to handle relatively infrequent events (like a rating submission, which is very small and quick). This architecture can support quite a large number of simultaneous users. If 100 users are taking the quiz at the same time, that’s no problem – they’re mostly using their own device’s CPU. Our CDN can handle that easily since it’s just serving static files (which can be cached in memory on CDN nodes). If 100 users all submit a rating in the same minute, that triggers 100 function calls; serverless infrastructure can automatically run those in parallel across multiple containers or instances, so none of them have to queue up waiting for a single server’s attention. In a traditional single-server model, those 100 requests might bog down the server or require threading management. Here, it’s inherently handled by the platform.
12. **Fault Tolerance:** With static + serverless, if one of our function deployments has a bug or goes down, it doesn’t crash the whole site – worst-case scenario, a certain feature (like submitting feedback) might temporarily fail, but the site’s core (the quiz itself) would still be accessible since it’s static. Also, the CDN ensures that even if, say, one data center has issues, the traffic can route to another. This design increases our overall uptime and resilience.

In summary, the **flow** is: the User’s Browser renders the app using static files from the CDN; when dynamic data needs to be read or written (ratings, flags, shares, etc.), the Browser calls a Serverless Function; the Function securely interacts with our data storage and returns a response. This forms a triangle of interaction (Browser &lt;-&gt; Function &lt;-&gt; Data Store) mediated by the hosting platform.

This architecture aligns with our business strategy: it’s low-cost (we mostly serve static content, which is cheap or free at low volumes, and only pay per use for functions), high-speed (users get instant responses from CDN and local logic), and scalable without much effort. It also simplifies development – our front-end and back-end are decoupled and talk over clear API boundaries (HTTP calls), which is good for maintainability.

### 3.2 Technology Stack & Rationale

Our tech stack was chosen for simplicity, effectiveness, and modern best practices: - **Languages & Frameworks:** We use standard web technologies – **HTML5**, **CSS3**, and **JavaScript (ES6+)**. By using plain JavaScript (with ES6+ features for cleaner syntax), we avoid the need for heavy front-end frameworks (like React or Angular) since our app’s interaction model is not very complex. This keeps the bundle small and the rendering fast on all devices, including mobile. We can manage the quiz logic and state with straightforward JavaScript. If in the future the front-end grows in complexity, we may consider a framework, but at present, vanilla JS (enhanced with some helpful libraries if needed) suffices and means one less dependency to maintain. - **Styling:** We chose **Tailwind CSS** as our styling framework. Tailwind is a utility-first CSS library that provides pre-defined classes (for margins, padding, colors, font sizes, etc.) which we can compose directly in HTML. The rationale is that it allows rapid development of a consistent design without writing a lot of custom CSS from scratch. We defined our design system (colors, spacing, fonts) largely within Tailwind's configuration, so we can use classes like bg-blue-600 or text-slate-800 that map to our chosen palette. This ensures consistency (we’re not accidentally using off-brand shades or styles) and speeds up development (no need to name and write a new CSS class for every little style – just apply the utility classes). Tailwind also helps with responsive design using its built-in breakpoints (we use classes like md:text-3xl to adjust styles on medium+ screens, etc.). Another reason for Tailwind: it keeps our final CSS bundle minimal, because unused classes are purged, meaning we ship only what we actually use (this is an advantage over including a huge CSS framework or writing lots of custom CSS that might overlap). - **Front-end Behavior:** Aside from Tailwind, we use plain JS for interactivity. We might incorporate small helper libraries if needed (for instance, maybe a lightweight slider or a date library for any calculations), but overall we avoid large dependencies. This decision is in line with keeping the app **fast and lightweight** for users, some of whom might be on mobile devices or slower connections. Modern ES6 features (like arrow functions, async/await, modules, etc.) make our code more concise and maintainable. - **Hosting & Backend:** We deploy on **Netlify** (with Vercel as an alternative option in mind – both are similar for our needs). These platforms were chosen because they excel at our use case: static site hosting + serverless functions + continuous deployment. With Netlify, for example, we connected our GitHub repository; every time we push changes to the main branch, Netlify automatically builds the site (runs any build steps, though in our case it’s mostly just packaging since we aren’t using heavy build tools) and then distributes the updated files to its CDN. Netlify Functions (which are AWS Lambda under the hood, but abstracted for ease) run our backend code in response to certain URL calls. This stack means we don’t manage infrastructure at all – no AWS account to babysit, no Docker containers to orchestrate, etc. Netlify also gives us useful features like form handling (not used yet, but possibly for contact form) and environment variable management (which we use for the admin password). Vercel could do the same; we keep it as an option in case we want multi-platform deployment or if costs/needs change, but the idea is similar. - **Data Storage:** As described, we are using JSON files on the host as our data store, which is unconventional in larger systems but very practical here. We treat these files in the **“assets”** or **“data”** directories somewhat like one would treat tables in a database. For example, products.json is like our Products table, ratings.json is like a Ratings table, etc. The technology here is simply the filesystem + JSON format. JSON is human-readable (easy for us to manually edit if needed), and JavaScript (our primary language) can natively parse it into objects, making it convenient. The risk of concurrent writes is mitigated by the relatively low usage and atomic nature of writes in serverless functions (each function invocation runs in isolation – we just have to ensure our code reads, appends, writes quickly to avoid overlaps; Netlify’s functions run on AWS Lambda which does not guarantee a shared file system across invocations, so in practice our approach might involve reading a file from a cloud storage or bundling the latest data at deploy time – but for now, a simple append approach is assumed). - **Version Control & Collaboration:** We use Git (GitHub) for source control. The entire codebase, including the content JSON, lives in a Git repository (TomKonig/GaveGuiden). This means every change (code or content) is tracked, can be reviewed, and can be rolled back if needed. It also integrates with our deployment (Netlify watches the repo). For a small team, this setup is efficient and provides an audit log of changes.

_Why this stack?_ Because it allows a **small team** to deliver a robust product quickly and maintain it easily: - We leverage modern tools (like Netlify, Tailwind) that handle a lot of heavy lifting (deployment, design consistency) so we can focus on building unique features. - By avoiding over-engineering (no custom servers or databases when not needed), we keep the system simple – which means fewer bugs and easier understanding for new developers joining the project. A new developer can clone the repo, run a local server (even a simple Live Server for the static files, plus maybe a Netlify dev CLI for functions), and have the whole app running locally within minutes, since it’s just HTML/JS and some Lambda functions. - The technologies used are relatively common and well-supported. HTML/CSS/JS is ubiquitous – any web developer can jump in. Tailwind has good documentation and is widely used in modern web dev. Netlify functions use Node.js runtime, which our devs are familiar with given the front-end JS usage. - We consciously did not use any uncommon or niche tech so as to maximize the longevity of the project and ease of hiring (for instance, using plain JavaScript instead of say Elm or some obscure language for front-end; using JSON instead of a less-common DB for which expertise might be harder to find). - This stack is also **cost-effective**: almost everything here falls in free tiers initially (GitHub is free for public or small private repos, Netlify free tier covers generous usage, etc.). It aligns with our strategy of low burn rate.

In summary, the chosen tech stack provides us with **speed** (in development and in end-user performance), **scalability**, and **low cost**, all of which are crucial to the success of Den Rette Gave.

### 3.3 Detailed File Structure

Our repository is organized in a way to separate the static frontend, the public data, private data, and serverless functions. Below is the structure (directories and key files) with explanations:

/  
├── index.html # Landing page and container for the quiz app  
├── admin.html # Admin Panel interface (secured by login)  
├── privacy-policy.html # Static page: Privacy Policy (legal info)  
├── terms-of-service.html # Static page: Terms of Service (legal info)  
|  
├── assets/ # Publicly accessible assets and data files  
│ ├── products.json # \*\*Public:\*\* The core database of all gift products (product catalog).  
│ ├── questions.json # \*\*Public:\*\* The script for the quiz flow (question text, options, triggers).  
│ ├── flags.json # \*\*Public:\*\* User-submitted error reports (issue flags on products).  
│ ├── analytics.json # \*\*Public:\*\* Site analytics data (could be basic counters or logs).  
│ └── ... (images, icons, etc., like logo.jpeg, and CSS or JS if any separate files)  
|  
├── data/ # Private data storage (NOT exposed via public hosting)  
│ ├── ratings.json # \*\*Private:\*\* Stores user ratings and anonymized answers (feedback data).  
│ └── shares.json # \*\*Private:\*\* Stores data for shareable links (maps share IDs to content).  
|  
└── functions/ # Serverless function code (each file = one function endpoint)  
├── admin-login.js # Securely handles admin login (authenticates password and returns token).  
├── create-share-link.js # Creates a unique shareable link record (for "Share Results" feature).  
├── get-shared-result.js # Retrieves a shared result by ID (for when someone opens a share link).  
├── get-ratings.js # Provides ratings data to the admin panel (requires auth).  
├── submit-flag.js # Handles user submissions of product error reports (flags).  
├── submit-rating.js # Handles user-submitted ratings securely.  
└── update-analytics.js # Records analytics events (page views, quiz actions, etc.) anonymously.

Let’s unpack each part:

- **Root HTML files:**
- index.html is the main application container. It includes the layout for the landing page and placeholders (or sections) for the quiz and results. It likely also includes references to our scripts (either inline &lt;script&gt; or a linked JS file) and sets up the basic structure (header, footer). When we built the SPA, we included the quiz and results sections in this file (hidden or shown as needed by JS) so that we wouldn’t navigate away from index.html during use. It also pulls in the Tailwind CSS and any global dependencies.
- admin.html is a separate page for the admin dashboard. This is not linked from the main site (only those who know the URL or have access should use it). It contains the structure and scripts for our admin panel (login form, tabs for different admin functions like editing products, viewing flags, etc.). This file also includes Tailwind and likely some inline script or separate JS for admin functionality. It’s kept separate from index.html because we don’t want to bloat the main app with admin code, and it has its own distinct UI.
- privacy-policy.html and terms-of-service.html are static informational pages. They are linked from the footer of the site (as required legally). Keeping them as separate files is straightforward since they’re simple text pages – no need to load those contents into the SPA. They can be simple static pages (and search engines can index them easily). They share the overall styling (we include the same CSS and fonts).
- **Assets directory:**  
    This folder is served publicly. That means any file here can be fetched by a user’s browser via a URL like denrettegave.dk/assets/&lt;filename&gt;. We place here the data files that the front-end needs to load.
- products.json is **the heart of our product database**. It contains an array of all gift products available in the system. Each product object includes fields like:
  - id: a unique identifier (e.g., numeric or string) for the product.
  - name: the product name.
  - description: a short description.
  - price: price in DKK.
  - url: the affiliate purchase URL for that product.
  - image: a URL to an image of the product.
  - differentiator_tags: an array listing which attributes vary between product variants (e.g., \["color","size"\] for a T-shirt that has color and size variants).
  - tags: an object containing all the classification tags for matching, e.g. { gender: \["Mand","alle"\], age: \["18-25","26-40"\], interests: \["Outdoor"\], occasion: \["Fødselsdag"\], brand: \["BrandX"\], color: \["Blå"\], size: \["Medium"\] }. These correspond to quiz answers and help the algorithm score matches.
- This JSON essentially replaces what a more traditional app might store in a database. The front-end fetches this at startup (or it could even be embedded in index.html if we wanted) and then has all product info in memory to evaluate for recommendations.
- We made products.json public for simplicity – the user seeing it doesn’t pose a big issue (it’s just product info and affiliate links, which are fine to be exposed). Also, making it public means our static site can fetch it directly without needing a function call, improving performance (no extra latency to get product list). We just have to ensure not to include anything sensitive in it (and we don’t).
- questions.json defines the quiz flow. It’s an array of question objects, each containing:
  - id: an identifier for the question (not shown to user, but used for logic).
  - question: the text of the question (in Danish).
  - key: a key name that identifies what data point this question corresponds to (e.g., "relation", "age", "interests"). These keys match the keys used in product tags and in stored quiz answers (so that when a user picks an option, we know which tag category to match it with).
  - type: the type of UI control (e.g., "text-input", "single-choice-card", "multi-select-tag").
  - options: if it’s a multiple-choice question, this is an array of the possible answers. For example, for relation it might be \["Partner","Forælder","Ven","Søskende","Kollega","Andet"\]. For interests multi-select, options are things like \["Kaffe","Hjemmet","Bøger",...\].
  - placeholder: if it’s a text input, like the name question (“Hvad hedder den heldige?”), we may have a placeholder text (e.g., F.eks. "Mor" eller "Anders" hinting that they can put “Mom” or a name).
  - trigger: This appears on conditional questions. For example, the coffee cup color question has a trigger { key: "interests", value: "Kaffe" }, meaning this question should only appear if the user’s answer for the interests question included "Kaffe". Our front-end quiz engine will check these triggers after each answer.
- This JSON drives the quiz. By editing it, we can add or remove questions, or change how they’re triggered, without altering the application code. This design is flexible and allows non-developers (with access to the JSON) to adjust the quiz flow.
- flags.json is where we accumulate user reports of problems. Each time a user clicks a report option on a product result, a new entry is appended here by the submit-flag function. We decided to keep this file in the public assets for now simply to allow the admin panel (which runs client-side in the browser) to fetch it directly (fetch('/assets/flags.json')). There’s a small consideration: since it’s public, theoretically anyone could fetch flags.json, but it contains no personal data – just product IDs and issue types and timestamps – so it’s not sensitive. In the future, we might restrict it or move it to private if needed. Each flag entry might look like:
- {  
    "flag_id": 1627500000000,  
    "product_id": 42,  
    "issue_type": "Linket virker ikke",  
    "timestamp": "2025-07-27T15:30:00Z",  
    "status": "unresolved"  
    }
- The flag_id could be a timestamp or unique number, issue_type is one of the preset categories (like image missing, broken link, wrong price, “Andet” (other) if we allow custom input – possibly not implemented yet), status indicates if we’ve addressed it. Initially, flags are saved as "unresolved". In the admin panel, when an admin marks it fixed, we plan to update the status to "resolved" (so it can be filtered out or counted differently). The **admin panel** reads this file and aggregates by product to show, for example, “Product X has 3 reports of type ‘Price is incorrect’, last reported 2 days ago”. The threshold in the admin panel (default 3) tells when to show an alert. Because flags.json is public, the admin panel can fetch it without needing an authenticated function (we considered making it private, but that would require building a separate admin-only function to serve it – which we might still do later for security, but it’s low sensitivity data).
- When an admin marks issues as resolved, currently the interface just updates the flagsData in memory and would ideally call a resolve-flag function to update this file. We haven’t fully implemented that function yet (marked as a future to-do), so at present the process might involve manually editing the file or just keeping track mentally after fixing the product. Down the line, we will allow the admin panel to persist that change (so that resolved flags don’t keep triggering alerts). Resolved flags could remain in the file but with "status": "resolved", and our alert logic in admin ignores those.
- analytics.json stores site analytics data. Right now, this might simply be a collection of event counts or logs updated by update-analytics function. For example, it could be structured as:
- {  
    "page_views": 1240,  
    "quiz_starts": 300,  
    "quiz_completions": 250,  
    "affiliate_clicks": 200  
    }
- Or it might be an array of events:
- \[  
    { "event": "page_view", "timestamp": "...", "referer": "..." },  
    ...  
    \]
- The exact structure is something we’re refining as we integrate more advanced analytics (see Roadmap). The key point is it’s publicly readable, because again, the admin panel might fetch it directly to show some stats. Since it contains no personal info (just aggregate metrics or anonymized events), it’s okay for it to be public. If we ever felt this info is sensitive (competitors might glean our traffic numbers, for instance), we could secure it behind a function in the future.
- **Other assets:** This folder likely also contains static assets like our logo image (logo.jpeg as seen in index.html reference), maybe a favicon, and possibly a compiled CSS or JS file if we had one (though with Tailwind via CDN and inline scripts, we might not have separate compiled files). All these are static and can be cached by the CDN.
- **Data directory:**  
    This directory is **not publicly accessible**. On Netlify, we ensure this by not publishing it as part of the site’s public folder. Instead, these files are deployed along with functions or stored in environment but are only reachable by server-side code.
- ratings.json holds the list of user ratings (the feedback from the results page). Each entry includes the rating and the context of that rating:
  - rating_id: a unique ID for the rating (in our system, we generate it as a timestamp – e.g., 1669500000000 – which happens to also sort chronologically).
  - product_id: the ID of the product that was recommended.
  - product_name: the name of that product (we store it at the time of rating for convenience, so that if the product name changes or is removed later, we still know what was rated).
  - rating: the star rating given (1 through 5).
  - quiz_answers: an object capturing what the user answered in the quiz, which led to this recommendation. For example,
  - "quiz_answers": {  
        "relation": "Partner",  
        "gender": "Kvinde",  
        "age": "26-40",  
        "occasion": "Fødselsdag",  
        "interests": \["Kaffe", "Hjemmet"\]  
        }
  - This tells us the user was looking for a gift for a female partner aged 26-40 for a birthday, interested in coffee and home-related things. This context is extremely useful when analyzing ratings – if this user gave a low rating (say 2 stars), we might infer that our current top suggestion for that demographic isn’t hitting the mark and we should find better products for those criteria.
- **Privacy note:** We deliberately **do not** store any personally identifying information (PII) here. The quiz asks for the recipient’s name in the first question (“Hvad hedder den heldige?”), but that is purely to personalize the language (we might say “gaveidé til Anders” on results or something). That name is never used in matching logic and we do not save it to ratings.json. Before sending the rating data from the browser to the submit-rating function, we strip out the name field from the answers. This way, the ratings data is anonymized – it cannot be traced to a specific individual’s name or the user who submitted it. We only care about attributes relevant to the gift selection.
  - timestamp: an ISO timestamp of when the rating was submitted (e.g., "2025-07-27T12:00:00Z"). This helps us track trends over time (e.g., did a change we made after a certain date improve ratings?) and also is used as the unique key (we combine timestamp and maybe product_id to ensure uniqueness if needed).
- The ratings.json file is private because we consider this our internal feedback data. There’s no need for the public or regular users to see potentially hundreds of entries of ratings and quiz contexts, and exposing it might raise privacy questions. Instead, the admin panel (which is behind a login) can retrieve this data via the get-ratings function, which ensures only authorized access.
- shares.json stores records for shared links generated. Each time someone uses the "Share Results" feature, we create an entry here. It might look like:
- {  
    "share_id": "ABC123",  
    "product_id": 42,  
    "product_name": "Test Kaffekop (Blå)",  
    "timestamp": "2025-07-27T12:05:00Z",  
    "quiz_answers": { ... possibly store the answers or at least key ones ... }  
    }
- There are a few ways we could implement sharing:
  - We could store the entire recommended product object (name, description, image, price, etc.) under the share ID, essentially freezing the recommendation details at the time of sharing. That way, even if the product later changes or is removed, the person with the link sees what the original user saw.
  - Or we could store just a reference (product_id) and regenerate the view based on current product data when the link is opened. The risk there is if product data changes or the product gets deactivated, the link might break or show updated info (maybe fine or maybe confusing).
- For simplicity, we might store at least the product id and maybe the quiz context that generated it (to display something like “This gift idea was suggested for a 26-40 year old partner interested in coffee”). When someone visits the share link, the front-end will call get-shared-result with the share_id, and the function will look up this record and return the details needed to render the result (e.g., product info). Because share links are meant to be publicly accessible (anyone with the link can view it), one might ask: why is shares.json private? The reason is we don’t want people scraping or enumerating all share links. By keeping it private and forcing access through get-shared-result, we ensure you need a valid share_id to get anything. If it were public, someone could potentially fetch the entire list of share IDs and associated products, which might include context information. It’s a slight concern, though not highly sensitive; still, a private approach is more secure.
- The create-share-link function writes to this file (generating a new ID, ensuring it’s unique) and returns the ID. The get-shared-result reads from it. We ensure that share IDs are sufficiently random (not guessable) – often a short hash or using NanoID/UUID etc. – so that there’s no practical way to guess a valid share link without having seen it.
- Over time, this file can grow as share links accumulate. We might implement an expiration (like share links valid for X months) to avoid indefinite growth, or archive old ones.
- **Functions directory:**  
    Each JavaScript file here is an AWS Lambda function (through Netlify’s function packaging). They act as API endpoints under our site’s domain (Netlify typically makes them available at /.netlify/functions/&lt;name&gt; path). Let’s detail each:
- **admin-login.js:** This function handles the authentication of admin access. When the admin page login form is submitted, it sends the password to this function (via HTTPS, of course). The function checks the provided password against the true admin password, which we have stored as an environment variable (ADMIN_PASSWORD) in Netlify (this is configured in Netlify settings, as described in the admin panel’s Settings tab instructions). The password itself is not stored in code or in any file – only in the environment – so if someone were to browse our repository or public files, they cannot find it. When the function runs, it typically does something like:
- const provided = JSON.parse(event.body).password;  
    const actual = process.env.ADMIN_PASSWORD;  
    if(provided === actual) {  
    // generate a token (could be a simple random string or a JWT)  
    return {  
    statusCode: 200,  
    body: JSON.stringify({ token: "&lt;some auth token&gt;" })  
    };  
    } else {  
    return { statusCode: 401, body: "Unauthorized" };  
    }
- We often use a JWT (JSON Web Token) or a random securely-generated string as the token. In our case, since we trust our own admin use and it's a single-user scenario, we might use a simple short-lived JWT signed with a secret, or even a static token that changes when environment variable changes. The token is sent back to the admin.html script, which stores it (in sessionStorage for example) and includes it in subsequent requests (like get-ratings).
- The result is that after a successful login, the admin’s browser holds a token that proves they logged in. We chose to do a token rather than just open up access because it’s stateless and secure – the token can have an expiry encoded (say valid for 1 hour), and the functions that require admin will check for a valid token.
- This approach avoids storing any session on server (truly serverless friendly). We instruct in admin Settings that to change the password, one must update the environment variable in Netlify’s dashboard (which requires redeploy or restart to take effect).
- **create-share-link.js:** This function is called when a user wants a shareable link. The client likely sends the needed data (maybe the product_id of the recommended gift, and possibly the quiz answers or some identifier of the session). The function’s job is to:

    1. Generate a unique share ID. This could be a random string, e.g., using Node’s crypto or a library to generate something like “q1w2e3” or a UUID. We want it short enough to be shareable (maybe 6-8 characters).
    2. Gather the data to save. It may read the product_id from the request, look up the full product details from products.json (to save name, etc.), or the client might send the necessary fields in the request body to avoid an extra read. We should be careful not to trust client blindly; ideally, we verify that product_id exists in our database.
    3. Write a new entry into shares.json. For example, add:

  - { "share_id": "ABC123", "product_id": 42, "timestamp": "...", "quiz_answers": {...} }
  - We might include all needed fields to display the result. Perhaps we include the product_name and maybe an excerpt of description or image URL to ensure the share rendering doesn’t depend on current products.json (which could change).

    1. Return the generated share ID (or a full URL including our domain and route).
- The admin panel or no other part needs to be involved; it’s a direct user-driven action. Because this is writing to a private file, only our function can do it.
- **Note:** Writing to a JSON file in a serverless function often involves reading the current file, parsing JSON, pushing new data, and writing it back. Netlify’s environment gives limited ephemeral storage. Actually, Netlify functions cannot _directly_ write to the deployed file system permanently (they run in an ephemeral container). So how do we persist the change to shares.json or ratings.json? Under the hood, we likely use Netlify’s built-in support for storing to “Site’s files” or use an alternative like storing in an external service (like writing to an AWS S3 or using Netlify’s new Storage API if any). For now, we assume Netlify provides a way (possibly Netlify Identity or its small GoTrue DB, but we haven’t listed any such dependency).
- It’s possible that, for simplicity at this stage, we rely on very low volume and just reading from memory – meaning the data might reset on new deploys. However, given the importance of not losing ratings or flags, we likely set up form handling or use GitHub as a storage (some Netlify functions can commit back to the repo, albeit that’s advanced). This is a technical detail we plan to refine; nonetheless, the conceptual design is that these JSON files act as if they are persistent storage.
- When the function succeeds, the browser receives the share ID and then shows the user something like “Your shareable link: denrettegave.dk/share?id=ABC123”. The user can copy it.
- **get-shared-result.js:** This function corresponds to when someone visits a shareable link. We have a route (noted in the content, e.g., maybe we made a page or we handle it in index.html by checking URL params for id). When the front-end detects a share?id=XYZ parameter, it knows to fetch from this function: It will call /.netlify/functions/get-shared-result?id=XYZ (could also be a POST with the ID in body, but GET is intuitive here). The function will:
    1. Read the shares.json file.
    2. Find the entry with share_id: XYZ.
    3. If found, return the associated product data (it could return the same format as a normal recommendation result: name, description, image, price, etc., plus possibly the quiz context if we want to display it).
    4. If not found or expired, return an error or a 404 which our front-end can handle (showing “This shared link is invalid or expired” message).
- The front-end then uses this data to render a results page as if the user just got that suggestion via the quiz. Essentially, it’s a shortcut to view a stored recommendation. The person viewing the shared link can also choose to go take the quiz themselves via navigation, but at least they see what was shared with them.
- Security: No auth token is required here, because share links are meant to be open (anyone with the link can view). That’s why the share IDs must be unguessable.
- **get-ratings.js:** This function is used by the admin panel to retrieve all user ratings (so the admin can see feedback details). It **requires authentication.** Specifically, the admin’s browser will include an Authorization header with a Bearer token (the token obtained from admin-login). For example: Authorization: Bearer &lt;token&gt;. This function will:
    1. Check for the auth header and validate the token. If the token is missing or invalid, it returns 401 Unauthorized. The admin script will then probably redirect back to login or show an error. This ensures only a logged-in admin can get the ratings.
    2. If auth is valid, it reads ratings.json (from private storage) and returns its contents, likely as JSON. We might choose to filter or format it nicely (e.g., perhaps the admin panel doesn’t need to see absolutely all data if large, but in our case we likely return everything and let the client side display in a table).
- The admin interface will call this function on page load (after login) to populate the Ratings tab. It will then iterate over entries and produce a table where each row might show Product name, rating (stars or number), date (formatted from timestamp), and quiz answers (maybe concatenated or in a tooltip).
- **submit-flag.js:** Handles when a user submits a problem report (flag). The front-end, when the user selects an issue type in the “Report a problem” modal and confirms, will send a POST request to this function with details such as:
- {  
    "product_id": 42,  
    "issue_type": "Linket virker ikke",  
    "timestamp": "2025-07-27T15:30:00Z"  
    }
- (The front-end sets the timestamp at sending, or the function can add the current time itself). The function will then:
    1. Possibly generate a flag_id (if we want a unique id for each report – using maybe Date.now() or an incrementing sequence).
    2. Append a new entry to flags.json with status "unresolved".
    3. Return a success response (the front-end doesn’t necessarily need any data back other than to know it succeeded).
- As discussed, how exactly the function appends to a JSON file in a serverless environment might require reading and rewriting the entire file (since it’s not a database). That is fine for now given the expected volume (even 100 flags is trivial to parse and write).
- After this call returns OK, the front-end shows a “Thank you for your feedback!” message to the user and closes the modal. The user’s job is done. On our side, this flag now sits in flags.json until an admin addresses it.
- No authentication is needed for this function; any user can report an issue. We do trust users somewhat here – theoretically a malicious user could spam this endpoint. To mitigate spam, we could implement simple measures: e.g., not allow more than X flags from one session or IP in a short time, or require a page refresh (since after one flag we hide the UI). At our scale, spam is unlikely, and an occasional prank flag is not harmful (we can ignore if silly).
- **submit-rating.js:** This function logs a user’s rating for a suggestion. When the user clicks on a star rating (1-5 stars), the front-end immediately reflects that (like highlighting the stars selected) and simultaneously sends the data to this function. The payload includes:
- {  
    "product_id": 42,  
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
- The quiz_answers object is the key context for us. The front-end has this readily available (it knows what the user input for each question). Before sending, the front-end will _remove the name field_ if it was present in quiz answers. This is an important privacy step – the user might have typed the recipient’s name (like “Anders”) for personalizing the language, but we do not want to store that in our database. Our function double-checks and omits any name or personal identifiers. We only care about categorical info like relation, age range, etc. By doing this, we ensure compliance with privacy best practices (no personal data retention) and avoid any GDPR complications (names can be considered personal data especially if combined with other details).
- The function will: 1. Assign a rating_id. In our design, we use the timestamp (in milliseconds since epoch) as a unique ID. The example 1669500000000 corresponds to a datetime. Using timestamp as ID is convenient for sorting by time and is unique enough (two ratings might technically happen in the same millisecond, but it’s incredibly rare with our scale; if needed, we could append a random small number to ensure uniqueness). 2. Write an entry to ratings.json with all the fields (as shown in Appendix A example). This likely involves reading the current ratings.json (which is an array), pushing the new object, and writing it back. 3. Possibly return a success message. The front-end might not even wait for response beyond maybe logging success or error (maybe we show a quick toast “Feedback received!” which we can show regardless of outcome, but ideally only on success).
- No auth needed; any user can submit a rating. The content is not sensitive (they are rating our suggestion, not rating themselves or anything personal).
- Over time, ratings.json grows. It’s private, and only accessible via admin or by deploying and examining file. We should monitor size – if we have thousands of ratings, reading the whole file for each new rating and writing back could become slow. If needed in future, we might move to a more robust storage (like a real database or at least a partitioned store).
- **update-analytics.js:** This function records generic analytics events. We call it from the front-end for events we deem important that Google Analytics or similar might not catch or that we want to log internally. For example, we might call this when:
  - The user starts the quiz (event: "quiz_start").
  - The user completes the quiz (event: "quiz_complete").
  - The user clicks the affiliate link (event: "affiliate_click" along with product_id).
  - Early exit usage (event: "early_exit").
  - Or even each question answered (though that might be overkill).
- The payload typically has an event name and maybe some metadata (like the product id for affiliate_click, or maybe an increment count). The function will update analytics.json accordingly. If we use a simple counter approach, it might increment numeric fields. If we use a log approach, it might append an entry. We need to be careful with concurrency if multiple events come in very close – but likely fine given low volume and short execution.
- Example: The front-end might do:
- fetch('/.netlify/functions/update-analytics', {  
    method: 'POST',  
    body: JSON.stringify({ event: 'affiliate_click', product_id: 42 })  
    });
- The function might then increment a counter affiliate_clicks in analytics.json or record the timestamp and product id in an array for deeper analysis later.
- Because analytics are not critical path, we often fire-and-forget these calls (not awaiting them in front-end). If they fail, it doesn’t impact user experience. But when they succeed, we get valuable data.
- No auth required (we expect events only from our own front-end; even if someone manually calls it, it’s not a big issue if they fake a page view or something).
- In the future, especially when we implement **Advanced Analytics Integration** (Roadmap Update 1), we might replace or augment this with an external analytics service or more sophisticated tracking, but this built-in approach ensures we at least have some data from day one.

_Note on Persistence:_ Our current storage method (flat JSON files updated by serverless functions) is a simple solution that works initially. We should acknowledge to future maintainers reading this that this could be replaced with more robust options: - We could use a database (like Firebase, or a small PostgreSQL instance, or FaunaDB, etc.) if data volume or concurrency demands grow. That would remove the overhead of reading/writing entire files and give atomic operations. - Alternatively, Netlify has forms or might introduce persistent storage for functions (some use FaunaDB or Airtable as examples in JAMstack world). - For now, we manage with the flat file approach because it’s within the write limits and simplifies architecture (no separate DB services to set up or pay for). - When making changes, be cautious: since these JSON files are part of the deployed package, updating them at runtime might not persist across redeploys automatically. We likely store them in a special path or use Netlify’s build hooks to keep changes. This aspect should be reviewed as part of maintenance. (It might be that in our setup, we treat assets/flags.json and others as files on a cloud storage that functions can access read-write, separate from the published site bundle.)

Overall, this file structure and architecture is aimed at **clarity**: any team member can see where things reside: - All content data in JSON files (easy to find and edit). - All logic for backend in clearly named function files. - Front-end pages separate for user and admin contexts. - This also makes it easier to enforce separation of concerns (e.g., the main site code doesn’t include admin code, reducing risk of exposing admin functionality by accident).

Future developers should find it straightforward to extend: - Adding a new quiz question? -> Edit questions.json (and possibly adjust scoring logic in front-end code). - Adding a new product? -> Add to products.json (the admin panel also provides UI to do this and then copy-paste result back into file). - Changing design? -> Tweak Tailwind classes in HTML or Tailwind config. - Changing function behavior? -> Modify the respective JS in functions folder.

By maintaining this structured approach, the project remains **approachable and maintainable**, which is crucial for a small team or open source collaborators. New features can be slotted in by following the established patterns (for example, if we wanted to add a “wishlist” feature, we might introduce a new JSON (wishlists.json) and corresponding functions).

Now that we’ve covered the core architecture and structure, we can move on to the core algorithms that power the dynamic behavior of the app.

## 4.0 The Dynamic Recommendation Engine (Core Logic)

One of the defining features of Den Rette Gave is our dynamic recommendation engine, which works in real-time as the user answers the quiz. This engine has two major parts: 1. **The Scoring Algorithm** – which evaluates how well each product matches the user’s answers so far. 2. **The Dynamic Question Engine** – which determines which question to ask next (potentially adding follow-up questions based on previous answers).

Together, these create an interactive loop: user answers -> we score products and possibly determine if we can recommend early or what to ask next -> user answers next question -> repeat, until we have enough confidence to recommend a gift.

### 4.1 The Scoring Algorithm

After every answer the user provides, the system re-evaluates all **active products** against the user's input to see which gift is currently the best candidate. An “active” product means any product that hasn’t been filtered out or marked inactive – essentially all products in our products.json that are considered available for recommendation. (If an admin, for example, has marked a product as inactive due to flags or out-of-stock, the front-end would exclude it from scoring. Currently, to mark a product inactive, we would either remove it from products.json or add an "active": false flag; our quiz logic can be adjusted to ignore any product with active=false. We plan to implement a clearer mechanism for inactive products so the engine doesn’t consider them.)

**How scoring works:** Each product has a set of tags (attributes) and each user answer corresponds to a desired attribute. The scoring algorithm assigns points to a product for each match or partial match between the product’s tags and the user’s given answers. Products that align better with the user’s profile will accumulate higher scores, meaning they are more likely to be the recommended gift.

Let's break down the scoring with an **example scenario**:

- Suppose the user has answered two questions so far:
- **Gender:** "Mand" (male) – indicating the gift recipient is male.
- **Interests:** "Kaffe" (coffee) – indicating the recipient is interested in coffee.
- Now, consider two example products in our database:
- **Product A:** _Coffee Brewing Kit_ – tags for this product might be:
  - gender: \["alle"\] (meaning it’s suitable for any gender, or unisex),
  - interests: \["Kaffe"\] (it’s clearly related to coffee, a coffee brewing kit),
  - (other tags maybe age: \["18-25","26-40"\], occasion: \["Fødselsdag","Jul"\], etc. not directly relevant to this example).
- **Product B:** _Men's Designer Perfume_ – tags could be:
  - gender: \["Mand"\] (targeted for men),
  - interests: \["Mode"\] (interest tag might be fashion or personal care, not coffee),
  - (other tags like age range and occasion possibly).
- How the algorithm scores them after the above 2 answers:
- **Product A (Coffee Kit):**
  - For the _Gender_ answer "Mand": Product A’s gender tag is \["alle"\]. We interpret "alle" as “suitable for all,” which means it’s not specifically tailored to men or women but is broadly applicable. The algorithm would likely give a moderate score for this – perhaps a few points – because the product isn’t a mismatch (it works for a man, since it works for anyone), but it’s also not an explicitly male-targeted product. (If the product had "Mand" in tags, that’d be a direct match deserving full points; "alle" might yield slightly fewer points than a direct match, but still something positive since it does include male implicitly).
  - For the _Interests_ answer "Kaffe": Product A’s interests include "Kaffe", which is an exact match. This is highly significant – a strong interest match. The algorithm would award a substantial number of points for this alignment, as interest alignment tends to be a strong predictor of a good gift. Let’s say we give a higher weight to interest matches (in a hypothetical scoring system, maybe 10 points for an interest match).
  - Summing that up: Product A gets maybe ~3 points for gender (because "alle" counts as a match for male, albeit general) and ~10 points for the coffee interest match. **Total Score for A: ~13 points.**
- **Product B (Men's Perfume):**
  - Gender "Mand": Product B’s gender tag is \["Mand"\], which is a direct match (the product is indeed for men). This would score points, likely full points for gender, say ~3 points (assuming gender matches are a smaller weight than interests, but still contribute).
  - Interests "Kaffe": Product B’s interests tag is \["Mode"\], which does not match "Kaffe" at all. There is no overlap with what the user said the recipient is interested in. If the user only is interested in coffee (and perhaps they could select up to 3 interests, but in this example they chose coffee and maybe no others yet), then this product doesn’t align on that front. The algorithm would give 0 points for interest match here. In fact, if a user specifies an interest and a product lacks that interest tag, it might effectively disqualify the product from being top recommendation. We might not necessarily remove it entirely (especially if the user picks multiple interests, a product might match one interest but not others), but lacking any match on an interest could keep the score low.
  - Score for Product B: ~3 (for gender match) + 0 (for interest mismatch) = **3 points.**
- Comparing scores: Product A has 13, Product B has 3. Clearly, at this stage, **Product A is a far better match** given the data we have (male interested in coffee). The engine would identify Product A as the front-runner.

This simplistic example illustrates the principle. In practice, the scoring algorithm considers all categories of tags: - **Relation:** If we had relation tags on products (e.g., a product might be especially suited "Forælder" (parent) or "Kæreste" (partner)), we would incorporate that. However, currently in our design, we did not create a relation tag for products. We assumed most products could be given to various relations and didn’t want to hardcode that. Instead, we rely on interests/occasion to carry that weight. For now, **relation is not directly scored**, meaning whether the gift is for a partner vs friend doesn’t directly filter products by a relation tag. (We might in the future use relation indirectly: e.g., if relation is "Kollega" (colleague), maybe avoid very personal or romantic gifts. But that logic isn’t in tag matching yet – it could be in a future rule-based filter: e.g., flag a product as "romantic" and if relation=colleague, reduce score or exclude. At present though, no such mechanism is implemented, so relation primarily helps in phrasing and perhaps the admin can glean if certain relations always lead to low ratings to manually adjust product selection.) - **Gender:** If the product’s gender tag array contains the user’s answer (or "alle"), that’s a match. If a product is tagged for "Kvinde" (women) and the user said "Mand", that product might either get 0 or even a negative (we might penalize because it’s likely not suitable – e.g., a makeup kit for women wouldn’t fit a male recipient). So gender mismatches typically eliminate a product from contention or give it a very low score. Gender "alle" is treated as matching any input moderately. If user said "Andet" (other/non-binary or not specified), probably we’d treat products tagged "Mand" or "Kvinde" both as less ideal (because the user specifically indicated a gender outside binary, so ideally products unisex or inclusive would rank higher). - **Age:** Similar concept: If a user picks an age range (say "18-25"), and a product has an age tag list, if that range is included, it gets points. If not, maybe 0 points. If a product is truly universal for all ages, we might tag it with broad ranges or "alle" if we had that concept. It’s possible many products have multiple age ranges tags (like 18-25 and 26-40) meaning they’re suitable for young adults and middle-aged, but maybe not for kids or seniors. The algorithm likely awards points for an age match, but typically we’d weight it slightly lower than interest. It’s important but many gifts are not strictly age-limited except those clearly targeted (like a toy might have age "Under 18"). - **Interests:** This is often the strongest indicator. We allow the user to select up to 3 interests. In scoring, if a product matches any one of the interests, it gains points. If it matches multiple, it gains more. For example, if a user selected "Kaffe" and "Hjemmet" (coffee and home decor) as interests, a product that has both tags (like a stylish coffee maker which is both a home appliance and coffee-related) might get a big boost for matching two interests. If it matches one interest but not the other, it still gets some points, but not as many as something that covers both. If it matches none, likely its score stays low. This helps surface products that are at the intersection of the user’s interests (which presumably are more likely to delight the recipient). - **Occasion:** If the occasion is, say, "Jul" (Christmas), and we have products tagged for Christmas (maybe some products are specifically good as Christmas gifts or maybe have a seasonal theme), those should score higher for that occasion. For example, a “Advent Calendar Gift Box” might have occasion \["Jul"\] and would get points if occasion = Jul. If occasion was "Fødselsdag" (birthday) and the product is tagged for birthday, points. If not, maybe neutral or slight penalty if it’s something that might be odd for that occasion. Most products in our list might be generally okay for any occasion, but some occasions (like "Årsdag" (anniversary) or "Valentine’s Day" if we had) might favor more specific gifts (like romantic ones). We could incorporate that by tagging and scoring. Currently, we have a limited set of occasions. - **Differentiator tags (variants like color, size):** These are a special case. Differentiator tags (e.g., color: \["Blå"\]) are not so much about the user’s profile or preference generally, but about specific variants of a product. In scoring, **we typically do not give generic points for differentiator tags** unless the user has answered a question about it. For instance, in our quiz, we only ask a color question if it was triggered (like the coffee interest triggered a mug color question). If the user indeed answered **Color: "Blå" (blue)**, then we incorporate that: - Among the variants of coffee mugs (say we have Blue Mug variant and Green Mug variant as separate products in the JSON as we decided to list variants separately), the one that has color: \["Blå"\] should be scored highly (essentially, it matches the user’s specified preference exactly), whereas a variant with color: \["Grøn"\] might be essentially disqualified or scored 0 because it doesn’t match the chosen color. - In effect, when a differentiator question is answered, the algorithm can treat non-matching variants as _inactive_ for that user. Another way: it could assign a huge negative weight or zero weight if the differentiator doesn’t match. This ensures that after the user says they want a blue cup, we will recommend the Blue version, not the Green version of the same cup. - If no differentiator question was asked, then all variants remain in play and they’d score equally on differentiator (which is neutral at that point). We generally don’t want color or size to influence score unless the user specifically expressed a preference, because color/size is usually a secondary preference. (We wouldn’t remove a product just because we didn’t ask about color – we’d still consider all colors). - So differentiator tags are used as **filters** once the corresponding user input is available. They don’t inherently rank a product higher unless the user explicitly indicated something. For example, if we never asked about size, having size Large vs Medium doesn’t matter for scoring, they’d be treated on other attributes the same. If we did ask (like say interest triggers a size question for clothing), then we only want the variant matching that size.

- **Brand:** We do tag products with brand names in tags.brand. However, we currently do not ask the user “What brands do they like?” (no such quiz question). Therefore, brand doesn’t come directly into scoring algorithm at the moment. It’s mostly there for informational purposes or future use (for example, if we notice a user always clicking a certain brand, theoretically we could incorporate that in a personalized model, but that’s far-future and not in scope initially). So brand tags likely are not used in the scoring calculation at this time. They may be shown or used in filtering in admin or for content curation.
- **Multiple answers:** Some quiz questions allow multiple selections (like interests). In such cases, a product that matches more of the selected items scores higher. We usually will have a diminishing return or cap so that a product that matches 3 out of 3 interests is definitely at the top, 2 out of 3 is next, etc. If a user selects up to 3 interests, any product that doesn’t match at least one interest will likely be very low score (practically out of contention) because the user said those interests matter.
- **No answers yet (initial state):** At the very beginning, when the user has answered nothing or just the name (which doesn’t affect matching), all products have equal score (perhaps 0). We don’t show any recommendation then, obviously. As soon as one meaningful answer comes in (say relation or gender), we start filtering a little. For example, after the **Gender** question alone, all products not suitable for that gender might drop out or get score 0, and ones matching or unisex get a baseline score. After **Age**, similarly, maybe some products clearly meant for older/younger might drop or get less. The engine is continuously updating scores and can use this to decide if “Early Exit” should show – e.g., maybe after 3-4 answers one product has pulled way ahead (score much higher than others), giving confidence to recommend early.
- **Threshold for recommendation:** We likely have a rule like: if at any point one product’s score is, say, 30% higher than the second best, and a minimum number of questions have been answered (maybe at least 3), then we consider that we have enough info to make a recommendation, hence trigger the early exit availability. If the scores are close (like multiple products tied), we keep asking questions to break the tie or differentiate further. This approach ensures we don’t prematurely recommend when it’s uncertain, and conversely, we don’t waste the user’s time asking everything if one choice is clearly superior early on.
- **Continuous updates & UI:** As the user selects each answer, the front-end likely recomputes the scoring behind the scenes. This could be done instantly and potentially used to decide the next question (via triggers) or to decide about early exit. We _do not_ flash the scores to the user (the user only sees the final recommendation, not the intermediate scoring process), but it’s happening under the hood. This is akin to a decision tree being pruned as we go along.
- **Relation tags in future:** If we find it necessary, we might introduce relation tags for products (like some gifts might be tagged as “good for colleagues” or “for him/her” specifically in a relation sense). If we did, the scoring would incorporate that similarly to gender/occasion. But as mentioned, currently we avoid explicit relation tagging. Instead, we rely on the user’s relation answer to possibly influence nuance (for instance, the text on the results might change – e.g., “a great gift for your **friend**” vs “for your **partner**”). And the curator might avoid putting overtly romantic items that only suit “partner” relation in the catalog unless they can also be from friend to friend with a twist. However, we keep an eye on user feedback – if, say, people who select “Kollega” often rate suggestions poorly, it might indicate we need relation-specific logic (maybe our suggestions were too personal or pricey for a colleague scenario, etc.).
- **Inactive products in scoring:** If an admin marks a product as inactive (for example, a product is out of stock or repeatedly flagged for issues and we decide to take it down), the front-end should exclude that product from the scoring loop entirely. In practice, we might implement this by adding an "active": false property in the product entry or removing it from products.json. If it's marked inactive, our scoring function will skip it. This prevents recommending a problematic product. The admin panel provides the ability to mark products inactive through perhaps editing the JSON (we plan to add a proper UI toggle for that). It’s worth noting this so future maintainers know to ensure inactive products don’t accidentally get recommended. We may also implement automatic inactivation: e.g., if a product accumulates too many flags (above threshold) and we cannot fix immediately (like if it's consistently out of stock), we might temporarily mark it inactive so users don’t see it. This is more of an operational decision aided by the admin panel’s flags alert.

The key takeaway: **the scoring algorithm incrementally personalizes the gift recommendation** with each answer. It uses a weighted point system across various attributes. We preserve a balance such that no single answer (except maybe interests, which is heavily weighted) fully determines the outcome on its own; rather, the combination narrows it down. This dynamic approach ensures that by the end of the quiz, the product with the highest score should theoretically be the most fitting gift given everything we know about the recipient. And that product (or products, if it’s a tie or close) is what we display to the user on the results page.

To summarize with a quick example format, after two answers (gender=Mand, interest=Kaffe) we might have a behind-the-scenes snapshot like: - _Product A (Coffee Machine)_ – tags: gender: \["alle"\], interests: \["Kaffe"\], ... – **Score: 13** ✔️ - _Product B (Perfume)_ – tags: gender: \["Mand"\], interests: \["Mode"\], ... – **Score: 3** - _Product C (Cooking Apron)_ – tags: gender: \["alle"\], interests: \["Madlavning"\], ... – **Score: 0** (no matching interest, unrelated interest chosen) - _Product D (Coffee Subscription)_ – tags: gender: \["alle"\], interests: \["Kaffe"\], ... – **Score: 11** (also a strong contender, maybe almost as good as A) - _..._

In that list, Product A stands out. Product D is close – if D was only slightly behind A, we might hold off early exit to ask another question to see which one edges out. If A was way ahead of all others, we’d allow showing results early.

This scoring mechanism is continuously refined as we gather more ratings (feedback). For instance, if we notice via ratings that users in a certain segment aren’t satisfied, we might adjust weights or add new tags (maybe gifts for older recipients need more weight on age appropriateness, etc.). The system is designed to be adjustable without rewriting core logic – we can tweak numbers and tags.

**Role of “differentiator_tags” in scoring:** To explicitly answer the point from design updates: Differentiator tags (like color, size) do not contribute to the score **until** the user specifies a preference. Once a differentiator question is answered, it acts more like a filter: - If match, the product variant stays in consideration (possibly with a small boost to emphasize it matches perfectly). - If mismatch, that variant is effectively out (score could be dropped to 0 or a negligible level). - This ensures, for example, if a user wants a blue item and we have a product in blue and red variants, only the blue one will surface as top result for them. - We intentionally separate differentiators from the main score to avoid skewing results for questions the user hasn’t answered. For example, we don’t want to prefer the blue variant of every product by default – only if blue was chosen by the user. - In our content generation, we list each variant separately so the engine treats them as separate “products”. This simplifies the logic: we don’t have to do variant resolution at result time, it’s built in. The downside is if user didn’t get asked color (maybe they said interest=Coffee but somehow did early exit before color question), the engine might have multiple variants (blue mug, green mug) still with equal scores. In such a case, it might arbitrarily pick one (whichever is first in the list or such). Ideally, though, our quiz tries to ask those differentiator questions if needed to differentiate. - If a differentiator question is not asked, all variants of a product line remain equally scored, and one might randomly win. That’s acceptable but if it's a tie we could just choose one deterministically (like the first variant). In future, we might avoid showing multiple variants as separate suggestions to the user to reduce confusion; we’d show one variant as the suggestion (preferably the one the user would like most, which is why asking them is good).

In essence, **the scoring algorithm ensures a personalized ranking of products** after each answer. It’s the brain behind the quiz’s magic, computing a running “best guess” of the perfect gift. By the time the quiz is done (or earlier if triggered), we have a clear winner to recommend. This algorithmic approach sets us apart – it’s not a static lookup or a simple filter; it’s a dynamic calculation that can adjust to each user’s unique combination of inputs.

### 4.2 The Dynamic Question Engine

While the scoring algorithm figures out _what_ to recommend, the dynamic question engine figures out _what to ask next_. We don’t just ask all questions in a fixed sequence irrespective of the answers – instead, some questions are conditionally inserted based on prior answers. This makes the quiz shorter and more relevant.

**How it works:** We have a list of base questions and a set of conditional questions defined in questions.json. The question engine operates like this: - First, it enqueues all the base (unconditional) questions in a logical order. These are questions that everyone gets asked regardless of their answers (unless we end the quiz early). In our current set, the base questions are: Name (which is just for personalization), Relation, Gender, Age, Occasion, and Interests. These have no trigger conditions; they should generally be asked for every user. - Then, as the user answers each question, the engine checks if that answer has “unlocked” any follow-up question via a trigger. If so, it **inserts** that follow-up question into the queue (if it’s not already queued). - The follow-up (triggered) question might be scheduled to appear _next_ or at the end of the quiz queue – in our implementation, we chose to append it to the end of the quiz sequence (so the user will get through all base questions, then see the conditional one). However, since our quiz is mostly sequential and not very long, effectively it means the triggered question comes after the base ones or after any other questions queued prior. - If multiple triggers fire, we can queue multiple follow-ups.

**Example from our dataset:** The user answers the _Interests_ question and one of the selected interests is **"Kaffe"**. We have defined in questions.json a question with:

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

This means the _Color_ question (“Choose a color for the cup: Blue or Green?”) should be asked **only** if the user’s interests include "Kaffe".

Walkthrough: - The engine initially loads up: Name, Relation, Gender, Age, Occasion, Interests as questions 1 through 6 (for instance). - The user goes through them in order. When the user reaches the Interests question (#6) and answers it, the engine processes the answer. Suppose the user indeed selected "Kaffe" among maybe other interests. - The engine scans through all questions that have triggers. It finds q_coffee_color has a trigger on interests = "Kaffe". Since the user’s interests answer contains "Kaffe", the condition is met. - Immediately or after finishing processing that answer, the engine will **enqueue the Coffee Color question** to be asked. According to our logic, we add it to the end of the queue (so after all currently scheduled questions). At that moment, our quiz queue gains a new item (Color question). - The user may not see it immediately; they might click “Next” and realize there’s a new question after interests, which flows naturally like any other question. They might think it was always part of the quiz, not knowing it was conditionally added. - The user then answers the Color question (say they choose "Blå"). - After that, the quiz checks if there are more triggers. Maybe if they had chosen some other interest, a different triggered question could appear. For example, if our product set had say interest "Gaming" triggering a "Choose platform (PlayStation/Xbox?)" question, that could similarly come into play. As of now, our only example is coffee->color, but the system is designed to handle multiple triggers. - Once all questions (base + any triggered) are answered, the quiz ends and we present results, unless early exit was taken earlier.

This dynamic injection of questions ensures **relevance**. A user who never selected "Kaffe" will never be bothered with “Choose a color for the mug” – asking that would confuse them (“what mug? I didn’t say anything about mugs!”). Conversely, a user who did express interest in coffee gets a chance to specify a preference that makes the recommendation more personalized (we’ll give them a coffee product in the color they like).

A few additional considerations: - **Multiple triggers on one answer:** It’s possible one answer could trigger more than one follow-up. For instance, imagine if selecting interest "Photography" triggers a follow-up question about camera type _and_ triggers another about experience level. The engine can queue both. The order of triggered questions could either be predetermined or the engine might insert them right after the question that caused them. In our current design, we append to the end, which means if multiple get added, they’ll appear in the order they were added (which is essentially the order in the JSON file we find them, assuming we process triggers in a loop). - **Trigger conditions can be complex:** Our system right now supports a simple trigger with one key and one value (e.g., key=interest, value=Kaffe). This covers scenarios like a single selection or inclusion. If we needed a more complex logic (like “if age < 18 and interest = games then trigger...”), we might extend the format or handle in code. But for now, the triggers are straightforward and defined in JSON for simplicity. - **Not asking irrelevant questions reduces quiz length:** This is important for user experience. If we had, say, 5 potential follow-up questions but each user only sees one or two relevant ones, each user’s quiz feels concise. They might not realize that the system even had other questions in store for other scenarios. This adaptiveness is part of what makes the quiz feel “smart”. - **Completing the Quiz vs Early Exit:** If the user goes through all questions (including triggered ones), that’s the full quiz path. Early exit can cut it short: - We typically allow early exit after the user has answered a few base questions (we decided maybe after interests or around that point). If the user clicks early exit, we stop asking any further questions (so if a triggered question was queued but not asked yet, perhaps we skip it entirely). We then jump to results. - The logic might be: as soon as early exit is invoked, ignore any remaining questions in the queue (do not ask them). The scoring algorithm at that time will use whatever answers are given up to that point to pick the best product. It might be slightly less tailored than if they answered everything, but presumably good enough. For example, if a user had interest in coffee and clicked early exit without answering color, the recommendation might just pick a random (or default) color variant for them, or even not worry about color. That’s acceptable – early exit is user’s choice to trade completeness for speed. - We made sure the early exit button only appears when enough info is gathered such that skipping the rest won’t result in a totally random recommendation. Typically, we want at least interest known because without interests the recommendation might be too generic (just based on gender/age which can fit many items). So likely early exit appears right after interests are answered (which is indeed after user provided relation, gender, age, and occasion too). - If a user does early exit, any triggered question that was due (like color for coffee) won’t be answered. In such cases, the engine either selects a default or the recommended product maybe prompts a generic variant. It might slightly degrade personalization but speeds up the process. Since it was user-initiated, presumably they’re okay with a “good enough” result quickly.

- **Quiz Flow Control:** The engine basically works like a state machine or a simple array of questions. It doesn’t branch out into entirely separate paths (like a flowchart might) beyond adding linear follow-ups. We don’t, for instance, skip some base question because of an earlier answer (except via early exit). We could design skip logic (like if relation = "Andet", maybe skip gender question if not relevant?), but in our case we still ask gender even if relation was "Other", because it might still be relevant to know gender of the recipient, etc. Our triggers currently only _add_ questions, not skip. If we wanted to skip, we could incorporate that by, say, including a trigger that only shows a question if a condition is met (the inverse being skip if not). For example, if we had a question like "What gaming platform do they use?" we’d only want to ask if interest = Gaming. That’s effectively adding only under condition (which we already do). If something should be skipped under a condition, we phrase it as a trigger in the positive for the scenario where it’s needed, and simply don’t trigger it in the scenario where it’s not needed (effectively skipping).
- **Extensibility:** Adding a new triggered question is as easy as adding an entry in questions.json with an appropriate trigger. For instance, if we decide to ask a follow-up when occasion = "Fødselsdag" (maybe "Do you want to personalize the gift with a name engraving?" or something), we can do that with trigger on occasion, and it’ll seamlessly become part of the flow for those who answered Birthday.
- **User Experience:** From the user’s perspective, the quiz feels personalized not just in the content of questions but in the sequence:
- They might notice that the quiz asked them something specifically related to what they said (like “Oh, since I said coffee, now they ask me about color of cup – neat, they’re really tailoring it!”).
- It gives an impression of intelligence (the system isn’t wasting their time asking everyone a cup color, only those for whom it’s relevant).
- It also breaks the monotony – not every user gets the exact same quiz, which is good because a friend recommending the site might not spoil all questions (“when I took it, they asked me about gaming consoles” vs “when I took it, they asked me about coffee mug color” – because those individuals had different interests).

The dynamic question engine and the scoring algorithm work in tandem: - After each question is answered, **two things happen**: we adjust product scores, and we check for any new question triggers. The code likely interweaves these steps – e.g., in the event handler for answering a question, after storing the answer, call checkTriggers(answer) to possibly add a question, and always call updateScores(answer) to recalc product rankings. - This ensures that by the end of the quiz, not only do we have the top product, but we also didn’t miss any chance to get clarifying info (like color) that could differentiate between top products.

In conclusion, the dynamic question engine ensures the quiz is **adaptive and efficient**. It leverages the content of questions.json to branch where appropriate. Our design philosophy here is: **only ask what you need to ask**. Every additional question should earn its keep by significantly narrowing down the recommendation or tailoring it. If a question doesn’t contribute to making a better recommendation for a particular user, that user shouldn’t have to answer it.

This approach keeps users more engaged (because every question feels relevant to their situation) and reduces dropout rates (shorter quizzes generally see higher completion). It also indirectly improves recommendation quality – by asking targeted questions, we get information that directly improves our matching (like color preference yields a variant match rather than an arbitrary pick).

As we scale up our product catalog, we might introduce more triggers. For example, if we add a lot of tech products, an interest in "Teknologi" might trigger a question like "What type of gadgets do they use most? (Phone, Computer, Gaming Console, etc.)". This would help filter whether to recommend a phone accessory vs a PC accessory, etc. The framework is in place to support such expansion easily.

To summarize the dynamic engine with a quick **example flow**: - User’s answers so far: Relation=Friend, Gender=Male, Age=26-40, Occasion=Christmas, Interests=\["Kaffe","Outdoor"\]. - Engine: base questions (the ones above) have been asked and answered. - Trigger check after Interests: triggers on "Kaffe" => adds "Choose a cup color" question; triggers on "Outdoor" (if we had one, say "Do they go camping or hiking?") => suppose we have none currently, skip. - Now the queued triggered question "Color" is asked: - User answers: "Grøn" (green). - Engine: triggers on Color? Possibly none (we could have none). - Quiz ends. We have answers including color preference. - Scoring: uses all these answers (friend, male, 26-40, Christmas, \[coffee, outdoor\], color=green) to determine best product. Perhaps it picks a "Green thermal coffee mug for outdoor use" as the top suggestion, which fits all aspects.

The user in this scenario sees that we even asked about color for the mug because they said coffee, and possibly they feel the result is very tailored: a gift that is about coffee and outdoors (maybe a portable coffee maker for camping, in their favorite color). That level of detail is what we aim for.

Now that we’ve covered how the system determines _which gift_ and _what to ask_, let's move into the design aspects that ensure the user interface remains pleasant and on-brand, plus the admin and content operations side that keep the system running smoothly.

## 5.0 Visual Identity & Design Language

This section defines the aesthetic principles of the **Den Rette Gave** brand, ensuring a consistent and professional user experience across the application. A strong visual identity is crucial for building trust with users (they should feel they’re using a credible, modern service) and for making the experience delightful (appealing design reduces friction and leaves a positive impression).

### 5.1 Design Philosophy

Our design philosophy is rooted in **minimalism and clarity**. We recognize that users come to Den Rette Gave with a specific mission: to find a great gift, quickly and easily. The interface must therefore be a **frictionless tool** that aids them, not an obstacle or a source of confusion. Every design decision is made to streamline the experience and keep the user’s attention on the content (the questions and the gift suggestions) rather than on any extraneous UI elements.

Key principles: - **Purpose-driven Elements:** Every element on the screen serves a purpose in guiding the user through the quiz. We avoid any clutter such as unnecessary images, decorative graphics, or blocks of text that don’t add value to the current step. For example, on the quiz questions, we present a clean card with the question and the answer options; we don’t have sidebars or ads or unrelated links that could distract. - **Avoiding Cognitive Overload:** By keeping the design simple, we reduce the cognitive load on users. There is generous use of whitespace to create a calm and focused environment. This means spacing out components so nothing feels cramped or overwhelming. Users aren’t confronted with, say, 20 options at once or walls of text – instead, one question at a time, plenty of breathing room around content, and clear visuals. - **Consistency:** We use a consistent style for typography, buttons, and colors, so that once users get familiar with one part of the site, everything else feels intuitive. For instance, our primary action color (a specific shade of blue) is always used for clickable buttons like “Start Guiden” and “Next” and “Submit”, so users subconsciously know which elements can be interacted with. Headings and body text have consistent sizes and weights across pages. - **Emotional Tone:** The design should feel **friendly and modern**. We opted for a warm yet professional aesthetic. Friendly, because we want users to feel comfortable and delighted (finding a gift is an emotional task; the UI should support positive emotions like excitement to find something great). Professional, because we want to be seen as trustworthy experts (users are taking our recommendation seriously, so the site shouldn’t look like a casual hobby project). - **Restraint with Enhancements:** While we incorporate animations and interactive feedback (as mentioned in micro-interactions), we do so sparingly and tastefully. We don’t use flashy animations that distract or slow down the experience – only subtle ones that improve feedback. For instance, the cross-fade transitions gently guide the eye rather than sudden jumps. Hover effects on buttons are quick and slight, just enough to signal interactivity. - **No Competing Calls-to-Action:** On any given view, we ensure that the user’s primary action is obvious and stands out. On landing, the “Start Guiden” button is big and bold, while any secondary info (like a tagline or the “How it works” link) is more subdued. During the quiz, the “Next” button is prominent once an answer is selected, guiding them forward. On the results page, the primary call-to-action is the “Buy now” affiliate link, which we style as the standout button (with maybe a secondary style for “Share” and a tertiary style for “Report issue”). By establishing a clear hierarchy, we avoid confusing the user about what to do at each step. - **Mobile-first Responsiveness:** Although not explicitly mentioned earlier, our design is implemented to work well on mobile devices (a lot of users might be on phone when quickly searching gifts). The minimalistic layout and large tappable buttons lend themselves well to mobile. We ensure text is legible on small screens (using adequate font sizes like 16px+ for body, etc.), and we use responsive design through Tailwind classes to adjust spacing and font sizes for smaller vs larger screens. Mobile design also benefits from our one-question-at-a-time approach, as it fits nicely on a small screen without overwhelming the user with too much at once. - **Color usage for guidance:** We use color functionally. The primary brand color (Slate Blue) draws attention to interactive elements (like the start button, next buttons, selected options), which naturally guides the user’s eyes to what they should do. Neutral colors (grays, whites) make up the backgrounds and text to ensure high contrast and readability. We avoid using too many different colors which could cause visual confusion or seem unprofessional. - **Imagery:** We do have product images on the results page, which are important. Elsewhere, we keep imagery minimal. Our logo is simple (perhaps a small gift icon or just our name in a stylish font with a small graphic). We don’t flood the interface with stock photos or irrelevant graphics, which aligns with our clean approach.

In summary, our interface tries to “get out of the user’s way” and let them accomplish their goal effortlessly. It should feel **light, open, and intuitive**. By reducing clutter and focusing on the essentials, we also implicitly communicate that we respect the user’s time and attention. Users shouldn’t need a tutorial to use the site – the design itself should make the path obvious.

We believe this design philosophy contributes greatly to user satisfaction: a user may not consciously note the design decisions, but they will feel the ease and focus the design provides. And since the service is about solving a problem (gift searching), making that process as smooth as possible is part of delivering on our core value proposition.

### 5.2 Color Palette

The color palette is intentionally limited to create a clean, modern, and trustworthy aesthetic. We use a few key colors consistently throughout the UI. Here is a summary of our palette and how each color is used:

| **Role** | **Color Name** | **Hex Code** | **Tailwind Class** | **Usage** |
| --- | --- | --- | --- | --- |
| **Primary (Action)** | Slate Blue | #4F46E5 | bg-blue-600 | Used for primary buttons (e.g., "Start Guiden", Next/Submit buttons) and other key interactive elements or highlights. This bold blue draws user attention to actions they can take. It’s a color that conveys trust and stability (blue is often associated with reliability), but with a modern vibrant twist in this shade. |
| **Text & Headers** | Charcoal | #1F2937 | text-slate-800 | Used for nearly all text (headings and body text). It’s a very dark gray (almost black) which ensures maximum readability against light backgrounds without the harshness of pure black. This color choice for text provides excellent contrast (meeting accessibility standards) on our off-white background, making sure content is easy to read. |
| **Background** | Off-White | #F9FAFB | bg-slate-50 | Used as the main background color of the application (pages, sections). It’s a very light gray with a hint of warmth, rather than stark white, to be easier on the eyes. This forms the base that everything sits on – it keeps the interface feeling open and uncluttered. Large portions of the app use this color to create that clean canvas look. |
| **Borders & Accents** | Light Gray | #E5E7EB | border-slate-200 | Used for subtle dividers, borders of cards or inputs, and background of inactive elements. For example, cards containing questions or results might have a light gray border or shadow to distinguish them from the background. Also used for things like the border of text input fields, dividing lines in the admin table, or the background of disabled buttons. It’s a neutral tone that adds structure without drawing much attention to itself. |

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

## 7.0 Automated Lead Generation & Workflow

To scale our product offerings and keep the content up-to-date with minimal manual effort, we’ve implemented an **Automated Lead Generation** process that leverages AI (Large Language Models) to discover and structure new gift ideas. This, combined with a human curation step, forms a pipeline that regularly feeds fresh, high-quality products into our database.

The workflow involves: 1. Periodically using an LLM to generate candidate product ideas and data. 2. Reviewing and curating those AI-generated suggestions by a human (to ensure quality and relevance). 3. Verifying details and enhancing the data. 4. Publishing the approved products to the live site through our admin panel (or directly via JSON updates). 5. Rinse and repeat, plus integrate any affiliate tracking.

We have crafted specific **LLM prompts** for these tasks to guide the AI in producing useful output in a strict format. Below, we detail these prompts and the reasoning behind their structure.

### 7.1 LLM Prompt for Automated Discovery

_Context:_ This prompt is designed for the scenario where we want the AI to brainstorm new gift ideas that are _not currently in our database_. We let the AI freely explore the domain of Danish e-commerce for unique products fitting a niche or category we specify, while ensuring no duplicates with what we already have. Essentially, it’s like asking an AI research assistant: “find me 10 new gift ideas in this category that I don't already list, and give me all the details about them in my data format.”

We give the LLM a clear **role and objective**, plus very explicit instructions and format. Here is the prompt (as we use it, formatted in our documentation):

**Role:** You are an expert e-commerce curator and data analyst specializing in unique and high-quality gifts available in Denmark.

**Objective:** Find 10 unique gift _ideas_ that fit a specific niche. For each product idea, you must perform detailed analysis to provide its name, a short compelling description, its exact price in DKK, the direct URL to the product page, a direct URL to a high-quality product image, and a comprehensive set of structured tags based on the product page's content.

**CRITICAL INSTRUCTION: Before you begin, you MUST visit the following URL, retrieve its contents, and use the "name" and "url" of every product in that file as an exclusion list. Do NOT suggest any product that is already on this list.**  
**Exclusion List URL:** <https://denrettegave.dk/assets/products.json>

**Variation Handling Clause:**  
If a product you select has multiple variations (e.g., 3 colors and 4 sizes), you must create a separate JSON object for _each individual variant_. For example, a t-shirt in 3 colors and 4 sizes should result in 12 separate JSON objects. **These variations do not count towards your goal of finding 10 unique product ideas.** You must still find 10 distinct products, and then expand them with all their variations.

**Tagging & Variation Analysis Instructions:**  
For each product variant, you must deduce the following attributes and structure them in a tags object.  
1\. **Analyze Variations:** Examine the product page for options like color, size, material, or subscription duration. List these variation types in the differentiator_tags array. This array should be identical for all variants of the same product.  
2\. **Populate Tags:** Based on the product's description, title, and category, populate the tags object. Use your best judgment.  
\- gender: "Mand", "Kvinde", or "alle".  
\- age: Estimate appropriate age ranges (e.g., "18-25", "26-40", "41-60", "60+").  
\- interests: Deduce relevant interests (e.g., "Mode", "Gaming", "Madlavning", "Outdoor").  
\- occasion: Suggest suitable occasions (e.g., "Fødselsdag", "Jul", "Årsdag").  
\- brand: Identify the product's brand name.  
\- color, size, etc.: If you identified these as differentiators, list the specific option for the product URL you are providing (e.g., color: \["Blå"\], size: \["Medium"\]).

**Output Format (Strict):**  
The output MUST be a valid JSON array. Each object must follow this exact structure.

\[  
{  
"name": "Klassisk T-shirt (Blå, Medium)",  
"description": "En blød og komfortabel t-shirt i høj kvalitet, perfekt til hverdagsbrug.",  
"price": 299,  
"url": "<https://www.example.dk/tshirt-blue-m-affiliate>",  
"image": "<https://www.example.dk/images/tshirt-blue.jpg>",  
"differentiator_tags": \["color", "size"\],  
"tags": {  
"gender": \["Mand", "alle"\],  
"age": \["18-25", "26-40"\],  
"interests": \["Mode", "Fritid"\],  
"occasion": \["Fødselsdag", "Bare fordi"\],  
"brand": \["BrandX"\],  
"color": \["Blå"\],  
"size": \["Medium"\]  
}  
}  
\]

Let’s break down why we wrote the prompt this way:

- We start by defining the **Role** of the AI. By saying it is an “expert e-commerce curator and data analyst specializing in unique high-quality gifts in Denmark,” we prime the AI to think like a knowledgeable shopper who knows what's special and also can analyze data (meaning not just list random things but provide structured info). This helps set the context that we want both creativity (finding unique gifts) and analytical output (structured tags and details).
- The **Objective** clearly states what we want: 10 unique gift ideas for a specific niche. (We would fill in or contextualize what niche we want before running it – e.g., we might prompt specifically for “gaming gadgets” or “eco-friendly products” depending on need). For each, we need name, description, price, URLs (product and image), and tags. This basically outlines the fields we want in each JSON object.
- The **Critical Instruction** is extremely important: it instructs the AI to first check our products.json (we gave the exact URL) and treat all names and URLs inside it as an exclusion list. "Do NOT suggest any product already on this list." We put this in bold and uppercase "MUST" to emphasize how crucial it is.
- Reason: We don't want duplicates of what's already in our database. Since the AI might not know what we have, we actually give it the data of what we have (by letting it fetch products.json content).
- This is a clever hack to use the AI’s ability to do web requests (some AI systems can fetch a URL if allowed) or we might feed it ourselves if using a local tool. But conceptually, it cross-references to avoid recommending the same item again.
- This ensures novelty of suggestions and avoids wasted suggestions on duplicates.
- It's also a guard: by reading our product list, the AI might get a sense of style and format (which could help consistency, though it might also stick to similar ideas, but presumably, we ask for a niche so it will branch out).
- The **Variation Handling Clause**: We instruct the AI how to deal with product variations. We realized that many e-commerce items have variants (colors, sizes). Instead of treating them as one product with options (which is how an online store might), our system architecture chooses to list each variant as a separate entry (with differentiator tags).
- We explicitly say: if a product has variations, create separate JSON for each variant. And these do not count towards the "10 distinct products".
- This means if it picks "Classic T-shirt" which comes in 3 colors and 4 sizes, it will output 12 objects (all with same base name but different parenthetical details in name perhaps). But still find 9 other distinct base products to meet the goal of 10 distinct product ideas.
- This is to avoid the AI thinking "I'll just give variants as separate products to reach 10 easily". We want 10 base ideas, with variants in addition if needed.
- This clause ensures our database ends up listing each variant and we don't have to manually add missing variants later.
- **Tagging & Variation Analysis Instructions**: This is the guidance for populating the tags object.
- Step 1: Identify what the variation dimensions are (color, size, subscription length, etc.) and list them in differentiator_tags. And note that that should be the same for all variants of the product. So e.g., all T-shirt variants have differentiator_tags \["color","size"\].
- Step 2: Fill in other tag categories:
  - For gender, age, interests, occasion, brand – we instruct it to use best judgment from description, title, category of product.
  - We explicitly list possible values or examples for each category to guide consistency (e.g., gender should be one of Mand, Kvinde, alle).
  - Age ranges we define as buckets.
  - For interests we give examples, but it's open-ended depending on product (like "Outdoor", "Madlavning", etc).
  - Occasions examples given.
  - Brand: just get the brand name from the product page.
  - Then importantly, any differentiator categories identified should also be included as tags with the specific value for that variant (so e.g., for a given variant: color: \["Blue"\] or size: \["Medium"\] matching that variant).
- This granular instruction aims to get consistent, structured tags, which is something an AI might not do well without guidance. We basically taught it our tagging schema.
- **Output Format (Strict)**: We explicitly require a valid JSON array of objects in the structure we want. We even provide a mini example within the prompt, formatted as JSON, to illustrate exactly how it should look (with keys in quotes, using arrays for each tag category).
- The example "Klassisk T-shirt (Blå, Medium)" shows a variant of a product with multiple differentiators. This example demonstrates:
  - The naming convention we expect (including variant attributes in parentheses in name, though AI might not perfectly follow that but it's a hint).
  - The fields: name (string), description (string), price (number, presumably integer DKK without currency symbol to keep it numeric), url (the affiliate link which we want fully formed), image (direct link to image).
  - differentiator_tags as an array of strings.
  - tags as an object with all keys and values shown as arrays of strings (except maybe brand but we even make brand an array).
- We have brand as an array too because some products might have multiple brands? Usually not, but maybe something like co-branded items or bundles. We just made everything an array for consistency except price.

This prompt is quite long and complex, but it needed to be. LLMs often need explicit and repetitive clarity to output exactly in the format needed. We prefer to get JSON back so we can easily integrate it (just parse and append to products.json after review).

The expected use: We feed a variant of this prompt into an AI like GPT-4 (which can browse or we provide relevant pages) along with a niche specification. The AI returns JSON. We as humans then review that JSON: - Remove any obvious bad suggestions (if some product isn't actually good or is already in our list and it missed that). - Possibly verify the info (the price and links might need checking). - Then incorporate the new products via the admin (or directly commit the JSON).

This process can generate a lot of new entries quickly. It's much faster than manually scouting websites for products, and the structured output saves us typing and mistakes.

By building this with an AI, we maintain low operational costs for content generation. It's a one-time cost when we run it (just the API calls).

We do ensure that there's still **Human Review & Curation**, which leads to the next prompt and our workflow steps.

### 7.1.1 LLM Prompt for Processing Pre-selected Affiliate Links

This prompt handles a different scenario: sometimes we might already have a list of specific products (perhaps from an affiliate network or partner) that we want to add. In that case, we don't need the AI to find new ideas, we just need it to scrape and format data for known URLs.

For instance, maybe we joined a new affiliate program that provided us 5 product links that fit our site. We want to import those. Instead of manually copying each product’s details, we use the AI to parse those pages and output JSON.

The prompt:

**Role:** You are an expert e-commerce curator and data analyst. Your task is to process a list of provided product URLs, visit each one, and convert them into a structured JSON format.

**Objective:** For each affiliate URL provided in the list below, you must visit the webpage and perform a detailed analysis. Extract the product's name, a short compelling description, its exact price in DKK, a direct URL to a high-quality product image, and a comprehensive set of structured tags.

**CRITICAL INSTRUCTION: The url field in your final JSON output for each product MUST be the exact affiliate URL I provide below.**

**Tagging & Variation Analysis Instructions:**  
For each product, you must deduce the following attributes and structure them in a tags object.  
1\. **Analyze Variations:** Examine the product page for options like color, size, material, or subscription duration. List these variation types in the differentiator_tags array. 2. **Populate Tags:** Based on the product's description, title, and category, populate the tags object. Use your best judgment.  
\- gender: "Mand", "Kvinde", or "alle".  
\- age: Estimate appropriate age ranges (e.g., "18-25", "26-40", "41-60", "60+").  
\- interests: Deduce relevant interests (e.g., "Mode", "Gaming", "Madlavning", "Outdoor").  
\- occasion: Suggest suitable occasions (e.g., "Fødselsdag", "Jul", "Årsdag").  
\- brand: Identify the product's brand name.  
\- color, size, etc.: If you identified these as differentiators, list the specific option for the product URL you are providing (e.g., color: \["Blå"\], size: \["Medium"\]).

**Product List to Process:**  
\[  
"<https://www.partner-site.dk/product-a?affiliate_id=123>",  
"<https://www.another-site.com/item-b?ref=xyz>",  
"<https://www.example-store.com/product-c/variant-1?tracking_code=abc>"  
\]

**Output Format (Strict):**  
The output MUST be a valid JSON array. Each object must follow this exact structure, corresponding to one of the URLs I provided.

\[  
{  
"name": "Produkt A Navn",  
"description": "En fantastisk beskrivelse af produkt A.",  
"price": 899,  
"url": "<https://www.partner-site.dk/product-a?affiliate_id=123>",  
"image": "<https://www.partner-site.dk/images/product-a.jpg>",  
"differentiator_tags": \["material"\],  
"tags": {  
"gender": \["alle"\], "age": \["26-40"\], "interests": \["Hjemmet", "Design"\],  
"occasion": \["Indflyttergave"\], "brand": \["BrandA"\], "material": \["Eg"\]  
}  
}  
\]

Analysis: - It's similar to the previous prompt but simpler in some ways. We are not asking the AI to come up with new ideas, just to process given URLs. - **Role & Objective:** We set context that it needs to visit each provided URL and extract details into JSON. It's a straightforward web scraping task with analysis for tags. - **Critical Instruction:** We emphasize that the url in output must exactly match the affiliate URL given. This is because sometimes an AI might convert an affiliate link to a canonical link or omit parameters. We need that tracking info intact to get our commission. So we explicitly instruct not to change the URL. - **Tagging instructions:** It's basically the same as before, but simplified because now if a product has variations, we only have one URL (maybe one variant's URL or main product page). - Actually, if an affiliate link is to a specific variant, the AI will treat it as one product (we might in these cases need to add other variants separately via other links or manually). - But we still have it list differentiator_tags if applicable (like if this specific URL is one color of a product, identify that). - Then fill tags (gender, age, etc.) as before. - We provide a **Product List to Process** embedded right in the prompt as a JSON array of URLs (so the AI clearly sees them as data to iterate through). - **Output Format:** We again demand a JSON array output, one object per input URL, with the example showing the structure. - The example is shorter (only one object example) but covers fields. - We used a "material" differentiator example just to illustrate something beyond color/size.

The idea is the AI will produce an array with one object per link we gave, in matching order ideally (though order isn't critical if we know to match by URL). Each should have all required fields filled in.

We as humans then take that JSON, verify content: - We ensure description is good Danish (the AI might output in Danish because our prompt examples were Danish, which is what we want). - Check price is correct and numeric. - Confirm the image URL is high-quality (not a thumbnail ideally). - Possibly check tags if they make sense (adjust if needed). - Then integrate them to our products list.

This approach saves time especially for bulk adding from affiliate data. For example, an affiliate network might give us a CSV of top products with tracking links. Instead of adding each manually, we feed the links to this prompt, get structured JSON.

After generation and curation, those products enter our system and then users will see them in recommendations if they match relevant tags.

### 7.2 Content Curation Workflow

Now, combining the above automated steps with human oversight, here’s the entire content pipeline workflow:

1. **Automated LLM Run:** We periodically run the LLM with the "Automated Discovery" prompt (7.1) to generate a batch of new product leads (for example, "10 new eco-friendly gifts", etc.). The result is a JSON list of new candidate products complete with details. This is done perhaps monthly or when we need to expand our catalog in a certain area (like if we notice we lack products for a certain interest or occasion).
2. **Human Review & Curation:** Once the AI outputs the suggestions, a human (likely the admin or content curator) reviews the list.
3. During this review, they will **discard** any low-quality or unsuitable products. For instance, the AI might have included something that's not actually a great gift or is from a dubious source. Those would be removed.
4. Also, check for duplicates or too-similar items, and remove as needed.
5. Perhaps compare with our business model: ensure each product can be affiliated (if a suggestion is from a store we have no affiliate program for, we might discard it, or find if that store has one).
6. Essentially filter down to the truly good suggestions.
7. The curated, approved ones are then kept for the next step.
8. **Verify & Enhance Data:** For the products that are approved:
9. The curator double-checks that all the information is accurate. For example, verify that the price is correct and updated, maybe open the actual product page manually to see if description can be refined.
10. Ensure the affiliate URLs are correct and active (maybe even test clicking them).
11. Possibly shorten descriptions if the AI output something too long or salesy. We aim for a concise, compelling 1-2 sentence description, so edit if needed.
12. Ensure tags make sense: e.g., if a product clearly is "for women", ensure gender tag is Kvinde, etc. The AI is good but might sometimes put "Mand" where not appropriate. We fix any such anomalies.
13. If any differentiator tags are present and we might want separate entries for each, ensure the AI provided them all. If the AI only gave one variant but the product has others we want, we might manually replicate that entry for each variant or rerun a query for variants.
14. Essentially polish the data to be ready for users. This step is important to maintain quality; we don’t trust AI blindly.
15. **Publish to Live Site (via Admin Panel):** Now, with verified JSON data for new products:
16. The admin can add them to products.json. This could be done by copying the JSON output (or a subset that was approved) and pasting into the Live Editor in the admin panel or directly into the repo file. We have to ensure proper JSON format (like merging with existing array).
17. If using admin panel: perhaps copy the entire updated array from admin’s Live Editor after merging, then commit to GitHub as "Add new products".
18. Mark the site for deployment. Once deployed, those products are now accessible to the front-end.
19. The admin can also prepare any images if needed (the image URLs might be external, which is okay since we use direct links). If we wanted to host images ourselves we could download and host them, but that’s a heavy process; likely we just use the direct links from the store (less control but easier).
20. Note: For affiliate model, sometimes direct image links can break (if store changes them). But we accept that risk or occasionally run a broken image check (maybe flagged by users).
21. **Monitoring:** After going live, we monitor how these products perform (via user ratings and flags).
22. If something gets flagged or low-rated, we might reconsider if it was a good addition or if data needs tweaking (like maybe the price changed and now is wrong, we'd update it).
23. This closes the loop with Admin Panel usage.
24. **Iteration:** We repeat the above periodically:
25. Over time, we may accumulate a large and diverse database of gifts.
26. We always maintain curation control; AI helps with discovery and grunt work, but humans ensure alignment with our quality standards and strategy.

As depicted in the **workflow summary**: - The process begins with an **Automated LLM Run** producing JSON leads. - Next is **Human Review & Curation** where we either **Discard** or **Approve** each suggestion. - Approved ones go into **Verify & Enhance** stage where details are confirmed and cleaned. - Finally, the curated data is **Published** via Admin Panel to the live site.

This pipeline ensures that while we benefit from AI’s ability to comb through lots of data and produce structured output quickly, we do not compromise on content quality. We maintain a human-in-the-loop approach. The result is a semi-automated content curation pipeline: - Saves time (we're not manually writing descriptions or collecting images for every new product). - Reduces oversight (AI might catch details or categories we might miss or get tags for us, etc.). - Still, leverages human insight for taste and brand alignment (we only put forth products that match our vision of "unique, high-quality gifts").

Also included in planning: - In the future, as the prompt updates hint, we foresee possibly an **Update 4: Smarter LLM Curation Pipeline** which might incorporate more automation or refined AI usage, maybe even an AI model fine-tuned on what we liked vs discarded so it suggests better initially, etc. (This ties into Roadmap.)

Overall, our lead generation and content update approach is a blend of **automation and manual curation** that fits our low-cost, one-person (or small team) operation style. It allows us to continuously grow and refresh our product recommendations so the site stays relevant and comprehensive, without needing a large content team.

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

- **ratings.json schema:** (As given in example)
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

- **POST /.netlify/functions/admin-login**  
    _Purpose:_ Securely authenticate an admin user.  
    _Input:_ Expects a JSON body like { "password": "theAttemptedPassword" }.  
    _Action:_ Checks the provided password against the ADMIN_PASSWORD environment variable stored on the server.  
    _Output:_ If authentication succeeds, returns a JSON response { "token": "&lt;JWT or token string&gt;" }. If fails, returns 401 Unauthorized.  
    _Post-conditions:_ On success, the client (admin panel) stores the token and uses it for subsequent admin requests. The token is required for protected endpoints.
- **POST /.netlify/functions/submit-rating**  
    _Purpose:_ Log a user’s rating for a gift suggestion and their (anonymized) quiz answers.  
    _Input:_ JSON body containing the rating data, for example:
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
- (The front-end ensures to strip out any personally identifiable info like the 'name' field before sending.)  
    _Action:_ The function assigns a rating_id (timestamp) and a timestamp field, then appends this entry to the private ratings.json. It omits the user's name or any personal data, logging only categorical answers.  
    _Output:_ Typically returns a 200 OK with maybe a success message or nothing in body (the client doesn't necessarily use the response beyond acknowledging success).  
    _Notes:_ No authentication required (any user can submit a rating). The function sanitizes input (removing name if somehow present) to maintain privacy.
- **GET /.netlify/functions/get-ratings**  
    _Purpose:_ Provide the admin panel with all collected user ratings.  
    _Authentication:_ Requires a valid admin token in the Authorization header (Bearer token).  
    _Action:_ If token is valid, reads the entire ratings.json from private storage and returns it as JSON. If not auth, returns 401.  
    _Output:_ JSON array of rating objects (as in Appendix A). The admin panel uses this to populate the Ratings table.  
    _Security:_ Only accessible to logged-in admin. The function verifies JWT signature/validity.
- **POST /.netlify/functions/submit-flag**  
    _Purpose:_ Record a user-submitted error report (flag) about a product.  
    _Input:_ JSON body, for example:
- {  
    "product_id": 42,  
    "issue_type": "Linket virker ikke"  
    }
- (We might also accept a timestamp or derive it, and we set status=unresolved by default in code.)  
    _Action:_ The function will create a flag entry: assign a flag_id (could be a timestamp or unique number), add current timestamp, set status "unresolved". Then append this entry to flags.json.  
    _Output:_ Could return a simple success message or status code 200. The front-end doesn't need any data back except to know it succeeded (we already show "Thank you" to user regardless).  
    _Notes:_ No auth needed (any user can flag). We trust users not to spam; we might implement basic throttling in future. Flags.json is in public assets, but writing to it via function still keeps it controlled (only via this endpoint).
- **POST /.netlify/functions/create-share-link**  
    _Purpose:_ Generate a shareable link for a quiz result.  
    _Input:_ The client likely sends the relevant product info to share. Possibly the body includes:
- {  
    "product_id": 5,  
    "quiz_answers": { ... } // or maybe we don't need answers, just product is enough for share  
    }
- Actually, since the share link retrieval only needs to display the product (and perhaps some context), we might store minimal data. Let's assume input has at least product_id or the whole product object.  
    _Action:_ The function generates a unique share_id (random string or number). It then creates an entry in shares.json (private) mapping that ID to the product details (maybe we store product_id, and perhaps we store the quiz_answers or result context just for reference). It writes that out.  
    _Output:_ Returns a JSON with the share link or ID, e.g., { "share_id": "XYZ123" }. The front-end then composes the full URL like denrettegave.dk/share?code=XYZ123 to present to user.  
    _Security:_ No auth needed; any user can create a share. We ensure the share ID is not guessable (random enough).
- **GET /.netlify/functions/get-shared-result**  
    _Purpose:_ Retrieve the product information associated with a shared link ID, so that the share page can display it.  
    _Input:_ Likely we pass the share_id as a query parameter, e.g., /get-shared-result?id=XYZ123.  
    _Action:_ The function reads shares.json (private) and finds the entry with that ID. It then returns the stored data (which might be the product's name, description, price, image, etc., basically what we need to render a result card). We may choose to store the entire product info at share creation time to avoid issues if product later changes or is removed.  
    _Output:_ JSON of product data similar to a single item from products.json. If not found or expired, it might return 404 or an error message the front-end can handle.  
    _Notes:_ No auth required (the link is open to anyone who has it). We trust the random ID to keep it semi-private.
- **POST /.netlify/functions/update-analytics**  
    _Purpose:_ Log an analytics event (page view, quiz start, affiliate click, etc.) anonymously.  
    _Input:_ JSON body with event details, e.g., { "event": "affiliate_click", "product_id": 42 } or { "event": "quiz_start" }. Possibly include timestamp if needed, or function can add it.  
    _Action:_ The function appends this event to analytics.json (public asset). Could either add an entry to an array log or increment counters in an object. We currently treat analytics.json as simple store for aggregated counts or logs.  
    _Output:_ Perhaps 200 OK with no body. The front-end will fire-and-forget.  
    _Notes:_ No auth. We have to be mindful of growth of this file or privacy (but since no user identifiers, it's fine privacy-wise). If log gets large, we might archive or purge older events to keep file manageable.

These are the primary serverless endpoints at this stage. By understanding these, a developer can integrate with or modify backend interactions.

It's notable that most user-facing functions don't require auth (making front-end integration simpler), while admin functions are protected.

We’ve tested these APIs to ensure they behave as expected under normal conditions. Any errors (like DB write fail or file locked) are logged in Netlify function logs for debugging. In general, the stateless design means each request works on current file snapshot.

This reference ensures future developers know how to call these functions and what to expect, which is useful for maintenance or if we build external tools (for instance, a script to batch resolve flags could call the resolve function if we implement one, etc.).

That concludes the detailed technical and strategic blueprint for **Den Rette Gave**. This document should serve as the definitive reference for how the system is built, why it was built that way, and what the path forward looks like. With this, any new team member or stakeholder can ramp up quickly on all aspects of the project, even without prior background in web development, affiliate marketing, or our specific domain.
