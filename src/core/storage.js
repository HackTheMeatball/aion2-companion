/* Where the save is kept (0.4 P3b, pure: no DOM, no browser storage). The page reads and writes the save only through a
   storage object with this synchronous interface; the browser one is src/shell/storage-web.js, a native one (store app)
   can come later without the page changing:
     get(key)        → the stored text, or null when there is none or it can't be read
     set(key, text)  → true when the text was stored, false when it wasn't (storage full, private mode, disabled)
     remove(key)     → nothing; never throws
   memoryStorage() keeps the texts in a Map (Node tests). `quota`, if given, is the most characters (keys plus texts) it
   holds: a set that would go over it stores nothing and returns false, like a full browser storage. */
export function memoryStorage(quota = Infinity) {
  const m = new Map();
  const size = () => { let n = 0; for (const [k, v] of m) n += k.length + v.length; return n; };
  return {
    get: key => (m.has(key) ? m.get(key) : null),
    set(key, text) {
      text = String(text);
      if (size() - (m.has(key) ? key.length + m.get(key).length : 0) + key.length + text.length > quota) return false;
      m.set(key, text); return true;
    },
    remove: key => { m.delete(key); },
  };
}
