import React, { useState, useMemo, useEffect } from 'react';
import type { ShiftDefinition, ShiftRequirementValue } from '../types';
import { Location, ShiftTime } from '../types';

type RuleType = 'specific_days' | 'all_days';
type ViewType = 'weekly' | 'monthly';

interface EditShiftModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (updatedShift: ShiftDefinition) => void;
    onDelete: (shiftCode: string) => void;
    shift: ShiftDefinition;
    onApplyRule: (shiftCode: string, days: number[], count: { min: number, max: number }) => void;
    targetDate: string; // YYYY-MM
    dateOverrides: Record<string, ShiftRequirementValue>; // { 'YYYY-MM-DD': value } for the current shift
    onApplyDateOverride: (shiftCode: string, dates: string[], count: ShiftRequirementValue | null) => void;
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

const formatRequirement = (req: ShiftRequirementValue | undefined): string => {
    if (req === undefined || req === null) return '';
    if (typeof req === 'number') return req.toString();
    if (req.min === req.max) return req.min.toString();
    return `(${req.min}-${req.max})`;
};


export const EditShiftModal: React.FC<EditShiftModalProps> = ({ isOpen, onClose, onSave, onDelete, shift, onApplyRule, targetDate, dateOverrides, onApplyDateOverride }) => {
    const [formData, setFormData] = useState<ShiftDefinition>(shift);
    const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
    const [error, setError] = useState('');
    const [view, setView] = useState<ViewType>('weekly');
    
    // State for rules
    const [ruleType, setRuleType] = useState<RuleType>('specific_days');
    const [selectedDays, setSelectedDays] = useState<number[]>([]);
    const [minStaffCount, setMinStaffCount] = useState(1);
    const [maxStaffCount, setMaxStaffCount] = useState(1);
    const [selectedDates, setSelectedDates] = useState<string[]>([]);


    useEffect(() => {
        setFormData(shift);
        setError('');
        setIsConfirmingDelete(false);
        setView('weekly');
        setSelectedDates([]);
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

    const handleApplyWeeklyRule = () => {
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
        
        onApplyRule(formData.code, daysToApply, { min: minStaffCount, max: maxStaffCount });
        alert('Regola settimanale applicata con successo!');
    };
    
    const handleApplyMonthlyOverride = (remove = false) => {
        if (selectedDates.length === 0) {
            alert('Selezionare almeno un giorno dal calendario.');
            return;
        }
        const count = remove ? null : { min: minStaffCount, max: maxStaffCount };
        onApplyDateOverride(formData.code, selectedDates, count);
        setSelectedDates([]);
    };

    const renderMonthlyCalendar = () => {
        const [year, month] = targetDate.split('-').map(Number);
        const firstDayOfMonth = new Date(year, month - 1, 1).getDay();
        const daysInMonth = new Date(year, month, 0).getDate();
        
        const blanks = Array(firstDayOfMonth).fill(null);
        const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

        const handleDateClick = (day: number) => {
            const dateStr = `${targetDate}-${day.toString().padStart(2, '0')}`;
            setSelectedDates(prev => prev.includes(dateStr) ? prev.filter(d => d !== dateStr) : [...prev, dateStr]);
        };
        
        return (
            <div>
                <h4 className="text-center font-semibold mb-2">{new Date(year, month - 1).toLocaleString('it-IT', { month: 'long', year: 'numeric' })}</h4>
                <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold text-gray-500">
                    {weekDaysMap.map(d => <div key={d.value}>{d.label}</div>)}
                </div>
                <div className="grid grid-cols-7 gap-1 mt-1">
                    {blanks.map((_, i) => <div key={`blank-${i}`}></div>)}
                    {days.map(day => {
                        const dateStr = `${targetDate}-${day.toString().padStart(2, '0')}`;
                        const isSelected = selectedDates.includes(dateStr);
                        const override = dateOverrides[dateStr];
                        const displayValue = formatRequirement(override);
                        
                        return (
                             <button
                                key={day}
                                type="button"
                                onClick={() => handleDateClick(day)}
                                className={`h-12 w-full rounded-lg border-2 flex flex-col items-center justify-center transition-colors ${
                                    isSelected ? 'bg-blue-500 border-blue-600 text-white' : 
                                    override ? 'bg-green-100 border-green-300 text-green-800' : 'bg-gray-100 border-gray-200 hover:bg-gray-200'
                                }`}
                            >
                                <span className="font-bold">{day}</span>
                                {displayValue && <span className="text-xs font-mono">{displayValue}</span>}
                            </button>
                        );
                    })}
                </div>
            </div>
        );
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
                         {/* Form fields for shift properties */}
                    </fieldset>
                    
                    <div className="space-y-4 pt-4 border-t">
                        <div className="flex items-center justify-between">
                             <h3 className="text-lg font-semibold text-gray-700">Regole Speciali di Fabbisogno</h3>
                             <div className="flex items-center p-1 bg-gray-200 rounded-lg">
                                <button type="button" onClick={() => setView('weekly')} className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors ${view === 'weekly' ? 'bg-white text-blue-600 shadow' : 'text-gray-600'}`}>Regola Settimanale</button>
                                <button type="button" onClick={() => setView('monthly')} className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors ${view === 'monthly' ? 'bg-white text-blue-600 shadow' : 'text-gray-600'}`}>Giorno Singolo</button>
                            </div>
                        </div>

                        {view === 'weekly' && (
                             <div className="space-y-4">
                                <p className="text-sm text-gray-500">
                                    Crea una regola per aggiornare il fabbisogno per questo turno su base settimanale.
                                </p>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg border">
                                    <div>
                                        <label htmlFor="rule-type" className="block text-sm font-medium text-gray-700 mb-1">Tipo Regola</label>
                                        <select id="rule-type" value={ruleType} onChange={e => setRuleType(e.target.value as RuleType)} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                                            <option value="specific_days">Giorni Specifici</option>
                                            <option value="all_days">Tutti i Giorni</option>
                                        </select>
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Seleziona Giorni</label>
                                        {ruleType === 'specific_days' ? (
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
                                        ) : (
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
                                                    type="number" id="min-staff-count" min="0" value={minStaffCount}
                                                    onChange={handleMinStaffChange}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                                />
                                            </div>
                                            <div>
                                                <label htmlFor="max-staff-count" className="block text-xs font-medium text-gray-600">Massimo</label>
                                                <input
                                                    type="number" id="max-staff-count" min={minStaffCount} value={maxStaffCount}
                                                    onChange={handleMaxStaffChange}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleApplyWeeklyRule}
                                        className="px-4 py-2 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700 transition-colors"
                                    >
                                        Applica Regola
                                    </button>
                                </div>
                            </div>
                        )}

                        {view === 'monthly' && (
                            <div className="space-y-4">
                                <p className="text-sm text-gray-500">
                                    Seleziona uno o più giorni dal calendario per impostare un fabbisogno specifico che sovrascrive la regola settimanale. Le date con un'eccezione sono evidenziate in verde.
                                </p>
                                {renderMonthlyCalendar()}
                                <div className="flex items-end gap-4 p-4 bg-gray-50 rounded-lg border">
                                    <div className="flex-grow">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Numero di Personale (Min-Max)</label>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label htmlFor="min-staff-count-month" className="block text-xs font-medium text-gray-600">Minimo</label>
                                                <input type="number" id="min-staff-count-month" min="0" value={minStaffCount} onChange={handleMinStaffChange} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" />
                                            </div>
                                            <div>
                                                <label htmlFor="max-staff-count-month" className="block text-xs font-medium text-gray-600">Massimo</label>
                                                <input type="number" id="max-staff-count-month" min={minStaffCount} value={maxStaffCount} onChange={handleMaxStaffChange} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex flex-col sm:flex-row gap-2">
                                        <button type="button" onClick={() => handleApplyMonthlyOverride(false)} className="px-3 py-2 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700 whitespace-nowrap">Applica a Selezionati</button>
                                        <button type="button" onClick={() => handleApplyMonthlyOverride(true)} className="px-3 py-2 bg-yellow-500 text-white font-semibold rounded-md hover:bg-yellow-600 whitespace-nowrap">Rimuovi Eccezione</button>
                                    </div>
                                </div>
                            </div>
                        )}
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