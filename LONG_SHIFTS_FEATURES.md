# Gestione Turni Lunghi - Nuove Funzionalità

## Panoramica

Questa aggiunta implementa nuove funzionalità per la gestione dei turni lunghi (long shifts) nell'applicazione di gestione turni ospedalieri. Le nuove funzionalità includono:

1. Limiti mensili per i turni lunghi per ogni membro dello staff
2. Verifica che i turni lunghi siano assegnati nello stesso ospedale
3. Visualizzazione visiva per turni lunghi pericolosi
4. Avvisi per combinazioni di turni lunghi pericolose

## Nuovi Campi Aggiunti

### Tabella Staff (Supabase)
- `available_for_long_shifts` (BOOLEAN, default: true) - Indica se il membro dello staff è disponibile per turni lunghi
- `max_long_shifts_per_month` (INTEGER, default: 1) - Numero massimo di turni lunghi consentiti al mese

### Interfaccia Staff
I nuovi campi sono stati aggiunti al modulo di modifica del personale:
- Checkbox "Disponibile per turni lunghi"
- Selezione "Numero massimo di turni lunghi al mese" (0-3)

## Logica di Business

### Verifica Limiti Mensili
Prima di assegnare un turno lungo, il sistema verifica:
1. Che il membro dello staff sia disponibile per turni lunghi
2. Che il membro dello staff non abbia superato il limite mensile
3. Che il tipo di contratto consenta turni lunghi

### Verifica Ospedale
Quando vengono creati turni lunghi combinati (es. Msc/Ps), il sistema verifica che entrambi i turni siano nello stesso ospedale:
- Sant'Eugenio: Md, Ps, Mu, Pu, Mn, Pn, N, Mat, Mat/e, Me, Pe, Mb, Pb
- Santa Caterina: Msc, Psc
- CTO: Mc, Pc, Mac
- Camera Operatoria: Mco

### Assegnazione Automatica Turni Scoperti
Durante la generazione del calendario, se ci sono turni lunghi scoperti:
1. Il sistema cerca membri dello staff disponibili per turni lunghi
2. Verifica che siano entro i loro limiti mensili
3. Assegna automaticamente i turni se possibile
4. Crea turni scoperti solo per le posizioni rimanenti

## Visualizzazione

### Turni Lunghi Pericolosi
I turni lunghi pericolosi (assegnati manualmente o combinazioni tra ospedali diversi) vengono visualizzati con:
- Sfondo rosso acceso
- Animazione "pulse"
- Indicatore giallo lampeggiante nell'angolo in alto a destra
- Alert di avviso quando si clicca sull'indicatore

### Turni Scoperti
I turni lunghi scoperti vengono visualizzati con:
- Sfondo rosso con animazione "pulse"
- Icona di avviso
- Alert di avviso quando si clicca sul turno

## Implementazione Tecnica

### File Modificati
1. `types.ts` - Aggiunti i nuovi campi all'interfaccia Staff
2. `constants.ts` - Aggiornati i dati mock con i nuovi campi
3. `components/StaffEditModal.tsx` - Aggiunta l'interfaccia utente per i nuovi campi
4. `components/ShiftCalendar.tsx` - Aggiunta la visualizzazione per turni pericolosi
5. `hooks/useShiftData.ts` - Aggiornata la logica per salvare i nuovi campi
6. `utils/shiftUtils.ts` - Aggiunte le funzioni di utilità per la verifica dei turni lunghi
7. `components/ShiftPlanner.tsx` - Aggiornata la logica di generazione per assegnare i turni lunghi scoperti

### File Nuovi
1. `supabase_migration_long_shifts.sql` - Script di migrazione per il database
2. `LONG_SHIFTS_FEATURES.md` - Questo file di documentazione

## Utilizzo

### Per gli Amministratori
1. Modificare i membri dello staff per impostare la disponibilità ai turni lunghi
2. Impostare i limiti mensili per i turni lunghi
3. Monitorare i turni pericolosi nell'interfaccia del calendario

### Per i Coordinatori
1. Durante l'assegnazione manuale di turni lunghi, fare attenzione agli avvisi
2. Evitare combinazioni di turni lunghi tra ospedali diversi
3. Verificare i limiti mensili dei membri dello staff

## Limitazioni Note

1. La verifica dei turni pericolosi è basata su prefissi dei codici turno
2. I turni lunghi combinati devono essere creati manualmente nell'interfaccia
3. La migrazione del database deve essere eseguita manualmente