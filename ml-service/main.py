from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from transformers import AutoTokenizer, AutoModelForSequenceClassification
import torch
import torch.nn.functional as F
import os

app = FastAPI(title="Gantra ML Service")

MODEL_DIR      = os.getenv("MODEL_DIR", "./models")
DZIRIBERT_PATH = os.path.join(MODEL_DIR, "dziribert_v1")
MARBERT_PATH   = os.path.join(MODEL_DIR, "marbert_v1")

print("Loading DziriBERT...")
dz_tok   = AutoTokenizer.from_pretrained(DZIRIBERT_PATH)
dz_model = AutoModelForSequenceClassification.from_pretrained(DZIRIBERT_PATH)
dz_model.eval()

print("Loading MARBERT...")
mb_tok   = AutoTokenizer.from_pretrained(MARBERT_PATH)
mb_model = AutoModelForSequenceClassification.from_pretrained(MARBERT_PATH)
mb_model.eval()

print("Both models ready.")

LABELS = ["negative", "neutral", "positive"]

class PredictRequest(BaseModel):
    text: str

class PredictResponse(BaseModel):
    sentiment: str
    score: float
    scores: dict

@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/predict", response_model=PredictResponse)
def predict(req: PredictRequest):
    if not req.text or not req.text.strip():
        raise HTTPException(status_code=400, detail="text is required")

    with torch.no_grad():
        dz_inputs = dz_tok(
            req.text, return_tensors="pt",
            truncation=True, max_length=128, padding=True
        )
        dz_probs = F.softmax(dz_model(**dz_inputs).logits, dim=-1)[0]

        mb_inputs = mb_tok(
            req.text, return_tensors="pt",
            truncation=True, max_length=128, padding=True
        )
        mb_probs = F.softmax(mb_model(**mb_inputs).logits, dim=-1)[0]

    final = (0.45 * dz_probs) + (0.55 * mb_probs)
    idx   = final.argmax().item()

    return PredictResponse(
        sentiment = LABELS[idx],
        score     = round(final[idx].item(), 4),
        scores    = {l: round(final[i].item(), 4) for i, l in enumerate(LABELS)},
    )