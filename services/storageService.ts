import { UploadedFile } from "../types";

const STORAGE_KEY = 'docusort_history_v1';

export const getHistory = (): UploadedFile[] => {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    } catch (e) {
        console.error("Failed to read history", e);
        return [];
    }
};

export const saveHistoryItem = (item: UploadedFile) => {
    try {
        const current = getHistory();
        // Prepend new item
        const updated = [item, ...current].slice(0, 50); // Limit to 50 items
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
        console.error("Failed to save history", e);
    }
};

export const clearHistory = () => {
    localStorage.removeItem(STORAGE_KEY);
};