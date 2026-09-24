import React, { useState } from 'react';
import { UploadItem } from '../types';
import { 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Pause, 
  Play, 
  X, 
  RotateCcw, 
  Trash2, 
  UploadCloud, 
  CheckCheck,
  FileText
} from 'lucide-react';

interface UploadQueueProps {
  uploads: UploadItem[];
  onPauseUpload: (id: string) => void;
  onResumeUpload: (id: string) => void;
  onCancelUpload: (id: string) => void;
  onRetryUpload: (id: string) => void;
  onClearCompleted: () => void;
  onClearAll: () => void;
  onPauseAll: () => void;
  onResumeAll: () => void;
}

export const UploadQueue: React.FC<UploadQueueProps> = ({
  uploads,
  onPauseUpload,
  onResumeUpload,
  onCancelUpload,
  onRetryUpload,
  onClearCompleted,
  onClearAll,
  onPauseAll,
  onResumeAll,
}) => {
  const [filter, setFilter] = useState<'all' | 'uploading' | 'completed' | 'error'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredUploads = uploads.filter((item) => {
    if (filter === 'uploading' && item.status !== 'uploading' && item.status !== 'queued') return false;
    if (filter === 'completed' && item.status !== 'completed') return false;
    if (filter === 'error' && item.status !== 'error') return false;
    if (searchQuery && !item.key.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const completedCount = uploads.filter((u) => u.status === 'completed').length;
  const uploadingCount = uploads.filter((u) => u.status === 'uploading' || u.status === 'queued').length;
  const errorCount = uploads.filter((u) => u.status === 'error').length;
  const totalBytes = uploads.reduce((acc, u) => acc + u.size, 0);
  const uploadedBytesTotal = uploads.reduce((acc, u) => acc + u.uploadedBytes, 0);
  const overallProgress = totalBytes > 0 ? Math.round((uploadedBytesTotal / totalBytes) * 100) : 0;

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatSpeed = (bytesPerSec: number) => {
    if (!bytesPerSec || bytesPerSec === 0) return '0 KB/s';
    return `${formatSize(bytesPerSec)}/s`;
  };

  return (
    <div className="space-y-6">
      
      {/* Top Summary Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center space-x-2">
              <UploadCloud className="w-6 h-6 text-orange-400" />
              <span>Upload Queue Manager</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Tracking {uploads.length} files ({formatSize(uploadedBytesTotal)} of {formatSize(totalBytes)})
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={onResumeAll}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-all flex items-center space-x-1.5"
            >
              <Play className="w-3.5 h-3.5 text-emerald-400" />
              <span>Resume All</span>
            </button>

            <button
              onClick={onPauseAll}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-all flex items-center space-x-1.5"
            >
              <Pause className="w-3.5 h-3.5 text-amber-400" />
              <span>Pause All</span>
            </button>

            <button
              onClick={onClearCompleted}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-all flex items-center space-x-1.5"
            >
              <CheckCheck className="w-3.5 h-3.5 text-orange-400" />
              <span>Clear Done</span>
            </button>

            <button
              onClick={onClearAll}
              className="px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-medium border border-rose-500/30 transition-all"
              title="Clear All"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Overall Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-semibold">
            <span className="text-slate-300">Overall Batch Progress</span>
            <span className="text-orange-400">{overallProgress}%</span>
          </div>
          <div className="w-full bg-slate-950 rounded-full h-3 overflow-hidden border border-slate-800 p-0.5">
            <div
              className="bg-gradient-to-r from-orange-500 to-amber-400 h-full rounded-full transition-all duration-300"
              style={{ width: `${overallProgress}%` }}
            ></div>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-6 border-t border-slate-800">
          <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-xl border border-slate-800 w-full sm:w-auto">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                filter === 'all' ? 'bg-orange-500 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              All ({uploads.length})
            </button>
            <button
              onClick={() => setFilter('uploading')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                filter === 'uploading' ? 'bg-orange-500 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Active ({uploadingCount})
            </button>
            <button
              onClick={() => setFilter('completed')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                filter === 'completed' ? 'bg-orange-500 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Completed ({completedCount})
            </button>
            <button
              onClick={() => setFilter('error')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                filter === 'error' ? 'bg-orange-500 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Failed ({errorCount})
            </button>
          </div>

          <div className="w-full sm:w-72">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search queue files..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-orange-500 transition-all"
            />
          </div>
        </div>
      </div>

      {/* Upload Items List */}
      <div className="space-y-3">
        {filteredUploads.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center text-slate-500">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p className="text-sm font-medium">No files match the selected filter</p>
          </div>
        ) : (
          filteredUploads.map((item) => (
            <div
              key={item.id}
              className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 transition-all shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              {/* File Info */}
              <div className="flex items-center space-x-3 min-w-0 flex-1">
                <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 text-orange-400">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-sm font-bold text-white truncate">{item.key}</h4>
                  <div className="flex items-center space-x-3 text-xs text-slate-400 mt-0.5">
                    <span>{formatSize(item.size)}</span>
                    <span>•</span>
                    <span className="capitalize text-orange-300 font-medium">{item.status}</span>
                    {item.status === 'uploading' && (
                      <>
                        <span>•</span>
                        <span>{formatSpeed(item.speed)}</span>
                        <span>•</span>
                        <span>ETA: {item.eta > 0 ? `${item.eta}s` : 'calculating...'}</span>
                      </>
                    )}
                    {item.error && (
                      <>
                        <span>•</span>
                        <span className="text-rose-400 truncate max-w-xs">{item.error}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Progress & Actions */}
              <div className="flex items-center space-x-4 shrink-0">
                <div className="w-32 sm:w-48">
                  <div className="flex justify-between text-[11px] font-semibold mb-1">
                    <span className="text-slate-400">{item.progress}%</span>
                    <span className="text-slate-300">{formatSize(item.uploadedBytes)}</span>
                  </div>
                  <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        item.status === 'completed'
                          ? 'bg-emerald-500'
                          : item.status === 'error'
                          ? 'bg-rose-500'
                          : item.status === 'paused'
                          ? 'bg-amber-500'
                          : 'bg-gradient-to-r from-orange-500 to-amber-400'
                      }`}
                      style={{ width: `${item.progress}%` }}
                    ></div>
                  </div>
                </div>

                <div className="flex items-center space-x-1">
                  {item.status === 'uploading' && (
                    <button
                      onClick={() => onPauseUpload(item.id)}
                      className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all"
                      title="Pause"
                    >
                      <Pause className="w-4 h-4 text-amber-400" />
                    </button>
                  )}

                  {item.status === 'paused' && (
                    <button
                      onClick={() => onResumeUpload(item.id)}
                      className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all"
                      title="Resume"
                    >
                      <Play className="w-4 h-4 text-emerald-400" />
                    </button>
                  )}

                  {item.status === 'error' && (
                    <button
                      onClick={() => onRetryUpload(item.id)}
                      className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all"
                      title="Retry"
                    >
                      <RotateCcw className="w-4 h-4 text-orange-400" />
                    </button>
                  )}

                  {item.status === 'completed' && (
                    <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                  )}

                  <button
                    onClick={() => onCancelUpload(item.id)}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 transition-all"
                    title="Cancel / Delete from queue"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
