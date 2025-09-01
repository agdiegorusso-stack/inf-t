-- SQL INSERT statements for mockTeams
INSERT INTO teams (id, name, locations)
VALUES
('team-se', 'Team Sant''Eugenio', '{"Dialisi Sant''Eugenio","Urgenza Sant''Eugenio","Reparto Nefrologia Sant''Eugenio","Ambulatorio DH Sant''Eugenio","Stanza B","Piano 0","Piano 2"}'),
('team-sc', 'Team Santa Caterina', '{"Dialisi Santa Caterina"}'),
('team-cto', 'Team CTO', '{"Dialisi CTO","Dialisi Peritoneale CTO"}'),
('team-co', 'Team Camera Operatoria', '{"Sala Operatoria Sant''Eugenio"}'),
('team-misto', 'Team Misto (Tutte le Sedi)', '{"Dialisi Sant''Eugenio","Dialisi Santa Caterina","Dialisi CTO","Urgenza Sant''Eugenio","Sala Operatoria Sant''Eugenio","Dialisi Peritoneale CTO","Reparto Nefrologia Sant''Eugenio","Ambulatorio DH Sant''Eugenio","Ambulatorio Via Marotta","Esterno","Stanza B","Piano 0","Piano 2"}'),
('team-management', 'Team Direzione', '{"Direzione"}');
