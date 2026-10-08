// Funções compartilhadas de texto, apresentação e exportação.
(() => {
  'use strict';
  const clone = (value) => JSON.parse(JSON.stringify(value));
  const esc = (value) =>
    String(value ?? '').replace(
      /[&<>'"]/g,
      (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[char],
    );
  const slug = (value) =>
    String(value)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
  const initials = (name) =>
    name
      .split(/\s+/)
      .slice(0, 2)
      .map((p) => p[0])
      .join('')
      .toUpperCase();
  const roleClass = (role) => `role-${slug(role)}`;
  const statusClass = (status) =>
    ({
      Aberto: 'status-open',
      'Em Andamento': 'status-progress',
      'Aguardando Retorno': 'status-wait',
      Fechado: 'status-closed',
    })[status] || 'status-closed';
  const prioClass = (priority) =>
    ({ Urgente: 'prio-urgent', Alta: 'prio-high', Média: 'prio-medium', Baixa: 'prio-low' })[
      priority
    ] || 'prio-low';

  const csvCell = (value) => {
    const text = String(value ?? '');
    const safe = /^[\s]*[=+@-]|^[\t\r\n]/.test(text) ? "'" + text : text;
    return '"' + safe.replace(/"/g, '""') + '"';
  };
  const toCSV = (rows) => '\ufeff' + rows.map((row) => row.map(csvCell).join(';')).join('\r\n');
  window.TaskBoard.utils = { clone, esc, slug, initials, roleClass, statusClass, prioClass, toCSV };
})();
