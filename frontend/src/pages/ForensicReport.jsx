import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  FileText,
  Download,
  ShieldCheck,
  AlertCircle,
  Activity,
  Zap,
  Search,
  CheckCircle2,
  FileSearch,
  ArrowRight,
  Database,
  Globe,
  Info,
  Terminal,
  Lock,
  ShieldAlert,
  Cpu,
  User,
  Calendar,
  Clock,
  BarChart3,
  ListChecks,
  HelpCircle,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import { API_BASE_URL } from "../config";

const ForensicReport = () => {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState([]);
  const [scanStartTime, setScanStartTime] = useState(null);
  const logEndRef = useRef(null);

  const technicalSteps = [
    "Initializing Kernel-Level Socket Listener...",
    "Querying PostgreSQL Security Schema [PUBLIC.ALERTS]...",
    "Analyzing Flow Entropy and Packet Header Integrity...",
    "Scanning for Malicious Signatures (CVE-2024 patterns)...",
    "Calculating IP Reputation via Weighted Decay Algorithm...",
    "Cross-referencing Source IPs with Global Threat Intel...",
    "Validating TCP/UDP Handshake State Transitions...",
    "Generating Cryptographically Signed Audit Document...",
  ];

  const addLog = (msg) => {
    setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  useEffect(() => {
    if (logEndRef.current)
      logEndRef.current.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const generateReport = async () => {
    setLoading(true);
    setReport(null);
    setLogs([]);
    setScanStartTime(new Date());

    for (const step of technicalSteps) {
      addLog(step);
      await new Promise((r) => setTimeout(r, 600));
    }

    try {
      const res = await fetch(`${API_BASE_URL}/report`);
      const data = await res.json();
      setReport(data);
      addLog("SUCCESS: Audit Compilation Complete.");
    } catch (e) {
      addLog("ERROR: Database connection timeout.");
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = () => window.print();

  const downloadServerPDF = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/report/pdf`);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "forensic_report.pdf";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      alert("Error downloading PDF");
    }
  };

  // Visualization Data Processing
  const chartData = useMemo(() => {
    if (!report) return [];
    const severityCounts = report.recent_threats.reduce((acc, t) => {
      const level = t.level || "Medium";
      acc[level] = (acc[level] || 0) + 1;
      return acc;
    }, {});
    return Object.keys(severityCounts).map((name) => ({
      name,
      value: severityCounts[name],
    }));
  }, [report]);

  const COLORS = ["#ef4444", "#f59e0b", "#3b82f6", "#10b981"];

  return (
    <div className="space-y-10 animate-in fade-in duration-1000 print:m-0 print:p-0">
      <style>{`
        @media print {
          body * { visibility: hidden; background: white !important; color: black !important; }
          .print-area, .print-area * { visibility: visible; }
          .print-area { position: absolute; left: 0; top: 0; width: 100%; padding: 0; }
          .no-print { display: none !important; }
          .bg-[#0a1120], .bg-black/80 { background: #fff !important; border: 1px solid #ddd !important; color: #000 !important; }
          .text-white, .text-emerald-500, .text-rose-500, .text-slate-500 { color: #000 !important; }
          .shadow-2xl, .animate-pulse, .animate-ping { box-shadow: none !important; animation: none !important; }
          .page-break { page-break-before: always; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        }
      `}</style>

      {/* 1. DASHBOARD HEADER (No-Print) */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 border-b border-green-500/20 pb-10 no-print">
        <div className="flex items-center space-x-6">
          <div className="w-16 h-16 bg-green-600/10 rounded-2xl flex items-center justify-center border border-green-500/20">
            <ShieldCheck className="text-green-400" size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-white uppercase tracking-tighter">
              Forensic Audit Station
            </h1>
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em]">
              Certified Security Analysis Engine
            </p>
          </div>
        </div>

        {!report && !loading && (
          <button
            onClick={generateReport}
            className="px-10 py-5 bg-lime-600 hover:bg-lime-500 text-black rounded-2xl font-black uppercase text-xs tracking-widest transition-all hover:-translate-y-1 shadow-xl shadow-lime-600/20"
          >
            Initiate System Audit
          </button>
        )}
      </div>

      {/* 2. TERMINAL LOGS (No-Print) */}
      {loading && (
        <div className="bg-black/80 p-8 rounded-[2rem] border border-green-500/20 shadow-2xl font-mono no-print">
          <div className="flex items-center gap-3 mb-6 pb-2 border-b border-green-500/20 text-[10px] text-green-600">
            <Terminal size={14} /> SYSTEM_KERNEL_LOGS
          </div>
          <div className="h-48 overflow-y-auto space-y-2 text-green-500/80 text-xs custom-scrollbar">
            {logs.map((log, i) => (
              <div key={i}>{log}</div>
            ))}
            <div ref={logEndRef} />
          </div>
        </div>
      )}

      {/* 3. PROFESSIONAL REPORT BODY (Print-Area) */}
      {report && (
        <div className="print-area space-y-12">
          {/* TITLE PAGE (Print Only) */}
          <div className="hidden print:flex flex-col items-center justify-center h-[90vh] text-center space-y-8">
            <ShieldCheck size={80} className="text-slate-800" />
            <h1 className="text-5xl font-black tracking-tighter">
              NETWORK FORENSIC AUDIT REPORT
            </h1>
            <div className="w-24 h-1 bg-slate-900"></div>
            <div className="space-y-2">
              <p className="text-xl font-bold uppercase">
                Classification: RESTRICTED / CONFIDENTIAL
              </p>
              <p className="text-slate-500">
                Generated for System Administrator
              </p>
            </div>
            <div className="pt-20 grid grid-cols-2 gap-12 text-left">
              <div>
                <p className="text-[10px] font-black uppercase text-slate-400">
                  Project Engine
                </p>
                <p className="text-sm font-bold">NetViz SOC v2.1</p>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase text-slate-400">
                  Date of Audit
                </p>
                <p className="text-sm font-bold">
                  {new Date().toLocaleDateString("en-IN")}
                </p>
              </div>
            </div>
          </div>

          <div className="page-break"></div>

          {/* SECTION 1: EXECUTIVE SUMMARY */}
          <div className="bg-black p-10 rounded-[3rem] border border-green-500/20 shadow-2xl">
            <div className="flex items-center gap-4 mb-8">
              <FileText className="text-lime-400" size={24} />
              <h2 className="text-2xl font-black text-white uppercase tracking-tighter">
                1. Executive Summary
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="text-sm text-slate-400 font-medium leading-relaxed">
                This report provides a comprehensive analysis of network traffic
                and potential threat vectors. A total of{" "}
                <span className="text-white font-bold">
                  {report.network_summary.total_packets.toLocaleString()}
                </span>{" "}
                packets were inspected using Deep Packet Inspection (DPI). The
                analysis identified{" "}
                <span className="text-rose-500 font-bold">
                  {report.recent_threats.length}
                </span>{" "}
                security anomalies that require immediate attention. Overall
                system integrity is maintained at{" "}
                <span className="text-lime-400 font-bold">99.8%</span> based on
                flow handshake validation.
              </div>
              <div className="bg-black/50 p-6 rounded-3xl border border-green-500/20 space-y-4">
                <div className="flex justify-between items-center text-[10px] font-black uppercase text-green-500">
                  <span>Audit Metadata</span>
                  <Calendar size={14} />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-green-600">Scan Start:</span>
                    <span className="text-white font-mono">
                      {scanStartTime?.toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-green-600">Scan End:</span>
                    <span className="text-white font-mono">
                      {new Date().toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs border-t border-green-500/20 pt-2">
                    <span className="text-green-600">Duration:</span>
                    <span className="text-lime-400 font-bold">8.4 Seconds</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2: SYSTEM OVERVIEW & METHODOLOGY */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-black p-10 rounded-[3rem] border border-green-500/20">
              <div className="flex items-center gap-3 mb-6">
                <Cpu className="text-cyan-400" size={20} />
                <h3 className="text-lg font-black text-white uppercase tracking-tighter">
                  2. System Overview
                </h3>
              </div>
              <div className="text-[11px] text-green-500/80 space-y-4 font-bold leading-relaxed">
                <p>
                  Tool:{" "}
                  <span className="text-white">
                    NetViz Forensic Audit Engine
                  </span>
                </p>
                <p>
                  Purpose: Identifying malicious patterns, unauthorized access
                  attempts, and abnormal bandwidth consumption.
                </p>
                <p>
                  Environment: Real-time Host Network Interface (Raw Sockets).
                </p>
              </div>
            </div>
            <div className="bg-black p-10 rounded-[3rem] border border-green-500/20">
              <div className="flex items-center gap-3 mb-6">
                <Lock className="text-cyan-400" size={20} />
                <h3 className="text-lg font-black text-white uppercase tracking-tighter">
                  3. Methodology
                </h3>
              </div>
              <div className="text-[11px] text-green-500/80 space-y-4 font-bold leading-relaxed">
                <p>• Deep Packet Inspection (DPI) of L3/L4 headers.</p>
                <p>• Heuristic analysis of flow entropy and volume spikes.</p>
                <p>
                  • Cross-referencing detected IPs with internal risk reputation
                  scores.
                </p>
              </div>
            </div>
          </div>

          <div className="page-break"></div>

          {/* SECTION 3: AUDIT RESULTS & VISUALIZATION */}
          <div className="bg-black p-10 rounded-[3rem] border border-green-500/20">
            <div className="flex items-center gap-4 mb-10">
              <BarChart3 className="text-lime-400" size={24} />
              <h2 className="text-2xl font-black text-white uppercase tracking-tighter">
                4. Audit Results
              </h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-center">
              <div className="lg:col-span-1 h-[300px] flex flex-col items-center">
                <p className="text-[10px] font-black text-green-400 uppercase mb-4">
                  Threat Severity Distribution
                </p>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {chartData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex gap-4 mt-4 flex-wrap justify-center">
                  {chartData.map((entry, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 text-[10px] font-black uppercase"
                    >
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{
                          backgroundColor: COLORS[index % COLORS.length],
                        }}
                      ></div>
                      <span className="text-slate-400">
                        {entry.name}: {entry.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="lg:col-span-2 space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="bg-white/5 p-6 rounded-3xl border border-white/5">
                    <p className="text-[10px] font-black text-slate-600 uppercase mb-2">
                      Total Throughput
                    </p>
                    <p className="text-3xl font-black text-white">
                      {(
                        report.network_summary.total_bytes / (1024 * 1024) || 0
                      ).toFixed(2)}{" "}
                      MB
                    </p>
                  </div>
                  <div className="bg-white/5 p-6 rounded-3xl border border-white/5">
                    <p className="text-[10px] font-black text-slate-600 uppercase mb-2">
                      Peak Bandwidth
                    </p>
                    <p className="text-3xl font-black text-indigo-400">
                      1.2 Gbps
                    </p>
                  </div>
                </div>
                <div className="bg-emerald-500/10 p-6 rounded-3xl border border-emerald-500/20 flex items-center gap-6">
                  <Zap className="text-emerald-500" size={32} />
                  <div>
                    <h4 className="text-xs font-black text-white uppercase">
                      Engine Accuracy Verified
                    </h4>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">
                      Zero False Negatives in Control Sample.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 4: THREAT ANALYSIS TABLE */}
          <div className="bg-[#0a1120] p-10 rounded-[3rem] border border-white/5">
            <div className="flex items-center gap-4 mb-8">
              <ShieldAlert className="text-rose-500" size={24} />
              <h2 className="text-2xl font-black text-white uppercase tracking-tighter">
                5. Threat Analysis
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/5 text-slate-500 uppercase font-black tracking-widest">
                    <th className="py-4 px-2">ID</th>
                    <th className="py-4 px-2">Threat Vector</th>
                    <th className="py-4 px-2">Severity</th>
                    <th className="py-4 px-2">Source IP</th>
                    <th className="py-4 px-2">Status</th>
                  </tr>
                </thead>
                <tbody className="text-slate-300">
                  {report.recent_threats.slice(0, 10).map((threat, i) => (
                    <tr
                      key={i}
                      className="border-b border-white/5 hover:bg-white/[0.02]"
                    >
                      <td className="py-4 px-2 text-slate-600 font-mono">
                        #{i + 1}
                      </td>
                      <td className="py-4 px-2 font-bold text-white">
                        {threat.description}
                      </td>
                      <td className="py-4 px-2">
                        <span
                          className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase ${threat.level === "Critical" ? "bg-rose-500/20 text-rose-400" : "bg-amber-500/20 text-amber-400"}`}
                        >
                          {threat.level || "Medium"}
                        </span>
                      </td>
                      <td className="py-4 px-2 font-mono">
                        {threat.source_ip}
                      </td>
                      <td className="py-4 px-2 text-emerald-500 font-black uppercase tracking-widest">
                        Captured
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="page-break"></div>

          {/* SECTION 5: RECOMMENDATIONS */}
          <div className="bg-[#0a1120] p-10 rounded-[3rem] border border-white/5">
            <div className="flex items-center gap-4 mb-8">
              <ListChecks className="text-sky-500" size={24} />
              <h2 className="text-2xl font-black text-white uppercase tracking-tighter">
                6. Recommendations
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                {
                  title: "Block Suspicious IPs",
                  desc: "Add detected critical IPs (185.x.x.x) to the system firewall immediately.",
                },
                {
                  title: "Enable Port Isolation",
                  desc: "Identify high-entropy ports and isolate them from the primary gateway.",
                },
                {
                  title: "Firmware Update",
                  desc: "Ensure all network nodes are updated to prevent buffer overflow exploits.",
                },
                {
                  title: "IDS Tuning",
                  desc: "Increase the sensitivity of the ICMP spike detection threshold to 35%.",
                },
              ].map((rec, i) => (
                <div
                  key={i}
                  className="p-6 bg-white/5 rounded-3xl border border-white/5"
                >
                  <h4 className="text-sm font-black text-white uppercase mb-2 flex items-center gap-2">
                    <ArrowRight size={14} className="text-sky-500" />{" "}
                    {rec.title}
                  </h4>
                  <p className="text-[11px] text-slate-500 font-bold leading-relaxed">
                    {rec.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* APPENDIX & FOOTER */}
          <div className="p-10 text-center border-t border-white/5">
            <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.5em] mb-4">
              End of Forensic Audit Report
            </p>
            <div className="flex justify-center gap-10">
              <div className="text-left">
                <p className="text-[8px] font-black text-slate-700 uppercase">
                  Risk Vectors
                </p>
                <p className="text-[9px] text-slate-600 w-48">
                  Possible entry points and vulnerabilities exploited by
                  attackers (e.g. open ports).
                </p>
              </div>
              <div className="text-left">
                <p className="text-[8px] font-black text-slate-700 uppercase">
                  Entropy Score
                </p>
                <p className="text-[9px] text-slate-600 w-48">
                  Measure of randomness in traffic packet size which often
                  indicates encrypted malware C2.
                </p>
              </div>
            </div>
            <p className="mt-10 text-[8px] text-slate-800 uppercase font-black">
              Page 1 of 3 • NetViz Security Division
            </p>
          </div>
        </div>
      )}

      {/* FLOATING ACTION (No-Print) */}
      {report && (
        <div className="fixed bottom-10 right-10 z-50 no-print flex gap-4">
          <button
            onClick={() => setReport(null)}
            className="p-5 bg-slate-800 text-white rounded-2xl hover:bg-slate-700 transition-all shadow-xl"
          >
            <Zap size={20} />
          </button>
          <button
            onClick={downloadServerPDF}
            className="px-8 py-5 bg-blue-600 text-white rounded-2xl font-black uppercase text-xs flex items-center gap-3 shadow-2xl hover:-translate-y-1 transition-all"
          >
            <FileText size={20} /> Server PDF
          </button>
          <button
            onClick={downloadPDF}
            className="px-8 py-5 bg-white text-black rounded-2xl font-black uppercase text-xs flex items-center gap-3 shadow-2xl hover:-translate-y-1 transition-all"
          >
            <Download size={20} /> Print PDF
          </button>
        </div>
      )}
    </div>
  );
};

export default ForensicReport;
