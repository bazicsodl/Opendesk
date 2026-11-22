export default function ProfileHeader({ user }: any) {
  return (
    <div className="bg-white shadow rounded-xl p-6">
      <div className="flex items-center gap-6">
        <img
          src={user.avatar || "/default-avatar.svg"}
          className="w-24 h-24 rounded-full object-cover"
        />

        <div>
          <h1 className="text-2xl font-bold">{user.name}</h1>
          <p className="text-gray-600">@{user.username}</p>

          <div className="flex gap-4 mt-2 text-sm">
            <span>{user.followers} followers</span>
            <span>{user.following} following</span>
          </div>
        </div>
      </div>

      <p className="mt-4">{user.bio}</p>
    </div>
  );
}
