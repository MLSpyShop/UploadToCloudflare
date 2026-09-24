import React, { useRef, useState } from 'react';
import { UploadCloud, FolderUp, FileUp, Sparkles, Layers, Sliders } from 'lucide-react';

interface DropzoneAreaProps {
  onFilesAdded: (files: File[], relativePaths?: string[]) => void;
  concurrency: number;
  setConcurrency: (val: number) => void;
}

export const DropzoneArea: React.FC<DropzoneAreaProps> = ({
  onFilesAdded,
  concurrency,
  setConcurrency,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const items = e.dataTransfer.items;
    if (items) {
      const filesList: File[] = [];
      const pathsList: string[] = [];

      // Recursive scan for items/directories
      const scanFiles = async (item: any, path = '') => {
        if (item.isFile) {
          const file = await new Promise<File>((resolve) => item.file(resolve));
          filesList.push(file);
          pathsList.push(path ? `${path}/${file.name}` : file.name);
        } else if (item.isDirectory) {
          const dirReader = item.createReader();
          const readEntries = async (): Promise<any[]> => {
            return new Promise((resolve) => {
              dirReader.readEntries((entries: any[]) => resolve(entries));
            });
          };
          let entries = await readEntries();
          while (entries.length > 0) {
            for (const entry of entries) {
              await scanFiles(entry, path ? `${path}/${item.name}` : item.name);
            }
            entries = await readEntries();
          }
        }
      };

      const queue: Promise<void>[] = [];
      for (let i = 0; i < items.length; i++) {
        const item = items[i].webkitGetAsEntry?.();
        if (item) {
          queue.push(scanFiles(item));
        }
      }

      await Promise.all(queue);
      if (filesList.length > 0) {
        onFilesAdded(filesList, pathsList);
        return;
      }
    }

    // Fallback if dataTransfer.files
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files);
      onFilesAdded(files, files.map((f) => (f as any).webkitRelativePath || f.name));
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      const paths = files.map((f: any) => f.webkitRelativePath || f.name);
      onFilesAdded(files, paths);
    }
  };

  return (
    <div className="space-y-6">
      {/* Dropzone Box */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-3xl p-10 sm:p-16 text-center cursor-pointer transition-all flex flex-col items-center justify-center group ${
          isDragging
            ? 'border-orange-500 bg-orange-500/10 scale-[1.01]'
            : 'border-slate-700 hover:border-orange-500/60 bg-slate-900/60 hover:bg-slate-900/90'
        }`}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-orange-500/5 via-transparent to-transparent rounded-3xl pointer-events-none"></div>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />
        <input
          ref={folderInputRef}
          type="file"
          // @ts-ignore
          webkitdirectory=""
          directory=""
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* Icon Animation */}
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-500 flex items-center justify-center shadow-xl shadow-orange-500/20 mb-6 group-hover:scale-110 transition-transform">
          <UploadCloud className="w-10 h-10 text-white animate-pulse" />
        </div>

        <h3 className="text-xl sm:text-2xl font-bold text-white mb-2 tracking-tight">
          Drag & Drop Thousands of Files Here
        </h3>
        <p className="text-sm text-slate-400 max-w-md mb-8">
          Upload individual files or entire folder hierarchies directly to your Cloudflare R2 bucket with lightning speed.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 z-10" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-6 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold text-sm shadow-lg shadow-orange-500/25 transition-all flex items-center space-x-2"
          >
            <FileUp className="w-4 h-4" />
            <span>Select Files</span>
          </button>

          <button
            onClick={() => folderInputRef.current?.click()}
            className="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-sm transition-all flex items-center space-x-2"
          >
            <FolderUp className="w-4 h-4 text-orange-400" />
            <span>Select Folder</span>
          </button>
        </div>

        <div className="mt-8 flex items-center space-x-4 text-xs text-slate-500">
          <span className="flex items-center space-x-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Direct S3 Presigned Uploads</span>
          </span>
          <span>•</span>
          <span>Preserves Folder Structure</span>
          <span>•</span>
          <span>Unlimited Scale</span>
        </div>
      </div>

      {/* Upload Settings / Concurrency Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-orange-400">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">Concurrent Upload Streams</h4>
            <p className="text-xs text-slate-400">Control how many files upload in parallel to maximize bandwidth.</p>
          </div>
        </div>

        <div className="flex items-center space-x-4 w-full sm:w-auto">
          <div className="flex items-center space-x-2 bg-slate-950 border border-slate-800 px-4 py-2 rounded-xl">
            <Layers className="w-4 h-4 text-orange-400" />
            <input
              type="range"
              min="1"
              max="20"
              value={concurrency}
              onChange={(e) => setConcurrency(Number(e.target.value))}
              className="w-32 accent-orange-500 cursor-pointer"
            />
            <span className="text-sm font-bold text-white w-6 text-right">{concurrency}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
