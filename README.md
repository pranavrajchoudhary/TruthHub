# 📰 TruthHub — Decentralized & Community-Driven News Aggregator & Fact-Checker 

### 🌐 Live Demo  
🔗 [TruthHub Website](https://news-aggregator-gules.vercel.app/auth)

---

## 📖 Overview

**TruthHub** is a **community-driven decentralized news aggregation platform** designed to combat misinformation through **collaborative fact-checking**, **source reliability scoring**, and **transparent moderation**.  
Users can submit articles, verify claims, upvote credible content, and collaboratively build a more trustworthy information ecosystem.

---

## 🚀 Features

### 🧑‍💻 1. User & Content Submission  
- Registered users can submit news articles via URL, headline, and summary.  
- Extracts full article content and auto-categorizes topics.  
- Supports tagging for better discoverability.

### 👍 2. Community Voting System  
- Users can upvote/downvote articles and annotations.  
- Rankings are dynamically adjusted based on community consensus.  

### 🕵️ 3. Collaborative Fact-Checking  
- Users can highlight specific claims within articles.  
- Add supporting/refuting evidence with source links.  
- Other users can vote on annotation credibility.  

### 📊 4. Source Reliability Scoring  
- Tracks and updates reliability scores for each source.  
- Scores reflect historical accuracy based on verified fact-checks.  

### 🔔 5. Topic Subscriptions & Real-Time Alerts  
- Subscribe to categories or keywords of interest.  
- Get instant alerts for new articles or critical fact-check updates.  

### 🏆 6. User Reputation System  
- Gamified scoring system for meaningful contributions.  
- Higher reputation grants greater influence in moderation and voting.  

### 🛡️ 7. Admin & Moderation Tools  
- Admin panel for reviewing content and managing users.  
- Tools for resolving flagged disputes and community reports.  

---

## ⚙️ Tech Stack

| Layer | Technology |
|-------|-------------|
| **Frontend** | React.js |
| **Backend** | Node.js + Express.js |
| **Database** | MongoDB |
| **Authentication** | JWT (JSON Web Token) |
| **Real-time Communication** | Socket.IO |
| **Deployment** | Vercel (Frontend), Render/AWS/DigitalOcean (Backend) |

---

## 🧩 Core Modules

1. **Authentication & User Management**  
   - Secure registration, login, JWT-based sessions.  
   - Role-based access (User/Admin).

2. **Articles & Content Management**  
   - CRUD operations for news articles.  
   - Category and tag-based filtering.

3. **Fact-Checking & Annotations**  
   - Highlight text and attach claims with evidence.  
   - Community credibility voting system.

4. **Source Reliability Engine**  
   - Dynamic reliability scoring per news source.  

5. **Reputation & Gamification**  
   - Points-based recognition for verified contributions.  

6. **Subscriptions & Notifications**  
   - Real-time alerts using WebSockets or Push API.

7. **Admin Moderation Dashboard**  
   - Manage users, articles, and flagged content.  

---

## 🧠 API Overview

| Category | Endpoints |
|-----------|------------|
| **Auth** | `/auth/register`, `/auth/login`, `/auth/me` |
| **Articles** | `/articles`, `/articles/:id`, `/articles/:id/status` |
| **Voting** | `/articles/:id/vote`, `/annotations/:id/vote` |
| **Annotations** | `/articles/:articleId/annotations`, `/annotations/:id` |
| **Sources** | `/sources`, `/sources/:id` |
| **Subscriptions** | `/subscriptions`, `/subscriptions/:id` |
| **Admin** | `/admin/articles/pending`, `/admin/moderate/article/:id` |

---

## 🗓️ Development Timeline

| Week | Backend | Frontend |
|------|----------|-----------|
| **Week 1** | Auth APIs, News CRUD | Auth UI, News Feed, Article Submission |
| **Week 2** | Voting, Annotations, Fact-Checks | Article View, Voting UI, Annotation UI |
| **Week 3** | Source Scoring, Subscriptions, Reputation | Source Reliability, Subscriptions |
| **Week 4** | Admin Tools, Notifications, Testing | Admin Dashboard, Real-Time Alerts |

---

## 🔐 Security & Validation

- Secure password hashing using **bcrypt**.  
- Input validation and error handling across endpoints.  
- Protection from duplicate votes, spam, and manipulation.  

---

## 🧪 Testing & Quality Assurance

- Unit and integration testing for all major modules.  
- End-to-end testing for key user flows (submission → verification → moderation).  
- Continuous code review and refinement for performance optimization.

---

## ☁️ Deployment

- **Frontend** hosted on [Vercel](https://vercel.com).  
- **Backend** deployed on cloud platforms (Render/AWS/DigitalOcean).  
- **Database** managed with MongoDB Atlas.  

---

## 👥 Contributors

| Name | Role |
|------|------|
| **Pranav Raj Choudhary** | Backend,database & Architecture |
| **Karthik Nambiar** | Frontend, UI,Sleak UX |
| **Priyanshu Pandey** | Socket.io & Research |
| **Vinay Mohan Shukla** | Final Documentation "To be" |


---

## 📜 License

This project is open-source and distributed under the **MIT License**.

---

## 🙌 Acknowledgements

- Inspired by community journalism and open-source verification tools.  
- Special thanks to contributors, testers, and early adopters for shaping TruthHub.

---

### 💡 “Truth thrives in transparency. Let’s build it together.”
