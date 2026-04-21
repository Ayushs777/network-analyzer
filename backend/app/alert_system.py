from sqlalchemy.orm import Session
from datetime import datetime
import json

from . import models
from .database import SessionLocal

class AlertSystem:
    def __init__(self, ws_manager):
        self.ws_manager = ws_manager

    async def trigger_alert(self, level: str, description: str, source_ip: str, details: dict):
        db = SessionLocal()
        try:
            # Check if recent similar alert exists to prevent spam
            recent_alert = db.query(models.Alert).filter(
                models.Alert.source_ip == source_ip,
                models.Alert.description == description
            ).order_by(models.Alert.timestamp.desc()).first()

            if recent_alert:
                time_diff = (datetime.now() - recent_alert.timestamp).total_seconds()
                if time_diff < 60: # Limit similar alerts to 1 per minute
                    return
            
            new_alert = models.Alert(
                level=level,
                description=description,
                source_ip=source_ip,
                details=details
            )
            db.add(new_alert)
            db.commit()
            db.refresh(new_alert)

            # Broadcast via websocket
            alert_data = {
                "type": "alert",
                "data": {
                    "id": new_alert.id,
                    "level": new_alert.level,
                    "description": new_alert.description,
                    "source_ip": new_alert.source_ip,
                    "timestamp": new_alert.timestamp.isoformat()
                }
            }
            await self.ws_manager.broadcast(alert_data)
        finally:
            db.close()
