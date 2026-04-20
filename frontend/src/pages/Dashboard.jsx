import React, { useState, useEffect, useRef } from "react";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts";
import {
  Activity,
  ShieldAlert,
  Network,
  Zap,
  Globe,
  ShieldCheck,
  HeartPulse,
  Info,
  Wifi,
} from "lucide-react";

const COLORS = [
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#10b981",
  "#f59e0b",
  "#ef4444",
];

import { API_BASE_URL, WS_BASE_URL } from "../config";

const Dashboard = () => {
  const [stats, setStats] = useState({
    total_packets: 0,
    total_flows: 0,
    total_alerts: 0,
    high_alerts: 0,
    protocols: {},
    bandwidth_mbps: 0,
  });
  const [deviceInfo, setDeviceInfo] = useState({
    local_ip: "0.0.0.0",
    network_name: "Connecting...",
    status: "Initializing",
  });
  const [trafficData, setTrafficData] = useState([]);
  const [protocolData, setProtocolData] = useState([]);
  const [topTalkers, setTopTalkers] = useState([]);
  const [riskSummary, setRiskSummary] = useState({
    high_risk_ips: 0,
    recent_alerts: 0,
  });
  const trafficWs = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [sRes, dRes, rRes] = await Promise.all([
          fetch(`${API_BASE_URL}/stats`),
          fetch(`${API_BASE_URL}/device-info`),
          fetch(`${API_BASE_URL}/report`),
        ]);
        const sData = await sRes.json();
        const dData = await dRes.json();
        const rData = await rRes.json();
        setStats((prev) => ({
          ...prev,
          ...sData,
          protocols: rData.network_summary.protocol_distribution || {},
        }));
        setDeviceInfo(dData);
        setProtocolData(
          Object.entries(rData.network_summary.protocol_distribution || {}).map(
            ([name, value]) => ({ name, value }),
          ),
        );
        setTopTalkers(rData.top_talkers.sources || []);
        setRiskSummary({
          high_risk_ips: rData.risk_assessment?.high_risk_ips || 0,
          recent_alerts: rData.recent_threats?.length || 0,
        });
      } catch (e) {
        console.error(e);
      }
    };
    fetchData();

    trafficWs.current = new WebSocket(`${WS_BASE_URL}/traffic`);
    trafficWs.current.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === "traffic_stats") {
          const newData = message.data;
          setTrafficData((prev) =>
            [
              ...prev,
              {
                time: new Date(newData.timestamp).toLocaleTimeString([], {
                  hour12: false,
                  second: "2-digit",
                }),
                incoming: newData.incoming_bps / 1024,
                outgoing: newData.outgoing_bps / 1024,
                bandwidth: newData.bandwidth_mbps,
              },
            ].slice(-30),
          );

          setStats((prev) => ({
            ...prev,
            total_packets: newData.total_packets,
            bandwidth_mbps: newData.bandwidth_mbps,
          }));
        }
      } catch (e) {}
    };

    return () => trafficWs.current?.close();
  }, []);

  const pieData = protocolData.length
    ? protocolData
    : Object.entries(stats.protocols).map(([name, value]) => ({ name, value }));

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      {/* Network identity with prominent speed */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-black border border-green-500/30 rounded-3xl p-6 flex items-center gap-5 shadow-xl">
          <div className="p-4 bg-green-600/10 rounded-2xl border border-green-500/30 text-green-400">
            <Wifi size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">
              Network
            </p>
            <h4 className="text-lg font-black text-white truncate max-w-[150px]">
              {deviceInfo.network_name}
            </h4>
          </div>
        </div>

        <div className="bg-black border border-cyan-500/30 rounded-3xl p-6 flex items-center gap-5 shadow-xl">
          <div className="p-4 bg-cyan-600/10 rounded-2xl border border-cyan-500/30 text-cyan-400">
            <Globe size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black text-green-400 uppercase tracking-widest mb-1">
              IP Address
            </p>
            <h4 className="text-lg font-black text-white font-mono">
              {deviceInfo.local_ip}
            </h4>
          </div>
        </div>

        <div className="bg-black border border-lime-500/30 rounded-3xl p-6 flex items-center gap-5 shadow-xl bg-gradient-to-r from-lime-500/5 to-transparent">
          <div className="p-4 bg-lime-500/20 rounded-2xl border border-lime-500/30 text-lime-400">
            <Zap size={24} className="animate-pulse" />
          </div>
          <div>
            <p className="text-[10px] font-black text-green-400 uppercase tracking-widest mb-1">
              Live Speed
            </p>
            <h4 className="text-2xl font-black text-white">
              {stats.bandwidth_mbps > 0.01
                ? stats.bandwidth_mbps.toFixed(2)
                : "0.00"}{" "}
              <span className="text-[10px] text-slate-500 uppercase">Mbps</span>
            </h4>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center space-x-6">
          <div className="w-16 h-16 bg-green-600/10 rounded-2xl flex items-center justify-center border border-green-500/30">
            <ShieldCheck className="text-green-400" size={32} />
          </div>
          <div>
            <h1 className="text-4xl font-black text-white tracking-tighter uppercase">
              Overview
            </h1>
            <p className="text-green-500 text-sm font-bold flex items-center gap-2 uppercase tracking-widest">
              <Activity size={14} className="text-lime-400" /> Security
              Operations
            </p>
          </div>
        </div>

        <div className="max-w-md bg-black/50 border border-green-500/30 p-5 rounded-3xl flex gap-4">
          <Info size={16} className="text-green-400 mt-1 shrink-0" />
          <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
            Monitor real-world network name, local IP, and live bandwidth
            throughput.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Packets"
          value={stats.total_packets.toLocaleString()}
          unit="PKTS"
          icon={<Network className="text-blue-400" />}
          trend="+ Real-time"
        />
        <StatCard
          title="Throughput"
          value={stats.bandwidth_mbps.toFixed(3)}
          unit="Mbps"
          icon={<Zap className="text-yellow-400" />}
          trend="Live Sync"
        />
        <StatCard
          title="Network Pulse"
          value={stats.total_flows}
          unit="ACTIVE"
          icon={<HeartPulse className="text-emerald-400" />}
          trend="Healthy"
        />
        <StatCard
          title="Threats"
          value={stats.total_alerts}
          unit="ALERTS"
          icon={<ShieldAlert className="text-red-400" />}
          trend={stats.high_alerts > 0 ? "Action Required" : "Clean"}
          isAlert={stats.high_alerts > 0}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-black p-10 rounded-[2.5rem] border border-green-500/20 shadow-2xl relative overflow-hidden">
          <h3 className="text-xl font-black text-white tracking-tight uppercase mb-10">
            Traffic Density
          </h3>
          <div className="h-96 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trafficData}>
                <defs>
                  <linearGradient id="colorInc" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorOut" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#1e293b"
                  vertical={false}
                  strokeOpacity={0.3}
                />
                <XAxis dataKey="time" stroke="#475569" fontSize={10} />
                <YAxis stroke="#475569" fontSize={10} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    border: "1px solid #1e293b",
                    borderRadius: "16px",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="incoming"
                  stroke="#3b82f6"
                  strokeWidth={4}
                  fill="url(#colorInc)"
                />
                <Area
                  type="monotone"
                  dataKey="outgoing"
                  stroke="#8b5cf6"
                  strokeWidth={4}
                  fill="url(#colorOut)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-black p-10 rounded-[2.5rem] border border-green-500/20 shadow-2xl">
          <h3 className="font-black text-white text-lg mb-10 flex items-center gap-3">
            Traffic Mix
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={8}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    border: "1px solid #1e293b",
                    borderRadius: "12px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-3 mt-8">
            {pieData.slice(0, 4).map((p, i) => (
              <div
                key={i}
                className="flex items-center space-x-3 bg-white/[0.02] p-3 rounded-2xl border border-white/[0.05]"
              >
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: COLORS[i % COLORS.length] }}
                ></div>
                <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">
                  {p.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        <div className="bg-[#0a1120] p-8 rounded-[2.5rem] border border-white/[0.05] shadow-2xl">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-black text-white uppercase tracking-tight">
              Top Talkers
            </h3>
            <span className="text-[10px] text-slate-500 uppercase tracking-widest">
              Live
            </span>
          </div>
          <div className="space-y-4">
            {topTalkers.slice(0, 5).map((talker, i) => (
              <div
                key={i}
                className="flex justify-between items-center gap-4 bg-white/[0.02] p-4 rounded-3xl border border-white/[0.05]"
              >
                <div>
                  <p className="text-slate-400 text-[10px] uppercase tracking-[0.18em]">
                    Source IP
                  </p>
                  <p className="text-sm font-black text-white">{talker.ip}</p>
                </div>
                <p className="text-sm font-black text-emerald-400">
                  {talker.count}
                </p>
              </div>
            ))}
            {topTalkers.length === 0 && (
              <p className="text-slate-500 text-sm">
                No talker data available yet.
              </p>
            )}
          </div>
        </div>

        <div className="bg-[#0a1120] p-8 rounded-[2.5rem] border border-white/[0.05] shadow-2xl">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-black text-white uppercase tracking-tight">
              Alert Summary
            </h3>
            <span className="text-[10px] text-slate-500 uppercase tracking-widest">
              Current
            </span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/[0.02] p-4 rounded-3xl border border-white/[0.05]">
              <p className="text-[10px] text-slate-500 uppercase tracking-[0.18em]">
                High Risk IPs
              </p>
              <p className="text-3xl font-black text-emerald-400">
                {riskSummary.high_risk_ips}
              </p>
            </div>
            <div className="bg-white/[0.02] p-4 rounded-3xl border border-white/[0.05]">
              <p className="text-[10px] text-slate-500 uppercase tracking-[0.18em]">
                Recent Alerts
              </p>
              <p className="text-3xl font-black text-indigo-400">
                {riskSummary.recent_alerts}
              </p>
            </div>
          </div>
          <div className="mt-6 text-[11px] leading-relaxed text-slate-400">
            The system combines flow analytics with anomaly scoring to identify
            potential threats in real-time.
          </div>
        </div>

        <div className="bg-[#0a1120] p-8 rounded-[2.5rem] border border-white/[0.05] shadow-2xl">
          <h3 className="text-lg font-black text-white uppercase tracking-tight mb-6">
            Protocol Composition
          </h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={pieData}
                margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
              >
                <CartesianGrid
                  stroke="#1e293b"
                  strokeDasharray="3 3"
                  vertical={false}
                />
                <XAxis dataKey="name" stroke="#64748b" fontSize={10} />
                <YAxis stroke="#64748b" fontSize={10} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    border: "1px solid #1e293b",
                    borderRadius: "12px",
                  }}
                />
                <Bar dataKey="value" fill="#3b82f6" radius={[10, 10, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, unit, icon, trend, isAlert }) => (
  <div
    className={`bg-[#0a1120] p-8 rounded-[2.5rem] border transition-all duration-500 shadow-xl ${isAlert ? "border-red-500/30" : "border-white/[0.05]"}`}
  >
    <div className="flex justify-between items-start mb-8">
      <div className="p-4 bg-slate-900 rounded-2xl border border-white/[0.05]">
        {icon}
      </div>
      <div
        className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${isAlert ? "bg-red-500 text-white" : "bg-emerald-500/10 text-emerald-500"}`}
      >
        {trend}
      </div>
    </div>
    <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mb-2">
      {title}
    </p>
    <div className="flex items-baseline space-x-2">
      <h3 className="text-4xl font-black text-white tracking-tighter">
        {value}
      </h3>
      <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">
        {unit}
      </span>
    </div>
  </div>
);

export default Dashboard;
