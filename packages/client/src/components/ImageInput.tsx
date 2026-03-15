import { useState, useRef, ChangeEvent } from "react";
import { apiClient } from "../api/client";

interface ImageInputProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
}

type InputMode = "upload" | "url";

export function ImageInput({
  value,
  onChange,
  label = "Image",
}: ImageInputProps) {
  const [mode, setMode] = useState<InputMode>("upload");
  const [preview, setPreview] = useState<string | null>(value || null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [urlInput, setUrlInput] = useState(value || "");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }

    // Validate file size (10MB)
    const MAX_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      setError("File size must be less than 10MB");
      return;
    }

    setError(null);

    // Show preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload file
    setUploading(true);
    try {
      const response = await apiClient.uploadImage(file);
      onChange(response.url);
      setPreview(response.url);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
      setPreview(null);
    } finally {
      setUploading(false);
    }
  };

  const handleUrlChange = (e: ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setUrlInput(url);
    onChange(url);
    setPreview(url || null);
    setError(null);
  };

  const handleModeSwitch = (newMode: InputMode) => {
    setMode(newMode);
    setError(null);
    if (newMode === "url" && value) {
      setUrlInput(value);
      setPreview(value);
    }
  };

  const clearImage = () => {
    setPreview(null);
    onChange("");
    setUrlInput("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => handleModeSwitch("upload")}
            className={`px-3 py-1 text-xs rounded ${
              mode === "upload"
                ? "bg-indigo-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            Upload
          </button>
          <button
            type="button"
            onClick={() => handleModeSwitch("url")}
            className={`px-3 py-1 text-xs rounded ${
              mode === "url"
                ? "bg-indigo-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            URL
          </button>
        </div>
      </div>

      {mode === "upload" ? (
        <div className="space-y-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            disabled={uploading}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
          {uploading && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <div className="animate-spin h-4 w-4 border-2 border-indigo-600 border-t-transparent rounded-full"></div>
              Uploading...
            </div>
          )}
        </div>
      ) : (
        <input
          type="url"
          value={urlInput}
          onChange={handleUrlChange}
          placeholder="https://example.com/image.jpg"
          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      )}

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
          {error}
        </div>
      )}

      {preview && !uploading && (
        <div className="relative">
          <img
            src={preview}
            alt="Preview"
            className="w-full h-48 object-cover rounded border border-gray-300"
            onError={() => {
              setError("Failed to load image");
              setPreview(null);
            }}
          />
          <button
            type="button"
            onClick={clearImage}
            className="absolute top-2 right-2 bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
          >
            Remove
          </button>
        </div>
      )}
    </div>
  );
}
