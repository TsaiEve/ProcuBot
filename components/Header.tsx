
import React from 'react';
import { Language } from '../types';

interface HeaderProps {
    language: Language;
    setLanguage: (lang: Language) => void;
}

const Header: React.FC<HeaderProps> = ({ language, setLanguage }) => {
    return (
        <header className="flex items-center justify-between p-4 px-6 bg-surface/80 backdrop-blur-md border-b border-border-color sticky top-0 z-20 transition-all duration-300">
            <div className="flex items-center gap-3">
                <div className="bg-gradient-to-br from-user-bubble-start to-user-bubble-end p-2 rounded-lg shadow-lg shadow-blue-500/20">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6 text-white"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                    </svg>
                </div>
                <h1 className="text-xl md:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-slate-600">
                    {language === 'en' ? 'Procurement Pro' : '採購智囊 Pro'}
                </h1>
            </div>
            
            <button
                onClick={() => setLanguage(language === 'en' ? 'zh-TW' : 'en')}
                className="px-4 py-1.5 rounded-full border border-border-color bg-white text-slate-600 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 transition-all text-sm font-semibold shadow-sm"
            >
                {language === 'en' ? '中文' : 'English'}
            </button>
        </header>
    );
};

export default Header;
