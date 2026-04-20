import time
import asyncio
from datetime import datetime
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.dialects.sqlite import insert as sqlite_insert
from . import models
from .database import SessionLocal
from .detector import ThreatDetector
from concurrent.futures import ThreadPoolExecutor

class FlowAnalyzer:
    def __init__(self, ws_manager):
        self.active_flows = {}
        self.detector = ThreatDetector(ws_manager)
        self.ws_manager = ws_manager
        self.executor = ThreadPoolExecutor(max_workers=5)
        self.last_cleanup = time.time()

    async def process_packet(self, packet_data: dict):
        src_ip = packet_data['src_ip']
        dst_ip = packet_data['dst_ip']
        src_port = packet_data.get('src_port', 0)
        dst_port = packet_data.get('dst_port', 0)
        protocol = packet_data['protocol']
        size = packet_data['size']
        
        endpoint_a = (src_ip, src_port)
        endpoint_b = (dst_ip, dst_port)
        if endpoint_a <= endpoint_b:
            flow_id = f"{src_ip}:{src_port}-{dst_ip}:{dst_port}-{protocol}"
        else:
            flow_id = f"{dst_ip}:{dst_port}-{src_ip}:{src_port}-{protocol}"
        reverse_flow_id = f"{dst_ip}:{dst_port}-{src_ip}:{src_port}-{protocol}"
        
        current_time = time.time()
        
        # Periodic cleanup of stale flows (every 30 seconds)
        if current_time - self.last_cleanup > 30:
            await self._cleanup_stale_flows(current_time)

        if flow_id in self.active_flows:
            flow = self.active_flows[flow_id]
        elif reverse_flow_id in self.active_flows:
            flow = self.active_flows[reverse_flow_id]
        else:
            flow = {
                'flow_id': flow_id,
                'src_ip': src_ip,
                'dst_ip': dst_ip,
                'protocol': protocol,
                'src_port': src_port,
                'dst_port': dst_port,
                'start_time': current_time,
                'last_time': current_time,
                'duration': 0.0,
                'packet_count': 0,
                'total_bytes': 0
            }
            self.active_flows[flow_id] = flow

        flow['packet_count'] += 1
        flow['total_bytes'] += size
        flow['last_time'] = current_time
        flow['duration'] = current_time - flow['start_time']
            
        # Analyze and save in chunks to prevent DB overhead
        if flow['packet_count'] % 50 == 0:
            asyncio.create_task(self._save_and_analyze(flow.copy()))

    async def _cleanup_stale_flows(self, current_time):
        """Removes flows that haven't seen traffic for 60 seconds to prevent memory leaks."""
        stale_ids = [fid for fid, f in self.active_flows.items() if current_time - f['last_time'] > 60]
        for fid in stale_ids:
            # Save one last time before deleting
            await self._save_and_analyze(self.active_flows[fid])
            del self.active_flows[fid]
        self.last_cleanup = current_time

    async def _save_and_analyze(self, flow: dict):
        """Executes DB operations in a thread pool to keep the sniffer responsive."""
        loop = asyncio.get_event_loop()
        await loop.run_in_executor(self.executor, self._db_sync_task, flow)
        await self.detector.analyze_flow(flow)

    def _db_sync_task(self, flow: dict):
        db = SessionLocal()
        values = {
            'flow_id': flow['flow_id'],
            'src_ip': flow['src_ip'],
            'dst_ip': flow['dst_ip'],
            'protocol': flow['protocol'],
            'src_port': flow['src_port'],
            'dst_port': flow['dst_port'],
            'start_time': datetime.fromtimestamp(flow['start_time']),
            'last_time': datetime.fromtimestamp(flow['last_time']),
            'duration': flow['duration'],
            'packet_count': flow['packet_count'],
            'total_bytes': flow['total_bytes']
        }
        try:
            dialect = db.bind.dialect.name
            if dialect == 'postgresql':
                stmt = pg_insert(models.Flow).values(values)
                stmt = stmt.on_conflict_do_update(
                    index_elements=['flow_id'],
                    set_={
                        'duration': stmt.excluded.duration,
                        'packet_count': stmt.excluded.packet_count,
                        'total_bytes': stmt.excluded.total_bytes,
                        'last_time': stmt.excluded.last_time
                    }
                )
            else:
                stmt = sqlite_insert(models.Flow).values(values)
                stmt = stmt.on_conflict_do_update(
                    index_elements=['flow_id'],
                    set_={
                        'duration': stmt.excluded.duration,
                        'packet_count': stmt.excluded.packet_count,
                        'total_bytes': stmt.excluded.total_bytes,
                        'last_time': stmt.excluded.last_time
                    }
                )
            db.execute(stmt)
            db.commit()
        except Exception as e:
            print(f"[DB ERROR] Flow upsert failed: {e}")
            db.rollback()
        finally:
            db.close()
