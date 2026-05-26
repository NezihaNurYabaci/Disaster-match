from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from sentence_transformers import SentenceTransformer, util
from nlp_utils import preprocess
import math
import time
import json

sbert_model = SentenceTransformer('paraphrase-multilingual-MiniLM-L12-v2')


NEEDS = [
    {"id": "n1", "description": "Battaniye ve uyku tulumu ihtiyacımız var", "category": "Giysi", "latitude": 37.58, "longitude": 36.94},
    {"id": "n2", "description": "Acil tıbbi yardım ve ilaç gerekiyor", "category": "Tıbbi", "latitude": 37.60, "longitude": 36.95},
    {"id": "n3", "description": "Yiyecek ve içme suyu lazım", "category": "Gıda", "latitude": 37.57, "longitude": 36.93},
    {"id": "n4", "description": "Çadır ve barınak ihtiyacı var", "category": "Barınak", "latitude": 37.59, "longitude": 36.96},
    {"id": "n5", "description": "Bebek maması ve bez ihtiyacı var", "category": "Gıda", "latitude": 37.56, "longitude": 36.92},
    {"id": "n6", "description": "Kışlık mont ve bot ihtiyacımız var", "category": "Giysi", "latitude": 37.61, "longitude": 36.97},
    {"id": "n7", "description": "Jeneratör ve yakıt ihtiyacımız var", "category": "Diğer", "latitude": 37.55, "longitude": 36.91},
    {"id": "n8", "description": "Sedye ve tıbbi malzeme gerekiyor", "category": "Tıbbi", "latitude": 37.62, "longitude": 36.98},
    {"id": "n9", "description": "Temiz içme suyu ve su tankeri lazım", "category": "Su", "latitude": 37.54, "longitude": 36.90},
    {"id": "n10", "description": "Gıda paketi ve hazır yemek ihtiyacı", "category": "Gıda", "latitude": 37.63, "longitude": 36.99},
]

RESOURCES = [
    {"id": "r1", "description": "100 adet battaniye ve uyku tulumu dağıtıyoruz", "category": "Giysi", "latitude": 37.58, "longitude": 36.94},
    {"id": "r2", "description": "Sağlık ekibi ve ilaç malzemesi sunuyoruz", "category": "Tıbbi", "latitude": 37.60, "longitude": 36.95},
    {"id": "r3", "description": "Konserve yiyecek ve su dağıtımı yapıyoruz", "category": "Gıda", "latitude": 37.57, "longitude": 36.93},
    {"id": "r4", "description": "50 adet çadır ve barınak kuruyoruz", "category": "Barınak", "latitude": 37.59, "longitude": 36.96},
    {"id": "r5", "description": "Bebek maması bez ve hijyen malzemesi var", "category": "Gıda", "latitude": 37.56, "longitude": 36.92},
    {"id": "r6", "description": "Kışlık giysi bot ve mont dağıtıyoruz", "category": "Giysi", "latitude": 37.61, "longitude": 36.97},
    {"id": "r7", "description": "Jeneratör ve dizel yakıt tedariki yapıyoruz", "category": "Diğer", "latitude": 37.55, "longitude": 36.91},
    {"id": "r8", "description": "Tıbbi malzeme sedye ve ambulans hizmeti", "category": "Tıbbi", "latitude": 37.62, "longitude": 36.98},
    {"id": "r9", "description": "Su tankeri ve temiz içme suyu dağıtımı", "category": "Su", "latitude": 37.54, "longitude": 36.90},
    {"id": "r10", "description": "Hazır yemek ve gıda paketi dağıtıyoruz", "category": "Gıda", "latitude": 37.63, "longitude": 36.99},
    {"id": "r11", "description": "Battaniye ve yorgan dağıtımı yapıyoruz", "category": "Giysi", "latitude": 37.70, "longitude": 37.10},
    {"id": "r12", "description": "Antibiyotik ve pansuman malzemesi var", "category": "Tıbbi", "latitude": 37.70, "longitude": 37.10},
    {"id": "r13", "description": "Ekmek ve temel gıda malzemesi dağıtıyoruz", "category": "Gıda", "latitude": 37.70, "longitude": 37.10},
    {"id": "r14", "description": "Prefabrik yapı ve geçici konut kuruyoruz", "category": "Barınak", "latitude": 37.70, "longitude": 37.10},
    {"id": "r15", "description": "Çocuk bezi ve mama dağıtımı yapıyoruz", "category": "Gıda", "latitude": 37.70, "longitude": 37.10},
]

# Her ihtiyaç için doğru eşleşme (ground truth)
GROUND_TRUTH = {
    "n1": ["r1", "r11", "r6"],
    "n2": ["r2", "r12", "r8"],
    "n3": ["r3", "r13", "r10"],
    "n4": ["r4", "r14"],
    "n5": ["r5", "r15"],
    "n6": ["r6", "r1", "r11"],
    "n7": ["r7"],
    "n8": ["r8", "r2", "r12"],
    "n9": ["r9"],
    "n10": ["r10", "r3", "r13"],
}

def haversine(lat1, lon1, lat2, lon2):
    R = 6371
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi/2)**2 + math.cos(phi1)*math.cos(phi2)*math.sin(dlambda/2)**2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))

def get_top5_tfidf(need, resources):
    need_text = preprocess(need["description"])
    resource_texts = [preprocess(r["description"]) for r in resources]
    vectorizer = TfidfVectorizer()
    matrix = vectorizer.fit_transform([need_text] + resource_texts)
    scores = cosine_similarity(matrix[0:1], matrix[1:]).flatten()
    results = []
    for i, r in enumerate(resources):
        dist = haversine(need["latitude"], need["longitude"], r["latitude"], r["longitude"])
        loc_score = 1 / (1 + dist)
        hybrid = 0.6 * scores[i] + 0.4 * loc_score
        results.append((r["id"], hybrid))
    results.sort(key=lambda x: x[1], reverse=True)
    return [r[0] for r in results[:5]]

def get_top5_sbert(need, resources):
    need_text = preprocess(need["description"])
    resource_texts = [preprocess(r["description"]) for r in resources]
    need_emb = sbert_model.encode(need_text, convert_to_tensor=True)
    res_embs = sbert_model.encode(resource_texts, convert_to_tensor=True)
    scores = util.cos_sim(need_emb, res_embs)[0].tolist()
    results = []
    for i, r in enumerate(resources):
        dist = haversine(need["latitude"], need["longitude"], r["latitude"], r["longitude"])
        loc_score = 1 / (1 + dist)
        hybrid = 0.6 * scores[i] + 0.4 * loc_score
        results.append((r["id"], hybrid))
    results.sort(key=lambda x: x[1], reverse=True)
    return [r[0] for r in results[:5]]

def precision_at_k(predicted, relevant, k=5):
    predicted_k = predicted[:k]
    hits = sum(1 for p in predicted_k if p in relevant)
    return hits / k

def evaluate():
    print("\n" + "="*60)
    print("PRECİSİON@5 DEĞERLENDİRMESİ")
    print("="*60)

    tfidf_scores = []
    sbert_scores = []
    tfidf_times = []
    sbert_times = []

    results_table = []

    for need in NEEDS:
        relevant = GROUND_TRUTH.get(need["id"], [])

        
        t0 = time.time()
        tfidf_top5 = get_top5_tfidf(need, RESOURCES)
        tfidf_time = round((time.time() - t0) * 1000, 2)
        tfidf_p5 = precision_at_k(tfidf_top5, relevant)

        
        t0 = time.time()
        sbert_top5 = get_top5_sbert(need, RESOURCES)
        sbert_time = round((time.time() - t0) * 1000, 2)
        sbert_p5 = precision_at_k(sbert_top5, relevant)

        tfidf_scores.append(tfidf_p5)
        sbert_scores.append(sbert_p5)
        tfidf_times.append(tfidf_time)
        sbert_times.append(sbert_time)

        results_table.append({
            "need_id": need["id"],
            "description": need["description"][:40] + "...",
            "tfidf_p5": tfidf_p5,
            "sbert_p5": sbert_p5,
            "tfidf_time_ms": tfidf_time,
            "sbert_time_ms": sbert_time,
        })

    
    print(f"\n{'Need ID':<6} {'TF-IDF P@5':<12} {'SBERT P@5':<12} {'TF-IDF ms':<12} {'SBERT ms':<10}")
    print("-"*55)
    for r in results_table:
        print(f"{r['need_id']:<6} {r['tfidf_p5']:<12.2f} {r['sbert_p5']:<12.2f} {r['tfidf_time_ms']:<12} {r['sbert_time_ms']:<10}")

    avg_tfidf = sum(tfidf_scores) / len(tfidf_scores)
    avg_sbert = sum(sbert_scores) / len(sbert_scores)
    avg_tfidf_time = sum(tfidf_times) / len(tfidf_times)
    avg_sbert_time = sum(sbert_times) / len(sbert_times)

    print("-"*55)
    print(f"{'ORTALAMA':<6} {avg_tfidf:<12.4f} {avg_sbert:<12.4f} {avg_tfidf_time:<12.1f} {avg_sbert_time:<10.1f}")
    print("\n" + "="*60)
    print("ÖZET")
    print("="*60)
    print(f"TF-IDF  Ortalama Precision@5 : {avg_tfidf:.4f}")
    print(f"SBERT   Ortalama Precision@5 : {avg_sbert:.4f}")
    print(f"TF-IDF  Ortalama Süre        : {avg_tfidf_time:.1f} ms")
    print(f"SBERT   Ortalama Süre        : {avg_sbert_time:.1f} ms")

    if avg_sbert > avg_tfidf:
        print(f"\n✅ Sentence-BERT daha iyi Precision@5 üretiyor (+{(avg_sbert - avg_tfidf):.4f})")
    elif avg_tfidf > avg_sbert:
        print(f"\n✅ TF-IDF daha iyi Precision@5 üretiyor (+{(avg_tfidf - avg_sbert):.4f})")
    else:
        print("\n✅ Her iki algoritma eşit Precision@5 üretiyor")

    print(f"⚡ TF-IDF {avg_sbert_time/avg_tfidf_time:.1f}x daha hızlı")

    
    output = {
        "results": results_table,
        "summary": {
            "tfidf_avg_precision5": round(avg_tfidf, 4),
            "sbert_avg_precision5": round(avg_sbert, 4),
            "tfidf_avg_time_ms": round(avg_tfidf_time, 2),
            "sbert_avg_time_ms": round(avg_sbert_time, 2),
        }
    }
    with open("precision_results.json", "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, indent=2)
    print("\n📄 Sonuçlar precision_results.json dosyasına kaydedildi.")

if __name__ == "__main__":
    evaluate()