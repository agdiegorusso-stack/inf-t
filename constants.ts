
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
