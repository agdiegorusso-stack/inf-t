
import type { Staff, Team, ShiftDefinition } from './types';
import { StaffRole, ContractType, Location, ShiftTime } from './types';

// ID speciale per rappresentare la riga dei turni scoperti nel calendario
export const UNASSIGNED_STAFF_ID = 'unassigned';

// Elenco dei codici di turno considerati 'lunghi' o straordinari
export const LONG_SHIFTS = ['Ps'];

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


// --- MOCK DATA ---
const parseCsvArray = (str: string | null | undefined): string[] => {
    if (!str || str === '{}' || str.trim() === '') return [];
    return str.replace(/[{}"']/g, '').split(',').map(s => s.trim()).filter(Boolean);
};

let STAFF_DATA_RAW: Omit<Staff, 'teamIds'>[] = [
    { id: "1", name: "Bevilacqua Monica", role: StaffRole.HeadNurse, contract: ContractType.H12, phone: "391234567890", email: "monica.bevilacqua@aslroma2.it", hasLaw104: false, specialRules: "", unavailableShiftCodes: [], password: 'password123', availableForLongShifts: true, maxLongShiftsPerMonth: 2 },
    { id: "2", name: "Vaccaro Pietro", role: StaffRole.HeadNurse, contract: ContractType.H12, phone: "391234567890", email: "pietro.vaccaro@aslroma2.it", hasLaw104: false, specialRules: "", unavailableShiftCodes: [], password: 'password123', availableForLongShifts: true, maxLongShiftsPerMonth: 2 },
    { id: "3", name: "Marrama Anna Maria", role: StaffRole.HeadNurse, contract: ContractType.H12, phone: "391234567890", email: "annamaria.marrama@aslroma2.it", hasLaw104: false, specialRules: "", unavailableShiftCodes: [], password: 'password123', availableForLongShifts: true, maxLongShiftsPerMonth: 2 },
    { id: "4", name: "Bobo Alessandro", role: StaffRole.Nurse, contract: ContractType.H12, phone: "391234567890", email: "alessandro.bobo@aslroma2.it", hasLaw104: false, specialRules: "", unavailableShiftCodes: [], password: 'password123', availableForLongShifts: true, maxLongShiftsPerMonth: 1 },
    { id: "5", name: "Caprioli Francesca", role: StaffRole.Nurse, contract: ContractType.H12, phone: "391234567890", email: "francesca.caprioli@aslroma2.it", hasLaw104: false, specialRules: "", unavailableShiftCodes: [], password: 'password123', availableForLongShifts: true, maxLongShiftsPerMonth: 1 },
    { id: "6", name: "Amatucci Elisa", role: StaffRole.Nurse, contract: ContractType.H12, phone: "391234567890", email: "amatucci.elisa@ospedale.it", hasLaw104: false, specialRules: "", unavailableShiftCodes: [], password: 'password123', availableForLongShifts: true, maxLongShiftsPerMonth: 1 },
    { id: "7", name: "Cardillo Marcello", role: StaffRole.Nurse, contract: ContractType.H12, phone: "391234567890", email: "cardillo.marcello@ospedale.it", hasLaw104: false, specialRules: "", unavailableShiftCodes: [], password: 'password123', availableForLongShifts: true, maxLongShiftsPerMonth: 1 },
    { id: "8", name: "Dosa Simona", role: StaffRole.Nurse, contract: ContractType.H12, phone: "391234567890", email: "dosa.simona@ospedale.it", hasLaw104: false, specialRules: "", unavailableShiftCodes: [], password: 'password123', availableForLongShifts: true, maxLongShiftsPerMonth: 1 },
    { id: "9", name: "Costa Adriana", role: StaffRole.Nurse, contract: ContractType.H6, phone: "391234567890", email: "costa.adriana@ospedale.it", hasLaw104: false, specialRules: "", unavailableShiftCodes: [], password: 'password123', availableForLongShifts: false, maxLongShiftsPerMonth: 0 },
    { id: "10", name: "Onofri Nadia", role: StaffRole.Nurse, contract: ContractType.H6, phone: "391234567890", email: "onofri.nadia@ospedale.it", hasLaw104: false, specialRules: "", unavailableShiftCodes: [], password: 'password123', availableForLongShifts: false, maxLongShiftsPerMonth: 0 },
    { id: "11", name: "Di Carlo Michela", role: StaffRole.Nurse, contract: ContractType.H12, phone: "391234567890", email: "dicarlo.michela@ospedale.it", hasLaw104: false, specialRules: "", unavailableShiftCodes: [], password: 'password123', availableForLongShifts: true, maxLongShiftsPerMonth: 1 },
    { id: "12", name: "Mirtella Cinzia", role: StaffRole.Nurse, contract: ContractType.H12, phone: "391234567890", email: "mirtella.cinzia@ospedale.it", hasLaw104: false, specialRules: "", unavailableShiftCodes: [], password: 'password123', availableForLongShifts: true, maxLongShiftsPerMonth: 1 },
    { id: "13", name: "Leto Giorgina", role: StaffRole.Nurse, contract: ContractType.H12, phone: "391234567890", email: "leto.giorgina@ospedale.it", hasLaw104: false, specialRules: "", unavailableShiftCodes: [], password: 'password123', availableForLongShifts: true, maxLongShiftsPerMonth: 1 },
    { id: "14", name: "Cerreto Elisa", role: StaffRole.Nurse, contract: ContractType.H12, phone: "391234567890", email: "cerreto.elisa@ospedale.it", hasLaw104: false, specialRules: "", unavailableShiftCodes: [], password: 'password123', availableForLongShifts: true, maxLongShiftsPerMonth: 1 },
    { id: "15", name: "Evangelista Chiara", role: StaffRole.Nurse, contract: ContractType.H12, phone: "391234567890", email: "evangelista.chiara@ospedale.it", hasLaw104: false, specialRules: "", unavailableShiftCodes: [], password: 'password123', availableForLongShifts: true, maxLongShiftsPerMonth: 1 },
    { id: "16", name: "Fantini Vincenzo", role: StaffRole.Nurse, contract: ContractType.H12, phone: "391234567890", email: "fantini.vincenzo@ospedale.it", hasLaw104: false, specialRules: "", unavailableShiftCodes: [], password: 'password123', availableForLongShifts: true, maxLongShiftsPerMonth: 1 },
    { id: "17", name: "Kaoutar Elaouane", role: StaffRole.Nurse, contract: ContractType.H6, phone: "391234567890", email: "elaouane.kaoutar@ospedale.it", hasLaw104: false, specialRules: "", unavailableShiftCodes: [], password: 'password123', availableForLongShifts: false, maxLongShiftsPerMonth: 0 },
    { id: "18", name: "Di Bernardino Martina", role: StaffRole.Nurse, contract: ContractType.H12, phone: "391234567890", email: "dibernardino.martina@ospedale.it", hasLaw104: false, specialRules: "", unavailableShiftCodes: [], password: 'password123', availableForLongShifts: true, maxLongShiftsPerMonth: 1 },
    { id: "19", name: "Marianelli Debora", role: StaffRole.Nurse, contract: ContractType.H12, phone: "391234567890", email: "marianelli.debora@ospedale.it", hasLaw104: false, specialRules: "", unavailableShiftCodes: [], password: 'password123', availableForLongShifts: true, maxLongShiftsPerMonth: 1 },
    { id: "20", name: "Bruni Eleonora", role: StaffRole.Nurse, contract: ContractType.H12, phone: "391234567890", email: "bruni.eleonora@ospedale.it", hasLaw104: false, specialRules: "", unavailableShiftCodes: [], password: 'password123', availableForLongShifts: true, maxLongShiftsPerMonth: 1 },
    { id: "21", name: "Russo Diego", role: StaffRole.Nurse, contract: ContractType.H12, phone: "391234567890", email: "russo.diego@ospedale.it", hasLaw104: false, specialRules: "", unavailableShiftCodes: [], password: 'password123', availableForLongShifts: true, maxLongShiftsPerMonth: 1 },
    { id: "22", name: "Barletta M.Enza", role: StaffRole.Nurse, contract: ContractType.H12, phone: "391234567890", email: "barletta.enza@ospedale.it", hasLaw104: false, specialRules: "", unavailableShiftCodes: [], password: 'password123', availableForLongShifts: true, maxLongShiftsPerMonth: 1 },
    { id: "23", name: "Moriconi Annarita", role: StaffRole.Nurse, contract: ContractType.H12, phone: "391234567890", email: "moriconi.annarita@ospedale.it", hasLaw104: false, specialRules: "", unavailableShiftCodes: [], password: 'password123', availableForLongShifts: true, maxLongShiftsPerMonth: 1 },
    { id: "24", name: "Massa Enrica", role: StaffRole.Nurse, contract: ContractType.H12, phone: "391234567890", email: "massa.enrica@ospedale.it", hasLaw104: false, specialRules: "", unavailableShiftCodes: [], password: 'password123', availableForLongShifts: true, maxLongShiftsPerMonth: 1 },
    { id: "25", name: "Ottaviani Fabio", role: StaffRole.Nurse, contract: ContractType.H12, phone: "391234567890", email: "ottaviani.fabio@ospedale.it", hasLaw104: false, specialRules: "", unavailableShiftCodes: [], password: 'password123', availableForLongShifts: true, maxLongShiftsPerMonth: 1 },
    { id: "26", name: "Panella Tiziana", role: StaffRole.Nurse, contract: ContractType.H12, phone: "391234567890", email: "panella.tiziana@ospedale.it", hasLaw104: false, specialRules: "", unavailableShiftCodes: [], password: 'password123', availableForLongShifts: true, maxLongShiftsPerMonth: 1 },
    { id: "27", name: "Brandolini Francesca", role: StaffRole.Nurse, contract: ContractType.H12, phone: "391234567890", email: "brandolini.francesca@ospedale.it", hasLaw104: false, specialRules: "", unavailableShiftCodes: [], password: 'password123', availableForLongShifts: true, maxLongShiftsPerMonth: 1 },
    { id: "28", name: "Bonanni Maria", role: StaffRole.Nurse, contract: ContractType.H6, phone: "391234567890", email: "bonanni.maria@ospedale.it", hasLaw104: false, specialRules: "", unavailableShiftCodes: [], password: 'password123', availableForLongShifts: false, maxLongShiftsPerMonth: 0 },
    { id: "29", name: "Michelini Silvia", role: StaffRole.Nurse, contract: ContractType.H6, phone: "391234567890", email: "michelini.silvia@ospedale.it", hasLaw104: false, specialRules: "", unavailableShiftCodes: [], password: 'password123', availableForLongShifts: false, maxLongShiftsPerMonth: 0 },
    { id: "30", name: "Orfino Alessia", role: StaffRole.Nurse, contract: ContractType.H6, phone: "391234567890", email: "orfino.alessia@ospedale.it", hasLaw104: false, specialRules: "", unavailableShiftCodes: [], password: 'password123', availableForLongShifts: false, maxLongShiftsPerMonth: 0 },
    { id: "31", name: "Ciofani Marta", role: StaffRole.Nurse, contract: ContractType.H24, phone: "391234567890", email: "ciofani.marta@ospedale.it", hasLaw104: false, specialRules: "", unavailableShiftCodes: [], nightSquad: 1, password: 'password123', availableForLongShifts: true, maxLongShiftsPerMonth: 3 },
    { id: "32", name: "Cinili M.Pia", role: StaffRole.Nurse, contract: ContractType.H24, phone: "391234567890", email: "cinili.pia@ospedale.it", hasLaw104: false, specialRules: "", unavailableShiftCodes: [], nightSquad: 2, password: 'password123', availableForLongShifts: true, maxLongShiftsPerMonth: 3 },
    { id: "33", name: "Vaccelli Francesco", role: StaffRole.Nurse, contract: ContractType.H24, phone: "391234567890", email: "vaccelli.francesco@ospedale.it", hasLaw104: false, specialRules: "", unavailableShiftCodes: [], nightSquad: 3, password: 'password123', availableForLongShifts: true, maxLongShiftsPerMonth: 3 },
    { id: "34", name: "Vanegas Chloe", role: StaffRole.Nurse, contract: ContractType.H24, phone: "391234567890", email: "vanegas.chloe@ospedale.it", hasLaw104: false, specialRules: "", unavailableShiftCodes: [], nightSquad: 4, password: 'password123', availableForLongShifts: true, maxLongShiftsPerMonth: 3 },
    { id: "35", name: "Rinaldi Simone", role: StaffRole.Nurse, contract: ContractType.H24, phone: "391234567890", email: "rinaldi.simone@ospedale.it", hasLaw104: false, specialRules: "", unavailableShiftCodes: [], nightSquad: 5, password: 'password123', availableForLongShifts: true, maxLongShiftsPerMonth: 3 },
    { id: "36", name: "Fiasco Stefania", role: StaffRole.Nurse, contract: ContractType.H24, phone: "391234567890", email: "fiasco.stefania@ospedale.it", hasLaw104: false, specialRules: "", unavailableShiftCodes: [], nightSquad: 1, password: 'password123', availableForLongShifts: true, maxLongShiftsPerMonth: 3 },
    { id: "37", name: "Ribaudi Alessia", role: StaffRole.Nurse, contract: ContractType.H24, phone: "391234567890", email: "ribaudi.alessia@ospedale.it", hasLaw104: false, specialRules: "", unavailableShiftCodes: [], nightSquad: 2, password: 'password123', availableForLongShifts: true, maxLongShiftsPerMonth: 3 },
    { id: "38", name: "Spoletini Veronica", role: StaffRole.Nurse, contract: ContractType.H24, phone: "391234567890", email: "spoletini.veronica@ospedale.it", hasLaw104: false, specialRules: "", unavailableShiftCodes: [], nightSquad: 3, password: 'password123', availableForLongShifts: true, maxLongShiftsPerMonth: 3 },
    { id: "39", name: "Ciafrei Ivano", role: StaffRole.Nurse, contract: ContractType.H24, phone: "391234567890", email: "ciafrei.ivano@ospedale.it", hasLaw104: false, specialRules: "", unavailableShiftCodes: [], nightSquad: 4, password: 'password123', availableForLongShifts: true, maxLongShiftsPerMonth: 3 },
    { id: "40", name: "Pagano Leopoldo", role: StaffRole.Nurse, contract: ContractType.H24, phone: "391234567890", email: "pagano.leopoldo@ospedale.it", hasLaw104: false, specialRules: "", unavailableShiftCodes: [], nightSquad: 5, password: 'password123', availableForLongShifts: true, maxLongShiftsPerMonth: 3 },
    { id: "41", name: "Restaino Alessandro", role: StaffRole.Nurse, contract: ContractType.H24, phone: "391234567890", email: "restaino.alessandro@ospedale.it", hasLaw104: false, specialRules: "", unavailableShiftCodes: [], nightSquad: 1, password: 'password123', availableForLongShifts: true, maxLongShiftsPerMonth: 3 },
    { id: "42", name: "Passeri Rosita", role: StaffRole.Nurse, contract: ContractType.H24, phone: "391234567890", email: "passeri.rosita@ospedale.it", hasLaw104: false, specialRules: "", unavailableShiftCodes: [], nightSquad: 2, password: 'password123', availableForLongShifts: true, maxLongShiftsPerMonth: 3 },
    { id: "43", name: "Iandolo Ilaria", role: StaffRole.Nurse, contract: ContractType.H24, phone: "391234567890", email: "iandolo.ilaria@ospedale.it", hasLaw104: false, specialRules: "", unavailableShiftCodes: [], nightSquad: 3, password: 'password123', availableForLongShifts: true, maxLongShiftsPerMonth: 3 },
    { id: "44", name: "Vannacci Valentino", role: StaffRole.Nurse, contract: ContractType.H24, phone: "391234567890", email: "vannacci.valentino@ospedale.it", hasLaw104: false, specialRules: "", unavailableShiftCodes: [], nightSquad: 4, password: 'password123', availableForLongShifts: true, maxLongShiftsPerMonth: 3 },
    { id: "45", name: "Marchese Rossana", role: StaffRole.Nurse, contract: ContractType.H24, phone: "391234567890", email: "marchese.rossana@ospedale.it", hasLaw104: false, specialRules: "", unavailableShiftCodes: [], nightSquad: 5, password: 'password123', availableForLongShifts: true, maxLongShiftsPerMonth: 3 },
    { id: "46", name: "Longo Andrea Simone", role: StaffRole.Nurse, contract: ContractType.H24, phone: "391234567890", email: "longo.andrea@ospedale.it", hasLaw104: false, specialRules: "", unavailableShiftCodes: [], nightSquad: 1, password: 'password123', availableForLongShifts: true, maxLongShiftsPerMonth: 3 },
    { id: "47", name: "Viola Simone", role: StaffRole.Nurse, contract: ContractType.H24, phone: "391234567890", email: "viola.simone@ospedale.it", hasLaw104: false, specialRules: "", unavailableShiftCodes: [], nightSquad: 2, password: 'password123', availableForLongShifts: true, maxLongShiftsPerMonth: 3 },
    { id: "48", name: "Giglioni Alessandro", role: StaffRole.Nurse, contract: ContractType.H24, phone: "391234567890", email: "giglioni.alessandro@ospedale.it", hasLaw104: false, specialRules: "", unavailableShiftCodes: [], nightSquad: 3, password: 'password123', availableForLongShifts: true, maxLongShiftsPerMonth: 3 },
    { id: "49", name: "Incerti Liborio Emanuele", role: StaffRole.Nurse, contract: ContractType.H24, phone: "391234567890", email: "incerti.liborio@ospedale.it", hasLaw104: false, specialRules: "", unavailableShiftCodes: [], nightSquad: 4, password: 'password123', availableForLongShifts: true, maxLongShiftsPerMonth: 3 },
    { id: "50", name: "Di Giuditta Assunta", role: StaffRole.Nurse, contract: ContractType.H24, phone: "391234567890", email: "digiuditta.assunta@ospedale.it", hasLaw104: false, specialRules: "", unavailableShiftCodes: [], nightSquad: 5, password: 'password123', availableForLongShifts: true, maxLongShiftsPerMonth: 3 },
    { id: "51", name: "Di Carlo Angela", role: StaffRole.Nurse, contract: ContractType.H12, phone: "391234567890", email: "dicarlo.angela@ospedale.it", hasLaw104: false, specialRules: "", unavailableShiftCodes: [], password: 'password123', availableForLongShifts: true, maxLongShiftsPerMonth: 1 },
    { id: "52", name: "Martinelli Gloria", role: StaffRole.Nurse, contract: ContractType.H6, phone: "391234567890", email: "martinelli.gloria@ospedale.it", hasLaw104: false, specialRules: "", unavailableShiftCodes: [], password: 'password123', availableForLongShifts: false, maxLongShiftsPerMonth: 0 },
    { id: "53", name: "Paris Paola", role: StaffRole.OSS, contract: ContractType.H12, phone: "391234567890", email: "paris.paola@ospedale.it", hasLaw104: false, specialRules: "", unavailableShiftCodes: [], password: 'password123', availableForLongShifts: true, maxLongShiftsPerMonth: 1 },
    { id: "54", name: "Pantaleoni Nicole", role: StaffRole.OSS, contract: ContractType.H12, phone: "391234567890", email: "pantaleoni.nicole@ospedale.it", hasLaw104: false, specialRules: "", unavailableShiftCodes: [], password: 'password123', availableForLongShifts: true, maxLongShiftsPerMonth: 1 },
    { id: "55", name: "Perotti Daniele", role: StaffRole.OSS, contract: ContractType.H12, phone: "391234567890", email: "perotti.daniele@ospedale.it", hasLaw104: false, specialRules: "", unavailableShiftCodes: [], password: 'password123', availableForLongShifts: true, maxLongShiftsPerMonth: 1 },
    { id: "56", name: "Colongo Danilo", role: StaffRole.OSS, contract: ContractType.H12, phone: "391234567890", email: "colongo.danilo@ospedale.it", hasLaw104: false, specialRules: "", unavailableShiftCodes: [], password: 'password123', availableForLongShifts: true, maxLongShiftsPerMonth: 1 },
    { id: "57", name: "Colasanti M.Antonietta", role: StaffRole.OSS, contract: ContractType.H12, phone: "391234567890", email: "colasanti.antonietta@ospedale.it", hasLaw104: false, specialRules: "", unavailableShiftCodes: [], password: 'password123', availableForLongShifts: true, maxLongShiftsPerMonth: 1 },
    { id: "58", name: "Micacchioni Jennifer", role: StaffRole.OSS, contract: ContractType.H12, phone: "391234567890", email: "micacchioni.jennifer@ospedale.it", hasLaw104: false, specialRules: "", unavailableShiftCodes: [], password: 'password123', availableForLongShifts: true, maxLongShiftsPerMonth: 1 },
    { id: "59", name: "Traballoni Daniela", role: StaffRole.OSS, contract: ContractType.H12, phone: "391234567890", email: "traballoni.daniela@ospedale.it", hasLaw104: false, specialRules: "", unavailableShiftCodes: [], password: 'password123', availableForLongShifts: true, maxLongShiftsPerMonth: 1 },
    { id: "60", name: "Pittiglio Michele", role: StaffRole.Doctor, contract: ContractType.H24, phone: "", email: "", hasLaw104: false, specialRules: "", unavailableShiftCodes: [], nightSquad: 1, password: 'password123', availableForLongShifts: true, maxLongShiftsPerMonth: 3 },
    { id: "61", name: "Sara Dominijanni", role: StaffRole.Doctor, contract: ContractType.H24, phone: "", email: "", hasLaw104: false, specialRules: "", unavailableShiftCodes: [], nightSquad: 2, password: 'password123', availableForLongShifts: true, maxLongShiftsPerMonth: 3 },
    { id: "62", name: "Angeloni Vincenzo", role: StaffRole.Doctor, contract: ContractType.H24, phone: "", email: "", hasLaw104: false, specialRules: "", unavailableShiftCodes: [], nightSquad: 3, password: 'password123', availableForLongShifts: true, maxLongShiftsPerMonth: 3 },
    { id: "63", name: "Giuliani Giovanni", role: StaffRole.Doctor, contract: ContractType.H24, phone: "", email: "", hasLaw104: false, specialRules: "", unavailableShiftCodes: [], nightSquad: 4, password: 'password123', availableForLongShifts: true, maxLongShiftsPerMonth: 3 },
    { id: "64", name: "Moscatelli Mariana", role: StaffRole.Doctor, contract: ContractType.H24, phone: "", email: "", hasLaw104: false, specialRules: "", unavailableShiftCodes: [], nightSquad: 5, password: 'password123', availableForLongShifts: true, maxLongShiftsPerMonth: 3 },
    { id: UNASSIGNED_STAFF_ID, name: 'Turni Scoperti', role: StaffRole.Nurse, contract: ContractType.H24, password: '', availableForLongShifts: false, maxLongShiftsPerMonth: 0 }
];

export let mockTeams: Team[] = [
    { id: "team-se", name: "Team Sant'Eugenio", locations: parseCsvArray("{Dialisi Sant'Eugenio,Urgenza Sant'Eugenio,Reparto Nefrologia Sant'Eugenio,Ambulatorio DH Sant'Eugenio,Stanza B,Piano 0,Piano 2}") as Location[], allowedShiftCodes: parseCsvArray("{Md,Ps,Mu,Pu,Mn,Pn,N,Mat,Mat/e,Me,Pe,Mb,Pb,M0,P0,MT,PT,G_doc,R_doc,A_doc,N_doc}") },
    { id: "team-sc", name: "Team Santa Caterina", locations: parseCsvArray("{Dialisi Santa Caterina}") as Location[], allowedShiftCodes: parseCsvArray("{Msc,Psc}") },
    { id: "team-cto", name: "Team CTO", locations: parseCsvArray("{Dialisi CTO,Dialisi Peritoneale CTO}") as Location[], allowedShiftCodes: parseCsvArray("{Mc,Pc,Mac,G_doc,R_doc}") },
    { id: "team-co", name: "Team Camera Operatoria", locations: parseCsvArray("{Sala Operatoria Sant'Eugenio}") as Location[], allowedShiftCodes: parseCsvArray("{Mco}") },
    { id: "team-misto", name: "Team Misto (Tutte le Sedi)", locations: parseCsvArray("{Dialisi Sant'Eugenio,Dialisi Santa Caterina,Dialisi CTO,Urgenza Sant'Eugenio,Sala Operatoria Sant'Eugenio,Dialisi Peritoneale CTO,Reparto Nefrologia Sant'Eugenio,Ambulatorio DH Sant'Eugenio,Ambulatorio Via Marotta,Esterno,Stanza B,Piano 0,Piano 2}") as Location[], allowedShiftCodes: parseCsvArray("{Md,Ps,Msc,Psc,Mc,Pc,Mu,Pu,Mco,Mac,Mn,Pn,N,Mat,Mat/e,Me,Pe,Mb,Pb}") },
    { id: "team-management", name: "Team Direzione", locations: parseCsvArray("{Direzione}") as Location[], allowedShiftCodes: parseCsvArray("{M,R_doc}") },
];

const STAFF_TEAMS_DATA = [
    { staff_id: "1", team_id: "team-management" }, { staff_id: "2", team_id: "team-management" }, { staff_id: "3", team_id: "team-management" },
    { staff_id: "4", team_id: "team-se" }, { staff_id: "4", team_id: "team-misto" }, { staff_id: "5", team_id: "team-sc" }, { staff_id: "5", team_id: "team-misto" },
    { staff_id: "6", team_id: "team-se" }, { staff_id: "6", team_id: "team-misto" }, { staff_id: "7", team_id: "team-se" }, { staff_id: "7", team_id: "team-misto" },
    { staff_id: "8", team_id: "team-cto" }, { staff_id: "8", team_id: "team-misto" }, { staff_id: "9", team_id: "team-se" }, { staff_id: "9", team_id: "team-misto" },
    { staff_id: "10", team_id: "team-se" }, { staff_id: "10", team_id: "team-misto" }, { staff_id: "11", team_id: "team-se" }, { staff_id: "11", team_id: "team-misto" },
    { staff_id: "12", team_id: "team-se" }, { staff_id: "12", team_id: "team-misto" }, { staff_id: "13", team_id: "team-se" }, { staff_id: "13", team_id: "team-misto" },
    { staff_id: "14", team_id: "team-se" }, { staff_id: "14", team_id: "team-misto" }, { staff_id: "15", team_id: "team-se" }, { staff_id: "15", team_id: "team-misto" },
    { staff_id: "16", team_id: "team-se" }, { staff_id: "16", team_id: "team-misto" }, { staff_id: "17", team_id: "team-se" }, { staff_id: "17", team_id: "team-misto" },
    { staff_id: "18", team_id: "team-se" }, { staff_id: "18", team_id: "team-misto" }, { staff_id: "19", team_id: "team-se" }, { staff_id: "19", team_id: "team-misto" },
    { staff_id: "20", team_id: "team-se" }, { staff_id: "20", team_id: "team-misto" }, { staff_id: "21", team_id: "team-se" }, { staff_id: "21", team_id: "team-misto" },
    { staff_id: "22", team_id: "team-se" }, { staff_id: "22", team_id: "team-misto" }, { staff_id: "23", team_id: "team-se" }, { staff_id: "23", team_id: "team-misto" },
    { staff_id: "24", team_id: "team-se" }, { staff_id: "24", team_id: "team-misto" }, { staff_id: "25", team_id: "team-se" }, { staff_id: "25", team_id: "team-misto" },
    { staff_id: "26", team_id: "team-se" }, { staff_id: "26", team_id: "team-misto" }, { staff_id: "27", team_id: "team-se" }, { staff_id: "27", team_id: "team-misto" },
    { staff_id: "28", team_id: "team-se" }, { staff_id: "28", team_id: "team-misto" }, { staff_id: "29", team_id: "team-se" }, { staff_id: "29", team_id: "team-misto" },
    { staff_id: "30", team_id: "team-se" }, { staff_id: "30", team_id: "team-misto" }, { staff_id: "31", team_id: "team-se" }, { staff_id: "31", team_id: "team-misto" },
    { staff_id: "32", team_id: "team-se" }, { staff_id: "32", team_id: "team-misto" }, { staff_id: "33", team_id: "team-se" }, { staff_id: "33", team_id: "team-misto" },
    { staff_id: "34", team_id: "team-se" }, { staff_id: "34", team_id: "team-misto" }, { staff_id: "35", team_id: "team-se" }, { staff_id: "35", team_id: "team-misto" },
    { staff_id: "36", team_id: "team-se" }, { staff_id: "36", team_id: "team-misto" }, { staff_id: "37", team_id: "team-se" }, { staff_id: "37", team_id: "team-misto" },
    { staff_id: "38", team_id: "team-se" }, { staff_id: "38", team_id: "team-misto" }, { staff_id: "39", team_id: "team-se" }, { staff_id: "39", team_id: "team-misto" },
    { staff_id: "40", team_id: "team-se" }, { staff_id: "40", team_id: "team-misto" }, { staff_id: "41", team_id: "team-se" }, { staff_id: "41", team_id: "team-misto" },
    { staff_id: "42", team_id: "team-se" }, { staff_id: "42", team_id: "team-misto" }, { staff_id: "43", team_id: "team-se" }, { staff_id: "43", team_id: "team-misto" },
    { staff_id: "44", team_id: "team-se" }, { staff_id: "44", team_id: "team-misto" }, { staff_id: "45", team_id: "team-se" }, { staff_id: "45", team_id: "team-misto" },
    { staff_id: "46", team_id: "team-se" }, { staff_id: "46", team_id: "team-misto" }, { staff_id: "47", team_id: "team-misto" }, { staff_id: "48", team_id: "team-se" },
    { staff_id: "48", team_id: "team-misto" }, { staff_id: "49", team_id: "team-se" }, { staff_id: "49", team_id: "team-misto" }, { staff_id: "50", team_id: "team-se" },
    { staff_id: "50", team_id: "team-misto" }, { staff_id: "51", team_id: "team-se" }, { staff_id: "51", team_id: "team-misto" }, { staff_id: "52", team_id: "team-se" },
    { staff_id: "52", team_id: "team-misto" }, { staff_id: "53", team_id: "team-se" }, { staff_id: "54", team_id: "team-se" }, { staff_id: "55", team_id: "team-se" },
    { staff_id: "56", team_id: "team-se" }, { staff_id: "57", team_id: "team-se" }, { staff_id: "58", team_id: "team-se" }, { staff_id: "59", team_id: "team-se" },
    { staff_id: "60", team_id: "team-se" }, { staff_id: "61", team_id: "team-se" }, { staff_id: "62", team_id: "team-se" }, { staff_id: "63", team_id: "team-se" },
    { staff_id: "63", team_id: "team-cto" }, { staff_id: "64", team_id: "team-se" },
];

const staffWithTeams: Staff[] = STAFF_DATA_RAW.map(staffMember => {
    const teamIds = STAFF_TEAMS_DATA
        .filter(st => st.staff_id === staffMember.id)
        .map(st => st.team_id);
    return { ...staffMember, teamIds };
});

export let mockStaff: Staff[] = staffWithTeams;

export let mockShiftDefinitions: ShiftDefinition[] = [
    { code: "M", description: "Mattina Direzione", location: Location.Management, time: ShiftTime.Morning, color: "bg-slate-200", textColor: "text-slate-800", roles: parseCsvArray("{Caposala}") as StaffRole[] },
    { code: "Md", description: "Mattina Dialisi S.Eugenio", location: Location.SantEugenioDialysis, time: ShiftTime.Morning, color: "bg-blue-200", textColor: "text-blue-800", roles: parseCsvArray("{Infermiere,Caposala}") as StaffRole[] },
    { code: "Ps", description: "Pomeriggio+Sera Dialisi S.Eugenio", location: Location.SantEugenioDialysis, time: ShiftTime.Afternoon, color: "bg-blue-300", textColor: "text-blue-900", roles: parseCsvArray("{Infermiere,Caposala}") as StaffRole[] },
    { code: "Msc", description: "Mattina Dialisi S.Caterina", location: Location.SantaCaterinaDialysis, time: ShiftTime.Morning, color: "bg-green-200", textColor: "text-green-800", roles: parseCsvArray("{Infermiere,Caposala}") as StaffRole[] },
    { code: "Psc", description: "Pomeriggio Dialisi S.Caterina", location: Location.SantaCaterinaDialysis, time: ShiftTime.Afternoon, color: "bg-green-200", textColor: "text-green-800", roles: parseCsvArray("{Infermiere,Caposala}") as StaffRole[] },
    { code: "Mc", description: "Mattina Dialisi CTO", location: Location.CTODialysis, time: ShiftTime.Morning, color: "bg-indigo-200", textColor: "text-indigo-800", roles: parseCsvArray("{Infermiere,Caposala}") as StaffRole[] },
    { code: "Pc", description: "Pomeriggio Dialisi CTO", location: Location.CTODialysis, time: ShiftTime.Afternoon, color: "bg-indigo-200", textColor: "text-indigo-800", roles: parseCsvArray("{Infermiere,Caposala}") as StaffRole[] },
    { code: "Mu", description: "Mattina Urgenza S.Eugenio", location: Location.SantEugenioER, time: ShiftTime.Morning, color: "bg-red-200", textColor: "text-red-800", roles: parseCsvArray("{Infermiere,Caposala}") as StaffRole[] },
    { code: "Pu", description: "Pomeriggio Urgenza S.Eugenio", location: Location.SantEugenioER, time: ShiftTime.Afternoon, color: "bg-red-200", textColor: "text-red-800", roles: parseCsvArray("{Infermiere,Caposala}") as StaffRole[] },
    { code: "Mco", description: "Mattina Sala Operatoria S.Eugenio", location: Location.SantEugenioOR, time: ShiftTime.Morning, color: "bg-purple-200", textColor: "text-purple-800", roles: parseCsvArray("{Infermiere,Caposala}") as StaffRole[] },
    { code: "Mac", description: "Mattina Dialisi Peritoneale CTO", location: Location.CTOPeritoneal, time: ShiftTime.Morning, color: "bg-teal-200", textColor: "text-teal-800", roles: parseCsvArray("{Infermiere,Caposala}") as StaffRole[] },
    { code: "Mn", description: "Mattina Reparto Nefrologia", location: Location.SantEugenioNephrology, time: ShiftTime.Morning, color: "bg-yellow-200", textColor: "text-yellow-800", roles: parseCsvArray("{Infermiere,Caposala}") as StaffRole[] },
    { code: "Pn", description: "Pomeriggio Reparto Nefrologia", location: Location.SantEugenioNephrology, time: ShiftTime.Afternoon, color: "bg-yellow-200", textColor: "text-yellow-800", roles: parseCsvArray("{Infermiere,Caposala}") as StaffRole[] },
    { code: "N", description: "Notte Reparto Nefrologia", location: Location.SantEugenioNephrology, time: ShiftTime.Night, color: "bg-gray-800", textColor: "text-white", roles: parseCsvArray("{Infermiere,Caposala}") as StaffRole[] },
    { code: "Mat", description: "Mattina Ambulatorio", location: Location.SantEugenioClinic, time: ShiftTime.Morning, color: "bg-pink-200", textColor: "text-pink-800", roles: parseCsvArray("{Infermiere,Caposala}") as StaffRole[] },
    { code: "Mat/e", description: "Mattina Ambulatorio/Esterno", location: Location.SantEugenioClinic, time: ShiftTime.Morning, color: "bg-pink-300", textColor: "text-pink-900", roles: parseCsvArray("{Infermiere,Caposala}") as StaffRole[] },
    { code: "Me", description: "Mattina Esterno", location: Location.External, time: ShiftTime.Morning, color: "bg-orange-200", textColor: "text-orange-800", roles: parseCsvArray("{Infermiere,Caposala}") as StaffRole[] },
    { code: "Pe", description: "Pomeriggio Esterno", location: Location.External, time: ShiftTime.Afternoon, color: "bg-orange-200", textColor: "text-orange-800", roles: parseCsvArray("{Infermiere,Caposala}") as StaffRole[] },
    { code: "Mb", description: "Mattina Stanza B", location: Location.RoomB, time: ShiftTime.Morning, color: "bg-yellow-400", textColor: "text-yellow-900", roles: parseCsvArray("{Infermiere,Caposala}") as StaffRole[] },
    { code: "Pb", description: "Pomeriggio Stanza B", location: Location.RoomB, time: ShiftTime.Afternoon, color: "bg-yellow-400", textColor: "text-yellow-900", roles: parseCsvArray("{Infermiere,Caposala}") as StaffRole[] },
    { code: "M0", description: "Mattina Piano 0", location: Location.Floor0, time: ShiftTime.Morning, color: "bg-cyan-200", textColor: "text-cyan-800", roles: parseCsvArray("{OSS}") as StaffRole[] },
    { code: "P0", description: "Pomeriggio Piano 0", location: Location.Floor0, time: ShiftTime.Afternoon, color: "bg-cyan-200", textColor: "text-cyan-800", roles: parseCsvArray("{OSS}") as StaffRole[] },
    { code: "MT", description: "Mattina Piano 2", location: Location.Floor2, time: ShiftTime.Morning, color: "bg-lime-200", textColor: "text-lime-800", roles: parseCsvArray("{OSS}") as StaffRole[] },
    { code: "PT", description: "Pomeriggio Piano 2", location: Location.Floor2, time: ShiftTime.Afternoon, color: "bg-lime-200", textColor: "text-lime-800", roles: parseCsvArray("{OSS}") as StaffRole[] },
    { code: "G_doc", description: "Guardia", location: Location.SantEugenioER, time: ShiftTime.FullDay, color: "#fecaca", textColor: "#991b1b", roles: parseCsvArray("{Medico}") as StaffRole[] },
    { code: "R_doc", description: "Reperibilità", location: Location.Management, time: ShiftTime.FullDay, color: "#fed7aa", textColor: "#9a3412", roles: parseCsvArray("{Medico}") as StaffRole[] },
    { code: "A_doc", description: "Ambulatorio", location: Location.SantEugenioClinic, time: ShiftTime.Morning, color: "#bfdbfe", textColor: "#1e40af", roles: parseCsvArray("{Medico}") as StaffRole[] },
    { code: "N_doc", description: "Notte Medico", location: Location.SantEugenioNephrology, time: ShiftTime.Night, color: "#1f2937", textColor: "#f9fafb", roles: parseCsvArray("{Medico}") as StaffRole[] },
    { code: "S", description: "Smonto Notte", location: Location.SantEugenioNephrology, time: ShiftTime.Rest, color: "bg-gray-400", textColor: "text-white", roles: parseCsvArray("{Caposala,Infermiere,OSS,Medico}") as StaffRole[] },
    { code: "RS", description: "Riposo Settimanale", location: Location.Management, time: ShiftTime.Rest, color: "bg-gray-400", textColor: "text-white", roles: parseCsvArray("{Caposala,Infermiere,OSS,Medico}") as StaffRole[] },
    { code: "R", description: "Riposo", location: Location.Management, time: ShiftTime.Rest, color: "bg-gray-400", textColor: "text-white", roles: parseCsvArray("{Caposala,Infermiere,OSS,Medico}") as StaffRole[] },
    { code: "HD", description: "Permesso L.104", location: Location.Management, time: ShiftTime.Absence, color: "bg-red-500", textColor: "text-white", roles: parseCsvArray("{Caposala,Infermiere,OSS,Medico}") as StaffRole[] },
    { code: "RF", description: "Recupero Festivo", location: Location.Management, time: ShiftTime.Absence, color: "bg-purple-500", textColor: "text-white", roles: parseCsvArray("{Caposala,Infermiere,OSS,Medico}") as StaffRole[] },
    { code: "A", description: "Malattia", location: Location.Management, time: ShiftTime.Absence, color: "bg-red-500", textColor: "text-white", roles: parseCsvArray("{Caposala,Infermiere,OSS,Medico}") as StaffRole[] },
    { code: "T1", description: "Malattia Figlio", location: Location.Management, time: ShiftTime.Absence, color: "bg-red-500", textColor: "text-white", roles: parseCsvArray("{Caposala,Infermiere,OSS,Medico}") as StaffRole[] },
    { code: "FE", description: "Ferie", location: Location.Management, time: ShiftTime.Absence, color: "bg-green-500", textColor: "text-white", roles: parseCsvArray("{Caposala,Infermiere,OSS,Medico}") as StaffRole[] },
    { code: "UNCOVERED", description: "Turno Scoperto", location: Location.Management, time: ShiftTime.OffShift, color: "bg-red-600 animate-pulse", textColor: "text-white", roles: [] },
];
