"use client";

import Link from "next/link";
import { FileText, MessageCircle } from "lucide-react";
import LikeButton from "./LikeButton";

function normalizeType(post: any): "image" | "video" | "document" {
  const t = (post.media_type || "").toLowerCase();
  if (t === "video" || t === "document" || t === "image") return t;
  const mediaUrl = post.media_url || post.image_url || post.imageUrl || "";
  if (/\.(mp4|webm|ogg)(\?.*)?$/i.test(mediaUrl)) return "video";
  if (/\.(pdf|doc|docx|ppt|pptx|xls|xlsx|txt)(\?.*)?$/i.test(mediaUrl)) return "document";
  return "image";
}

export default function PostList({ posts }: { posts: any[] }) {
  return (
    <div className="space-y-5 sm:space-y-6">
      {posts.map((post) => {
        const mediaUrl = post.media_url || post.image_url || post.imageUrl || "";
        const mediaType = normalizeType(post);

        return (
          <article key={post.id} className="premium-card p-4 sm:p-6 animate-fadeIn">
            <div className="flex items-center gap-3 sm:gap-4 mb-4">
              <div className="relative">
                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full theme-gradient-brand p-0.5 theme-shadow-brand">
                  <img
                    src={post.authorImageUrl || "/default-avatar.svg"}
                    alt={post.authorName || "User"}
                    className="w-full h-full rounded-full object-cover border border-white"
                  />
                </div>
              </div>

              <div className="flex-1">
                <h3 className="font-semibold text-slate-900">{post.authorName}</h3>
                <span className="text-xs sm:text-sm text-slate-500">
                  {post.createdAt ? new Date(post.createdAt).toLocaleString() : post.created_at ? new Date(post.created_at).toLocaleString() : "Just now"}
                </span>
              </div>
              <span className="premium-chip hidden sm:inline-flex">Top Voice</span>
            </div>

            {post.content ? <p className="text-slate-800 leading-relaxed mb-4 text-[15px] sm:text-base md:text-lg">{post.content}</p> : null}

            {typeof mediaUrl === "string" && mediaUrl.trim() !== "" ? (
              <div className="mb-6">
                {mediaType === "video" ? (
                  <video src={mediaUrl} controls className="rounded-xl w-full border border-slate-100 max-h-[560px] bg-black" />
                ) : null}
                {mediaType === "image" ? (
                  <img src={mediaUrl} alt="Post media" className="rounded-xl object-cover w-full border border-slate-100 max-h-[560px]" />
                ) : null}
                {mediaType === "document" ? (
                  <a
                    href={mediaUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-slate-800 hover:bg-slate-100"
                  >
                    <FileText className="h-5 w-5 text-emerald-700" />
                    <span className="font-medium">{post.media_name || "Open document"}</span>
                  </a>
                ) : null}
              </div>
            ) : null}

            <div className="flex items-center gap-4 sm:gap-6 pt-4 premium-divider text-slate-600">
              <LikeButton postId={post.id} initialLikes={post.likes} initialLiked={post.userHasLiked} />
              <Link href={`/posts/${post.id}/comments`} className="flex items-center gap-2 sm:gap-3 hover:text-emerald-800 transition-colors group">
                <div className="p-2 rounded-lg bg-slate-50 group-hover:bg-emerald-50 transition-colors">
                  <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <span className="font-medium text-sm sm:text-base">{post.commentsCount || 0} Comments</span>
              </Link>
            </div>
          </article>
        );
      })}
    </div>
  );
}
