import json
import csv
import os
from datetime import datetime
from scapy.utils import PcapWriter

LOG_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "logs")

class TrafficLogger:
    def __init__(self):
        if not os.path.exists(LOG_DIR):
            os.makedirs(LOG_DIR)
            
        self.pcap_file = os.path.join(LOG_DIR, f"capture_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pcap")
        self.json_file = os.path.join(LOG_DIR, "traffic.json")
        self.csv_file = os.path.join(LOG_DIR, "traffic.csv")
        
        try:
            self.pcap_writer = PcapWriter(self.pcap_file, append=True, sync=True)
        except Exception:
            self.pcap_writer = None
        
        # Init CSV header if not exists
        if not os.path.exists(self.csv_file):
            with open(self.csv_file, 'w', newline='') as f:
                writer = csv.writer(f)
                writer.writerow(["Timestamp", "Src IP", "Dst IP", "Protocol", "Src Port", "Dst Port", "Size"])
                
    def log_packet(self, packet, packet_data):
        # Save PCAP
        if self.pcap_writer:
            try:
                self.pcap_writer.write(packet)
            except Exception:
                pass
            
        # Save JSON
        try:
            packet_data['timestamp'] = datetime.utcnow().isoformat()
            with open(self.json_file, 'a') as f:
                f.write(json.dumps(packet_data) + "\n")
        except:
            pass
            
        # Save CSV
        try:
            with open(self.csv_file, 'a', newline='') as f:
                writer = csv.writer(f)
                writer.writerow([
                    packet_data['timestamp'], 
                    packet_data.get('src_ip', ''), 
                    packet_data.get('dst_ip', ''), 
                    packet_data.get('protocol', ''), 
                    packet_data.get('src_port', ''), 
                    packet_data.get('dst_port', ''), 
                    packet_data.get('size', 0)
                ])
        except:
            pass

traffic_logger = TrafficLogger()
