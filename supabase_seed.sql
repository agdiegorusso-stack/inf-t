-- =========================================================
-- Supabase Full Recreate + Seed (All tables aligned to frontend)
-- ATTENZIONE: Questo script DROPPA e RICREA le tabelle. Usare solo in ambienti di test.
-- =========================================================
BEGIN;

-- Drop in dependency order
DROP TABLE IF EXISTS scheduled_shifts;
DROP TABLE IF EXISTS absences;
DROP TABLE IF EXISTS shift_definitions;
DROP TABLE IF EXISTS staff;
DROP TABLE IF EXISTS teams;

-- TEAMS
CREATE TABLE teams (
  id text PRIMARY KEY,
  name text NOT NULL,
  locations text[] NOT NULL DEFAULT ARRAY[]::text[],
  "allowedShiftCodes" text[] NOT NULL DEFAULT ARRAY[]::text[]
);

-- STAFF
CREATE TABLE staff (
  id text PRIMARY KEY,
  name text NOT NULL,
  role text NOT NULL,                -- Valori (Infermiere, OSS, Caposala, Medico)
  contract text,                     -- h6 / h12 / h24
  "teamIds" text[] NOT NULL DEFAULT ARRAY[]::text[],
  phone text,
  email text,
  password text,
  "hasLaw104" boolean DEFAULT false,
  "specialRules" text,
  "unavailableShiftCodes" text[] DEFAULT ARRAY[]::text[],
  "nightSquad" smallint              -- 1..5 (NULL se non assegnato)
);

-- SHIFT DEFINITIONS
CREATE TABLE shift_definitions (
  code text PRIMARY KEY,
  description text NOT NULL,
  location text,
  time text NOT NULL,        -- Mattina, Pomeriggio, Notte, Giornata, Riposo, Assenza, Fuori Turno
  color text,
  "textColor" text,
  roles text[] DEFAULT ARRAY[]::text[]
);

-- SCHEDULED SHIFTS
CREATE TABLE scheduled_shifts (
  id text PRIMARY KEY,
  "staffId" text REFERENCES staff(id) ON DELETE SET NULL,
  date date NOT NULL,
  "shiftCode" text REFERENCES shift_definitions(code),
  "originalStaffId" text REFERENCES staff(id)
);

-- ABSENCES
CREATE TABLE absences (
  id text PRIMARY KEY,
  "staffId" text REFERENCES staff(id) ON DELETE SET NULL,
  reason text NOT NULL,
  "startDate" date NOT NULL,
  "endDate" date NOT NULL
);

-- =========================
-- SEED: TEAMS
-- =========================
INSERT INTO teams (id, name, locations, "allowedShiftCodes") VALUES
('team-se', 'Team Sant''Eugenio', ARRAY['Dialisi Sant''Eugenio','Urgenza Sant''Eugenio','Reparto Nefrologia Sant''Eugenio','Ambulatorio DH Sant''Eugenio','Stanza B','Piano 0','Piano 2'], ARRAY['Md','Ps','Mu','Pu','Mn','Pn','N','Mat','Mat/e','Me','Pe','Mb','Pb','M0','P0','MT','PT','G_doc','R_doc','A_doc','N_doc']),
('team-sc', 'Team Santa Caterina', ARRAY['Dialisi Santa Caterina'], ARRAY['Msc','Psc']),
('team-cto', 'Team CTO', ARRAY['Dialisi CTO','Dialisi Peritoneale CTO'], ARRAY['Mc','Pc','Mac','G_doc','R_doc']),
('team-co', 'Team Camera Operatoria', ARRAY['Sala Operatoria Sant''Eugenio'], ARRAY['Mco']),
('team-misto', 'Team Misto (Tutte le Sedi)', ARRAY['Dialisi Sant''Eugenio','Dialisi Santa Caterina','Dialisi CTO','Urgenza Sant''Eugenio','Sala Operatoria Sant''Eugenio','Dialisi Peritoneale CTO','Reparto Nefrologia Sant''Eugenio','Ambulatorio DH Sant''Eugenio','Ambulatorio Via Marotta','Esterno','Stanza B','Piano 0','Piano 2'], ARRAY['Md','Ps','Msc','Psc','Mc','Pc','Mu','Pu','Mco','Mac','Mn','Pn','N','Mat','Mat/e','Me','Pe','Mb','Pb']),
('team-management', 'Team Direzione', ARRAY['Direzione'], ARRAY['M','R_doc']);

-- =========================
-- SEED: STAFF
-- Nota: i record con nightSquad (true nel vecchio schema) NON avevano numero -> impostato NULL.
-- Aggiorna manualmente se necessario (esempio UPDATE staff SET "nightSquad"=1 WHERE id='31'; etc.)
-- =========================
INSERT INTO staff (id,name,role,contract,"teamIds",phone,email,password,"hasLaw104","specialRules","unavailableShiftCodes","nightSquad") VALUES
('1','Bevilacqua Monica','Caposala','h12',ARRAY['team-management'],'391234567890','monica.bevilacqua@aslroma2.it','password123',false,'',ARRAY[]::text[],NULL),
('2','Vaccaro Pietro','Caposala','h12',ARRAY['team-management'],'391234567890','pietro.vaccaro@aslroma2.it','password123',false,'',ARRAY[]::text[],NULL),
('3','Marrama Anna Maria','Caposala','h12',ARRAY['team-management'],'391234567890','anna.maria.marrama@aslroma2.it','password123',false,'',ARRAY[]::text[],NULL),
('4','Bobo Alessandro','Infermiere','h12',ARRAY['team-se','team-misto'],'391234567890','alessandro.bobo@aslroma2.it','password123',false,'',ARRAY[]::text[],NULL),
('5','Caprioli Francesca','Infermiere','h12',ARRAY['team-sc','team-misto'],'391234567890','francesca.caprioli@aslroma2.it','password123',false,'',ARRAY[]::text[],NULL),
('6','Amatucci Elisa','Infermiere','h12',ARRAY['team-se','team-misto'],'391234567890','elisa.amatucci@aslroma2.it','password123',false,'',ARRAY[]::text[],NULL),
('7','Cardillo Marcello','Infermiere','h12',ARRAY['team-se','team-misto'],'391234567890','marcello.cardillo@aslroma2.it','password123',false,'',ARRAY[]::text[],NULL),
('8','Dosa Simona','Infermiere','h12',ARRAY['team-cto','team-misto'],'391234567890','simona.dosa@aslroma2.it','password123',false,'',ARRAY[]::text[],NULL),
('9','Costa Adriana','Infermiere','h6',ARRAY['team-se','team-misto'],'391234567890','adriana.costa@aslroma2.it','password123',false,'',ARRAY[]::text[],NULL),
('10','Onofri Nadia','Infermiere','h6',ARRAY['team-se','team-misto'],'391234567890','nadia.onofri@aslroma2.it','password123',false,'',ARRAY[]::text[],NULL),
('11','Di Carlo Michela','Infermiere','h12',ARRAY['team-se','team-misto'],'391234567890','michela.dicarlo@aslroma2.it','password123',false,'',ARRAY[]::text[],NULL),
('12','Mirtella Cinzia','Infermiere','h12',ARRAY['team-se','team-misto'],'391234567890','cinzia.mirtella@aslroma2.it','password123',false,'',ARRAY[]::text[],NULL),
('13','Leto Giorgina','Infermiere','h12',ARRAY['team-se','team-misto'],'391234567890','giorgina.leto@aslroma2.it','password123',false,'',ARRAY[]::text[],NULL),
('14','Cerreto Elisa','Infermiere','h12',ARRAY['team-se','team-misto'],'391234567890','elisa.cerreto@aslroma2.it','password123',false,'',ARRAY[]::text[],NULL),
('15','Evangelista Chiara','Infermiere','h12',ARRAY['team-se','team-misto'],'391234567890','chiara.evangelista@aslroma2.it','password123',false,'',ARRAY[]::text[],NULL),
('16','Fantini Vincenzo','Infermiere','h12',ARRAY['team-se','team-misto'],'391234567890','vincenzo.fantini@aslroma2.it','password123',false,'',ARRAY[]::text[],NULL),
('17','Kaoutar Elaouane','Infermiere','h6',ARRAY['team-se','team-misto'],'391234567890','kaoutar.elaouane@aslroma2.it','password123',false,'',ARRAY[]::text[],NULL),
('18','Di Bernardino Martina','Infermiere','h12',ARRAY['team-se','team-misto'],'391234567890','martina.dibernardino@aslroma2.it','password123',false,'',ARRAY[]::text[],NULL),
('19','Marianelli Debora','Infermiere','h12',ARRAY['team-se','team-misto'],'391234567890','debora.marianelli@aslroma2.it','password123',false,'',ARRAY[]::text[],NULL),
('20','Bruni Eleonora','Infermiere','h12',ARRAY['team-se','team-misto'],'391234567890','eleonora.bruni@aslroma2.it','password123',false,'',ARRAY[]::text[],NULL),
('21','Russo Diego','Infermiere','h12',ARRAY['team-se','team-misto'],'391234567890','diego.russo@aslroma2.it','password123',false,'',ARRAY[]::text[],NULL),
('22','Barletta M.Enza','Infermiere','h12',ARRAY['team-se','team-misto'],'391234567890','m.enza.barletta@aslroma2.it','password123',false,'',ARRAY[]::text[],NULL),
('23','Moriconi Annarita','Infermiere','h12',ARRAY['team-se','team-misto'],'391234567890','annarita.moriconi@aslroma2.it','password123',false,'',ARRAY[]::text[],NULL),
('24','Massa Enrica','Infermiere','h12',ARRAY['team-se','team-misto'],'391234567890','enrica.massa@aslroma2.it','password123',false,'',ARRAY[]::text[],NULL),
('25','Ottaviani Fabio','Infermiere','h12',ARRAY['team-se','team-misto'],'391234567890','fabio.ottaviani@aslroma2.it','password123',false,'',ARRAY[]::text[],NULL),
('26','Panella Tiziana','Infermiere','h12',ARRAY['team-se','team-misto'],'391234567890','tiziana.panella@aslroma2.it','password123',false,'',ARRAY[]::text[],NULL),
('27','Brandolini Francesca','Infermiere','h12',ARRAY['team-se','team-misto'],'391234567890','francesca.brandolini@aslroma2.it','password123',false,'',ARRAY[]::text[],NULL),
('28','Bonanni Maria','Infermiere','h6',ARRAY['team-se','team-misto'],'391234567890','maria.bonanni@aslroma2.it','password123',false,'',ARRAY[]::text[],NULL),
('29','Michelini Silvia','Infermiere','h6',ARRAY['team-se','team-misto'],'391234567890','silvia.michelini@aslroma2.it','password123',false,'',ARRAY[]::text[],NULL),
('30','Orfino Alessia','Infermiere','h6',ARRAY['team-se','team-misto'],'391234567890','alessia.orfino@aslroma2.it','password123',false,'',ARRAY[]::text[],NULL),
-- Staff 31..50 erano night squad H24 (imposta "nightSquad" manualmente se serve)
('31','Ciofani Marta','Infermiere','h24',ARRAY['team-se','team-misto'],'391234567890','marta.ciofani@aslroma2.it','password123',false,'',ARRAY[]::text[],NULL),
('32','Cinili M.Pia','Infermiere','h24',ARRAY['team-se','team-misto'],'391234567890','m.pia.cinili@aslroma2.it','password123',false,'',ARRAY[]::text[],NULL),
('33','Vaccelli Francesco','Infermiere','h24',ARRAY['team-se','team-misto'],'391234567890','francesco.vaccelli@aslroma2.it','password123',false,'',ARRAY[]::text[],NULL),
('34','Vanegas Chloe','Infermiere','h24',ARRAY['team-se','team-misto'],'391234567890','chloe.vanegas@aslroma2.it','password123',false,'',ARRAY[]::text[],NULL),
('35','Rinaldi Simone','Infermiere','h24',ARRAY['team-se','team-misto'],'391234567890','simone.rinaldi@aslroma2.it','password123',false,'',ARRAY[]::text[],NULL),
('36','Fiasco Stefania','Infermiere','h24',ARRAY['team-se','team-misto'],'391234567890','stefania.fiasco@aslroma2.it','password123',false,'',ARRAY[]::text[],NULL),
('37','Ribaudi Alessia','Infermiere','h24',ARRAY['team-se','team-misto'],'391234567890','alessia.ribaudi@aslroma2.it','password123',false,'',ARRAY[]::text[],NULL),
('38','Spoletini Veronica','Infermiere','h24',ARRAY['team-se','team-misto'],'391234567890','veronica.spoletini@aslroma2.it','password123',false,'',ARRAY[]::text[],NULL),
('39','Ciafrei Ivano','Infermiere','h24',ARRAY['team-se','team-misto'],'391234567890','ivano.ciafrei@aslroma2.it','password123',false,'',ARRAY[]::text[],NULL),
('40','Pagano Leopoldo','Infermiere','h24',ARRAY['team-se','team-misto'],'391234567890','leopoldo.pagano@aslroma2.it','password123',false,'',ARRAY[]::text[],NULL),
('41','Restaino Alessandro','Infermiere','h24',ARRAY['team-se','team-misto'],'391234567890','alessandro.restaino@aslroma2.it','password123',false,'',ARRAY[]::text[],NULL),
('42','Passeri Rosita','Infermiere','h24',ARRAY['team-se','team-misto'],'391234567890','rosita.passeri@aslroma2.it','password123',false,'',ARRAY[]::text[],NULL),
('43','Iandolo Ilaria','Infermiere','h24',ARRAY['team-se','team-misto'],'391234567890','ilaria.iandolo@aslroma2.it','password123',false,'',ARRAY[]::text[],NULL),
('44','Vannacci Valentino','Infermiere','h24',ARRAY['team-se','team-misto'],'391234567890','valentino.vannacci@aslroma2.it','password123',false,'',ARRAY[]::text[],NULL),
('45','Marchese Rossana','Infermiere','h24',ARRAY['team-se','team-misto'],'391234567890','rossana.marchese@aslroma2.it','password123',false,'',ARRAY[]::text[],NULL),
('46','Longo Andrea Simone','Infermiere','h24',ARRAY['team-se','team-misto'],'391234567890','andrea.simone.longo@aslroma2.it','password123',false,'',ARRAY[]::text[],NULL),
('47','Viola Simone','Infermiere','h24',ARRAY['team-misto'],'391234567890','simone.viola@aslroma2.it','password123',false,'',ARRAY[]::text[],NULL),
('48','Giglioni Alessandro','Infermiere','h24',ARRAY['team-se','team-misto'],'391234567890','alessandro.giglioni@aslroma2.it','password123',false,'',ARRAY[]::text[],NULL),
('49','Incerti Liborio Emanuele','Infermiere','h24',ARRAY['team-se','team-misto'],'391234567890','liborio.emanuele.incerti@aslroma2.it','password123',false,'',ARRAY[]::text[],NULL),
('50','Di Giuditta Assunta','Infermiere','h24',ARRAY['team-se','team-misto'],'391234567890','assunta.digiuditta@aslroma2.it','password123',false,'',ARRAY[]::text[],NULL),
('51','Di Carlo Angela','Infermiere','h12',ARRAY['team-se','team-misto'],'391234567890','angela.dicarlo@aslroma2.it','password123',false,'',ARRAY[]::text[],NULL),
('52','Martinelli Gloria','Infermiere','h6',ARRAY['team-se','team-misto'],'391234567890','gloria.martinelli@aslroma2.it','password123',false,'',ARRAY[]::text[],NULL),
('53','Paris Paola','OSS','h12',ARRAY['team-se'],'391234567890','paola.paris@aslroma2.it','password123',false,'',ARRAY[]::text[],NULL),
('54','Pantaleoni Nicole','OSS','h12',ARRAY['team-se'],'391234567890','nicole.pantaleoni@aslroma2.it','password123',false,'',ARRAY[]::text[],NULL),
('55','Perotti Daniele','OSS','h12',ARRAY['team-se'],'391234567890','daniele.perotti@aslroma2.it','password123',false,'',ARRAY[]::text[],NULL),
('56','Colongo Danilo','OSS','h12',ARRAY['team-se'],'391234567890','danilo.colongo@aslroma2.it','password123',false,'',ARRAY[]::text[],NULL),
('57','Colasanti M.Antonietta','OSS','h12',ARRAY['team-se'],'391234567890','m.antonietta.colasanti@aslroma2.it','password123',false,'',ARRAY[]::text[],NULL),
('58','Micacchioni Jennifer','OSS','h12',ARRAY['team-se'],'391234567890','jennifer.micacchioni@aslroma2.it','password123',false,'',ARRAY[]::text[],NULL),
('59','Traballoni Daniela','OSS','h12',ARRAY['team-se'],'391234567890','daniela.traballoni@aslroma2.it','password123',false,'',ARRAY[]::text[],NULL),
('60','Pittiglio Michele','Medico','h24',ARRAY['team-se'],'','michele.pittiglio@aslroma2.it','password123',false,'',ARRAY[]::text[],NULL),
('61','Sara Dominijanni','Medico','h24',ARRAY['team-se'],'','sara.dominijanni@aslroma2.it','password123',false,'',ARRAY[]::text[],NULL),
('62','Angeloni Vincenzo','Medico','h24',ARRAY['team-se'],'','vincenzo.angeloni@aslroma2.it','password123',false,'',ARRAY[]::text[],NULL),
('63','Giuliani Giovanni','Medico','h24',ARRAY['team-se','team-cto'],'','giovanni.giuliani@aslroma2.it','password123',false,'',ARRAY[]::text[],NULL),
('64','Moscatelli Mariana','Medico','h24',ARRAY['team-se'],'','mariana.moscatelli@aslroma2.it','password123',false,'',ARRAY[]::text[],NULL),
('unassigned','Turni Scoperti','Infermiere','h24',ARRAY[]::text[],'','','',false,'',ARRAY[]::text[],NULL);

-- =========================
-- SEED: SHIFT DEFINITIONS (da constants.ts)
-- =========================
INSERT INTO shift_definitions (code, description, location, time, color, "textColor", roles) VALUES
('M','Mattina Direzione','Direzione','Mattina','bg-slate-200','text-slate-800',ARRAY['Caposala']),
('Md','Mattina Dialisi S.Eugenio','Dialisi Sant''Eugenio','Mattina','bg-blue-200','text-blue-800',ARRAY['Infermiere','Caposala']),
('Ps','Pomeriggio+Sera Dialisi S.Eugenio','Dialisi Sant''Eugenio','Pomeriggio','bg-blue-300','text-blue-900',ARRAY['Infermiere','Caposala']),
('Msc','Mattina Dialisi S.Caterina','Dialisi Santa Caterina','Mattina','bg-green-200','text-green-800',ARRAY['Infermiere','Caposala']),
('Psc','Pomeriggio Dialisi S.Caterina','Dialisi Santa Caterina','Pomeriggio','bg-green-200','text-green-800',ARRAY['Infermiere','Caposala']),
('Mc','Mattina Dialisi CTO','Dialisi CTO','Mattina','bg-indigo-200','text-indigo-800',ARRAY['Infermiere','Caposala']),
('Pc','Pomeriggio Dialisi CTO','Dialisi CTO','Pomeriggio','bg-indigo-200','text-indigo-800',ARRAY['Infermiere','Caposala']),
('Mu','Mattina Urgenza S.Eugenio','Urgenza Sant''Eugenio','Mattina','bg-red-200','text-red-800',ARRAY['Infermiere','Caposala']),
('Pu','Pomeriggio Urgenza S.Eugenio','Urgenza Sant''Eugenio','Pomeriggio','bg-red-200','text-red-800',ARRAY['Infermiere','Caposala']),
('Mco','Mattina Sala Operatoria S.Eugenio','Sala Operatoria Sant''Eugenio','Mattina','bg-purple-200','text-purple-800',ARRAY['Infermiere','Caposala']),
('Mac','Mattina Dialisi Peritoneale CTO','Dialisi Peritoneale CTO','Mattina','bg-teal-200','text-teal-800',ARRAY['Infermiere','Caposala']),
('Mn','Mattina Reparto Nefrologia','Reparto Nefrologia Sant''Eugenio','Mattina','bg-yellow-200','text-yellow-800',ARRAY['Infermiere','Caposala']),
('Pn','Pomeriggio Reparto Nefrologia','Reparto Nefrologia Sant''Eugenio','Pomeriggio','bg-yellow-200','text-yellow-800',ARRAY['Infermiere','Caposala']),
('N','Notte Reparto Nefrologia','Reparto Nefrologia Sant''Eugenio','Notte','bg-gray-800','text-white',ARRAY['Infermiere','Caposala']),
('Mat','Mattina Ambulatorio','Ambulatorio DH Sant''Eugenio','Mattina','bg-pink-200','text-pink-800',ARRAY['Infermiere','Caposala']),
('Mat/e','Mattina Ambulatorio/Esterno','Ambulatorio DH Sant''Eugenio','Mattina','bg-pink-300','text-pink-900',ARRAY['Infermiere','Caposala']),
('Me','Mattina Esterno','Esterno','Mattina','bg-orange-200','text-orange-800',ARRAY['Infermiere','Caposala']),
('Pe','Pomeriggio Esterno','Esterno','Pomeriggio','bg-orange-200','text-orange-800',ARRAY['Infermiere','Caposala']),
('Mb','Mattina Stanza B','Stanza B','Mattina','bg-yellow-400','text-yellow-900',ARRAY['Infermiere','Caposala']),
('Pb','Pomeriggio Stanza B','Stanza B','Pomeriggio','bg-yellow-400','text-yellow-900',ARRAY['Infermiere','Caposala']),
('M0','Mattina Piano 0','Piano 0','Mattina','bg-cyan-200','text-cyan-800',ARRAY['OSS']),
('P0','Pomeriggio Piano 0','Piano 0','Pomeriggio','bg-cyan-200','text-cyan-800',ARRAY['OSS']),
('MT','Mattina Piano 2','Piano 2','Mattina','bg-lime-200','text-lime-800',ARRAY['OSS']),
('PT','Pomeriggio Piano 2','Piano 2','Pomeriggio','bg-lime-200','text-lime-800',ARRAY['OSS']),
('G_doc','Guardia','Urgenza Sant''Eugenio','Giornata','#fecaca','#991b1b',ARRAY['Medico']),
('R_doc','Reperibilità','Direzione','Giornata','#fed7aa','#9a3412',ARRAY['Medico']),
('A_doc','Ambulatorio','Ambulatorio DH Sant''Eugenio','Mattina','#bfdbfe','#1e40af',ARRAY['Medico']),
('N_doc','Notte Medico','Reparto Nefrologia Sant''Eugenio','Notte','#1f2937','#f9fafb',ARRAY['Medico']),
('S','Smonto Notte','Reparto Nefrologia Sant''Eugenio','Riposo','bg-gray-400','text-white',ARRAY['Caposala','Infermiere','OSS','Medico']),
('RS','Riposo Settimanale','Direzione','Riposo','bg-gray-400','text-white',ARRAY['Caposala','Infermiere','OSS','Medico']),
('R','Riposo','Direzione','Riposo','bg-gray-400','text-white',ARRAY['Caposala','Infermiere','OSS','Medico']),
('HD','Permesso L.104','Direzione','Assenza','bg-red-500','text-white',ARRAY['Caposala','Infermiere','OSS','Medico']),
('RF','Recupero Festivo','Direzione','Assenza','bg-purple-500','text-white',ARRAY['Caposala','Infermiere','OSS','Medico']),
('A','Malattia','Direzione','Assenza','bg-red-500','text-white',ARRAY['Caposala','Infermiere','OSS','Medico']),
('T1','Malattia Figlio','Direzione','Assenza','bg-red-500','text-white',ARRAY['Caposala','Infermiere','OSS','Medico']),
('FE','Ferie','Direzione','Assenza','bg-green-500','text-white',ARRAY['Caposala','Infermiere','OSS','Medico']),
('UNCOVERED','Turno Scoperto','Direzione','Fuori Turno','bg-red-600 animate-pulse','text-white',ARRAY[]::text[]);

COMMIT;

-- Post steps consigliati:
-- 1. Eseguire questo script nello SQL Editor di Supabase.
-- 2. Rigenerare types: npx supabase gen types typescript --project-id YOUR_PROJECT_ID > types/supabase.ts
-- 3. Verificare supabase.from('staff').select('*') ritorni campi camelCase.
-- 4. Aggiornare "nightSquad" dove necessario (UPDATE staff SET "nightSquad"=1 WHERE id='31'; ecc.)
