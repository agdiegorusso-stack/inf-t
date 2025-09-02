

import React, { useMemo } from 'react';
import { LONG_SHIFTS } from '../constants';
import { ShiftTime, StaffRole, ShiftDefinition } from '../types';
import type { ActiveTab } from '../App';


interface LegendProps {
    activeTab: ActiveTab;
    shiftDefinitions: ShiftDefinition[];
}

const LegendSection: React.FC<{title: string, shifts: ShiftDefinition[]}> = ({ title, shifts }) => {
    if (shifts.length === 0) return null;
    return (
        <div>
            <h4 className="font-semibold text-gray-700 mb-2 mt-4">{title}</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 gap-2 text-xs">
                {shifts.map(shift => (
                    <div key={shift.code} className="flex items-center" title={shift.description}>
                        <span 
                            className={`w-6 h-6 flex items-center justify-center rounded-sm mr-2 font-bold ${!shift.color.startsWith('#') ? shift.color : ''} ${!shift.textColor.startsWith('#') ? shift.textColor : ''}`}
                            style={{ 
                                backgroundColor: shift.color.startsWith('#') ? shift.color : undefined,
                                color: shift.textColor.startsWith('#') ? shift.textColor : undefined
                            }}
                        >
                            {shift.code.replace('_doc', '').substring(0,3)}
                        </span>
                        <span className="truncate">{shift.description}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};


export const Legend: React.FC<LegendProps> = ({ activeTab, shiftDefinitions }) => {

    const relevantShifts = useMemo(() => {
        return shiftDefinitions.filter(shift => {
            if (shift.code === 'UNCOVERED') return false; // Handled separately
            switch(activeTab) {
                case 'nurses':
                    return shift.roles.includes(StaffRole.Nurse) || shift.roles.includes(StaffRole.HeadNurse);
                case 'oss':
                    return shift.roles.includes(StaffRole.OSS);
                case 'doctors':
                    return shift.roles.includes(StaffRole.Doctor);
                default:
                    return false;
            }
        });
    }, [activeTab, shiftDefinitions]);

    const workShifts = relevantShifts.filter(s => 
        s.time !== ShiftTime.Absence && 
        s.time !== ShiftTime.Rest &&
        s.time !== ShiftTime.OffShift &&
        !LONG_SHIFTS.includes(s.code)
    ).sort((a, b) => a.description.localeCompare(b.description));

    const longShifts = relevantShifts.filter(s => LONG_SHIFTS.includes(s.code));
    
    const absenceShifts = shiftDefinitions.filter(s => s.time === ShiftTime.Absence || s.time === ShiftTime.Rest);
    
    return (
        <div className="bg-white p-4 rounded-lg shadow-md h-full">
            <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Legenda Turni</h3>
            <div className="space-y-4 max-h-[80vh] overflow-y-auto pr-2">
                
                <LegendSection title="Turni di Servizio" shifts={workShifts} />

                {longShifts.length > 0 && (
                    <div className="mt-4">
                        <LegendSection title="Turni Lunghi/Speciali" shifts={longShifts} />
                         <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 gap-2 text-xs mt-2">
                             <div className="flex items-center" title="Turno Combinato Mattina + Pomeriggio">
                                <span className={`w-6 h-6 flex items-center justify-center rounded-sm mr-2 font-bold bg-purple-300 text-purple-900`}>
                                    M/P
                                </span>
                                <span className="truncate">Turno Combinato</span>
                            </div>
                        </div>
                    </div>
                )}
                
                <div>
                    <h4 className="font-semibold text-gray-700 mb-2 mt-4">Assenze e Riposi</h4>
                     <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 gap-2 text-xs">
                        {absenceShifts.map(shift => (
                            <div key={shift.code} className="flex items-center" title={shift.description}>
                                <span className={`w-6 h-6 flex items-center justify-center rounded-sm mr-2 font-bold ${shift.color} ${shift.textColor}`}>
                                    {shift.code}
                                </span>
                                 <span className="truncate">{shift.description}</span>
                            </div>
                        ))}
                         <div className="flex items-center" title="Turno Scoperto">
                            <span className="w-6 h-6 flex items-center justify-center rounded-sm mr-2 font-bold bg-red-600 text-white animate-pulse">
                                !
                            </span>
                            <span>Turno Scoperto</span>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};
