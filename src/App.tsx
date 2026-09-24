import React, { useState, useEffect, useCallback, useRef } from 'react';
import { R2Credentials, ViewMode, UploadItem, R2Object } from './types';
import { Navbar } from './components/Navbar';
import { CredentialsModal } from './components/CredentialsModal';
import { DropzoneArea } from './components/DropzoneArea';
import { UploadQueue } from './components/UploadQueue';
import { FileExplorer } from './components/FileExplorer';
import { FilePreviewModal } from './components/FilePreviewModal';
import { StorageStats } from './components/StorageStats';

export default function App() {
  const [credentials, setCredentials] = useState<R2Credentials | null>(() => {
    const saved = localStorage.getItem('r2cloud_credentials');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.endpoint && parsed.endpoint.includes('demo-r2.cloudflare.com')) {
          localStorage.removeItem('r2cloud_credentials');
          return null;
        }
        return parsed;
      } catch (e) {
        console.error(e);
      }
    }
    return null;
  });

  const [activeView, setActiveView] = useState<ViewMode>('explorer');
  const [isCredentialsModalOpen, setIsCredentialsModalOpen] = useState(false);
  const [previewObject, setPreviewObject] = useState<R2Object | null>(null);

  const [objects, setObjects] = useState<R2Object[]>([]);
  const [loadingObjects, setLoadingObjects] = useState(false);

  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const [concurrency, setConcurrency] = useState(5);

  const uploadsRef = useRef(uploads);
  uploadsRef.current = uploads;
  const concurrencyRef = useRef(concurrency);
  concurrencyRef.current = concurrency;

  // Save credentials to localStorage
  const handleSaveCredentials = (creds: R2Credentials) => {
    setCredentials(creds);
    localStorage.setItem('r2cloud_credentials', JSON.stringify(creds));
  };

  // Fetch bucket objects from backend API
  const fetchBucketObjects = useCallback(async () => {
    if (!credentials || !credentials.endpoint || !credentials.bucket || !credentials.bucket.trim()) return;

    setLoadingObjects(true);
    try {
      const res = await fetch('/api/r2/list', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-r2-endpoint': credentials.endpoint,
          'x-r2-access-key-id': credentials.accessKeyId,
          'x-r2-secret-access-key': credentials.secretAccessKey,
          'x-r2-bucket': credentials.bucket,
        },
        body: JSON.stringify({ maxKeys: 1000 }),
      });
      const data = await res.json();
      if (data.success) {
        setObjects(data.contents || []);
      }
    } catch (err) {
      console.error('Failed to list R2 objects:', err);
    } finally {
      setLoadingObjects(false);
    }
  }, [credentials]);

  useEffect(() => {
    if (!credentials || !credentials.endpoint || !credentials.accessKeyId || !credentials.secretAccessKey || !credentials.bucket || !credentials.bucket.trim()) {
      return;
    }
    const timer = setTimeout(() => {
      fetchBucketObjects();
    }, 600);
    return () => clearTimeout(timer);
  }, [credentials, fetchBucketObjects]);

  // Handle adding files to upload queue
  const handleFilesAdded = (files: File[], relativePaths?: string[]) => {
    if (!credentials || !credentials.bucket) {
      setIsCredentialsModalOpen(true);
      return;
    }

    const newItems: UploadItem[] = files.map((file, idx) => {
      const relPath = relativePaths && relativePaths[idx] ? relativePaths[idx] : file.name;
      const key = relPath.startsWith('/') ? relPath.slice(1) : relPath;
      return {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        file,
        relativePath: relPath,
        key,
        size: file.size,
        progress: 0,
        uploadedBytes: 0,
        speed: 0,
        eta: 0,
        status: 'queued',
      };
    });

    setUploads((prev) => [...prev, ...newItems]);
    setActiveView('uploads');
  };

  // Background Upload Processor Loop
  useEffect(() => {
    const interval = setInterval(() => {
      const currentUploads = uploadsRef.current;
      const activeCount = currentUploads.filter((u) => u.status === 'uploading').length;
      const maxConcurrent = concurrencyRef.current;

      if (activeCount < maxConcurrent) {
        const nextQueueItem = currentUploads.find((u) => u.status === 'queued');
        if (nextQueueItem) {
          startUpload(nextQueueItem.id);
        }
      }
    }, 300);

    return () => clearInterval(interval);
  }, [credentials]);

  const startUpload = async (id: string) => {
    const item = uploadsRef.current.find((u) => u.id === id);
    if (!item || item.status === 'uploading' || item.status === 'completed' || !credentials) return;

    setUploads((prev) =>
      prev.map((u) => (u.id === id ? { ...u, status: 'uploading', startTime: Date.now() } : u))
    );

    try {
      // 1. Get presigned upload URL
      const res = await fetch('/api/r2/presign-upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-r2-endpoint': credentials.endpoint,
          'x-r2-access-key-id': credentials.accessKeyId,
          'x-r2-secret-access-key': credentials.secretAccessKey,
          'x-r2-bucket': credentials.bucket,
        },
        body: JSON.stringify({ key: item.key, contentType: item.file.type }),
      });
      const data = await res.json();
      if (!data.success || !data.presignedUrl) {
        throw new Error(data.error || 'Failed to get upload URL');
      }

      // 2. Upload using XMLHttpRequest to track precise progress
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('PUT', data.presignedUrl);
        xhr.setRequestHeader('Content-Type', item.file.type || 'application/octet-stream');

        setUploads((prev) =>
          prev.map((u) => (u.id === id ? { ...u, xhr } : u))
        );

        let lastTime = Date.now();
        let lastLoaded = 0;

        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            const now = Date.now();
            const timeDiff = (now - lastTime) / 1000;
            const loadedDiff = e.loaded - lastLoaded;
            const speed = timeDiff > 0 ? loadedDiff / timeDiff : 0;
            const remainingBytes = e.total - e.loaded;
            const eta = speed > 0 ? Math.round(remainingBytes / speed) : 0;
            const progress = Math.round((e.loaded / e.total) * 100);

            lastTime = now;
            lastLoaded = e.loaded;

            setUploads((prev) =>
              prev.map((u) =>
                u.id === id
                  ? {
                      ...u,
                      progress,
                      uploadedBytes: e.loaded,
                      speed,
                      eta,
                    }
                  : u
              )
            );
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            reject(new Error(`HTTP Error ${xhr.status}`));
          }
        };

        xhr.onerror = () => reject(new Error('Network upload error'));
        xhr.onabort = () => reject(new Error('Upload aborted'));

        xhr.send(item.file);
      });

      // Mark completed
      setUploads((prev) =>
        prev.map((u) => (u.id === id ? { ...u, status: 'completed', progress: 100 } : u))
      );

      // Refresh bucket objects
      fetchBucketObjects();
    } catch (err: any) {
      if (err.message === 'Upload aborted') {
        setUploads((prev) => prev.map((u) => (u.id === id ? { ...u, status: 'cancelled' } : u)));
      } else {
        setUploads((prev) =>
          prev.map((u) => (u.id === id ? { ...u, status: 'error', error: err.message } : u))
        );
      }
    }
  };

  const handlePauseUpload = (id: string) => {
    const item = uploads.find((u) => u.id === id);
    if (item && item.xhr) {
      item.xhr.abort();
    }
    setUploads((prev) => prev.map((u) => (u.id === id ? { ...u, status: 'paused' } : u)));
  };

  const handleResumeUpload = (id: string) => {
    setUploads((prev) => prev.map((u) => (u.id === id ? { ...u, status: 'queued' } : u)));
  };

  const handleCancelUpload = (id: string) => {
    const item = uploads.find((u) => u.id === id);
    if (item && item.xhr) {
      item.xhr.abort();
    }
    setUploads((prev) => prev.filter((u) => u.id !== id));
  };

  const handleRetryUpload = (id: string) => {
    setUploads((prev) =>
      prev.map((u) => (u.id === id ? { ...u, status: 'queued', progress: 0, uploadedBytes: 0, error: undefined } : u))
    );
  };

  const handleClearCompleted = () => {
    setUploads((prev) => prev.filter((u) => u.status !== 'completed'));
  };

  const handleClearAll = () => {
    uploads.forEach((u) => {
      if (u.xhr) u.xhr.abort();
    });
    setUploads([]);
  };

  const handlePauseAll = () => {
    uploads.forEach((u) => {
      if (u.xhr && u.status === 'uploading') u.xhr.abort();
    });
    setUploads((prev) =>
      prev.map((u) => (u.status === 'uploading' || u.status === 'queued' ? { ...u, status: 'paused' } : u))
    );
  };

  const handleResumeAll = () => {
    setUploads((prev) =>
      prev.map((u) => (u.status === 'paused' ? { ...u, status: 'queued' } : u))
    );
  };

  // Delete objects from R2
  const handleDeleteObjects = async (keys: string[]) => {
    if (!credentials) return;

    try {
      const res = await fetch('/api/r2/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-r2-endpoint': credentials.endpoint,
          'x-r2-access-key-id': credentials.accessKeyId,
          'x-r2-secret-access-key': credentials.secretAccessKey,
          'x-r2-bucket': credentials.bucket,
        },
        body: JSON.stringify({ keys }),
      });
      const data = await res.json();
      if (data.success) {
        fetchBucketObjects();
      }
    } catch (err) {
      console.error('Failed to delete objects:', err);
    }
  };

  const handleDownloadObject = async (obj: R2Object) => {
    if (!credentials) return;

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
        body: JSON.stringify({ key: obj.Key }),
      });
      const data = await res.json();
      if (data.success && data.presignedUrl) {
        window.open(data.presignedUrl, '_blank');
      }
    } catch (err) {
      console.error('Failed to download object:', err);
    }
  };

  const activeUploadsCount = uploads.filter((u) => u.status === 'uploading' || u.status === 'queued').length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-orange-500 selection:text-white">
      
      {/* Top Navbar */}
      <Navbar
        credentials={credentials}
        activeView={activeView}
        setActiveView={setActiveView}
        onOpenCredentials={() => setIsCredentialsModalOpen(true)}
        activeUploadsCount={activeUploadsCount}
        totalFilesCount={objects.length}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Dropzone Always Accessible at Top or in Explorer */}
        <DropzoneArea
          onFilesAdded={handleFilesAdded}
          concurrency={concurrency}
          setConcurrency={setConcurrency}
        />

        {/* View Switcher Content */}
        {activeView === 'explorer' && (
          <FileExplorer
            objects={objects}
            loading={loadingObjects}
            onRefresh={fetchBucketObjects}
            onDeleteObjects={handleDeleteObjects}
            onPreviewObject={(obj) => setPreviewObject(obj)}
            onDownloadObject={handleDownloadObject}
          />
        )}

        {activeView === 'uploads' && (
          <UploadQueue
            uploads={uploads}
            onPauseUpload={handlePauseUpload}
            onResumeUpload={handleResumeUpload}
            onCancelUpload={handleCancelUpload}
            onRetryUpload={handleRetryUpload}
            onClearCompleted={handleClearCompleted}
            onClearAll={handleClearAll}
            onPauseAll={handlePauseAll}
            onResumeAll={handleResumeAll}
          />
        )}

        {activeView === 'stats' && (
          <StorageStats
            objects={objects}
            bucketName={credentials?.bucket || 'Your R2 Bucket'}
          />
        )}

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-6 text-center text-xs text-slate-500">
        <p>R2Cloud • Direct Cloudflare R2 S3-Compatible Bucket Uploader & Manager</p>
      </footer>

      {/* Credentials Modal */}
      <CredentialsModal
        isOpen={isCredentialsModalOpen || !credentials || !credentials.bucket}
        onClose={() => setIsCredentialsModalOpen(false)}
        credentials={credentials}
        onSaveCredentials={handleSaveCredentials}
      />

      {/* File Preview Modal */}
      <FilePreviewModal
        object={previewObject}
        onClose={() => setPreviewObject(null)}
        credentials={credentials}
      />

    </div>
  );
}
