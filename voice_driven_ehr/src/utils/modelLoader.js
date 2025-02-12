// Model loading utilities with caching and memory monitoring
export function loadRemote(url, dst, size_mb, cbProgress, cbReady, cbCancel, cbPrint) {
    const CHUNK_SIZE = 10 * 1024 * 1024;
    let offset = 0;
    let cancelled = false;
    let modelBuffer = null;

    // IndexedDB setup for caching
    const dbName = `modelCache_${btoa(url)}`;
    const storeName = 'chunks';
    
    const openDB = () => new Promise((resolve, reject) => {
        const request = indexedDB.open(dbName, 1);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(storeName)) {
                db.createObjectStore(storeName);
            }
        };
    });

    async function fetchChunk() {
        if (cancelled) return;

        try {
            const db = await openDB();
            const tx = db.transaction(storeName, 'readonly');
            const store = tx.objectStore(storeName);
            
            // Check cache first
            const cachedChunk = await new Promise(resolve => {
                const request = store.get(offset);
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => resolve(null);
            });

            if (cachedChunk) {
                if (!modelBuffer) modelBuffer = new Uint8Array(size_mb * 1024 * 1024);
                modelBuffer.set(new Uint8Array(cachedChunk), offset);
                offset += cachedChunk.byteLength;
                cbProgress(offset / (size_mb * 1024 * 1024));
                processChunk();
                return;
            }

            // Fallback to network if not cached
            const response = await fetch(url, {
                headers: { Range: `bytes=${offset}-${offset + CHUNK_SIZE}` }
            });
            
            const reader = response.body.getReader();
            const result = await reader.read();
            const chunk = result.value;
            
            // Cache the chunk
            const writeTx = db.transaction(storeName, 'readwrite');
            writeTx.objectStore(storeName).put(chunk.buffer, offset);
            await writeTx.done;

            if (!modelBuffer) modelBuffer = new Uint8Array(size_mb * 1024 * 1024);
            modelBuffer.set(new Uint8Array(chunk.buffer), offset);
            offset += chunk.byteLength;
            cbProgress(offset / (size_mb * 1024 * 1024));
            processChunk();
        } catch (err) {
            cbCancel(err.message);
        }
    }

    function processChunk() {
        if (offset >= size_mb * 1024 * 1024 || cancelled) {
            if (!cancelled) {
                Module.HEAPU8.set(modelBuffer, dst);
                cbReady();
                monitorMemory();
            }
            return;
        }
        setTimeout(fetchChunk, 0);
    }

    // Memory monitoring
    function monitorMemory() {
        const interval = setInterval(() => {
            if (cancelled) {
                clearInterval(interval);
                return;
            }
            const memory = performance.memory;
            console.log(`JS heap: ${(memory.usedJSHeapSize / 1048576).toFixed(2)} MB`);
            if (memory.usedJSHeapSize > memory.jsHeapSizeLimit * 0.8) {
                console.warn('Low memory - consider unloading models');
            }
        }, 5000);
    }

    // Unloading mechanism
    function unloadModel() {
        cancelled = true;
        
        // modelBuffer = null;
        // Module.HEAPU8.fill(0, dst, dst + (size_mb * 1024 * 1024));
        // console.log(`Model at ${url} unloaded`);

        if (modelBuffer) {                                                                                                                                                    
            Module._free(dst); // Explicit WASM memory cleanup                                                                                                                  
            modelBuffer = null;                                                                                                                                                 
          }
    }

    // Start processing
    fetchChunk();
    return { unloadModel };
}
