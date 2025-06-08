# 🗄️ Database Migration Guide per Supabase

Questo documento descrive come applicare correttamente gli schemi database in Supabase, considerando la struttura esistente.

## 📋 Ordine di Esecuzione

Esegui i file SQL nell'**ordine seguente** nel SQL Editor di Supabase:

### 1. **Schema Base** (01_schema_creation.sql)

```sql
-- Esegui tutto il contenuto del file 01_schema_creation.sql
```

✅ **Sicuro per strutture esistenti:**

- Usa `CREATE OR REPLACE` per funzioni
- Usa `IF NOT EXISTS` per tabelle
- `DROP TRIGGER IF EXISTS` per evitare conflitti

### 2. **Schema Kanban** (02_kanban_schema.sql)

```sql
-- Esegui tutto il contenuto del file 02_kanban_schema.sql
```

✅ **Dipende da:** Schema base (funzioni trigger)

### 3. **Schema Blueprint/Proposal** (03_blueprint_proposal_schema.sql)

```sql
-- Esegui tutto il contenuto del file 03_blueprint_proposal_schema.sql
```

✅ **Dipende da:** Schema base + project e profiles tables

## 🔧 Funzionalità Anti-Conflitto

I file sono stati aggiornati per evitare errori con strutture esistenti:

### ✅ **Trigger Management**

- `DROP TRIGGER IF EXISTS` prima di ricreare
- Usa la stessa funzione `trigger_set_timestamp()` per tutti

### ✅ **Tabelle e Constraint**

- `CREATE TABLE IF NOT EXISTS` per tutte le tabelle
- Gestione intelligente dei constraint unici
- Riferimenti corretti tra tabelle

### ✅ **Funzioni**

- `CREATE OR REPLACE FUNCTION` per aggiornamenti sicuri
- Funzioni compatibili con Supabase timestamp

## 🚨 Verifiche Post-Migrazione

Dopo l'esecuzione, verifica che le seguenti tabelle esistano:

```sql
-- Verifica tabelle base
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN (
    'profiles', 'project', 'project_members',
    'epic', 'sprint', 'ticket', 'comment'
);

-- Verifica tabelle Kanban
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('kanban_columns', 'kanban_tasks');

-- Verifica tabelle Blueprint/Proposal
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('blueprints', 'proposals');

-- Verifica estensioni per vector embeddings
SELECT extname as extension_name, extversion as version
FROM pg_extension
WHERE extname IN ('uuid-ossp', 'vector');

-- Verifica indici vettoriali
SELECT schemaname, tablename, indexname
FROM pg_indexes
WHERE tablename = 'ticket'
AND indexname LIKE '%embedding%';
```

## 🔗 Dipendenze Critiche

Le seguenti dipendenze **devono esistere** prima di procedere:

1. **Supabase Auth**: `auth.users` table (automatica)
2. **Extensions**: `uuid-ossp`, `vector` (create automaticamente se disponibili)
3. **Sequenza**: Eseguire file nell'ordine specificato

## 🛠️ Risoluzione Problemi

### Errore: "relation already exists"

```sql
-- Se una tabella esiste già, il comando IF NOT EXISTS la salterà automaticamente
-- Nessuna azione richiesta
```

### Errore: "trigger already exists"

```sql
-- I file usano DROP TRIGGER IF EXISTS per evitare questo errore
-- Se persiste, esegui manualmente:
DROP TRIGGER IF EXISTS <trigger_name> ON <table_name>;
```

### Errore: "function does not exist"

```sql
-- Assicurati di aver eseguito 01_schema_creation.sql per primo
-- Contiene tutte le funzioni trigger necessarie
```

## 🎯 Backend API Compatibility

Dopo la migrazione, il backend API avrà:

✅ **Autorizzazione per progetto** via `project_members`
✅ **Kanban completamente funzionale** con `kanban_columns` e `kanban_tasks`
✅ **Blueprint e Proposal** per documentazione e offerte
✅ **Vector embeddings** per ricerca semantica nei ticket (colonna `embeddings`)
✅ **Trigger automatici** per `updated_at` su tutte le tabelle

## 📱 Frontend Integration

Il frontend potrà ora:

- Usare `ProjectContext` per gestione progetti globale
- Filtrare tutti i tool per progetto corrente
- Gestire autorizzazioni per progetto
- Sincronizzare Kanban, Blueprint, Proposal per progetto

## 🔄 Rollback (se necessario)

Per fare rollback delle modifiche:

```sql
-- ATTENZIONE: Questo eliminerà TUTTI i dati!
DROP TABLE IF EXISTS proposals CASCADE;
DROP TABLE IF EXISTS blueprints CASCADE;
DROP TABLE IF EXISTS kanban_tasks CASCADE;
DROP TABLE IF EXISTS kanban_columns CASCADE;
DROP TABLE IF EXISTS project_members CASCADE;
-- Non droppare project, profiles se esistevano prima
```

---

✨ **Una volta completata la migrazione, tutti i tool saranno project-aware e potranno cooperare correttamente!**
