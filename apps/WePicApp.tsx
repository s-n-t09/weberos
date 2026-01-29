import React, { useState, useEffect } from 'react';
import { Image as ImageIcon } from 'lucide-react';
import { resolvePath } from '../utils/fs';

export const WePicApp = ({ fs, launchData, openFilePicker }: any) => {
    const [imageSrc, setImageSrc] = useState<string | null>(null);
    const [filename, setFilename] = useState<string | null>(null);

    useEffect(() => {
        if (launchData?.file) {
            // Load file content
            const { node } = resolvePath(fs, [], launchData.file);
            if (node && node.type === 'file' && node.content) {
                setImageSrc(node.content);
                setFilename(launchData.file.split('/').pop());
            }
        }
    }, [launchData, fs]);

    const handleOpen = () => {
        openFilePicker((path: string) => {
             const { node } = resolvePath(fs, [], path);
             if (node && node.type === 'file' && node.content) {
                setImageSrc(node.content);
                setFilename(path.split('/').pop() || 'Image');
             }
        });
    };

    return (
        <div className="h-full bg-slate-900 flex flex-col">
            <div className="bg-slate-800 p-2 border-b border-slate-700 flex items-center gap-2">
                <button onClick={handleOpen} className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded transition">Open Image</button>
                <span className="text-slate-400 text-sm ml-2">{filename || 'No image selected'}</span>
            </div>
            <div className="flex-1 flex items-center justify-center p-4 overflow-hidden">
                {imageSrc ? (
                    <img src={imageSrc} className="max-w-full max-h-full object-contain shadow-2xl" alt="View" />
                ) : (
                    <div className="text-slate-500 flex flex-col items-center">
                        <ImageIcon size={48} className="mb-2 opacity-50"/>
                        <span>Open an image to view</span>
                    </div>
                )}
            </div>
        </div>
    );
};
