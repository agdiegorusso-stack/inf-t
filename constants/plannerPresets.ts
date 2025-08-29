import type { RequirementPreset, ShiftRequirements } from '../types';

// Helper to safely create a deep copy
const deepCopy = <T>(obj: T): T => JSON.parse(JSON.stringify(obj));

// --- TEMPLATE INFERMIERI E CAPOSALA ---
const standardNurseRequirements: ShiftRequirements = {};
// [Sun, Mon, Tue, Wed, Thu, Fri, Sat]
standardNurseRequirements['M'] =   [1, 1, 1, 1, 1, 1, 1];
standardNurseRequirements['Md'] =  [0, 2, 2, 2, 2, 2, 0];
standardNurseRequirements['Ps'] =  [0, 1, 1, 1, 1, 1, 0];
standardNurseRequirements['Msc'] = [0, 2, 2, 2, 2, 2, 0];
standardNurseRequirements['Psc'] = [0, 1, 1, 1, 1, 1, 0];
standardNurseRequirements['Mc'] =  [0, 2, 2, 2, 2, 2, 0];
standardNurseRequirements['Pc'] =  [0, 1, 1, 1, 1, 1, 0];
standardNurseRequirements['Mn'] =  [2, 2, 2, 2, 2, 2, 2];
standardNurseRequirements['Pn'] =  [2, 2, 2, 2, 2, 2, 2];
standardNurseRequirements['N'] =   [1, 1, 1, 1, 1, 1, 1];
standardNurseRequirements['Mu'] =  [1, 1, 1, 1, 1, 1, 1];
standardNurseRequirements['Pu'] =  [1, 1, 1, 1, 1, 1, 1];
standardNurseRequirements['Mat'] = [0, 1, 1, 1, 1, 1, 0];
standardNurseRequirements['Mco'] = [0, 1, 0, 1, 1, 0, 0];
standardNurseRequirements['Mac'] = [0, 1, 1, 1, 1, 1, 0];
standardNurseRequirements['Mat/e'] = [0, 1, 1, 1, 1, 1, 0];

const summerNurseRequirements: ShiftRequirements = {};
summerNurseRequirements['M'] =   [1, 1, 1, 1, 1, 1, 1];
summerNurseRequirements['Md'] =  [0, 1, 1, 1, 1, 1, 0];
summerNurseRequirements['Ps'] =  [0, 1, 1, 1, 1, 1, 0];
summerNurseRequirements['Msc'] = [0, 1, 1, 1, 1, 1, 0];
summerNurseRequirements['Psc'] = [0, 1, 1, 1, 1, 1, 0];
summerNurseRequirements['Mc'] =  [0, 1, 1, 1, 1, 1, 0];
summerNurseRequirements['Pc'] =  [0, 1, 1, 1, 1, 1, 0];
summerNurseRequirements['Mn'] =  [1, 1, 1, 1, 1, 1, 1];
summerNurseRequirements['Pn'] =  [1, 1, 1, 1, 1, 1, 1];
summerNurseRequirements['N'] =   [1, 1, 1, 1, 1, 1, 1];
summerNurseRequirements['Mu'] =  [1, 1, 1, 1, 1, 1, 1];
summerNurseRequirements['Pu'] =  [1, 1, 1, 1, 1, 1, 1];
summerNurseRequirements['Mat'] = [0, 1, 0, 1, 0, 1, 0];

// --- TEMPLATE OSS ---
const standardOSSRequirements: ShiftRequirements = {};
standardOSSRequirements['M0'] = [1, 1, 1, 1, 1, 1, 1];
standardOSSRequirements['P0'] = [1, 1, 1, 1, 1, 1, 1];
standardOSSRequirements['MT'] = [0, 1, 1, 1, 1, 1, 0];
standardOSSRequirements['PT'] = [0, 1, 1, 1, 1, 1, 0];

// --- TEMPLATE MEDICI ---
const standardDoctorRequirements: ShiftRequirements = {};
// [Sun, Mon, Tue, Wed, Thu, Fri, Sat]
standardDoctorRequirements['Md_doc'] =  [0, 1, 1, 1, 1, 1, 1]; // M-Sa
standardDoctorRequirements['Pd_doc'] =  [0, 1, 0, 1, 0, 1, 0]; // Lu, Me, Ve
standardDoctorRequirements['Mu_doc'] =  [0, 1, 1, 1, 1, 1, 1]; // M-Sa
standardDoctorRequirements['Pu_doc'] =  [0, 1, 1, 1, 1, 1, 1]; // M-Sa
standardDoctorRequirements['Mh_doc'] =  [0, 1, 1, 1, 1, 1, 0]; // M-F
standardDoctorRequirements['Sd_doc'] =  [0, 1, 0, 1, 0, 1, 0]; // Lu, Me, Ve
standardDoctorRequirements['Mac_doc'] = [0, 1, 1, 0, 1, 1, 0]; // Lu, Ma, Gi, Ve
standardDoctorRequirements['Ab_doc'] =  [0, 0, 1, 0, 0, 0, 0]; // Ma
standardDoctorRequirements['Ac_doc'] =  [0, 0, 0, 0, 1, 0, 0]; // Gi
standardDoctorRequirements['Msc_doc'] = [0, 0, 0, 0, 0, 0, 1]; // Sa
standardDoctorRequirements['Mr_doc'] =  [0, 0, 0, 0, 0, 1, 0]; // Ve
standardDoctorRequirements['Mn_doc'] =  [2, 2, 2, 2, 2, 2, 2]; // Tutti i giorni (2 medici)
standardDoctorRequirements['Pn_doc'] =  [1, 1, 1, 1, 1, 1, 1]; // Tutti i giorni
standardDoctorRequirements['Cm_doc'] =  [0, 1, 1, 1, 1, 1, 1]; // M-Sa
standardDoctorRequirements['Cp_doc'] =  [0, 1, 1, 1, 1, 1, 1]; // M-Sa
standardDoctorRequirements['N_doc'] =   [1, 1, 1, 1, 1, 1, 1]; // Tutti i giorni
standardDoctorRequirements['Mc_doc'] =  [0, 1, 1, 1, 1, 1, 1]; // M-Sa
standardDoctorRequirements['Pc_doc'] =  [0, 1, 1, 1, 1, 1, 1]; // M-Sa
standardDoctorRequirements['Mv_doc'] =  [0, 0, 1, 1, 0, 0, 0]; // Ma, Me
standardDoctorRequirements['Mt_doc'] =  [0, 0, 0, 0, 1, 0, 0]; // Gi
standardDoctorRequirements['Mco_doc'] = [0, 2, 0, 2, 2, 0, 0]; // Lu, Me, Gi (2 medici)


export const REQUIREMENT_PRESETS: RequirementPreset[] = [
    { id: 'preset-empty', name: 'Template Vuoto', requirements: {}, role: 'all' },
    
    { id: 'preset-nurse-standard', name: 'Standard (Infermieri)', requirements: standardNurseRequirements, role: 'nurses' },
    { id: 'preset-nurse-summer', name: 'Estivo (Infermieri)', requirements: summerNurseRequirements, role: 'nurses' },
    
    { id: 'preset-doctor-standard', name: 'Standard (Medici)', requirements: standardDoctorRequirements, role: 'doctors' },

    { id: 'preset-oss-standard', name: 'Standard (OSS)', requirements: standardOSSRequirements, role: 'oss' },
];
