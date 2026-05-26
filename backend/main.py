from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from matcher import get_matches
import firebase_admin
from firebase_admin import credentials, firestore

cred = credentials.Certificate("serviceAccountKey.json")
firebase_admin.initialize_app(cred)
db = firestore.client()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class Need(BaseModel):
    userId: str
    category: str
    description: str
    latitude: float
    longitude: float

class Resource(BaseModel):
    userId: str
    category: str
    description: str
    quantity: str
    latitude: float
    longitude: float

@app.post("/needs")
def add_need(need: Need):
    doc_ref = db.collection("needs").document()
    doc_ref.set({**need.dict(), "status": "active", "createdAt": "2026"})
    return {"id": doc_ref.id, "message": "İhtiyaç kaydedildi"}

@app.post("/resources")
def add_resource(resource: Resource):
    doc_ref = db.collection("resources").document()
    doc_ref.set({**resource.dict(), "createdAt": "2026"})
    return {"id": doc_ref.id, "message": "Kaynak kaydedildi"}

@app.get("/match/{need_id}")
def match_need(need_id: str, algorithm: str = "tfidf"):
    need_doc = db.collection("needs").document(need_id).get()
    if not need_doc.exists:
        return {"error": "İhtiyaç bulunamadı"}
    need = need_doc.to_dict()
    resources = [doc.to_dict() | {"id": doc.id} for doc in db.collection("resources").stream()]
    result = get_matches(need, resources, algorithm)
    return result

@app.get("/compare/{need_id}")
def compare_algorithms(need_id: str):
    need_doc = db.collection("needs").document(need_id).get()
    if not need_doc.exists:
        return {"error": "İhtiyaç bulunamadı"}
    need = need_doc.to_dict()
    resources = [doc.to_dict() | {"id": doc.id} for doc in db.collection("resources").stream()]

    result_a = get_matches(need, resources, algorithm="tfidf")
    result_b = get_matches(need, resources, algorithm="sbert")

    return {
        "need_id": need_id,
        "algorithm_a_tfidf": {
            "matches": result_a["matches"],
            "time_ms": result_a["time_ms"]
        },
        "algorithm_b_sbert": {
            "matches": result_b["matches"],
            "time_ms": result_b["time_ms"]
        }
    }