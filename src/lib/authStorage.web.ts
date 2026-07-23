// Sur web, expo-sqlite embarque du WASM qui demande une config Metro dédiée (COOP/COEP).
// localStorage du navigateur est largement suffisant pour une session de preview web.
export default {
  getItem: (key: string) => Promise.resolve(window.localStorage.getItem(key)),
  setItem: (key: string, value: string) => {
    window.localStorage.setItem(key, value);
    return Promise.resolve();
  },
  removeItem: (key: string) => {
    window.localStorage.removeItem(key);
    return Promise.resolve();
  },
};
