import React, { useState, useEffect } from 'react';
import { Package, CheckCircle, XCircle, AlertTriangle, ShieldAlert } from 'lucide-react';
import { UserProfile, FileSystemNode } from '../types';
import { osAlert } from '../components/DialogHost';

interface InstallerAppProps {
    fs: FileSystemNode;
    launchData?: any;
    user: UserProfile;
    setUser: (u: UserProfile) => void;
    onNotify?: (appId: string, title: string, message: string) => void;
    closeWindow?: () => void;
}

export const InstallerApp = ({ fs, launchData, user, setUser, onNotify, closeWindow }: InstallerAppProps) => {
    const [pkgData, setPkgData] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [status, setStatus] = useState<'idle' | 'installing' | 'success'>('idle');

    useEffect(() => {
        if (launchData?.file) {
            const pathParts = launchData.file.split('/').filter(Boolean);
            let current: any = fs;
            for (const part of pathParts) {
                if (current && current.type === 'dir' && current.children[part]) {
                    current = current.children[part];
                } else {
                    current = null;
                    break;
                }
            }

            if (current && current.type === 'file' && current.content) {
                try {
                    const parsed = JSON.parse(current.content);
                    if (parsed.id && parsed.name && parsed.code) {
                        setPkgData(parsed);
                    } else {
                        setError('Invalid package format. Missing id, name, or code.');
                    }
                } catch (e) {
                    setError('Failed to parse package file. Ensure it is valid JSON.');
                }
            } else {
                setError('Could not read package file.');
            }
        } else {
            setError('No package file specified.');
        }
    }, [launchData, fs]);

    const handleInstall = async () => {
        if (!pkgData) return;
        setStatus('installing');

        try {
            // Simulate a brief installation delay for UX
            await new Promise(resolve => setTimeout(resolve, 1000));

            const newCustomApps = { 
                ...user.customApps, 
                [pkgData.id]: { 
                    id: pkgData.id, 
                    name: pkgData.name, 
                    iconName: pkgData.icon || 'Box', 
                    version: pkgData.version,
                    code: pkgData.code, 
                    permissions: pkgData.permissions || [] 
                }
            };
            const isUpgrade = user.installedPackages.includes(pkgData.id);
            const newPkgs = isUpgrade 
                ? user.installedPackages 
                : [...user.installedPackages, pkgData.id];
            
            setUser({...user, installedPackages: newPkgs, customApps: newCustomApps});
            
            if (onNotify) {
                onNotify('installer', isUpgrade ? 'Upgrade Complete' : 'Installation Complete', `${pkgData.name} was successfully ${isUpgrade ? 'upgraded' : 'installed'}.`);
            }
            
            setStatus('success');
        } catch (e) {
            setError('An error occurred during installation.');
            setStatus('idle');
        }
    };

    if (error) {
        return (
            <div className="h-full flex flex-col items-center justify-center bg-slate-50 text-slate-800 p-6">
                <XCircle size={64} className="text-red-500 mb-4" />
                <h2 className="text-xl font-bold mb-2">Installation Failed</h2>
                <p className="text-slate-600 text-center">{error}</p>
            </div>
        );
    }

    if (status === 'success') {
        return (
            <div className="h-full flex flex-col items-center justify-center bg-slate-50 text-slate-800 p-6">
                <CheckCircle size={64} className="text-emerald-500 mb-4" />
                <h2 className="text-xl font-bold mb-2">Installation Successful</h2>
                <p className="text-slate-600 text-center mb-6">{pkgData?.name} has been installed and is now available in your Start Menu.</p>
                {closeWindow && (
                    <button 
                        onClick={closeWindow}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                    >
                        Close Installer
                    </button>
                )}
            </div>
        );
    }

    if (!pkgData) {
        return (
            <div className="h-full flex flex-col items-center justify-center bg-slate-50 text-slate-800 p-6">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                <p className="text-slate-600">Reading package...</p>
            </div>
        );
    }

    const isUpdate = user.installedPackages.includes(pkgData.id);
    const existingApp = user.customApps[pkgData.id];
    const existingVersion = existingApp?.version || 'Unknown';
    const newVersion = pkgData.version || 'Unknown';

    return (
        <div className="h-full flex flex-col bg-slate-50 text-slate-800">
            <div className="p-6 border-b border-slate-200 bg-white flex items-center gap-4">
                <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center">
                    <Package size={32} />
                </div>
                <div>
                    <h1 className="text-2xl font-bold">{pkgData.name}</h1>
                    <p className="text-slate-500 text-sm">ID: {pkgData.id} {pkgData.version ? `v${pkgData.version}` : ''}</p>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
                <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6">
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                        <AlertTriangle size={18} className="text-amber-500" />
                        Installation Details
                    </h3>
                    <p className="text-sm text-slate-600 mb-4">
                        {isUpdate 
                            ? `This application is already installed (v${existingVersion}). Installing will overwrite it with v${newVersion}.`
                            : "You are about to install a third-party application. Ensure you trust the source of this file."}
                    </p>
                    
                    {pkgData.permissions && pkgData.permissions.length > 0 && (
                        <div className="mt-4">
                            <h4 className="text-sm font-semibold mb-2 flex items-center gap-2 text-slate-700">
                                <ShieldAlert size={16} className="text-indigo-500" />
                                Requested Permissions:
                            </h4>
                            <ul className="list-disc pl-5 text-sm text-slate-600 space-y-1">
                                {pkgData.permissions.map((perm: string) => (
                                    <li key={perm} className="capitalize">{perm}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            </div>

            <div className="p-4 border-t border-slate-200 bg-white flex justify-end gap-3">
                {closeWindow && (
                    <button 
                        onClick={closeWindow}
                        disabled={status === 'installing'}
                        className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition disabled:opacity-50"
                    >
                        Cancel
                    </button>
                )}
                <button 
                    onClick={handleInstall}
                    disabled={status === 'installing'}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2 disabled:opacity-50"
                >
                    {status === 'installing' ? (
                        <>
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                            Installing...
                        </>
                    ) : (
                        isUpdate ? 'Update' : 'Install'
                    )}
                </button>
            </div>
        </div>
    );
};
