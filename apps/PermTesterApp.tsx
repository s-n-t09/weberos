import React, { useState } from 'react';
import { Camera, Mic, MapPin, Bell, ShieldCheck, ShieldAlert } from 'lucide-react';

export const PermTesterApp = () => {
    const [results, setResults] = useState<Record<string, string>>({});

    const testNotification = async () => {
        if (!('Notification' in window)) {
            setResults(prev => ({ ...prev, notifications: 'Not supported by browser' }));
            return;
        }
        try {
            const permission = await Notification.requestPermission();
            setResults(prev => ({ ...prev, notifications: permission }));
            if (permission === 'granted') {
                try {
                    if ('serviceWorker' in navigator) {
                        const registration = await navigator.serviceWorker.ready;
                        if (registration) {
                            await registration.showNotification('Permissions Tester', { body: 'Notifications are working!' });
                            return;
                        }
                    }
                    new Notification('Permissions Tester', { body: 'Notifications are working!' });
                } catch (err) {
                    throw err;
                }
            }
        } catch (e: any) {
            setResults(prev => ({ ...prev, notifications: `Error: ${e.message}` }));
        }
    };

    const testCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            setResults(prev => ({ ...prev, camera: 'granted' }));
            stream.getTracks().forEach(track => track.stop());
        } catch (e: any) {
            setResults(prev => ({ ...prev, camera: `Error: ${e.message}` }));
        }
    };

    const testMic = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            setResults(prev => ({ ...prev, microphone: 'granted' }));
            stream.getTracks().forEach(track => track.stop());
        } catch (e: any) {
            setResults(prev => ({ ...prev, microphone: `Error: ${e.message}` }));
        }
    };

    const testLocation = async () => {
        if (!('geolocation' in navigator)) {
            setResults(prev => ({ ...prev, location: 'Not supported by browser' }));
            return;
        }
        try {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    setResults(prev => ({ ...prev, location: 'granted' }));
                },
                (err) => {
                    setResults(prev => ({ ...prev, location: `Error: ${err.message}` }));
                }
            );
        } catch (e: any) {
            setResults(prev => ({ ...prev, location: `Error: ${e.message}` }));
        }
    };

    const renderStatus = (status: string | undefined) => {
        if (!status) return <span className="text-slate-500">Not tested</span>;
        if (status === 'granted') return <span className="text-green-500 flex items-center gap-1"><ShieldCheck size={16} /> Granted</span>;
        return <span className="text-red-500 flex items-center gap-1"><ShieldAlert size={16} /> {status}</span>;
    };

    return (
        <div className="h-full bg-slate-50 p-6 overflow-y-auto">
            <h1 className="text-2xl font-bold text-slate-900 mb-6">Permissions Tester</h1>
            <p className="text-slate-600 mb-8">Test your browser permissions to ensure WeberOS apps can function correctly.</p>

            <div className="space-y-4">
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-100 text-blue-600 rounded-lg"><Bell size={24} /></div>
                        <div>
                            <h3 className="font-bold text-slate-800">Notifications</h3>
                            <div className="text-sm">{renderStatus(results.notifications)}</div>
                        </div>
                    </div>
                    <button onClick={testNotification} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-medium rounded-lg transition">Test</button>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-emerald-100 text-emerald-600 rounded-lg"><Camera size={24} /></div>
                        <div>
                            <h3 className="font-bold text-slate-800">Camera</h3>
                            <div className="text-sm">{renderStatus(results.camera)}</div>
                        </div>
                    </div>
                    <button onClick={testCamera} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-medium rounded-lg transition">Test</button>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-purple-100 text-purple-600 rounded-lg"><Mic size={24} /></div>
                        <div>
                            <h3 className="font-bold text-slate-800">Microphone</h3>
                            <div className="text-sm">{renderStatus(results.microphone)}</div>
                        </div>
                    </div>
                    <button onClick={testMic} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-medium rounded-lg transition">Test</button>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-orange-100 text-orange-600 rounded-lg"><MapPin size={24} /></div>
                        <div>
                            <h3 className="font-bold text-slate-800">Location</h3>
                            <div className="text-sm">{renderStatus(results.location)}</div>
                        </div>
                    </div>
                    <button onClick={testLocation} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-medium rounded-lg transition">Test</button>
                </div>
            </div>
        </div>
    );
};
