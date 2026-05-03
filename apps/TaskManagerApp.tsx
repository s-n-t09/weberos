import React, { useState, useEffect } from 'react';
import { Activity, Server, Cpu, MemoryStick, XCircle } from 'lucide-react';
import { WindowState } from '../types';

interface TaskManagerAppProps {
    windows: WindowState[];
    closeWindow: (id: string) => void;
}

export const TaskManagerApp = ({ windows, closeWindow }: TaskManagerAppProps) => {
    const [currentTime, setCurrentTime] = useState(Date.now());

    useEffect(() => {
        const interval = setInterval(() => setCurrentTime(Date.now()), 1000);
        return () => clearInterval(interval);
    }, []);

    const processList = windows.map(win => {
        const memoryMB = Math.floor(Math.random() * 2) + 2; // 2-3 MB mock usage
        const cpuUsage = Math.floor(Math.random() * 5); // Mock CPU usage
        return {
            id: win.id,
            pid: win.id.substring(0, 4).toUpperCase(),
            appId: win.appId,
            title: win.title,
            memory: memoryMB,
            cpu: cpuUsage
        };
    });

    const totalMemory = processList.reduce((acc, p) => acc + p.memory, 0) + 10; // Base OS usage + apps
    const totalCPU = processList.reduce((acc, p) => acc + p.cpu, 0) + 5;

    return (
        <div className="h-full bg-slate-50 flex flex-col font-sans">
            <div className="bg-white border-b border-slate-200 p-4">
                <div className="flex gap-4">
                    <div className="flex-1 bg-blue-50 p-3 rounded-lg border border-blue-100 flex items-center gap-3">
                        <Cpu className="text-blue-500" />
                        <div>
                            <div className="text-xs text-slate-500 font-semibold uppercase">CPU Usage</div>
                            <div className="text-xl font-bold text-slate-800">{totalCPU}%</div>
                        </div>
                    </div>
                    <div className="flex-1 bg-emerald-50 p-3 rounded-lg border border-emerald-100 flex items-center gap-3">
                        <MemoryStick className="text-emerald-500" />
                        <div>
                            <div className="text-xs text-slate-500 font-semibold uppercase">Memory</div>
                            <div className="text-xl font-bold text-slate-800">{totalMemory} MB</div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-auto">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-100 text-slate-500 text-xs uppercase font-semibold sticky top-0">
                        <tr>
                            <th className="py-2 px-4 border-b">PID</th>
                            <th className="py-2 px-4 border-b">Process Name</th>
                            <th className="py-2 px-4 border-b">Status</th>
                            <th className="py-2 px-4 border-b">Memory</th>
                            <th className="py-2 px-4 border-b">CPU</th>
                            <th className="py-2 px-4 border-b text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr className="border-b hover:bg-slate-50 transition-colors">
                            <td className="py-3 px-4 font-mono text-xs text-slate-500">SYS1</td>
                            <td className="py-3 px-4 flex items-center gap-2">
                                <Server size={16} className="text-slate-400" />
                                <span className="font-medium text-slate-700">WeberOS System</span>
                            </td>
                            <td className="py-3 px-4 text-emerald-600 text-xs font-semibold">Running</td>
                            <td className="py-3 px-4 text-slate-600 text-sm">10 MB</td>
                            <td className="py-3 px-4 text-slate-600 text-sm">5%</td>
                            <td className="py-3 px-4 text-right"></td>
                        </tr>
                        {processList.map(proc => (
                            <tr key={proc.id} className="border-b hover:bg-slate-50 transition-colors group">
                                <td className="py-3 px-4 font-mono text-xs text-slate-500">{proc.pid}</td>
                                <td className="py-3 px-4 flex items-center gap-2">
                                    <Activity size={16} className="text-blue-500" />
                                    <span className="font-medium text-slate-700">{proc.title}</span>
                                </td>
                                <td className="py-3 px-4 text-emerald-600 text-xs font-semibold">Running</td>
                                <td className="py-3 px-4 text-slate-600 text-sm">{proc.memory} MB</td>
                                <td className="py-3 px-4 text-slate-600 text-sm">{proc.cpu}%</td>
                                <td className="py-3 px-4 text-right">
                                    <button 
                                        onClick={() => closeWindow(proc.id)}
                                        className="text-red-500 hover:text-white hover:bg-red-500 border border-transparent hover:border-red-600 py-1 px-2 rounded flex items-center gap-1 ml-auto text-xs font-semibold transition"
                                    >
                                        <XCircle size={14} /> End Task
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {processList.length === 0 && (
                            <tr>
                                <td colSpan={6} className="text-center py-8 text-slate-400">
                                    No active user processes.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
