import React, { useState, useEffect } from 'react';
import { X, Key, ShieldCheck, AlertCircle, Loader2, ExternalLink, Check } from 'lucide-react';
import { R2Credentials } from '../types';

interface CredentialsModalProps {
  isOpen: boolean;
  onClose: () => void;
  credentials: R2Credentials | null;
  onSaveCredentials: (creds: R2Credentials) => void;
}

export const CredentialsModal: React.FC<CredentialsModalProps> = ({
  isOpen,
  onClose,
  credentials,
  onSaveCredentials,
}) => {
  const [endpoint, setEndpoint] = useState(credentials?.endpoint || '');
  const [accessKeyId, setAccessKeyId] = useState(credentials?.accessKeyId || '');
  const [secretAccessKey, setSecretAccessKey] = useState(credentials?.secretAccessKey || '');
  const [bucket, setBucket] = useState(credentials?.bucket || '');
  
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success?: boolean; message?: string } | null>(null);

  // Auto-save credentials instantly as user types (No save button)
  useEffect(() => {
    if (endpoint || accessKeyId || secretAccessKey || bucket) {
      onSaveCredentials({
        endpoint,
        accessKeyId,
        secretAccessKey,
        bucket,
      });
    }
  }, [endpoint, accessKeyId, secretAccessKey, bucket]);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    if (!endpoint || !accessKeyId || !secretAccessKey || !bucket) {
      setTestResult({ success: false, message: 'Please fill in all R2 credential fields.' });
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      const res = await fetch('/api/r2/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-r2-endpoint': endpoint,
          'x-r2-access-key-id': accessKeyId,
          'x-r2-secret-access-key': secretAccessKey,
          'x-r2-bucket': bucket,
        },
      });

      const data = await res.json();
      if (data.success) {
        setTestResult({ success: true, message: data.message });
      } else {
        setTestResult({ success: false, message: data.error || 'Connection failed.' });
      }
    } catch (err: any) {
      setTestResult({ success: false, message: err.message || 'Network error connecting to R2.' });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl flex flex-col max-h-[90vh] shadow-2xl">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Cloudflare R2 Configuration</h2>
              <p className="text-xs text-slate-400">Credentials auto-save as you type</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                <span>R2 S3 API Endpoint URL</span>
                <a
                  href="https://dash.cloudflare.com/"
                  target="_blank"
                  rel="noreferrer"
                  className="text-orange-400 hover:underline flex items-center space-x-1 font-normal text-[11px]"
                >
                  <span>Cloudflare Dashboard</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </label>
              <input
                type="text"
                value={endpoint}
                onChange={(e) => setEndpoint(e.target.value)}
                placeholder="https://<ACCOUNT_ID>.r2.cloudflarestorage.com"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-orange-500 transition-all"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Access Key ID</label>
                <input
                  type="text"
                  value={accessKeyId}
                  onChange={(e) => setAccessKeyId(e.target.value)}
                  placeholder="e.g. 4a9f...b2"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-orange-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Secret Access Key</label>
                <input
                  type="password"
                  value={secretAccessKey}
                  onChange={(e) => setSecretAccessKey(e.target.value)}
                  placeholder="••••••••••••••••"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-orange-500 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Bucket Name</label>
              <input
                type="text"
                value={bucket}
                onChange={(e) => setBucket(e.target.value)}
                placeholder="my-production-bucket"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-orange-500 transition-all"
              />
            </div>
          </div>

          {testResult && (
            <div
              className={`p-3.5 rounded-xl border flex items-center space-x-3 text-xs ${
                testResult.success
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
              }`}
            >
              {testResult.success ? (
                <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
              )}
              <span>{testResult.message}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-950/60 border-t border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-xs text-emerald-400">
            <Check className="w-4 h-4" />
            <span>Changes auto-saved instantly</span>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={handleTestConnection}
              disabled={testing}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs border border-slate-700 transition-all flex items-center space-x-1.5 disabled:opacity-50"
            >
              {testing && <Loader2 className="w-3.5 h-3.5 animate-spin text-orange-400" />}
              <span>Test Connection</span>
            </button>

            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-medium text-sm shadow-lg shadow-orange-500/20 transition-all"
            >
              Done
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
