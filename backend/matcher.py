from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from sentence_transformers import SentenceTransformer, util
from nlp_utils import preprocess
import math
import time

# Sentence-BERT modelini yükle
sbert_model = SentenceTransformer('paraphrase-multilingual-MiniLM-L12-v2')

def haversine(lat1, lon1, lat2, lon2):
    R = 6371
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi/2)**2 + math.cos(phi1)*math.cos(phi2)*math.sin(dlambda/2)**2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))

def get_matches(need: dict, resources: list, algorithm: str = "tfidf") -> dict:
    if not resources:
        return {"matches": [], "time_ms": 0}

    need_text = preprocess(need.get("description", ""))
    resource_texts = [preprocess(r.get("description", "")) for r in resources]

    start_time = time.time()

    if algorithm == "sbert":
        # Algoritma B — Sentence-BERT
        need_embedding = sbert_model.encode(need_text, convert_to_tensor=True)
        resource_embeddings = sbert_model.encode(resource_texts, convert_to_tensor=True)
        semantic_scores = util.cos_sim(need_embedding, resource_embeddings)[0].tolist()
    else:
        # Algoritma A — TF-IDF
        vectorizer = TfidfVectorizer()
        all_texts = [need_text] + resource_texts
        tfidf_matrix = vectorizer.fit_transform(all_texts)
        semantic_scores = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:]).flatten().tolist()

    elapsed_ms = round((time.time() - start_time) * 1000, 2)

    results = []
    for i, resource in enumerate(resources):
        distance_km = haversine(
            need.get("latitude", 0), need.get("longitude", 0),
            resource.get("latitude", 0), resource.get("longitude", 0)
        )
        location_score = 1 / (1 + distance_km)
        hybrid_score = 0.6 * semantic_scores[i] + 0.4 * location_score

        results.append({
            "resourceId": resource.get("id"),
            "category": resource.get("category"),
            "description": resource.get("description"),
            "distance_km": round(distance_km, 2),
            "semantic_score": round(float(semantic_scores[i]), 4),
            "location_score": round(location_score, 4),
            "hybrid_score": round(hybrid_score, 4)
        })

    results.sort(key=lambda x: x["hybrid_score"], reverse=True)
    return {"matches": results[:5], "time_ms": elapsed_ms}