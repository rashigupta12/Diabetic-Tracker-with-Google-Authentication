// components/dashboard/TopBar.tsx
"use client";

import { signOut } from "next-auth/react";
import { useSession } from "next-auth/react";
import Image from "next/image";

export default function TopBar() {
  const { data: session } = useSession();

  return (
    <div className="sticky top-0 z-10 bg-white shadow-md">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center">
          <h1 className="text-xl font-semibold text-gray-800">Astrological Market Analysis</h1>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            {session?.user?.image && (
              <Image
                src={session.user.image}
                alt={session.user.name || "User"}
                width={36}
                height={36}
                className="rounded-full"
              />
            )}
            <span className="font-medium text-gray-700">{session?.user?.name}</span>
          </div>

          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}