

import React, { useMemo } from 'react';
import type { Staff, ScheduledShift, ShiftDefinition } from '../types';
import { UNASSIGNED_STAFF_ID } from '../constants';
import { ShiftTime, StaffRole, ContractType } from '../types';
import { getAllowedShifts } from '../utils/shiftUtils';

interface ShiftCalendarProps {
    currentDate: Date;
    staffList: Staff[];
    scheduledShifts: ScheduledShift[];
    shiftDefinitions: ShiftDefinition[];
    onUncoveredShiftClick: (shift: ScheduledShift) => void;
    currentUser: Staff;
    onUpdateShift: (staffId: string, date: string, newShiftCode: string) => void;
}

interface ShiftCellProps {
    shift: ScheduledShift | undefined;
    staff: Staff;
    date: string;
    shiftDefinitions: ShiftDefinition[];
    currentUser: Staff;
    onUncoveredShiftClick: (shift: ScheduledShift) => void;
    onUpdateShift: (staffId: string, date: string, newShiftCode: string) => void;
}

const ShiftCell: React.FC<ShiftCellProps> = ({ shift, staff, date, shiftDefinitions, currentUser, onUncoveredShiftClick, onUpdateShift }) => {
    const isHeadNurse = currentUser.role === StaffRole.HeadNurse;
    const isUnassignedShift = shift?.staffId === UNASSIGNED_STAFF_ID;

    // Special rendering for uncovered shifts in the "Turni Scoperti" row, which is a unique UI element
    if (isUnassignedShift && shift) {
        const canManage = isHeadNurse;
        const shiftDef = shiftDefinitions.find(def => def.code === shift.shiftCode);
        const description = shiftDef ? `${shiftDef.description}` : "Turno Scoperto";

        return (
            <div 
                onClick={() => canManage && onUncoveredShiftClick(shift)} 
                className={`relative w-full h-full flex items-center justify-center text-xs font-bold rounded-sm bg-red-600 text-white animate-pulse ${canManage ? 'cursor-pointer' : 'cursor-default'}`} 
                title={canManage ? `${description} - Clicca per trovare un sostituto.` : description}
            >
                <span>{shift.shiftCode?.replace('_doc', '')}</span>
                {canManage && (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 absolute top-0.5 right-0.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                )}
            </div>
        );
    }

    // For regular staff rows:
    const isCombinedShift = shift?.shiftCode && shift.shiftCode.includes('/');
    
    const shiftDef = useMemo(() => {
        if (!shift || !shift.shiftCode || isCombinedShift) return null;
        return shiftDefinitions.find(def => def.code === shift.shiftCode);
    }, [shift, isCombinedShift, shiftDefinitions]);
    
    let cellBg = 'bg-gray-50';
    let cellTextColor = 'text-gray-800';
    let cellDescription = 'Nessun turno';
    
    if (isCombinedShift) {
        cellBg = 'bg-purple-300';
        cellTextColor = 'text-purple-900';
        const [code1, code2] = shift.shiftCode!.split('/');
        const def1 = shiftDefinitions.find(d => d.code === code1);
        const def2 = shiftDefinitions.find(d => d.code === code2);
        cellDescription = (def1 && def2) ? `${def1.description} + ${def2.description}` : 'Turno combinato';
    } else if (shiftDef) {
        cellBg = shiftDef.color.startsWith('#') ? '' : shiftDef.color; // Handle hex colors
        cellTextColor = shiftDef.textColor.startsWith('#') ? '' : shiftDef.textColor;
        cellDescription = shiftDef.description;
    }
    
    const style = {
        backgroundColor: shiftDef?.color.startsWith('#') ? shiftDef.color : undefined,
        color: shiftDef?.textColor.startsWith('#') ? shiftDef.textColor : undefined,
    };


    // Head Nurse: Editable dropdown for everyone
    if (isHeadNurse) {
        const allowedShifts = getAllowedShifts(staff, shiftDefinitions);
        const selectClasses = `w-full h-full text-xs font-bold rounded-sm cursor-pointer appearance-none text-center border-none focus:ring-2 focus:ring-indigo-500 ${cellBg} ${cellTextColor}`;
        
        return (
            <select
                value={shift?.shiftCode || ''}
                onChange={(e) => onUpdateShift(staff.id, date, e.target.value)}
                className={selectClasses}
                style={style}
                title={cellDescription}
            >
                {/* If the current shift is a combined one, add it as a special option so it's displayed correctly */}
                {isCombinedShift && <option value={shift.shiftCode}>{shift.shiftCode}</option>}
                <option value="">--</option>
                {allowedShifts.map(def => (
                    <option key={def.code} value={def.code}>{def.code.replace('_doc', '')}</option>
                ))}
            </select>
        );
    }
    
    // Regular User: Static view
    if (!shift?.shiftCode) {
        return <div className="h-full w-full bg-gray-50"></div>;
    }

    const cellClasses = `w-full h-full flex items-center justify-center text-xs font-bold rounded-sm ${cellBg} ${cellTextColor}`;
    return (
         <div className={cellClasses} style={style} title={cellDescription}>
            {shift.shiftCode.replace('_doc', '')}
        </div>
    );
};


export const ShiftCalendar: React.FC<ShiftCalendarProps> = ({ currentDate, staffList, scheduledShifts, shiftDefinitions, onUncoveredShiftClick, currentUser, onUpdateShift }) => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days = Array.from({ length: daysInMonth }, (_, i) => {
        const date = new Date(year, month, i + 1);
        return {
            dayOfMonth: i + 1,
            dayOfWeek: date.toLocaleDateString('it-IT', { weekday: 'short' }),
            isWeekend: date.getDay() === 0 || date.getDay() === 6,
        };
    });

    const sortedStaff = useMemo(() => {
        const roleOrder: Record<StaffRole, number> = {
            [StaffRole.HeadNurse]: 1,
            [StaffRole.Nurse]: 2,
            [StaffRole.Doctor]: 3,
            [StaffRole.OSS]: 4,
        };
        
        return [...staffList]
            .filter(s => s.id !== UNASSIGNED_STAFF_ID) // Filter out unassigned first
            .sort((a, b) => {
                const orderA = roleOrder[a.role] ?? 99;
                const orderB = roleOrder[b.role] ?? 99;
                
                if (orderA !== orderB) {
                    return orderA - orderB;
                }
                
                // Secondary sort by name if roles are the same
                return a.name.localeCompare(b.name);
            });
    }, [staffList]);
    
    const unassignedStaff = staffList.find(s => s.id === UNASSIGNED_STAFF_ID);

    return (
        <div className="bg-white p-4 rounded-lg shadow-md overflow-x-auto">
            <div className="min-w-[1200px]">
                <div 
                    className="grid gap-px"
                    style={{ gridTemplateColumns: `150px repeat(${daysInMonth}, minmax(40px, 1fr))` }}
                >
                    {/* Header Row */}
                    <div className="sticky left-0 bg-gray-100 z-30 p-2 text-sm font-semibold text-gray-700 flex items-center justify-center rounded-tl-md">Personale</div>
                    {days.map(day => (
                        <div key={day.dayOfMonth} className={`p-1 text-center font-semibold text-xs sticky top-0 z-20 ${day.isWeekend ? 'text-blue-600 bg-blue-50' : 'text-gray-600 bg-gray-50'}`}>
                            <div>{day.dayOfWeek}</div>
                            <div>{day.dayOfMonth}</div>
                        </div>
                    ))}

                    {/* Staff Rows */}
                    {sortedStaff.map(staff => (
                        <React.Fragment key={staff.id}>
                            <div 
                                className="sticky left-0 bg-white z-10 p-2 text-sm font-medium text-gray-800 border-t border-gray-200 flex items-center truncate"
                                title={staff.name}
                            >
                                {staff.name}
                            </div>
                            {days.map(day => {
                                const dateStr = `${year}-${(month + 1).toString().padStart(2, '0')}-${day.dayOfMonth.toString().padStart(2, '0')}`;
                                const shift = scheduledShifts.find(s => s.staffId === staff.id && s.date === dateStr);
                                
                                return (
                                    <div key={`${staff.id}-${day.dayOfMonth}`} className={`border-t border-gray-200 h-10 ${day.isWeekend ? 'bg-blue-50/50' : ''}`}>
                                        <ShiftCell 
                                            shift={shift}
                                            staff={staff}
                                            date={dateStr}
                                            shiftDefinitions={shiftDefinitions}
                                            currentUser={currentUser}
                                            onUncoveredShiftClick={onUncoveredShiftClick}
                                            onUpdateShift={onUpdateShift}
                                        />
                                    </div>
                                );
                            })}
                        </React.Fragment>
                    ))}

                    {/* Unassigned Shifts Row */}
                    {unassignedStaff && (
                         <React.Fragment key={unassignedStaff.id}>
                            <div className="sticky left-0 bg-red-100 z-10 p-2 text-sm font-bold text-red-700 border-t-4 border-red-300 flex items-center truncate" title={unassignedStaff.name}>
                                {unassignedStaff.name}
                            </div>
                            {days.map(day => {
                                const dateStr = `${year}-${(month + 1).toString().padStart(2, '0')}-${day.dayOfMonth.toString().padStart(2, '0')}`;
                                // Find all unassigned shifts for the day to display them
                                const unassignedShiftsForDay = scheduledShifts.filter(s => s.staffId === unassignedStaff.id && s.date === dateStr);
                                
                                return (
                                    <div key={`${unassignedStaff.id}-${day.dayOfMonth}`} className={`border-t-4 border-red-300 h-10 p-0.5 flex flex-wrap gap-0.5 items-center justify-center ${day.isWeekend ? 'bg-blue-50/50' : ''}`}>
                                       {unassignedShiftsForDay.map(shift => (
                                            <div key={shift.id} className="flex-shrink-0 h-full flex-grow basis-0">
                                                <ShiftCell 
                                                    shift={shift}
                                                    staff={unassignedStaff}
                                                    date={dateStr}
                                                    shiftDefinitions={shiftDefinitions}
                                                    currentUser={currentUser}
                                                    onUncoveredShiftClick={onUncoveredShiftClick}
                                                    onUpdateShift={onUpdateShift}
                                                />
                                            </div>
                                       ))}
                                    </div>
                                );
                            })}
                        </React.Fragment>
                    )}
                </div>
            </div>
        </div>
    );
};
