from .ml_model import ThreatPredictor
from .risk_engine import RiskEngine
from .alert_system import AlertSystem
import asyncio

class ThreatDetector:
    def __init__(self, ws_manager):
        self.ml_model = ThreatPredictor()
        self.risk_engine = RiskEngine(ws_manager)
        self.alert_system = AlertSystem(ws_manager)

    async def analyze_flow(self, flow_data: dict):
        # AI Detection
        is_anomaly = self.ml_model.predict(
            packet_count=flow_data['packet_count'],
            total_bytes=flow_data['total_bytes'],
            duration=flow_data['duration']
        )

        if is_anomaly:
            # Dynamic Description based on anomaly features
            reason = "Volumetric Anomaly" if flow_data['total_bytes'] > 50000 else "Temporal Deviation"
            if flow_data['packet_count'] > 200: reason = "Packet Frequency Anomaly"
            
            await self.alert_system.trigger_alert(
                level="High",
                description=f"AI Engine: {reason} detected in traffic flow",
                source_ip=flow_data['src_ip'],
                details={**flow_data, "ai_logic": "Isolation Forest Outlier Detection"}
            )
            await self.risk_engine.update_score(flow_data['src_ip'], 15.0)

        # Rule-based Detection
        
        # 1. DDoS Simulation check (Simple heuristic)
        if flow_data['packet_count'] > 1000 and flow_data['duration'] < 5.0:
            await self.alert_system.trigger_alert(
                level="Critical",
                description="Possible DDoS attack detected: High packet rate",
                source_ip=flow_data['src_ip'],
                details=flow_data
            )
            await self.risk_engine.update_score(flow_data['src_ip'], 30.0, "Malicious")

        # 2. Port Scanning Context
        # (This is better detected globally rather than per-flow, but we can do a simple check on rapid short flows)
        if flow_data['packet_count'] <= 3 and flow_data['duration'] < 0.5:
             # In a real system, we aggregate these to detect port scan. We update risk score slightly.
             await self.risk_engine.update_score(flow_data['src_ip'], 1.0)

        # 3. Brute Force Detection on critical ports
        if flow_data['dst_port'] in [22, 3389, 21] and flow_data['packet_count'] > 50 and flow_data['duration'] < 60.0:
            await self.alert_system.trigger_alert(
                level="Medium",
                description="Potential Brute Force Attack on critical service",
                source_ip=flow_data['src_ip'],
                details={**flow_data, "service": "SSH/RDP/FTP"}
            )
            await self.risk_engine.update_score(flow_data['src_ip'], 10.0)

        # 4. Data Exfiltration
        if flow_data['total_bytes'] > 1000000 and flow_data['duration'] < 10.0:
            await self.alert_system.trigger_alert(
                level="High",
                description="Possible Data Exfiltration: Large outbound transfer",
                source_ip=flow_data['src_ip'],
                details=flow_data
            )
            await self.risk_engine.update_score(flow_data['src_ip'], 20.0)

        # 5. Unusual Protocol Usage
        if flow_data['protocol'] == 'ICMP' and flow_data['packet_count'] > 100:
            await self.alert_system.trigger_alert(
                level="Medium",
                description="ICMP Flood Detected",
                source_ip=flow_data['src_ip'],
                details=flow_data
            )
            await self.risk_engine.update_score(flow_data['src_ip'], 15.0)
