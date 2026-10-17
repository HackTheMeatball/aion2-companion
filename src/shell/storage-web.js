/* The browser's storage behind the interface of src/core/storage.js (0.4 P3b): the only file in src/ that touches
   localStorage. Same keys, same text as the page wrote before the adapter; where setItem throws (storage full,
   private mode, storage disabled), set returns false, so the page's "couldn't be saved" banner shows as before. */
export const webStorage = {
  get(key) { try { return localStorage.getItem(key); } catch (e) { return null; } },
  set(key, text) { try { localStorage.setItem(key, text); return true; } catch (e) { return false; } },
  remove(key) { try { localStorage.removeItem(key); } catch (e) {} },
};
