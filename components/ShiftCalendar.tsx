import React, { useMemo, useState, useRef, useEffect } from 'react';
import type { Staff, ScheduledShift, ShiftDefinition, Team } from '../types';
import { UNASSIGNED_STAFF_ID } from '../constants';
import { ShiftTime, StaffRole, ContractType } from '../types';
import { getAllowedShifts, isDangerousLongShiftCombination } from '../utils/shiftUtils';
import { RoleAndSquadIcons } from './RoleAndSquadIcons';

interface ShiftCalendarProps {
    currentDate: Date;
    staffList: Staff[];
    scheduledShifts: ScheduledShift[];
    shiftDefinitions: ShiftDefinition[];
    teams: Team[];
    onUncoveredShiftClick: (shift: ScheduledShift) => void;
    currentUser: Staff;
    onUpdateShift: (staffId: string, date: string, newShiftCode: string) => void;
    onOpenStaffDetail: (staff: Staff) => void;
}

interface LongShiftState {
    staffId: string;
    date: string;
    originalShiftCode: string;
    originalShiftTime: ShiftTime;
}

interface ShiftCellProps {
    shift: ScheduledShift | undefined;
    staff: Staff;
    date: string;
    shiftDefinitions: ShiftDefinition[];
    teams: Team[];
    currentUser: Staff;
    onUncoveredShiftClick: (shift: ScheduledShift) => void;
    onUpdateShift: (staffId: string, date: string, newShiftCode: string) => void;
    longShiftState: LongShiftState | null;
    onSetLongShiftState: (state: LongShiftState | null) => void;
}

const ShiftCell: React.FC<ShiftCellProps> = ({ shift, staff, date, shiftDefinitions, teams, currentUser, onUncoveredShiftClick, onUpdateShift, longShiftState, onSetLongShiftState }) => {
    const isHeadNurse = currentUser.role === StaffRole.HeadNurse;
    const isUnassignedShift = shift?.staffId === UNASSIGNED_STAFF_ID;

    if (isUnassignedShift && shift) {
        const canManage = isHeadNurse;
        const shiftDef = shiftDefinitions.find(def => def.code === shift.shiftCode);
        const description = shiftDef ? `${shiftDef.description}` : "Turno Scoperto";

        // Check if this is a dangerous long shift (manually set)
        const isDangerousLongShift = (shift as any).dangerousLongShift === true;

        return (
            <div 
                onClick={() => canManage && onUncoveredShiftClick(shift)} 
                className={`relative w-full h-full flex items-center justify-center text-xs font-bold rounded-sm ${
                    isDangerousLongShift 
                        ? 'bg-red-600 text-white animate-pulse ring-2 ring-yellow-300 ring-opacity-75' 
                        : 'bg-red-600 text-white animate-pulse'
                } ${canManage ? 'cursor-pointer' : 'cursor-default'}`} 
                title={canManage ? `${description} - Clicca per trovare un sostituto.` : description}
            >
                <span>{shift.shiftCode?.replace('_doc', '')}</span>
                {canManage && (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 absolute top-0.5 right-0.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                )}
                {isDangerousLongShift && (
                    <div 
                        className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-ping cursor-pointer"
                        onClick={(e) => {
                            e.stopPropagation();
                            alert("⚠️ ATTENZIONE TURNO LUNGO PERICOLOSO ⚠️\n\nQuesto turno lungo è stato impostato manualmente e potrebbe violare le regole di sicurezza (es. personale di ospedali diversi).");
                        }}
                        title="ATTENZIONE TURNO LUNGO PERICOLOSO - Clicca per dettagli"
                    />
                )}
            </div>
        );
    }

    const isCombinedShift = shift?.shiftCode && shift.shiftCode.includes('/');
    
    const shiftDef = useMemo(() => {
        if (!shift || !shift.shiftCode || isCombinedShift) return null;
        return shiftDefinitions.find(def => def.code === shift.shiftCode);
    }, [shift, isCombinedShift, shiftDefinitions]);
    
    let cellBg = 'bg-gray-50';
    let cellTextColor = 'text-gray-800';
    let cellDescription = 'Nessun turno';
    
    // Check if this is a dangerous long shift combination
    const isDangerousCombination = shift?.shiftCode && isDangerousLongShiftCombination(shift.shiftCode, shiftDefinitions);
    
    if (isCombinedShift) {
        cellBg = isDangerousCombination ? 'bg-red-500' : 'bg-purple-300';
        cellTextColor = isDangerousCombination ? 'text-white' : 'text-purple-900';
        const [code1, code2] = shift.shiftCode!.split('/');
        const def1 = shiftDefinitions.find(d => d.code === code1);
        const def2 = shiftDefinitions.find(d => d.code === code2);
        cellDescription = (def1 && def2) ? `${def1.description} + ${def2.description}` : 'Turno combinato';
    } else if (shiftDef) {
        cellBg = shiftDef.color.startsWith('#') ? '' : shiftDef.color;
        cellTextColor = shiftDef.textColor.startsWith('#') ? '' : shiftDef.textColor;
        cellDescription = shiftDef.description;
    }
    
    const style = {
        backgroundColor: shiftDef?.color.startsWith('#') ? shiftDef.color : undefined,
        color: shiftDef?.textColor.startsWith('#') ? shiftDef.textColor : undefined,
    };

    if (isHeadNurse) {
        const isInLongShiftMode = longShiftState?.staffId === staff.id && longShiftState?.date === date;
        const baseAllowedShifts = getAllowedShifts(staff, shiftDefinitions, teams);

        let finalAllowedShifts = baseAllowedShifts;
        if (isInLongShiftMode && longShiftState) {
            const complementaryTime = longShiftState.originalShiftTime === ShiftTime.Morning 
                ? ShiftTime.Afternoon 
                : ShiftTime.Morning;
            finalAllowedShifts = baseAllowedShifts.filter(def => def.time === complementaryTime);
        }

        const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
            const newShiftCode = e.target.value;
            if (isInLongShiftMode && longShiftState) {
                const combinedCode = longShiftState.originalShiftTime === ShiftTime.Morning
                    ? `${longShiftState.originalShiftCode}/${newShiftCode}`
                    : `${newShiftCode}/${longShiftState.originalShiftCode}`;
                
                onUpdateShift(staff.id, date, combinedCode);
                onSetLongShiftState(null);
            } else {
                onUpdateShift(staff.id, date, newShiftCode);
                onSetLongShiftState(null);
            }
        };

        const selectClasses = `w-full h-full text-xs font-bold rounded-sm cursor-pointer appearance-none text-center border-none focus:ring-2 focus:ring-indigo-500 ${
            isInLongShiftMode ? 'bg-red-200 text-red-800 ring-2 ring-red-500' : `${cellBg} ${cellTextColor}`
        }`;
        
        return (
             <div className="relative w-full h-full flex items-center">
                <select
                    value={shift?.shiftCode || ''}
                    onChange={handleChange}
                    className={selectClasses}
                    style={isInLongShiftMode ? {} : style}
                    title={cellDescription}
                >
                    {isCombinedShift && <option value={shift.shiftCode}>{shift.shiftCode}</option>}
                    <option value="">--</option>
                    {finalAllowedShifts.map(def => (
                        <option key={def.code} value={def.code}>{def.code.replace('_doc', '')}</option>
                    ))}
                </select>
                {isDangerousCombination && (
                    <div 
                        className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-ping cursor-pointer"
                        onClick={(e) => {
                            e.stopPropagation();
                            alert("⚠️ ATTENZIONE TURNO LUNGO PERICOLOSO ⚠️\n\nQuesta combinazione di turni lunghi potrebbe violare le regole di sicurezza (es. personale di ospedali diversi).");
                        }}
                        title="ATTENZIONE TURNO LUNGO PERICOLOSO - Clicca per dettagli"
                    />
                )}
             </div>
        );
    }
    
    if (!shift?.shiftCode) {
        return <div className="h-full w-full bg-gray-50"></div>;
    }

    const cellClasses = `w-full h-full flex items-center justify-center text-xs font-bold rounded-sm ${cellBg} ${cellTextColor}`;
    return (
         <div className={cellClasses} style={style} title={cellDescription}>
            {shift.shiftCode.replace('_doc', '')}
            {isDangerousCombination && (
                <div 
                    className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-ping cursor-pointer"
                    onClick={(e) => {
                        e.stopPropagation();
                        alert("⚠️ ATTENZIONE TURNO LUNGO PERICOLOSO ⚠️\n\nQuesta combinazione di turni lunghi potrebbe violare le regole di sicurezza (es. personale di ospedali diversi).");
                    }}
                    title="ATTENZIONE TURNO LUNGO PERICOLOSO - Clicca per dettagli"
                />
            )}
        </div>
    );
};


export const ShiftCalendar: React.FC<ShiftCalendarProps> = ({ currentDate, staffList, scheduledShifts, shiftDefinitions, teams, onUncoveredShiftClick, currentUser, onUpdateShift, onOpenStaffDetail }) => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const [longShiftState, setLongShiftState] = useState<LongShiftState | null>(null);
    const [activeCell, setActiveCell] = useState<{ staffId: string; date: string } | null>(null);
    const calendarRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
                setActiveCell(null);
                setLongShiftState(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const days = Array.from({ length: daysInMonth }, (_, i) => {
        const date = new Date(year, month, i + 1);
        return {
            dayOfMonth: i + 1,
            dayOfWeek: date.toLocaleDateString('it-IT', { weekday: 'short' }),
            isWeekend: date.getDay() === 0 || date.getDay() === 6,
        };
    });

    const sortedStaff = useMemo(() => {
        // Custom sorting logic based on user request for nurse view
        const getGroupPriority = (staff: Staff): number => {
            if (staff.role === StaffRole.HeadNurse) return 1;
            if (staff.contract === ContractType.H6) return 2;
            if (staff.contract === ContractType.H12) return 3;
            if (staff.contract === ContractType.H24) return 4;
            // Fallback for other roles if they appear in the list
            if (staff.role === StaffRole.Doctor) return 5;
            if (staff.role === StaffRole.OSS) return 6;
            return 99;
        };

        return [...staffList]
            .filter(s => s.id !== UNASSIGNED_STAFF_ID)
            .sort((a, b) => {
                const priorityA = getGroupPriority(a);
                const priorityB = getGroupPriority(b);
        
                if (priorityA !== priorityB) {
                    return priorityA - priorityB;
                }
        
                // Within H24 group, sort by squad then by name
                if (priorityA === 4) { // This means both are H24
                    const squadA = a.nightSquad || 99; // Staff without a squad go to the end
                    const squadB = b.nightSquad || 99;
                    if (squadA !== squadB) {
                        return squadA - squadB;
                    }
                }
                
                // For all other groups, and within H24 squads, sort by name
                return a.name.localeCompare(b.name);
            });
    }, [staffList]);
    
    const unassignedStaff = staffList.find(s => s.id === UNASSIGNED_STAFF_ID);

    const handleUpdateAndDeselect = (staffId: string, date: string, newShiftCode: string) => {
        onUpdateShift(staffId, date, newShiftCode);
        setActiveCell(null);
    };

    return (
        <div ref={calendarRef} className="bg-white p-4 rounded-lg shadow-md overflow-x-auto">
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
                                className="sticky left-0 bg-white z-10 p-2 text-sm font-medium text-gray-800 border-t border-gray-200 flex items-center justify-between space-x-2 truncate cursor-pointer hover:bg-gray-100 transition-colors"
                                title={`${staff.name} - Clicca per gestire`}
                                onClick={() => onOpenStaffDetail(staff)}
                            >
                                <span className="truncate">{staff.name}</span>
                                <RoleAndSquadIcons staff={staff} />
                            </div>
                            {days.map(day => {
                                const dateStr = `${year}-${(month + 1).toString().padStart(2, '0')}-${day.dayOfMonth.toString().padStart(2, '0')}`;
                                const shift = scheduledShifts.find(s => s.staffId === staff.id && s.date === dateStr);
                                const isCellActive = activeCell?.staffId === staff.id && activeCell?.date === dateStr;
                                const isHeadNurse = currentUser.role === StaffRole.HeadNurse;
                                
                                const shiftDef = shift?.shiftCode && !shift.shiftCode.includes('/') 
                                    ? shiftDefinitions.find(def => def.code === shift.shiftCode) 
                                    : null;

                                const isInLongShiftMode = longShiftState?.staffId === staff.id && longShiftState?.date === dateStr;

                                const canStartLongShift = isHeadNurse && !isInLongShiftMode && shift?.shiftCode && shiftDef &&
                                    (shiftDef.time === ShiftTime.Morning || shiftDef.time === ShiftTime.Afternoon) &&
                                    (staff.contract === ContractType.H12 || staff.contract === ContractType.H24);
                                
                                return (
                                    <div 
                                        key={`${staff.id}-${day.dayOfMonth}`} 
                                        className={`relative border-t border-gray-200 h-10 ${day.isWeekend ? 'bg-blue-50/50' : ''}`}
                                        onClick={() => {
                                            if (isHeadNurse && staff.id !== UNASSIGNED_STAFF_ID) {
                                                setActiveCell(isCellActive ? null : { staffId: staff.id, date: dateStr });
                                            }
                                        }}
                                    >
                                        <ShiftCell 
                                            shift={shift}
                                            staff={staff}
                                            date={dateStr}
                                            shiftDefinitions={shiftDefinitions}
                                            teams={teams}
                                            currentUser={currentUser}
                                            onUncoveredShiftClick={onUncoveredShiftClick}
                                            onUpdateShift={handleUpdateAndDeselect}
                                            longShiftState={longShiftState}
                                            onSetLongShiftState={setLongShiftState}
                                        />
                                        {isCellActive && canStartLongShift && (
                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (shiftDef) {
                                                        setLongShiftState({
                                                            staffId: staff.id,
                                                            date: dateStr,
                                                            originalShiftCode: shiftDef.code,
                                                            originalShiftTime: shiftDef.time,
                                                        });
                                                    }
                                                }}
                                                className="absolute left-full top-1/2 -translate-y-1/2 ml-1 z-20 w-6 h-6 bg-red-500 text-white text-sm font-bold rounded-full flex items-center justify-center hover:bg-red-600 shadow-lg"
                                                title="Imposta turno lungo"
                                            >
                                                L
                                            </button>
                                        )}
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
                                                    teams={teams}
                                                    currentUser={currentUser}
                                                    onUncoveredShiftClick={onUncoveredShiftClick}
                                                    onUpdateShift={onUpdateShift}
                                                    longShiftState={longShiftState}
                                                    onSetLongShiftState={setLongShiftState}
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