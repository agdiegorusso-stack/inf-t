import type { ActiveTab } from './App';

export enum StaffRole {
    Nurse = 'Infermiere',
    OSS = 'OSS',
    HeadNurse = 'Caposala',
    Doctor = 'Medico'
}

export enum ContractType {
    H6 = 'h6',
    H12 = 'h12',
    H24 = 'h24'
}

export enum Location {
    SantEugenioDialysis = "Dialisi Sant'Eugenio",
    SantaCaterinaDialysis = "Dialisi Santa Caterina",
    CTODialysis = "Dialisi CTO",
    SantEugenioER = "Urgenza Sant'Eugenio",
    SantEugenioOR = "Sala Operatoria Sant'Eugenio",
    CTOPeritoneal = "Dialisi Peritoneale CTO",
    SantEugenioNephrology = "Reparto Nefrologia Sant'Eugenio",
    SantEugenioClinic = "Ambulatorio DH Sant'Eugenio",
    ViaMarotta = "Ambulatorio Via Marotta",
    External = "Esterno",
    RoomB = "Stanza B",
    Floor0 = "Piano 0",
    Floor2 = "Piano 2",
    Management = "Direzione"
}

export enum ShiftTime {
    Morning = 'Mattina',
    Afternoon = 'Pomeriggio',
    Night = 'Notte',
    FullDay = 'Giornata',
    Rest = 'Riposo',
    OffShift = 'Fuori Turno',
    Absence = 'Assenza'
}

export interface Staff {
    id: string;
    name: string;
    role: StaffRole;
    contract: ContractType;
    usualLocations: Location[];
    phone?: string;
    email?: string;
    /** 
     * @deprecated In a real application, passwords should NEVER be stored in plaintext on the client.
     * This field is used for the initial constants, but a logged-in user object returned from a backend
     * should NOT include the password.
     */
    password?: string;
    // New fields for personnel management
    hasLaw104?: boolean;
    specialRules?: string;
    unavailableShiftCodes?: string[];
}

export interface ShiftDefinition {
    code: string;
    description: string;
    location: Location;
    time: ShiftTime;
    color: string;
    textColor: string;
    roles: StaffRole[];
}

export interface ScheduledShift {
    id: string;
    date: string; // YYYY-MM-DD
    staffId: string;
    shiftCode: string | null; // e.g., 'Md', 'A', 'RF'
    originalStaffId?: string; // Used when a shift is uncovered to track who was originally assigned
}

export interface Absence {
    id: string;
    staffId: string;
    startDate: string; // YYYY-MM-DD
    endDate: string; // YYYY-DD-MM
    reason: string; // 'A', 'HD', 'T1', etc.
}

export interface ReplacementOption {
    staff: Staff;
    reason: string;
}

export type ShiftRequirements = Record<string, number[]>; // code -> [Sun, Mon, Tue, Wed, Thu, Fri, Sat]

export interface RequirementPreset {
    id: string;
    name: string;
    requirements: ShiftRequirements;
    role: ActiveTab | 'all';
}