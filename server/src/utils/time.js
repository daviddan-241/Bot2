export const nowIso = () => new Date().toISOString();
export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
