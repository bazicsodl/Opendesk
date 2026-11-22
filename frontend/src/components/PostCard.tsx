import Link from "next/link";

export default function PostCard({ post }: any) {
  return (
    <div className="bg-white rounded-xl shadow p-4 mb-4">
      <div className="flex items-center gap-3">
        <img
          src={post.author.avatar || "/default-avatar.svg"}
          className="w-10 h-10 rounded-full"
        />
        <div>
          <Link href={`/profile/${post.author.id}`} className="font-semibold">
            {post.author.name}
          </Link>
          <p className="text-gray-500 text-sm">@{post.author.username}</p>
        </div>
      </div>

      <p className="mt-3 whitespace-pre-line">{post.content}</p>

      {post.image && (
        <img src={post.image} className="rounded-lg mt-3 max-h-96 object-cover" />
      )}

      <div className="mt-3 flex gap-6 text-gray-600">
        <button>❤️ {post.likes}</button>
        <button>💬 {post.comments}</button>
      </div>
    </div>
  );
}
