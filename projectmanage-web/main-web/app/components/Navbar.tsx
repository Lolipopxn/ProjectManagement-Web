'use client';

import SearchBar from './SearchBar';
import UserMenu from './UserMenu';

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
    <nav className="bg-blue-600 text-white px-4 py-3 shadow-lg">
      <div className="flex items-center justify-between">
        {/* Left side - App name and navigation */}
        <div className="flex items-center space-x-6">
          <h1 className="text-xl font-semibold">Project Management</h1>
          
          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-4">
            <a 
              href="/dashboard"
              className="px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-500 transition-colors"
            >
              📊 Dashboard
            </a>
            <a 
              href="/overview"
              className="px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-500 transition-colors"
            >
              📁 Projects
            </a>
          </div>
        </div>

        {/* Center - Search bar */}
        <div className="flex-1 max-w-xl mx-8">
          <SearchBar />
        </div>

        {/* Right side - Actions */}
        <div className="flex items-center space-x-4">
          <button className="p-2 hover:bg-blue-500 rounded-lg transition-colors relative">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5z" />
            </svg>
            {/* Notification badge */}
            <span className="absolute -top-1 -right-1 bg-red-500 text-xs rounded-full h-5 w-5 flex items-center justify-center">
              3
            </span>
          </button>
          
          <button className="p-2 hover:bg-blue-500 rounded-lg transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          
          {/* User Profile - pass initial user data */}
          <UserMenu initialUser={user} />
        </div>
      </div>
    </nav>
  );
}
