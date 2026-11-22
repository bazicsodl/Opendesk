"use client";
import { useState } from "react";
import { api } from "@/lib/api";

export default function CreatePost() {
  const [content, setContent] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const handleImage = (e: any) => {
    const f = e.target.files[0];
    if (!f) return;
    setImage(f);
    setPreview(URL.createObjectURL(f));
  };

  const submit = async () => {
    const form = new FormData();
    form.append("content", content);
    if (image) form.append("file", image);

    await api.post("/posts", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    setContent("");
    setImage(null);
    setPreview(null);
  };

  return (
    <div className="bg-white rounded-xl shadow p-4 mb-4">
      <textarea
        className="w-full p-3 border rounded-lg resize-none"
        placeholder="Share something..."
        rows={3}
        value={content}
        onChange={(e) => setContent(e.target.value)}
      />

      {preview && (
        <img
          src={preview}
          className="mt-3 rounded-xl max-h-80 object-cover"
        />
      )}

      <div className="flex items-center gap-4 mt-3">
        <label className="cursor-pointer px-3 py-2 rounded-lg bg-gray-100 border">
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImage}
          />
          📸 Add Image
        </label>

        <button
          onClick={submit}
          className="px-4 py-2 bg-emerald-600 text-white rounded-lg"
        >
          Post
        </button>
      </div>
    </div>
  );
}
