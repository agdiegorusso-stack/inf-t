
import type { Staff, ShiftDefinition } from './types';
import { StaffRole, ContractType, Location, ShiftTime } from './types';

// ID speciale per rappresentare la riga dei turni scoperti nel calendario
export const UNASSIGNED_STAFF_ID = 'unassigned';

// Elenco dei codici di turno considerati 'lunghi' o straordinari
export const LONG_SHIFTS = ['Ps'];

// NOTA: Le password sono in chiaro solo per scopi dimostrativi.
// In un'applicazione reale, non dovrebbero mai essere memorizzate in questo modo.
export const STAFF_LIST: Staff[] = [
    // Infermieri e Caposala
    { id: '1', name: 'Soro\' A.', role: StaffRole.Nurse, contract: ContractType.H24, usualLocations: [Location.SantEugenioNephrology, Location.SantEugenioDialysis], password: 'password123' },
    { id: '2', name: 'Caprioli F.', role: StaffRole.Nurse, contract: ContractType.H12, usualLocations: [Location.SantaCaterinaDialysis], password: 'password123' },
    { id: '3', name: 'Amatucci E.', role: StaffRole.Nurse, contract: ContractType.H12, usualLocations: [Location.SantEugenioER, Location.SantEugenioNephrology], password: 'password123' },
    { id: '4', name: 'Cardillo M.', role: StaffRole.Nurse, contract: ContractType.H24, usualLocations: [Location.Floor0, Location.Floor2], password: 'password123' },
    { id: '5', name: 'Dosa\' S.', role: StaffRole.Nurse, contract: ContractType.H24, usualLocations: [Location.CTODialysis], password: 'password123' },
    { id: '6', name: 'Costa A.', role: StaffRole.Nurse, contract: ContractType.H6, usualLocations: [Location.SantEugenioClinic], password: 'password123' },
    { id: '7', name: 'Onofri N.', role: StaffRole.Nurse, contract: ContractType.H24, usualLocations: [Location.SantEugenioNephrology], password: 'password123' },
    { id: '8', name: 'Di Carlo M.', role: StaffRole.Nurse, contract: ContractType.H12, usualLocations: [Location.Floor0], password: 'password123' },
    { id: '58', name: 'Bevilacqua M.', role: StaffRole.HeadNurse, contract: ContractType.H12, usualLocations: [Location.Management], password: 'password123' },
    { id: '59', name: 'Marrama M.', role: StaffRole.HeadNurse, contract: ContractType.H12, usualLocations: [Location.Management], password: 'password123' },
    { id: '60', name: 'Vaccaro P.', role: StaffRole.HeadNurse, contract: ContractType.H12, usualLocations: [Location.Management], password: 'password123' },
    
    // OSS
    { id: '101', name: 'Rossi G.', role: StaffRole.OSS, contract: ContractType.H24, usualLocations: [Location.Floor0, Location.Floor2], password: 'password123' },
    { id: '102', name: 'Bianchi L.', role: StaffRole.OSS, contract: ContractType.H24, usualLocations: [Location.Floor0, Location.Floor2], password: 'password123' },
    { id: '103', name: 'Verdi A.', role: StaffRole.OSS, contract: ContractType.H12, usualLocations: [Location.Floor0, Location.Floor2], password: 'password123' },
    { id: '104', name: 'Gialli M.', role: StaffRole.OSS, contract: ContractType.H12, usualLocations: [Location.Floor0, Location.Floor2], password: 'password123' },

    // Medici
    { id: '201', name: 'Dr. Conte', role: StaffRole.Doctor, contract: ContractType.H24, usualLocations: [Location.SantEugenioNephrology], password: 'password123' },
    { id: '202', name: 'Dr.ssa Marino', role: StaffRole.Doctor, contract: ContractType.H24, usualLocations: [Location.SantEugenioDialysis], password: 'password123' },
    { id: '203', name: 'Dr. Esposito', role: StaffRole.Doctor, contract: ContractType.H24, usualLocations: [Location.CTODialysis], password: 'password123' },
    { id: '204', name: 'Dr. Greco', role: StaffRole.Doctor, contract: ContractType.H24, usualLocations: [Location.SantEugenioER], password: 'password123' },
    { id: '205', name: 'Dr. Ricci', role: StaffRole.Doctor, contract: ContractType.H24, usualLocations: [Location.SantEugenioNephrology], password: 'password123' },

    // Placeholder per turni scoperti (mantiene un ruolo generico, ma è gestito a parte)
    { id: UNASSIGNED_STAFF_ID, name: 'Turni Scoperti', role: StaffRole.Nurse, contract: ContractType.H24, usualLocations: [] },
];

const ALL_ROLES = [StaffRole.HeadNurse, StaffRole.Nurse, StaffRole.OSS, StaffRole.Doctor];

export const SHIFT_DEFINITIONS: ShiftDefinition[] = [
    // --- Turni Caposala e Infermieri ---
    { code: 'M', description: "Mattina Direzione", location: Location.Management, time: ShiftTime.Morning, color: 'bg-slate-200', textColor: 'text-slate-800', roles: [StaffRole.HeadNurse] },
    { code: 'Md', description: "Mattina Dialisi S.Eugenio", location: Location.SantEugenioDialysis, time: ShiftTime.Morning, color: 'bg-blue-200', textColor: 'text-blue-800', roles: [StaffRole.Nurse, StaffRole.HeadNurse] },
    { code: 'Ps', description: "Pomeriggio+Sera Dialisi S.Eugenio", location: Location.SantEugenioDialysis, time: ShiftTime.Afternoon, color: 'bg-blue-300', textColor: 'text-blue-900', roles: [StaffRole.Nurse, StaffRole.HeadNurse] },
    { code: 'Msc', description: "Mattina Dialisi S.Caterina", location: Location.SantaCaterinaDialysis, time: ShiftTime.Morning, color: 'bg-green-200', textColor: 'text-green-800', roles: [StaffRole.Nurse, StaffRole.HeadNurse] },
    { code: 'Psc', description: "Pomeriggio Dialisi S.Caterina", location: Location.SantaCaterinaDialysis, time: ShiftTime.Afternoon, color: 'bg-green-200', textColor: 'text-green-800', roles: [StaffRole.Nurse, StaffRole.HeadNurse] },
    { code: 'Mc', description: "Mattina Dialisi CTO", location: Location.CTODialysis, time: ShiftTime.Morning, color: 'bg-indigo-200', textColor: 'text-indigo-800', roles: [StaffRole.Nurse, StaffRole.HeadNurse] },
    { code: 'Pc', description: "Pomeriggio Dialisi CTO", location: Location.CTODialysis, time: ShiftTime.Afternoon, color: 'bg-indigo-200', textColor: 'text-indigo-800', roles: [StaffRole.Nurse, StaffRole.HeadNurse] },
    { code: 'Mu', description: "Mattina Urgenza S.Eugenio", location: Location.SantEugenioER, time: ShiftTime.Morning, color: 'bg-red-200', textColor: 'text-red-800', roles: [StaffRole.Nurse, StaffRole.HeadNurse] },
    { code: 'Pu', description: "Pomeriggio Urgenza S.Eugenio", location: Location.SantEugenioER, time: ShiftTime.Afternoon, color: 'bg-red-200', textColor: 'text-red-800', roles: [StaffRole.Nurse, StaffRole.HeadNurse] },
    { code: 'Mco', description: "Mattina Sala Operatoria S.Eugenio", location: Location.SantEugenioOR, time: ShiftTime.Morning, color: 'bg-purple-200', textColor: 'text-purple-800', roles: [StaffRole.Nurse, StaffRole.HeadNurse] },
    { code: 'Mac', description: "Mattina Dialisi Peritoneale CTO", location: Location.CTOPeritoneal, time: ShiftTime.Morning, color: 'bg-teal-200', textColor: 'text-teal-800', roles: [StaffRole.Nurse, StaffRole.HeadNurse] },
    { code: 'Mn', description: "Mattina Reparto Nefrologia", location: Location.SantEugenioNephrology, time: ShiftTime.Morning, color: 'bg-yellow-200', textColor: 'text-yellow-800', roles: [StaffRole.Nurse, StaffRole.HeadNurse] },
    { code: 'Pn', description: "Pomeriggio Reparto Nefrologia", location: Location.SantEugenioNephrology, time: ShiftTime.Afternoon, color: 'bg-yellow-200', textColor: 'text-yellow-800', roles: [StaffRole.Nurse, StaffRole.HeadNurse] },
    { code: 'N', description: "Notte Reparto Nefrologia", location: Location.SantEugenioNephrology, time: ShiftTime.Night, color: 'bg-gray-800', textColor: 'text-white', roles: [StaffRole.Nurse, StaffRole.HeadNurse] },
    { code: 'Mat', description: "Mattina Ambulatorio", location: Location.SantEugenioClinic, time: ShiftTime.Morning, color: 'bg-pink-200', textColor: 'text-pink-800', roles: [StaffRole.Nurse, StaffRole.HeadNurse] },
    { code: 'Mat/e', description: "Mattina Ambulatorio/Esterno", location: Location.SantEugenioClinic, time: ShiftTime.Morning, color: 'bg-pink-300', textColor: 'text-pink-900', roles: [StaffRole.Nurse, StaffRole.HeadNurse] },
    { code: 'Me', description: "Mattina Esterno", location: Location.External, time: ShiftTime.Morning, color: 'bg-orange-200', textColor: 'text-orange-800', roles: [StaffRole.Nurse, StaffRole.HeadNurse] },
    { code: 'Pe', description: "Pomeriggio Esterno", location: Location.External, time: ShiftTime.Afternoon, color: 'bg-orange-200', textColor: 'text-orange-800', roles: [StaffRole.Nurse, StaffRole.HeadNurse] },
    { code: 'Mb', description: "Mattina Stanza B", location: Location.RoomB, time: ShiftTime.Morning, color: 'bg-yellow-400', textColor: 'text-yellow-900', roles: [StaffRole.Nurse, StaffRole.HeadNurse] },
    { code: 'Pb', description: "Pomeriggio Stanza B", location: Location.RoomB, time: ShiftTime.Afternoon, color: 'bg-yellow-400', textColor: 'text-yellow-900', roles: [StaffRole.Nurse, StaffRole.HeadNurse] },
    
    // --- Turni OSS ---
    { code: 'M0', description: "Mattina Piano 0", location: Location.Floor0, time: ShiftTime.Morning, color: 'bg-cyan-200', textColor: 'text-cyan-800', roles: [StaffRole.OSS] },
    { code: 'P0', description: "Pomeriggio Piano 0", location: Location.Floor0, time: ShiftTime.Afternoon, color: 'bg-cyan-200', textColor: 'text-cyan-800', roles: [StaffRole.OSS] },
    { code: 'MT', description: "Mattina Piano 2", location: Location.Floor2, time: ShiftTime.Morning, color: 'bg-lime-200', textColor: 'text-lime-800', roles: [StaffRole.OSS] },
    { code: 'PT', description: "Pomeriggio Piano 2", location: Location.Floor2, time: ShiftTime.Afternoon, color: 'bg-lime-200', textColor: 'text-lime-800', roles: [StaffRole.OSS] },
    
    // --- Turni Medici --- (Codici infermieri sovrascritti con contesto medico)
    { code: 'Md_doc', description: "Dialisi Mattina", location: Location.SantEugenioDialysis, time: ShiftTime.Morning, color: '#fecaca', textColor: '#991b1b', roles: [StaffRole.Doctor] },
    { code: 'Pd_doc', description: "Dialisi Pomeriggio", location: Location.SantEugenioDialysis, time: ShiftTime.Afternoon, color: '#fecaca', textColor: '#991b1b', roles: [StaffRole.Doctor] },
    { code: 'Sd_doc', description: "Dialisi Sera", location: Location.SantEugenioDialysis, time: ShiftTime.Night, color: '#fee2e2', textColor: '#991b1b', roles: [StaffRole.Doctor] },
    { code: 'Mu_doc', description: "Urgenza Mattina", location: Location.SantEugenioER, time: ShiftTime.Morning, color: '#fed7aa', textColor: '#9a3412', roles: [StaffRole.Doctor] },
    { code: 'Pu_doc', description: "Urgenza Pomeriggio", location: Location.SantEugenioER, time: ShiftTime.Afternoon, color: '#fed7aa', textColor: '#9a3412', roles: [StaffRole.Doctor] },
    { code: 'Mh_doc', description: "Day Hospital", location: Location.SantEugenioClinic, time: ShiftTime.Morning, color: '#fde68a', textColor: '#a16207', roles: [StaffRole.Doctor] },
    { code: 'Mac_doc', description: "Ambulatorio Peritoneale", location: Location.CTOPeritoneal, time: ShiftTime.Morning, color: '#d9f99d', textColor: '#4d7c0f', roles: [StaffRole.Doctor] },
    { code: 'Ab_doc', description: "Ambulatorio Nefrodiabetologia", location: Location.CTODialysis, time: ShiftTime.Morning, color: '#a7f3d0', textColor: '#065f46', roles: [StaffRole.Doctor] },
    { code: 'Ac_doc', description: "Ambulatorio Nefrocardiologia", location: Location.SantEugenioClinic, time: ShiftTime.Morning, color: '#a7f3d0', textColor: '#065f46', roles: [StaffRole.Doctor] },
    { code: 'Msc_doc', description: "Santa Caterina", location: Location.SantaCaterinaDialysis, time: ShiftTime.Morning, color: '#bae6fd', textColor: '#0c4a6e', roles: [StaffRole.Doctor] },
    { code: 'Mr_doc', description: "Ambulatorio Via Marotta", location: Location.ViaMarotta, time: ShiftTime.Morning, color: '#a5b4fc', textColor: '#3730a3', roles: [StaffRole.Doctor] },
    { code: 'Mn_doc', description: "Reparto Mattina", location: Location.SantEugenioNephrology, time: ShiftTime.Morning, color: '#c4b5fd', textColor: '#5b21b6', roles: [StaffRole.Doctor] },
    { code: 'Pn_doc', description: "Reparto Pomeriggio", location: Location.SantEugenioNephrology, time: ShiftTime.Afternoon, color: '#c4b5fd', textColor: '#5b21b6', roles: [StaffRole.Doctor] },
    { code: 'Cm_doc', description: "Consulenze Mattina", location: Location.SantEugenioNephrology, time: ShiftTime.Morning, color: '#f9a8d4', textColor: '#9d2449', roles: [StaffRole.Doctor] },
    { code: 'Cp_doc', description: "Consulenze Pomeriggio", location: Location.SantEugenioNephrology, time: ShiftTime.Afternoon, color: '#f9a8d4', textColor: '#9d2449', roles: [StaffRole.Doctor] },
    { code: 'N_doc', description: "Guardia Notte", location: Location.SantEugenioNephrology, time: ShiftTime.Night, color: '#374151', textColor: '#f9fafb', roles: [StaffRole.Doctor] },
    { code: 'Mc_doc', description: "Dialisi Mattina CTO", location: Location.CTODialysis, time: ShiftTime.Morning, color: '#fecaca', textColor: '#991b1b', roles: [StaffRole.Doctor] },
    { code: 'Pc_doc', description: "Dialisi Pomeriggio CTO", location: Location.CTODialysis, time: ShiftTime.Afternoon, color: '#fecaca', textColor: '#991b1b', roles: [StaffRole.Doctor] },
    { code: 'Mv_doc', description: "Ambulatorio Accessi Vascolari", location: Location.SantEugenioClinic, time: ShiftTime.Morning, color: '#a7f3d0', textColor: '#065f46', roles: [StaffRole.Doctor] },
    { code: 'Mt_doc', description: "Ambulatorio Trapianti", location: Location.SantEugenioClinic, time: ShiftTime.Morning, color: '#a7f3d0', textColor: '#065f46', roles: [StaffRole.Doctor] },
    { code: 'Mco_doc', description: "Sala Operatoria", location: Location.SantEugenioOR, time: ShiftTime.Morning, color: '#fbcfe8', textColor: '#9d2449', roles: [StaffRole.Doctor] },

    // --- Riposi / Assenze (Comuni a tutti) ---
    { code: 'S', description: "Smonto Notte", location: Location.SantEugenioNephrology, time: ShiftTime.Rest, color: 'bg-gray-400', textColor: 'text-white', roles: ALL_ROLES },
    { code: 'RS', description: "Riposo Settimanale", location: Location.Management, time: ShiftTime.Rest, color: 'bg-gray-400', textColor: 'text-white', roles: ALL_ROLES },
    { code: 'R', description: "Riposo", location: Location.Management, time: ShiftTime.Rest, color: 'bg-gray-400', textColor: 'text-white', roles: ALL_ROLES },
    { code: 'HD', description: "Permesso L.104", location: Location.Management, time: ShiftTime.Absence, color: 'bg-red-500', textColor: 'text-white', roles: ALL_ROLES },
    { code: 'RF', description: "Recupero Festivo", location: Location.Management, time: ShiftTime.Absence, color: 'bg-purple-500', textColor: 'text-white', roles: ALL_ROLES },
    { code: 'A', description: "Malattia", location: Location.Management, time: ShiftTime.Absence, color: 'bg-red-500', textColor: 'text-white', roles: ALL_ROLES },
    { code: 'T1', description: "Malattia Figlio", location: Location.Management, time: ShiftTime.Absence, color: 'bg-red-500', textColor: 'text-white', roles: ALL_ROLES },
    { code: 'FE', description: "Ferie", location: Location.Management, time: ShiftTime.Absence, color: 'bg-green-500', textColor: 'text-white', roles: ALL_ROLES },

    // --- Placeholder (non associato a ruoli specifici) ---
    { code: 'UNCOVERED', description: "Turno Scoperto", location: Location.Management, time: ShiftTime.OffShift, color: 'bg-red-600 animate-pulse', textColor: 'text-white', roles: [] },
];

// Festività italiane che danno diritto a recupero festivo
export const PUBLIC_HOLIDAYS = [ // month-day
    "01-01", // Capodanno
    "01-06", // Epifania
    // Pasqua e Pasquetta sono mobili, andrebbero calcolate
    "04-25", // Liberazione
    "05-01", // Festa dei Lavoratori
    "06-02", // Festa della Repubblica
    "08-15", // Ferragosto
    "11-01", // Ognissanti
    "12-08", // Immacolata Concezione
    "12-25", // Natale
    "12-26", // Santo Stefano
];
