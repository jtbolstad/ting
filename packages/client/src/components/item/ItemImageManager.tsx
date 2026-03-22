import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { apiClient } from "../../api/client";
import type { ItemImage } from "@ting/shared";

interface ItemImageManagerProps {
  itemId: string;
  images: ItemImage[];
  onChange: (images: ItemImage[]) => void;
}

export function ItemImageManager({ itemId, images, onChange }: ItemImageManagerProps) {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setUploading(true);
    try {
      for (const file of files) {
        const { url } = await apiClient.uploadImage(file);
        const image = await apiClient.addItemImage(itemId, url);
        onChange([...images, image]);
      }
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDelete = async (imageId: string) => {
    await apiClient.deleteItemImage(itemId, imageId);
    onChange(images.filter((img) => img.id !== imageId));
  };

  const move = async (index: number, dir: -1 | 1) => {
    const next = index + dir;
    if (next < 0 || next >= images.length) return;
    const reordered = [...images];
    [reordered[index], reordered[next]] = [reordered[next], reordered[index]];
    onChange(reordered);
    await apiClient.reorderItemImages(itemId, reordered.map((img) => img.id));
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {t("item.images.label")}
      </label>

      {images.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-3">
          {images.map((img, i) => (
            <div key={img.id} className="relative group aspect-square">
              <img
                src={img.url}
                alt=""
                className={`w-full h-full object-cover rounded border-2 ${i === 0 ? "border-indigo-400" : "border-gray-200"}`}
              />
              {i === 0 && (
                <span className="absolute top-1 left-1 text-xs bg-indigo-600 text-white px-1 rounded">
                  {t("item.images.primary")}
                </span>
              )}
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all rounded flex items-end justify-center gap-1 pb-1 opacity-0 group-hover:opacity-100">
                <button
                  type="button"
                  onClick={() => move(i, -1)}
                  disabled={i === 0}
                  className="p-1 bg-white rounded text-xs disabled:opacity-30"
                  title={t("item.images.moveLeft")}
                >
                  ←
                </button>
                <button
                  type="button"
                  onClick={() => move(i, 1)}
                  disabled={i === images.length - 1}
                  className="p-1 bg-white rounded text-xs disabled:opacity-30"
                  title={t("item.images.moveRight")}
                >
                  →
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(img.id)}
                  className="p-1 bg-red-500 text-white rounded text-xs"
                  title={t("item.images.delete")}
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleUpload}
        className="hidden"
      />
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        className="px-3 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
      >
        {uploading ? t("item.images.uploading") : t("item.images.addImages")}
      </button>
      <p className="text-xs text-gray-500 mt-1">{t("item.images.hint")}</p>
    </div>
  );
}
