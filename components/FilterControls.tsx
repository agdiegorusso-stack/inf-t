
import React from 'react';
import type { ScheduledShift, Staff } from '../types';
import { StaffRole } from '../types';

interface FilterControlsProps {
    currentDate: Date;
    onDateChange: (date: Date) => void;
    onAddAbsenceClick: () => void;
    scheduledShifts: ScheduledShift[];
    staff: Staff[];
    currentUser: Staff;
    onManagePersonnelClick: () => void;
}

export const FilterControls: React.FC<FilterControlsProps> = ({ currentDate, onDateChange, onAddAbsenceClick, scheduledShifts, staff, currentUser, onManagePersonnelClick }) => {
    
    const changeMonth = (offset: number) => {
        const newDate = new Date(currentDate);
        newDate.setMonth(currentDate.getMonth() + offset);
        onDateChange(newDate);
    };

    const downloadCSV = () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        
        let csvContent = "data:text/csv;charset=utf-8,Personale,";
        const headers = Array.from({length: daysInMonth}, (_, i) => `${i + 1}`).join(',');
        csvContent += headers + "\r\n";

        staff.forEach(person => {
            let row = person.name + ",";
            const shifts = [];
            for(let i=1; i<=daysInMonth; i++) {
                const dateStr = `${year}-${(month + 1).toString().padStart(2, '0')}-${i.toString().padStart(2, '0')}`;
                const shift = scheduledShifts.find(s => s.staffId === person.id && s.date === dateStr);
                shifts.push(shift?.shiftCode || '');
            }
            row += shifts.join(',');
            csvContent += row + "\r\n";
        });
        
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `turni_${currentDate.toLocaleString('default', { month: 'long' })}_${year}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    return (
        <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-2">
                <button onClick={() => changeMonth(-1)} className="p-2 rounded-md hover:bg-gray-200 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                </button>
                <span className="text-xl font-semibold text-gray-700 w-48 text-center capitalize">
                    {currentDate.toLocaleString('it-IT', { month: 'long', year: 'numeric' })}
                </span>
                <button onClick={() => changeMonth(1)} className="p-2 rounded-md hover:bg-gray-200 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                </button>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
                 {currentUser.role === StaffRole.HeadNurse && (
                    <button 
                        onClick={onManagePersonnelClick}
                        className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg shadow-sm hover:bg-purple-700 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M15 21v-1a6 6 0 00-5.176-5.97M15 21h3.75a2.25 2.25 0 002.25-2.25V18a2.25 2.25 0 00-2.25-2.25H15m-1.47-5.558a3 3 0 014.94 0 3 3 0 014.94 0 3 3 0 01-5.834 1.994M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Gestisci Personale
                    </button>
                 )}
                <button 
                    onClick={onAddAbsenceClick}
                    className="flex items-center px-4 py-2 bg-yellow-500 text-white rounded-lg shadow-sm hover:bg-yellow-600 transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Segnala Assenza
                </button>
                <button 
                    onClick={downloadCSV}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg shadow-sm hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500">
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download
                </button>
            </div>
        </div>
    );
};