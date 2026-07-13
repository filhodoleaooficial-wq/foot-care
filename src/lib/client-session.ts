// Simple client "session" stored in localStorage (no real authentication).
// A visitor enters email + phone and gets an app_clients record; the id is kept locally.

const STORAGE_KEY = "pesaude_client";

export interface ClientSession {
  id: string;
  email: string;
  phone: string;
}

export const getClientSession = (): ClientSession | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && parsed.id) return parsed as ClientSession;
    return null;
  } catch {
    return null;
  }
};

export const setClientSession = (session: ClientSession) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
};

export const clearClientSession = () => {
  localStorage.removeItem(STORAGE_KEY);
};
