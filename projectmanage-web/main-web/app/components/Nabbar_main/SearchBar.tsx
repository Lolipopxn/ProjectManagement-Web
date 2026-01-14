'use client';

import { useState } from 'react';

export default function SearchBar() {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Searching for:', searchQuery);
  };

  return (
    <form onSubmit={handleSearch} className="relative">
      <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      <input
        type="text"
        placeholder="ค้นหาโปรเจ็กต์, งาน, หรือสมาชิก..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="w-full pl-10 pr-4 py-2 rounded-[16px] bg-[#6972c3] text-sm text-white placeholder-white focus:outline-none"
      />
    </form>
  );
}
