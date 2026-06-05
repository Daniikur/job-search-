````markdown
# HireTrack

AI-powered job application tracker built with React, FastAPI, MongoDB Atlas, and Groq AI.

---

## Overview

HireTrack is a modern full-stack web application designed to help users organize and manage their job search process efficiently.

The platform allows users to:

- Track job applications
- Monitor application statuses
- Upload and manage resumes
- View analytics dashboards
- Generate AI-powered job description summaries
- Organize notes and interview progress

---

# Features

## Authentication
- JWT-based authentication
- Secure login and registration
- Protected routes

## Application Management
- Add, edit, and delete job applications
- Track application status:
  - Saved
  - Applied
  - Interviewing
  - Offer
  - Rejected

## AI Integration
- AI-powered job description summarization
- Groq API integration

## Resume Management
- Upload resumes
- Download resumes
- Set default resume

## Analytics Dashboard
- Weekly application statistics
- Status distribution charts
- Offer tracking

## Notes System
- Add interview notes
- Track application progress

---

# Tech Stack

## Frontend
- React.js
- React Router
- Axios
- TailwindCSS
- Lucide React Icons
- CRACO

## Backend
- FastAPI
- Python
- JWT Authentication
- MongoDB Atlas
- Groq AI API

## Database
- MongoDB Atlas

---

# Project Structure

```bash
job-search/
│
├── backend/
│   ├── server.py
│   ├── requirements.txt
│   └── .env
│
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── .env
│
└── README.md
````

---

# Installation

## 1. Clone Repository

```bash
git clone https://github.com/Daniikur/hiretrack.git
cd hiretrack
```

---

# Backend Setup

## Navigate to backend

```bash
cd backend
```

## Create virtual environment

### Windows

```bash
python -m venv venv
venv\Scripts\activate
```

### Linux / macOS

```bash
python3 -m venv venv
source venv/bin/activate
```

---

## Install dependencies

```bash
pip install -r requirements.txt
```

---

## Configure Environment Variables

Create `.env` file inside backend folder:

```env
MONGO_URL=your_mongodb_connection
DB_NAME=job_search

JWT_SECRET=your_secret_key

ADMIN_EMAIL=admin@gmail.com
ADMIN_PASSWORD=Admin123

OPENAI_API_KEY=your_groq_api_key

CORS_ORIGINS=http://localhost:3000
```

---

## Run Backend

```bash
uvicorn server:app --reload --port 8000
```

Backend runs on:

```text
http://localhost:8000
```

---

# Frontend Setup

## Navigate to frontend

```bash
cd frontend
```

---

## Install dependencies

```bash
npm install --legacy-peer-deps
```

---

## Configure Environment Variables

Create `.env` file inside frontend folder:

```env
REACT_APP_BACKEND_URL=http://localhost:8000
```

---

## Run Frontend

```bash
npm start
```

Frontend runs on:

```text
http://localhost:3000
```

---

# API Endpoints

## Authentication

| Method | Endpoint             |
| ------ | -------------------- |
| POST   | `/api/auth/register` |
| POST   | `/api/auth/login`    |
| GET    | `/api/auth/me`       |

---

## Applications

| Method | Endpoint                 |
| ------ | ------------------------ |
| GET    | `/api/applications`      |
| POST   | `/api/applications`      |
| PUT    | `/api/applications/{id}` |
| DELETE | `/api/applications/{id}` |

---

## AI Features

| Method | Endpoint                           |
| ------ | ---------------------------------- |
| POST   | `/api/ai/summarize`                |
| POST   | `/api/applications/{id}/summarize` |

---

# Screenshots

## Login Page

Modern dark-themed authentication interface.

## Dashboard

Track all applications in one place.

## AI Summary

Generate intelligent summaries for job descriptions.

---

# Future Improvements

* Email notifications
* Interview calendar integration
* Resume scoring system
* Cover letter generator
* Docker deployment
* CI/CD pipeline

---

# Testing

## Backend Tests

```bash
pytest
```

---

# Deployment

## Frontend

* Vercel
* Netlify

## Backend

* Render
* Railway
* AWS
* DigitalOcean

---

# Author

## Kurmanzhan Daniiarbek Kyzy

GitHub:
https://github.com/Daniikur

---

# License

This project is licensed under the MIT License.

```
```
