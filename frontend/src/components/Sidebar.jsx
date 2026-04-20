import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Activity,
  PieChart,
  Users,
  ShieldAlert,
  Globe,
  Settings,
  ShieldCheck,
  Zap,
  Menu,
  X,
  FileSearch,
} from "lucide-react";

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    { name: "Overview", icon: <LayoutDashboard size={20} />, path: "/" },
    {
      name: "Live Packets",
      icon: <Activity size={20} />,
      path: "/live-packets",
    },
    {
      name: "Protocol Analysis",
      icon: <PieChart size={20} />,
      path: "/protocols",
    },
    { name: "Top Talkers", icon: <Users size={20} />, path: "/top-talkers" },
    {
      name: "Security Alerts",
      icon: <ShieldAlert size={20} />,
      path: "/alerts",
    },
    { name: "Geo Map", icon: <Globe size={20} />, path: "/geo-map" },
    {
      name: "Forensic Audit",
      icon: <FileSearch size={20} />,
      path: "/audit-report",
    },
  ];

  const toggleSidebar = () => setIsOpen(!isOpen);

  return (
    <>
      {/* Mobile Burger Menu */}
      <button
        onClick={toggleSidebar}
        className="lg:hidden fixed top-6 left-6 z-[60] p-3 bg-indigo-600 rounded-2xl text-white shadow-lg"
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Sidebar Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[50] lg:hidden"
          onClick={() => setIsOpen(false)}
        ></div>
      )}

      <div
        className={`
      className="w-64 h-screen bg-black border-r border-green-500/20 flex flex-col fixed left-0 top-0 z-[55] shadow-[20px_0_50px_rgba(0,0,0,0.3)]"
        transition-transform duration-300 ease-in-out
        ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}
      >
        <div className="p-8 flex items-center space-x-4">
          <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(79,70,229,0.4)]">
            <ShieldCheck className="text-white w-6 h-6" />
          </div>
          <div>
            <span className="text-xl font-black text-white tracking-tighter block">
              NetViz
            </span>
            <span className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em] block">
              Command
            </span>
          </div>
        </div>

        <nav className="flex-1 px-4 mt-8 overflow-y-auto custom-scrollbar">
          <div className="px-4 mb-6">
            <p className="text-[10px] text-slate-600 font-black uppercase tracking-[0.2em] flex items-center gap-2">
              <Zap size={10} className="text-indigo-500" />
              Intelligence
            </p>
          </div>
          <div className="space-y-2">
            {menuItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setIsOpen(false)}
                className={({ isActive }) =>
                  `flex items-center space-x-4 px-5 py-4 rounded-2xl transition-all duration-300 group ${
                    isActive
                      ? "bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-lg shadow-indigo-600/20"
                      : "text-slate-500 hover:bg-white/[0.03] hover:text-slate-200"
                  }`
                }
              >
                <div
                  className={`transition-transform duration-300 group-hover:scale-110`}
                >
                  {item.icon}
                </div>
                <span className="font-black text-xs uppercase tracking-widest">
                  {item.name}
                </span>
              </NavLink>
            ))}
          </div>
        </nav>

        <div className="p-6 border-t border-white/5 space-y-4">
          <NavLink
            to="/settings"
            onClick={() => setIsOpen(false)}
            className={({ isActive }) =>
              `flex items-center space-x-3 w-full px-5 py-3 rounded-2xl transition-all ${
                isActive
                  ? "bg-indigo-600 text-white"
                  : "text-slate-500 hover:bg-white/[0.02] hover:text-white"
              }`
            }
          >
            <Settings size={20} />
            <span className="font-black text-xs uppercase tracking-widest">
              Settings
            </span>
          </NavLink>

          <div className="bg-slate-900/50 p-4 rounded-2xl border border-white/5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                Engine
              </span>
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
            </div>
            <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-indigo-500 w-[75%] rounded-full"></div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
