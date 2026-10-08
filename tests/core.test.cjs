const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function memoryStorage() {
  const values = new Map();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: (key) => values.delete(key),
  };
}

function createContext() {
  const context = vm.createContext({
    window: {},
    localStorage: memoryStorage(),
    sessionStorage: memoryStorage(),
  });
  for (const file of ['data.js', 'utils.js', 'storage.js']) {
    vm.runInContext(fs.readFileSync(path.join(__dirname, '../assets/js', file), 'utf8'), context);
  }
  return context;
}

test('textos inseridos não são interpretados como marcação HTML', () => {
  const { utils } = createContext().window.TaskBoard;
  const value = '<img src=x onerror="alert(1)">';
  assert(!utils.esc(value).includes('<'));
  assert(utils.esc(value).includes('&lt;img'));
});

test('CSV neutraliza fórmulas e preserva aspas, separadores e quebras de linha', () => {
  const { utils } = createContext().window.TaskBoard;
  for (const value of ['=1+1', '+SUM(1,2)', '-1+2', '@SUM(1,2)', '  =1+1', '\t=1+1']) {
    assert(utils.toCSV([[value]]).startsWith('\ufeff"\''));
  }
  const csv = utils.toCSV([['a"b', 'um;dois', 'linha\nseguinte']]);
  assert.equal(csv, '\ufeff"a""b";"um;dois";"linha\nseguinte"');
});

test('dados inválidos não impedem recuperar a amostra e a sessão', () => {
  const context = createContext();
  const { seed, storage } = context.window.TaskBoard;
  context.localStorage.setItem('taskboard-prototype-v2', '{invalid');
  context.sessionStorage.setItem('taskboard-demo-session-v2', '{invalid');
  assert.equal(storage.load(seed).tickets.length, seed.tickets.length);
  assert.equal(storage.loadSession(), null);
  context.sessionStorage.setItem(
    'taskboard-demo-session-v2',
    '{"role":"Outro","email":"demo@example.test"}',
  );
  assert.equal(storage.loadSession(), null);
});

test('editar dados carregados não altera a base inicial', () => {
  const { seed, storage } = createContext().window.TaskBoard;
  const title = seed.tickets[0].title;
  const loaded = storage.load(seed);
  loaded.tickets[0].title = 'Alteração de teste';
  assert.equal(seed.tickets[0].title, title);
});

test('bloqueio do armazenamento mantém uma base utilizável e sinaliza falha ao salvar', () => {
  const context = createContext();
  const { seed, storage } = context.window.TaskBoard;
  context.localStorage.getItem = () => {
    throw new Error('Storage unavailable');
  };
  context.localStorage.setItem = () => {
    throw new Error('Storage unavailable');
  };
  assert.equal(storage.load(seed).tickets.length, seed.tickets.length);
  assert.equal(storage.save({ tickets: [] }), false);
});

test('contatos da amostra não usam e-mails, telefones ou documentos reais', () => {
  const { seed } = createContext().window.TaskBoard;
  assert(seed.users.every((user) => user.email.endsWith('.example')));
  assert(seed.companies.every((company) => company.cnpj === '00.000.000/0000-00'));
  assert(seed.companies.every((company) => company.phone === '(00) 0000-0000'));
});
