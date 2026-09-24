import React, { useState } from 'react';
import { R2Object } from '../types';
import { 
  Folder, 
  File, 
  Search, 
  Trash2, 
  Download, 
  Eye, 
  RefreshCw, 
  FolderGit2, 
  ChevronRight, 
  Grid, 
  List, 
  CheckSquare, 
  Square,
  FileText,
  Image as ImageIcon,
  Video,
  Archive,
  Code
} from 'lucide-react';

interface FileExplorerProps {
  objects: R2Object[];
  loading: boolean;
  onRefresh: () => void;
  onDeleteObjects: (keys: string[]) => void;
  onPreviewObject: (obj: R2Object) => void;
  onDownloadObject: (obj: R2Object) => void;
}

export const FileExplorer: React.FC<FileExplorerProps> = ({
  objects,
  loading,
  onRefresh,
  onDeleteObjects,
  onPreviewObject,
  onDownloadObject,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPrefix, setCurrentPrefix] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [typeFilter, setTypeFilter] = useState<'all' | 'image' | 'document' | 'code' | 'archive' | 'video'>('all');

  // Compute folders and files based on currentPrefix
  const normalizedPrefix = currentPrefix ? (currentPrefix.endsWith('/') ? currentPrefix : `${currentPrefix}/`) : '';

  const subFolders = new Set<string>();
  const currentLevelFiles: R2Object[] = [];

  objects.forEach((obj) => {
    if (normalizedPrefix && !obj.Key.startsWith(normalizedPrefix)) return;
    const relativeKey = normalizedPrefix ? obj.Key.slice(normalizedPrefix.length) : obj.Key;
    if (!relativeKey) return;

    const parts = relativeKey.split('/');
    if (parts.length > 1) {
      subFolders.add(parts[0]);
    } else {
      currentLevelFiles.push(obj);
    }
  });

  // Filter files by search & type
  const filteredFiles = currentLevelFiles.filter((file) => {
    if (searchQuery && !file.Key.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (typeFilter !== 'all') {
      const ext = file.Key.split('.').pop()?.toLowerCase() || '';
      if (typeFilter === 'image' && !['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(ext)) return false;
      if (typeFilter === 'document' && !['pdf', 'docx', 'doc', 'txt', 'md', 'csv', 'xlsx'].includes(ext)) return false;
      if (typeFilter === 'code' && !['ts', 'tsx', 'js', 'json', 'html', 'css', 'py'].includes(ext)) return false;
      if (typeFilter === 'archive' && !['zip', 'tar', 'gz', 'rar', '7z'].includes(ext)) return false;
      if (typeFilter === 'video' && !['mp4', 'mov', 'webm', 'avi'].includes(ext)) return false;
    }
    return true;
  });

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (key: string) => {
    const ext = key.split('.').pop()?.toLowerCase() || '';
    if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(ext)) return <ImageIcon className="w-4 h-4 text-emerald-400" />;
    if (['mp4', 'mov', 'webm'].includes(ext)) return <Video className="w-4 h-4 text-purple-400" />;
    if (['zip', 'tar', 'gz'].includes(ext)) return <Archive className="w-4 h-4 text-amber-400" />;
    if (['ts', 'tsx', 'js', 'json', 'html', 'css'].includes(ext)) return <Code className="w-4 h-4 text-blue-400" />;
    return <FileText className="w-4 h-4 text-orange-400" />;
  };

  const toggleSelectAll = () => {
    if (selectedKeys.length === filteredFiles.length) {
      setSelectedKeys([]);
    } else {
      setSelectedKeys(filteredFiles.map((f) => f.Key));
    }
  };

  const toggleSelectKey = (key: string) => {
    if (selectedKeys.includes(key)) {
      setSelectedKeys(selectedKeys.filter((k) => k !== key));
    } else {
      setSelectedKeys([...selectedKeys, key]);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header & Breadcrumbs */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center space-x-2">
              <FolderGit2 className="w-6 h-6 text-orange-400" />
              <span>Cloudflare R2 Bucket Explorer</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Browse, search, preview, and manage objects stored in your bucket.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={onRefresh}
              disabled={loading}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-all flex items-center space-x-2"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-orange-400 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>

            {selectedKeys.length > 0 && (
              <button
                onClick={() => {
                  onDeleteObjects(selectedKeys);
                  setSelectedKeys([]);
                }}
                className="px-4 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-medium border border-rose-500/30 transition-all flex items-center space-x-2"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Selected ({selectedKeys.length})</span>
              </button>
            )}
          </div>
        </div>

        {/* Breadcrumb path */}
        <div className="flex items-center space-x-2 text-sm bg-slate-950 px-4 py-2.5 rounded-xl border border-slate-800 overflow-x-auto">
          <button
            onClick={() => setCurrentPrefix('')}
            className="text-orange-400 hover:underline font-semibold flex items-center space-x-1"
          >
            <Folder className="w-4 h-4 mr-1" />
            <span>bucket root</span>
          </button>
          {currentPrefix.split('/').filter(Boolean).map((folder, idx, arr) => {
            const prefixPath = arr.slice(0, idx + 1).join('/') + '/';
            return (
              <React.Fragment key={prefixPath}>
                <ChevronRight className="w-4 h-4 text-slate-600 shrink-0" />
                <button
                  onClick={() => setCurrentPrefix(prefixPath)}
                  className="text-slate-300 hover:text-white font-medium truncate"
                >
                  {folder}
                </button>
              </React.Fragment>
            );
          })}
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-2">
          <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-xl border border-slate-800 w-full md:w-auto overflow-x-auto">
            {(['all', 'image', 'document', 'code', 'archive', 'video'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setTypeFilter(type)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all whitespace-nowrap ${
                  typeFilter === type ? 'bg-orange-500 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          <div className="flex items-center space-x-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-72">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search files..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-orange-500 transition-all"
              />
            </div>

            <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg transition-all ${
                  viewMode === 'table' ? 'bg-orange-500 text-white' : 'text-slate-400 hover:text-white'
                }`}
                title="Table View"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-all ${
                  viewMode === 'grid' ? 'bg-orange-500 text-white' : 'text-slate-400 hover:text-white'
                }`}
                title="Grid View"
              >
                <Grid className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Folders List */}
      {subFolders.size > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {Array.from(subFolders).map((folderName) => (
            <div
              key={folderName}
              onClick={() => setCurrentPrefix(normalizedPrefix + folderName + '/')}
              className="bg-slate-900 border border-slate-800 hover:border-orange-500/50 rounded-2xl p-4 cursor-pointer transition-all group flex items-center space-x-3"
            >
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400 group-hover:scale-110 transition-transform">
                <Folder className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-sm font-bold text-white truncate">{folderName}</h4>
                <p className="text-[11px] text-slate-400">Folder</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Files Display */}
      {filteredFiles.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-16 text-center text-slate-500">
          <File className="w-12 h-12 mx-auto mb-3 opacity-40 text-orange-400" />
          <p className="text-sm font-semibold text-white">No files found in this directory</p>
          <p className="text-xs text-slate-400 mt-1">Upload files using the drag & drop uploader above.</p>
        </div>
      ) : viewMode === 'table' ? (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/60 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                <th className="py-4 px-6 w-12">
                  <button onClick={toggleSelectAll} className="text-slate-400 hover:text-white">
                    {selectedKeys.length === filteredFiles.length && filteredFiles.length > 0 ? (
                      <CheckSquare className="w-4 h-4 text-orange-400" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th className="py-4 px-4">Name</th>
                <th className="py-4 px-4">Size</th>
                <th className="py-4 px-4">Last Modified</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-sm">
              {filteredFiles.map((file) => {
                const isSelected = selectedKeys.includes(file.Key);
                const relativeName = file.Key.slice(normalizedPrefix.length);
                return (
                  <tr key={file.Key} className={`hover:bg-slate-800/50 transition-all ${isSelected ? 'bg-orange-500/10' : ''}`}>
                    <td className="py-4 px-6">
                      <button onClick={() => toggleSelectKey(file.Key)} className="text-slate-400 hover:text-white">
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-orange-400" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>
                    </td>
                    <td className="py-4 px-4 font-medium text-white flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
                        {getFileIcon(file.Key)}
                      </div>
                      <span className="truncate max-w-xs sm:max-w-md">{relativeName}</span>
                    </td>
                    <td className="py-4 px-4 text-slate-400">{formatSize(file.Size)}</td>
                    <td className="py-4 px-4 text-slate-400 text-xs">
                      {new Date(file.LastModified).toLocaleString()}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => onPreviewObject(file)}
                          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all"
                          title="Preview"
                        >
                          <Eye className="w-4 h-4 text-orange-400" />
                        </button>
                        <button
                          onClick={() => onDownloadObject(file)}
                          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all"
                          title="Download"
                        >
                          <Download className="w-4 h-4 text-emerald-400" />
                        </button>
                        <button
                          onClick={() => onDeleteObjects([file.Key])}
                          className="p-2 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 transition-all"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredFiles.map((file) => {
            const isSelected = selectedKeys.includes(file.Key);
            const relativeName = file.Key.slice(normalizedPrefix.length);
            return (
              <div
                key={file.Key}
                className={`bg-slate-900 border rounded-2xl p-4 transition-all flex flex-col justify-between group ${
                  isSelected ? 'border-orange-500 bg-orange-500/10' : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-orange-400">
                    {getFileIcon(file.Key)}
                  </div>
                  <button onClick={() => toggleSelectKey(file.Key)} className="text-slate-400 hover:text-white">
                    {isSelected ? <CheckSquare className="w-4 h-4 text-orange-400" /> : <Square className="w-4 h-4" />}
                  </button>
                </div>

                <div className="mb-4">
                  <h4 className="text-sm font-bold text-white truncate mb-1">{relativeName}</h4>
                  <p className="text-xs text-slate-400">{formatSize(file.Size)}</p>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                  <span className="text-[10px] text-slate-500">{new Date(file.LastModified).toLocaleDateString()}</span>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => onPreviewObject(file)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all"
                      title="Preview"
                    >
                      <Eye className="w-3.5 h-3.5 text-orange-400" />
                    </button>
                    <button
                      onClick={() => onDownloadObject(file)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all"
                      title="Download"
                    >
                      <Download className="w-3.5 h-3.5 text-emerald-400" />
                    </button>
                    <button
                      onClick={() => onDeleteObjects([file.Key])}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 transition-all"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
