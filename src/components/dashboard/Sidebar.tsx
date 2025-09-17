// components/dashboard/Sidebar.tsx
"use client";

import {
  Calendar,
  Droplets,
  Heart,
  Home,
  Pill,
  Weight
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Blood Sugar', href: '/dashboard/blood-sugar', icon: Droplets },
  { name: 'Blood Pressure', href: '/dashboard/blood-pressure', icon: Heart },
  { name: 'Medications', href: '/dashboard/medications', icon: Pill },
  { name: 'Weight', href: '/dashboard/weight', icon: Weight },
  // { name: 'Reports', href: '/dashboard/reports', icon: BarChart3 },
  // { name: 'Settings', href: '/dashboard/settings', icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="hidden md:flex md:w-64 md:flex-col">
      <div className="flex flex-col flex-grow pt-5 overflow-y-auto bg-indigo-700">
        <div className="flex items-center flex-shrink-0 px-4">
          <Calendar className="h-8 w-8 text-white mr-2" />
          <h1 className="text-xl font-bold text-white">Health Dashboard</h1>
        </div>
        <div className="mt-5 flex-1 flex flex-col">
          <nav className="flex-1 px-2 pb-4 space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                    isActive
                      ? 'bg-indigo-800 text-white'
                      : 'text-indigo-100 hover:bg-indigo-600'
                  }`}
                >
                  <Icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </div>
  );
}