
import React, { useState, useMemo, useEffect } from 'react';
import type { ShiftDefinition } from '../types';
import { Location, ShiftTime } from '../types';

interface EditShiftModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (updatedShift: ShiftDefinition) => void;
    onDelete: (shiftCode: string) => void;
    shift: ShiftDefinition;
    isDefaultShift: boolean;
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

export const EditShiftModal: React.FC<EditShiftModalProps> = ({ isOpen, onClose, onSave, onDelete, shift, isDefaultShift }) => {
    const [formData, setFormData] = useState<ShiftDefinition>(shift);
    const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        setFormData(shift);
        setError('');
        setIsConfirmingDelete(false);
    }, [shift, isOpen]);

    const workShiftTimes = useMemo(() => 
        Object.values(ShiftTime).filter(t => ![ShiftTime.Absence, ShiftTime.Rest, ShiftTime.OffShift].includes(t)),
        []
    );

    const handleInputChange = (field: keyof Omit<ShiftDefinition, 'code' | 'roles'>, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isDefaultShift) return;
        setError('');

        const trimmedDescription = formData.description.trim();
        if (!trimmedDescription) {
            setError('La descrizione è obbligatoria.');
            return;
        }

        onSave({ ...formData, description: trimmedDescription });
    };

    const handleDeleteClick = () => {
        if (!isDefaultShift) {
            setIsConfirmingDelete(true);
        }
    };
    
    const confirmDelete = () => {
        onDelete(formData.code);
    };

    if (!isOpen) return null;

    const isDisabled = isDefaultShift;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-2xl p-6 sm:p-8 w-full max-w-lg transform transition-all" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">{isDefaultShift ? 'Dettagli Turno di Sistema' : 'Modifica Turno'}</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                {error && <p className="text-red-500 bg-red-100 p-3 rounded-md mb-4 text-sm">{error}</p>}
                {isDefaultShift && <p className="text-blue-700 bg-blue-100 p-3 rounded-md mb-4 text-sm">Questo è un turno di sistema. Le sue proprietà possono essere visualizzate ma non modificate o eliminate.</p>}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <fieldset disabled={isDisabled}>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="shift-code" className="block text-sm font-medium text-gray-700 mb-1">Codice Turno</label>
                                <input
                                    id="shift-code"
                                    type="text"
                                    value={formData.code}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-100 cursor-not-allowed"
                                    disabled
                                />
                            </div>
                            <div>
                                <label htmlFor="shift-description" className="block text-sm font-medium text-gray-700 mb-1">Descrizione Completa</label>
                                <input
                                    id="shift-description"
                                    type="text"
                                    value={formData.description}
                                    onChange={e => handleInputChange('description', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                                    required
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="shift-location" className="block text-sm font-medium text-gray-700 mb-1">Sede</label>
                                <select id="shift-location" value={formData.location} onChange={e => handleInputChange('location', e.target.value as Location)} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100">
                                    {Object.values(Location).map(loc => <option key={loc} value={loc}>{loc}</option>)}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="shift-time" className="block text-sm font-medium text-gray-700 mb-1">Fascia Oraria</label>
                                <select id="shift-time" value={formData.time} onChange={e => handleInputChange('time', e.target.value as ShiftTime)} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100">
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
                                            handleInputChange('color', opt.bg);
                                            handleInputChange('textColor', opt.text);
                                        }}
                                        className={`w-20 h-10 rounded-md flex items-center justify-center font-bold text-sm transition-all ${opt.bg} ${opt.text} ${formData.color === opt.bg ? 'ring-2 ring-offset-1 ring-blue-500' : 'hover:opacity-80'} disabled:cursor-not-allowed`}
                                        aria-label={`Seleziona colore ${opt.name}`}
                                    >
                                        {formData.code}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </fieldset>
                    
                    <div className="flex justify-between items-center pt-4 border-t">
                        <div>
                            {!isDefaultShift && (
                                !isConfirmingDelete ? (
                                    <button type="button" onClick={handleDeleteClick} className="px-4 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition">Elimina Turno</button>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <button type="button" onClick={confirmDelete} className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700">Conferma Elimina</button>
                                        <button type="button" onClick={() => setIsConfirmingDelete(false)} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Annulla</button>
                                    </div>
                                )
                            )}
                        </div>
                        <div className="flex justify-end">
                             {isDefaultShift ? (
                                <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition">Chiudi</button>
                            ) : (
                                 <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition">Salva Modifiche</button>
                            )}
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};