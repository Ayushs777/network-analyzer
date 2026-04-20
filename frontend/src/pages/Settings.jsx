import React, { useState, useEffect } from 'react';
import { 
  Settings as SettingsIcon, Book, Shield, Zap, RefreshCw, 
  Info, HelpCircle, Play, Square, Network, Filter, 
  ToggleLeft, ToggleRight, CheckCircle2, FlaskConical 
} from 'lucide-react';
import { API_BASE_URL } from "../config";

const Settings = () => {
  const [activeTab, setActiveTab] = useState('controls');
  const [config, setConfig] = useState({
    status: 'stopped',
    interface: 'auto',
    protocol_filter: 'All',
    ddos_detection: true,
    port_scan_detection: true,
    auto_blocking: false
  });
  const [interfaces, setInterfaces] = useState(['auto']);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    fetchConfig();
    fetchInterfaces();
  }, []);

  const fetchConfig = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/settings`);
      const data = await res.json();
      if (!data.error) setConfig(data);
    } catch (e) { console.error(e); }
  };

  const fetchInterfaces = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/interfaces`);
      const data = await res.json();
      setInterfaces(data);
    } catch (e) { console.error(e); }
  };

  const updateSetting = async (key, value) => {
    const newConfig = { ...config, [key]: value };
    setConfig(newConfig);
    try {
      await fetch(`${API_BASE_URL}/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [key]: value })
      });
      showStatus("Settings updated successfully");
    } catch (e) { console.error(e); }
  };

  const runSimulation = async () => {
    setLoading(true);
    try {
      await fetch(`${API_BASE_URL}/simulate`, { method: 'POST' });
      showStatus("Diagnostics simulation started");
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const showStatus = (msg) => {
    setMessage(msg);
    setTimeout(() => setMessage(null), 3000);
  };

  const toggleCapture = () => {
    const newStatus = config.status === 'running' ? 'stopped' : 'running';
    updateSetting('status', newStatus);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tight uppercase">System Settings</h1>
          <p className="text-slate-500 text-sm font-bold uppercase tracking-widest mt-1">Operational control and documentation</p>
        </div>
        {message && (
          <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-6 py-3 rounded-2xl animate-in slide-in-from-top-2">
            <CheckCircle2 size={18} />
            <span className="text-xs font-black uppercase tracking-widest">{message}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1 space-y-2">
          <TabButton active={activeTab === 'controls'} onClick={() => setActiveTab('controls')} icon={<Zap size={18} />} label="Node Controls" />
          <TabButton active={activeTab === 'security'} onClick={() => setActiveTab('security')} icon={<Shield size={18} />} label="Security Policy" />
          <TabButton active={activeTab === 'docs'} onClick={() => setActiveTab('docs')} icon={<Book size={18} />} label="Manual" />
        </div>

        <div className="lg:col-span-3 bg-[#0a1120] rounded-[2.5rem] border border-white/[0.05] p-6 md:p-10 shadow-2xl relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-600/5 blur-[100px] rounded-full"></div>
          
          {activeTab === 'controls' && (
            <div className="space-y-10 animate-in slide-in-from-right-4 duration-500">
              <section className="space-y-6">
                <div className="flex items-center justify-between p-8 bg-slate-900/50 rounded-3xl border border-white/5">
                   <div>
                      <h3 className="text-xl font-black text-white uppercase tracking-tighter">Capture Engine</h3>
                      <p className="text-xs text-slate-500 mt-1 uppercase tracking-widest font-bold">Main Sniffer Status: {config.status}</p>
                   </div>
                   <div className="flex gap-4">
                     <button 
                        onClick={runSimulation}
                        disabled={loading}
                        className="flex items-center gap-3 px-6 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all bg-white/5 border border-white/10 text-white hover:bg-white/10 disabled:opacity-50"
                     >
                        <FlaskConical size={16} className={loading ? 'animate-pulse' : ''} /> Test Alerts
                     </button>
                     <button 
                        onClick={async () => {
                          if(window.confirm("Are you sure? This will wipe all forensic logs and threat history.")) {
                            await fetch(`${API_BASE_URL}/purge`, { method: 'DELETE' });
                            showStatus("Database purged successfully");
                          }
                        }}
                        className="flex items-center gap-3 px-6 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all bg-rose-500/10 border border-rose-500/20 text-rose-500 hover:bg-rose-500/20"
                     >
                        <RefreshCw size={16} /> Purge Logs
                     </button>
                     <button 
                        onClick={toggleCapture}
                        className={`flex items-center gap-3 px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-widest transition-all transform hover:scale-105 ${
                        config.status === 'running' 
                        ? 'bg-red-500/10 border border-red-500/30 text-red-500' 
                        : 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                        }`}
                     >
                        {config.status === 'running' ? <><Square size={16} /> Stop</> : <><Play size={16} /> Start</>}
                     </button>
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-8 bg-slate-900/30 rounded-3xl border border-white/5 space-y-4">
                    <div className="flex items-center gap-3 text-indigo-400">
                      <Network size={20} />
                      <h4 className="font-black uppercase text-xs tracking-widest">Interface</h4>
                    </div>
                    <select 
                      value={config.interface}
                      onChange={(e) => updateSetting('interface', e.target.value)}
                      className="w-full bg-[#050b14] border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-indigo-500 transition-colors"
                    >
                      <option value="auto">Auto-Detect</option>
                      {interfaces.map(iface => (
                        <option key={iface} value={iface}>{iface}</option>
                      ))}
                    </select>
                  </div>

                  <div className="p-8 bg-slate-900/30 rounded-3xl border border-white/5 space-y-4">
                    <div className="flex items-center gap-3 text-purple-400">
                      <Filter size={20} />
                      <h4 className="font-black uppercase text-xs tracking-widest">Filter</h4>
                    </div>
                    <div className="flex gap-2">
                      {['All', 'TCP', 'UDP', 'ICMP'].map(proto => (
                        <button
                          key={proto}
                          onClick={() => updateSetting('protocol_filter', proto)}
                          className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-tighter transition-all ${
                            config.protocol_filter === proto ? 'bg-indigo-600 text-white' : 'bg-white/5 text-slate-500 hover:bg-white/10'
                          }`}
                        >
                          {proto}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </section>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
              <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Detection Policy</h3>
              <div className="space-y-4">
                <ToggleRow title="DDoS Guard" desc="Identify high-volume flood attacks" active={config.ddos_detection} onChange={(v) => updateSetting('ddos_detection', v)} />
                <ToggleRow title="Scan Shield" desc="Flag rapid port probing behavior" active={config.port_scan_detection} onChange={(v) => updateSetting('port_scan_detection', v)} />
                <ToggleRow title="Auto-Jail" desc="Automatically block malicious IPs" active={config.auto_blocking} onChange={(v) => updateSetting('auto_blocking', v)} />
              </div>
            </div>
          )}

          {activeTab === 'docs' && <DocumentationTab />}
        </div>
      </div>
    </div>
  );
};

const ToggleRow = ({ title, desc, active, onChange }) => (
  <div className="flex items-center justify-between p-8 bg-white/[0.02] border border-white/[0.05] rounded-[2rem]">
    <div>
      <h5 className="text-sm font-black text-white uppercase tracking-wider">{title}</h5>
      <p className="text-xs text-slate-500 mt-1 font-medium">{desc}</p>
    </div>
    <button onClick={() => onChange(!active)}>
      {active ? <ToggleRight className="text-indigo-500" size={40} /> : <ToggleLeft className="text-slate-700" size={40} />}
    </button>
  </div>
);

const DocumentationTab = () => (
  <div className="space-y-10">
    <section className="space-y-6">
      <h3 className="text-xl font-black text-white uppercase tracking-tighter">Manual</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <DocItem title="Engine Control" desc="Start/Stop the capture engine. Stopping freezes all live telemetry." />
        <DocItem title="Interface" desc="Pick the hardware NIC. Auto-Detect is usually best." />
        <DocItem title="Filtering" desc="Focus on specific protocols to reduce noise." />
        <DocItem title="Policy" desc="Enable/Disable AI and Heuristic detection modules." />
      </div>
    </section>
  </div>
);

const TabButton = ({ active, onClick, icon, label }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-4 px-6 py-5 rounded-2xl transition-all ${
      active ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:bg-white/5'
    }`}
  >
    {icon}
    <span className="font-black text-xs uppercase tracking-widest">{label}</span>
  </button>
);

const DocItem = ({ title, desc }) => (
  <div className="p-6 bg-white/[0.02] border border-white/[0.05] rounded-3xl">
    <h5 className="text-white font-black text-xs uppercase tracking-widest mb-2">{title}</h5>
    <p className="text-xs text-slate-500 font-medium">{desc}</p>
  </div>
);

export default Settings;
