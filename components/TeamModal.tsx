
import React, { useState, useEffect, useMemo } from 'react';
import type { Team, Staff, ShiftDefinition } from '../types';
import { Location, StaffRole, ShiftTime } from '../types';
import { UNASSIGNED_STAFF_ID } from '../constants';

interface TeamModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (teamData: Omit<Team, 'id'>, memberIds: string[]) => void;
    existingTeam: Team | null;
    allTeams: Team[];
    staffList: Staff[];
    shiftDefinitions: ShiftDefinition[];
}

export const TeamModal: React.FC<TeamModalProps> = ({ isOpen, onClose, onSave, existingTeam, allTeams, staffList, shiftDefinitions }) => {
    const [name, setName] = useState('');
    const [selectedLocations, setSelectedLocations] = useState<Location[]>([]);
    const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
    const [selectedShiftCodes, setSelectedShiftCodes] = useState<string[]>([]);
    const [error, setError] = useState('');

    useEffect(() => {
        if (existingTeam) {
            setName(existingTeam.name);
            setSelectedLocations(existingTeam.locations);
            setSelectedShiftCodes(existingTeam.allowedShiftCodes || []);
            const currentMemberIds = staffList
                .filter(s => s.teamIds?.includes(existingTeam.id))
                .map(s => s.id);
            setSelectedMemberIds(currentMemberIds);
        } else {
            setName('');
            setSelectedLocations([]);
            setSelectedMemberIds([]);
            setSelectedShiftCodes([]);
        }
        setError('');
    }, [existingTeam, isOpen, staffList]);

    const shiftsByLocation = useMemo(() => {
        const grouped = new Map<Location, ShiftDefinition[]>();
        const workShifts = shiftDefinitions.filter(s => 
            s.time !== ShiftTime.Absence && 
            s.time !== ShiftTime.Rest && 
            s.time !== ShiftTime.OffShift
        ).sort((a,b) => a.description.localeCompare(b.description));

        for (const shift of workShifts) {
            if (!grouped.has(shift.location)) {
                grouped.set(shift.location, []);
            }
            grouped.get(shift.location)!.push(shift);
        }
        return Array.from(grouped.entries()).sort((a,b) => a[0].localeCompare(b[0]));
    }, [shiftDefinitions]);


    const handleLocationToggle = (location: Location) => {
        const isAdding = !selectedLocations.includes(location);

        if (!isAdding) {
            // Se si rimuove una sede, deselezionare anche i turni associati
            const shiftsInLocation = shiftsByLocation
                .find(([loc, _]) => loc === location)?.[1]
                .map(s => s.code) || [];
            
            setSelectedShiftCodes(prev => prev.filter(code => !shiftsInLocation.includes(code)));
        }

        setSelectedLocations(prev =>
            isAdding
                ? [...prev, location]
                : prev.filter(l => l !== location)
        );
    };

    const handleMemberToggle = (staffId: string) => {
        setSelectedMemberIds(prev =>
            prev.includes(staffId)
                ? prev.filter(id => id !== staffId)
                : [...prev, staffId]
        );
    };

    const handleShiftToggle = (shiftCode: string) => {
        setSelectedShiftCodes(prev =>
            prev.includes(shiftCode)
                ? prev.filter(code => code !== shiftCode)
                : [...prev, shiftCode]
        );
    };

    const staffByRole = useMemo(() => {
        const grouped: Record<string, Staff[]> = {
            [StaffRole.HeadNurse]: [],
            [StaffRole.Nurse]: [],
            [StaffRole.OSS]: [],
            [StaffRole.Doctor]: [],
        };

        staffList.forEach(staff => {
            if (staff.id !== UNASSIGNED_STAFF_ID && grouped[staff.role]) {
                 grouped[staff.role].push(staff);
            }
        });

        const nurses = [...grouped[StaffRole.HeadNurse].sort((a, b) => a.name.localeCompare(b.name)), ...grouped[StaffRole.Nurse].sort((a, b) => a.name.localeCompare(b.name))];
        
        return {
            nurses,
            oss: grouped[StaffRole.OSS].sort((a, b) => a.name.localeCompare(b.name)),
            doctors: grouped[StaffRole.Doctor].sort((a, b) => a.name.localeCompare(b.name)),
        };
    }, [staffList]);
    
    const availableShiftsByLocation = useMemo(() => {
        return shiftsByLocation.filter(([location, _]) => 
            selectedLocations.includes(location)
        );
    }, [shiftsByLocation, selectedLocations]);


    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        const trimmedName = name.trim();

        if (!trimmedName) {
            setError('Il nome del team è obbligatorio.');
            return;
        }

        const isDuplicate = allTeams.some(
            team => team.name.toLowerCase() === trimmedName.toLowerCase() && team.id !== existingTeam?.id
        );

        if (isDuplicate) {
            setError('Esiste già un team con questo nome.');
            return;
        }

        if (selectedLocations.length === 0) {
            setError('Seleziona almeno una sede di competenza.');
            return;
        }

        onSave({ name: trimmedName, locations: selectedLocations, allowedShiftCodes: selectedShiftCodes }, selectedMemberIds);
    };

    if (!isOpen) return null;

    const StaffCheckboxList: React.FC<{title: string, staff: Staff[]}> = ({ title, staff }) => (
        <div>
            <h4 className="font-semibold text-gray-600 mb-2 mt-3 sticky top-0 bg-gray-50 py-1">{title}</h4>
            <div className="space-y-2">
                {staff.map(person => (
                     <div key={person.id} className="flex items-center">
                        <input
                            type="checkbox"
                            id={`member-${person.id}`}
                            checked={selectedMemberIds.includes(person.id)}
                            onChange={() => handleMemberToggle(person.id)}
                            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <label htmlFor={`member-${person.id}`} className="ml-2 text-sm text-gray-700">{person.name}</label>
                    </div>
                ))}
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-2xl p-6 sm:p-8 w-full max-w-5xl transform transition-all" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">
                        {existingTeam ? 'Modifica Team' : 'Nuovo Team'}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                {error && <p className="text-red-500 bg-red-100 p-3 rounded-md mb-4 text-sm">{error}</p>}
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-h-[65vh] overflow-y-auto pr-3">
                        <div className="space-y-6">
                             <div>
                                <label htmlFor="team-name" className="block text-sm font-medium text-gray-700 mb-1">Nome Team</label>
                                <input
                                    id="team-name"
                                    type="text"
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Sedi di Competenza</label>
                                <div className="grid grid-cols-1 gap-3 max-h-60 overflow-y-auto p-4 border rounded-md bg-gray-50">
                                    {Object.values(Location).map(loc => (
                                        <div key={loc} className="flex items-center">
                                            <input
                                                type="checkbox"
                                                id={`loc-${loc}`}
                                                checked={selectedLocations.includes(loc)}
                                                onChange={() => handleLocationToggle(loc)}
                                                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                            />
                                            <label htmlFor={`loc-${loc}`} className="ml-2 text-sm text-gray-700">{loc}</label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Turni di Competenza</label>
                            <div className="space-y-4 h-full overflow-y-auto p-4 border rounded-md bg-gray-50">
                                {selectedLocations.length === 0 ? (
                                    <div className="flex items-center justify-center h-full">
                                       <p className="text-sm text-gray-500 text-center italic">Seleziona prima una Sede per visualizzare i turni associati.</p>
                                    </div>
                                ) : availableShiftsByLocation.length === 0 ? (
                                    <div className="flex items-center justify-center h-full">
                                       <p className="text-sm text-gray-500 text-center italic">Nessun turno di lavoro definito per le sedi selezionate.</p>
                                    </div>
                                ) : (
                                    availableShiftsByLocation.map(([location, shifts]) => (
                                        <div key={location}>
                                            <h4 className="font-semibold text-gray-600 mb-2 sticky top-0 bg-gray-50 py-1">{location}</h4>
                                            <div className="space-y-2">
                                                {shifts.map(shift => (
                                                    <div key={shift.code} className="flex items-center">
                                                        <input
                                                            type="checkbox"
                                                            id={`shift-team-${shift.code}`}
                                                            checked={selectedShiftCodes.includes(shift.code)}
                                                            onChange={() => handleShiftToggle(shift.code)}
                                                            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                                        />
                                                        <label htmlFor={`shift-team-${shift.code}`} className="ml-3 flex items-center text-sm text-gray-700">
                                                            <span className={`w-8 text-center mr-2 font-bold p-1 text-xs rounded-sm ${shift.color} ${shift.textColor}`}>{shift.code.replace('_doc', '')}</span>
                                                            {shift.description}
                                                        </label>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Membri del Team</label>
                             <div className="space-y-4 h-full overflow-y-auto p-4 border rounded-md bg-gray-50">
                                {staffByRole.nurses.length > 0 && <StaffCheckboxList title="Infermieri e Caposala" staff={staffByRole.nurses} />}
                                {staffByRole.oss.length > 0 && <StaffCheckboxList title="OSS" staff={staffByRole.oss} />}
                                {staffByRole.doctors.length > 0 && <StaffCheckboxList title="Medici" staff={staffByRole.doctors} />}
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end pt-4 space-x-3 border-t">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition">Annulla</button>
                        <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition">Salva</button>
                    </div>
                </form>
            </div>
        </div>
    );
};
