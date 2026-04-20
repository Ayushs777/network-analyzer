from sqlalchemy.orm import Session
from . import models

class GraphEngine:
    @staticmethod
    def get_graph_data(db: Session):
        # Fetch recent unique connections (src -> dst)
        flows = db.query(models.Flow).order_by(models.Flow.last_time.desc()).limit(100).all()
        nodes_dict = {}
        links = []
        
        for f in flows:
            if f.src_ip not in nodes_dict:
                nodes_dict[f.src_ip] = {"id": f.src_ip, "group": "source"}
            if f.dst_ip not in nodes_dict:
                nodes_dict[f.dst_ip] = {"id": f.dst_ip, "group": "destination"}
            
            links.append({"source": f.src_ip, "target": f.dst_ip, "value": f.total_bytes})
            
        # Highlight malicious nodes
        malicious_ips = [score.ip_address for score in db.query(models.IPScore).filter(models.IPScore.score > 75).all()]
        for ip in nodes_dict:
            if ip in malicious_ips:
                nodes_dict[ip]["group"] = "malicious"
                
        return {"nodes": list(nodes_dict.values()), "links": links}
