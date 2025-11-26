"use client";

import { useState } from "react";

interface ProfileAvatarProps {
  user: {
    name?: string | null;
    image?: string | null;
  };
}

// Helper function to get initials from name
const getInitials = (name: string) => {
  if (!name || name.trim() === "") return "U";
  const names = name.trim().split(" ");
  if (names.length === 1) return names[0]?.charAt(0).toUpperCase() || "U";
  return (
    (names[0]?.charAt(0).toUpperCase() || "") +
    (names[names.length - 1]?.charAt(0).toUpperCase() || "")
  );
};

// Helper function to generate a consistent color based on name
const getNameColor = (name: string) => {
  const colors = [
    "from-blue-500 to-purple-500",
    "from-green-500 to-teal-500",
    "from-orange-500 to-red-500",
    "from-purple-500 to-pink-500",
    "from-yellow-500 to-orange-500",
    "from-indigo-500 to-blue-500",
  ];

  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }

  return colors[Math.abs(hash) % colors.length] || colors[0];
};

export function ProfileAvatar({ user }: ProfileAvatarProps) {
  const [imageError, setImageError] = useState(false);
  const userName = user?.name || "User";
  const userImage = user?.image;

  return (
    <div className="group relative">
      <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 opacity-0 blur transition-opacity duration-300 group-hover:opacity-30"></div>

      {userImage && !imageError ? (
        <img
          src={userImage}
          alt={userName}
          className="relative h-8 w-8 rounded-full border-2 border-white object-cover shadow-md transition-transform duration-300 group-hover:scale-105 dark:border-gray-700"
          onError={() => setImageError(true)}
        />
      ) : (
        <div
          className={`relative flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br ${getNameColor(userName)} text-sm font-bold text-white shadow-md ring-2 ring-white transition-transform duration-300 group-hover:scale-105 dark:ring-gray-700`}
        >
          {getInitials(userName)}
        </div>
      )}
    </div>
  );
}
