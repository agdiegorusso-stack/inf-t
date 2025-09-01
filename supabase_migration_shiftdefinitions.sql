-- Aggiorna la tabella shift_definitions per aggiungere la colonna roles
ALTER TABLE shift_definitions
ADD COLUMN roles text[] DEFAULT ARRAY[]::text[];

-- (Opzionale) Se la colonna esiste già, puoi saltare questo step.

-- Cancella tutti i dati vecchi (se necessario)
DELETE FROM shift_definitions;

-- Inserisci i dati corretti con la colonna roles valorizzata
INSERT INTO shift_definitions (code, name, time, roles)
VALUES
('M', 'Mattina Direzione', 'Morning', '{"HeadNurse"}'),
('Md', 'Mattina Dialisi S.Eugenio', 'Morning', '{"Nurse"}'),
('Ps', 'Pomeriggio+Sera Dialisi S.Eugenio', 'Afternoon', '{"Nurse"}'),
('Msc', 'Mattina Dialisi S.Caterina', 'Morning', '{"Nurse"}'),
('Psc', 'Pomeriggio Dialisi S.Caterina', 'Afternoon', '{"Nurse"}'),
('Mc', 'Mattina Dialisi CTO', 'Morning', '{"Nurse"}'),
('Pc', 'Pomeriggio Dialisi CTO', 'Afternoon', '{"Nurse"}'),
('Mu', 'Mattina Urgenza S.Eugenio', 'Morning', '{"Nurse"}'),
('Pu', 'Pomeriggio Urgenza S.Eugenio', 'Afternoon', '{"Nurse"}'),
('Mco', 'Mattina Sala Operatoria S.Eugenio', 'Morning', '{"Nurse"}'),
('Mac', 'Mattina Dialisi Peritoneale CTO', 'Morning', '{"Nurse"}'),
('Mn', 'Mattina Reparto Nefrologia', 'Morning', '{"Nurse"}'),
('Pn', 'Pomeriggio Reparto Nefrologia', 'Afternoon', '{"Nurse"}'),
('N', 'Notte Reparto Nefrologia', 'Night', '{"Nurse"}'),
('Mat', 'Mattina Ambulatorio', 'Morning', '{"Nurse"}'),
('Mat/e', 'Mattina Ambulatorio/Esterno', 'Morning', '{"Nurse"}'),
('Me', 'Mattina Esterno', 'Morning', '{"Nurse"}'),
('Pe', 'Pomeriggio Esterno', 'Afternoon', '{"Nurse"}'),
('Mb', 'Mattina Stanza B', 'Morning', '{"Nurse"}'),
('Pb', 'Pomeriggio Stanza B', 'Afternoon', '{"Nurse"}'),
('M0', 'Mattina Piano 0', 'Morning', '{"Nurse"}'),
('P0', 'Pomeriggio Piano 0', 'Afternoon', '{"Nurse"}'),
('MT', 'Mattina Piano 2', 'Morning', '{"Nurse"}'),
('PT', 'Pomeriggio Piano 2', 'Afternoon', '{"Nurse"}'),
('G_doc', 'Guardia', 'FullDay', '{"Doctor"}'),
('R_doc', 'Reperibilità', 'FullDay', '{"Doctor"}'),
('A_doc', 'Ambulatorio', 'Morning', '{"Doctor"}'),
('N_doc', 'Notte Medico', 'Night', '{"Doctor"}'),
('S', 'Smonto Notte', 'Rest', '{"Nurse","Doctor"}'),
('RS', 'Riposo Settimanale', 'Rest', '{"Nurse","OSS","Doctor"}'),
('R', 'Riposo', 'Rest', '{"Nurse","OSS","Doctor"}'),
('HD', 'Permesso L.104', 'Absence', '{"Nurse","OSS","Doctor"}'),
('RF', 'Recupero Festivo', 'Absence', '{"Nurse","OSS","Doctor"}'),
('A', 'Malattia', 'Absence', '{"Nurse","OSS","Doctor"}'),
('T1', 'Malattia Figlio', 'Absence', '{"Nurse","OSS","Doctor"}'),
('FE', 'Ferie', 'Absence', '{"Nurse","OSS","Doctor"}'),
('UNCOVERED', 'Turno Scoperto', 'OffShift', '{"Nurse","OSS","Doctor"}');
