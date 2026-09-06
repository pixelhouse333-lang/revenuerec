const STORAGE_KEY = "constructa.contracts.v1";

export function loadAllContracts() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch (e) {
    return [];
  }
}

export function saveAllContracts(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}
