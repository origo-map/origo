import Origo from "./src/index.js";
const origo = Origo('index.json');

globalThis.Origo = Origo;
globalThis.origo = origo;