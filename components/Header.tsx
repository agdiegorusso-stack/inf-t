import React from 'react';
import type { Staff } from '../types';

interface HeaderProps {
    currentUser: Staff;
    onLogout: () => void;
    onNavigate: (view: 'calendar' | 'planner' | 'personnel') => void;
    currentView: 'calendar' | 'planner' | 'personnel';
}

const viewTitles: Record<HeaderProps['currentView'], string> = {
    calendar: 'Gestione Turni Ospedalieri',
    planner: 'Pianificazione Automatica',
    personnel: 'Gestione Personale'
};

export const Header: React.FC<HeaderProps> = ({ currentUser, onLogout, onNavigate, currentView }) => {
    return (
        <header className="bg-white shadow-md">
            <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-20">
                    <div className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 text-blue-600">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                        </svg>
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 ml-3">
                           {viewTitles[currentView]}
                        </h1>
                    </div>
                    <div className="flex items-center space-x-4">
                        {currentView !== 'calendar' && (
                             <button onClick={() => onNavigate('calendar')} className="flex items-center px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-4 h-4 mr-2">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                </svg>
                                Torna al Calendario
                            </button>
                        )}
                        <div className="text-right">
                            <p className="text-sm font-medium text-gray-800">{currentUser.name}</p>
                            <p className="text-xs text-gray-500">{currentUser.role}</p>
                        </div>
                         <button onClick={onLogout} className="flex items-center px-3 py-2 bg-red-500 text-white rounded-lg shadow-sm hover:bg-red-600 transition-colors focus:outline-none focus:ring-2 focus:ring-red-400">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            <span className="ml-2 hidden sm:inline">Logout</span>
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
};