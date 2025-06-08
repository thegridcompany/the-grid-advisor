-- Verifica Migration Script
-- Esegui questo script dopo aver completato la migrazione per verificare che tutto sia corretto

\echo '🔍 Verificando tabelle create...'

-- Verifica esistenza tabelle principali
SELECT 
    'profiles' as table_name,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles' AND table_schema = 'public') 
         THEN '✅ EXISTS' 
         ELSE '❌ MISSING' 
    END as status
UNION ALL
SELECT 
    'project' as table_name,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'project' AND table_schema = 'public') 
         THEN '✅ EXISTS' 
         ELSE '❌ MISSING' 
    END as status
UNION ALL
SELECT 
    'project_members' as table_name,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'project_members' AND table_schema = 'public') 
         THEN '✅ EXISTS' 
         ELSE '❌ MISSING' 
    END as status
UNION ALL
SELECT 
    'kanban_columns' as table_name,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'kanban_columns' AND table_schema = 'public') 
         THEN '✅ EXISTS' 
         ELSE '❌ MISSING' 
    END as status
UNION ALL
SELECT 
    'kanban_tasks' as table_name,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'kanban_tasks' AND table_schema = 'public') 
         THEN '✅ EXISTS' 
         ELSE '❌ MISSING' 
    END as status
UNION ALL
SELECT 
    'blueprints' as table_name,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'blueprints' AND table_schema = 'public') 
         THEN '✅ EXISTS' 
         ELSE '❌ MISSING' 
    END as status
UNION ALL
SELECT 
    'proposals' as table_name,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'proposals' AND table_schema = 'public') 
         THEN '✅ EXISTS' 
         ELSE '❌ MISSING' 
    END as status;

\echo ''
\echo '🔧 Verificando funzioni trigger...'

-- Verifica esistenza funzioni
SELECT 
    routine_name as function_name,
    '✅ EXISTS' as status
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('trigger_set_timestamp', 'update_updated_at_column')
ORDER BY routine_name;

\echo ''
\echo '🔌 Verificando estensioni...'

-- Verifica estensioni installate
SELECT 
    extname as extension_name,
    extversion as version,
    '✅ ENABLED' as status
FROM pg_extension 
WHERE extname IN ('uuid-ossp', 'vector')
ORDER BY extname;

\echo ''
\echo '⚡ Verificando trigger attivi...'

-- Verifica trigger esistenti
SELECT 
    trigger_name,
    table_name,
    '✅ ACTIVE' as status
FROM information_schema.triggers 
WHERE trigger_schema = 'public'
AND trigger_name LIKE '%updated_at%'
ORDER BY table_name, trigger_name;

\echo ''
\echo '🔗 Verificando relazioni chiave...'

-- Verifica foreign key constraints critiche
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    '✅ LINKED' as status
FROM information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_schema = 'public'
AND tc.table_name IN ('kanban_tasks', 'kanban_columns', 'blueprints', 'proposals', 'project_members')
ORDER BY tc.table_name;

\echo ''
\echo '📊 Conteggio record (se esistenti)...'

-- Conta record esistenti (se ci sono)
SELECT 
    'profiles' as table_name,
    COALESCE((SELECT COUNT(*)::text FROM profiles), '0') as record_count
UNION ALL
SELECT 
    'project' as table_name,
    COALESCE((SELECT COUNT(*)::text FROM project), '0') as record_count
UNION ALL
SELECT 
    'kanban_columns' as table_name,
    COALESCE((SELECT COUNT(*)::text FROM kanban_columns), '0') as record_count
UNION ALL
SELECT 
    'kanban_tasks' as table_name,
    COALESCE((SELECT COUNT(*)::text FROM kanban_tasks), '0') as record_count;

\echo ''
\echo '🎯 Migration Status Summary:'
\echo '========================================='

-- Summary finale
SELECT 
    CASE 
        WHEN (
            SELECT COUNT(*) 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name IN ('profiles', 'project', 'project_members', 'kanban_columns', 'kanban_tasks', 'blueprints', 'proposals')
        ) = 7 
        THEN '🎉 SUCCESS: All tables created successfully!'
        ELSE '⚠️  WARNING: Some tables might be missing. Check errors above.'
    END as migration_status; 