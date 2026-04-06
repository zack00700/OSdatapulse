from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from datetime import datetime, timedelta
import uuid, hashlib

from database import get_db
from models import Client, APIKey, RefreshToken, CreditTransaction
from core.security import (
    hash_password, verify_password,
    create_access_token, create_refresh_token, decode_token,
    generate_api_key, get_current_client
)

router = APIRouter(prefix="/auth", tags=["Auth"])

class RegisterInput(BaseModel):
    email: EmailStr
    password: str
    company_name: str
    full_name: str

class LoginInput(BaseModel):
    email: EmailStr
    password: str

class RefreshInput(BaseModel):
    refresh_token: str

def _build_client_dict(client: Client, prod_key: str = None, test_key: str = None) -> dict:
    d = {
        "id": client.id,
        "email": client.email,
        "company_name": client.company_name,
        "full_name": client.full_name,
        "plan": client.plan,
        "credits": client.credits,
        "total_requests": client.total_requests,
    }
    if prod_key: d["api_key_production"] = prod_key
    if test_key: d["api_key_test"] = test_key
    return d

@router.post("/register", status_code=201)
async def register(data: RegisterInput, db: Session = Depends(get_db)):
    if len(data.password) < 8:
        raise HTTPException(400, "Mot de passe trop court (8 caractères minimum)")
    if db.query(Client).filter(Client.email == data.email).first():
        raise HTTPException(409, "Email déjà utilisé")

    client = Client(
        id=str(uuid.uuid4()),
        email=data.email,
        password_hash=hash_password(data.password),
        company_name=data.company_name,
        full_name=data.full_name,
        plan="payg",
        credits=50,   # 50 crédits offerts à l'inscription
    )
    db.add(client)

    # Bonus inscription en historique
    db.add(CreditTransaction(
        id=str(uuid.uuid4()),
        client_id=client.id,
        type="signup_bonus",
        amount=50,
        description="50 crédits offerts à l'inscription"
    ))

    # Clé production
    raw_prod, hash_prod = generate_api_key()
    db.add(APIKey(id=str(uuid.uuid4()), client_id=client.id, key_hash=hash_prod, label="Production", environment="production"))

    # Clé test
    raw_test, hash_test = generate_api_key()
    db.add(APIKey(id=str(uuid.uuid4()), client_id=client.id, key_hash=hash_test, label="Test", environment="test"))

    db.commit()

    access = create_access_token({"sub": client.id})
    refresh = create_refresh_token(client.id)
    db.add(RefreshToken(
        id=str(uuid.uuid4()),
        client_id=client.id,
        token_hash=hashlib.sha256(refresh.encode()).hexdigest(),
        expires_at=datetime.utcnow() + timedelta(days=30)
    ))
    db.commit()

    return {
        "access_token": access,
        "refresh_token": refresh,
        "token_type": "bearer",
        "client": _build_client_dict(client, raw_prod, raw_test)
    }

@router.post("/login")
async def login(data: LoginInput, db: Session = Depends(get_db)):
    client = db.query(Client).filter(Client.email == data.email).first()
    if not client or not verify_password(data.password, client.password_hash):
        raise HTTPException(401, "Email ou mot de passe incorrect")
    if not client.is_active:
        raise HTTPException(403, "Compte désactivé")

    client.last_login_at = datetime.utcnow()

    access = create_access_token({"sub": client.id})
    refresh = create_refresh_token(client.id)
    db.add(RefreshToken(
        id=str(uuid.uuid4()),
        client_id=client.id,
        token_hash=hashlib.sha256(refresh.encode()).hexdigest(),
        expires_at=datetime.utcnow() + timedelta(days=30)
    ))
    db.commit()

    return {
        "access_token": access,
        "refresh_token": refresh,
        "token_type": "bearer",
        "client": _build_client_dict(client)
    }

@router.post("/refresh")
async def refresh(data: RefreshInput, db: Session = Depends(get_db)):
    payload = decode_token(data.refresh_token)
    if payload.get("type") != "refresh":
        raise HTTPException(401, "Token invalide")
    token_hash = hashlib.sha256(data.refresh_token.encode()).hexdigest()
    rt = db.query(RefreshToken).filter(
        RefreshToken.token_hash == token_hash,
        RefreshToken.is_revoked == False
    ).first()
    if not rt:
        raise HTTPException(401, "Token révoqué")
    return {"access_token": create_access_token({"sub": payload["sub"]}), "token_type": "bearer"}

@router.get("/me")
async def me(client: Client = Depends(get_current_client)):
    return _build_client_dict(client)

@router.post("/logout")
async def logout(data: RefreshInput, db: Session = Depends(get_db)):
    token_hash = hashlib.sha256(data.refresh_token.encode()).hexdigest()
    rt = db.query(RefreshToken).filter(RefreshToken.token_hash == token_hash).first()
    if rt:
        rt.is_revoked = True
        db.commit()
    return {"message": "Déconnecté"}
