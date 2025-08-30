
import type { Staff, ShiftDefinition, Team } from './types';
import { StaffRole, ContractType, Location, ShiftTime } from './types';

// ID speciale per rappresentare la riga dei turni scoperti nel calendario
export const UNASSIGNED_STAFF_ID = 'unassigned';

// Elenco dei codici di turno considerati 'lunghi' o straordinari
export const LONG_SHIFTS = ['Ps'];

// Definizione dei Team
export const TEAMS_LIST: Team[] = [
    { id: 'team-se', name: "Team Sant'Eugenio", locations: [Location.SantEugenioDialysis, Location.SantEugenioER, Location.SantEugenioNephrology, Location.SantEugenioClinic, Location.RoomB, Location.Floor0, Location.Floor2] },
    { id: 'team-sc', name: 'Team Santa Caterina', locations: [Location.SantaCaterinaDialysis] },
    { id: 'team-cto', name: 'Team CTO', locations: [Location.CTODialysis, Location.CTOPeritoneal] },
    { id: 'team-co', name: 'Team Camera Operatoria', locations: [Location.SantEugenioOR] },
    { id: 'team-misto', name: 'Team Misto (Tutte le Sedi)', locations: Object.values(Location).filter(l => l !== Location.Management) },
    { id: 'team-management', name: 'Team Direzione', locations: [Location.Management] },
];

// NOTA: Le password sono in chiaro solo per scopi dimostrativi.
// In un'applicazione reale, non dovrebbero mai essere memorizzate in questo modo.
export const STAFF_LIST: Staff[] = [
    // Caposala
    { id: '1', name: 'Bevilacqua Monica', role: StaffRole.HeadNurse, contract: ContractType.H12, teamIds: ['team-management'], phone: '391234567890', email: 'monica.bevilacqua@aslroma2.it', password: 'password123', hasLaw104: false, specialRules: '', unavailableShiftCodes: [] },
    { id: '2', name: 'Vaccaro Pietro', role: StaffRole.HeadNurse, contract: ContractType.H12, teamIds: ['team-management'], phone: '391234567890', email: 'pietro.vaccaro@aslroma2.it', password: 'password123', hasLaw104: false, specialRules: '', unavailableShiftCodes: [] },
    { id: '3', name: 'Marrama Anna Maria', role: StaffRole.HeadNurse, contract: ContractType.H12, teamIds: ['team-management'], phone: '391234567890', email: 'annamaria.marrama@aslroma2.it', password: 'password123', hasLaw104: false, specialRules: '', unavailableShiftCodes: [] },
    
    // Infermieri
    { id: '4', name: 'Bobo Alessandro', role: StaffRole.Nurse, contract: ContractType.H12, teamIds: ['team-se'], phone: '391234567890', email: 'alessandro.bobo@aslroma2.it', password: 'password123', hasLaw104: false, specialRules: '', unavailableShiftCodes: [] },
    { id: '5', name: 'Caprioli Francesca', role: StaffRole.Nurse, contract: ContractType.H12, teamIds: ['team-sc'], phone: '391234567890', email: 'francesca.caprioli@aslroma2.it', password: 'password123', hasLaw104: false, specialRules: '', unavailableShiftCodes: [] },
    { id: '6', name: 'Amatucci Elisa', role: StaffRole.Nurse, contract: ContractType.H12, teamIds: ['team-se'], phone: '391234567890', email: 'amatucci.elisa@ospedale.it', password: 'password123', hasLaw104: false, specialRules: '', unavailableShiftCodes: [] },
    { id: '7', name: 'Cardillo Marcello', role: StaffRole.Nurse, contract: ContractType.H12, teamIds: ['team-se'], phone: '391234567890', email: 'cardillo.marcello@ospedale.it', password: 'password123', hasLaw104: false, specialRules: '', unavailableShiftCodes: [] },
    { id: '8', name: 'Dosa Simona', role: StaffRole.Nurse, contract: ContractType.H12, teamIds: ['team-cto'], phone: '391234567890', email: 'dosa.simona@ospedale.it', password: 'password123', hasLaw104: false, specialRules: '', unavailableShiftCodes: [] },
    { id: '9', name: 'Costa Adriana', role: StaffRole.Nurse, contract: ContractType.H6, teamIds: ['team-se'], phone: '391234567890', email: 'costa.adriana@ospedale.it', password: 'password123', hasLaw104: false, specialRules: '', unavailableShiftCodes: [] },
    { id: '10', name: 'Onofri Nadia', role: StaffRole.Nurse, contract: ContractType.H6, teamIds: ['team-se'], phone: '391234567890', email: 'onofri.nadia@ospedale.it', password: 'password123', hasLaw104: false, specialRules: '', unavailableShiftCodes: [] },
    { id: '11', name: 'Di Carlo Michela', role: StaffRole.Nurse, contract: ContractType.H12, teamIds: ['team-se'], phone: '391234567890', email: 'dicarlo.michela@ospedale.it', password: 'password123', hasLaw104: false, specialRules: '', unavailableShiftCodes: [] },
    { id: '12', name: 'Mirtella Cinzia', role: StaffRole.Nurse, contract: ContractType.H12, teamIds: ['team-se'], phone: '391234567890', email: 'mirtella.cinzia@ospedale.it', password: 'password123', hasLaw104: false, specialRules: '', unavailableShiftCodes: [] },
    { id: '13', name: 'Leto Giorgina', role: StaffRole.Nurse, contract: ContractType.H12, teamIds: ['team-se'], phone: '391234567890', email: 'leto.giorgina@ospedale.it', password: 'password123', hasLaw104: false, specialRules: '', unavailableShiftCodes: [] },
    { id: '14', name: 'Cerreto Elisa', role: StaffRole.Nurse, contract: ContractType.H12, teamIds: ['team-se'], phone: '391234567890', email: 'cerreto.elisa@ospedale.it', password: 'password123', hasLaw104: false, specialRules: '', unavailableShiftCodes: [] },
    { id: '15', name: 'Evangelista Chiara', role: StaffRole.Nurse, contract: ContractType.H12, teamIds: ['team-se'], phone: '391234567890', email: 'evangelista.chiara@ospedale.it', password: 'password123', hasLaw104: false, specialRules: '', unavailableShiftCodes: [] },
    { id: '16', name: 'Fantini Vincenzo', role: StaffRole.Nurse, contract: ContractType.H12, teamIds: ['team-se'], phone: '391234567890', email: 'fantini.vincenzo@ospedale.it', password: 'password123', hasLaw104: false, specialRules: '', unavailableShiftCodes: [] },
    { id: '17', name: 'Kaoutar Elaouane', role: StaffRole.Nurse, contract: ContractType.H6, teamIds: ['team-se'], phone: '391234567890', email: 'elaouane.kaoutar@ospedale.it', password: 'password123', hasLaw104: false, specialRules: '', unavailableShiftCodes: [] },
    { id: '18', name: 'Di Bernardino Martina', role: StaffRole.Nurse, contract: ContractType.H12, teamIds: ['team-se'], phone: '391234567890', email: 'dibernardino.martina@ospedale.it', password: 'password123', hasLaw104: false, specialRules: '', unavailableShiftCodes: [] },
    { id: '19', name: 'Marianelli Debora', role: StaffRole.Nurse, contract: ContractType.H12, teamIds: ['team-se'], phone: '391234567890', email: 'marianelli.debora@ospedale.it', password: 'password123', hasLaw104: false, specialRules: '', unavailableShiftCodes: [] },
    { id: '20', name: 'Bruni Eleonora', role: StaffRole.Nurse, contract: ContractType.H12, teamIds: ['team-se'], phone: '391234567890', email: 'bruni.eleonora@ospedale.it', password: 'password123', hasLaw104: false, specialRules: '', unavailableShiftCodes: [] },
    { id: '21', name: 'Russo Diego', role: StaffRole.Nurse, contract: ContractType.H12, teamIds: ['team-se'], phone: '391234567890', email: 'russo.diego@ospedale.it', password: 'password123', hasLaw104: false, specialRules: '', unavailableShiftCodes: [] },
    { id: '22', name: 'Barletta M.Enza', role: StaffRole.Nurse, contract: ContractType.H12, teamIds: ['team-se'], phone: '391234567890', email: 'barletta.enza@ospedale.it', password: 'password123', hasLaw104: false, specialRules: '', unavailableShiftCodes: [] },
    { id: '23', name: 'Moriconi Annarita', role: StaffRole.Nurse, contract: ContractType.H12, teamIds: ['team-se'], phone: '391234567890', email: 'moriconi.annarita@ospedale.it', password: 'password123', hasLaw104: false, specialRules: '', unavailableShiftCodes: [] },
    { id: '24', name: 'Massa Enrica', role: StaffRole.Nurse, contract: ContractType.H12, teamIds: ['team-se'], phone: '391234567890', email: 'massa.enrica@ospedale.it', password: 'password123', hasLaw104: false, specialRules: '', unavailableShiftCodes: [] },
    { id: '25', name: 'Ottaviani Fabio', role: StaffRole.Nurse, contract: ContractType.H12, teamIds: ['team-se'], phone: '391234567890', email: 'ottaviani.fabio@ospedale.it', password: 'password123', hasLaw104: false, specialRules: '', unavailableShiftCodes: [] },
    { id: '26', name: 'Panella Tiziana', role: StaffRole.Nurse, contract: ContractType.H12, teamIds: ['team-se'], phone: '391234567890', email: 'panella.tiziana@ospedale.it', password: 'password123', hasLaw104: false, specialRules: '', unavailableShiftCodes: [] },
    { id: '27', name: 'Brandolini Francesca', role: StaffRole.Nurse, contract: ContractType.H12, teamIds: ['team-se'], phone: '391234567890', email: 'brandolini.francesca@ospedale.it', password: 'password123', hasLaw104: false, specialRules: '', unavailableShiftCodes: [] },
    { id: '28', name: 'Bonanni Maria', role: StaffRole.Nurse, contract: ContractType.H6, teamIds: ['team-se'], phone: '391234567890', email: 'bonanni.maria@ospedale.it', password: 'password123', hasLaw104: false, specialRules: '', unavailableShiftCodes: [] },
    { id: '29', name: 'Michelini Silvia', role: StaffRole.Nurse, contract: ContractType.H6, teamIds: ['team-se'], phone: '391234567890', email: 'michelini.silvia@ospedale.it', password: 'password123', hasLaw104: false, specialRules: '', unavailableShiftCodes: [] },
    { id: '30', name: 'Orfino Alessia', role: StaffRole.Nurse, contract: ContractType.H6, teamIds: ['team-se'], phone: '391234567890', email: 'orfino.alessia@ospedale.it', password: 'password123', hasLaw104: false, specialRules: '', unavailableShiftCodes: [] },
    { id: '31', name: 'Ciofani Marta', role: StaffRole.Nurse, contract: ContractType.H24, teamIds: ['team-se'], phone: '391234567890', email: 'ciofani.marta@ospedale.it', password: 'password123', hasLaw104: false, specialRules: '', unavailableShiftCodes: [] },
    { id: '32', name: 'Cinili M.Pia', role: StaffRole.Nurse, contract: ContractType.H24, teamIds: ['team-se'], phone: '391234567890', email: 'cinili.pia@ospedale.it', password: 'password123', hasLaw104: false, specialRules: '', unavailableShiftCodes: [] },
    { id: '33', name: 'Vaccelli Francesco', role: StaffRole.Nurse, contract: ContractType.H24, teamIds: ['team-se'], phone: '391234567890', email: 'vaccelli.francesco@ospedale.it', password: 'password123', hasLaw104: false, specialRules: '', unavailableShiftCodes: [] },
    { id: '34', name: 'Vanegas Chloe', role: StaffRole.Nurse, contract: ContractType.H24, teamIds: ['team-se'], phone: '391234567890', email: 'vanegas.chloe@ospedale.it', password: 'password123', hasLaw104: false, specialRules: '', unavailableShiftCodes: [] },
    { id: '35', name: 'Rinaldi Simone', role: StaffRole.Nurse, contract: ContractType.H24, teamIds: ['team-se'], phone: '391234567890', email: 'rinaldi.simone@ospedale.it', password: 'password123', hasLaw104: false, specialRules: '', unavailableShiftCodes: [] },
    { id: '36', name: 'Fiasco Stefania', role: StaffRole.Nurse, contract: ContractType.H24, teamIds: ['team-se'], phone: '391234567890', email: 'fiasco.stefania@ospedale.it', password: 'password123', hasLaw104: false, specialRules: '', unavailableShiftCodes: [] },
    { id: '37', name: 'Ribaudi Alessia', role: StaffRole.Nurse, contract: ContractType.H24, teamIds: ['team-se'], phone: '391234567890', email: 'ribaudi.alessia@ospedale.it', password: 'password123', hasLaw104: false, specialRules: '', unavailableShiftCodes: [] },
    { id: '38', name: 'Spoletini Veronica', role: StaffRole.Nurse, contract: ContractType.H24, teamIds: ['team-se'], phone: '391234567890', email: 'spoletini.veronica@ospedale.it', password: 'password123', hasLaw104: false, specialRules: '', unavailableShiftCodes: [] },
    { id: '39', name: 'Ciafrei Ivano', role: StaffRole.Nurse, contract: ContractType.H24, teamIds: ['team-se'], phone: '391234567890', email: 'ciafrei.ivano@ospedale.it', password: 'password123', hasLaw104: false, specialRules: '', unavailableShiftCodes: [] },
    { id: '40', name: 'Pagano Leopoldo', role: StaffRole.Nurse, contract: ContractType.H24, teamIds: ['team-se'], phone: '391234567890', email: 'pagano.leopoldo@ospedale.it', password: 'password123', hasLaw104: false, specialRules: '', unavailableShiftCodes: [] },
    { id: '41', name: 'Restaino Alessandro', role: StaffRole.Nurse, contract: ContractType.H24, teamIds: ['team-se'], phone: '391234567890', email: 'restaino.alessandro@ospedale.it', password: 'password123', hasLaw104: false, specialRules: '', unavailableShiftCodes: [] },
    { id: '42', name: 'Passeri Rosita', role: StaffRole.Nurse, contract: ContractType.H24, teamIds: ['team-se'], phone: '391234567890', email: 'passeri.rosita@ospedale.it', password: 'password123', hasLaw104: false, specialRules: '', unavailableShiftCodes: [] },
    { id: '43', name: 'Iandolo Ilaria', role: StaffRole.Nurse, contract: ContractType.H24, teamIds: ['team-se'], phone: '391234567890', email: 'iandolo.ilaria@ospedale.it', password: 'password123', hasLaw104: false, specialRules: '', unavailableShiftCodes: [] },
    { id: '44', name: 'Vannacci Valentino', role: StaffRole.Nurse, contract: ContractType.H24, teamIds: ['team-se'], phone: '391234567890', email: 'vannacci.valentino@ospedale.it', password: 'password123', hasLaw104: false, specialRules: '', unavailableShiftCodes: [] },
    { id: '45', name: 'Marchese Rossana', role: StaffRole.Nurse, contract: ContractType.H24, teamIds: ['team-se'], phone: '391234567890', email: 'marchese.rossana@ospedale.it', password: 'password123', hasLaw104: false, specialRules: '', unavailableShiftCodes: [] },
    { id: '46', name: 'Longo Andrea Simone', role: StaffRole.Nurse, contract: ContractType.H24, teamIds: ['team-se'], phone: '391234567890', email: 'longo.andrea@ospedale.it', password: 'password123', hasLaw104: false, specialRules: '', unavailableShiftCodes: [] },
    { id: '47', name: 'Viola Simone', role: StaffRole.Nurse, contract: ContractType.H24, teamIds: ['team-misto'], phone: '391234567890', email: 'viola.simone@ospedale.it', password: 'password123', hasLaw104: false, specialRules: '', unavailableShiftCodes: [] },
    { id: '48', name: 'Giglioni Alessandro', role: StaffRole.Nurse, contract: ContractType.H24, teamIds: ['team-se'], phone: '391234567890', email: 'giglioni.alessandro@ospedale.it', password: 'password123', hasLaw104: false, specialRules: '', unavailableShiftCodes: [] },
    { id: '49', name: 'Incerti Liborio Emanuele', role: StaffRole.Nurse, contract: ContractType.H24, teamIds: ['team-se'], phone: '391234567890', email: 'incerti.liborio@ospedale.it', password: 'password123', hasLaw104: false, specialRules: '', unavailableShiftCodes: [] },
    { id: '50', name: 'Di Giuditta Assunta', role: StaffRole.Nurse, contract: ContractType.H24, teamIds: ['team-se'], phone: '391234567890', email: 'digiuditta.assunta@ospedale.it', password: 'password123', hasLaw104: false, specialRules: '', unavailableShiftCodes: [] },
    { id: '51', name: 'Di Carlo Angela', role: StaffRole.Nurse, contract: ContractType.H12, teamIds: ['team-se'], phone: '391234567890', email: 'dicarlo.angela@ospedale.it', password: 'password123', hasLaw104: false, specialRules: '', unavailableShiftCodes: [] },
    { id: '52', name: 'Martinelli Gloria', role: StaffRole.Nurse, contract: ContractType.H6, teamIds: ['team-se'], phone: '391234567890', email: 'martinelli.gloria@ospedale.it', password: 'password123', hasLaw104: false, specialRules: '', unavailableShiftCodes: [] },

    // OSS
    { id: '53', name: 'Paris Paola', role: StaffRole.OSS, contract: ContractType.H12, teamIds: ['team-se'], phone: '391234567890', email: 'paris.paola@ospedale.it', password: 'password123', hasLaw104: false, specialRules: '', unavailableShiftCodes: [] },
    { id: '54', name: 'Pantaleoni Nicole', role: StaffRole.OSS, contract: ContractType.H12, teamIds: ['team-se'], phone: '391234567890', email: 'pantaleoni.nicole@ospedale.it', password: 'password123', hasLaw104: false, specialRules: '', unavailableShiftCodes: [] },
    { id: '55', name: 'Perotti Daniele', role: StaffRole.OSS, contract: ContractType.H12, teamIds: ['team-se'], phone: '391234567890', email: 'perotti.daniele@ospedale.it', password: 'password123', hasLaw104: false, specialRules: '', unavailableShiftCodes: [] },
    { id: '56', name: 'Colongo Danilo', role: StaffRole.OSS, contract: ContractType.H12, teamIds: ['team-se'], phone: '391234567890', email: 'colongo.danilo@ospedale.it', password: 'password123', hasLaw104: false, specialRules: '', unavailableShiftCodes: [] },
    { id: '57', name: 'Colasanti M.Antonietta', role: StaffRole.OSS, contract: ContractType.H12, teamIds: ['team-se'], phone: '391234567890', email: 'colasanti.antonietta@ospedale.it', password: 'password123', hasLaw104: false, specialRules: '', unavailableShiftCodes: [] },
    { id: '58', name: 'Micacchioni Jennifer', role: StaffRole.OSS, contract: ContractType.H12, teamIds: ['team-se'], phone: '391234567890', email: 'micacchioni.jennifer@ospedale.it', password: 'password123', hasLaw104: false, specialRules: '', unavailableShiftCodes: [] },
    { id: '59', name: 'Traballoni Daniela', role: StaffRole.OSS, contract: ContractType.H12, teamIds: ['team-se'], phone: '391234567890', email: 'traballoni.daniela@ospedale.it', password: 'password123', hasLaw104: false, specialRules: '', unavailableShiftCodes: [] },

    // Medici
    { id: '60', name: 'Pittiglio Michele', role: StaffRole.Doctor, contract: ContractType.H24, teamIds: ['team-se'], password: 'password123', hasLaw104: false, specialRules: '', unavailableShiftCodes: [] },
    { id: '61', name: 'Sara Dominijanni', role: StaffRole.Doctor, contract: ContractType.H24, teamIds: ['team-se'], password: 'password123', hasLaw104: false, specialRules: '', unavailableShiftCodes: [] },
    { id: '62', name: 'Angeloni Vincenzo', role: StaffRole.Doctor, contract: ContractType.H24, teamIds: ['team-se'], password: 'password123', hasLaw104: false, specialRules: '', unavailableShiftCodes: [] },
    { id: '63', name: 'Giuliani Giovanni', role: StaffRole.Doctor, contract: ContractType.H24, teamIds: ['team-se', 'team-cto'], password: 'password123', hasLaw104: false, specialRules: '', unavailableShiftCodes: [] },
    { id: '64', name: 'Moscatelli Mariana', role: StaffRole.Doctor, contract: ContractType.H24, teamIds: ['team-se'], password: 'password123', hasLaw104: false, specialRules: '', unavailableShiftCodes: [] },


    // Placeholder per turni scoperti (mantiene un ruolo generico, ma è gestito a parte)
    { id: UNASSIGNED_STAFF_ID, name: 'Turni Scoperti', role: StaffRole.Nurse, contract: ContractType.H24, teamIds: [], hasLaw104: false, specialRules: '', unavailableShiftCodes: [] },
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

    // --- Turni Medici ---
    { code: 'G_doc', description: "Guardia", location: Location.SantEugenioER, time: ShiftTime.FullDay, color: '#fecaca', textColor: '#991b1b', roles: [StaffRole.Doctor] }, // red-200, red-800
    { code: 'R_doc', description: "Reperibilità", location: Location.Management, time: ShiftTime.FullDay, color: '#fed7aa', textColor: '#9a3412', roles: [StaffRole.Doctor] }, // orange-200, orange-800
    { code: 'A_doc', description: "Ambulatorio", location: Location.SantEugenioClinic, time: ShiftTime.Morning, color: '#bfdbfe', textColor: '#1e40af', roles: [StaffRole.Doctor] }, // blue-200, blue-800
    { code: 'N_doc', description: "Notte Medico", location: Location.SantEugenioNephrology, time: ShiftTime.Night, color: '#1f2937', textColor: '#f9fafb', roles: [StaffRole.Doctor] }, // gray-800, gray-50
    
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
