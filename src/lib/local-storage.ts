// Web : le navigateur fournit déjà `localStorage`. Surtout ne pas importer expo-sqlite
// ici : sa version web exige un fichier .wasm que le serveur de développement ne
// sait pas résoudre (voir local-storage.native.ts pour le mobile).
export {};
