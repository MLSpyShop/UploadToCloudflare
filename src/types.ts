export interface R2Credentials {
  endpoint: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
}

export type UploadStatus = 'queued' | 'uploading' | 'paused' | 'completed' | 'error' | 'cancelled';

export interface UploadItem {
  id: string;
  file: File;
  relativePath: string;
  key: string; // R2 object key
  size: number;
  progress: number; // 0 - 100
  uploadedBytes: number;
  speed: number; // bytes per second
  eta: number; // seconds remaining
  status: UploadStatus;
  error?: string;
  xhr?: XMLHttpRequest;
  startTime?: number;
}

export interface R2Object {
  Key: string;
  Size: number;
  LastModified: string;
  ETag?: string;
}

export type ViewMode = 'explorer' | 'uploads' | 'stats';
