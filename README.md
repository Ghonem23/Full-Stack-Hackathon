# Full-Stack Hackathon Project: Medical Healthcare Authentication System

A complete full-stack web application featuring a modern React frontend and a secure Python Flask backend for user authentication (Sign Up, Login, and Password Reset) with JWT support and SQLite data persistence.

---

## 📸 Application Previews & Workflows

### 1. User Authentication Flow

| Sign Up Page | Login Portal |
| :---: | :---: |
| ![Sign Up](screenshots/signup.png) | ![Login](screenshots/login.png) |

---

### 2. State & Access Verification

| Account Created (Sign-Up Success) | Clinical Workspace Access Granted |
| :---: | :---: |
| ![Account Created](screenshots/account-created.png) | ![Access Granted](screenshots/access-granted.png) |

---

## 🛠️ Tech Stack

* **Frontend:** React, Vite, Tailwind CSS, Framer Motion, Lucide Icons
* **Backend:** Python, Flask, Flask-CORS, Flask-SQLAlchemy, Flask-JWT-Extended, Werkzeug Security
* **Database:** SQLite

---

## 📁 Project Structure

```text
Full-Stack-Hackathon/
├── FrontEnd/          # Consolidated React + Vite frontend application
│   ├── src/
│   │   ├── components/  # UI components, AuthCard, etc.
│   │   ├── features/    # Feature modules (signup validation & forms)
│   │   ├── pages/       # Page components (SignUpPage)
│   │   └── App.jsx      # Unified frontend workflow manager
│   └── package.json
└── backend/           # Flask REST API backend
    ├── app.py         # Main entry point and API routes
    ├── models.py      # SQLAlchemy User model & password hashing
    ├── requirements.txt
    └── instance/      # Auto-generated SQLite database storage
```

---

## 🚀 Getting Started & Local Setup
1. Clone and Navigate

```
git clone [https://github.com/Ghonem23/Full-Stack-Hackathon.git](https://github.com/Ghonem23/Full-Stack-Hackathon.git)
cd Full-Stack-Hackathon
```
2. Set Up and Run the Flask Backend

```
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python app.py
```
3. Run the Frontend Application

```
cd FrontEnd
npm install
npm run dev
```
---

## 🔌 API Endpoints Contract

```
# 1. User Sign Up
# Creates a new user in the SQLite database and returns the created user object.
curl -X POST [http://127.0.0.1:5000/api/auth/signup](http://127.0.0.1:5000/api/auth/signup) \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": " John Doe",
    "email": "John@example.com",
    "password": "Password123"
  }'

# 2. User Login
# Authenticates user credentials, validates password hash, and returns a JWT access token.
curl -X POST [http://127.0.0.1:5000/api/auth/login](http://127.0.0.1:5000/api/auth/login) \
  -H "Content-Type: application/json" \
  -d '{
    "email": "John@example.com",
    "password": "Password123",
    "remember": true
  }'

# 3. Forgot Password
# Accepts email and initiates a password reset flow.
curl -X POST [http://127.0.0.1:5000/api/auth/forgot-password](http://127.0.0.1:5000/api/auth/forgot-password) \
  -H "Content-Type: application/json" \
  -d '{
    "email": "John@example.com"
  }'
```
