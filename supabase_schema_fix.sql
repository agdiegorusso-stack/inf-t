-- =========================================================
-- Supabase Schema Fix Script (Align DB with Frontend Models)
-- =========================================================
-- Questo script riallinea le tabelle al modello TypeScript usato dall&#39;app.
-- Principali problemi risolti:
-- 1. Incongruenze valori enum (role / contract / time / roles dei turni)
-- 2. Column name mismatch (snake_case nel DB vs camelCase nel codice)
-- 3. Mancanza colonne necessarie (location, color, textColor, allowedShiftCodes, description)
-- 4. Tipi errati (specialRules array vs string, nightSquad boolean vs numero)
-- 5. Impossibilità di inserire scheduled_shifts / absences per differenza naming colonne
--
-- NOTA: Questo script assume che NON ci siano dati produttivi critici.
-- Esegue TRUNCATE su shift_definitions e ricrea alcune tabelle (scheduled_shifts, absences).
-- Adattare se serve conservare i dati.
--
-- Eseguire in transazione per atomicità.
BEGIN;

------------------------------------------------------------
-- STAFF: rinomina colonne per combaciare con il codice
------------------------------------------------------------
-- Se le colonne sono già rinominate, i comandi RENAME falliranno: per sicurezza usare DO blocks.
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'staff' AND column_name = 'team_ids'
    ) THEN
        EXECUTE 'ALTER TABLE staff RENAME COLUMN team_ids TO "teamIds"';
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'staff' AND column_name = 'has_law104'
    ) THEN
        EXECUTE 'ALTER TABLE staff RENAME COLUMN has_law104 TO "hasLaw104"';
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'staff' AND column_name = 'special_rules'
    ) THEN
        EXECUTE 'ALTER TABLE staff RENAME COLUMN special_rules TO "specialRules"';
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'staff' AND column_name = 'unavailable_shift_codes'
    ) THEN
        EXECUTE 'ALTER TABLE staff RENAME COLUMN unavailable_shift_codes TO "unavailableShiftCodes"';
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'staff' AND column_name = 'night_squad'
    ) THEN
        EXECUTE 'ALTER TABLE staff RENAME COLUMN night_squad TO "nightSquadTmpBool"';
    END IF;
END$$;

-- Converte specialRules (array) in text singolo (join con virgole)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='staff' AND column_name='specialRules'
    ) THEN
        -- Se è già text salta
        IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name='staff' AND column_name='specialRules' AND data_type='ARRAY'
        ) THEN
            EXECUTE 'ALTER TABLE staff ALTER COLUMN "specialRules" TYPE text USING array_to_string("specialRules", '','')';
        END IF;
    END IF;
END$$;

-- Garantisce colonne opzionali coerenti
ALTER TABLE staff
    ALTER COLUMN "teamIds" SET DEFAULT ARRAY[]::text[],
    ALTER COLUMN "teamIds" TYPE text[];

-- unavailableShiftCodes array di text
ALTER TABLE staff
    ALTER COLUMN "unavailableShiftCodes" TYPE text[];

-- Gestione nightSquad: elimina colonna temporanea boolean e crea smallint
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='staff' AND column_name='nightSquadTmpBool'
    ) THEN
        -- Creiamo nuova colonna se non esiste
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name='staff' AND column_name='nightSquad'
        ) THEN
            EXECUTE 'ALTER TABLE staff ADD COLUMN "nightSquad" smallint';
        END IF;
        -- (Non possiamo inferire i numeri 1..5 da un boolean. Lasciamo NULL.)
        EXECUTE 'ALTER TABLE staff DROP COLUMN "nightSquadTmpBool"';
    ELSE
        -- Se non esiste né tmp né finale, crea nightSquad
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name='staff' AND column_name='nightSquad'
        ) THEN
            EXECUTE 'ALTER TABLE staff ADD COLUMN "nightSquad" smallint';
        END IF;
    END IF;
END$$;

-- Normalizza valori role (inglese -> italiano)
UPDATE staff
SET role = CASE role
    WHEN 'HeadNurse' THEN 'Caposala'
    WHEN 'Nurse' THEN 'Infermiere'
    WHEN 'Doctor' THEN 'Medico'
    ELSE role
END;

-- Normalizza contract (upper -> lower)
UPDATE staff
SET contract = lower(contract)
WHERE contract IS NOT NULL;

------------------------------------------------------------
-- TEAMS: aggiunge allowedShiftCodes se manca
------------------------------------------------------------
ALTER TABLE teams ADD COLUMN IF NOT EXISTS "allowedShiftCodes" text[];

-- Popola allowedShiftCodes sulla base dei mock
UPDATE teams SET "allowedShiftCodes" = '{Md,Ps,Mu,Pu,Mn,Pn,N,Mat,Mat/e,Me,Pe,Mb,Pb,M0,P0,MT,PT,G_doc,R_doc,A_doc,N_doc}'
WHERE id = 'team-se';

UPDATE teams SET "allowedShiftCodes" = '{Msc,Psc}'
WHERE id = 'team-sc';

UPDATE teams SET "allowedShiftCodes" = '{Mc,Pc,Mac,G_doc,R_doc}'
WHERE id = 'team-cto';

UPDATE teams SET "allowedShiftCodes" = '{Mco}'
WHERE id = 'team-co';

UPDATE teams SET "allowedShiftCodes" = '{Md,Ps,Msc,Psc,Mc,Pc,Mu,Pu,Mco,Mac,Mn,Pn,N,Mat,Mat/e,Me,Pe,Mb,Pb}'
WHERE id = 'team-misto';

UPDATE teams SET "allowedShiftCodes" = '{M,R_doc}'
WHERE id = 'team-management';

------------------------------------------------------------
-- SHIFT_DEFINITIONS: adegua colonne e reinserisce dati coerenti
------------------------------------------------------------
-- Aggiunge / rinomina colonne necessarie
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='shift_definitions' AND column_name='name'
    ) THEN
        EXECUTE 'ALTER TABLE shift_definitions RENAME COLUMN name TO description';
    END IF;
END$$;

ALTER TABLE shift_definitions
    ADD COLUMN IF NOT EXISTS location text,
    ADD COLUMN IF NOT EXISTS color text,
    ADD COLUMN IF NOT EXISTS "textColor" text,
    ADD COLUMN IF NOT EXISTS roles text[];

-- Svuota tabella per reinserimento coerente con constants.ts
TRUNCATE shift_definitions RESTART IDENTITY;

-- Reinsert (tempi in IT: Mattina, Pomeriggio, Notte, Giornata, Riposo, Assenza, Fuori Turno)
INSERT INTO shift_definitions (code, description, location, time, color, "textColor", roles)
VALUES
('M', 'Mattina Direzione', 'Direzione', 'Mattina', 'bg-slate-200', 'text-slate-800', '{Caposala}'),
('Md', 'Mattina Dialisi S.Eugenio', 'Dialisi Sant''Eugenio', 'Mattina', 'bg-blue-200', 'text-blue-800', '{Infermiere,Caposala}'),
('Ps', 'Pomeriggio+Sera Dialisi S.Eugenio', 'Dialisi Sant''Eugenio', 'Pomeriggio', 'bg-blue-300', 'text-blue-900', '{Infermiere,Caposala}'),
('Msc', 'Mattina Dialisi S.Caterina', 'Dialisi Santa Caterina', 'Mattina', 'bg-green-200', 'text-green-800', '{Infermiere,Caposala}'),
('Psc', 'Pomeriggio Dialisi S.Caterina', 'Dialisi Santa Caterina', 'Pomeriggio', 'bg-green-200', 'text-green-800', '{Infermiere,Caposala}'),
('Mc', 'Mattina Dialisi CTO', 'Dialisi CTO', 'Mattina', 'bg-indigo-200', 'text-indigo-800', '{Infermiere,Caposala}'),
('Pc', 'Pomeriggio Dialisi CTO', 'Dialisi CTO', 'Pomeriggio', 'bg-indigo-200', 'text-indigo-800', '{Infermiere,Caposala}'),
('Mu', 'Mattina Urgenza S.Eugenio', 'Urgenza Sant''Eugenio', 'Mattina', 'bg-red-200', 'text-red-800', '{Infermiere,Caposala}'),
('Pu', 'Pomeriggio Urgenza S.Eugenio', 'Urgenza Sant''Eugenio', 'Pomeriggio', 'bg-red-200', 'text-red-800', '{Infermiere,Caposala}'),
('Mco', 'Mattina Sala Operatoria S.Eugenio', 'Sala Operatoria Sant''Eugenio', 'Mattina', 'bg-purple-200', 'text-purple-800', '{Infermiere,Caposala}'),
('Mac', 'Mattina Dialisi Peritoneale CTO', 'Dialisi Peritoneale CTO', 'Mattina', 'bg-teal-200', 'text-teal-800', '{Infermiere,Caposala}'),
('Mn', 'Mattina Reparto Nefrologia', 'Reparto Nefrologia Sant''Eugenio', 'Mattina', 'bg-yellow-200', 'text-yellow-800', '{Infermiere,Caposala}'),
('Pn', 'Pomeriggio Reparto Nefrologia', 'Reparto Nefrologia Sant''Eugenio', 'Pomeriggio', 'bg-yellow-200', 'text-yellow-800', '{Infermiere,Caposala}'),
('N', 'Notte Reparto Nefrologia', 'Reparto Nefrologia Sant''Eugenio', 'Notte', 'bg-gray-800', 'text-white', '{Infermiere,Caposala}'),
('Mat', 'Mattina Ambulatorio', 'Ambulatorio DH Sant''Eugenio', 'Mattina', 'bg-pink-200', 'text-pink-800', '{Infermiere,Caposala}'),
('Mat/e', 'Mattina Ambulatorio/Esterno', 'Ambulatorio DH Sant''Eugenio', 'Mattina', 'bg-pink-300', 'text-pink-900', '{Infermiere,Caposala}'),
('Me', 'Mattina Esterno', 'Esterno', 'Mattina', 'bg-orange-200', 'text-orange-800', '{Infermiere,Caposala}'),
('Pe', 'Pomeriggio Esterno', 'Esterno', 'Pomeriggio', 'bg-orange-200', 'text-orange-800', '{Infermiere,Caposala}'),
('Mb', 'Mattina Stanza B', 'Stanza B', 'Mattina', 'bg-yellow-400', 'text-yellow-900', '{Infermiere,Caposala}'),
('Pb', 'Pomeriggio Stanza B', 'Stanza B', 'Pomeriggio', 'bg-yellow-400', 'text-yellow-900', '{Infermiere,Caposala}'),
('M0', 'Mattina Piano 0', 'Piano 0', 'Mattina', 'bg-cyan-200', 'text-cyan-800', '{OSS}'),
('P0', 'Pomeriggio Piano 0', 'Piano 0', 'Pomeriggio', 'bg-cyan-200', 'text-cyan-800', '{OSS}'),
('MT', 'Mattina Piano 2', 'Piano 2', 'Mattina', 'bg-lime-200', 'text-lime-800', '{OSS}'),
('PT', 'Pomeriggio Piano 2', 'Piano 2', 'Pomeriggio', 'bg-lime-200', 'text-lime-800', '{OSS}'),
('G_doc', 'Guardia', 'Urgenza Sant''Eugenio', 'Giornata', '#fecaca', '#991b1b', '{Medico}'),
('R_doc', 'Reperibilità', 'Direzione', 'Giornata', '#fed7aa', '#9a3412', '{Medico}'),
('A_doc', 'Ambulatorio', 'Ambulatorio DH Sant''Eugenio', 'Mattina', '#bfdbfe', '#1e40af', '{Medico}'),
('N_doc', 'Notte Medico', 'Reparto Nefrologia Sant''Eugenio', 'Notte', '#1f2937', '#f9fafb', '{Medico}'),
('S', 'Smonto Notte', 'Reparto Nefrologia Sant''Eugenio', 'Riposo', 'bg-gray-400', 'text-white', '{Caposala,Infermiere,OSS,Medico}'),
('RS', 'Riposo Settimanale', 'Direzione', 'Riposo', 'bg-gray-400', 'text-white', '{Caposala,Infermiere,OSS,Medico}'),
('R', 'Riposo', 'Direzione', 'Riposo', 'bg-gray-400', 'text-white', '{Caposala,Infermiere,OSS,Medico}'),
('HD', 'Permesso L.104', 'Direzione', 'Assenza', 'bg-red-500', 'text-white', '{Caposala,Infermiere,OSS,Medico}'),
('RF', 'Recupero Festivo', 'Direzione', 'Assenza', 'bg-purple-500', 'text-white', '{Caposala,Infermiere,OSS,Medico}'),
('A', 'Malattia', 'Direzione', 'Assenza', 'bg-red-500', 'text-white', '{Caposala,Infermiere,OSS,Medico}'),
('T1', 'Malattia Figlio', 'Direzione', 'Assenza', 'bg-red-500', 'text-white', '{Caposala,Infermiere,OSS,Medico}'),
('FE', 'Ferie', 'Direzione', 'Assenza', 'bg-green-500', 'text-white', '{Caposala,Infermiere,OSS,Medico}'),
('UNCOVERED', 'Turno Scoperto', 'Direzione', 'Fuori Turno', 'bg-red-600 animate-pulse', 'text-white', '{}');

------------------------------------------------------------
-- SCHEDULED_SHIFTS & ABSENCES: ricrea tabelle con camelCase
------------------------------------------------------------
-- Conserva dati esistenti se necessario copiandoli prima (qui li eliminiamo per coerenza)
DROP TABLE IF EXISTS scheduled_shifts;
CREATE TABLE scheduled_shifts (
    id text PRIMARY KEY,
    "staffId" text REFERENCES staff(id),
    date date NOT NULL,
    "shiftCode" text REFERENCES shift_definitions(code),
    "originalStaffId" text REFERENCES staff(id)
);

DROP TABLE IF EXISTS absences;
CREATE TABLE absences (
    id text PRIMARY KEY,
    "staffId" text REFERENCES staff(id),
    reason text NOT NULL,
    "startDate" date NOT NULL,
    "endDate" date NOT NULL
);

COMMIT;

-- =========================================================
-- Post-Execution Note:
-- Dopo aver eseguito questo script:
-- - Rigenerare eventualmente i tipi TS da Supabase oppure adattare types/supabase.ts
-- - Verificare che le query supabase.from(&#39;...&#39;).select(&#39;*&#39;) restituiscano campi camelCase
-- =========================================================
