import React, { useState, useEffect, useRef } from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  getPaginationRowModel,
  getFilteredRowModel,
} from "@tanstack/react-table";
import {
  Activity,
  Search,
  Shield,
  ArrowDown,
  ArrowUp,
  Info,
  Zap,
} from "lucide-react";
import { WS_BASE_URL } from "../config";

const LivePackets = () => {
  const [packets, setPackets] = useState([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [isPaused, setIsPaused] = useState(false);
  const [shareStatus, setShareStatus] = useState("");
  const ws = useRef(null);

  const copyShareLink = async () => {
    try {
      const link = `${window.location.origin}/live-packets`;
      await navigator.clipboard.writeText(link);
      setShareStatus("Live stream URL copied!");
      setTimeout(() => setShareStatus(""), 2500);
    } catch (error) {
      setShareStatus("Unable to copy link.");
      setTimeout(() => setShareStatus(""), 2500);
    }
  };

  useEffect(() => {
    ws.current = new WebSocket(`${WS_BASE_URL}/live-packets`);

    ws.current.onmessage = (event) => {
      if (isPaused) return;
      const message = JSON.parse(event.data);
      if (message.type === "packet") {
        setPackets((prev) => [message.data, ...prev].slice(0, 100));
      }
    };

    return () => ws.current?.close();
  }, [isPaused]);

  const columns = [
    {
      header: "Time",
      accessorKey: "timestamp",
      cell: (info) => new Date(info.getValue()).toLocaleTimeString(),
    },
    { header: "Source", accessorKey: "src_ip" },
    { header: "Destination", accessorKey: "dst_ip" },
    { header: "Protocol", accessorKey: "protocol" },
    {
      header: "Size",
      accessorKey: "size",
      cell: (info) => `${info.getValue()} B`,
    },
    { header: "S.Port", accessorKey: "src_port" },
    { header: "D.Port", accessorKey: "dst_port" },
  ];

  const table = useReactTable({
    data: packets,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: { globalFilter },
    onGlobalFilterChange: setGlobalFilter,
  });

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center space-x-6">
          <div className="w-16 h-16 bg-indigo-600/20 rounded-2xl flex items-center justify-center border border-indigo-500/30 shadow-[0_0_30px_rgba(79,70,229,0.2)]">
            <Activity className="text-indigo-400" size={32} />
          </div>
          <div>
            <h1 className="text-4xl font-black text-white tracking-tighter uppercase">
              Packet Stream
            </h1>
            <p className="text-slate-500 text-sm font-bold flex items-center gap-2 uppercase tracking-widest">
              Real-Time Traffic Forensics
            </p>
          </div>
        </div>

        {/* Documentation Section */}
        <div className="max-w-md bg-white/[0.03] border border-white/10 p-5 rounded-3xl flex gap-4">
          <div className="bg-indigo-600/20 p-2 rounded-xl h-fit mt-1">
            <Info size={16} className="text-indigo-400" />
          </div>
          <div>
            <p className="text-[10px] font-black text-white uppercase tracking-widest mb-1">
              Section Summary
            </p>
            <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
              The Live Packet Inspector is a{" "}
              <strong>Deep Packet Inspection (DPI)</strong> tool. It shows every
              raw connection happening on your network. Use the search bar to
              filter by IP or Port.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-black p-8 rounded-[2.5rem] border border-green-500/20 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row justify-between gap-4 mb-8">
          <div className="relative flex-1 group">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-green-600 group-hover:text-lime-400 transition-colors"
              size={18}
            />
            <input
              type="text"
              placeholder="Search IPs, Protocols, Ports..."
              className="w-full bg-black border border-green-500/20 rounded-2xl py-4 pl-12 pr-6 text-sm text-white focus:border-lime-500 transition-all outline-none"
              value={globalFilter ?? ""}
              onChange={(e) => setGlobalFilter(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-3 md:flex-row">
            <button
              onClick={() => setIsPaused(!isPaused)}
              className={`px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-widest transition-all ${
                isPaused
                  ? "bg-lime-600 text-white shadow-lg shadow-lime-600/40"
                  : "bg-slate-900 text-green-600"
              }`}
            >
              {isPaused ? "Resume Stream" : "Pause Stream"}
            </button>
            <button
              onClick={copyShareLink}
              className="px-8 py-4 rounded-2xl bg-cyan-600 text-white font-black uppercase text-xs tracking-widest transition-all hover:bg-cyan-500"
            >
              Share Stream
            </button>
          </div>
          {shareStatus && (
            <p className="text-xs text-cyan-400 mt-2">{shareStatus}</p>
          )}
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left">
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id} className="border-b border-white/5">
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="pb-6 pt-2 px-4 text-[10px] font-black text-slate-500 uppercase tracking-widest"
                    >
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-white/[0.02] hover:bg-white/[0.02] transition-colors group"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className="py-5 px-4 text-xs font-bold text-slate-300 group-hover:text-white transition-colors"
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default LivePackets;
