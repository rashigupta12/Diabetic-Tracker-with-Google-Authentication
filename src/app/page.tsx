import MarketDataDashboard from "@/components/dashboard/MarketdataDashboard";
import { auth, signOut } from "@/lib/auth";
import { redirect } from "next/navigation";
import Image from "next/image";

export default async function Home() {
  const session = await auth();
  console.log(session);

  if (!session) {
    redirect("/auth/signin");
  }

  return (
    <>
      {/* Navbar */}
      <nav className=" text-black px-6 py-3 flex justify-between items-center shadow-md">
        <div className="flex items-center space-x-3">
          {session.user?.image && (
            <Image
              src={session.user.image}
              alt={session.user.name || "User"}
              width={36}
              height={36}
              className="rounded-full"
            />
          )}
          <span className="font-medium">{session.user?.name}</span>
        </div>

        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/" });
          }}
        >
          <button
            type="submit"
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
          >
            Sign Out
          </button>
        </form>
      </nav>

      {/* Dashboard */}
      <main className="">
        <MarketDataDashboard />
      </main>
    </>
  );
}
