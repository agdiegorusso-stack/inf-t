

import React, { useState } from 'react';
import type { Team, Staff, ShiftDefinition } from '../types';
import { TeamModal } from './TeamModal';

interface TeamManagementProps {
    teams: Team[];
    staffList: Staff[];
    shiftDefinitions: ShiftDefinition[];
    onAddTeamAndMembers: (teamData: Omit<Team, 'id'>, memberIds: string[]) => void;
    onUpdateTeamAndMembers: (teamId: string, teamData: Partial<Omit<Team, 'id'>>, newMemberIds: string[]) => void;
    onDeleteTeam: (teamId: string) => void;
}

export const TeamManagement: React.FC<TeamManagementProps> = ({ teams, staffList, shiftDefinitions, onAddTeamAndMembers, onUpdateTeamAndMembers, onDeleteTeam }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTeam, setEditingTeam] = useState<Team | null>(null);

    const handleOpenAddModal = () => {
        setEditingTeam(null);
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (team: Team) => {
        setEditingTeam(team);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingTeam(null);
    };

    const handleSaveTeam = (teamData: Omit<Team, 'id'>, memberIds: string[]) => {
        if (editingTeam) {
            onUpdateTeamAndMembers(editingTeam.id, teamData, memberIds);
        } else {
            onAddTeamAndMembers(teamData, memberIds);
        }
        handleCloseModal();
    };

    const handleDeleteTeam = (teamId: string) => {
        if (window.confirm("Sei sicuro di voler eliminare questo team? Verrà rimosso da tutto il personale a cui è stato assegnato.")) {
            onDeleteTeam(teamId);
        }
    };
    
    const sortedTeams = [...teams].sort((a,b) => a.name.localeCompare(b.name));

    return (
        <div className="space-y-4">
            <div className="flex justify-end">
                <button
                    onClick={handleOpenAddModal}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg shadow-sm hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M15 21v-1a6 6 0 00-5.176-5.97M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 14v6m-3-3h6" />
                    </svg>
                    Aggiungi Team
                </button>
            </div>

            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome Team</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sedi di Competenza</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Membri</th>
                            <th scope="col" className="relative px-6 py-3">
                                <span className="sr-only">Azioni</span>
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {sortedTeams.map(team => {
                            const members = staffList.filter(s => s.teamIds?.includes(team.id));
                            const memberNames = members.map(m => m.name).join(', ');

                            return (
                                <tr key={team.id}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">{team.name}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-wrap gap-1 max-w-md">
                                            {team.locations.map(loc => (
                                                <span key={loc} className="px-2 py-1 text-xs leading-4 font-semibold rounded-full bg-green-100 text-green-800">
                                                    {loc}
                                                </span>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">{members.length} membri</div>
                                        <div className="text-xs text-gray-500 truncate max-w-xs" title={memberNames}>
                                            {memberNames || 'Nessun membro assegnato'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                        <button onClick={() => handleOpenEditModal(team)} className="text-indigo-600 hover:text-indigo-900">Modifica</button>
                                        <button onClick={() => handleDeleteTeam(team.id)} className="text-red-600 hover:text-red-900">Elimina</button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
                 {teams.length === 0 && (
                    <div className="text-center py-12">
                        <h3 className="text-lg font-medium text-gray-700">Nessun team definito.</h3>
                        <p className="text-sm text-gray-500 mt-1">Crea il tuo primo team per iniziare a organizzare il personale.</p>
                    </div>
                )}
            </div>

            {isModalOpen && (
                <TeamModal
                    isOpen={isModalOpen}
                    onClose={handleCloseModal}
                    onSave={handleSaveTeam}
                    existingTeam={editingTeam}
                    allTeams={teams}
                    staffList={staffList}
                    shiftDefinitions={shiftDefinitions}
                />
            )}
        </div>
    );
};