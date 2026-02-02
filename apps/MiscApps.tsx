import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, MapPin, MoreVertical, Search, CloudSun, RefreshCw, ShieldAlert, Camera, Mic, Bell } from 'lucide-react';
import * as LucideIcons from 'lucide-react';

export const SnakeApp = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [score, setScore] = useState(0);
    const [gameOver, setGameOver] = useState(false);
    const directionRef = useRef({ dx: 1, dy: 0 });
    const startedRef = useRef(false);

    const handleDir = (x: number, y: number) => {
        if (!startedRef.current) startedRef.current = true;
        const { dx, dy } = directionRef.current;
        if (x !== 0 && dx !== 0) return;
        if (y !== 0 && dy !== 0) return;
        directionRef.current = { dx: x, dy: y };
    };

    useEffect(() => {
        const canvas = canvasRef.current;
        if(!canvas) return;
        const ctx = canvas.getContext('2d');
        if(!ctx) return;

        let snake = [{x: 10, y: 10}, {x: 9, y: 10}]; 
        let food = {x: 15, y: 15};
        let interval: any;

        const draw = () => {
            if(!ctx) return;
            ctx.fillStyle = '#111';
            ctx.fillRect(0, 0, 400, 400);
            ctx.fillStyle = '#ff4444';
            ctx.fillRect(food.x * 20, food.y * 20, 18, 18);
            ctx.fillStyle = '#44ff44';
            snake.forEach(part => ctx.fillRect(part.x * 20, part.y * 20, 18, 18));
            
            if (!startedRef.current || gameOver) return;

            const { dx, dy } = directionRef.current;
            const head = {x: snake[0].x + dx, y: snake[0].y + dy};
            
            if(head.x < 0 || head.x >= 20 || head.y < 0 || head.y >= 20 || snake.some(s => s.x === head.x && s.y === head.y)) {
                setGameOver(true);
                clearInterval(interval);
                return;
            }
            
            snake.unshift(head);
            if(head.x === food.x && head.y === food.y) {
                setScore(s => s + 1);
                let newFood;
                do {
                    newFood = { x: Math.floor(Math.random() * 20), y: Math.floor(Math.random() * 20) };
                } while (snake.some(s => s.x === newFood.x && s.y === newFood.y));
                food = newFood;
            } else snake.pop();
        };

        const handleKey = (e: KeyboardEvent) => {
            if(e.key === 'ArrowUp') handleDir(0, -1);
            if(e.key === 'ArrowDown') handleDir(0, 1);
            if(e.key === 'ArrowLeft') handleDir(-1, 0);
            if(e.key === 'ArrowRight') handleDir(1, 0);
        };

        window.addEventListener('keydown', handleKey);
        draw();
        interval = setInterval(draw, 100);
        return () => { window.removeEventListener('keydown', handleKey); clearInterval(interval); };
    }, [gameOver]);

    return (
        <div className="flex flex-col items-center justify-center h-full bg-black text-white p-4">
            <div className="mb-2 flex justify-between w-[300px] md:w-[400px]"><span>Snake</span><span>Score: {score}</span></div>
            <canvas ref={canvasRef} width={400} height={400} className="w-[300px] h-[300px] md:w-[400px] md:h-[400px] border border-gray-700 bg-[#111]" />
            {gameOver ? (
                 <div className="mt-2 text-red-500 font-bold">GAME OVER</div>
            ) : (
                 <div className="mt-2 text-slate-500 text-xs">{!startedRef.current ? 'Press any arrow key to start' : 'Playing...'}</div>
            )}
        </div>
    );
};

export const CalcoApp = () => {
    const [display, setDisplay] = useState('0');
    const [equation, setEquation] = useState('');
    const handleBtn = (val: string) => {
        if (val === 'C') { setDisplay('0'); setEquation(''); } 
        else if (val === '=') { try { setDisplay(String(eval(equation + display))); setEquation(''); } catch { setDisplay('Error'); } } 
        else if (['+', '-', '*', '/'].includes(val)) { setEquation(equation + display + val); setDisplay('0'); } 
        else setDisplay(display === '0' ? val : display + val);
    };
    const btns = ['7','8','9','/','4','5','6','*','1','2','3','-','0','.','=','+','C'];
    return (
        <div className="h-full flex flex-col bg-gray-900 text-white p-4">
            <div className="bg-gray-800 p-4 rounded mb-4 text-right">
                <div className="text-gray-400 text-sm h-5">{equation}</div>
                <div className="text-3xl font-mono truncate">{display}</div>
            </div>
            <div className="grid grid-cols-4 gap-2 flex-1">
                {btns.map(b => (
                    <button key={b} onClick={() => handleBtn(b)} className={`rounded font-bold text-xl hover:bg-opacity-80 transition ${b === '=' ? 'col-span-2 bg-orange-500' : b === 'C' ? 'col-span-4 bg-red-500' : 'bg-gray-700'}`}>{b}</button>
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

    return (
        <div className="h-full bg-gradient-to-br from-blue-500 to-sky-700 text-white p-6 flex flex-col items-center justify-center relative">
            <button onClick={() => setConfigMode(true)} className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/20 transition"><MoreVertical size={20} /></button>
            {loading ? <RefreshCw className="animate-spin" /> : (
                <>
                    <div className="text-xl font-light mb-8 flex items-center gap-2"><MapPin size={16} /> {weather?.city}</div>
                    <CloudSun size={84} className="mb-4 text-yellow-300 drop-shadow-lg" />
                    <div className="text-6xl font-bold mb-2">{weather?.temperature}°</div>
                    <div className="text-lg opacity-90">Wind: {weather?.windspeed} km/h</div>
                </>
            )}
        </div>
    );
};

export const DynamicAppRuntime = ({ app, onNotify }: { app: any, onNotify: any }) => {
    const [error, setError] = useState<any>(null);
    const [permissionsStatus, setPermissionsStatus] = useState<Record<string, boolean>>({});

    const checkPermission = (perm: string) => {
        return (app.permissions || []).includes(perm);
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
        }
    };

    const Component = useMemo(() => {
        try {
            const func = new Function('React', 'LucideIcons', 'Sys', app.code);
            return func(React, LucideIcons, Sys);
        } catch (e) {
            setError(e);
            return null;
        }
    }, [app.code]);

    if (error) {
        return (
            <div className="h-full bg-red-50 p-6 flex flex-col items-center justify-center text-red-800">
                <ShieldAlert size={48} className="mb-4" />
                <h2 className="text-xl font-bold mb-2">Runtime Error</h2>
                <pre className="bg-red-100 p-4 rounded text-xs w-full overflow-auto max-h-40 font-mono">{error.toString()}</pre>
            </div>
        );
    }

    return (
        <div className="h-full relative overflow-hidden">
            {/* Permission Indicator Bar */}
            <div className="absolute top-0 right-0 p-1 flex gap-1 z-50 opacity-50 hover:opacity-100 transition">
                {checkPermission('camera') && <Camera size={12} className="text-blue-500" />}
                {checkPermission('microphone') && <Mic size={12} className="text-blue-500" />}
                {checkPermission('notifications') && <Bell size={12} className="text-blue-500" />}
                {checkPermission('geolocation') && <MapPin size={12} className="text-blue-500" />}
            </div>
            {Component && <Component />}
        </div>
    );
};
