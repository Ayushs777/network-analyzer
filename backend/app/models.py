from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, JSON, Index
from .database import Base
from datetime import datetime

class Packet(Base):
    __tablename__ = "packets"
    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.now)
    src_ip = Column(String, index=True)
    dst_ip = Column(String, index=True)
    protocol = Column(String, index=True)
    src_port = Column(Integer, nullable=True)
    dst_port = Column(Integer, nullable=True, index=True)
    size = Column(Integer)

class Flow(Base):
    __tablename__ = "flows"
    id = Column(Integer, primary_key=True, index=True)
    flow_id = Column(String, unique=True, index=True)
    src_ip = Column(String, index=True)
    dst_ip = Column(String, index=True)
    protocol = Column(String, index=True)
    src_port = Column(Integer, nullable=True)
    dst_port = Column(Integer, nullable=True)
    start_time = Column(DateTime, default=datetime.now)
    last_time = Column(DateTime, default=datetime.now)
    duration = Column(Float, default=0.0)
    packet_count = Column(Integer, default=0)
    total_bytes = Column(Integer, default=0)

class Alert(Base):
    __tablename__ = "alerts"
    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.now)
    level = Column(String, index=True) # Low, Medium, High
    description = Column(String)
    source_ip = Column(String, index=True)
    details = Column(JSON)

class IPScore(Base):
    __tablename__ = "ip_scores"
    id = Column(Integer, primary_key=True, index=True)
    ip_address = Column(String, unique=True, index=True)
    score = Column(Float, default=0.0, index=True) # 0-100
    category = Column(String, default="Safe", index=True) # Safe, Suspicious, Malicious
    last_updated = Column(DateTime, default=datetime.now)
