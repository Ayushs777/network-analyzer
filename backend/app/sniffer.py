import threading
import asyncio
import time
import socket
import os
import struct
from scapy.all import IP, TCP, UDP, ICMP, conf, get_if_list
from datetime import datetime
from .database import SessionLocal
from . import models
from .flow_analyzer import FlowAnalyzer
from queue import Queue, Empty
from collections import deque
import logging

logger = logging.getLogger(__name__)

class PacketSniffer:
    def __init__(self, packet_manager, traffic_manager):
        self.packet_manager = packet_manager
        self.traffic_manager = traffic_manager
        self.flow_analyzer = FlowAnalyzer(packet_manager)
        self.running = False
        self.loop = None  # Will be captured lazily when start() is called inside the running event loop
        
        self.config = {
            "status": "stopped",
            "interface": "auto",
            "protocol_filter": "All",
            "ddos_detection": True,
            "port_scan_detection": True,
            "auto_blocking": False
        }
        
        self.packet_count = 0
        self.total_bytes_per_sec = 0
        self.incoming_bytes = 0
        self.outgoing_bytes = 0
        self.last_stats_time = time.time()
        self.last_seen_time = time.time()
        self.demo_mode = False
        
        self.protocol_counts = {"TCP": 0, "UDP": 0, "ICMP": 0, "Other": 0}
        self.trend_buffer = deque(maxlen=60)
        self.last_protocol_counts = self.protocol_counts.copy()
        
        # Performance: Batch Queue for DB
        self.db_queue = Queue(maxsize=50000)
        
        # Interface selection: Manual override or Auto-detection
        self.local_ip = os.getenv("INTERFACE_IP")
        if not self.local_ip:
            try:
                s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
                s.connect(('10.255.255.255', 1))
                self.local_ip = s.getsockname()[0]
                s.close()
                logger.info(f"Auto-detected interface IP: {self.local_ip}")
            except:
                self.local_ip = '127.0.0.1'
                logger.warning("Could not auto-detect interface. Falling back to localhost.")
        else:
            logger.info(f"Using manual interface IP: {self.local_ip}")

    def update_config(self, new_config):
        if "status" in new_config:
            if new_config["status"] == "running" and not self.running:
                self.start()
            elif new_config["status"] == "stopped" and self.running:
                self.stop()
        self.config.update(new_config)
        return self.config

    def start(self):
        if self.running: return
        self.running = True
        self.config["status"] = "running"
        
        # Capture the running event loop NOW — we are inside lifespan which runs inside uvicorn's loop
        try:
            self.loop = asyncio.get_running_loop()
        except RuntimeError:
            self.loop = asyncio.new_event_loop()
            logger.warning("No running event loop found; created a new one for sniffer threads.")

        # Start DB Batch Worker
        self.db_thread = threading.Thread(target=self._db_batch_worker)
        self.db_thread.daemon = True
        self.db_thread.start()
        
        self.sniff_thread = threading.Thread(target=self._sniff_loop)
        self.sniff_thread.daemon = True
        self.sniff_thread.start()
        
        self.stats_thread = threading.Thread(target=self._broadcast_stats_loop)
        self.stats_thread.daemon = True
        self.stats_thread.start()

        self.fallback_thread = threading.Thread(target=self._demo_fallback_watchdog)
        self.fallback_thread.daemon = True
        self.fallback_thread.start()

    def stop(self):
        self.running = False
        self.config["status"] = "stopped"

    def _db_batch_worker(self):
        """Production Batch Inserter: Groups packets to reduce disk I/O wait times."""
        batch_size = 200
        batch = []
        while self.running:
            try:
                # Wait for up to 0.5s for a packet
                pkt = self.db_queue.get(timeout=0.5)
                batch.append(pkt)
                if len(batch) >= batch_size:
                    self._flush_batch(batch)
                    batch = []
            except Empty:
                if batch:
                    self._flush_batch(batch)
                    batch = []
                continue

    def _flush_batch(self, batch):
        db = SessionLocal()
        try:
            db_pkts = [
                models.Packet(
                    src_ip=p['src_ip'], dst_ip=p['dst_ip'], 
                    protocol=p['protocol'], src_port=p['src_port'], 
                    dst_port=p['dst_port'], size=p['size']
                ) for p in batch
            ]
            db.bulk_save_objects(db_pkts)
            db.commit()
        except Exception as e:
            print(f"[DB ERROR] Batch flush failed: {e}")
            db.rollback()
        finally:
            db.close()

    def _broadcast_stats_loop(self):
        while self.running:
            time.sleep(1)
            now = time.time()
            elapsed = now - self.last_stats_time
            if elapsed <= 0: continue
            
            bandwidth_mbps = (self.total_bytes_per_sec * 8) / (1024 * 1024)
            
            snapshot = {
                "timestamp": datetime.now().strftime("%H:%M:%S"),
                "TCP": self.protocol_counts["TCP"],
                "UDP": self.protocol_counts["UDP"],
                "ICMP": self.protocol_counts["ICMP"],
                "Other": self.protocol_counts["Other"]
            }
            self.trend_buffer.append(snapshot)
            
            # Intelligent Spike Detection
            for proto in ["ICMP", "UDP", "TCP"]:
                prev = self.last_protocol_counts[proto]
                curr = self.protocol_counts[proto]
                if curr > 200 and curr > (prev * 4): 
                    self._generate_spike_alert(proto, curr)
            
            self.last_protocol_counts = self.protocol_counts.copy()
            
            traffic_data = {
                "type": "traffic_stats",
                "data": {
                    "bandwidth_mbps": round(bandwidth_mbps, 4),
                    "incoming_bps": round(self.incoming_bytes * 8 / elapsed, 2),
                    "outgoing_bps": round(self.outgoing_bytes * 8 / elapsed, 2),
                    "total_packets": self.packet_count,
                    "timestamp": datetime.now().isoformat()
                }
            }
            
            asyncio.run_coroutine_threadsafe(self.traffic_manager.broadcast(traffic_data), self.loop)
            
            self.total_bytes_per_sec = 0
            self.incoming_bytes = 0
            self.outgoing_bytes = 0
            self.last_stats_time = now

    def _generate_spike_alert(self, protocol, count):
        db = SessionLocal()
        try:
            alert = models.Alert(
                level="High" if protocol != "TCP" else "Medium",
                description=f"Security Alert: {protocol} Activity Spike",
                details={"message": f"Engine detected a massive volume of {count} {protocol} packets. Potential DDoS or scanning activity.", "protocol": protocol, "count": count},
                source_ip="Network Analysis Node",
                timestamp=datetime.now()
            )
            db.add(alert)
            db.commit()
        except: db.rollback()
        finally: db.close()

    def _sniff_loop(self):
        target_ip = self.local_ip
        if os.name == 'nt':
            try:
                # Production Raw Socket configuration
                sniffer = socket.socket(socket.AF_INET, socket.SOCK_RAW, socket.IPPROTO_IP)
                sniffer.bind((target_ip, 0))
                sniffer.setsockopt(socket.IPPROTO_IP, socket.IP_HDRINCL, 1)
                sniffer.ioctl(socket.SIO_RCVALL, socket.RCVALL_ON)
                while self.running:
                    raw_data, addr = sniffer.recvfrom(65535)
                    self._process_raw_packet(raw_data)
                sniffer.ioctl(socket.SIO_RCVALL, socket.RCVALL_OFF)
                return
            except Exception as e:
                print(f"[WARNING] Native Raw Socket unavailable: {e}")

        # Fallback to Scapy for more accurate dissection if Raw Sockets fail
        from scapy.all import sniff as scapy_sniff
        try:
            scapy_sniff(prn=self._process_packet, store=False, stop_filter=lambda _: not self.running)
        except Exception as e:
            logger.error(f"Sniffer initialization failed: {e}. Falling back to demo mode.")
            asyncio.run_coroutine_threadsafe(self._run_demo_loop(), self.loop)

    async def _run_demo_loop(self):
        import random
        self.demo_mode = True
        while self.running:
            pkt = {
                "src_ip": f"10.0.0.{random.randint(2, 254)}",
                "dst_ip": self.local_ip,
                "protocol": random.choice(["TCP", "UDP", "ICMP"]),
                "size": random.randint(64, 1500),
                "src_port": random.choice([80, 443, 22, 53, 8080]),
                "dst_port": random.randint(1024, 65535),
                "timestamp": datetime.now().isoformat()
            }
            self._broadcast_and_queue(pkt)
            await asyncio.sleep(0.05)

    def _demo_fallback_watchdog(self):
        while self.running and not self.demo_mode:
            time.sleep(6)
            if time.time() - self.last_seen_time > 8:
                logger.warning("No packet traffic detected; activating demo fallback mode.")
                asyncio.run_coroutine_threadsafe(self._run_demo_loop(), self.loop)
                break

    def _process_raw_packet(self, data):
        try:
            ip_header = data[:20]
            iph = struct.unpack('!BBHHHBBH4s4s', ip_header)
            protocol_num = iph[6]
            protocol = "Other"
            if protocol_num == 6: protocol = "TCP"
            elif protocol_num == 17: protocol = "UDP"
            elif protocol_num == 1: protocol = "ICMP"
            
            self.protocol_counts[protocol] += 1
            if self.config["protocol_filter"] != "All" and protocol != self.config["protocol_filter"]:
                return

            src_ip = socket.inet_ntoa(iph[8])
            dst_ip = socket.inet_ntoa(iph[9])
            src_port = None
            dst_port = None
            if protocol == "TCP":
                tcp_header = data[20:40]
                tcph = struct.unpack('!HHLLBBHHH', tcp_header)
                src_port, dst_port = tcph[0], tcph[1]
            elif protocol == "UDP":
                udp_header = data[20:28]
                udph = struct.unpack('!HHHH', udp_header)
                src_port, dst_port = udph[0], udph[1]

            pkt_data = {
                "src_ip": src_ip, "dst_ip": dst_ip, "protocol": protocol,
                "size": len(data), "src_port": src_port, "dst_port": dst_port,
                "timestamp": datetime.now().isoformat()
            }
            self._broadcast_and_queue(pkt_data)
        except: pass

    def _process_packet(self, packet):
        if not IP in packet: return
        protocol = "TCP" if TCP in packet else ("UDP" if UDP in packet else ("ICMP" if ICMP in packet else "Other"))
        self.protocol_counts[protocol] += 1
        if self.config["protocol_filter"] != "All" and protocol != self.config["protocol_filter"]:
            return
        pkt_data = {
            "src_ip": packet[IP].src, "dst_ip": packet[IP].dst, "protocol": protocol,
            "size": len(packet),
            "src_port": packet[TCP].sport if TCP in packet else (packet[UDP].sport if UDP in packet else None),
            "dst_port": packet[TCP].dport if TCP in packet else (packet[UDP].dport if UDP in packet else None),
            "timestamp": datetime.now().isoformat()
        }
        self._broadcast_and_queue(pkt_data)

    def _broadcast_and_queue(self, pkt_data):
        self.packet_count += 1
        self.total_bytes_per_sec += pkt_data['size']
        if pkt_data['dst_ip'] == self.local_ip:
            self.incoming_bytes += pkt_data['size']
        elif pkt_data['src_ip'] == self.local_ip:
            self.outgoing_bytes += pkt_data['size']

        self.last_seen_time = time.time()
        asyncio.run_coroutine_threadsafe(self.packet_manager.broadcast({"type": "packet", "data": pkt_data}), self.loop)
        if not self.db_queue.full():
            self.db_queue.put(pkt_data)
        asyncio.run_coroutine_threadsafe(self.flow_analyzer.process_packet(pkt_data), self.loop)
