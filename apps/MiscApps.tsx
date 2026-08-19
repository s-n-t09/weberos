import React, { useState, useEffect, useRef, useMemo, Component } from 'react';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, MapPin, MoreVertical, Search, CloudSun, RefreshCw, ShieldAlert, Camera, Mic, Bell } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { normalizeManifest, normalizePermission } from '../utils/manifest';
import { resolvePath, cloneFileSystem } from '../utils/fs';
import { USER_HOME_PATH } from '../utils/constants';

const evaluateExpression = (expression: string): number => {
    const tokens = expression.match(/\d*\.?\d+|[+\-*/]/g);
    if (!tokens || tokens.join('') !== expression.replace(/\s+/g, '')) throw new Error('Invalid expression');
    let index = 0;
    const parseFactor = (): number => {
        if (tokens[index] === '-') {
            index += 1;
            return -parseFactor();
        }
        const value = Number(tokens[index++]);
        if (!Number.isFinite(value)) throw new Error('Invalid number');
        return value;
    };
    const parseTerm = (): number => {
        let value = parseFactor();
        while (tokens[index] === '*' || tokens[index] === '/') {
            const operator = tokens[index++];
            const right = parseFactor();
            if (operator === '/' && right === 0) throw new Error('Cannot divide by zero');
            value = operator === '*' ? value * right : value / right;
        }
        return value;
    };
    let value = parseTerm();
    while (tokens[index] === '+' || tokens[index] === '-') {
        const operator = tokens[index++];
        const right = parseTerm();
        value = operator === '+' ? value + right : value - right;
    }
    if (index !== tokens.length || !Number.isFinite(value)) throw new Error('Invalid expression');
    return value;
};

export const CalcoApp = ({ user }: any) => {
    const [display, setDisplay] = useState('0');
    const [equation, setEquation] = useState('');
    const handleBtn = (val: string) => {
        if (val === 'C') { setDisplay('0'); setEquation(''); } 
        else if (val === '=') { try { setDisplay(String(evaluateExpression(equation + display))); setEquation(''); } catch { setDisplay('Error'); } }
        else if (['+', '-', '*', '/'].includes(val)) { setEquation(equation + display + val); setDisplay('0'); } 
        else setDisplay(display === '0' ? val : display + val);
    };
    const btns = ['7','8','9','/','4','5','6','*','1','2','3','-','0','.','=','+','C'];
    return (
        <div className={`h-full flex flex-col p-4 transition-colors bg-gray-900 text-white`}>
            <div className={`p-4 rounded mb-4 text-right transition-colors bg-gray-800`}>
                <div className="text-gray-400 text-sm h-5">{equation}</div>
                <div className="text-3xl font-mono truncate">{display}</div>
            </div>
            <div className="grid grid-cols-4 gap-2 flex-1">
                {btns.map(b => (
                    <button key={b} onClick={() => handleBtn(b)} className={`rounded font-bold text-xl hover:bg-opacity-80 transition ${b === '=' ? 'col-span-2 bg-orange-500 text-white' : b === 'C' ? 'col-span-4 bg-red-500 text-white' : 'bg-gray-700'}`}>{b}</button>
                ))}
            </div>
        </div>
    );
};

export const WeatherApp = ({ user, setUser }: any) => {
    const [weather, setWeather] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [configMode, setConfigMode] = useState(false);
    const [searchCity, setSearchCity] = useState('');
    const config = user.settings.weather || { mode: 'auto' };

    const fetchWeather = async (lat: number, lon: number, city?: string) => {
        setLoading(true);
        try {
            const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&daily=temperature_2m_max,temperature_2m_min&timezone=auto`);
            const data = await res.json();
            setWeather({ ...data.current_weather, city: city || 'Unknown Location' });
        } catch (e) {
            console.error(e);
        }
        setLoading(false);
    };

    useEffect(() => {
        if (config.mode === 'auto') {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    (pos) => fetchWeather(pos.coords.latitude, pos.coords.longitude, 'Your Location'),
                    () => fetchWeather(37.7749, -122.4194, 'San Francisco (Default)')
                );
            } else {
                 fetchWeather(37.7749, -122.4194, 'San Francisco (Default)');
            }
        } else if (config.lat && config.lon) {
            fetchWeather(config.lat, config.lon, config.city);
        }
    }, [config]);

    const handleSaveConfig = () => {
        // In a real app, you'd geocode the searchCity here.
        // For simplicity, we'll just set it to manual mode with dummy coords if they typed something,
        // or back to auto.
        const newConfig = searchCity ? { mode: 'manual', city: searchCity, lat: 51.5074, lon: -0.1278 } : { mode: 'auto' };
        setUser({ ...user, settings: { ...user.settings, weather: newConfig } });
        setConfigMode(false);
    };

    if (configMode) {
        return (
            <div className={`h-full p-6 flex flex-col items-center justify-center relative transition-colors bg-slate-900 text-white`}>
                <h2 className="text-2xl font-bold mb-4">Weather Settings</h2>
                <div className="w-full max-w-xs space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">City (Leave blank for Auto)</label>
                        <input 
                            type="text" 
                            value={searchCity} 
                            onChange={e => setSearchCity(e.target.value)}
                            placeholder="e.g. London"
                            className="w-full p-2 rounded bg-slate-800 border border-slate-700 text-white"
                        />
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => setConfigMode(false)} className="flex-1 p-2 rounded bg-slate-700 hover:bg-slate-600">Cancel</button>
                        <button onClick={handleSaveConfig} className="flex-1 p-2 rounded bg-blue-600 hover:bg-blue-500">Save</button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={`h-full p-6 flex flex-col items-center justify-center relative transition-colors bg-gradient-to-br from-blue-900 to-slate-900 text-white`}>
            <button onClick={() => setConfigMode(true)} className={`absolute top-4 right-4 p-2 rounded-full transition hover:bg-white/20`}><MoreVertical size={20} /></button>
            {loading ? <RefreshCw className="animate-spin" /> : (
                <>
                    <div className="text-xl font-light mb-8 flex items-center gap-2"><MapPin size={16} /> {weather?.city}</div>
                    <CloudSun size={84} className={`mb-4 drop-shadow-lg text-yellow-300`} />
                    <div className="text-6xl font-bold mb-2">{weather?.temperature}°</div>
                    <div className="text-lg opacity-90">Wind: {weather?.windspeed} km/h</div>
                </>
            )}
        </div>
    );
};

class ErrorBoundary extends React.Component<{children: React.ReactNode, key?: any}, {hasError: boolean, error: any}> {
    state = { hasError: false, error: null };
    constructor(props: {children: React.ReactNode, key?: any}) {
        super(props);
    }
    static getDerivedStateFromError(error: any) {
        return { hasError: true, error };
    }
    componentDidCatch(error: any, errorInfo: any) {
        console.error("App Error:", error, errorInfo);
    }
    render() {
        // @ts-ignore
        if (this.state.hasError) {
            return (
                <div className="h-full p-6 flex flex-col items-center justify-center bg-red-950 text-red-200">
                    <ShieldAlert size={48} className="mb-4" />
                    <h2 className="text-xl font-bold mb-2">App Crashed</h2>
                    <pre className="p-4 rounded text-xs w-full overflow-auto max-h-40 font-mono bg-red-900/50">
                        {/* @ts-ignore */}
                        {this.state.error?.toString()}
                    </pre>
                    <button 
                        className="mt-4 px-4 py-2 bg-red-800 hover:bg-red-700 rounded text-white"
                        // @ts-ignore
                        onClick={() => this.setState({hasError: false, error: null})}
                    >
                        Try Again
                    </button>
                </div>
            );
        }
        // @ts-ignore
        return this.props.children;
    }
}

export const DynamicAppRuntime = ({ app, user, onNotify, fs, setFs, openFilePicker, openFileSaver }: { app: any, user: any, onNotify: any, fs?: any, setFs?: any, openFilePicker?: any, openFileSaver?: any }) => {
    const [error, setError] = useState<any>(null);
    const runtimeManifest = useMemo(() => {
        try {
            return normalizeManifest(app);
        } catch (manifestError) {
            return { error: manifestError instanceof Error ? manifestError.message : 'Invalid app manifest.' };
        }
    }, [app]);

    const checkPermission = (perm: string) => {
        if ('error' in runtimeManifest) return false;
        return runtimeManifest.permissions.some(value => normalizePermission(value) === normalizePermission(perm));
    };

    const Sys = {
        notify: (title: string, msg: string) => {
            if (checkPermission('notifications')) onNotify(app.id, title, msg);
            else console.warn(`App ${app.name} lacks 'notifications' permission.`);
        },
        requestCamera: async () => {
            if (!checkPermission('camera')) throw new Error("Permission 'camera' not declared in app manifest.");
            return navigator.mediaDevices.getUserMedia({ video: true });
        },
        requestMic: async () => {
            if (!checkPermission('microphone')) throw new Error("Permission 'microphone' not declared in app manifest.");
            return navigator.mediaDevices.getUserMedia({ audio: true });
        },
        getLocation: async () => {
            if (!checkPermission('geolocation')) throw new Error("Permission 'geolocation' not declared in app manifest.");
            return new Promise((res, rej) => navigator.geolocation.getCurrentPosition(res, rej));
        },
        fs: {
            readFile: (path: string) => {
                if (!checkPermission('filesystem')) throw new Error("Permission 'filesystem' not declared in app manifest.");
                if (!fs) throw new Error("File system not available.");
                const { node } = resolvePath(fs, USER_HOME_PATH, path);
                if (!node || node.type !== 'file') throw new Error(`File not found: ${path}`);
                return node.content || '';
            },
            writeFile: (path: string, content: string) => {
                if (!checkPermission('filesystem')) throw new Error("Permission 'filesystem' not declared in app manifest.");
                if (!fs || !setFs) throw new Error("File system not available.");
                const next = cloneFileSystem(fs);
                const { parent, name } = resolvePath(next, USER_HOME_PATH, path);
                if (!parent || parent.type !== 'dir') throw new Error(`Directory not found: ${path}`);
                parent.children = parent.children || {};
                parent.children[name] = { type: 'file', content };
                setFs(next);
            },
            openFilePicker: () => {
                if (!checkPermission('filesystem')) throw new Error("Permission 'filesystem' not declared in app manifest.");
                if (!openFilePicker) throw new Error("File picker not available.");
                return new Promise(resolve => openFilePicker(resolve));
            },
            openFileSaver: () => {
                if (!checkPermission('filesystem')) throw new Error("Permission 'filesystem' not declared in app manifest.");
                if (!openFileSaver) throw new Error("File saver not available.");
                return new Promise(resolve => openFileSaver(resolve));
            }
        }
    };

    const Component = useMemo(() => {
        try {
            if ('error' in runtimeManifest) throw new Error(runtimeManifest.error);
            const codeString = Array.isArray(runtimeManifest.code) ? runtimeManifest.code.join('\n') : runtimeManifest.code;
            const func = new Function('React', 'LucideIcons', 'Sys', codeString);
            const res = func(React, LucideIcons, Sys);
            if (typeof res === 'function') {
                return res;
            }
            return () => res;
        } catch (e: any) {
            return () => (
                <div className={`h-full p-6 flex flex-col items-center justify-center bg-red-950 text-red-200`}>
                    <ShieldAlert size={48} className="mb-4" />
                    <h2 className="text-xl font-bold mb-2">Runtime Error</h2>
                    <pre className={`p-4 rounded text-xs w-full overflow-auto max-h-40 font-mono bg-red-900/50`}>{e.toString()}</pre>
                </div>
            );
        }
    }, [runtimeManifest]);

    if ('error' in runtimeManifest) {
        return (
            <div className="h-full p-6 flex flex-col items-center justify-center bg-red-950 text-red-200">
                <ShieldAlert size={48} className="mb-4" />
                <h2 className="text-xl font-bold mb-2">Invalid App Manifest</h2>
                <p className="text-sm text-center max-w-md">{runtimeManifest.error}</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className={`h-full p-6 flex flex-col items-center justify-center bg-red-950 text-red-200`}>
                <ShieldAlert size={48} className="mb-4" />
                <h2 className="text-xl font-bold mb-2">Runtime Error</h2>
                <pre className={`p-4 rounded text-xs w-full overflow-auto max-h-40 font-mono bg-red-900/50`}>{error.toString()}</pre>
            </div>
        );
    }

    const legacyOnNotify = (appId: string, title: string, msg: string) => {
        if (checkPermission('notifications')) onNotify(app.id, title, msg);
        else console.warn(`App ${app.name} lacks 'notifications' permission.`);
    };

    return (
        <div className="h-full relative overflow-hidden">
            {/* Permission Indicator Bar */}
            <div className="absolute top-0 right-0 p-1 flex gap-1 z-50 opacity-50 hover:opacity-100 transition">
                {checkPermission('camera') && <Camera size={12} className="text-blue-500" />}
                {checkPermission('microphone') && <Mic size={12} className="text-blue-500" />}
                {checkPermission('notifications') && <Bell size={12} className="text-blue-500" />}
                {checkPermission('geolocation') && <MapPin size={12} className="text-blue-500" />}
            </div>
            {Component && (
                <ErrorBoundary key={app.code}>
                    <Component onNotify={legacyOnNotify} />
                </ErrorBoundary>
            )}
        </div>
    );
};
