 Image & Data Analyzer (IDA) Backend

A **backend API for the Image & Data Analyzer (IDA) PWA**, leveraging **Google Gemini AI** to analyze images and generate structured responses in **GitHub-Flavored Markdown (GFM)**. Supports follow-up questions and image uploads.

## **Table of Contents**

1. [Features](#features)
2. [Tech Stack](#tech-stack)
3. [Getting Started](#getting-started)
4. [Environment Variables](#environment-variables)
5. [API Endpoints](#api-endpoints)
6. [Production Considerations](#production-considerations)
7. [Contributing](#contributing)
8. [License](#license)

---

## **Features**

* Upload images for AI analysis.
* Generate structured Markdown tables from AI responses.
* Ask follow-up questions to continue analysis.
* Session management for multiple queries per user.
* File size limit of 5MB for image uploads.

---

## **Tech Stack**

* **Node.js** + **Express.js** – REST API server
* **Multer** – Image upload handling
* **CORS** – Cross-origin resource sharing
* **dotenv** – Environment variable management
* **Google Generative AI (Gemini)** – AI analysis engine
* **Optional (production)**: Redis or database for session persistence

---

## **Getting Started**

### **1. Clone the repository**

```bash
git clone https://github.com/your-username/ida-backend.git
cd ida-backend
```

### **2. Install dependencies**

```bash
npm install
```

### **3. Create `.env` file**

```bash
touch .env
```

Add the following variables:

```
PORT=5000
GEMINI_API_KEY=your_gemini_key_here
FRONTEND_URL=http://localhost:5173
REDIS_URL=optional_redis_url
```

### **4. Run the server**

* Development mode:

```bash
npm run dev
```

* Production mode:

```bash
npm start
```

Server runs on `http://localhost:5000` by default.

---

## **API Endpoints**

### **POST /api/analyze**

Analyze an image with a prompt.

* **Body (form-data)**:

  * `image` (file) – Image to analyze
  * `prompt` (string) – Question to ask AI

* **Response**:

```json
{
  "sessionId": "1234567890",
  "result": "AI-generated markdown response"
}
```

---

### **POST /api/followup**

Send a follow-up question for an existing session.

* **Body (JSON)**:

```json
{
  "sessionId": "1234567890",
  "prompt": "Follow-up question"
}
```

* **Response**:

```json
{
  "result": "AI-generated follow-up response"
}
```

---

## **Production Considerations**

* Replace in-memory `sessions` with **Redis** or a persistent database.
* Update CORS for your production frontend URL.
* Add **rate limiting** to prevent abuse.
* Deploy using **Render**, **Railway**, **Heroku**, or a VPS with **PM2** for uptime.

---

## **Contributing**

1. Fork the repository
2. Create a new branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m "Add feature"`
4. Push to branch: `git push origin feature/your-feature`
5. Create a Pull Request

---

## **License**

MIT License © 2025 Gladys Ayebia Ashong


