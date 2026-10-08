// Persistência da amostra e da sessão; não representa autenticação.
(() => {
  'use strict';
  const DATA_KEY = 'taskboard-prototype-v2';
  const SESSION_KEY = 'taskboard-demo-session-v2';
  function load(seed) {
    const fallback = JSON.parse(JSON.stringify(seed));
    try {
      return { ...fallback, ...JSON.parse(localStorage.getItem(DATA_KEY) || '{}') };
    } catch {
      return fallback;
    }
  }
  function save(data) {
    try {
      localStorage.setItem(DATA_KEY, JSON.stringify(data));
      return true;
    } catch {
      return false;
    }
  }
  function loadSession() {
    try {
      const session = JSON.parse(sessionStorage.getItem(SESSION_KEY) || 'null');
      return session &&
        ['ADM', 'Suporte', 'Cliente'].includes(session.role) &&
        typeof session.email === 'string'
        ? session
        : null;
    } catch {
      return null;
    }
  }
  function saveSession(session) {
    try {
      if (session) sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
      else sessionStorage.removeItem(SESSION_KEY);
    } catch {
      /* A sessão atual continua em memória quando o armazenamento está indisponível. */
    }
  }
  window.TaskBoard.storage = { load, save, loadSession, saveSession };
})();
