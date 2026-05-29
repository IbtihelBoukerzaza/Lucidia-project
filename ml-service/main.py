from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import torch
import torch.nn.functional as F
import os
import uvicorn

app = FastAPI(title="Gantra ML Service")

MODEL_DIR = "./models"
HF_TOKEN = os.environ.get("HF_TOKEN", "")

def download_models():
    from huggingface_hub import snapshot_download
    os.makedirs(f"{MODEL_DIR}/dziribert_v1", exist_ok=True)
    os.makedirs(f"{MODEL_DIR}/marbert_v1", exist_ok=True)
    print("Downloading DziriBERT...")
    snapshot_download(repo_id="Gantradz/gantra-dziribert", local_dir=f"{MODEL_DIR}/dziribert_v1", token=HF_TOKEN)
    print("Downloading MARBERT...")
    snapshot_download(repo_id="Gantradz/gantra-marbert", local_dir=f"{MODEL_DIR}/marbert_v1", token=HF_TOKEN)
    print("Models downloaded.")

def load_models():
    from transformers import AutoTokenizer, AutoModelForSequenceClassification
    global dz_tok, dz_model, mb_tok, mb_model
    print("Loading DziriBERT...")
    dz_tok = AutoTokenizer.from_pretrained(f"{MODEL_DIR}/dziribert_v1")
    dz_model = AutoModelForSequenceClassification.from_pretrained(f"{MODEL_DIR}/dziribert_v1")
    dz_model.eval()
    print("Loading MARBERT...")
    mb_tok = AutoTokenizer.from_pretrained(f"{MODEL_DIR}/marbert_v1")
    mb_model = AutoModelForSequenceClassification.from_pretrained(f"{MODEL_DIR}/marbert_v1")
    mb_model.eval()
    print("Both models ready.")

download_models()
load_models()

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
        dz_inputs = dz_tok(req.text, return_tensors="pt", truncation=True, max_length=128, padding=True)
        dz_probs = F.softmax(dz_model(**dz_inputs).logits, dim=-1)[0]
        mb_inputs = mb_tok(req.text, return_tensors="pt", truncation=True, max_length=128, padding=True)
        mb_probs = F.softmax(mb_model(**mb_inputs).logits, dim=-1)[0]

    final = (0.45 * dz_probs) + (0.55 * mb_probs)
    idx = final.argmax().item()

    return PredictResponse(
        sentiment=LABELS[idx],
        score=round(final[idx].item(), 4),
        scores={l: round(final[i].item(), 4) for i, l in enumerate(LABELS)},
    )

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=7860)