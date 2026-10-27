import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';

export const Layout = () => {
  return (
    <div className="min-h-screen bg-[#000000] text-[#E1DCC9] flex flex-col font-sans selection:bg-[#412D15] selection:text-[#E1DCC9]">
      <Navbar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-gradient-to-b from-[#000000] via-[#1F150C]/20 to-[#000000]">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
