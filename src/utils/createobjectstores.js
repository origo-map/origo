/**
 * Creates a set of objectsstores in indexexDb. If it exists, the schema is migrated to
 * the new version but all data is deleted as we don't know how to migrate the data on a general basis
 * @param {string} databaseName Name of the database
 * @param {string} databaseVersion Desired version
 * @param {any[]} stores Array of objectstore definitions. Valid fields are name, keyPath, autoIncrement, indices = array of index names.
 * @returns {Promise<any>} A promise that resolves when init is done
 */
export default function createObjectStores(databaseName, databaseVersion, stores) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(databaseName, databaseVersion);
    request.onerror = (event) => {
      reject(event.target.error);
    };
    request.onsuccess = (event) => {
      resolve(event.target.result);
    };
    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      // Do an evil db update: always remove and rebuild, will destroy data but we don't
      // have to bother with possible migrations
      // It is not possible to delete the entire database at this point, so we have to loop all object stores
      while (db.objectStoreNames.length > 0) {
        db.deleteObjectStore(db.objectStoreNames[0]);
      }
      stores.forEach((store) => {
        const objectStore = db.createObjectStore(store.name, {
          keyPath: store.keyPath,
          autoIncrement: store.autoIncrement
        });
        if (store.indices) {
          store.indices.forEach((index) => {
            objectStore.createIndex(index, index, { unique: false });
          });
        }
      });
    };
  });
}
