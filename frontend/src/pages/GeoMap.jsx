import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  Graticule,
  Line,
  ZoomableGroup
} from "react-simple-maps";
import { Globe, Shield, Zap, Activity, Clock, Satellite, Target, Play, ShieldAlert, Plus, Minus, Maximize, MousePointer2 } from 'lucide-react';
import { API_BASE_URL } from "../config";

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

// Intelligent Location Spreading for Private IPs
const getSmartCoords = (ip, city, country, lat, lon, localLat, localLon) => {
  const isPrivate = /^(192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.)/.test(ip);
  if (isPrivate || (!lat && !lon)) {
    const offsetLat = (Math.random() - 0.5) * 5;
    const offsetLon = (Math.random() - 0.5) * 5;
    return [localLon + offsetLon, localLat + offsetLat];
  }
  return [lon, lat];
};

const FALLBACK_DATA = [
  { ip: "185.191.171.1", city: "Frankfurt", country: "Germany", lat: 50.11, lon: 8.68, risk: 92 },
  { ip: "45.33.32.156", city: "London", country: "UK", lat: 51.50, lon: -0.12, risk: 45 },
  { ip: "103.212.223.4", city: "Tokyo", country: "Japan", lat: 35.67, lon: 139.65, risk: 78 },
  { ip: "157.240.22.35", city: "Mumbai", country: "India", lat: 19.07, lon: 72.87, risk: 10 }
];

const GeoMap = () => {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [localIpInfo, setLocalIpInfo] = useState({ lat: 28.61, lon: 77.20, ip: '192.168.1.1', city: 'Delhi HQ' });
  const [hoveredIp, setHoveredIp] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isSimulating, setIsSimulating] = useState(false);
  const [position, setPosition] = useState({ coordinates: [20, 0], zoom: 1 });

  // Clock Update
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const indianTime = useMemo(() => {
    return currentTime.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour12: true });
  }, [currentTime]);

  const fetchData = useCallback(async (isInitial = false) => {
    if (isInitial) setLoading(true);
    try {
      const dRes = await fetch(`${API_BASE_URL}/device-info`);
      const dData = await dRes.json();
      
      const gRes = await fetch(`${API_BASE_URL}/geo-ip`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ip: dData.local_ip })
      });
      const localGeo = await gRes.json();
      if (localGeo && localGeo.lat) setLocalIpInfo({ ...localGeo, ip: dData.local_ip });

      const [scoreRes, alertRes] = await Promise.all([
        fetch(`${API_BASE_URL}/ip-scores`).then(r => r.json()),
        fetch(`${API_BASE_URL}/alerts?limit=20`).then(r => r.json())
      ]);
      
      const allIps = [...new Set([
        ...scoreRes.map(s => s.ip_address),
        ...alertRes.map(a => a.source_ip)
      ])].filter(ip => ip && ip !== 'Local Engine' && ip !== '127.0.0.1');

      const geoPromises = allIps.map(async (ip) => {
        try {
          const res = await fetch(`${API_BASE_URL}/geo-ip`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ip })
          });
          const data = await res.json();
          const riskData = scoreRes.find(s => s.ip_address === ip);
          return { ...data, ip, risk: riskData?.score || 50 };
        } catch { return null; }
      });
      
      const results = (await Promise.all(geoPromises)).filter(g => g);
      const processed = results.map(r => {
        const [lon, lat] = getSmartCoords(r.ip, r.city, r.country, r.lat, r.lon, localIpInfo.lat, localIpInfo.lon);
        return { ...r, lat, lon };
      });

      setLocations(processed.length > 0 ? processed : FALLBACK_DATA);
    } catch (e) {
      setLocations(FALLBACK_DATA);
    } finally {
      setLoading(false);
    }
  }, [localIpInfo.lat, localIpInfo.lon]);

  const handleSimulate = async () => {
    setIsSimulating(true);
    await fetch(`${API_BASE_URL}/simulate`, { method: 'POST' });
    setTimeout(() => { fetchData(); setIsSimulating(false); }, 2000);
  };

  useEffect(() => {
    fetchData(true);
    const interval = setInterval(() => fetchData(false), 15000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Zoom Handlers
  const handleZoomIn = () => {
    if (position.zoom >= 4) return;
    setPosition(pos => ({ ...pos, zoom: pos.zoom * 1.5 }));
  };
  const handleZoomOut = () => {
    if (position.zoom <= 1) return;
    setPosition(pos => ({ ...pos, zoom: pos.zoom / 1.5 }));
  };
  const handleReset = () => setPosition({ coordinates: [20, 0], zoom: 1 });
  const handleMoveEnd = (pos) => setPosition(pos);

  return (
    <div className="space-y-6 animate-in fade-in duration-1000">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div className="flex items-center space-x-6">
           <div className="w-16 h-16 bg-indigo-600/20 rounded-2xl flex items-center justify-center border border-indigo-500/20 shadow-2xl">
              <Satellite className="text-indigo-400" size={32} />
           </div>
           <div>
              <h1 className="text-4xl font-black text-white uppercase tracking-tighter">Geospatial Intelligence</h1>
              <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.3em]">IST: {indianTime}</p>
           </div>
        </div>

        <button 
          onClick={handleSimulate}
          disabled={isSimulating}
          className={`flex items-center gap-3 px-8 py-5 rounded-[2.5rem] font-black uppercase text-xs tracking-widest transition-all ${isSimulating ? 'bg-slate-800 text-slate-500' : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg'}`}
        >
           {isSimulating ? <Radar className="animate-spin" size={18} /> : <Play size={18} />}
           {isSimulating ? 'Scanning...' : 'Global Scan'}
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        <div className="xl:col-span-3 bg-[#050b14] rounded-[4rem] border border-white/[0.03] relative overflow-hidden h-[600px] md:h-[750px] shadow-2xl">
          
          {/* Legend Overlay */}
          <div className="absolute top-10 left-10 p-6 bg-black/60 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] z-10 shadow-2xl min-w-[180px]">
             <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-3">Origin Node</p>
             <p className="text-sm font-mono font-bold text-white mb-1">{localIpInfo.ip}</p>
             <p className="text-[10px] font-bold text-slate-500 uppercase">{localIpInfo.city}, India</p>
          </div>

          {/* ZOOM CONTROLS */}
          <div className="absolute bottom-10 right-10 z-10 flex flex-col gap-3">
             <button onClick={handleZoomIn} className="p-4 bg-black/60 backdrop-blur-md border border-white/10 rounded-2xl text-white hover:bg-indigo-600 transition-all">
                <Plus size={20} />
             </button>
             <button onClick={handleZoomOut} className="p-4 bg-black/60 backdrop-blur-md border border-white/10 rounded-2xl text-white hover:bg-indigo-600 transition-all">
                <Minus size={20} />
             </button>
             <button onClick={handleReset} className="p-4 bg-black/60 backdrop-blur-md border border-white/10 rounded-2xl text-white hover:bg-indigo-600 transition-all">
                <Maximize size={20} />
             </button>
          </div>

          <div className="absolute top-10 right-10 z-10 p-4 bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl flex items-center gap-3">
             <MousePointer2 className="text-indigo-400 animate-bounce" size={16} />
             <p className="text-[9px] font-black text-white uppercase tracking-widest">Scroll to Zoom • Drag to Pan</p>
          </div>

          {loading ? (
             <div className="absolute inset-0 flex items-center justify-center bg-[#050b14] z-50">
                <Globe className="text-indigo-500 animate-pulse" size={50} />
             </div>
          ) : (
            <ComposableMap projectionConfig={{ scale: 200 }} className="w-full h-full">
              <ZoomableGroup 
                zoom={position.zoom} 
                center={position.coordinates} 
                onMoveEnd={handleMoveEnd}
                maxZoom={10}
              >
                <Graticule stroke="#1e293b" strokeWidth={0.5} opacity={0.1} />
                <Geographies geography={geoUrl}>
                  {({ geographies }) =>
                    geographies.map((geo) => (
                      <Geography
                        key={geo.rsmKey}
                        geography={geo}
                        fill="#080c16"
                        stroke="#1e293b"
                        strokeWidth={0.5}
                        style={{ default: { outline: "none" }, hover: { fill: "#131c31", outline: "none" } }}
                      />
                    ))
                  }
                </Geographies>

                {locations.map((loc, i) => {
                  const isHighRisk = loc.risk > 70;
                  return (
                    <React.Fragment key={`v-${loc.ip}-${i}`}>
                      <Line
                        from={[localIpInfo.lon, localIpInfo.lat]}
                        to={[loc.lon, loc.lat]}
                        stroke={isHighRisk ? "#ef4444" : "#4f46e5"}
                        strokeWidth={1 / position.zoom} // Keep lines thin when zooming
                        strokeDasharray="4 4"
                        opacity={0.2}
                      />
                      <Marker coordinates={[loc.lon, loc.lat]} onMouseEnter={() => setHoveredIp(loc.ip)} onMouseLeave={() => setHoveredIp(null)}>
                        <g className="cursor-pointer">
                          <circle r={isHighRisk ? 8 : 5} fill={isHighRisk ? "#ef4444" : "#f59e0b"} fillOpacity={0.1} className="animate-ping" />
                          <circle r={2 / position.zoom + 2} fill={isHighRisk ? "#ef4444" : "#f59e0b"} />
                          
                          {isHighRisk && position.zoom > 1.5 && (
                            <text textAnchor="middle" y={10} className="text-[5px] fill-rose-500 font-black uppercase">{loc.ip}</text>
                          )}

                          {hoveredIp === loc.ip && (
                            <g>
                               <rect x={-40} y={-35} width={80} height={25} rx={5} fill="#000" fillOpacity={0.9} />
                               <text textAnchor="middle" y={-20} className="text-[7px] fill-white font-black">{loc.ip}</text>
                            </g>
                          )}
                        </g>
                      </Marker>
                    </React.Fragment>
                  );
                })}

                <Marker coordinates={[localIpInfo.lon, localIpInfo.lat]}>
                  <circle r={4 / position.zoom + 3} fill="#10b981" className="filter drop-shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                  <text textAnchor="middle" y={-12} className="text-[8px] fill-emerald-400 font-black uppercase tracking-widest">Base HQ</text>
                </Marker>
              </ZoomableGroup>
            </ComposableMap>
          )}
        </div>

        <div className="bg-[#050b14] p-8 rounded-[4rem] border border-white/[0.03] shadow-2xl flex flex-col h-[750px]">
           <div className="flex items-center gap-3 mb-10 shrink-0">
              <Activity className="text-rose-500 animate-pulse" size={24} />
              <h2 className="text-xl font-black text-white uppercase tracking-tighter">Vector Analysis</h2>
           </div>

           <div className="space-y-4 overflow-y-auto custom-scrollbar flex-1 pr-2">
              {locations.map((loc, i) => (
                <div 
                  key={`tact-${i}`}
                  onMouseEnter={() => setHoveredIp(loc.ip)}
                  onMouseLeave={() => setHoveredIp(null)}
                  className={`p-6 rounded-[2rem] border transition-all duration-300 ${hoveredIp === loc.ip ? 'bg-indigo-600/10 border-indigo-500/40 shadow-xl' : 'bg-white/[0.01] border-white/5 hover:bg-white/[0.03]'}`}
                >
                  <p className="text-sm font-mono font-black text-white mb-2">{loc.ip}</p>
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{loc.city || 'Unknown Node'}</p>
                </div>
              ))}
           </div>
        </div>
      </div>
    </div>
  );
};

export default GeoMap;
