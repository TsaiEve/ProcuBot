import React from 'react';

const Header: React.FC = () => {
    return (
        <header className="flex items-center p-4 bg-surface border-b border-model-bubble/50 shadow-md flex-shrink-0">
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
                Procurement Pro Chat
            </h1>
        </header>
    );
};

export default Header;