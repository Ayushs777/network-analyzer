import React, { useState, useEffect } from "react";
import {
  ShieldAlert,
  Info,
  AlertTriangle,
  ShieldCheck,
  Clock,
  ExternalLink,
  RefreshCcw,
} from "lucide-react";
import { API_BASE_URL } from "../config";

const SecurityAlerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);

  const formatAlertDetails = (details) => {
    if (!details) return "No additional details available.";
    if (typeof details === "string") return details;
    if (typeof details === "object") {
      return Object.entries(details)
        .map(
          ([key, value]) =>
            `${key}: ${typeof value === "object" ? JSON.stringify(value) : value}`,
        )
        .join(" | ");
    }
    return String(details);
  };

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/alerts`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setAlerts(data);
      } else {
        setAlerts([]);
      }
    } catch (e) {
      console.error("Failed to fetch alerts", e);
      setAlerts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center space-x-6">
          <div className="w-16 h-16 bg-red-600/20 rounded-2xl flex items-center justify-center border border-red-500/30 shadow-[0_0_30px_rgba(239,68,68,0.2)]">
            <ShieldAlert className="text-red-400" size={32} />
          </div>
          <div>
            <h1 className="text-4xl font-black text-white tracking-tighter uppercase">
              Security Incident Logs
            </h1>
            <p className="text-slate-500 text-sm font-bold flex items-center gap-2 uppercase tracking-widest">
              Real-Time Threat Intelligence
            </p>
          </div>
        </div>

        <button
          onClick={fetchAlerts}
          className="bg-black p-4 rounded-2xl border border-green-500/20 text-green-600 hover:text-green-400 transition-all"
        >
          <RefreshCcw size={20} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {!Array.isArray(alerts) || alerts.length === 0 ? (
            <div className="bg-black p-20 rounded-[3rem] border border-green-500/20 flex flex-col items-center justify-center text-center space-y-6">
              <div className="p-6 bg-emerald-500/10 rounded-full border border-emerald-500/20">
                <ShieldCheck className="text-emerald-500" size={48} />
              </div>
              <div>
                <h3 className="text-2xl font-black text-white uppercase tracking-tighter">
                  System Protected
                </h3>
                <p className="text-slate-500 text-sm font-bold mt-2">
                  No malicious signatures detected in the current stream.
                </p>
              </div>
            </div>
          ) : (
            alerts.map((alert, idx) => (
              <div
                key={alert.id || idx}
                className={`p-8 rounded-[2.5rem] border transition-all hover:translate-x-2 shadow-2xl flex flex-col md:flex-row gap-8 items-start md:items-center ${
                  alert.level === "High"
                    ? "bg-red-950/30 border-red-600/50"
                    : "bg-yellow-950/30 border-yellow-600/50"
                }`}
              >
                <div
                  className={`p-5 rounded-3xl shrink-0 ${alert.level === "High" ? "bg-red-500 text-white shadow-lg shadow-red-500/40" : "bg-amber-500 text-white"}`}
                >
                  <AlertTriangle size={24} />
                </div>

                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-4">
                    <span
                      className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                        alert.level === "High"
                          ? "bg-red-500/20 text-red-400"
                          : "bg-amber-500/20 text-amber-400"
                      }`}
                    >
                      {alert.level} Priority
                    </span>
                    <div className="flex items-center gap-2 text-slate-500 text-[10px] font-bold uppercase">
                      <Clock size={12} />
                      {alert.timestamp
                        ? new Date(alert.timestamp).toLocaleTimeString()
                        : "Recent"}
                    </div>
                  </div>
                  <h3 className="text-xl font-black text-white tracking-tight">
                    {alert.description}
                  </h3>
                  <p className="text-slate-400 text-xs font-medium max-w-2xl whitespace-pre-wrap break-words">
                    {formatAlertDetails(alert.details)}
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">
                    Source
                  </p>
                  <div className="bg-white/5 px-4 py-2 rounded-xl border border-white/5">
                    <span className="text-sm font-mono font-black text-white">
                      {alert.source_ip}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="bg-black p-10 rounded-[2.5rem] border border-green-500/20 h-fit">
          <div className="bg-cyan-600/10 p-3 rounded-2xl w-fit mb-6">
            <Info size={24} className="text-cyan-400" />
          </div>
          <h4 className="text-white font-black uppercase text-xs tracking-widest mb-4">
            Security Policy Info
          </h4>
          <div className="space-y-6">
            <p className="text-xs text-slate-400 leading-relaxed font-medium">
              The Security engine uses <strong>Heuristic Patterns</strong> to
              identify anomalies. Any IP attempting to probe more than 10 ports
              in 1 second will be flagged for scanning. DDoS detection is based
              on volume spikes relative to your baseline throughput.
            </p>
            <div className="pt-6 border-t border-white/5">
              <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
                Priority levels
              </h5>
              <div className="flex gap-2">
                <span className="px-3 py-1 bg-red-500/20 text-red-500 rounded-lg text-[9px] font-black uppercase">
                  Critical
                </span>
                <span className="px-3 py-1 bg-amber-500/20 text-amber-500 rounded-lg text-[9px] font-black uppercase">
                  Medium
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SecurityAlerts;
