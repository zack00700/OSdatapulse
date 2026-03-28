from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import datetime
import uuid

from database import get_db
from models import Client, APIKey
from core.security import get_current_client, generate_api_key

router = APIRouter(prefix="/v1/apikeys", tags=["API Keys"])

class CreateKeyInput(BaseModel):
    label: str = "Ma clé"
    environment: str = "production"

@router.get("")
async def list_keys(client: Client = Depends(get_current_client), db: Session = Depends(get_db)):
    keys = db.query(APIKey).filter(APIKey.client_id == client.id, APIKey.is_active == True).all()
    return {"api_keys": [
        {
            "id": k.id, "label": k.label, "environment": k.environment,
            "key_preview": "dp_" + ("prod" if k.environment == "production" else "test") + "_••••••••••••••••",
            "last_used_at": k.last_used_at.isoformat() if k.last_used_at else None,
            "created_at": k.created_at.isoformat(),
        }
        for k in keys
    ]}

@router.post("", status_code=201)
async def create_key(data: CreateKeyInput, client: Client = Depends(get_current_client), db: Session = Depends(get_db)):
    count = db.query(APIKey).filter(APIKey.client_id == client.id, APIKey.is_active == True).count()
    if count >= 5:
        raise HTTPException(400, "Maximum 5 clés par compte")
    raw_key, key_hash = generate_api_key()
    db.add(APIKey(id=str(uuid.uuid4()), client_id=client.id, key_hash=key_hash, label=data.label, environment=data.environment))
    db.commit()
    return {"api_key": raw_key, "label": data.label, "environment": data.environment, "message": "Sauvegardez cette clé — elle ne sera plus affichée."}

@router.delete("/{key_id}")
async def revoke_key(key_id: str, client: Client = Depends(get_current_client), db: Session = Depends(get_db)):
    key = db.query(APIKey).filter(APIKey.id == key_id, APIKey.client_id == client.id).first()
    if not key:
        raise HTTPException(404, "Clé introuvable")
    key.is_active = False
    db.commit()
    return {"message": "Clé révoquée"}
