import React, { useState, useEffect } from 'react';
import { Users, Info, ArrowUpRight, Database, Globe } from 'lucide-react';
import { API_BASE_URL } from "../config";

const TopTalkers = () => {
  const [talkers, setTalkers] = useState([]);

  useEffect(() => {
    const fetchTalkers = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/top-talkers`);
        const data = await res.json();
        setTalkers(data);
      } catch (e) { console.error(e); }
    };
    fetchTalkers();
    const interval = setInterval(fetchTalkers, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center space-x-6">
           <div className="w-16 h-16 bg-indigo-600/20 rounded-2xl flex items-center justify-center border border-indigo-500/30 shadow-[0_0_30px_rgba(79,70,229,0.2)]">
              <Users className="text-indigo-400" size={32} />
           </div>
           <div>
              <h1 className="text-4xl font-black text-white tracking-tighter uppercase">Endpoint Rankings</h1>
              <p className="text-slate-500 text-sm font-bold flex items-center gap-2 uppercase tracking-widest">
                Top Data Consuming Nodes
              </p>
           </div>
        </div>

        {/* Documentation Section */}
        <div className="max-w-md bg-white/[0.03] border border-white/10 p-5 rounded-3xl flex gap-4">
           <div className="bg-indigo-600/20 p-2 rounded-xl h-fit mt-1"><Info size={16} className="text-indigo-400" /></div>
           <div>
              <p className="text-[10px] font-black text-white uppercase tracking-widest mb-1">Section Summary</p>
              <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
                The Top Talkers page identifies which devices (IP addresses) are sending or receiving the most data. This is crucial for spotting <strong>Bandwidth Hogs</strong> or unauthorized data transfers.
              </p>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {talkers.map((talker, index) => (
          <div key={talker.ip} className="bg-[#0a1120] p-8 rounded-[2.5rem] border border-white/[0.05] shadow-2xl relative overflow-hidden group hover:border-indigo-500/30 transition-all hover:-translate-y-2">
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-600/5 blur-3xl rounded-full group-hover:bg-indigo-600/10 transition-all"></div>
            
            <div className="flex justify-between items-start mb-8">
              <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center border border-white/5 font-black text-indigo-400">
                #{index + 1}
              </div>
              <div className="px-3 py-1.5 bg-emerald-500/10 text-emerald-500 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-2">
                <ArrowUpRight size={10} /> Active
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Source Endpoint</p>
                <h3 className="text-xl font-black text-white font-mono">{talker.ip}</h3>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-white/[0.02] rounded-2xl border border-white/5">
                  <div className="flex items-center gap-2 text-slate-500 mb-1">
                    <Database size={12} />
                    <span className="text-[9px] font-black uppercase">Volume</span>
                  </div>
                  <p className="text-sm font-bold text-white">{talker.bandwidth_mb} MB</p>
                </div>
                <div className="p-4 bg-white/[0.02] rounded-2xl border border-white/5">
                  <div className="flex items-center gap-2 text-slate-500 mb-1">
                    <Globe size={12} />
                    <span className="text-[9px] font-black uppercase">Packets</span>
                  </div>
                  <p className="text-sm font-bold text-white">{talker.packets.toLocaleString()}</p>
                </div>
              </div>

              <div className="w-full h-1 bg-slate-900 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-1000" 
                  style={{ width: `${Math.min(100, talker.bandwidth_mb * 10)}%` }}
                ></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TopTalkers;
