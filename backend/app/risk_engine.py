import requests
from sqlalchemy.orm import Session
from datetime import datetime
from . import models
from .database import SessionLocal

class RiskEngine:
    def __init__(self, ws_manager):
        self.ws_manager = ws_manager

    async def update_score(self, ip_address: str, points: float, category_override: str = None):
        db = SessionLocal()
        try:
            score_record = db.query(models.IPScore).filter(models.IPScore.ip_address == ip_address).first()
            if not score_record:
                score_record = models.IPScore(ip_address=ip_address, score=0.0)
                db.add(score_record)

            # Cap the score between 0 and 100
            score_record.score = max(0.0, min(100.0, score_record.score + points))
            score_record.last_updated = datetime.utcnow()
            
            if category_override:
                score_record.category = category_override
            else:
                if score_record.score >= 80:
                    score_record.category = "Malicious"
                elif score_record.score >= 50:
                    score_record.category = "Suspicious"
                else:
                    score_record.category = "Safe"
                
            db.commit()
            db.refresh(score_record)
            
            # Broadcast update
            await self.ws_manager.broadcast({
                "type": "risk_update",
                "data": {
                    "ip_address": score_record.ip_address,
                    "score": score_record.score,
                    "category": score_record.category
                }
            })
            
            return score_record.score
        finally:
            db.close()
            
    def check_threat_intel(self, ip_address: str):
        # Optional integration with something like AbuseIPDB
        # Since this is an example, we will simulate it. 
        # But this is where external API integration happens.
        pass
