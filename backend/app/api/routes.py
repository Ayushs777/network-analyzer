import asyncio
import socket
import subprocess
import os
import random
import requests
import hashlib
import base64
from typing import List
from fastapi import APIRouter, Depends, HTTPException, Request, Response
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import desc, func
from pydantic import BaseModel

from .. import models, schemas
from ..database import get_db, SessionLocal
from ..websocket.manager import packet_manager, traffic_manager

from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib import colors
from io import BytesIO

from jose import JWTError, jwt
from datetime import timedelta
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import os
import logging

logger = logging.getLogger(__name__)

SECRET_KEY = os.getenv("SECRET_KEY", "qC7rBBkM3tS9a_sm2Opqnx-B4v1vury10JEpqeJEkv8")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
security = HTTPBearer()

SALT = os.getenv("PASSWORD_SALT", "network-analyzer-salt").encode() if isinstance(os.getenv("PASSWORD_SALT", "network-analyzer-salt"), str) else b"network-analyzer-salt"

def get_password_hash(password: str) -> str:
    dk = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), SALT, 100000)
    return base64.urlsafe_b64encode(dk).decode("utf-8")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return get_password_hash(plain_password) == hashed_password

# Mock user
fake_users_db = {
    "admin": {
        "username": "admin",
        "hashed_password": get_password_hash("password"),
        "role": "admin"
    }
}

def authenticate_user(username: str, password: str):
    user = fake_users_db.get(username)
    if not user:
        return False
    if not verify_password(password, user["hashed_password"]):
        return False
    return user

def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
        user = fake_users_db.get(username)
        if user is None:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
        return user
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")

router = APIRouter()

@router.post("/login")
def login(request: dict):
    username = request.get("username")
    password = request.get("password")
    user = authenticate_user(username, password)
    if not user:
        raise HTTPException(status_code=400, detail="Incorrect username or password")
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user["username"]}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/packets", response_model=List[schemas.PacketSchema])
def read_packets(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    packets = db.query(models.Packet).order_by(desc(models.Packet.timestamp)).offset(skip).limit(limit).all()
    return packets

@router.get("/flows", response_model=List[schemas.FlowSchema])
def read_flows(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    flows = db.query(models.Flow).order_by(desc(models.Flow.last_time)).offset(skip).limit(limit).all()
    return flows

@router.get("/alerts", response_model=List[schemas.AlertSchema])
def read_alerts(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    alerts = db.query(models.Alert).order_by(desc(models.Alert.timestamp)).offset(skip).limit(limit).all()
    return alerts

@router.get("/ip-scores", response_model=List[schemas.IPScoreSchema])
def read_ip_scores(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    scores = db.query(models.IPScore).order_by(desc(models.IPScore.score)).offset(skip).limit(limit).all()
    return scores

@router.post("/simulate")
async def simulate_traffic():
    """Generates 10 seconds of mock traffic for testing/UI demo."""
    async def run_sim():
        db = SessionLocal()
        try:
            # Add Mock IP Scores for Geo Map visualization
            mock_threats = [
                ("185.191.171.1", 95, "Botnet C2"),
                ("45.33.32.156", 82, "Exploit Attempt"),
                ("103.212.223.4", 78, "Port Scanner"),
                ("192.168.1.50", 15, "Local Device")
            ]
            for ip, score, cat in mock_threats:
                existing = db.query(models.IPScore).filter(models.IPScore.ip_address == ip).first()
                if not existing:
                    db.add(models.IPScore(ip_address=ip, score=score, category=cat))

            # Diverse Mock Alerts for a better report
            sim_scenarios = [
                ("High", "DDoS: SYN Flood Volumetric Attack", "185.191.171.1"),
                ("Critical", "SQL Injection: Malicious Pattern Match", "45.33.32.156"),
                ("High", "AI Engine: Temporal Deviation (Lateral Movement)", "10.0.0.88"),
                ("Medium", "Unauthorized Port Access: Port 22 (SSH)", "103.212.223.4")
            ]
            for level, desc, ip in sim_scenarios:
                db.add(models.Alert(
                    level=level,
                    description=desc,
                    source_ip=ip,
                    details={"simulated": True, "vector": desc.split(":")[0]},
                    timestamp=datetime.now()
                ))
            db.commit()
        except Exception as e:
            print(f"Sim Error: {e}")
            db.rollback()
        finally:
            db.close()

        for _ in range(30):
            pkt = {
                "src_ip": f"10.0.0.{random.randint(2, 254)}",
                "dst_ip": "192.168.1.100",
                "protocol": random.choice(["TCP", "UDP", "ICMP"]),
                "size": random.randint(64, 1500),
                "src_port": random.randint(1024, 65535),
                "dst_port": 80,
                "timestamp": datetime.now().isoformat()
            }
            await packet_manager.broadcast({"type": "packet", "data": pkt})
            await traffic_manager.broadcast({
                "type": "traffic_stats",
                "data": {
                    "bandwidth_mbps": random.uniform(2.5, 15.0),
                    "incoming_bps": random.randint(100000, 500000),
                    "outgoing_bps": random.randint(10000, 50000),
                    "total_packets": 1000,
                    "timestamp": datetime.now().isoformat()
                }
            })
            await asyncio.sleep(0.3)
            
    asyncio.create_task(run_sim())
    return {"status": "Simulation started"}

@router.delete("/purge")
def purge_database(db: Session = Depends(get_db)):
    """Clears all alerts and flows from the database."""
    db.query(models.Alert).delete()
    db.query(models.Flow).delete()
    db.commit()
    return {"status": "Database purged successfully"}

@router.get("/stats")
def get_stats(db: Session = Depends(get_db)):
    # Sum packets and bytes from Flows for efficiency
    flow_stats = db.query(
        func.sum(models.Flow.packet_count),
        func.sum(models.Flow.total_bytes)
    ).first()
    total_packets = flow_stats[0] or 0
    total_bytes = flow_stats[1] or 0
    total_flows = db.query(models.Flow).count()
    total_alerts = db.query(models.Alert).count()
    high_alerts = db.query(models.Alert).filter(models.Alert.level == "High").count()

    # Fallback to packet-level analytics when flow aggregation is not yet available
    packet_stats = db.query(func.count(models.Packet.id), func.sum(models.Packet.size)).first()
    packet_count = packet_stats[0] or 0
    packet_bytes = packet_stats[1] or 0
    if total_packets == 0:
        total_packets = packet_count
    if total_bytes == 0:
        total_bytes = packet_bytes

    return {
        "total_packets": total_packets,
        "total_bytes": total_bytes,
        "total_flows": total_flows,
        "total_alerts": total_alerts,
        "high_alerts": high_alerts,
    }

@router.get("/report")
def get_forensic_report(db: Session = Depends(get_db)):
    # Network summary
    total_packets = db.query(func.count(models.Packet.id)).scalar() or 0
    total_bytes = db.query(func.sum(models.Packet.size)).scalar() or 0
    total_flows = db.query(func.count(models.Flow.id)).scalar() or 0
    
    # Protocol distribution
    protocol_stats = db.query(models.Packet.protocol, func.count(models.Packet.id)).group_by(models.Packet.protocol).all()
    protocol_data = {p: c for p, c in protocol_stats}
    
    # Recent threats
    recent_threats = db.query(models.Alert).order_by(desc(models.Alert.timestamp)).limit(20).all()
    threats = []
    for alert in recent_threats:
        threats.append({
            "level": alert.level,
            "description": alert.description,
            "source_ip": alert.source_ip,
            "timestamp": alert.timestamp.isoformat(),
            "details": alert.details
        })
    
    # Top talkers
    top_src = db.query(models.Packet.src_ip, func.count(models.Packet.id)).group_by(models.Packet.src_ip).order_by(func.count(models.Packet.id).desc()).limit(10).all()
    top_dst = db.query(models.Packet.dst_ip, func.count(models.Packet.id)).group_by(models.Packet.dst_ip).order_by(func.count(models.Packet.id).desc()).limit(10).all()
    
    # IP scores
    ip_scores = db.query(models.IPScore).order_by(desc(models.IPScore.score)).limit(10).all()
    scores = [{"ip": s.ip_address, "score": s.score, "category": s.category} for s in ip_scores]
    
    # Anomaly summary
    anomaly_count = db.query(models.Alert).filter(models.Alert.description.like("%AI Engine%")).count()
    ddos_count = db.query(models.Alert).filter(models.Alert.description.like("%DDoS%")).count()
    scan_count = db.query(models.Alert).filter(models.Alert.description.like("%Port Scan%")).count()
    
    # Risk Assessment
    high_risk_ips = db.query(models.IPScore).filter(models.IPScore.score > 70).count()
    total_risk_score = db.query(func.sum(models.IPScore.score)).scalar() or 0
    risk_level = "Low"
    if high_risk_ips > 5 or total_risk_score > 1000:
        risk_level = "High"
    elif high_risk_ips > 2 or total_risk_score > 500:
        risk_level = "Medium"
    
    return {
        "network_summary": {
            "total_packets": total_packets,
            "total_bytes": total_bytes,
            "total_flows": total_flows,
            "protocol_distribution": protocol_data
        },
        "recent_threats": threats,
        "top_talkers": {
            "sources": [{"ip": ip, "count": count} for ip, count in top_src],
            "destinations": [{"ip": ip, "count": count} for ip, count in top_dst]
        },
        "ip_scores": scores,
        "anomaly_summary": {
            "ai_detected": anomaly_count,
            "ddos_attacks": ddos_count,
            "port_scans": scan_count
        },
        "risk_assessment": {
            "overall_risk_level": risk_level,
            "high_risk_ips": high_risk_ips,
            "total_risk_score": total_risk_score
        },
        "generated_at": datetime.now().isoformat()
    }

@router.get("/report/pdf")
def get_forensic_report_pdf(db: Session = Depends(get_db)):
    # Get the same data as /report
    total_packets = db.query(func.count(models.Packet.id)).scalar() or 0
    total_bytes = db.query(func.sum(models.Packet.size)).scalar() or 0
    total_flows = db.query(func.count(models.Flow.id)).scalar() or 0
    
    protocol_stats = db.query(models.Packet.protocol, func.count(models.Packet.id)).group_by(models.Packet.protocol).all()
    protocol_data = {p: c for p, c in protocol_stats}
    
    recent_threats = db.query(models.Alert).order_by(desc(models.Alert.timestamp)).limit(20).all()
    threats = []
    for alert in recent_threats:
        threats.append({
            "level": alert.level,
            "description": alert.description,
            "source_ip": alert.source_ip,
            "timestamp": alert.timestamp.isoformat(),
            "details": alert.details
        })
    
    top_src = db.query(models.Packet.src_ip, func.count(models.Packet.id)).group_by(models.Packet.src_ip).order_by(func.count(models.Packet.id).desc()).limit(10).all()
    top_dst = db.query(models.Packet.dst_ip, func.count(models.Packet.id)).group_by(models.Packet.dst_ip).order_by(func.count(models.Packet.id).desc()).limit(10).all()
    
    ip_scores = db.query(models.IPScore).order_by(desc(models.IPScore.score)).limit(10).all()
    scores = [{"ip": s.ip_address, "score": s.score, "category": s.category} for s in ip_scores]
    
    anomaly_count = db.query(models.Alert).filter(models.Alert.description.like("%AI Engine%")).count()
    ddos_count = db.query(models.Alert).filter(models.Alert.description.like("%DDoS%")).count()
    scan_count = db.query(models.Alert).filter(models.Alert.description.like("%Port Scan%")).count()
    high_risk_ips = db.query(models.IPScore).filter(models.IPScore.score > 70).count()
    total_risk_score = db.query(func.sum(models.IPScore.score)).scalar() or 0
    risk_level = "Low"
    if high_risk_ips > 5 or total_risk_score > 1000:
        risk_level = "High"
    elif high_risk_ips > 2 or total_risk_score > 500:
        risk_level = "Medium"    
    # Generate PDF
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter)
    styles = getSampleStyleSheet()
    story = []
    
    # Title
    title_style = ParagraphStyle('Title', parent=styles['Heading1'], fontSize=18, spaceAfter=30)
    story.append(Paragraph("NETWORK FORENSIC AUDIT REPORT", title_style))
    story.append(Spacer(1, 12))
    
    # Summary
    story.append(Paragraph("Executive Summary", styles['Heading2']))
    summary = f"""
    Total Packets: {total_packets}<br/>
    Total Bytes: {total_bytes}<br/>
    Total Flows: {total_flows}<br/>
    Recent Threats: {len(threats)}<br/>
    AI Detected Anomalies: {anomaly_count}<br/>
    DDoS Attacks: {ddos_count}<br/>
    Port Scans: {scan_count}<br/>
    Overall Risk Level: {risk_level}<br/>
    High Risk IPs: {high_risk_ips}
    """
    story.append(Paragraph(summary, styles['Normal']))
    story.append(Spacer(1, 12))
    
    # Threats Table
    if threats:
        story.append(Paragraph("Recent Threats", styles['Heading3']))
        data = [['Level', 'Description', 'Source IP', 'Timestamp']]
        for t in threats[:10]:  # Limit to 10
            data.append([t['level'], t['description'][:50], t['source_ip'], t['timestamp'][:19]])
        table = Table(data)
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 14),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        story.append(table)
        story.append(Spacer(1, 12))
    
    # Top Talkers
    if top_src:
        story.append(Paragraph("Top Source IPs", styles['Heading3']))
        data = [['IP', 'Packet Count']]
        for ip, count in top_src[:5]:
            data.append([ip, str(count)])
        table = Table(data)
        table.setStyle(TableStyle([('GRID', (0, 0), (-1, -1), 1, colors.black)]))
        story.append(table)
    
    doc.build(story)
    buffer.seek(0)
    return Response(content=buffer.getvalue(), media_type='application/pdf', headers={"Content-Disposition": "attachment; filename=forensic_report.pdf"})

@router.get("/device-info")
def get_device_info():
    ip = '127.0.0.1'
    net_name = "Unknown Network"
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(('10.255.255.255', 1))
        ip = s.getsockname()[0]
        s.close()
        
        if os.name == 'nt':
            output = subprocess.check_output("netsh wlan show interfaces", shell=True).decode()
            for line in output.split('\n'):
                if "SSID" in line and "BSSID" not in line:
                    net_name = line.split(':')[1].strip()
                    break
            if net_name == "Unknown Network":
                net_name = "Ethernet / Wired"
    except: pass
        
    return {
        "local_ip": ip, 
        "network_name": net_name,
        "status": "Securely Connected", 
        "active_interfaces": 1
    }

class GeoRequest(BaseModel):
    ip: str

from functools import lru_cache

@lru_cache(maxsize=1024)
def _fetch_geo_data(ip):
    try:
        res = requests.get(f"http://ip-api.com/json/{ip}", timeout=2).json()
        if res.get("status") == "success":
            return {
                "country": res.get("country"),
                "city": res.get("city"),
                "lat": res.get("lat"),
                "lon": res.get("lon"),
                "ip": ip
            }
    except:
        pass
    return None

@router.post("/geo-ip")
def get_geo_ip(req: GeoRequest):
    data = _fetch_geo_data(req.ip)
    if data:
        return data
    
    # Fallback
    return {
        "country": "Internal/Private",
        "city": "Local Network",
        "lat": 0,
        "lon": 0,
        "ip": req.ip
    }

@router.get("/graph")
def get_graph(db: Session = Depends(get_db)):
    from ..graph_engine import GraphEngine
    return GraphEngine.get_graph_data(db)

class ChatRequest(BaseModel):
    message: str

@router.post("/chat")
def chat_with_ai(req: ChatRequest, db: Session = Depends(get_db)):
    from ..chatbot import AIChatbot
    bot = AIChatbot(db)
    response = bot.ask(req.message)
    return {"response": response}
    
@router.get("/blocked")
def get_blocked_ips(db: Session = Depends(get_db)):
    blocked = db.query(models.IPScore).filter(models.IPScore.score >= 85).all()
    return [{"ip": b.ip_address, "score": b.score, "reason": b.category} for b in blocked]

@router.get("/protocols")
def get_protocols(db: Session = Depends(get_db)):
    protocol_counts = db.query(
        models.Packet.protocol, 
        func.count(models.Packet.id).label("count"),
        func.avg(models.Packet.size).label("avg_size")
    ).group_by(models.Packet.protocol).all()
    
    total_packets = db.query(models.Packet).count()
    
    return [
        {
            "protocol": p[0],
            "count": p[1],
            "share": round((p[1] / total_packets * 100), 2) if total_packets > 0 else 0,
            "avg_size": round(p[2], 2) if p[2] else 0
        } for p in protocol_counts
    ]

@router.get("/top-talkers")
def get_top_talkers(db: Session = Depends(get_db)):
    top_ips = db.query(
        models.Packet.src_ip,
        func.count(models.Packet.id).label("packets"),
        func.sum(models.Packet.size).label("total_bytes")
    ).group_by(models.Packet.src_ip).order_by(desc("total_bytes")).limit(10).all()
    
    return [
        {
            "ip": ip[0],
            "packets": ip[1],
            "bytes": ip[2],
            "bandwidth_mb": round(ip[2] / (1024 * 1024), 2) if ip[2] else 0
        } for ip in top_ips
    ]

@router.get("/report/summary")
def get_network_report_summary(db: Session = Depends(get_db)):
    stats = get_stats(db)
    top_alerts = db.query(models.Alert).order_by(desc(models.Alert.timestamp)).limit(500).all()
    blocked_ips = db.query(models.IPScore).filter(models.IPScore.score >= 85).all()
    top_flows = db.query(models.Flow).order_by(desc(models.Flow.total_bytes)).limit(100).all()

    report = {
        "report_generated_at": datetime.now().isoformat(),
        "network_summary": stats,
        "recent_threats": [{"id": a.id, "level": a.level, "description": a.description, "source_ip": a.source_ip, "timestamp": a.timestamp.isoformat(), "details": a.details} for a in top_alerts],
        "blocked_entities": [{"ip": b.ip_address, "risk_score": b.score, "threat_category": b.category} for b in blocked_ips],
        "top_bandwidth_flows": [{"flow_id": f.flow_id, "src_ip": f.src_ip, "dst_ip": f.dst_ip, "protocol": f.protocol, "duration": f.duration, "total_bytes": f.total_bytes} for f in top_flows]
    }
    return report

@router.get("/settings")
def get_settings(request: Request):
    if hasattr(request.app.state, "sniffer"):
        return request.app.state.sniffer.config
    return {"error": "Sniffer not initialized"}

@router.post("/settings")
def update_settings(request: Request, config: dict):
    if hasattr(request.app.state, "sniffer"):
        return request.app.state.sniffer.update_config(config)
    return {"error": "Sniffer not initialized"}

@router.get("/interfaces")
def get_interfaces():
    from scapy.all import get_if_list
    try: return get_if_list()
    except: return ["auto", "eth0", "wlan0", "lo"]

@router.get("/protocol-trends")
def get_protocol_trends(request: Request):
    if hasattr(request.app.state, "sniffer"):
        return list(request.app.state.sniffer.trend_buffer)
    return []

@router.get("/top-ports")
def get_top_ports(protocol: str = "TCP", db: Session = Depends(get_db)):
    top_ports = db.query(
        models.Packet.dst_port,
        func.count(models.Packet.id).label("count")
    ).filter(models.Packet.protocol == protocol, models.Packet.dst_port != None)\
     .group_by(models.Packet.dst_port)\
     .order_by(desc("count"))\
     .limit(5).all()
    return [{"port": p[0], "count": p[1]} for p in top_ports]

@router.post("/reset-stats")
def reset_stats(db: Session = Depends(get_db)):
    try:
        db.query(models.Packet).delete()
        db.query(models.Alert).delete()
        db.query(models.Flow).delete()
        db.commit()
        return {"status": "Stats reset successfully"}
    except Exception as e:
        db.rollback()
        return {"error": str(e)}

@router.get("/export-csv")
def export_csv(db: Session = Depends(get_db)):
    packets = db.query(models.Packet).limit(1000).all()
    csv_data = "timestamp,src_ip,dst_ip,protocol,size,src_port,dst_port\n"
    for p in packets:
        csv_data += f"{p.timestamp},{p.src_ip},{p.dst_ip},{p.protocol},{p.size},{p.src_port},{p.dst_port}\n"
    return {"csv": csv_data}
