
import React from 'react';
import { Language } from '../types';

interface HeaderProps {
    language: Language;
    setLanguage: (lang: Language) => void;
}

const Header: React.FC<HeaderProps> = ({ language, setLanguage }) => {
    return (
        <header className="flex items-center justify-between p-4 bg-surface border-b border-model-bubble/50 shadow-md flex-shrink-0 z-10">
            <div className="flex items-center">
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-8 w-8 text-accent mr-3"
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
                <h1 className="text-xl md:text-2xl font-bold text-text-primary">
                    {language === 'en' ? 'Procurement Pro Chat' : '採購專家 Pro Chat'}
                </h1>
            </div>
            
            <button
                onClick={() => setLanguage(language === 'en' ? 'zh-TW' : 'en')}
                className="px-3 py-1 rounded border border-model-bubble bg-background text-text-primary hover:bg-model-bubble transition-colors text-sm font-medium"
            >
                {language === 'en' ? '中文' : 'English'}
            </button>
        </header>
    );
};

export default Header;
