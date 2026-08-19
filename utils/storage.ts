export const readStorageJson = <T>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) as T : fallback;
  } catch (error) {
    console.warn(`Failed to read storage key: ${key}`, error);
    return fallback;
  }
};

export const writeStorageJson = <T>(key: string, value: T): boolean => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error(`Failed to write storage key: ${key}`, error);
    return false;
  }
};
