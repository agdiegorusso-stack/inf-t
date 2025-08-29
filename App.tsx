import React, { useState, useMemo, useCallback } from 'react';
import { ShiftCalendar } from './components/ShiftCalendar';
import { Header } from './components/Header';
import { FilterControls } from './components/FilterControls';
import { Legend } from './components/Legend';
import { AbsenceModal } from './components/AbsenceModal';
import { ReplacementModal } from './components/ReplacementModal';
import { StaffEditModal } from './components/StaffEditModal';
import { useShiftData } from './hooks/useShiftData';
import type { ScheduledShift, Staff, ShiftDefinition } from './types';
import { ContractType, StaffRole } from './types';
import { LoginScreen } from './components/LoginScreen';
import { STAFF_LIST } from './constants';
import { mockAuthenticateUser } from './services/authService';
import { ShiftPlanner } from './components/ShiftPlanner';

export type ActiveTab = 'nurses' | 'oss' | 'doctors';

const App: React.FC = () => {
    // FIX: Removed `shiftDefinitions` and `addShiftDefinition` which were causing errors
    // as they are not returned by `useShiftData`.
    const { 
        staff, 
        scheduledShifts, 
        addAbsence, 
        findReplacements, 
        assignShift,
        getStaffById,
        getShiftDefinitionByCode,
        updateShift,
        overwriteSchedule,
        updateStaffMember,
    } = useShiftData();

    const [currentUser, setCurrentUser] = useState<Staff | null>(null);
    const [loginError, setLoginError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [isAbsenceModalOpen, setIsAbsenceModalOpen] = useState(false);
    const [isReplacementModalOpen, setIsReplacementModalOpen] = useState(false);
    const [isStaffEditModalOpen, setIsStaffEditModalOpen] = useState(false);
    const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
    const [selectedShift, setSelectedShift] = useState<ScheduledShift | null>(null);
    const [view, setView] = useState<'calendar' | 'planner'>('calendar');
    const [activeTab, setActiveTab] = useState<ActiveTab>('nurses');

    const handleLogin = useCallback(async (staffId: string, password: string) => {
        setIsLoading(true);
        setLoginError(null);
        try {
            const user = await mockAuthenticateUser(staffId, password);
            setCurrentUser(user);
        } catch (error) {
            if (error instanceof Error) {
                setLoginError(error.message);
            } else {
                setLoginError("Si è verificato un errore inaspettato.");
            }
        } finally {
            setIsLoading(false);
        }
    }, []);

    const handleLogout = useCallback(() => {
        setCurrentUser(null);
        setView('calendar');
    }, []);

    const handleDateChange = useCallback((date: Date) => {
        setCurrentDate(date);
    }, []);

    const handleOpenAbsenceModal = useCallback(() => {
        setIsAbsenceModalOpen(true);
    }, []);

    const handleOpenReplacementModal = useCallback((shift: ScheduledShift) => {
        setSelectedShift(shift);
        setIsReplacementModalOpen(true);
    }, []);
    
    const handleOpenStaffEditModal = useCallback((staffMember: Staff) => {
        setEditingStaff(staffMember);
        setIsStaffEditModalOpen(true);
    }, []);

    const handleCloseModals = useCallback(() => {
        setIsAbsenceModalOpen(false);
        setIsReplacementModalOpen(false);
        setIsStaffEditModalOpen(false);
        setSelectedShift(null);
        setEditingStaff(null);
    }, []);
    
    const handleAddAbsence = useCallback((staffId: string, reason: string, startDate: Date, endDate: Date) => {
        addAbsence(staffId, reason, startDate, endDate);
        handleCloseModals();
    }, [addAbsence, handleCloseModals]);

    const handleAssignShift = useCallback((shift: ScheduledShift, staffId: string) => {
        assignShift(shift.id, staffId);
        handleCloseModals();
    }, [assignShift, handleCloseModals]);
    
    const handleUpdateShift = useCallback((staffId: string, date: string, newShiftCode: string) => {
        updateShift(staffId, date, newShiftCode);
    }, [updateShift]);

    const handleUpdateStaff = useCallback((staffId: string, newContract: ContractType, newRole: StaffRole) => {
        updateStaffMember(staffId, newContract, newRole);
        handleCloseModals();
    }, [updateStaffMember, handleCloseModals]);

    const handleScheduleOverwrite = useCallback((newShifts: ScheduledShift[], targetMonth: string, affectedStaffIds: string[]) => {
        if(window.confirm(`Sei sicuro di voler sovrascrivere i turni per il personale selezionato per il mese target? Tutte le modifiche manuali per questo gruppo andranno perse.`)) {
            overwriteSchedule(newShifts, targetMonth, affectedStaffIds);
            setView('calendar');
            alert("Calendario turni generato e aggiornato con successo!");
        }
    }, [overwriteSchedule]);

    const replacements = useMemo(() => {
        if (!selectedShift) return [];
        return findReplacements(selectedShift);
    }, [selectedShift, findReplacements]);

    const filteredStaff = useMemo(() => {
        const staffAndUnassigned = staff; // includes "Turni Scoperti"
        switch (activeTab) {
            case 'nurses':
                return staffAndUnassigned.filter(s => s.role === StaffRole.Nurse || s.role === StaffRole.HeadNurse || s.id === 'unassigned');
            case 'oss':
                return staffAndUnassigned.filter(s => s.role === StaffRole.OSS || s.id === 'unassigned');
            case 'doctors':
                return staffAndUnassigned.filter(s => s.role === StaffRole.Doctor || s.id === 'unassigned');
            default:
                return staffAndUnassigned;
        }
    }, [staff, activeTab]);

    const plannerStaffList = useMemo(() => {
        switch (activeTab) {
            case 'nurses':
                return staff.filter(s => s.role === StaffRole.Nurse || s.role === StaffRole.HeadNurse);
            case 'oss':
                return staff.filter(s => s.role === StaffRole.OSS);
            case 'doctors':
                return staff.filter(s => s.role === StaffRole.Doctor);
            default:
                return [];
        }
    }, [staff, activeTab]);

    if (!currentUser) {
        return <LoginScreen staffList={STAFF_LIST} onLogin={handleLogin} error={loginError} isLoading={isLoading} />;
    }

    const TabButton: React.FC<{tabName: ActiveTab, label: string}> = ({ tabName, label }) => (
        <button
            onClick={() => setActiveTab(tabName)}
            className={`px-4 py-2 text-sm font-semibold rounded-t-lg focus:outline-none transition-colors duration-200 ${
                activeTab === tabName
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
            }`}
        >
            {label}
        </button>
    );

    return (
        <div className="min-h-screen bg-gray-50 text-gray-800 font-sans">
            <Header currentUser={currentUser} onLogout={handleLogout} onNavigate={setView} currentView={view} />
            <main className="p-4 sm:p-6 lg:p-8 max-w-full mx-auto">
                {view === 'calendar' ? (
                    <>
                        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
                            <FilterControls 
                                currentDate={currentDate} 
                                onDateChange={handleDateChange} 
                                onAddAbsenceClick={handleOpenAbsenceModal}
                                scheduledShifts={scheduledShifts}
                                staff={filteredStaff} // Pass filtered staff for CSV download
                            />
                        </div>

                        <div className="mb-4 flex space-x-2 border-b-2 border-gray-200">
                           <TabButton tabName="nurses" label="Caposala e Infermieri" />
                           <TabButton tabName="oss" label="OSS" />
                           <TabButton tabName="doctors" label="Medici" />
                        </div>
                        
                        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                            <div className="lg:col-span-3">
                                <ShiftCalendar 
                                    currentDate={currentDate}
                                    staffList={filteredStaff}
                                    scheduledShifts={scheduledShifts}
                                    onUncoveredShiftClick={handleOpenReplacementModal}
                                    currentUser={currentUser}
                                    onUpdateShift={handleUpdateShift}
                                    onStaffClick={handleOpenStaffEditModal}
                                />
                            </div>
                            <div className="lg:col-span-1">
                                <Legend activeTab={activeTab} />
                            </div>
                        </div>
                        {currentUser.role === StaffRole.HeadNurse && (
                            <div className="mt-8 flex justify-center">
                                 <button onClick={() => setView('planner')} className="flex items-center px-6 py-3 bg-green-600 text-white rounded-lg shadow-lg hover:bg-green-700 transition-transform transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-green-300 text-lg font-semibold">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    Vai alla Pianificazione Automatica
                                </button>
                            </div>
                        )}
                    </>
                ) : (
                    <ShiftPlanner 
                        staffList={plannerStaffList}
                        activeTab={activeTab}
                        onGenerateSchedule={handleScheduleOverwrite}
                        getShiftDefinitionByCode={getShiftDefinitionByCode}
                        scheduledShifts={scheduledShifts}
                    />
                )}
            </main>

            {isAbsenceModalOpen && (
                <AbsenceModal 
                    staffList={staff}
                    onClose={handleCloseModals}
                    onAddAbsence={handleAddAbsence}
                    currentUser={currentUser}
                />
            )}

            {isReplacementModalOpen && selectedShift && (
                <ReplacementModal 
                    shift={selectedShift}
                    replacements={replacements}
                    onClose={handleCloseModals}
                    onAssign={handleAssignShift}
                    getStaffById={getStaffById}
                    getShiftDefinitionByCode={getShiftDefinitionByCode}
                    currentUser={currentUser}
                />
            )}

            {isStaffEditModalOpen && editingStaff && (
                <StaffEditModal
                    staff={editingStaff}
                    onClose={handleCloseModals}
                    onSave={handleUpdateStaff}
                />
            )}
        </div>
    );
};

export default App;