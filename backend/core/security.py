from datetime import datetime, timedelta
from typing import Optional
import secrets, hashlib
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, Header
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from core.config import settings
from database import get_db, SessionLocal
from models import Client, APIKey

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
bearer_scheme = HTTPBearer(auto_error=False)

def hash_password(p: str) -> str: return pwd_context.hash(p)
def verify_password(plain: str, hashed: str) -> bool: return pwd_context.verify(plain, hashed)

def create_access_token(data: dict) -> str:
    payload = data.copy()
    payload["exp"] = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    payload["type"] = "access"
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

def create_refresh_token(client_id: str) -> str:
    payload = {
        "sub": client_id,
        "exp": datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
        "type": "refresh"
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    except JWTError:
        raise HTTPException(status_code=401, detail="Token invalide ou expiré")

def generate_api_key() -> tuple[str, str]:
    raw = "dp_" + secrets.token_urlsafe(32)
    return raw, hashlib.sha256(raw.encode()).hexdigest()

def get_current_client(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db)
) -> Client:
    if not credentials:
        raise HTTPException(status_code=401, detail="Token manquant")
    payload = decode_token(credentials.credentials)
    if payload.get("type") != "access":
        raise HTTPException(status_code=401, detail="Type de token invalide")
    client = db.query(Client).filter(
        Client.id == payload.get("sub"),
        Client.is_active == True
    ).first()
    if not client:
        raise HTTPException(status_code=401, detail="Compte introuvable")
    return client

def get_client_by_api_key(x_api_key: str, db: Session) -> tuple[Client, APIKey]:
    key_hash = hashlib.sha256(x_api_key.encode()).hexdigest()
    api_key = db.query(APIKey).filter(
        APIKey.key_hash == key_hash,
        APIKey.is_active == True
    ).first()
    if not api_key:
        raise HTTPException(status_code=401, detail="Clé API invalide")
    client = db.query(Client).filter(
        Client.id == api_key.client_id,
        Client.is_active == True
    ).first()
    if not client:
        raise HTTPException(status_code=401, detail="Compte introuvable")
    if client.credits <= 0:
        raise HTTPException(status_code=402, detail="Crédits insuffisants. Rechargez votre compte.")
    api_key.last_used_at = datetime.utcnow()
    db.commit()
    return client, api_key
