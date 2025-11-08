"use client";

import { useState } from "react";
import axios from "axios";

export default function UploadPage() {
  const [file, setFile] = useState(null);
  const [drag, setDrag] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [msg, setMsg] = useState(null);
  const [res, setRes] = useState(null);

  const MAX_SIZE = 10 * 1024 * 1024; // 10 MB

  const handleFile = (f) => {
    if (!f) return;
    if (f.size > MAX_SIZE)
      return setMsg({ type: "error", text: "File too large (max 10 MB)" });
    setFile(f);
    setMsg(null);
    setRes(null);
  };

  const upload = async (e) => {
    e.preventDefault();
    if (!file) return setMsg({ type: "error", text: "Select a file" });
    setUploading(true);
    setProgress(0);
    setMsg(null);

    const form = new FormData();
    form.append("file", file);

    try {
      const r = await axios.post("/api/data-upload", form, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (ev) =>
          ev.total && setProgress(Math.round((ev.loaded / ev.total) * 100)),
      });
      setRes(r.data);
      setMsg({ type: "success", text: "File uploaded successfully" });
      setFile(null);
      setProgress(0);
    } catch (err) {
      setMsg({
        type: "error",
        text:
          err.response?.data?.message ||
          err.response?.data?.error ||
          "Upload failed",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-purple-800 to-pink-900 p-4">
      <div className="w-full max-w-2xl bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-2xl">
        <h1 className="text-4xl font-bold text-center text-white mb-2">
          Upload Your Files
        </h1>
        <p className="text-center text-white/70 mb-8">
          Share and store your files securely
        </p>

        <form onSubmit={upload} className="space-y-6">
          {/* Drop Zone */}
          <div
            onDragOver={(e) => (e.preventDefault(), setDrag(true))}
            onDragLeave={() => setDrag(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDrag(false);
              handleFile(e.dataTransfer.files[0]);
            }}
            className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all cursor-pointer ${drag
              ? "border-pink-400 bg-pink-500/20"
              : "border-white/30 hover:border-white/50 hover:bg-white/5"
              } ${uploading ? "opacity-50 pointer-events-none" : ""}`}
          >
            <input
              id="file"
              type="file"
              className="hidden"
              disabled={uploading}
              onChange={(e) => handleFile(e.target.files[0])}
            />
            <label htmlFor="file" className="block cursor-pointer">
              {!file ? (
                <>
                  <svg
                    className="w-16 h-16 mx-auto mb-4 text-purple-300"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                  <p className="text-white text-lg font-semibold">
                    Drop files here
                  </p>
                  <p className="text-white/60 text-sm">or click to browse</p>
                  <p className="text-white/50 text-xs mt-2">Max 10 MB</p>
                </>
              ) : (
                <>
                  <svg
                    className="w-12 h-12 mx-auto mb-3 text-green-400"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                  </svg>
                  <p className="text-white font-semibold truncate">
                    {file.name}
                  </p>
                  <p className="text-white/60 text-sm">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </>
              )}
            </label>
          </div>

          {/* Progress */}
          {uploading && (
            <div>
              <div className="flex justify-between text-sm text-white/70 mb-1">
                <span>Uploading…</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden border border-white/20">
                <div
                  className="bg-gradient-to-r from-purple-500 to-pink-500 h-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Messages */}
          {msg && (
            <div
              className={`p-3 rounded-lg border text-sm ${msg.type === "error"
                ? "bg-red-500/20 border-red-500/50 text-red-200"
                : "bg-green-500/20 border-green-500/50 text-green-200"
                }`}
            >
              {msg.text}
            </div>
          )}

          {/* Backend Response */}
          {res && (
            <div className="p-3 rounded-lg border bg-white/10 border-white/30 text-white text-sm">
              <p>
                <b>Message:</b> {res.message}
              </p>
              <p>
                <b>File ID:</b> {res.fileId || "N/A"}
              </p>
              <p>
                <b>Timestamp:</b>{" "}
                {new Date(res.timestamp + "Z").toLocaleString("en-IN", {
                  timeZone: "Asia/Kolkata",
                  hour12: true,
                  year: "numeric",
                  month: "short",
                  day: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={!file || uploading}
              className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold py-3 rounded-xl transition-all disabled:opacity-50"
            >
              {uploading ? "Uploading…" : "Upload"}
            </button>
            {file && !uploading && (
              <button
                type="button"
                onClick={() => {
                  setFile(null);
                  setMsg(null);
                  setRes(null);
                }}
                className="px-6 bg-white/10 hover:bg-white/20 text-white font-semibold py-3 rounded-xl border border-white/20"
              >
                Clear
              </button>
            )}
          </div>
        </form>

        <p className="text-center text-white/50 text-xs mt-6">
          Your files are secure and private • Encrypted transfer
        </p>
      </div>
    </div>
  );
}
