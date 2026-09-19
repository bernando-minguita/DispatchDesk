import { SCHEMA, LEGACY_MIGRATIONS, SAMPLE_ORDERS, SAMPLE_ADDRESS_BOOK, SAMPLE_BRANCHES, SAMPLE_FLEET, SAMPLE_TRACKING, runLegacyMigrations } from './db.js';

let db = null;
const IDB_NAME = 'VehicleTrackerDB';
const IDB_STORE = 'db_store';
const IDB_KEY = 'single_sqlite_db';
let syncTimer = null;
let idbPromise = null;
let isUnloading = false;
let sqlJsPromise = null;

Object.defineProperty(window, 'db', {
    get() { return db; },
    set(value) { db = value; },
    configurable: true
});

async function ensureSqlJs() {
    if (window.SQL && typeof window.SQL.Database === 'function') {
        return window.SQL;
    }
    if (!sqlJsPromise) {
        if (typeof initSqlJs !== 'function') {
            throw new Error('sql.js engine is not loaded. Please check vendor/sqljs/sql-wasm.js.');
        }
        sqlJsPromise = initSqlJs({ locateFile: file => `vendor/sqljs/${file}` });
    }
    const sqlJs = await sqlJsPromise;
    if (!sqlJs || typeof sqlJs.Database !== 'function') {
        throw new Error('sql.js initialized without a Database constructor');
    }
    window.SQL = sqlJs;
    return sqlJs;
}

// --- IndexedDB helpers -----------------------------------------------------

function openIDB() {
    if (idbPromise) return idbPromise;
    idbPromise = new Promise((resolve, reject) => {
        if (!window.indexedDB) {
            reject(new Error('IndexedDB is not supported in this environment.'));
            return;
        }
        const request = indexedDB.open(IDB_NAME, 1);
        request.onupgradeneeded = (e) => {
            const idb = e.target.result;
            if (!idb.objectStoreNames.contains(IDB_STORE)) {
                idb.createObjectStore(IDB_STORE);
            }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => {
            idbPromise = null; // allow retry on failure
            reject(request.error);
        };
        request.onblocked = () => {
            idbPromise = null;
            reject(new Error('IndexedDB open blocked by another tab.'));
        };
    });
    // If the promise rejects, clear the cache so a later call can retry.
    idbPromise.catch(() => { idbPromise = null; });
    return idbPromise;
}

async function saveToIndexedDB(binaryData) {
    try {
        const idb = await openIDB();
        const tx = idb.transaction(IDB_STORE, 'readwrite');
        const store = tx.objectStore(IDB_STORE);

        // Set up the completion listener BEFORE issuing the write, so a
        // synchronous DataCloneError from put() still resolves/rejects the
        // promise instead of hanging.
        const done = new Promise((resolve, reject) => {
            tx.oncomplete = () => resolve(true);
            tx.onerror = () => reject(tx.error || new Error('IndexedDB transaction failed'));
            tx.onabort = () => reject(tx.error || new Error('IndexedDB transaction aborted'));
        });

        try {
            store.put({ data: binaryData, timestamp: new Date().toISOString() }, IDB_KEY);
        } catch (syncErr) {
            try { tx.abort(); } catch (_) {}
            throw syncErr;
        }

        await done;

        if (typeof window.updateDbStatus === 'function') {
            window.updateDbStatus(true, 'dispatchdesk.sqlite (Saved)');
        }
        return true;
    } catch (e) {
        console.error('Failed to save database to IndexedDB:', e);
        if (typeof window.updateDbStatus === 'function') {
            window.updateDbStatus(false, 'Save failed');
        }
        return false;
    }
}

async function loadFromIndexedDB() {
    try {
        const idb = await openIDB();
        const tx = idb.transaction(IDB_STORE, 'readonly');
        const store = tx.objectStore(IDB_STORE);
        const req = store.get(IDB_KEY);
        return await new Promise((resolve, reject) => {
            req.onsuccess = () => resolve(req.result || null);
            req.onerror = () => reject(req.error);
        });
    } catch (e) {
        console.error('Failed to load database from IndexedDB:', e);
        return null;
    }
}

async function syncToIndexedDB() {
    if (!db) return false;
    let data;
    try {
        data = db.export();
    } catch (e) {
        console.error('Failed to export database:', e);
        return false;
    }
    const saved = await saveToIndexedDB(data);
    if (saved) {
        try {
            if (window.syncChannel && typeof window.syncChannel.postMessage === 'function') {
                window.syncChannel.postMessage({ type: 'db-updated' });
            }
        } catch (e) {
            console.error('BroadcastChannel post failed', e);
        }
    }
    return saved;
}

function debouncedSyncToIndexedDB() {
    if (!db) return;
    // During unload, flush immediately (no debounce) so we don't lose the last write.
    if (isUnloading) {
        syncToIndexedDB();
        return;
    }
    if (syncTimer) clearTimeout(syncTimer);
    syncTimer = setTimeout(() => {
        syncTimer = null;
        syncToIndexedDB();
    }, 400);
}

// --- DB lifecycle ----------------------------------------------------------

async function initSingleDB(loadSamples = false) {
    // Cancel any pending debounced write from the previous DB.
    if (syncTimer) { clearTimeout(syncTimer); syncTimer = null; }

    if (db) {
        try { db.close(); } catch (_) {}
        db = null;
    }

    const SQL = await ensureSqlJs();
    if (!SQL || typeof SQL.Database !== 'function') {
        throw new Error('sql.js is not loaded. Cannot initialize database.');
    }

    db = new SQL.Database();

    // `SCHEMA` may contain multiple statements; `exec` handles multi-statement SQL.
    db.exec(SCHEMA);

    if (loadSamples) {
        // Insert all sample rows first, then register them in bulk.
        //
        // The previous approach captured `last_insert_rowid()` after each
        // `db.run(q)`. That relied on the return value being correct and on
        // every insert actually inserting a row. If any insert silently failed
        // (constraint, schema drift, `INSERT OR IGNORE`), `last_insert_rowid()`
        // returned the *previous* successful insert's rowid — so the registry
        // ended up pointing at the wrong row. `removeSampleData` then deleted
        // the wrong rows, leaving the real sample data behind.
        //
        // Bulk-registering everything after the fact guarantees the registry
        // is a complete, correct mirror of what's actually in the tables.
        for (const q of SAMPLE_ORDERS) db.run(q);
        for (const q of SAMPLE_TRACKING) db.run(q);
        for (const q of SAMPLE_ADDRESS_BOOK) db.run(q);
        for (const q of SAMPLE_FLEET) db.run(q);
        for (const q of SAMPLE_BRANCHES) db.run(q);

        // Register movements and tracking by their actual IDs.
        db.run("INSERT OR IGNORE INTO sample_data_registry (table_name, row_id) SELECT 'movements', id FROM movements");
        db.run("INSERT OR IGNORE INTO sample_data_registry (table_name, row_id) SELECT 'tracking', id FROM tracking");

        // Address book and fleet are flagged directly (no registry entry needed
        // — `removeSampleData` deletes them via `WHERE is_sample = 1`). Guarded
        // with `WHERE is_sample = 0` so the flag is never re-applied to rows
        // a user has already added in this session.
        db.run("UPDATE address_book SET is_sample = 1 WHERE is_sample = 0");
        db.run("UPDATE fleet SET is_sample = 1 WHERE is_sample = 0");
    }

    await syncToIndexedDB();
    if (typeof window.updateDbStatus === 'function') {
        window.updateDbStatus(true, 'dispatchdesk.sqlite (Saved)');
    }
}

// --- Query execution -------------------------------------------------------

function execQuery(sql, params = []) {
    if (!db) {
        const err = new Error('Database is not initialized. Cannot execute query: ' + sql);
        console.error(err.message);
        throw err;
    }
    // sql.js: params must be bound AFTER prepare(), not passed to prepare().
    const stmt = db.prepare(sql);
    try {
        if (params && params.length) stmt.bind(params);
        const rows = [];
        while (stmt.step()) {
            rows.push(stmt.getAsObject());
        }
        return rows;
    } finally {
        stmt.free();
    }
}

// --- Branches --------------------------------------------------------------

function getAllBranches() {
    if (!db) return [];
    return execQuery('SELECT * FROM branches ORDER BY name');
}

function getBranchOptions(selectedValue = '') {
    const branches = getAllBranches();
    // Build with DOM API to avoid any string-injection risk.
    const frag = document.createDocumentFragment();
    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = 'Select Branch';
    frag.appendChild(placeholder);

    for (const b of branches) {
        const opt = document.createElement('option');
        opt.value = b.name;
        opt.textContent = b.name;
        if (b.name.toLowerCase() === selectedValue.toLowerCase()) opt.selected = true;
        frag.appendChild(opt);
    }

    // Serialize for the existing string-returning API.
    const tmp = document.createElement('select');
    tmp.appendChild(frag);
    return tmp.innerHTML;
}

function populateBranchSelect(selectElement, selectedValue) {
    if (!selectElement) return;
    const valueToUse = (selectedValue === undefined) ? selectElement.value : selectedValue;
    selectElement.innerHTML = getBranchOptions(valueToUse);
    if (valueToUse) {
        const options = selectElement.options;
        for (let i = 0; i < options.length; i++) {
            if (options[i].value.toLowerCase() === String(valueToUse).toLowerCase()) {
                selectElement.selectedIndex = i;
                break;
            }
        }
    }
}

function generateId() {
    if (window.crypto && typeof window.crypto.randomUUID === 'function') {
        return window.crypto.randomUUID();
    }
    return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function addBranch(name) {
    if (!db || !name || !String(name).trim()) return false;
    const id = generateId();
    db.run('INSERT INTO branches (id, name) VALUES (?, ?)', [id, String(name).trim()]);
    debouncedSyncToIndexedDB();
    refreshAllBranchSelects();
    return true;
}

function editBranch(id, name) {
    if (!db || !id || !name || !String(name).trim()) return false;
    db.run('UPDATE branches SET name = ? WHERE id = ?', [String(name).trim(), id]);
    debouncedSyncToIndexedDB();
    refreshAllBranchSelects();
    return true;
}

function deleteBranch(id) {
    if (!db || !id) return false;
    db.run('DELETE FROM branches WHERE id = ?', [id]);
    debouncedSyncToIndexedDB();
    refreshAllBranchSelects();
    return true;
}

function refreshAllBranchSelects() {
    document.querySelectorAll('[data-branch-select]').forEach(el => {
        populateBranchSelect(el);
    });
}

// --- Flush pending writes on page unload ----------------------------------

if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', () => {
        isUnloading = true;
        if (syncTimer) {
            clearTimeout(syncTimer);
            syncTimer = null;
            syncToIndexedDB();
        }
    });
    window.addEventListener('pagehide', () => {
        isUnloading = true;
    });
    // Reset the unload flag when the page is restored from the back/forward
    // cache, so future writes go through the normal debounce path again.
    window.addEventListener('pageshow', () => {
        isUnloading = false;
    });
    // Optional: flush on visibility change to background as a safety net.
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden' && syncTimer) {
            clearTimeout(syncTimer);
            syncTimer = null;
            syncToIndexedDB();
        }
    });
}

// --- Exports ---------------------------------------------------------------

window.SCHEMA = SCHEMA;
window.LEGACY_MIGRATIONS = LEGACY_MIGRATIONS;
window.SAMPLE_ORDERS = SAMPLE_ORDERS;
window.SAMPLE_TRACKING = SAMPLE_TRACKING;
window.SAMPLE_ADDRESS_BOOK = SAMPLE_ADDRESS_BOOK;
window.SAMPLE_FLEET = SAMPLE_FLEET;
window.SAMPLE_BRANCHES = SAMPLE_BRANCHES;
window.runLegacyMigrations = runLegacyMigrations;

window.loadFromIndexedDB = loadFromIndexedDB;
window.syncToIndexedDB = syncToIndexedDB;
window.initSingleDB = initSingleDB;
window.execQuery = execQuery;
window.getAllBranches = getAllBranches;
window.getBranchOptions = getBranchOptions;
window.populateBranchSelect = populateBranchSelect;
window.addBranch = addBranch;
window.editBranch = editBranch;
window.deleteBranch = deleteBranch;
window.refreshAllBranchSelects = refreshAllBranchSelects;