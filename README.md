# R2Cloud — Cloudflare R2 Bucket Manager & Multi-File Uploader

[![CI](https://github.com/owner/r2cloud/actions/workflows/ci.yml/badge.svg)](https://github.com/owner/r2cloud/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-orange.svg)](https://opensource.org/licenses/MIT)
[![Node: >=20](https://img.shields.io/badge/node-%3E%3D20-blue.svg)](https://nodejs.org/)

**R2Cloud** is a fast, modern web application for uploading, managing, and exploring files stored in **Cloudflare R2** buckets with zero egress fees. Built with React 19, TypeScript, Tailwind CSS, and Express, it provides full folder hierarchy preservation, concurrent upload controls, transfer speed metrics, in-browser previews, and bucket analytics.

---

## ✨ Features

- **🚀 High-Performance Uploads**:
  - Drag-and-drop multiple files or entire folder directories.
  - Multi-threaded concurrent uploads (adjustable from 1 to 10 concurrent streams).
  - Real-time progress bar, transfer speed (KB/s, MB/s), and estimated time remaining (ETA).
  - Individual and batch controls: Pause, Resume, Retry, and Cancel uploads.
  - S3 Presigned URL direct uploads and chunked multipart support.

- **📁 Interactive File Explorer**:
  - Breadcrumb and tree navigation through folders and subfolders.
  - Instant search and type-based filtering (All, Images, Videos, Audio, Documents, Archives, Code).
  - Sort by file name, file size, or last modified date.
  - In-browser file preview for images, video, audio, PDFs, and syntax-highlighted code.
  - Single and bulk object deletion with confirmation prompts.
  - Secure presigned one-click file downloads.

- **📊 Bucket Analytics & Stats**:
  - Total bucket storage consumption and total object count.
  - Storage breakdown by file type and extension.

- **🔒 Security & Ease of Use**:
  - Zero server-side credential retention unless supplied via environment variables.
  - Client-side credentials saved safely in local storage with instant auto-save.
  - Clean error handling with real-time connection testing.

---

## 🛠 Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS, Lucide Icons, Vite
- **Backend / API**: Express 4, Node.js 20, AWS SDK for JavaScript v3 (`@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`)
- **Containerization**: Docker multi-stage build

---

## 🚀 Quick Start

### 1. Prerequisites

- [Node.js](https://nodejs.org/) v20 or higher
- npm v9 or higher

### 2. Clone the Repository

```bash
git clone https://github.com/<your-username>/r2cloud.git
cd r2cloud
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Configure Environment (Optional)

You can enter your R2 credentials directly in the web UI upon launch, or create a `.env` file to set default credentials:

```bash
cp .env.example .env
```

Edit `.env`:
```env
PORT=3000
R2_ENDPOINT="https://<YOUR_ACCOUNT_ID>.r2.cloudflarestorage.com"
R2_ACCESS_KEY_ID="your_r2_access_key_id"
R2_SECRET_ACCESS_KEY="your_r2_secret_access_key"
R2_BUCKET_NAME="your-bucket-name"
```

### 5. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📦 Production Build & Run

To build the client bundle and bundle the server:

```bash
npm run build
npm start
```

The server will serve the optimized production assets from `dist/` on port 3000 (or the port defined by `PORT`).

---

## 🐳 Docker Deployment

You can run R2Cloud anywhere with Docker:

```bash
# Build the Docker image
docker build -t r2cloud .

# Run the container
docker run -p 3000:3000 r2cloud
```

Or pass your R2 credentials as environment variables:

```bash
docker run -p 3000:3000 \
  -e R2_ENDPOINT="https://<ACCOUNT_ID>.r2.cloudflarestorage.com" \
  -e R2_ACCESS_KEY_ID="<ACCESS_KEY_ID>" \
  -e R2_SECRET_ACCESS_KEY="<SECRET_ACCESS_KEY>" \
  -e R2_BUCKET_NAME="<BUCKET_NAME>" \
  r2cloud
```

---

## 🌐 Cloudflare R2 Setup Guide

### 1. Find Your S3 API Endpoint & Account ID
1. Log into your [Cloudflare Dashboard](https://dash.cloudflare.com/).
2. Navigate to **R2 Storage** in the sidebar.
3. Your Account ID is displayed in the right sidebar.
4. Your endpoint URL is:
   ```
   https://<ACCOUNT_ID>.r2.cloudflarestorage.com
   ```

### 2. Create API Tokens
1. Go to **R2** > **Manage R2 API Tokens**.
2. Click **Create API token**.
3. Choose **Object Read & Write** permissions (or Admin Read & Write).
4. Select the specific bucket or allow access to all buckets.
5. Copy your **Access Key ID** and **Secret Access Key**.

### 3. Enable CORS on your Bucket (Recommended for Direct Browser Uploads)
Under your bucket's **Settings** > **CORS Policy**, add:
```json
[
  {
    "AllowedOrigins": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

---

## 📜 Available Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts development server with hot module replacement (HMR) |
| `npm run build` | Compiles Vite frontend and bundles server for production |
| `npm start` | Runs the compiled production server (`node server.js`) |
| `npm run lint` | Runs TypeScript compiler type checking without emitting files |
| `npm run clean` | Removes generated `dist/` and `server.js` build artifacts |

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
