import React, { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import Chatbot from "./Chatbot";
import { Info, X, ShieldCheck, AlertCircle } from "lucide-react";

const Layout = ({ children }) => {
  const [deviceInfo, setDeviceInfo] = useState({
    local_ip: "Detecting...",
    status: "Initializing",
  });
  const [showWelcome, setShowWelcome] = useState(true);

  useEffect(() => {
    fetch("/api/device-info")
      .then((res) => res.json())
      .then(setDeviceInfo)
      .catch(() => setDeviceInfo({ local_ip: "127.0.0.1", status: "Offline" }));

    // Hidden keyboard shortcut to reveal credits (Ctrl+Shift+A)
    const handleCreditsShortcut = (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === "A") {
        console.clear();
        console.log(
          "%c╔════════════════════════════════════════════════════════════╗",
          "color: #22c55e; font-weight: bold; font-size: 12px;",
        );
        console.log(
          "%c║                      NETWORK ANALYZER v2.1                 ║",
          "color: #22c55e; font-weight: bold; font-size: 12px;",
        );
        console.log(
          "%c║                   Developed by Ayush Chaudhary              ║",
          "color: #00d9ff; font-weight: bold; font-size: 12px;",
        );
        console.log(
          "%c║                                                            ║",
          "color: #22c55e; font-weight: bold; font-size: 12px;",
        );
        console.log(
          "%c║  GitHub: https://github.com/AyushChaudhary                ║",
          "color: #a3e635; font-weight: bold; font-size: 12px;",
        );
        console.log(
          "%c║  Project: Network Security Analysis Platform              ║",
          "color: #a3e635; font-weight: bold; font-size: 12px;",
        );
        console.log(
          "%c║                                                            ║",
          "color: #22c55e; font-weight: bold; font-size: 12px;",
        );
        console.log(
          "%c║  Real-Time Network Packet Inspection & Threat Detection   ║",
          "color: #06b6d4; font-weight: bold; font-size: 11px;",
        );
        console.log(
          "%c║  Deep Packet Analysis | Flow Monitoring | Security Alerts ║",
          "color: #06b6d4; font-weight: bold; font-size: 11px;",
        );
        console.log(
          "%c╚════════════════════════════════════════════════════════════╝",
          "color: #22c55e; font-weight: bold; font-size: 12px;",
        );
        console.log(
          "%c\n🔒 Credits Hidden - Press Ctrl+Shift+A to view again\n",
          "color: #22c55e; font-style: italic;",
        );
      }
    };

    window.addEventListener("keydown", handleCreditsShortcut);
    return () => window.removeEventListener("keydown", handleCreditsShortcut);
  }, []);

  return (
    <div className="flex h-screen bg-black text-green-400 overflow-hidden font-sans">
      <Sidebar />
      <Chatbot />

      {/* Main Container with Responsive Margin */}
      <main className="flex-1 lg:ml-64 overflow-y-auto custom-scrollbar flex flex-col">
        {/* Responsive Header */}
        <header className="h-20 bg-black/90 backdrop-blur-2xl border-b border-green-500/20 sticky top-0 z-40 flex items-center justify-between px-4 md:px-10 shrink-0">
          <div className="flex items-center space-x-3 md:space-x-4">
            <div
              className={`w-3 h-3 rounded-full shadow-[0_0_15px] ${deviceInfo.status === "Offline" ? "bg-red-500 shadow-red-500/50" : "bg-emerald-500 shadow-emerald-500/50 animate-pulse"}`}
            ></div>
            <div className="hidden sm:block">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                Capture Status
              </p>
              <p className="text-xs font-bold text-slate-200">
                {deviceInfo.status}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-4 md:space-x-8">
            <div className="text-right hidden xs:block">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                Network Interface
              </p>
              <p className="text-sm font-mono font-bold text-indigo-400">
                {deviceInfo.local_ip}
              </p>
            </div>
            <div className="h-8 w-[1px] bg-white/10 hidden xs:block"></div>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 border border-white/10 flex items-center justify-center font-black text-white shadow-lg shadow-indigo-500/20 transform rotate-3">
                SOC
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic Documentation Banner */}
        {showWelcome && (
          <div className="mx-4 md:mx-10 mt-6 p-6 bg-indigo-600/10 border border-indigo-500/30 rounded-[2rem] flex items-start justify-between animate-in slide-in-from-top-4 duration-500">
            <div className="flex gap-4">
              <div className="bg-indigo-600 p-2 rounded-xl h-fit">
                <Info className="text-white" size={20} />
              </div>
              <div>
                <h4 className="text-white font-black text-sm uppercase tracking-widest mb-1">
                  Getting Started with NetViz
                </h4>
                <p className="text-indigo-200/60 text-xs leading-relaxed max-w-2xl">
                  Welcome to your SOC Dashboard. If sections appear blank,
                  ensure the backend is running as{" "}
                  <strong>Administrator</strong>. This system captures real
                  packets from your network interface. Navigate using the
                  sidebar to explore deep packet inspection, threat mapping, and
                  protocol analysis.
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowWelcome(false)}
              className="text-indigo-400 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        )}

        {/* Content Area */}
        <div className="p-4 md:p-10 flex-1">
          <div className="max-w-[1600px] mx-auto">{children}</div>
        </div>

        {/* Global Footer / Documentation Trigger */}
        <footer className="p-6 text-center border-t border-white/5 opacity-40 hover:opacity-100 transition-opacity">
          <p className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.4em]">
            Real-Time Security Intelligence Framework v2.1
          </p>
          {/* Hidden Credit Attribution */}
          <div
            className="hidden"
            id="dev-credits"
            data-developer="AyushChaudhary"
            data-github="https://github.com/AyushChaudhary"
            data-project="network-analyzer-soc"
          >
            <p title="Developer: AyushChaudhary | https://github.com/AyushChaudhary | Press Ctrl+Shift+A to view credits">
              © 2026 Network Security Analysis Platform
            </p>
          </div>
        </footer>
      </main>

      {/* Persistent Error Overlay if Backend is down */}
      {deviceInfo.status === "Offline" && (
        <div className="fixed bottom-10 right-10 z-[100] animate-bounce">
          <div className="bg-red-600 text-white px-6 py-4 rounded-3xl shadow-2xl flex items-center space-x-4 border-2 border-red-400">
            <AlertCircle size={24} />
            <div>
              <p className="text-xs font-black uppercase">Engine Offline</p>
              <p className="text-[10px] font-bold opacity-80">
                Restart backend as Admin
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Layout;
