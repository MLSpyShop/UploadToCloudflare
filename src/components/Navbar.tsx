import React from 'react';
import { Cloud, UploadCloud, FolderGit2, BarChart3, Key, ShieldCheck, AlertCircle } from 'lucide-react';
import { R2Credentials, ViewMode } from '../types';

interface NavbarProps {
  credentials: R2Credentials | null;
  activeView: ViewMode;
  setActiveView: (view: ViewMode) => void;
  onOpenCredentials: () => void;
  activeUploadsCount: number;
  totalFilesCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  credentials,
  activeView,
  setActiveView,
  onOpenCredentials,
  activeUploadsCount,
  totalFilesCount,
}) => {
  return (
    <header className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Logo & Brand */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-orange-500 to-amber-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
            <Cloud className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-lg text-white tracking-tight">R2Cloud</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30 font-medium">
                Cloudflare R2
              </span>
            </div>
            <p className="text-xs text-slate-400">High-Performance S3 Bucket Manager</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="hidden md:flex items-center space-x-1 bg-slate-800/60 p-1 rounded-xl border border-slate-700/50">
          <button
            onClick={() => setActiveView('explorer')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeView === 'explorer'
                ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            <FolderGit2 className="w-4 h-4" />
            <span>Bucket Explorer</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-full bg-slate-900/40 text-xs">
              {totalFilesCount}
            </span>
          </button>

          <button
            onClick={() => setActiveView('uploads')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all relative ${
              activeView === 'uploads'
                ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            <UploadCloud className="w-4 h-4" />
            <span>Upload Queue</span>
            {activeUploadsCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center animate-pulse">
                {activeUploadsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveView('stats')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeView === 'stats'
                ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Analytics</span>
          </button>
        </nav>

        {/* Connection status & Settings */}
        <div className="flex items-center space-x-3">
          {credentials && credentials.bucket ? (
            <button
              onClick={onOpenCredentials}
              className="flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-medium border bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20 transition-all"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Connected: {credentials.bucket}</span>
            </button>
          ) : (
            <button
              onClick={onOpenCredentials}
              className="flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-medium bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30 transition-all animate-bounce"
            >
              <AlertCircle className="w-4 h-4" />
              <span>Connect R2 Bucket</span>
            </button>
          )}

          <button
            onClick={onOpenCredentials}
            className="p-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700 transition-all"
            title="Configure R2 Credentials"
          >
            <Key className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
