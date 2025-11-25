"use client";

import SearchBar from "./SearchBar";
import UserMenu from "./UserMenu";

import { MdSpaceDashboard, MdNotifications } from "react-icons/md";
import { FaFolder, FaPlus } from "react-icons/fa";

interface User {
  id: number;
  username: string;
  email: string;
}

interface NavbarProps {
  user?: User | null;
}

export default function Navbar({ user }: NavbarProps) {
  return (
    <nav className="bg-[#50589C] text-white px-6 md:px-4 py-3 fixed top-0 left-0 w-full z-50">
      <div className="container reactive mx-auto h-auto max-w-[1900px] flex items-center justify-between">
        {/* Left side - App name and navigation */}
        <div className="flex items-center space-x-5 md:space-x-20 text-lg md:text-md">
          <a href="/overview" className="font-semibold">
            MyDaily
          </a>

          {/* Navigation Links */}
          <ul className="hidden gap-8 md:flex md:flex-row">
            <li className="flex items-center">
              <a
                href="/dashboard"
                className="flex flex-row gap-1 items-center hover:text-[#F2AEBB]"
              >
                <MdSpaceDashboard size={20} />
                <div>Dashboard</div>
              </a>
            </li>
            <li className="flex items-center">
              <a
                href="/overview"
                className="flex flex-row gap-1 items-center hover:text-[#F2AEBB]"
              >
                <FaFolder size={20} />
                <div>overview</div>
              </a>
            </li>
          </ul>
        </div>

        {/* Center - Search bar */}
        <div className="hidden md:inline flex-1 max-w-xl md:mx-10 mr-6">
          <SearchBar />
        </div>

        {/* Right side - Actions */}
        <div className="flex flex-row justify-end items-center md:space-x-6">
          {/* Create project button */}
          <a href="/create-project" className="hidden md:flex flex-row justify-center items-center gap-2 p-1 px-2 hover:bg-[#F2AEBB] rounded-lg transition-colors relative">
            <FaPlus size={20} />
            <div className="hidden md:flex">New</div>
          </a>

          <button className="hidden md:flex p-1 hover:bg-[#F2AEBB] rounded-lg transition-colors relative">
            <MdNotifications size={25} />
            {/* Notification badge */}
            <span className="absolute -top-0 -right-0 bg-red-500 text-xs rounded-full h-4 w-4 flex items-center justify-center">
              0
            </span>
          </button>

          {/* User Profile - pass initial user data */}
          <UserMenu initialUser={user} />
        </div>
      </div>
    </nav>
  );
}
