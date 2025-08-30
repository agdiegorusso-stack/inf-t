
import React, { useState, useMemo, useCallback } from 'react';
import type { Staff, ShiftDefinition, Team } from '../types';
import { StaffRole } from '../types';
import { StaffCard } from './StaffCard';
import { UNASSIGNED_STAFF_ID } from '../constants';
import { TeamManagement } from './TeamManagement';

type ActiveView = 'operators' | 'teams';
type ActiveTab = 'nurses' | 'oss' | 'doctors';

interface PersonnelPageProps {
    staffList: Staff[];
    onUpdateStaff: (staffId: string, updates: Partial<Omit<Staff, 'id' | 'name'>>) => void;
    shiftDefinitions: ShiftDefinition[];
    teams: Team[];
    onAddTeamAndMembers: (teamData: Omit<Team, 'id'>, memberIds: string[]) => void;
    onUpdateTeamAndMembers: (teamId: string, teamData: Partial<Omit<Team, 'id'>>, newMemberIds: string[]) => void;
    onDeleteTeam: (teamId: string) => void;
}

export const PersonnelPage: React.FC<PersonnelPageProps> = ({ staffList, onUpdateStaff, shiftDefinitions, teams, onAddTeamAndMembers, onUpdateTeamAndMembers, onDeleteTeam }) => {
    const [activeView, setActiveView] = useState<ActiveView>('operators');
    const [activeTab, setActiveTab] = useState<ActiveTab>('nurses');

    const filteredStaff = useMemo(() => {
         const staffToDisplay = staffList.filter(s => s.id !== UNASSIGNED_STAFF_ID);
         switch (activeTab) {
            case 'nurses':
                return staffToDisplay.filter(s => s.role === StaffRole.Nurse || s.role === StaffRole.HeadNurse);
            case 'oss':
                return staffToDisplay.filter(s => s.role === StaffRole.OSS);
            case 'doctors':
                return staffToDisplay.filter(s => s.role === StaffRole.Doctor);
            default:
                return [];
        }
    }, [staffList, activeTab]);

    const ViewButton: React.FC<{viewName: ActiveView, label: string}> = ({ viewName, label }) => (
         <button
            onClick={() => setActiveView(viewName)}
            className={`px-6 py-3 text-lg font-semibold rounded-t-lg focus:outline-none transition-colors duration-200 ${
                activeView === viewName
                    ? 'border-b-4 border-blue-600 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
            }`}
        >
            {label}
        </button>
    );

    const RoleTabButton: React.FC<{tabName: ActiveTab, label: string, count: number}> = ({ tabName, label, count }) => (
        <button
            onClick={() => setActiveTab(tabName)}
            className={`flex items-center px-4 py-2 text-sm font-semibold rounded-t-lg focus:outline-none transition-colors duration-200 ${
                activeTab === tabName
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
            }`}
        >
            {label}
            <span className={`ml-2 text-xs font-bold px-2 py-0.5 rounded-full ${activeTab === tabName ? 'bg-white text-blue-600' : 'bg-gray-300 text-gray-700'}`}>
                {count}
            </span>
        </button>
    );

    return (
        <div className="space-y-6">
            <div className="bg-white p-4 rounded-lg shadow-md">
                 <div className="flex space-x-4 border-b-2 border-gray-200">
                    <ViewButton viewName="operators" label="Gestione Operatori" />
                    <ViewButton viewName="teams" label="Gestione Team" />
                 </div>
                 {activeView === 'operators' && (
                     <div className="mt-4 flex space-x-2">
                       <RoleTabButton tabName="nurses" label="Caposala e Infermieri" count={staffList.filter(s => s.role === StaffRole.Nurse || s.role === StaffRole.HeadNurse).length} />
                       <RoleTabButton tabName="oss" label="OSS" count={staffList.filter(s => s.role === StaffRole.OSS).length} />
                       <RoleTabButton tabName="doctors" label="Medici" count={staffList.filter(s => s.role === StaffRole.Doctor).length}/>
                    </div>
                 )}
            </div>
            
            {activeView === 'operators' && (
                <div className="space-y-4">
                    {filteredStaff.map(staff => (
                        <StaffCard key={staff.id} staff={staff} onSave={onUpdateStaff} shiftDefinitions={shiftDefinitions} teams={teams} />
                    ))}
                    {filteredStaff.length === 0 && (
                        <div className="text-center py-12 bg-white rounded-lg shadow-md">
                            <h3 className="text-lg font-medium text-gray-700">Nessun personale da mostrare in questa categoria.</h3>
                        </div>
                    )}
                </div>
            )}
            {activeView === 'teams' && (
                <TeamManagement 
                    teams={teams}
                    staffList={staffList}
                    onAddTeamAndMembers={onAddTeamAndMembers}
                    onUpdateTeamAndMembers={onUpdateTeamAndMembers}
                    onDeleteTeam={onDeleteTeam}
                />
            )}
        </div>
    );
};
