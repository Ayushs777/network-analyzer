from pydantic import BaseModel
from datetime import datetime
from typing import Optional, Dict, Any, List

class PacketBase(BaseModel):
    src_ip: str
    dst_ip: str
    protocol: str
    src_port: Optional[int] = None
    dst_port: Optional[int] = None
    size: int

class PacketSchema(PacketBase):
    id: int
    timestamp: datetime

    model_config = {
        "from_attributes": True
    }


class FlowBase(BaseModel):
    flow_id: str
    src_ip: str
    dst_ip: str
    protocol: str
    src_port: Optional[int] = None
    dst_port: Optional[int] = None
    duration: float
    packet_count: int
    total_bytes: int

class FlowSchema(FlowBase):
    id: int
    start_time: datetime
    last_time: datetime

    model_config = {
        "from_attributes": True
    }


class AlertBase(BaseModel):
    level: str
    description: str
    source_ip: str
    details: Optional[Dict[str, Any]] = None

class AlertSchema(AlertBase):
    id: int
    timestamp: datetime

    model_config = {
        "from_attributes": True
    }


class IPScoreBase(BaseModel):
    ip_address: str
    score: float
    category: str

class IPScoreSchema(IPScoreBase):
    id: int
    last_updated: datetime

    model_config = {
        "from_attributes": True
    }

