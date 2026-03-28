"""
EnrichmentEngine — Sources gratuites actives maintenant
Sources payantes commentées → décommenter quand tu as les clés API

Sources actives :
  1. Clearbit Autocomplete (gratuit, pas de clé)
  2. OpenCorporates (gratuit 500 req/jour)
  3. DuckDuckGo Instant Answer (gratuit, illimité)
  4. Hunter.io domain search (si HUNTER_API_KEY défini)

Sources à activer plus tard :
  - Proxycurl (LinkedIn) → 0.01$/appel
  - Clearbit Enrichment → 99$/mois
  - Pappers.fr (France) → 0.10€/fiche
"""
import asyncio, httpx, json, hashlib, re
from typing import Optional, Dict, Any
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from models import EnrichmentCache
from core.config import settings


class EnrichmentEngine:

    def __init__(self):
        self.client = httpx.AsyncClient(
            timeout=8.0,
            follow_redirects=True,
            headers={"User-Agent": "DataPulse/1.0 (contact@datapulse.io)"}
        )

    # ── Cache ─────────────────────────────────────────────────────────────────

    def _cache_key(self, type_: str, query: str, country: str = "") -> str:
        raw = f"{type_}:{query.lower().strip()}:{country.lower()}"
        return hashlib.md5(raw.encode()).hexdigest()

    def get_cached(self, db: Session, cache_key: str) -> Optional[Dict]:
        row = db.query(EnrichmentCache).filter(
            EnrichmentCache.cache_key == cache_key,
            EnrichmentCache.expires_at > datetime.utcnow()
        ).first()
        if row:
            return json.loads(row.result_json)
        return None

    def save_cache(self, db: Session, cache_key: str, result: Dict):
        existing = db.query(EnrichmentCache).filter(
            EnrichmentCache.cache_key == cache_key
        ).first()
        if existing:
            existing.result_json = json.dumps(result)
            existing.expires_at = datetime.utcnow() + timedelta(seconds=settings.CACHE_TTL_SECONDS)
        else:
            db.add(EnrichmentCache(
                cache_key=cache_key,
                result_json=json.dumps(result),
                confidence_score=result.get("confidence_score", 0),
                expires_at=datetime.utcnow() + timedelta(seconds=settings.CACHE_TTL_SECONDS)
            ))
        db.commit()

    # ── Company enrichment ────────────────────────────────────────────────────

    async def enrich_company(
        self,
        name: str,
        country: Optional[str] = None,
        website: Optional[str] = None,
        db: Session = None
    ) -> Dict[str, Any]:

        # Vérifier le cache
        cache_key = self._cache_key("company", name, country or "")
        if db:
            cached = self.get_cached(db, cache_key)
            if cached:
                cached["from_cache"] = True
                return cached

        # Lancer toutes les sources en parallèle
        results = await asyncio.gather(
            self._clearbit_company(name, website),
            self._opencorporates_company(name, country),
            self._duckduckgo_company(name, country),
            self._hunter_domain(website or name),
            return_exceptions=True
        )

        merged = self._merge_company(results, name, country)

        # Sauvegarder en cache
        if db:
            self.save_cache(db, cache_key, merged)

        return merged

    # ── Contact enrichment ────────────────────────────────────────────────────

    async def enrich_contact(
        self,
        email: Optional[str] = None,
        first_name: Optional[str] = None,
        last_name: Optional[str] = None,
        company: Optional[str] = None,
        db: Session = None
    ) -> Dict[str, Any]:

        query = email or f"{first_name} {last_name} {company}"
        cache_key = self._cache_key("contact", query)
        if db:
            cached = self.get_cached(db, cache_key)
            if cached:
                cached["from_cache"] = True
                return cached

        results = await asyncio.gather(
            self._enrich_from_email(email) if email else asyncio.sleep(0),
            self._clearbit_company(company or "", None) if company else asyncio.sleep(0),
            return_exceptions=True
        )

        merged = self._merge_contact(results, email, first_name, last_name, company)
        if db:
            self.save_cache(db, cache_key, merged)
        return merged

    # ── Source 1 : Clearbit Autocomplete (gratuit) ────────────────────────────

    async def _clearbit_company(self, name: str, website: Optional[str]) -> Dict:
        try:
            query = website.replace("https://", "").replace("www.", "") if website else name
            url = f"{settings.CLEARBIT_AUTOCOMPLETE_URL}?query={query}"
            r = await self.client.get(url)
            if r.status_code == 200:
                data = r.json()
                if data:
                    c = data[0]
                    return {
                        "name": c.get("name"),
                        "domain": c.get("domain"),
                        "logo": c.get("logo"),
                        "_source": "clearbit",
                        "_confidence": 0.75
                    }
        except Exception:
            pass
        return {}

    # ── Source 2 : OpenCorporates (gratuit 500/jour) ──────────────────────────

    async def _opencorporates_company(self, name: str, country: Optional[str]) -> Dict:
        try:
            params = {"q": name, "format": "json"}
            if country:
                params["jurisdiction_code"] = country.lower()
            if settings.OPENCORP_API_KEY:
                params["api_token"] = settings.OPENCORP_API_KEY

            r = await self.client.get(settings.OPENCORPORATES_URL, params=params)
            if r.status_code == 200:
                data = r.json()
                companies = data.get("results", {}).get("companies", [])
                if companies:
                    c = companies[0]["company"]
                    return {
                        "name": c.get("name"),
                        "country": (c.get("jurisdiction_code") or "").upper()[:2],
                        "founded_year": self._parse_year(c.get("incorporation_date")),
                        "company_number": c.get("company_number"),
                        "registered_address": c.get("registered_address_in_full"),
                        "_source": "opencorporates",
                        "_confidence": 0.82
                    }
        except Exception:
            pass
        return {}

    # ── Source 3 : DuckDuckGo Instant Answer (gratuit) ────────────────────────

    async def _duckduckgo_company(self, name: str, country: Optional[str]) -> Dict:
        try:
            query = f"{name} company {country or ''}"
            r = await self.client.get(
                settings.DUCKDUCKGO_URL,
                params={"q": query, "format": "json", "no_html": "1", "skip_disambig": "1"}
            )
            if r.status_code == 200:
                data = r.json()
                result = {}
                if data.get("AbstractText"):
                    result["description"] = data["AbstractText"][:400]
                    result["_source"] = "duckduckgo"
                    result["_confidence"] = 0.50
                if data.get("Infobox"):
                    for item in data["Infobox"].get("content", []):
                        label = item.get("label", "").lower()
                        val = item.get("value", "")
                        if "founded" in label: result["founded_year"] = self._parse_year(str(val))
                        elif "employees" in label or "staff" in label: result["employee_count"] = str(val)
                        elif "industry" in label or "sector" in label: result["industry"] = str(val)
                        elif "headquarters" in label: result["city"] = str(val)
                if result:
                    return result
        except Exception:
            pass
        return {}

    # ── Source 4 : Hunter.io (gratuit 25 req/mois, ou payant) ────────────────

    async def _hunter_domain(self, domain_or_name: str) -> Dict:
        try:
            if not settings.HUNTER_API_KEY:
                # Sans clé → juste deviner le pattern email depuis le domaine
                domain = domain_or_name.replace("https://", "").replace("www.", "").split("/")[0]
                if "." in domain:
                    return {"email_pattern": f"{{first}}@{domain}", "_source": "domain_guess", "_confidence": 0.35}
                return {}

            # Avec clé → appel API Hunter
            r = await self.client.get(
                "https://api.hunter.io/v2/domain-search",
                params={"domain": domain_or_name, "api_key": settings.HUNTER_API_KEY, "limit": 1}
            )
            if r.status_code == 200:
                data = r.json().get("data", {})
                return {
                    "email_pattern": data.get("pattern"),
                    "industry": data.get("industry"),
                    "employee_count": str(data.get("size", "")),
                    "_source": "hunter",
                    "_confidence": 0.85
                }
        except Exception:
            pass
        return {}

    async def _enrich_from_email(self, email: str) -> Dict:
        """Enrichit un contact depuis son email (domaine → entreprise)."""
        try:
            domain = email.split("@")[-1] if "@" in email else ""
            if not domain:
                return {}

            # Chercher l'entreprise depuis le domaine
            company_data = await self._clearbit_company("", domain)
            result = {"email": email, "_source": "email_domain", "_confidence": 0.55}
            if company_data.get("name"):
                result["company"] = company_data["name"]
                result["domain"] = company_data.get("domain")
                result["_confidence"] = 0.65
            return result
        except Exception:
            return {}

    # ── Fusion des résultats ──────────────────────────────────────────────────

    def _merge_company(self, results, original_name: str, country: Optional[str]) -> Dict:
        merged = {
            "name": original_name,
            "domain": None,
            "industry": None,
            "employee_count": None,
            "country": country,
            "city": None,
            "linkedin_url": None,   # Proxycurl quand tu l'actives
            "founded_year": None,
            "description": None,
            "phone": None,
            "email_pattern": None,
            "company_number": None,
            "logo": None,
            "confidence_score": 0.0,
            "sources_used": [],
            "from_cache": False
        }

        confidences = []
        for r in results:
            if not isinstance(r, dict) or not r:
                continue
            source = r.pop("_source", None)
            conf = r.pop("_confidence", 0)
            if source:
                merged["sources_used"].append(source)
                confidences.append(conf)
            for key, val in r.items():
                if key.startswith("_"):
                    continue
                if merged.get(key) is None and val:
                    merged[key] = val

        merged["confidence_score"] = round(
            sum(confidences) / len(confidences) if confidences else 0.1, 2
        )
        merged["sources_used"] = list(set(merged["sources_used"]))
        return merged

    def _merge_contact(self, results, email, first_name, last_name, company) -> Dict:
        merged = {
            "full_name": f"{first_name or ''} {last_name or ''}".strip() or None,
            "email": email,
            "job_title": None,
            "company": company,
            "domain": None,
            "linkedin_url": None,
            "phone": None,
            "location": None,
            "confidence_score": 0.0,
            "sources_used": [],
            "from_cache": False
        }
        confidences = []
        for r in results:
            if not isinstance(r, dict) or not r:
                continue
            source = r.pop("_source", None)
            conf = r.pop("_confidence", 0)
            if source:
                merged["sources_used"].append(source)
                confidences.append(conf)
            for key, val in r.items():
                if not key.startswith("_") and merged.get(key) is None and val:
                    merged[key] = val
        merged["confidence_score"] = round(
            sum(confidences) / len(confidences) if confidences else 0.1, 2
        )
        return merged

    def _parse_year(self, s: Optional[str]) -> Optional[int]:
        if not s: return None
        m = re.search(r"\d{4}", str(s))
        return int(m.group()) if m else None
