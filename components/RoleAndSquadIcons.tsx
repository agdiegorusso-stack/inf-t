
import React from 'react';
import type { Staff } from '../types';
import { StaffRole, ContractType } from '../types';

interface RoleAndSquadIconsProps {
    staff: Staff;
}

const RoleIcon: React.FC<{ role: StaffRole }> = ({ role }) => {
    switch (role) {
        case StaffRole.HeadNurse:
            return (
                // FIX: Replaced title attribute with <title> element for SVG accessibility.
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-amber-500" viewBox="0 0 20 20" fill="currentColor">
                    <title>Caposala</title>
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
            );
        case StaffRole.Nurse:
            return (
                // FIX: Replaced title attribute with <title> element for SVG accessibility.
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                    <title>Infermiere</title>
                    <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                </svg>
            );
        case StaffRole.OSS:
            return (
                // FIX: Replaced title attribute with <title> element for SVG accessibility.
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                    <title>OSS</title>
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
            );
        case StaffRole.Doctor:
            return (
                // FIX: Replaced title attribute with <title> element for SVG accessibility.
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                    <title>Medico</title>
                    <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.342.117l8.688 4.344a1 1 0 001.246-1.51L12.5 9.051a.999.999 0 01-.342-.117l-8.688-4.344a1 1 0 00-.472-1.002L10.394 2.08z" />
                    <path d="M3.5 9.472l5 2.5a1 1 0 001.246-1.51L6.5 8.528V14a1 1 0 00.904.997l6.5 1a1 1 0 001.096-.997V8.528l-2.246 1.123a1 1 0 00-1.246 1.51l5-2.5a1 1 0 000-1.84l-7-3a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84z" />
                </svg>
            );
        default:
            return null;
    }
};

const SquadIcon: React.FC<{ squad: number }> = ({ squad }) => {
    const colors = [
        'bg-slate-400 text-slate-800', // default/0
        'bg-red-200 text-red-800', // 1
        'bg-blue-200 text-blue-800', // 2
        'bg-green-200 text-green-800', // 3
        'bg-yellow-200 text-yellow-800', // 4
        'bg-purple-200 text-purple-800' // 5
    ];
    const colorClass = colors[squad] || colors[0];

    return (
        <div className={`w-4 h-4 rounded-full flex items-center justify-center text-xs font-bold ${colorClass}`} title={`Squadra ${squad}`}>
            {squad}
        </div>
    );
};

export const RoleAndSquadIcons: React.FC<RoleAndSquadIconsProps> = ({ staff }) => {
    return (
        <div className="flex items-center space-x-1.5 flex-shrink-0" aria-hidden="true">
            <RoleIcon role={staff.role} />
            {staff.contract === ContractType.H24 && staff.nightSquad ? (
                <SquadIcon squad={staff.nightSquad} />
            ) : null}
        </div>
    );
};
