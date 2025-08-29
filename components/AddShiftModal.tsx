
import React, { useState, useMemo } from 'react';
import type { ShiftDefinition } from '../types';
import { Location, ShiftTime, StaffRole } from '../types';

interface AddShiftModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAddShift: (newShiftData: Omit<ShiftDefinition, 'roles'>) => void;
    existingShiftCodes: string[];
}

const colorOptions = [
    { name: 'Azzurro', bg: 'bg-sky-200', text: 'text-sky-800' },
    { name: 'Verde', bg: 'bg-emerald-200', text: 'text-emerald-800' },
    { name: 'Viola', bg: 'bg-violet-200', text: 'text-violet-800' },
    { name: 'Giallo', bg: 'bg-amber-200', text: 'text-amber-800' },
    { name: 'Rosa', bg: 'bg-rose-200', text: 'text-rose-800' },
    { name: 'Ciano', bg: 'bg-cyan-200', text: 'text-cyan-800' },
    { name: 'Arancione', bg: 'bg-orange-200', text: 'text-orange-800' },
];

export const AddShiftModal: React.FC<AddShiftModalProps> = ({ isOpen, onClose, onAddShift, existingShiftCodes }) => {
    const [code, setCode] = useState('');
    const [description, setDescription] = useState('');
    const [location, setLocation] = useState<Location>(Location.SantEugenioNephrology);
    const [time, setTime] = useState<ShiftTime>(ShiftTime.Morning);
    const [color, setColor] = useState(colorOptions[0].bg);
    const [textColor, setTextColor] = useState(colorOptions[0].text);
    const [error, setError] = useState('');

    const workShiftTimes = useMemo(() => 
        Object.values(ShiftTime).filter(t => ![ShiftTime.Absence, ShiftTime.Rest, ShiftTime.OffShift].includes(t)),
        []
    );

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        const trimmedCode = code.trim().toUpperCase();
        const trimmedDescription = description.trim();

        if (!trimmedCode || !trimmedDescription) {
            setError('Codice e descrizione sono obbligatori.');
            return;
        }

        if (existingShiftCodes.includes(trimmedCode)) {
            setError(`Il codice turno "${trimmedCode}" esiste già.`);
            return;
        }

        const newShift: Omit<ShiftDefinition, 'roles'> = {
            code: trimmedCode,
            description: trimmedDescription,
            location,
            time,
            color,
            textColor,
        };

        onAddShift(newShift);
        // Reset form for next time
        setCode('');
        setDescription('');
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-2xl p-6 sm:p-8 w-full max-w-lg transform transition-all" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">Aggiungi Nuovo Turno</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                {error && <p className="text-red-500 bg-red-100 p-3 rounded-md mb-4 text-sm">{error}</p>}
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="shift-code" className="block text-sm font-medium text-gray-700 mb-1">Codice Turno (breve, es. M_NEF2)</label>
                            <input
                                id="shift-code"
                                type="text"
                                value={code}
                                onChange={e => setCode(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                maxLength={8}
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="shift-description" className="block text-sm font-medium text-gray-700 mb-1">Descrizione Completa</label>
                            <input
                                id="shift-description"
                                type="text"
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                required
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="shift-location" className="block text-sm font-medium text-gray-700 mb-1">Sede</label>
                            <select id="shift-location" value={location} onChange={e => setLocation(e.target.value as Location)} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                                {Object.values(Location).map(loc => <option key={loc} value={loc}>{loc}</option>)}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="shift-time" className="block text-sm font-medium text-gray-700 mb-1">Fascia Oraria</label>
                            <select id="shift-time" value={time} onChange={e => setTime(e.target.value as ShiftTime)} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                                {workShiftTimes.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Colore Etichetta</label>
                        <div className="flex flex-wrap gap-2">
                            {colorOptions.map(opt => (
                                <button
                                    key={opt.name}
                                    type="button"
                                    onClick={() => {
                                        setColor(opt.bg);
                                        setTextColor(opt.text);
                                    }}
                                    className={`w-20 h-10 rounded-md flex items-center justify-center font-bold text-sm transition-all ${opt.bg} ${opt.text} ${color === opt.bg ? 'ring-2 ring-offset-1 ring-blue-500' : 'hover:opacity-80'}`}
                                    aria-label={`Seleziona colore ${opt.name}`}
                                >
                                    {code.trim().toUpperCase() || 'Aa'}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex justify-end pt-4 space-x-3 border-t">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition">Annulla</button>
                        <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition">Aggiungi Turno</button>
                    </div>
                </form>
            </div>
        </div>
    );
};
