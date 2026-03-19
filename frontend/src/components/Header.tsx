import React from 'react';
import { Sparkles, Shirt } from 'lucide-react';

const Header: React.FC = () => {
  return (
    <header className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-pink-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-pink-500 p-2 rounded-lg text-white">
            <Shirt size={20} />
          </div>
          <h1 className="text-xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
            Fashion Studio
          </h1>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-sm text-gray-500">
          <Sparkles size={16} className="text-yellow-500" />
          <span>Powered by Gemini AI</span>
        </div>
      </div>
    </header>
  );
};

export default Header;
