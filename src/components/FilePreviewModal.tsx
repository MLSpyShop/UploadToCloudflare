import React, { useEffect, useState } from 'react';
import { R2Object, R2Credentials } from '../types';
import { X, Download, Copy, Check, ExternalLink, Loader2, FileText } from 'lucide-react';

interface FilePreviewModalProps {
  object: R2Object | null;
  onClose: () => void;
  credentials: R2Credentials | null;
}

export const FilePreviewModal: React.FC<FilePreviewModalProps> = ({
  object,
  onClose,
  credentials,
}) => {
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [textContent, setTextContent] = useState<string | null>(null);

  useEffect(() => {
    if (!object || !credentials) return;

    const fetchPresignedUrl = async () => {
      setLoading(true);

      try {
        const res = await fetch('/api/r2/presign-download', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-r2-endpoint': credentials.endpoint,
            'x-r2-access-key-id': credentials.accessKeyId,
            'x-r2-secret-access-key': credentials.secretAccessKey,
            'x-r2-bucket': credentials.bucket,
          },
          body: JSON.stringify({ key: object.Key }),
        });
        const data = await res.json();
        if (data.success && data.presignedUrl) {
          setDownloadUrl(data.presignedUrl);

          const ext = object.Key.split('.').pop()?.toLowerCase() || '';
          if (['txt', 'json', 'md', 'ts', 'tsx', 'js', 'csv'].includes(ext)) {
            const textRes = await fetch(data.presignedUrl);
            const text = await textRes.text();
            setTextContent(text);
          }
        }
      } catch (err) {
        console.error('Failed to generate presigned download URL:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPresignedUrl();
  }, [object, credentials]);

  if (!object) return null;

  const ext = object.Key.split('.').pop()?.toLowerCase() || '';
  const isImage = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(ext);
  const isVideo = ['mp4', 'webm', 'mov'].includes(ext);

  const handleCopyUrl = () => {
    if (downloadUrl) {
      navigator.clipboard.writeText(downloadUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400 shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-white truncate">{object.Key}</h3>
              <p className="text-xs text-slate-400">Size: {(object.Size / 1024).toFixed(1)} KB</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 flex-1 overflow-y-auto flex items-center justify-center bg-slate-950">
          {loading ? (
            <div className="flex flex-col items-center space-y-3 py-12">
              <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
              <p className="text-xs text-slate-400">Generating secure presigned URL...</p>
            </div>
          ) : isImage && downloadUrl ? (
            <img
              src={downloadUrl}
              alt={object.Key}
              className="max-h-[50vh] max-w-full rounded-2xl object-contain border border-slate-800 shadow-xl"
            />
          ) : isVideo && downloadUrl ? (
            <video
              src={downloadUrl}
              controls
              className="max-h-[50vh] max-w-full rounded-2xl border border-slate-800 shadow-xl"
            />
          ) : textContent !== null ? (
            <pre className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 text-xs font-mono text-slate-200 overflow-x-auto max-h-[50vh]">
              {textContent}
            </pre>
          ) : (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-slate-600 mx-auto mb-3" />
              <p className="text-sm font-medium text-white">Preview not available for this file type</p>
              <p className="text-xs text-slate-400 mt-1">You can download or copy the secure link below.</p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-950/60 border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={handleCopyUrl}
            disabled={!downloadUrl}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs border border-slate-700 transition-all flex items-center space-x-2"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-orange-400" />}
            <span>{copied ? 'Copied Presigned URL!' : 'Copy Presigned URL'}</span>
          </button>

          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm font-medium text-slate-400 hover:text-white transition-all"
            >
              Close
            </button>
            {downloadUrl && (
              <a
                href={downloadUrl}
                download={object.Key.split('/').pop()}
                target="_blank"
                rel="noreferrer"
                className="px-5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-medium text-sm shadow-lg shadow-orange-500/20 transition-all flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Download File</span>
              </a>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
