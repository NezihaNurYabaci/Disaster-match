# 🆘 Disaster Match

A mobile application that connects **disaster victims in need** with **volunteers offering help** through a hybrid matching algorithm. Designed to streamline humanitarian logistics during large-scale disasters such as the 2023 Kahramanmaraş earthquake.

##  Table of Contents

- [About](#-about)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Matching Algorithm](#-matching-algorithm)
- [Installation](#-installation)
- [Usage](#-usage)
- [API Endpoints](#-api-endpoints)
- [Project Structure](#-project-structure)
- [Future Work](#-future-work)
- [Author](#-author)

##  About

During disasters, the biggest challenge is **connecting the right resource with the right person**. Disaster Match addresses this by automatically matching reported needs (food, shelter, medical supplies, etc.) with available resources based on both **textual similarity** and **geographic proximity**.

**Key Innovation:** A hybrid matching algorithm that combines Natural Language Processing with geospatial scoring:

`Hybrid Score = 0.6 × Semantic Similarity + 0.4 × Location Score`

This is the central contribution of the project and forms the basis of the academic evaluation.

##  Features

-  **Firebase Authentication** — Email/password-based sign-up and login
-  **Need Reporting** — Create needs with category, description, and location
-  **Offering Help** — Register available resources for matching
-  **Smart Matching** — Hybrid NLP + Haversine scoring
-  **GPS Integration** — Automatic location capture or manual entry
-  **Score Transparency** — Each match shows distance, text similarity, and location score separately
-  **Need Closure** — Mark needs as fulfilled once help arrives
-  **Resource Management** — View and delete your own help offers
-  **Session Management** — Sign out functionality

##  Tech Stack

### Frontend
- **React Native** (Expo SDK 54)
- **TypeScript**
- **Expo Router** — File-based navigation
- **Firebase SDK** — Auth and Firestore
- **Axios** — HTTP client
- **Expo Location** — GPS services

### Backend
- **Python 3.10+**
- **FastAPI** — Modern async web framework
- **Uvicorn** — ASGI server
- **Firebase Admin SDK** — Firestore database access
- **scikit-learn** — TF-IDF + Cosine Similarity
- **sentence-transformers** — Multilingual Sentence-BERT

### Database
- **Cloud Firestore** — NoSQL document store for needs, resources, and user data

##  Architecture

The mobile client communicates directly with Firestore for authentication and user data, but routes all matching requests through the FastAPI backend, which executes the ML pipeline (TF-IDF + SBERT + Haversine) and returns ranked results.

##  Matching Algorithm

The system implements **two interchangeable semantic algorithms** combined with a shared geospatial component.

### Algorithm A — TF-IDF + Cosine Similarity
- Lightweight, fast, statistical
- Limitation: Struggles with Turkish morphology (e.g., "ağrı kesiciye" vs "ağrı kesici" treated as different tokens)

### Algorithm B — Sentence-BERT (`paraphrase-multilingual-MiniLM-L12-v2`)
- Captures true semantic meaning across languages
- Robust to suffixes, inflections, and paraphrasing
- Heavier compute cost but superior accuracy on Turkish text

### Geographic Component — Haversine Distance

`Location Score = 1 / (1 + distance_km)`

Yields a value between 0 and 1, decaying smoothly with distance.

### Hybrid Score

`hybrid_score = 0.6 * semantic_score + 0.4 * location_score`

The 0.6/0.4 weighting was tuned empirically using the `precision_eval.py` evaluation module on a synthetic dataset based on the Kahramanmaraş earthquake scenario.

##  Installation

### Prerequisites
- Node.js ≥ 18
- Python ≥ 3.10
- Expo Go app on your phone (iOS/Android)
- A Firebase project with Authentication and Firestore enabled

### 1. Clone the repository

    git clone https://github.com/NezihaNurYabaci/Disaster-match.git
    cd Disaster-match

### 2. Set up the backend

    cd backend
    python -m venv venv
    venv\Scripts\activate
    pip install -r requirements.txt

Place your Firebase Admin SDK credentials as `backend/serviceAccountKey.json` (this file is gitignored for security).

### 3. Set up the frontend

    cd ..
    npm install

Update `firebaseConfig.ts` with your Firebase project credentials.

### 4. Run the application

On Windows, use the bundled startup script that auto-detects your local IP, syncs `api.ts`, and launches both backend and frontend:

    .\start.ps1

Or run them manually — backend with `uvicorn main:app --reload --host 0.0.0.0` and frontend with `npx expo start`.

Scan the QR code with Expo Go to launch the app on your device.

##  Usage

1. **Register** with email and password
2. **Report a need** — Choose a category (Food, Shelter, Medical, Clothing, Water, Other), describe your situation, and provide your location via GPS or manual entry
3. **Offer help** — Register resources you can share with affected people
4. **View matches** — Tap any of your needs to see the top 5 best-matched resources, ranked by hybrid score
5. **Close need** — Once help is received, mark the need as closed

##  API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /needs | Create a new need |
| POST | /resources | Register a new resource offer |
| GET | /resources/user/{user_id} | List all resources offered by a user |
| DELETE | /resources/{resource_id} | Remove a resource offer |
| GET | /match/{need_id} | Get top matches for a given need |
| GET | /compare/{need_id} | Run both algorithms and compare results |

Interactive Swagger UI available at `http://<host>:8000/docs` when the backend is running.

##  Project Structure

The project has two main parts. The `app/` directory contains all React Native screens organized by Expo Router conventions: `(auth)` for login/register and `(tabs)` for the three main screens (matches, need entry, offer entry). The `backend/` directory contains the FastAPI server, the hybrid matching engine (`matcher.py`), Turkish NLP utilities (`nlp_utils.py`), and the precision evaluation script that benchmarks Algorithm A against Algorithm B. Configuration files like `app.json`, `firebaseConfig.ts`, and the Windows startup script `start.ps1` live at the project root.

##  Future Work

- **Production deployment** — Containerize backend with Docker and deploy to Google Cloud Run; publish mobile builds via EAS Build to App Store and Google Play
- **Push notifications** — Real-time alerts when a high-scoring match is found
- **Category-aware filtering** — Optional hard filter to restrict matches to the same category
- **Image attachments** — Allow needs and resources to include photos
- **Multi-language support** — Extend NLP pipeline beyond Turkish
- **Persistent authentication** — Integrate `@react-native-async-storage/async-storage` to preserve login sessions
- **Admin dashboard** — Web panel for NGOs and crisis coordinators to oversee active needs and resources

##  Author

**Neziha Nur Yabacı**  
Senior Project — Computer Engineering  
GitHub: https://github.com/NezihaNurYabaci

---

*This project was developed as a senior thesis with a focus on applying NLP and geospatial computing to humanitarian response coordination.*
