from sqlalchemy import Column, String, Float, Boolean, DateTime, Integer, Text
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime
import uuid

Base = declarative_base()
def gen_id(): return str(uuid.uuid4())

class Client(Base):
    __tablename__ = "clients"

    id = Column(String, primary_key=True, default=gen_id)
    email = Column(String, unique=True, nullable=False, index=True)
    password_hash = Column(String, nullable=False)
    company_name = Column(String, nullable=False)
    full_name = Column(String, nullable=True)

    # Plan & crédits
    plan = Column(String, default="payg")       # payg | starter | pro | business
    credits = Column(Integer, default=50)        # crédits disponibles
    total_requests = Column(Integer, default=0)

    # Stripe
    stripe_customer_id = Column(String, nullable=True)
    stripe_subscription_id = Column(String, nullable=True)

    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    last_login_at = Column(DateTime, nullable=True)


class APIKey(Base):
    __tablename__ = "api_keys"

    id = Column(String, primary_key=True, default=gen_id)
    client_id = Column(String, nullable=False, index=True)
    key_hash = Column(String, unique=True, nullable=False)
    label = Column(String, default="Ma clé")
    environment = Column(String, default="production")
    is_active = Column(Boolean, default=True)
    last_used_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class EnrichmentRequest(Base):
    """Chaque appel d'enrichissement."""
    __tablename__ = "enrichment_requests"

    id = Column(String, primary_key=True, default=gen_id)
    client_id = Column(String, nullable=False, index=True)
    api_key_id = Column(String, nullable=True)

    request_type = Column(String, nullable=False)  # company | contact | batch
    query = Column(String, nullable=False)          # Ce qui a été cherché

    # Résultat
    result_json = Column(Text, nullable=True)       # JSON du résultat complet
    confidence_score = Column(Float, default=0.0)
    sources_used = Column(String, default="")       # clearbit,opencorp,...
    from_cache = Column(Boolean, default=False)
    credits_used = Column(Integer, default=1)

    created_at = Column(DateTime, default=datetime.utcnow)


class EnrichmentCache(Base):
    """Cache des résultats pour éviter de re-scraper."""
    __tablename__ = "enrichment_cache"

    id = Column(String, primary_key=True, default=gen_id)
    cache_key = Column(String, unique=True, nullable=False, index=True)
    result_json = Column(Text, nullable=False)
    confidence_score = Column(Float, default=0.0)
    expires_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class CreditTransaction(Base):
    """Historique des mouvements de crédits."""
    __tablename__ = "credit_transactions"

    id = Column(String, primary_key=True, default=gen_id)
    client_id = Column(String, nullable=False, index=True)
    type = Column(String, nullable=False)       # purchase | usage | refund | signup_bonus
    amount = Column(Integer, nullable=False)    # positif = crédit, négatif = débit
    description = Column(String, default="")
    stripe_payment_id = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class RefreshToken(Base):
    __tablename__ = "refresh_tokens"

    id = Column(String, primary_key=True, default=gen_id)
    client_id = Column(String, nullable=False, index=True)
    token_hash = Column(String, unique=True, nullable=False)
    is_revoked = Column(Boolean, default=False)
    expires_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
