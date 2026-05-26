# 🆘 Disaster Match

**Location and Semantics-Based Intelligent Matching Mobile Application for Resource Optimization in Disaster Management**

Çukurova University — Computer Engineering Graduation Thesis  
Student: Neziha Nur YABACI (2021555066)  
Advisor: Prof. Dr. Zekeriya TÜFEKÇİ

---

## 📱 About

Disaster Match is a cross-platform mobile application that intelligently matches urgent needs arising in disaster situations with relief resources offered by volunteers. The system uses a hybrid scoring algorithm combining Natural Language Processing (NLP) and geographic proximity.

**Hybrid Score Formula:**
Score = 0.6 × Semantic_Score + 0.4 × Location_Score
---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Mobile Frontend | React Native, Expo, TypeScript |
| Backend | Python, FastAPI, Uvicorn |
| Database | Firebase Firestore |
| Authentication | Firebase Authentication |
| NLP (Algorithm A) | TF-IDF + Cosine Similarity (scikit-learn) |
| NLP (Algorithm B) | Sentence-BERT (paraphrase-multilingual-MiniLM-L12-v2) |
| Location | Expo Location API, Haversine Formula |

---

## 📊 Algorithm Comparison (Precision@5)

| Algorithm | Precision@5 | Avg Time |
|-----------|-------------|----------|
| TF-IDF (Algorithm A) | 0.28 | 2.5 ms |
| Sentence-BERT (Algorithm B) | 0.40 | 91.6 ms |

TF-IDF is used in production (37× faster). Sentence-BERT is used for offline comparison.

---

## 🚀 Getting Started

### Mobile App

```bash
npm install
npx expo start
```

Scan QR code with Expo Go app.

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0
```

> ⚠️ Add your `serviceAccountKey.json` (Firebase Admin SDK) to the `backend/` folder before running.

---

## 📁 Project Structure
disaster-match/
├── app/
│   ├── (auth)/          # Login, Register screens
│   ├── (tabs)/          # Match List, Need Entry, Offer Entry
│   ├── _layout.tsx      # Root navigation
│   └── index.tsx        # Entry point
├── backend/
│   ├── main.py          # FastAPI endpoints
│   ├── matcher.py       # Hybrid algorithm
│   ├── nlp_utils.py     # Turkish text preprocessing
│   └── precision_eval.py # Precision@5 evaluation script
├── api.ts               # Axios API client
└── firebaseConfig.ts    # Firebase configuration
---

## ✨ Features

- 🔐 User registration with name, surname, email
- 📍 GPS-based automatic location capture
- 📋 Category selection (Food, Shelter, Medical, Clothing, Water, Other)
- 🤝 Hybrid-scored match results with semantic + location breakdown
- 📊 Match detail modal with full score breakdown
- ✅ Need status closure when aid is delivered
- 🔄 Automatic need list refresh per user session