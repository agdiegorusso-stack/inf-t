# Guida Rigenerazione Tipi Supabase (types/supabase.ts)

## 1. Perché rigenerare
Ogni modifica allo schema (nuove colonne, tabelle, rename) richiede la rigenerazione di `types/supabase.ts` per avere auto-completion e type‑safety aggiornati.

## 2. Project ID
Ricavato da SUPABASE_URL (subdomain):
```
SUPABASE_URL=https://ltysyyqymqmnrejxhpcq.supabase.co
Project ID: ltysyyqymqmnrejxhpcq
```

## 3. Creare un Personal Access Token (PAT)
1. Vai a https://supabase.com/dashboard/account/tokens
2. Clicca “New Token”
3. Dai un nome (es: local-dev) e copia il token (mostrato una sola volta)
4. NON inserirlo nel repository (mai committare)

## 4. Variabili di ambiente (shell corrente)
```bash
export SUPABASE_PROJECT_ID="ltysyyqymqmnrejxhpcq"
export SUPABASE_ACCESS_TOKEN="PASTE_IL_TUO_TOKEN"
```

## 5. Script già pronto (package.json)
Abbiamo aggiunto lo script:
```
"gen:types": "supabase gen types typescript --project-id $SUPABASE_PROJECT_ID --schema public > types/supabase.ts"
```

Esegui:
```bash
