from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from . import models
import re
import random

class AIChatbot:
    def __init__(self, db: Session):
        self.db = db

    def ask(self, question: str) -> str:
        q = question.lower().strip()

        # Handle greetings
        if any(word in q for word in ["hello", "hi", "hey", "greetings", "good morning", "good afternoon", "good evening"]):
            return "👋 Hello! I'm your Network Security Assistant. I can help you analyze threats, understand network traffic, and provide security recommendations. What would you like to know?"

        # Handle thanks
        if any(word in q for word in ["thank", "thanks", "appreciate", "grateful"]):
            return "You're welcome! I'm here to help you secure your network. Feel free to ask me anything about network analysis, threats, or security best practices."

        # Handle help requests
        if any(word in q for word in ["help", "assist", "support", "guide"]):
            return "🆘 How can I help you?\n\n🔍 **Analysis & Monitoring:**\n  • Check network health and status\n  • View top threats and attackers\n  • Analyze protocol distributions\n  • Monitor live packet streams\n\n🛡️ **Security Features:**\n  • Get security recommendations\n  • Understand alerts and threats\n  • Learn about IP reputation\n  • Get mitigation strategies\n\n📚 **Learn More:**\n  • Explain any feature or concept\n  • Ask about networking basics\n  • Get cybersecurity tips"

        # Top threats/attackers
        if "top" in q and ("threat" in q or "attacker" in q or "ip" in q or "risk" in q or "dangerous" in q):
            top_ips = self.db.query(models.IPScore).order_by(desc(models.IPScore.score)).limit(5).all()
            if top_ips:
                threat_list = "\n".join([f"  • {ip.ip_address} - Risk Score: {ip.score}/100 ({ip.category})" for ip in top_ips])
                return f"🔴 Top 5 Security Threats:\n{threat_list}\n\n💡 Recommendation: Isolate IPs with scores above 85 immediately."
            return "No threats detected. Your network is secure!"

        # Recommendations
        elif any(word in q for word in ["recommend", "suggestion", "best practice", "advice", "tips", "improve"]):
            alerts_count = self.db.query(models.Alert).count()
            high_risk_ips = self.db.query(models.IPScore).filter(models.IPScore.score > 70).count()

            recommendations = []
            if high_risk_ips > 0:
                recommendations.append(f"🚨 Block {high_risk_ips} high-risk IPs (scores > 70)")
            if alerts_count > 50:
                recommendations.append("📊 Review and categorize existing alerts")
            recommendations.append("🔒 Enable real-time packet inspection on all interfaces")
            recommendations.append("🌐 Cross-reference against global threat intelligence feeds")
            recommendations.append("📈 Set up anomaly detection on top talkers")
            recommendations.append("🔐 Implement network segmentation")
            recommendations.append("📝 Regular security audits and log reviews")

            rec_text = "\n".join(recommendations)
            return f"🛡️ Security Recommendations:\n{rec_text}"

        # Explain features and concepts
        elif any(word in q for word in ["how", "explain", "what", "tell me about", "describe", "understand"]):
            if "live packet" in q or "packet" in q:
                return "📦 Live Packet Inspector: Real-time Deep Packet Inspection (DPI) capturing every packet on your network. Shows source/destination IPs, protocols, ports, and payload sizes. Use this to identify suspicious traffic patterns."
            elif "protocol" in q or "analysis" in q:
                return "🔄 Protocol Analysis: Breaks down network traffic by protocol type (TCP/UDP/ICMP). Shows distribution, trends, and top ports. Helps identify unusual protocol usage that might indicate attacks."
            elif "alert" in q:
                return "⚠️ Security Alerts: Real-time threat detection engine flagging malicious patterns (DDoS, port scans, SQL injection, etc.). Each alert shows severity level, source IP, timestamp, and technical details."
            elif "geo" in q or "map" in q:
                return "🌍 Geo Map: Visualizes network threats by geographic origin. Shows threat locations, risk scores, and threat categories. Identifies which regions pose the most threat."
            elif "threat" in q or "ip" in q or "reputation" in q:
                return "🎯 IP Reputation System: Assigns risk scores to IPs based on behavior patterns, alert history, and anomalies detected. Higher scores = greater threat. Auto-blocks IPs above 85."
            elif "dashboard" in q or "overview" in q:
                return "📊 Dashboard Overview:\n  🔴 Threats: High-risk IPs and alert summary\n  📦 Traffic: Real-time bandwidth and packet graphs\n  🔄 Protocols: Protocol distribution (TCP/UDP/ICMP)\n  🎯 Talkers: Top source and destination IPs\n  ⚠️ Alerts: Recent security incidents\n  📈 Analytics: Threat severity distribution"
            elif "tcp" in q:
                return "🔗 TCP (Transmission Control Protocol): Connection-oriented protocol that ensures reliable data delivery. Used for web browsing, email, file transfers. Features: 3-way handshake, flow control, error recovery."
            elif "udp" in q:
                return "📡 UDP (User Datagram Protocol): Connectionless protocol for fast, unreliable data transmission. Used for streaming, gaming, DNS. Faster than TCP but no error recovery."
            elif "icmp" in q:
                return "📢 ICMP (Internet Control Message Protocol): Used for network diagnostics and error reporting. Contains ping, traceroute, and error messages. Often used in reconnaissance attacks."
            elif "ddos" in q:
                return "💥 DDoS (Distributed Denial of Service): Attack that floods a target with traffic from multiple sources. Types: SYN flood, UDP flood, HTTP flood. Mitigation: Rate limiting, traffic filtering, CDN protection."
            elif "firewall" in q:
                return "🔥 Firewall: Network security device that monitors and controls incoming/outgoing traffic based on security rules. Types: Hardware, Software, Next-gen (NGFW) with application awareness."
            elif "encryption" in q or "ssl" in q or "tls" in q:
                return "🔐 Encryption: Process of converting data into coded format. SSL/TLS encrypts web traffic. Protects against eavesdropping, man-in-the-middle attacks. Modern standard: TLS 1.3"
            elif "vpn" in q:
                return "🌐 VPN (Virtual Private Network): Creates secure encrypted connection over public network. Hides IP address, encrypts traffic, bypasses geo-restrictions. Protocols: OpenVPN, WireGuard, IKEv2."
            elif "malware" in q:
                return "🦠 Malware: Malicious software designed to harm systems. Types: Viruses, Trojans, Ransomware, Spyware. Prevention: Antivirus, regular updates, safe browsing habits."
            elif "phishing" in q:
                return "🎣 Phishing: Social engineering attack using fake emails/websites to steal credentials. Signs: Urgent requests, suspicious URLs, poor grammar. Prevention: Verify sources, use 2FA."
            else:
                return "What would you like to know? Try: 'What are the top threats?', 'Give me recommendations', 'Explain protocol analysis', 'How to block an IP?'"

        # Why is IP malicious
        elif "why" in q and ("malicious" in q or "bad" in q or "threat" in q or "dangerous" in q):
            ip_match = re.search(r'\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b', q)
            if ip_match:
                ip = ip_match.group()
                alerts = self.db.query(models.Alert).filter(models.Alert.source_ip == ip).limit(5).all()
                score = self.db.query(models.IPScore).filter(models.IPScore.ip_address == ip).first()

                if alerts:
                    reasons = "\n".join([f"  • {a.description}" for a in alerts])
                    risk_text = f"Risk Score: {score.score} ({score.category})" if score else "Risk Score: Unknown"
                    return f"🚩 IP {ip} is flagged as malicious:\n{reasons}\n\n{risk_text}"
                elif score:
                    return f"⚠️ IP {ip} has Risk Score {score.score} ({score.category}). Category suggests potential threat based on behavior analysis."
                return f"ℹ️ IP {ip} hasn't triggered alerts yet, but may have suspicious behavior patterns."
            return "Please provide the specific IP address you want me to analyze."

        # Block/Mitigate
        elif any(word in q for word in ["block", "mitigate", "isolate", "stop", "prevent", "protect"]):
            return "🔐 Mitigation Steps:\n  1. Go to Security Alerts page and identify threat IPs\n  2. Check their risk scores in the Geo Map\n  3. IPs with scores > 85 are auto-blocked\n  4. For manual blocking: Add IP to firewall rules\n  5. Monitor blocked IPs in Forensic Audit report\n\nAuto-blocking occurs via firewall integration. Manual blocking requires access to network infrastructure."

        # Network health/status
        elif any(word in q for word in ["status", "health", "how is network", "network status", "system status", "performance"]):
            active_flows = self.db.query(models.Flow).count()
            total_packets = self.db.query(models.Packet).count()
            alerts_count = self.db.query(models.Alert).count()
            high_alerts = self.db.query(models.Alert).filter(models.Alert.level == "High").count()

            health_pct = 100 if high_alerts == 0 else max(0, 100 - (high_alerts * 5))
            status = "🟢 SECURE" if health_pct > 80 else "🟡 CAUTION" if health_pct > 50 else "🔴 CRITICAL"

            return f"{status} Network Health: {health_pct}%\n\n📊 Stats:\n  • Active Flows: {active_flows}\n  • Total Packets: {total_packets}\n  • Total Alerts: {alerts_count}\n  • High Priority Alerts: {high_alerts}"

        # General networking questions
        elif any(word in q for word in ["network", "internet", "connection", "bandwidth", "speed", "traffic"]):
            if "bandwidth" in q or "speed" in q:
                return "📊 Bandwidth: Amount of data that can be transmitted in a given time. Measured in Mbps/Gbps. Network speed depends on ISP, hardware, and current usage. Monitor with our real-time traffic graphs."
            elif "traffic" in q:
                return "🚗 Network Traffic: Data flowing through your network. Types: Incoming (downloads), Outgoing (uploads). Monitor for unusual spikes that might indicate attacks or bandwidth issues."
            else:
                return "🌐 Networking Basics:\n  • IP Address: Unique identifier for devices on a network\n  • Ports: Communication endpoints (0-65535)\n  • Protocols: Rules for data transmission (TCP, UDP, ICMP)\n  • Bandwidth: Data transfer capacity\n  • Latency: Delay in data transmission\n\nUse our dashboard to monitor all these in real-time!"

        # Security questions
        elif any(word in q for word in ["security", "safe", "secure", "protect", "vulnerable", "risk"]):
            return "🔒 Network Security Essentials:\n  • Monitor traffic patterns for anomalies\n  • Use firewalls and intrusion detection\n  • Keep systems updated with security patches\n  • Implement strong authentication (2FA)\n  • Regular security audits and penetration testing\n  • Encrypt sensitive data in transit and at rest\n\nOur system provides real-time threat detection and automated alerts."

        # Data/Statistics questions
        elif any(word in q for word in ["data", "statistics", "stats", "numbers", "metrics", "analytics"]):
            total_packets = self.db.query(models.Packet).count()
            total_alerts = self.db.query(models.Alert).count()
            unique_ips = self.db.query(func.count(func.distinct(models.Packet.src_ip))).scalar() or 0

            return f"📈 Network Analytics:\n  • Total Packets Analyzed: {total_packets:,}\n  • Security Alerts Generated: {total_alerts}\n  • Unique Source IPs: {unique_ips}\n  • Active Network Flows: {self.db.query(models.Flow).count()}\n  • High-Risk IPs Tracked: {self.db.query(models.IPScore).filter(models.IPScore.score > 70).count()}\n\nAll data is updated in real-time!"

        # Time-based questions
        elif any(word in q for word in ["recent", "latest", "new", "today", "yesterday", "last"]):
            recent_alerts = self.db.query(models.Alert).order_by(desc(models.Alert.timestamp)).limit(3).all()
            if recent_alerts:
                alerts_text = "\n".join([f"  • {a.level}: {a.description[:50]}..." for a in recent_alerts])
                return f"🕐 Recent Activity:\n{alerts_text}\n\nCheck the Security Alerts page for full details and timestamps."
            return "No recent alerts. Your network has been quiet recently."

        # Comparison questions
        elif any(word in q for word in ["compare", "difference", "vs", "versus", "better", "worse"]):
            if "tcp" in q and "udp" in q:
                return "⚖️ TCP vs UDP:\n  TCP: Reliable, connection-oriented, slower (web, email)\n  UDP: Fast, connectionless, unreliable (streaming, gaming)\n\nTCP ensures data delivery, UDP prioritizes speed."
            elif "http" in q and "https" in q:
                return "🔒 HTTP vs HTTPS:\n  HTTP: Unencrypted web traffic (port 80)\n  HTTPS: Encrypted with SSL/TLS (port 443)\n\nAlways use HTTPS for secure browsing!"
            else:
                return "I can help compare networking concepts! Try asking about TCP vs UDP, HTTP vs HTTPS, or other protocol comparisons."

        # Troubleshooting questions
        elif any(word in q for word in ["problem", "issue", "error", "trouble", "fix", "broken", "not working"]):
            return "🔧 Troubleshooting Network Issues:\n  1. Check network connectivity and cable connections\n  2. Verify firewall settings aren't blocking legitimate traffic\n  3. Monitor for unusual traffic spikes in our dashboard\n  4. Check for malware or unauthorized devices\n  5. Review recent alerts for security incidents\n  6. Ensure all systems are updated with latest patches\n\nWhat specific issue are you experiencing?"

        # Learning questions
        elif any(word in q for word in ["learn", "teach", "tutorial", "guide", "course", "training"]):
            return "📚 Network Security Learning Path:\n  1. **Basics**: IP addresses, ports, protocols (TCP/UDP)\n  2. **Monitoring**: Traffic analysis, packet inspection\n  3. **Threats**: Common attacks (DDoS, phishing, malware)\n  4. **Defense**: Firewalls, encryption, access control\n  5. **Tools**: Wireshark, intrusion detection systems\n\nOur dashboard provides hands-on experience with real network data!"

        # Fun/random questions
        elif any(word in q for word in ["joke", "funny", "laugh", "humor"]):
            jokes = [
                "Why did the network administrator go to therapy? Too many unresolved issues! 😂",
                "What do you call a network that's always down? A crash course in networking! 😄",
                "Why was the JavaScript developer sad? Because he didn't know how to 'null' his feelings! 😉"
            ]
            return random.choice(jokes)

        elif any(word in q for word in ["weather", "time", "date", "day"]):
            return "🌤️ I'm a network security assistant, not a weather app! But I can tell you your network is running smoothly. For weather, try a weather service instead."

        elif any(word in q for word in ["music", "song", "band", "artist"]):
            return "🎵 While I love analyzing network traffic, I'm not great at music recommendations. But I can help you monitor streaming service traffic patterns!"

        elif any(word in q for word in ["food", "eat", "drink", "restaurant"]):
            return "🍕 I'm more of a 'packet' person than a food critic! But I can help you analyze restaurant WiFi security or monitor food delivery app traffic."

        # Default comprehensive help
        else:
            return "🤖 Network Security Assistant - I can help with:\n\n🔍 **Analysis & Monitoring:**\n  • 'What are the top threats?'\n  • 'Network health status'\n  • 'Show me statistics'\n  • 'Recent alerts'\n\n🛡️ **Security & Recommendations:**\n  • 'Give me security recommendations'\n  • 'How to block an IP?'\n  • 'Explain [concept]' (TCP, UDP, DDoS, etc.)\n  • 'Why is [IP] malicious?'\n\n📚 **Learning & Help:**\n  • 'Explain protocol analysis'\n  • 'What is [networking term]?'\n  • 'Network security basics'\n  • 'Troubleshooting guide'\n\n💬 **General Questions:**\n  • Ask about networking, security, or any tech topic!\n\nWhat would you like to know?"

