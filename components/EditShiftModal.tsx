import React, { useState, useMemo, useEffect } from 'react';
import type { ShiftDefinition } from '../types';
import { Location, ShiftTime } from '../types';

type RuleType = 'specific_days' | 'all_days' | 'specific_date';

interface EditShiftModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (updatedShift: ShiftDefinition) => void;
    onDelete: (shiftCode: string) => void;
    shift: ShiftDefinition;
    onApplyRule: (shiftCode: string, ruleType: RuleType, days: number[], date: string, count: { min: number, max: number }) => void;
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

const weekDaysMap = [
    { label: 'Dom', value: 0 }, { label: 'Lun', value: 1 }, { label: 'Mar', value: 2 },
    { label: 'Mer', value: 3 }, { label: 'Gio', value: 4 }, { label: 'Ven', value: 5 }, { label: 'Sab', value: 6 }
];

export const EditShiftModal: React.FC<EditShiftModalProps> = ({ isOpen, onClose, onSave, onDelete, shift, onApplyRule }) => {
    const [formData, setFormData] = useState<ShiftDefinition>(shift);
    const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
    const [error, setError] = useState('');
    
    // State for special rules
    const [ruleType, setRuleType] = useState<RuleType>('specific_days');
    const [selectedDays, setSelectedDays] = useState<number[]>([]);
    const [specificDate, setSpecificDate] = useState(new Date().toISOString().split('T')[0]);
    const [minStaffCount, setMinStaffCount] = useState(1);
    const [maxStaffCount, setMaxStaffCount] = useState(1);


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

    const handleDayToggle = (dayValue: number) => {
        setSelectedDays(prev => 
            prev.includes(dayValue) ? prev.filter(d => d !== dayValue) : [...prev, dayValue]
        );
    };

    const handleMinStaffChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newMin = Math.max(0, parseInt(e.target.value, 10) || 0);
        setMinStaffCount(newMin);
        if (newMin > maxStaffCount) {
            setMaxStaffCount(newMin);
        }
    };

    const handleMaxStaffChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newMax = Math.max(0, parseInt(e.target.value, 10) || 0);
        if (newMax >= minStaffCount) {
            setMaxStaffCount(newMax);
        }
    };

    const handleApplyRuleClick = () => {
        let daysToApply: number[] = [];

        if (ruleType === 'specific_days') {
            if (selectedDays.length === 0) {
                alert('Per favore, seleziona almeno un giorno della settimana.');
                return;
            }
            daysToApply = selectedDays;
        } else if (ruleType === 'all_days') {
            daysToApply = weekDaysMap.map(d => d.value);
        }
        
        onApplyRule(formData.code, ruleType, daysToApply, specificDate, { min: minStaffCount, max: maxStaffCount });
        alert('Regola applicata con successo alla tabella dei fabbisogni!');
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        const trimmedDescription = formData.description.trim();
        if (!trimmedDescription) {
            setError('La descrizione è obbligatoria.');
            return;
        }

        onSave({ ...formData, description: trimmedDescription });
    };

    const handleDeleteClick = () => {
        setIsConfirmingDelete(true);
    };
    
    const confirmDelete = () => {
        onDelete(formData.code);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-2xl p-6 sm:p-8 w-full max-w-2xl transform transition-all" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">Modifica Turno</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                {error && <p className="text-red-500 bg-red-100 p-3 rounded-md mb-4 text-sm">{error}</p>}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <fieldset>
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
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                    required
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="shift-location" className="block text-sm font-medium text-gray-700 mb-1">Sede</label>
                                <select id="shift-location" value={formData.location} onChange={e => handleInputChange('location', e.target.value as Location)} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                                    {Object.values(Location).map(loc => <option key={loc} value={loc}>{loc}</option>)}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="shift-time" className="block text-sm font-medium text-gray-700 mb-1">Fascia Oraria</label>
                                <select id="shift-time" value={formData.time} onChange={e => handleInputChange('time', e.target.value as ShiftTime)} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
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
                                        className={`w-20 h-10 rounded-md flex items-center justify-center font-bold text-sm transition-all ${opt.bg} ${opt.text} ${formData.color === opt.bg ? 'ring-2 ring-offset-1 ring-blue-500' : 'hover:opacity-80'}`}
                                        aria-label={`Seleziona colore ${opt.name}`}
                                    >
                                        {formData.code}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </fieldset>
                    
                    {/* Special Rules Section */}
                    <div className="space-y-4 pt-4 border-t">
                        <h3 className="text-lg font-semibold text-gray-700">Regole Speciali di Fabbisogno</h3>
                         <p className="text-sm text-gray-500">
                            Crea una regola per aggiornare rapidamente il numero di personale necessario per questo turno nella tabella dei fabbisogni.
                         </p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg border">
                            <div>
                                <label htmlFor="rule-type" className="block text-sm font-medium text-gray-700 mb-1">Tipo Regola</label>
                                <select id="rule-type" value={ruleType} onChange={e => setRuleType(e.target.value as RuleType)} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                                    <option value="specific_days">Giorni Specifici</option>
                                    <option value="all_days">Tutti i Giorni</option>
                                    <option value="specific_date">Data Specifica</option>
                                </select>
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {ruleType === 'specific_date' ? 'Seleziona Data' : 'Seleziona Giorni'}
                                </label>
                                {ruleType === 'specific_days' && (
                                    <div className="flex flex-wrap gap-2 items-center">
                                        {weekDaysMap.map(day => (
                                            <button
                                                key={day.value}
                                                type="button"
                                                onClick={() => handleDayToggle(day.value)}
                                                className={`px-3 py-1 text-sm rounded-full transition-colors ${selectedDays.includes(day.value) ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                                            >
                                                {day.label}
                                            </button>
                                        ))}
                                    </div>
                                )}
                                {ruleType === 'specific_date' && (
                                    <input
                                        type="date"
                                        value={specificDate}
                                        onChange={e => setSpecificDate(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                    />
                                )}
                                {ruleType === 'all_days' && (
                                    <p className="text-sm text-gray-500 italic h-full flex items-center">La regola verrà applicata a tutti i giorni della settimana.</p>
                                )}
                            </div>
                        </div>
                        <div className="flex items-end gap-4 p-4 bg-gray-50 rounded-lg border">
                             <div className="flex-grow">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Numero di Personale (Min-Max)</label>
                                <div className="grid grid-cols-2 gap-4">
                                     <div>
                                        <label htmlFor="min-staff-count" className="block text-xs font-medium text-gray-600">Minimo</label>
                                        <input
                                            type="number"
                                            id="min-staff-count"
                                            min="0"
                                            value={minStaffCount}
                                            onChange={handleMinStaffChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="max-staff-count" className="block text-xs font-medium text-gray-600">Massimo</label>
                                        <input
                                            type="number"
                                            id="max-staff-count"
                                            min={minStaffCount}
                                            value={maxStaffCount}
                                            onChange={handleMaxStaffChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={handleApplyRuleClick}
                                className="px-4 py-2 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700 transition-colors"
                            >
                                Applica Regola
                            </button>
                        </div>
                    </div>


                    <div className="flex justify-between items-center pt-4 border-t">
                        <div>
                            {!isConfirmingDelete ? (
                                <button type="button" onClick={handleDeleteClick} className="px-4 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition">Elimina Turno</button>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <button type="button" onClick={confirmDelete} className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700">Conferma Elimina</button>
                                    <button type="button" onClick={() => setIsConfirmingDelete(false)} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Annulla</button>
                                </div>
                            )}
                        </div>
                        <div className="flex justify-end space-x-3">
                            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition">Annulla</button>
                            <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition">Salva Modifiche</button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};