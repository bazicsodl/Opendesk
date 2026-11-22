'use client';
import { useState, useEffect } from 'react';
import { apiFetch } from '../lib/api';
import { Heart } from 'lucide-react';

export default function LikeButton({ postId, initialLikes = 0, initialLiked = false }: {
  postId: string,
  initialLikes?: number,
  initialLiked?: boolean
}) {
  const [liked, setLiked] = useState(initialLiked);
  const [likeCount, setLikeCount] = useState(initialLikes);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLiked(initialLiked);
    setLikeCount(initialLikes);
  }, [initialLiked, initialLikes, postId]);

  async function toggle() {
    if (loading) return;

    setLoading(true);
    try {
      const res = await apiFetch(`/posts/${postId}/like`, { method: 'POST' });

      setLiked(res.liked);
      setLikeCount(res.likes);
    } catch (err) {
      console.error("Like failed:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-all duration-200 ${
        liked 
          ? 'bg-red-100 text-red-600 border border-red-300'
          : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
      }`}
    >
      <Heart 
        className={`w-4 h-4 transition ${
          liked ? 'fill-red-600 stroke-red-600' : ''
        }`}
      />
      <span>{likeCount} Likes</span>
    </button>
  );
}
