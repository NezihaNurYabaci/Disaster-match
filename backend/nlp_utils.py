import re

TURKISH_STOPWORDS = [
    "ve", "ile", "bu", "bir", "de", "da", "için", "var", "yok",
    "ben", "sen", "biz", "siz", "o", "ne", "ki", "mi", "mu", "mü",
    "çok", "daha", "en", "hem", "ama", "fakat", "ancak", "gibi"
]

def preprocess(text: str) -> str:
    text = text.lower()
    text = re.sub(r'[^\w\s]', '', text)
    tokens = text.split()
    tokens = [t for t in tokens if t not in TURKISH_STOPWORDS]
    return " ".join(tokens)