
import React, { useState, useMemo, useCallback } from 'react';
import { ShiftCalendar } from './components/ShiftCalendar';
import { Header } from './components/Header';
import { FilterControls } from './components/FilterControls';
import { Legend } from './components/Legend';
import { AbsenceModal } from './components/AbsenceModal';
import { ReplacementModal } from './components/ReplacementModal';
import { useShiftData } from './hooks/useShiftData';
import type { ScheduledShift, Staff, Team } from './types';
import { ContractType, StaffRole } from './types';
import { LoginScreen } from './components/LoginScreen';
import { mockAuthenticateUser } from './services/authService';
import { ShiftPlanner } from './components/ShiftPlanner';
import { PersonnelPage } from './components/PersonnelPage';
import { StaffEditModal } from './components/StaffEditModal';

export type ActiveTab = 'nurses' | 'oss' | 'doctors';

const App: React.FC = () => {
    const { 
        staff,
        teams, 
        scheduledShifts, 
        shiftDefinitions,
        addAbsence, 
        findReplacements, 
        assignShift,
        getStaffById,
        getShiftDefinitionByCode,
        updateShift,
        overwriteSchedule,
        updateStaffMember,
        addShiftDefinition,
        deleteShiftDefinition,
        updateShiftDefinition,
        changePassword,
        addTeam,
        updateTeam,
        deleteTeam,
        getStaffAllowedLocations,
    } = useShiftData();

    const [currentUser, setCurrentUser] = useState<Staff | null>(null);
    const [loginError, setLoginError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [isAbsenceModalOpen, setIsAbsenceModalOpen] = useState(false);
    const [isReplacementModalOpen, setIsReplacementModalOpen] = useState(false);
    const [selectedShift, setSelectedShift] = useState<ScheduledShift | null>(null);
    const [selectedStaffForDetail, setSelectedStaffForDetail] = useState<Staff | null>(null);
    const [view, setView] = useState<'calendar' | 'planner' | 'personnel'>('calendar');
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
    
    const handleOpenStaffDetail = useCallback((staff: Staff) => {
        setSelectedStaffForDetail(staff);
    }, []);

    const handleCloseModals = useCallback(() => {
        setIsAbsenceModalOpen(false);
        setIsReplacementModalOpen(false);
        setSelectedShift(null);
        setSelectedStaffForDetail(null);
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

    const handleUpdateStaff = useCallback((staffId: string, updates: Partial<Omit<Staff, 'id' | 'name'>>) => {
        updateStaffMember(staffId, updates);
    }, [updateStaffMember]);

    const handleScheduleOverwrite = useCallback((newShifts: ScheduledShift[], targetMonth: string, affectedStaffIds: string[]) => {
        // La conferma ora viene gestita nel componente ShiftPlanner prima di chiamare questa funzione.
        overwriteSchedule(newShifts, targetMonth, affectedStaffIds);
        
        // BUG FIX: Naviga al mese appena generato.
        // Crea un oggetto Date dalla stringa "YYYY-MM". Usare T12:00:00Z evita problemi di fuso orario.
        const newDate = new Date(`${targetMonth}-01T12:00:00Z`);
        handleDateChange(newDate);

        setView('calendar');
        alert("Calendario turni generato e aggiornato con successo!");
    }, [overwriteSchedule, handleDateChange]);

    const handleAddTeamAndMembers = useCallback((teamData: Omit<Team, 'id'>, memberIds: string[]) => {
        const newTeam: Team = {
            id: `team-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            ...teamData,
        };
        addTeam(newTeam);

        memberIds.forEach(staffId => {
            const staffMember = getStaffById(staffId);
            if (staffMember) {
                const updatedTeamIds = [...new Set([...(staffMember.teamIds || []), newTeam.id])];
                updateStaffMember(staffId, { teamIds: updatedTeamIds });
            }
        });
    }, [addTeam, getStaffById, updateStaffMember]);

    const handleUpdateTeamAndMembers = useCallback((teamId: string, teamData: Partial<Omit<Team, 'id'>>, newMemberIds: string[]) => {
        updateTeam(teamId, teamData);

        const newMemberIdsSet = new Set(newMemberIds);
        const originalMembers = staff.filter(s => s.teamIds?.includes(teamId));
        const originalMemberIdsSet = new Set(originalMembers.map(s => s.id));

        // Staff to be removed from the team
        originalMembers.forEach(member => {
            if (!newMemberIdsSet.has(member.id)) {
                const updatedTeamIds = member.teamIds.filter(id => id !== teamId);
                updateStaffMember(member.id, { teamIds: updatedTeamIds });
            }
        });

        // Staff to be added to the team
        newMemberIds.forEach(staffId => {
            if (!originalMemberIdsSet.has(staffId)) {
                const staffMember = getStaffById(staffId);
                if (staffMember) {
                    const updatedTeamIds = [...(staffMember.teamIds || []), teamId];
                    updateStaffMember(staffId, { teamIds: updatedTeamIds });
                }
            }
        });
    }, [updateTeam, staff, updateStaffMember, getStaffById]);

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
        return <LoginScreen staffList={staff} onLogin={handleLogin} error={loginError} isLoading={isLoading} onChangePassword={changePassword} />;
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

    const renderContent = () => {
        switch (view) {
            case 'calendar':
                return (
                    <>
                        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
                            <FilterControls 
                                currentDate={currentDate} 
                                onDateChange={handleDateChange} 
                                onAddAbsenceClick={handleOpenAbsenceModal}
                                scheduledShifts={scheduledShifts}
                                staff={filteredStaff} // Pass filtered staff for CSV download
                                currentUser={currentUser}
                                onManagePersonnelClick={() => setView('personnel')}
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
                                    shiftDefinitions={shiftDefinitions}
                                    teams={teams}
                                    onUncoveredShiftClick={handleOpenReplacementModal}
                                    currentUser={currentUser}
                                    onUpdateShift={handleUpdateShift}
                                    onOpenStaffDetail={handleOpenStaffDetail}
                                />
                            </div>
                            <div className="lg:col-span-1">
                                <Legend activeTab={activeTab} shiftDefinitions={shiftDefinitions} />
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
                );
            case 'planner':
                return (
                    <ShiftPlanner 
                        staffList={plannerStaffList}
                        activeTab={activeTab}
                        onGenerateSchedule={handleScheduleOverwrite}
                        getShiftDefinitionByCode={getShiftDefinitionByCode}
                        scheduledShifts={scheduledShifts}
                        shiftDefinitions={shiftDefinitions}
                        teams={teams}
                        onAddShift={addShiftDefinition}
                        deleteShiftDefinition={deleteShiftDefinition}
                        updateShiftDefinition={updateShiftDefinition}
                    />
                );
            case 'personnel':
                 return (
                    <PersonnelPage
                        staffList={staff}
                        onUpdateStaff={handleUpdateStaff}
                        shiftDefinitions={shiftDefinitions}
                        teams={teams}
                        onAddTeamAndMembers={handleAddTeamAndMembers}
                        onUpdateTeamAndMembers={handleUpdateTeamAndMembers}
                        onDeleteTeam={deleteTeam}
                    />
                );
            default:
                return null;
        }
    };


    return (
        <div className="min-h-screen bg-gray-50 text-gray-800 font-sans">
            <Header currentUser={currentUser} onLogout={handleLogout} onNavigate={setView} currentView={view} />
            <main className="p-4 sm:p-6 lg:p-8 max-w-full mx-auto">
                {renderContent()}
            </main>

            {isAbsenceModalOpen && (
                <AbsenceModal 
                    staffList={staff}
                    onClose={handleCloseModals}
                    onAddAbsence={handleAddAbsence}
                    currentUser={currentUser}
                    shiftDefinitions={shiftDefinitions}
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
            
            {selectedStaffForDetail && (
                <StaffEditModal
                    staff={selectedStaffForDetail}
                    onClose={handleCloseModals}
                    onSave={handleUpdateStaff}
                    shiftDefinitions={shiftDefinitions}
                    teams={teams}
                />
            )}
        </div>
    );
};

export default App;
