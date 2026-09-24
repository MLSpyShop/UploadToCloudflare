import React from 'react';
import { R2Object } from '../types';
import { BarChart3, HardDrive, FileText, Database, ShieldCheck, Zap } from 'lucide-react';

interface StorageStatsProps {
  objects: R2Object[];
  bucketName: string;
}

export const StorageStats: React.FC<StorageStatsProps> = ({ objects, bucketName }) => {
  const totalSize = objects.reduce((acc, obj) => acc + obj.Size, 0);
  const totalCount = objects.length;

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Group by file category
  const categories: Record<string, { count: number; size: number }> = {
    Images: { count: 0, size: 0 },
    Documents: { count: 0, size: 0 },
    Code: { count: 0, size: 0 },
    Archives: { count: 0, size: 0 },
    Other: { count: 0, size: 0 },
  };

  objects.forEach((obj) => {
    const ext = obj.Key.split('.').pop()?.toLowerCase() || '';
    if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(ext)) {
      categories.Images.count++;
      categories.Images.size += obj.Size;
    } else if (['pdf', 'docx', 'doc', 'txt', 'md', 'csv', 'xlsx'].includes(ext)) {
      categories.Documents.count++;
      categories.Documents.size += obj.Size;
    } else if (['ts', 'tsx', 'js', 'json', 'html', 'css', 'py'].includes(ext)) {
      categories.Code.count++;
      categories.Code.size += obj.Size;
    } else if (['zip', 'tar', 'gz', 'rar', '7z'].includes(ext)) {
      categories.Archives.count++;
      categories.Archives.size += obj.Size;
    } else {
      categories.Other.count++;
      categories.Other.size += obj.Size;
    }
  });

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center space-x-2">
            <BarChart3 className="w-6 h-6 text-orange-400" />
            <span>Bucket Storage & Analytics</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time metrics for bucket: <span className="text-orange-400 font-semibold">{bucketName || 'Production Bucket'}</span>
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <span className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-medium flex items-center space-x-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>R2 Zero Egress Fee Active</span>
          </span>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400">
            <HardDrive className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400">Total Storage Used</p>
            <h3 className="text-xl font-bold text-white mt-0.5">{formatSize(totalSize)}</h3>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400">Total Objects</p>
            <h3 className="text-xl font-bold text-white mt-0.5">{totalCount.toLocaleString()}</h3>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400">Egress Cost</p>
            <h3 className="text-xl font-bold text-emerald-400 mt-0.5">$0.00 / mo</h3>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400">Storage Class</p>
            <h3 className="text-xl font-bold text-white mt-0.5">Standard R2</h3>
          </div>
        </div>
      </div>

      {/* Breakdown by Type */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5">
        <h3 className="text-base font-bold text-white">Storage Breakdown by File Type</h3>

        <div className="space-y-4">
          {Object.entries(categories).map(([catName, data]) => {
            const percentage = totalSize > 0 ? Math.round((data.size / totalSize) * 100) : 0;
            return (
              <div key={catName} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-white">{catName}</span>
                  <span className="text-slate-400">
                    {data.count} files • {formatSize(data.size)} ({percentage}%)
                  </span>
                </div>
                <div className="w-full bg-slate-950 rounded-full h-2.5 overflow-hidden border border-slate-800">
                  <div
                    className="bg-gradient-to-r from-orange-500 to-amber-400 h-full rounded-full transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
