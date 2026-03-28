from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import uuid, json

from database import get_db
from models import Client, EnrichmentRequest, CreditTransaction
from core.security import get_client_by_api_key, get_current_client
from scrapers.enrichment_engine import EnrichmentEngine

router = APIRouter(prefix="/v1", tags=["Enrichment"])
engine = EnrichmentEngine()

# ── Schemas ───────────────────────────────────────────────────────────────────

class CompanyInput(BaseModel):
    name: str
    country: Optional[str] = None
    website: Optional[str] = None

class ContactInput(BaseModel):
    email: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    company: Optional[str] = None

# ── Helpers ───────────────────────────────────────────────────────────────────

def _deduct_credit(client: Client, db: Session, amount: int, description: str):
    client.credits -= amount
    client.total_requests += 1
    db.add(CreditTransaction(
        id=str(uuid.uuid4()),
        client_id=client.id,
        type="usage",
        amount=-amount,
        description=description
    ))

def _log_request(client: Client, api_key_id: str, req_type: str, query: str, result: dict, db: Session):
    db.add(EnrichmentRequest(
        id=str(uuid.uuid4()),
        client_id=client.id,
        api_key_id=api_key_id,
        request_type=req_type,
        query=query,
        result_json=json.dumps(result),
        confidence_score=result.get("confidence_score", 0),
        sources_used=",".join(result.get("sources_used", [])),
        from_cache=result.get("from_cache", False),
        credits_used=1
    ))

# ── Enrich Company ────────────────────────────────────────────────────────────

@router.post("/enrich/company")
async def enrich_company(
    data: CompanyInput,
    x_api_key: str = Header(...),
    db: Session = Depends(get_db)
):
    client, api_key = get_client_by_api_key(x_api_key, db)

    result = await engine.enrich_company(
        name=data.name,
        country=data.country,
        website=data.website,
        db=db
    )

    # Déduire 1 crédit seulement si pas du cache
    credits_used = 0 if result.get("from_cache") else 1
    if credits_used > 0:
        _deduct_credit(client, db, credits_used, f"Enrichissement entreprise: {data.name}")

    _log_request(client, api_key.id, "company", data.name, result, db)
    db.commit()

    result["credits_used"] = credits_used
    result["enriched_at"] = datetime.utcnow().isoformat()
    return result

# ── Enrich Contact ────────────────────────────────────────────────────────────

@router.post("/enrich/contact")
async def enrich_contact(
    data: ContactInput,
    x_api_key: str = Header(...),
    db: Session = Depends(get_db)
):
    if not data.email and not (data.first_name and data.last_name):
        raise HTTPException(400, "Fournissez un email ou un prénom + nom")

    client, api_key = get_client_by_api_key(x_api_key, db)

    result = await engine.enrich_contact(
        email=data.email,
        first_name=data.first_name,
        last_name=data.last_name,
        company=data.company,
        db=db
    )

    credits_used = 0 if result.get("from_cache") else 1
    if credits_used > 0:
        query = data.email or f"{data.first_name} {data.last_name}"
        _deduct_credit(client, db, credits_used, f"Enrichissement contact: {query}")

    query_str = data.email or f"{data.first_name} {data.last_name}"
    _log_request(client, api_key.id, "contact", query_str, result, db)
    db.commit()

    result["credits_used"] = credits_used
    result["enriched_at"] = datetime.utcnow().isoformat()
    return result

# ── Batch Enrichment ──────────────────────────────────────────────────────────

@router.post("/enrich/batch")
async def enrich_batch(
    companies: list[CompanyInput],
    x_api_key: str = Header(...),
    db: Session = Depends(get_db)
):
    if len(companies) > 100:
        raise HTTPException(400, "Maximum 100 entrées par batch")
    client, api_key = get_client_by_api_key(x_api_key, db)

    # Vérifier que le client a assez de crédits
    if client.credits < len(companies):
        raise HTTPException(402, f"Crédits insuffisants. Vous avez {client.credits} crédits, il en faut {len(companies)}.")

    results = []
    for company in companies:
        result = await engine.enrich_company(
            name=company.name,
            country=company.country,
            website=company.website,
            db=db
        )
        credits_used = 0 if result.get("from_cache") else 1
        if credits_used > 0:
            _deduct_credit(client, db, credits_used, f"Batch: {company.name}")
        _log_request(client, api_key.id, "batch", company.name, result, db)
        result["input"] = company.name
        result["credits_used"] = credits_used
        results.append(result)

    db.commit()
    return {
        "count": len(results),
        "total_credits_used": sum(r["credits_used"] for r in results),
        "results": results
    }

# ── Stats & historique (dashboard) ───────────────────────────────────────────

@router.get("/stats")
async def get_stats(
    client: Client = Depends(get_current_client),
    db: Session = Depends(get_db)
):
    requests = db.query(EnrichmentRequest).filter(
        EnrichmentRequest.client_id == client.id
    ).all()

    total = len(requests)
    companies = sum(1 for r in requests if r.request_type == "company")
    contacts = sum(1 for r in requests if r.request_type == "contact")
    batches = sum(1 for r in requests if r.request_type == "batch")
    cache_hits = sum(1 for r in requests if r.from_cache)
    avg_confidence = sum(r.confidence_score for r in requests) / total if total else 0

    return {
        "total_requests": total,
        "companies_enriched": companies,
        "contacts_enriched": contacts,
        "batch_requests": batches,
        "cache_hit_rate": round(cache_hits / total * 100, 1) if total else 0,
        "avg_confidence": round(avg_confidence, 2),
        "credits_remaining": client.credits,
        "total_requests_all_time": client.total_requests,
    }

@router.get("/history")
async def get_history(
    limit: int = 50,
    type: Optional[str] = None,
    client: Client = Depends(get_current_client),
    db: Session = Depends(get_db)
):
    query = db.query(EnrichmentRequest).filter(
        EnrichmentRequest.client_id == client.id
    )
    if type:
        query = query.filter(EnrichmentRequest.request_type == type)
    rows = query.order_by(EnrichmentRequest.created_at.desc()).limit(limit).all()

    return {"history": [
        {
            "id": r.id,
            "type": r.request_type,
            "query": r.query,
            "confidence_score": r.confidence_score,
            "sources_used": r.sources_used.split(",") if r.sources_used else [],
            "from_cache": r.from_cache,
            "credits_used": r.credits_used,
            "created_at": r.created_at.isoformat(),
        }
        for r in rows
    ]}

@router.get("/credits/history")
async def get_credit_history(
    client: Client = Depends(get_current_client),
    db: Session = Depends(get_db)
):
    from models import CreditTransaction
    txs = db.query(CreditTransaction).filter(
        CreditTransaction.client_id == client.id
    ).order_by(CreditTransaction.created_at.desc()).limit(50).all()

    return {"transactions": [
        {
            "type": t.type,
            "amount": t.amount,
            "description": t.description,
            "created_at": t.created_at.isoformat()
        }
        for t in txs
    ]}
