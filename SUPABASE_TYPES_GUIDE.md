# Guida rigenerazione types Supabase

## 1. Perché rigenerare
Dopo aver cambiato lo schema (script *supabase_schema_fix.sql* o *supabase_seed.sql*) devi rigenerare `types/supabase.ts` per avere i tipi aggiornati alle colonne reali del DB.

## 2. Recuperare Project ID
Il Project ID è la parte subdomain dell&#39;URL:  
SUPABASE_URL=https://ltysyyqymqmnrejxhpcq.supabase.co  
Project ID: **ltysyyqymqmnrejxhpcq**

## 3. Ottenere un Access Token
1. Vai su https://supabase.com/dashboard/account/tokens  
2. Crea un **Personal Access Token** (PAT) (scope full / read a seconda necessità).
3. COPIA il token (mostrato una sola volta).

## 4. Metodo rapido (senza installazione globale) usando lo script già in package.json
Nel terminale (NON incollare il token nel repository, solo in shell):

```bash
export SUPABASE_ACCESS_TOKEN="sbp_93ae2e68815ba480e50c8d0282842f09d2586afd"
npm run gen:types
```

Lo script esegue:
```
supabase gen types typescript --project-id $SUPABASE_PROJECT_ID --schema public > types/supabase.ts
```
Quindi imposta prima anche la variabile del project id (una volta sola oppure mettila nel tuo .env):
```bash
export SUPABASE_PROJECT_ID="ltysyyqymqmnrejxhpcq"
```

Riepilogo completo:
```bash
export SUPABASE_PROJECT_ID="ltysyyqymqmnrejxhpcq"
export SUPABASE_ACCESS_TOKEN="sbp_93ae2e68815ba480e50c8d0282842f09d2586afd"
npm run gen:types
```



## 5. Verifica risultato
Apri `types/supabase.ts` e controlla che le nuove tabelle (staff, teams, shift_definitions, scheduled_shifts, absences) compaiano dentro `Database.public.Tables`.

## 7. Errori comuni
- **Access token not provided**: Non hai esportato SUPABASE_ACCESS_TOKEN o non hai fatto `supabase login`.
- **Permission denied**: Il token non ha i permessi (ricrea token con scope completo).
- **File vuoto**: Errore precedente ha interrotto la generazione; ripeti il comando dopo aver sistemato l&#39;access token.

## 8. Sicurezza
NON committare il token. Usalo solo come variabile di ambiente (shell) o in un `.env.local` non tracciato da git (.gitignore).

## 9. Aggiornamenti successivi
Ogni volta che modifichi lo schema (aggiungi colonne, tabelle, ecc.) ripeti:
```bash
export SUPABASE_ACCESS_TOKEN="... (se nuova shell)"
npm run gen:types
```

Fine.
