import React, { useState, useEffect, useRef } from 'react';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area
} from 'recharts';
import { 
  PieChart as PieIcon, Info, Activity, RefreshCw, Download, 
  Trash2, ShieldAlert, Zap, Table
} from 'lucide-react';
import { API_BASE_URL, WS_BASE_URL } from "../config";

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#10b981'];

const ProtocolAnalysis = () => {
  const [data, setData] = useState([]);
  const [trends, setTrends] = useState([]);
  const [topPorts, setTopPorts] = useState([]);
  const [activeProto, setActiveProto] = useState('TCP');
  const [liveFeed, setLiveFeed] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const packetWs = useRef(null);

  const fetchData = async () => {
    try {
      const [pRes, tRes, portRes] = await Promise.all([
        fetch(`${API_BASE_URL}/protocols`).catch(() => null),
        fetch(`${API_BASE_URL}/protocol-trends`).catch(() => null),
        fetch(`${API_BASE_URL}/top-ports?protocol=${activeProto}`).catch(() => null)
      ]);
      
      if (pRes?.ok) setData(await pRes.json());
      if (tRes?.ok) {
        const tData = await tRes.json();
        // If we have very little data, add some padding for the chart to look better
        if (tData.length > 0 && tData.length < 10) {
            setTrends([...new Array(10 - tData.length).fill({ timestamp: '', TCP: 0, UDP: 0, ICMP: 0 }), ...tData]);
        } else {
            setTrends(tData);
        }
      }
      if (portRes?.ok) setTopPorts(await portRes.json());
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 2000); // More frequent updates

    packetWs.current = new WebSocket(`${WS_BASE_URL}/live-packets`);
    packetWs.current.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === 'packet') {
          setLiveFeed(prev => [message.data, ...prev].slice(0, 10));
        }
      } catch (e) {}
    };

    return () => {
      clearInterval(interval);
      packetWs.current?.close();
    };
  }, [activeProto]);

  const resetStats = async () => {
    if (!window.confirm("Reset all network stats?")) return;
    await fetch(`${API_BASE_URL}/reset-stats`, { method: 'POST' });
    fetchData();
  };

  const exportCSV = async () => {
    const res = await fetch(`${API_BASE_URL}/export-csv`);
    const csvData = await res.json();
    const blob = new Blob([csvData.csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `traffic_report.csv`;
    a.click();
  };

  const topProtocol = Array.isArray(data) && data.length > 0 
    ? data.reduce((prev, current) => ((prev.count || 0) > (current.count || 0)) ? prev : current) 
    : null;

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center space-x-6">
           <div className="w-16 h-16 bg-indigo-600/20 rounded-2xl flex items-center justify-center border border-indigo-500/30">
              <PieIcon className="text-indigo-400" size={32} />
           </div>
           <div>
              <h1 className="text-4xl font-black text-white tracking-tighter uppercase">Traffic Mix v2</h1>
              <p className="text-slate-500 text-sm font-bold uppercase tracking-widest">Real-Time Heuristics</p>
           </div>
        </div>

        <div className="flex items-center gap-3 bg-[#0a1120] p-2 rounded-2xl border border-white/5">
          <button onClick={fetchData} className="p-3 hover:bg-white/5 rounded-xl text-slate-400"><RefreshCw size={18} /></button>
          <button onClick={exportCSV} className="p-3 hover:bg-white/5 rounded-xl text-indigo-400 flex items-center gap-2 font-black text-[10px] uppercase tracking-widest">
            <Download size={16} /> CSV
          </button>
          <button onClick={resetStats} className="p-3 hover:bg-red-500/10 rounded-xl text-red-500"><Trash2 size={18} /></button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 bg-gradient-to-br from-indigo-600 to-purple-700 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
           <Zap className="absolute -bottom-4 -right-4 text-white/10 w-32 h-32" />
           <p className="text-white/60 text-[10px] font-black uppercase tracking-[0.2em] mb-4">Dominant Force</p>
           {topProtocol ? (
             <>
               <h3 className="text-5xl font-black text-white tracking-tighter mb-2">{topProtocol.protocol}</h3>
               <p className="text-2xl font-black text-white/90">{topProtocol.share || 0}% Share</p>
             </>
           ) : <p className="text-white/40 text-xs font-bold uppercase animate-pulse">Initializing...</p>}
        </div>

        <div className="lg:col-span-3 bg-[#0a1120] p-8 rounded-[2.5rem] border border-white/5 flex gap-6 items-center">
           <div className="bg-indigo-600/20 p-4 rounded-3xl h-fit"><Info size={24} className="text-indigo-400" /></div>
           <div className="space-y-1">
              <h4 className="text-white font-black uppercase text-xs tracking-widest">Logic Insight</h4>
              <p className="text-xs text-slate-400 font-medium">Monitoring protocol stability. High ICMP/UDP counts may indicate scanning or flooding attempts.</p>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-[#0a1120] p-10 rounded-[2.5rem] border border-white/5 shadow-2xl h-[450px]">
          <h3 className="text-xl font-black text-white uppercase tracking-tight mb-8">Protocol Trends</h3>
          <div className="h-full w-full">
            <ResponsiveContainer width="100%" height="80%">
              <AreaChart data={trends}>
                <defs>
                  <linearGradient id="tcpG" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/><stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/></linearGradient>
                  <linearGradient id="udpG" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/><stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/></linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} strokeOpacity={0.3} />
                <XAxis dataKey="timestamp" stroke="#475569" fontSize={9} />
                <YAxis stroke="#475569" fontSize={9} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px' }} />
                <Area type="monotone" dataKey="TCP" stroke="#3b82f6" strokeWidth={3} fill="url(#tcpG)" />
                <Area type="monotone" dataKey="UDP" stroke="#8b5cf6" strokeWidth={3} fill="url(#udpG)" />
                <Area type="monotone" dataKey="ICMP" stroke="#ec4899" strokeWidth={2} fill="none" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-[#0a1120] p-8 rounded-[2.5rem] border border-white/5 shadow-2xl flex flex-col">
          <h3 className="font-black text-white text-sm uppercase tracking-widest mb-8 flex items-center gap-2">Top Ports</h3>
          <div className="flex gap-1 mb-6">
             {['TCP', 'UDP'].map(p => (
               <button key={p} onClick={() => setActiveProto(p)} className={`flex-1 py-2 rounded-xl text-[9px] font-black uppercase ${activeProto === p ? 'bg-indigo-600 text-white' : 'bg-white/5 text-slate-500'}`}>{p}</button>
             ))}
          </div>
          <div className="flex-1 space-y-4 overflow-y-auto">
             {topPorts.map((p, idx) => (
               <div key={idx} className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/[0.05] rounded-2xl">
                  <span className="w-10 h-10 rounded-xl bg-indigo-600/10 flex items-center justify-center text-indigo-400 font-black text-xs">#{p.port}</span>
                  <span className="text-xs font-black text-white">{p.count} <span className="text-[10px] text-slate-600 ml-1 uppercase">Hits</span></span>
               </div>
             ))}
             {topPorts.length === 0 && <div className="text-center py-10 text-slate-600 text-xs font-black animate-pulse uppercase">Waiting...</div>}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-[#0a1120] p-8 rounded-[2.5rem] border border-white/5 shadow-2xl">
          <h3 className="font-black text-white text-sm uppercase tracking-widest mb-8">Live Feed</h3>
          <div className="space-y-3">
             {liveFeed.map((pkt, idx) => (
               <div key={idx} className="flex items-center justify-between p-4 bg-[#050b14] rounded-2xl border border-white/5">
                  <div className="flex items-center gap-4">
                     <span className={`w-2 h-2 rounded-full ${pkt.protocol === 'TCP' ? 'bg-blue-500' : (pkt.protocol === 'UDP' ? 'bg-purple-500' : 'bg-pink-500')}`}></span>
                     <span className="text-[10px] font-mono text-slate-400 truncate max-w-[120px]">{pkt.src_ip}</span>
                  </div>
                  <div className="flex items-center gap-6">
                    <span className="text-[10px] font-black text-white uppercase">{pkt.protocol}</span>
                    <span className="text-[10px] font-bold text-slate-600 uppercase">{pkt.size}B</span>
                  </div>
               </div>
             ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
           {Array.isArray(data) && data.map((item, i) => (
             <div key={i} className="bg-[#0a1120] p-8 rounded-[2.5rem] border border-white/5 shadow-xl group hover:border-indigo-500/30 transition-all">
                <div className="flex justify-between items-start mb-6">
                   <div className="p-3 bg-slate-900 rounded-xl border border-white/5"><Zap size={18} style={{ color: COLORS[i % COLORS.length] }} /></div>
                   <span className="text-xs font-black text-slate-500 uppercase tracking-widest">{item.protocol}</span>
                </div>
                <h4 className="text-3xl font-black text-white tracking-tighter mb-1">{item.avg_size || 0}</h4>
                <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Avg Bytes</p>
                <div className="flex items-center gap-2 mt-4">
                   <div className={`w-2 h-2 rounded-full ${(item.count || 0) > 5000 ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`}></div>
                   <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{(item.count || 0) > 5000 ? 'Heavy' : 'Optimal'}</span>
                </div>
             </div>
           ))}
        </div>
      </div>
    </div>
  );
};

export default ProtocolAnalysis;
