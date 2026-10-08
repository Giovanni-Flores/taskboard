(() => {
  'use strict';

  const $ = (selector, root = document) => root.querySelector(selector);
  const app = $('#app');
  const modalRoot = $('#modal-root');
  const toastRoot = $('#toast-root');

  const { seed, storage, utils } = window.TaskBoard;
  const { clone, esc, slug, initials, roleClass, statusClass, prioClass, toCSV } = utils;
  let data = storage.load(seed);
  let session = storage.loadSession();
  const ui = {
    view: 'tickets',
    search: '',
    status: 'Todos',
    system: 'Todos',
    priority: 'Todas',
    page: 1,
    userSearch: '',
    userRole: 'Todos',
    managementTab: 'users',
  };
  const save = () => {
    if (!storage.save(data))
      toast('Não foi possível salvar no navegador. As alterações permanecem nesta sessão.');
  };
  const toast = (message, type = '') => {
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.textContent = message;
    toastRoot.append(el);
    setTimeout(() => el.remove(), 3200);
  };

  // Login e seleção de perfis de demonstração.
  function renderLogin() {
    app.innerHTML = /* HTML */ `<main class="login-page">
      <section class="login-card" aria-labelledby="login-title">
        <div class="login-brand">
          <div class="brand-mark" aria-hidden="true">
            <img src="assets/img/taskboard-icon.png" alt="" />
          </div>
          <h1 id="login-title">TaskBoard</h1>
          <p>Sistema de Suporte e Gestão de Chamados</p>
        </div>
        <form id="login-form">
          <div class="field">
            <div class="label-row">
              <label for="login-email">E-mail corporativo</label
              ><span class="muted">Obrigatório</span>
            </div>
            <div class="input-wrap">
              <span class="input-icon">✉</span
              ><input
                id="login-email"
                name="email"
                type="email"
                value="carlos.eduardo@taskboard.example"
                required
                autocomplete="username"
              />
            </div>
          </div>
          <div class="field">
            <div class="label-row">
              <label for="login-password">Senha de acesso</label
              ><button class="link-btn" type="button" data-action="forgot">
                Esqueceu a senha?
              </button>
            </div>
            <div class="input-wrap">
              <span class="input-icon">🔒</span
              ><input
                id="login-password"
                name="password"
                type="password"
                value="demo123"
                minlength="4"
                required
                autocomplete="current-password"
              /><button
                class="icon-button inside"
                data-action="toggle-password"
                type="button"
                title="Mostrar senha"
              >
                ◉
              </button>
            </div>
          </div>
          <button class="primary wide" type="submit">🔑 Entrar no sistema</button>
        </form>
        <div class="demo-box">
          <h2>Usuários para teste do protótipo</h2>
          ${demoUser('ADM', 'adm@taskboard.example', 'Acesso total')}${demoUser('Suporte', 'suporte@taskboard.example', 'Operacional')}${demoUser('Cliente', 'cliente@empresa.example', 'Seus chamados')}
        </div>
        <div class="login-foot">
          <span>TaskBoard v0.9 · Protótipo</span><span>● Dados locais fictícios</span>
        </div>
      </section>
    </main>`;
  }
  function demoUser(role, email, description) {
    return /* HTML */ `<button
      class="demo-user"
      type="button"
      data-action="persona"
      data-email="${email}"
    >
      <span class="role-pill ${roleClass(role)}">${role}</span><strong>${email}</strong
      ><small>${description}</small>
    </button>`;
  }

  // Estrutura da aplicação e navegação.
  function render() {
    if (!session) return renderLogin();
    const names = { ADM: 'Carlos Eduardo', Suporte: 'Mariana Lima', Cliente: 'João Silva' };
    session.name = names[session.role] || session.name;
    app.innerHTML = /* HTML */ `<header class="topbar">
        <div class="topline">
          <div class="brand">
            <div class="brand-icon"><img src="assets/img/taskboard-icon.png" alt="" /></div>
            <div>
              <div class="brand-title">TaskBoard</div>
              <div class="welcome">👋 Bem-vindo, ${esc(session.name)} (${esc(session.role)})</div>
            </div>
          </div>
          <label class="global-search"
            ><span class="input-icon">⌕</span
            ><input
              id="global-search"
              value="${esc(ui.search)}"
              placeholder="Buscar chamado, cliente ou empresa..."
              aria-label="Busca global"
          /></label>
          <div class="header-actions">
            <span class="role-pill ${roleClass(session.role)}">${esc(session.role)}</span
            ><button
              class="header-btn bell"
              data-action="notifications"
              title="Notificações"
              aria-label="Notificações"
            >
              🔔</button
            ><button class="header-btn" data-action="profile">
              <img class="profile-symbol" src="assets/img/profile-icon.png" alt="" />
              <span class="btn-label">Meu perfil</span></button
            ><button class="header-btn" data-action="logout">
              🚪 <span class="btn-label">Sair</span>
            </button>
          </div>
        </div>
        <div class="nav-wrap">
          <nav class="nav" aria-label="Navegação principal">
            ${navButton('tickets', 'Chamados / Tickets')}
            ${session.role !== 'Cliente' ? navButton('management', 'Usuários e Empresas') : ''}
            ${session.role !== 'Cliente' ? navButton('reports', 'Relatórios / Métricas') : ''}
          </nav>
        </div>
      </header>
      <main class="main">${viewContent()}</main>`;
  }
  const navButton = (view, label) =>
    /* HTML */ `<button data-view="${view}" class="${ui.view === view ? 'active' : ''}">
      ${label}
    </button>`;
  function viewContent() {
    if (ui.view === 'management') return renderManagement();
    if (ui.view === 'reports') return renderReports();
    return renderTickets();
  }

  // Chamados: filtragem, listagem e indicadores.
  function visibleTickets() {
    const scoped =
      session.role === 'Cliente'
        ? data.tickets.filter((t) => t.company === 'TechSolutions LTDA')
        : data.tickets;
    const q = slug(ui.search);
    return scoped.filter(
      (t) =>
        (!q ||
          [t.id, t.title, t.description, t.client, t.company, t.system].some((v) =>
            slug(v).includes(q),
          )) &&
        (ui.status === 'Todos' || t.status === ui.status) &&
        (ui.system === 'Todos' || t.system === ui.system) &&
        (ui.priority === 'Todas' || t.priority === ui.priority),
    );
  }
  function renderTickets() {
    const scoped =
      session.role === 'Cliente'
        ? data.tickets.filter((t) => t.company === 'TechSolutions LTDA')
        : data.tickets;
    const counts = (status) => scoped.filter((t) => t.status === status).length;
    const filtered = visibleTickets();
    const pageSize = 6;
    const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
    ui.page = Math.min(ui.page, pages);
    const shown = filtered.slice((ui.page - 1) * pageSize, ui.page * pageSize);
    const systems = [...new Set(scoped.map((t) => t.system))].sort();
    return /* HTML */ `<section class="page-head">
        <div>
          <div class="eyebrow">Modo de visualização · ${esc(session.role)}</div>
          <h1>Painel de Operações de Chamados</h1>
          <p>Acompanhe filas, prioridades e acordos de atendimento em tempo real.</p>
        </div>
        <div class="head-actions">
          ${['ADM', 'Suporte', 'Cliente'].map((r) => /* HTML */ `<button class="${session.role === r ? 'primary' : 'secondary'}" data-action="switch-role" data-role="${r}">${r}</button>`).join('')}
        </div>
      </section>
      <section class="stats">
        ${stat('Total registrado', scoped.length, 'Base operacional da amostra', '#2563eb', '#eff6ff')}
        ${stat('Abertos', counts('Aberto'), 'Aguardando triagem', '#059669', '#ecfdf5')}
        ${stat('Em andamento', counts('Em Andamento'), 'Com técnicos ativos', '#d97706', '#fffbeb')}
        ${stat('Aguardando retorno', counts('Aguardando Retorno'), 'Com cliente ou parceiro', '#7e22ce', '#faf5ff')}
        ${stat('Fechados', counts('Fechado'), 'SLA cumprido em 96,4%', '#475569', '#f1f5f9')}
      </section>
      <section class="panel toolbar">
        <div class="toolbar-left">
          ${session.role !== 'Suporte' || session.role === 'ADM' ? '<button class="primary" data-action="new-ticket">⊕ Novo chamado</button>' : '<button class="primary" data-action="new-ticket">⊕ Novo chamado</button>'}<button
            class="secondary"
            data-view="management"
            ${session.role === 'Cliente' ? 'disabled' : ''}
          >
            👥 Usuários e empresas
          </button>
        </div>
        <div class="toolbar-right">
          <label class="search-field"
            ><span class="input-icon">⌕</span
            ><input
              id="ticket-search"
              value="${esc(ui.search)}"
              placeholder="Buscar por ID, assunto, cliente..."
          /></label>
          <select id="filter-status" aria-label="Filtrar por status">
            <option>Todos</option>
            ${['Aberto', 'Em Andamento', 'Aguardando Retorno', 'Fechado'].map((v) => /* HTML */ `<option ${ui.status === v ? 'selected' : ''}>${v}</option>`).join('')}
          </select>
          <select id="filter-system" aria-label="Filtrar por sistema">
            <option>Todos</option>
            ${systems.map((v) => /* HTML */ `<option ${ui.system === v ? 'selected' : ''}>${esc(v)}</option>`).join('')}
          </select>
          <select id="filter-priority" aria-label="Filtrar por prioridade">
            <option>Todas</option>
            ${['Urgente', 'Alta', 'Média', 'Baixa'].map((v) => /* HTML */ `<option ${ui.priority === v ? 'selected' : ''}>${v}</option>`).join('')}
          </select>
          <button class="icon-button" data-action="export-tickets" title="Exportar CSV">⇩</button
          ><button class="icon-button" data-action="reset-data" title="Restaurar dados fictícios">
            ↻
          </button>
        </div>
      </section>
      <section class="panel table-panel">
        <div class="table-scroll">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Assunto</th>
                <th>Cliente</th>
                <th>Empresa</th>
                <th>Sistema</th>
                <th>Prioridade</th>
                <th>Status</th>
                <th>Data</th>
                <th aria-label="Ações"></th>
              </tr>
            </thead>
            <tbody>
              ${
                shown.length
                  ? shown.map(ticketRow).join('')
                  : /* HTML */ `<tr>
                      <td colspan="9">
                        <div class="empty">
                          <div style="font-size:2rem">⌕</div>
                          <strong>Nenhum chamado encontrado</strong>
                          <div>Ajuste os filtros para ampliar a busca.</div>
                        </div>
                      </td>
                    </tr>`
              }
            </tbody>
          </table>
        </div>
        <div class="table-footer">
          <span
            >Mostrando <strong>${shown.length}</strong> de
            <strong>${filtered.length}</strong> resultado(s)</span
          >
          <div class="pages">
            <button class="page-btn" data-page="${ui.page - 1}" ${ui.page === 1 ? 'disabled' : ''}>
              ‹</button
            >${Array.from({ length: pages }, (_, i) => /* HTML */ `<button class="page-btn ${ui.page === i + 1 ? 'active' : ''}" data-page="${i + 1}">${i + 1}</button>`).join('')}<button
              class="page-btn"
              data-page="${ui.page + 1}"
              ${ui.page === pages ? 'disabled' : ''}
            >
              ›
            </button>
          </div>
        </div>
      </section>
      <section class="insights">
        <article class="panel insight">
          <h3>◴ Conformidade de SLA hoje <span style="float:right;color:#059669">96,4%</span></h3>
          <p>Metas de atendimento para chamados críticos e urgentes dentro do tempo contratado.</p>
          <div class="mini-bars">
            <span style="height:42%"><small>08h</small></span
            ><span style="height:63%"><small>10h</small></span
            ><span style="height:76%"><small>12h</small></span
            ><span style="height:58%"><small>14h</small></span
            ><span style="height:83%"><small>Atual</small></span>
          </div>
        </article>
        <article class="panel insight">
          <h3>
            ♙ Plantão Nível 2 / N3
            <span class="badge status-open" style="float:right">4 online</span>
          </h3>
          <div class="agent-line">
            <span class="avatar">CE</span><strong>Carlos Eduardo</strong><span>6 ativos</span>
          </div>
          <div class="agent-line">
            <span class="avatar">AL</span><strong>Ana Luiza</strong><span>4 ativos</span>
          </div>
          <p style="margin-top:9px">Próxima rotação de turno às 18:00 BRT.</p>
        </article>
        <article class="panel insight">
          <h3>
            <img class="alert-symbol large" src="assets/img/alert-icon.png" alt="Alerta" />Escalação
            imediata
          </h3>
          <p>
            Chamados <strong style="color:#b91c1c">Urgentes</strong> acionam o time de plantão
            quando não iniciados em 10 minutos.
          </p>
          <button class="secondary" style="width:100%;margin-top:14px" data-action="audit">
            ↶ Ver histórico de auditoria
          </button>
        </article>
      </section>`;
  }
  const stat = (label, value, note, tone, wash) =>
    /* HTML */ `<article class="panel stat" style="--tone:${tone};--wash:${wash}">
      <div class="stat-label">${label}</div>
      <div class="stat-value mono">${value}</div>
      <div class="stat-note"><strong>●</strong> ${note}</div>
    </article>`;
  function ticketRow(t) {
    return /* HTML */ `<tr>
      <td>
        <span class="ticket-id"
          >${t.priority === 'Urgente' ? '<img class="alert-symbol" src="assets/img/alert-icon.png" alt="Alerta urgente">' : ''}${esc(t.id)}</span
        >
      </td>
      <td>
        <div class="ticket-title">${esc(t.title)}</div>
        <div class="ticket-sub">${esc(t.description)}</div>
      </td>
      <td>${esc(t.client)}</td>
      <td>${esc(t.company)}</td>
      <td><span class="badge system">${esc(t.system)}</span></td>
      <td>
        <span class="badge ${prioClass(t.priority)}"><i class="dot"></i>${esc(t.priority)}</span>
      </td>
      <td>
        <span class="badge ${statusClass(t.status)}"><i class="dot"></i>${esc(t.status)}</span>
      </td>
      <td class="mono">${esc(t.date)}</td>
      <td>
        <div class="row-actions">
          <button
            class="icon-button"
            data-action="notify-ticket"
            data-id="${t.id}"
            title="Notificar"
          >
            🔔</button
          ><button
            class="icon-button"
            data-action="ticket-detail"
            data-id="${t.id}"
            title="Ver detalhes"
          >
            ◉</button
          ><button class="icon-button" data-action="edit-ticket" data-id="${t.id}" title="Editar">
            ✎</button
          >${session.role === 'ADM' ? /* HTML */ `<button class="icon-button danger-hover" data-action="delete" data-kind="ticket" data-id="${t.id}" title="Excluir">⌫</button>` : ''}
        </div>
      </td>
    </tr>`;
  }

  // Administração: usuários e empresas.
  function renderManagement() {
    if (session.role === 'Cliente') {
      ui.view = 'tickets';
      return renderTickets();
    }
    const totalActive = data.tickets.filter((t) => t.status !== 'Fechado').length;
    const search = slug(ui.userSearch);
    const users = data.users.filter(
      (u) =>
        (!search || [u.name, u.email, u.company].some((v) => slug(v).includes(search))) &&
        (ui.userRole === 'Todos' || u.role === ui.userRole),
    );
    return /* HTML */ `<section class="page-head">
        <div>
          <div class="eyebrow">Administração</div>
          <h1>Gestão de Usuários e Empresas</h1>
          <p>Administre acessos, perfis, vínculos empresariais e contratos da demonstração.</p>
        </div>
      </section>
      <section class="summary-grid">
        ${summary('Total de usuários', data.users.length, '+12% neste mês', '👥')}${summary('Empresas ativas', data.companies.length, '1 em homologação', '▦')}${summary('Operadores de suporte', data.users.filter((u) => u.role === 'Suporte').length, '100% ativos hoje', '🎧')}${summary('Chamados vinculados', totalActive, 'Ativos na amostra', '🎟')}
      </section>
      <section class="panel panel-pad">
        <div class="page-head" style="margin-bottom:15px">
          <div>
            <h1 style="font-size:1.35rem">
              ${ui.managementTab === 'users' ? 'Usuários e perfis' : 'Empresas parceiras'}
            </h1>
            <p>
              ${ui.managementTab === 'users' ? 'Permissões ADM, Suporte e Cliente.' : 'Contratos, SLA e volume de tickets por organização.'}
            </p>
          </div>
          <div class="head-actions">
            <div class="tabs">
              <button
                class="tab ${ui.managementTab === 'users' ? 'active' : ''}"
                data-action="management-tab"
                data-tab="users"
              >
                Usuários</button
              ><button
                class="tab ${ui.managementTab === 'companies' ? 'active' : ''}"
                data-action="management-tab"
                data-tab="companies"
              >
                Empresas
              </button>
            </div>
            <button
              class="primary"
              data-action="${ui.managementTab === 'users' ? 'new-user' : 'new-company'}"
            >
              ＋ ${ui.managementTab === 'users' ? 'Novo usuário' : 'Nova empresa'}
            </button>
          </div>
        </div>
        ${
          ui.managementTab === 'users'
            ? /* HTML */ `<div class="toolbar-left" style="margin-bottom:14px">
                  <label class="search-field"
                    ><span class="input-icon">⌕</span
                    ><input
                      id="user-search"
                      value="${esc(ui.userSearch)}"
                      placeholder="Buscar por nome, e-mail ou empresa..." /></label
                  >${['Todos', 'ADM', 'Suporte', 'Cliente'].map((r) => /* HTML */ `<button class="${ui.userRole === r ? 'primary' : 'secondary'}" data-action="user-role" data-role="${r}">${r}</button>`).join('')}
                </div>
                ${usersTable(users)}`
            : companiesTable()
        }
      </section>`;
  }
  const summary = (label, value, note, icon) =>
    /* HTML */ `<article class="panel summary-card">
      <div>
        <div class="stat-label">${label}</div>
        <strong class="mono">${value}</strong><small class="muted">${note}</small>
      </div>
      <div class="summary-icon">${icon}</div>
    </article>`;
  function usersTable(users) {
    return /* HTML */ `<div
      class="table-panel"
      style="border:1px solid var(--line);border-radius:11px"
    >
      <div class="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Nome</th>
              <th>E-mail</th>
              <th>Empresa</th>
              <th>Perfil</th>
              <th>Cadastro</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            ${users
              .map(
                (u) =>
                  /* HTML */ `<tr>
                    <td>
                      <div class="name-cell">
                        <span class="avatar">${esc(u.initials)}</span>
                        <div><strong>${esc(u.name)}</strong><small>#${esc(u.id)}</small></div>
                      </div>
                    </td>
                    <td>${esc(u.email)}</td>
                    <td>${esc(u.company)}</td>
                    <td>
                      <span class="role-pill ${roleClass(u.role)}"
                        ><i class="dot"></i>${esc(u.role)}</span
                      >
                    </td>
                    <td>${esc(u.date)}</td>
                    <td>
                      <div class="row-actions">
                        <button
                          class="icon-button"
                          data-action="edit-user"
                          data-id="${u.id}"
                          title="Editar"
                        >
                          ✎</button
                        ><button
                          class="icon-button danger-hover"
                          data-action="delete"
                          data-kind="user"
                          data-id="${u.id}"
                          title="Excluir"
                        >
                          ⌫
                        </button>
                      </div>
                    </td>
                  </tr>`,
              )
              .join('')}
          </tbody>
        </table>
      </div>
    </div>`;
  }
  function companiesTable() {
    return /* HTML */ `<div
      class="table-panel"
      style="border:1px solid var(--line);border-radius:11px"
    >
      <div class="table-scroll">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Razão social / fantasia</th>
              <th>CNPJ</th>
              <th>Telefone</th>
              <th>Chamados ativos</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            ${data.companies
              .map((c) => {
                const active = data.tickets.filter(
                  (t) => t.company === c.name && t.status !== 'Fechado',
                ).length;
                return /* HTML */ `<tr>
                  <td>#${esc(c.id)}</td>
                  <td>
                    <div class="name-cell">
                      <span class="company-logo">▦</span>
                      <div>
                        <strong>${esc(c.name)}</strong
                        ><small>Plano ${esc(c.plan)} · SLA ${esc(c.sla)}</small>
                      </div>
                    </div>
                  </td>
                  <td>${esc(c.cnpj)}</td>
                  <td>${esc(c.phone)}</td>
                  <td>
                    <span class="badge ${active > 5 ? 'prio-urgent' : 'system'}"
                      >🎟 ${active} chamado(s)</span
                    >
                  </td>
                  <td>
                    <div class="row-actions">
                      <button
                        class="icon-button"
                        data-action="company-tickets"
                        data-name="${esc(c.name)}"
                        title="Ver chamados"
                      >
                        ◉</button
                      ><button
                        class="icon-button"
                        data-action="edit-company"
                        data-id="${c.id}"
                        title="Editar"
                      >
                        ✎</button
                      ><button
                        class="icon-button danger-hover"
                        data-action="delete"
                        data-kind="company"
                        data-id="${c.id}"
                        title="Excluir"
                      >
                        ⌫
                      </button>
                    </div>
                  </td>
                </tr>`;
              })
              .join('')}
          </tbody>
        </table>
      </div>
      <div class="table-footer">
        <span>Dados fictícios para demonstração comercial</span
        ><span
          >Sessão: ${esc(session.role)}_${esc(session.name).replace(/\s/g, '_').toUpperCase()}</span
        >
      </div>
    </div>`;
  }

  // Relatórios: valores calculados e métricas ilustrativas.
  function renderReports() {
    const total = data.tickets.length,
      resolved = data.tickets.filter((t) => t.status === 'Fechado').length,
      urgent = data.tickets.filter((t) => t.priority === 'Urgente').length;
    const categoryCounts = Object.entries(
      data.tickets.reduce((a, t) => ((a[t.category] = (a[t.category] || 0) + 1), a), {}),
    ).sort((a, b) => b[1] - a[1]);
    return /* HTML */ `<section class="page-head">
        <div>
          <div class="eyebrow">Inteligência operacional</div>
          <h1>Relatórios e Métricas</h1>
          <p>Indicadores fictícios de atendimento, incidentes, canais e causas recorrentes.</p>
        </div>
        <button class="primary" data-action="export-report">⇩ Exportar resumo</button>
      </section>
      <section class="panel report-controls">
        <div class="group">
          <strong>Período:</strong
          >${['7 dias', '30 dias', '90 dias'].map((v, i) => /* HTML */ `<button class="${i === 1 ? 'primary' : 'secondary'}" data-action="report-period">${v}</button>`).join('')}
        </div>
        <div class="group">
          <span class="badge status-open">● Atualizado agora</span
          ><button class="secondary" data-action="reset-data">↻ Restaurar amostra</button>
        </div>
      </section>
      <section class="stats">
        ${stat('Chamados no período', total, 'Volume consolidado', '#2563eb', '#eff6ff')}${stat('Taxa de resolução', (total ? Math.round((resolved / total) * 100) : 0) + '%', 'Dentro do período', '#059669', '#ecfdf5')}${stat('1ª resposta média', '18 min', 'Meta: 30 minutos', '#7e22ce', '#faf5ff')}${stat('SLA cumprido', '96,4%', 'Meta contratada: 95%', '#059669', '#ecfdf5')}${stat('Incidentes críticos', urgent, 'Exigem acompanhamento', '#dc2626', '#fef2f2')}
      </section>
      <section class="chart-grid">
        <article class="panel chart-card">
          <h2>Volume de atendimento</h2>
          <p class="chart-sub">Chamados recebidos e resolvidos nos últimos sete dias úteis</p>
          <div class="bar-chart">
            ${[
              ['Seg', 64, 52],
              ['Ter', 78, 69],
              ['Qua', 58, 54],
              ['Qui', 90, 76],
              ['Sex', 72, 68],
              ['Sáb', 38, 34],
              ['Dom', 29, 27],
            ]
              .map(
                ([d, a, b]) =>
                  /* HTML */ `<div class="bar-set">
                    <span class="bar" style="height:${a}%" title="${a} recebidos"></span
                    ><span class="bar resolved" style="height:${b}%" title="${b} resolvidos"></span
                    ><label>${d}</label>
                  </div>`,
              )
              .join('')}
          </div>
          <div class="legend">
            <span><i style="background:#2563eb"></i>Recebidos</span
            ><span><i style="background:#93c5fd"></i>Resolvidos</span>
          </div>
        </article>
        <article class="panel chart-card">
          <h2>Incidentes por canal</h2>
          <p class="chart-sub">Origem dos registros no período selecionado</p>
          <div class="donut-wrap">
            <div class="donut">
              <div class="donut-center">${total}<small>chamados</small></div>
            </div>
            <div class="chart-list">
              ${[
                ['#2563eb', 'Portal', '38%'],
                ['#7c3aed', 'E-mail', '24%'],
                ['#f59e0b', 'Telefone', '19%'],
                ['#10b981', 'Chat', '19%'],
              ]
                .map(
                  (x) =>
                    /* HTML */ `<div>
                      <i style="background:${x[0]}"></i><span>${x[1]}</span><strong>${x[2]}</strong>
                    </div>`,
                )
                .join('')}
            </div>
          </div>
        </article>
      </section>
      <section class="metrics-row">
        <article class="panel metric-card">
          <h3>Cumprimento de SLA por prioridade</h3>
          ${[
            ['Urgente', 92, '#dc2626'],
            ['Alta', 95, '#f59e0b'],
            ['Média', 98, '#2563eb'],
            ['Baixa', 100, '#059669'],
          ]
            .map(
              ([l, v, c]) =>
                /* HTML */ `<div class="progress-row">
                  <div class="progress-top"><span>${l}</span><strong>${v}%</strong></div>
                  <div class="progress"><span style="width:${v}%;background:${c}"></span></div>
                </div>`,
            )
            .join('')}
        </article>
        <article class="panel metric-card">
          <h3>Principais recorrências</h3>
          ${categoryCounts
            .slice(0, 4)
            .map(
              ([name, count], i) =>
                /* HTML */ `<div class="recurrence-item">
                  <div>
                    <strong>${i + 1}. ${esc(name)}</strong
                    ><small
                      >${count} ocorrências · ${Math.round((count / total) * 100)}% do total</small
                    >
                  </div>
                  <span class="trend">${i < 2 ? '↑ ' + (12 - i * 4) + '%' : '→ estável'}</span>
                </div>`,
            )
            .join('')}
        </article>
        <article class="panel metric-card">
          <h3>Saúde da operação</h3>
          ${[
            ['Satisfação do cliente', '4,8 / 5'],
            ['Tempo médio de solução', '3h 42min'],
            ['Reabertura de chamados', '4,2%'],
            ['Backlog acima de 24h', '3 chamados'],
          ]
            .map(
              ([l, v]) =>
                /* HTML */ `<div class="recurrence-item">
                  <span>${l}</span><strong>${v}</strong>
                </div>`,
            )
            .join('')}<button
            class="secondary"
            style="width:100%;margin-top:14px"
            data-action="audit"
          >
            Ver trilha de auditoria
          </button>
        </article>
      </section>`;
  }

  // Janelas de edição, detalhes e confirmações.
  function openModal(content, size = '') {
    modalRoot.innerHTML = /* HTML */ `<div class="modal-backdrop" data-backdrop="true">
      <section class="modal ${size}" role="dialog" aria-modal="true">${content}</section>
    </div>`;
    modalRoot.querySelectorAll('.field').forEach((field) => {
      const control = field.querySelector('input, select, textarea');
      const label = field.querySelector('label');
      if (control && label) {
        control.id ||= `${control.form?.id || 'modal'}-${control.name}`;
        label.htmlFor = control.id;
      }
    });
    const focusable = modalRoot.querySelector('input,select,textarea,button');
    if (focusable) setTimeout(() => focusable.focus(), 0);
  }
  const modalHead = (title, sub = '') =>
    /* HTML */ `<header class="modal-head">
      <div>
        <h2>${title}</h2>
        ${sub ? /* HTML */ `<p>${sub}</p>` : ''}
      </div>
      <button class="icon-button" data-action="close-modal" aria-label="Fechar">✕</button>
    </header>`;
  const options = (values, current) =>
    values
      .map((v) => /* HTML */ `<option ${v === current ? 'selected' : ''}>${esc(v)}</option>`)
      .join('');

  function ticketForm(ticket) {
    const isEdit = !!ticket;
    const companies = data.companies.map((c) => c.name);
    const assignees = data.users
      .filter((u) => u.role === 'Suporte' || u.role === 'ADM')
      .map((u) => u.name);
    openModal(
      /* HTML */ `${modalHead(isEdit ? 'Editar chamado' : 'Novo chamado', isEdit ? `Atualize o registro ${ticket.id}.` : 'Cadastre uma solicitação fictícia para a demonstração.')}
        <form id="ticket-form" data-id="${ticket?.id || ''}">
          <div class="modal-body">
            <div class="form-grid">
              <div class="field full">
                <label>Assunto</label
                ><input name="title" value="${esc(ticket?.title || '')}" required maxlength="120" />
              </div>
              <div class="field">
                <label>Solicitante</label
                ><input name="client" value="${esc(ticket?.client || session.name)}" required />
              </div>
              <div class="field">
                <label>Empresa</label
                ><select name="company" required>
                  ${options(companies, ticket?.company || companies[0])}
                </select>
              </div>
              <div class="field">
                <label>Sistema</label
                ><select name="system">
                  ${options(['Website', 'Mobile', 'E-commerce', 'ERP', 'Desktop', 'BI', 'Portal B2B', 'Fiscal'], ticket?.system || 'Website')}
                </select>
              </div>
              <div class="field">
                <label>Categoria</label
                ><select name="category">
                  ${options(['Acesso', 'Integração', 'Pagamento', 'Performance', 'Relatórios', 'Fiscal', 'Segurança', 'Logística'], ticket?.category || 'Acesso')}
                </select>
              </div>
              <div class="field">
                <label>Prioridade</label
                ><select name="priority">
                  ${options(['Baixa', 'Média', 'Alta', 'Urgente'], ticket?.priority || 'Média')}
                </select>
              </div>
              <div class="field">
                <label>Status</label
                ><select name="status">
                  ${options(['Aberto', 'Em Andamento', 'Aguardando Retorno', 'Fechado'], ticket?.status || 'Aberto')}
                </select>
              </div>
              <div class="field">
                <label>Responsável</label
                ><select name="assignee">
                  ${options(assignees, ticket?.assignee || 'Mariana Lima')}
                </select>
              </div>
              <div class="field">
                <label>Canal</label
                ><select name="channel">
                  ${options(['Portal', 'E-mail', 'Telefone', 'Chat'], ticket?.channel || 'Portal')}
                </select>
              </div>
              <div class="field full">
                <label>Descrição</label
                ><textarea name="description" required>${esc(ticket?.description || '')}</textarea>
              </div>
            </div>
          </div>
          <footer class="modal-actions">
            <button type="button" class="secondary" data-action="close-modal">Cancelar</button
            ><button type="submit" class="primary">
              ${isEdit ? 'Salvar alterações' : 'Criar chamado'}
            </button>
          </footer>
        </form>`,
    );
  }
  function ticketDetail(ticket) {
    const comments = data.comments[ticket.id] || [];
    openModal(
      /* HTML */ `${modalHead(/* HTML */ `Detalhes do chamado <span style="color:#2563eb">#${esc(ticket.id)}</span>`, `Aberto via ${esc(ticket.channel)} · Atualizado em ${esc(ticket.date)}`)}
        <div class="modal-body">
          <div class="detail-grid">
            ${detailBox('Solicitante', ticket.client, '👤')}${detailBox('Empresa', ticket.company, '▦')}${detailBox('Sistema', ticket.system, '◎')}${detailBox('Prioridade', /* HTML */ `<span class="badge ${prioClass(ticket.priority)}">${esc(ticket.priority)}</span>`, '☷', true)}${detailBox(
              'Status atual',
              /* HTML */ `<select
                id="detail-status"
                data-id="${ticket.id}"
                style="min-height:36px;padding:5px 8px"
              >
                ${options(['Aberto', 'Em Andamento', 'Aguardando Retorno', 'Fechado'], ticket.status)}
              </select>`,
              '↻',
              true,
            )}${detailBox('Suporte responsável', ticket.assignee, '🎧')}
          </div>
          <section class="detail-section">
            <h3>Descrição inicial do problema</h3>
            <div class="description-box">${esc(ticket.description)}</div>
          </section>
          <section class="detail-section">
            <h3>Histórico e comentários</h3>
            <div class="timeline">
              ${
                comments.length
                  ? comments
                      .map(
                        (c) =>
                          /* HTML */ `<article class="comment">
                            <div class="comment-head">
                              <strong
                                >${esc(c.author)}
                                <span class="role-pill ${roleClass(c.role)}"
                                  >${esc(c.role)}</span
                                ></strong
                              ><span class="muted">${esc(c.time)}</span>
                            </div>
                            <p>${esc(c.text)}</p>
                          </article>`,
                      )
                      .join('')
                  : '<div class="muted">Nenhum comentário registrado.</div>'
              }
            </div>
            <form id="comment-form" data-id="${ticket.id}" class="comment-form">
              <input name="comment" placeholder="Escreva um comentário..." required /><button
                class="primary"
                type="submit"
              >
                Enviar
              </button>
            </form>
          </section>
        </div>
        <footer class="modal-actions">
          <button class="secondary" data-action="edit-ticket" data-id="${ticket.id}">
            ✎ Editar chamado</button
          ><button class="primary" data-action="close-modal">Concluir</button>
        </footer>`,
      'large',
    );
  }
  const detailBox = (label, value, icon, allowHtml = false) =>
    /* HTML */ `<div class="detail-box">
      <span class="summary-icon" style="width:38px;height:38px;font-size:18px">${icon}</span>
      <div>
        <div class="label">${label}</div>
        <strong>${allowHtml ? value : esc(value)}</strong>
      </div>
    </div>`;

  function userForm(user) {
    const isEdit = !!user;
    openModal(
      /* HTML */ `${modalHead(isEdit ? 'Editar usuário' : 'Novo usuário', 'Cadastre dados fictícios para demonstrar perfis e permissões.')}
        <form id="user-form" data-id="${user?.id || ''}">
          <div class="modal-body">
            <div class="form-grid">
              <div class="field">
                <label>Nome completo</label
                ><input name="name" value="${esc(user?.name || '')}" required />
              </div>
              <div class="field">
                <label>E-mail</label
                ><input type="email" name="email" value="${esc(user?.email || '')}" required />
              </div>
              <div class="field">
                <label>Empresa</label
                ><select name="company">
                  ${options(['TaskBoard Corp', ...data.companies.map((c) => c.name)], user?.company || 'TaskBoard Corp')}
                </select>
              </div>
              <div class="field">
                <label>Perfil</label
                ><select name="role">
                  ${options(['ADM', 'Suporte', 'Cliente'], user?.role || 'Cliente')}
                </select>
              </div>
            </div>
          </div>
          <footer class="modal-actions">
            <button type="button" class="secondary" data-action="close-modal">Cancelar</button
            ><button class="primary" type="submit">Salvar usuário</button>
          </footer>
        </form>`,
    );
  }
  function companyForm(company) {
    const isEdit = !!company;
    openModal(
      /* HTML */ `${modalHead(isEdit ? 'Editar empresa' : 'Nova empresa', 'Configure contrato e SLA da empresa fictícia.')}
        <form id="company-form" data-id="${company?.id || ''}">
          <div class="modal-body">
            <div class="form-grid">
              <div class="field full">
                <label>Razão social / fantasia</label
                ><input name="name" value="${esc(company?.name || '')}" required />
              </div>
              <div class="field">
                <label>CNPJ</label
                ><input name="cnpj" value="${esc(company?.cnpj || '')}" required />
              </div>
              <div class="field">
                <label>Telefone</label
                ><input name="phone" value="${esc(company?.phone || '')}" required />
              </div>
              <div class="field">
                <label>Plano</label
                ><select name="plan">
                  ${options(['Pro', 'Enterprise', 'Crítico Corporativo'], company?.plan || 'Pro')}
                </select>
              </div>
              <div class="field">
                <label>SLA</label
                ><select name="sla">
                  ${options(['1h', '2h', '4h', '8h'], company?.sla || '4h')}
                </select>
              </div>
            </div>
          </div>
          <footer class="modal-actions">
            <button type="button" class="secondary" data-action="close-modal">Cancelar</button
            ><button class="primary" type="submit">Salvar empresa</button>
          </footer>
        </form>`,
    );
  }
  function confirmDelete(kind, id) {
    const labels = { ticket: 'chamado', user: 'usuário', company: 'empresa' };
    openModal(
      /* HTML */ `${modalHead(`Excluir ${labels[kind]}`, 'Esta ação altera somente os dados locais do protótipo.')}
        <div class="modal-body">
          <p>
            Confirma a exclusão deste ${labels[kind]}? Você poderá restaurar toda a base fictícia
            pelo botão ↻.
          </p>
        </div>
        <footer class="modal-actions">
          <button class="secondary" data-action="close-modal">Cancelar</button
          ><button class="danger" data-action="confirm-delete" data-kind="${kind}" data-id="${id}">
            Excluir
          </button>
        </footer>`,
    );
  }
  function profileModal() {
    openModal(
      /* HTML */ `${modalHead('Meu perfil', 'Sessão demonstrativa ativa.')}
        <div class="modal-body">
          <div class="name-cell">
            <span class="avatar" style="width:54px;height:54px"
              >${esc(initials(session.name))}</span
            >
            <div><strong>${esc(session.name)}</strong><small>${esc(session.email)}</small></div>
          </div>
          <div class="detail-grid" style="margin-top:18px">
            ${detailBox('Perfil', session.role, '🛡')}${detailBox('Último acesso', 'Hoje, 14:32', '◷')}${detailBox('Ambiente', 'Protótipo local', '⌂')}
          </div>
        </div>
        <footer class="modal-actions">
          <button class="primary" data-action="close-modal">Fechar</button>
        </footer>`,
    );
  }
  function notificationsModal() {
    openModal(
      /* HTML */ `${modalHead('Notificações', '3 atualizações recentes na amostra.')}
        <div class="modal-body">
          <div class="timeline">
            <article class="comment">
              <strong>SLA em atenção · SUP007</strong>
              <p>Chamado urgente está há 8 minutos sem nova interação.</p>
            </article>
            <article class="comment">
              <strong>Novo comentário · SUP003</strong>
              <p>O cliente confirmou que fará a validação em homologação.</p>
            </article>
            <article class="comment">
              <strong>Relatório disponível</strong>
              <p>O resumo operacional do período foi atualizado.</p>
            </article>
          </div>
        </div>
        <footer class="modal-actions">
          <button class="primary" data-action="close-modal">Marcar como lidas</button>
        </footer>`,
    );
  }
  function auditModal() {
    openModal(
      /* HTML */ `${modalHead('Histórico de auditoria', 'Eventos fictícios de segurança e operação.')}
        <div class="modal-body">
          <div class="timeline">
            ${[
              ['14:32', 'Carlos Eduardo alterou a prioridade do SUP001 para Urgente.'],
              ['13:47', 'Ana Luiza assumiu o chamado SUP002.'],
              ['11:42', 'Mariana Lima adicionou comentário ao SUP003.'],
              ['09:15', 'Rotina automática atualizou os indicadores de SLA.'],
            ]
              .map(
                (x) =>
                  /* HTML */ `<article class="comment">
                    <div class="comment-head">
                      <strong>${x[0]}</strong><span class="badge system">Registro íntegro</span>
                    </div>
                    <p>${x[1]}</p>
                  </article>`,
              )
              .join('')}
          </div>
        </div>
        <footer class="modal-actions">
          <button class="primary" data-action="close-modal">Fechar</button>
        </footer>`,
      'large',
    );
  }

  // Download dos dados de demonstração.
  function downloadCSV(filename, rows) {
    const csv = toCSV(rows);
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 500);
    toast('Arquivo CSV gerado.', 'success');
  }

  // Eventos da aplicação e das janelas de edição.
  app.addEventListener('submit', (event) => {
    event.preventDefault();
    if (event.target.id === 'login-form') {
      const f = new FormData(event.target);
      const email = f.get('email');
      const found = data.users.find((u) => u.email === email);
      const role = email.startsWith('adm@')
        ? 'ADM'
        : email.startsWith('suporte@')
          ? 'Suporte'
          : email.startsWith('cliente@')
            ? 'Cliente'
            : found?.role || 'ADM';
      session = { email, role, name: found?.name || 'Carlos Eduardo' };
      storage.saveSession(session);
      toast('Acesso liberado. Bem-vindo!', 'success');
      render();
    }
  });

  app.addEventListener('click', (event) => {
    const target = event.target.closest('[data-action],[data-view],[data-page]');
    if (!target) return;
    if (target.dataset.view) {
      if (target.disabled) return;
      ui.view = target.dataset.view;
      ui.page = 1;
      render();
      return;
    }
    if (target.dataset.page) {
      ui.page = Number(target.dataset.page);
      render();
      return;
    }
    const action = target.dataset.action;
    if (action === 'persona') {
      $('#login-email').value = target.dataset.email;
      $('#login-password').value = 'demo123';
      toast('Conta de demonstração selecionada.');
    }
    if (action === 'toggle-password') {
      const input = $('#login-password');
      input.type = input.type === 'password' ? 'text' : 'password';
    }
    if (action === 'forgot') toast('No protótipo, use qualquer senha com 4 ou mais caracteres.');
    if (action === 'logout') {
      session = null;
      storage.saveSession(null);
      render();
    }
    if (action === 'profile') profileModal();
    if (action === 'notifications') notificationsModal();
    if (action === 'switch-role') {
      session.role = target.dataset.role;
      session.email = {
        ADM: 'adm@taskboard.example',
        Suporte: 'suporte@taskboard.example',
        Cliente: 'cliente@empresa.example',
      }[session.role];
      storage.saveSession(session);
      ui.view = 'tickets';
      ui.search = '';
      render();
      toast(`Visualização alterada para ${session.role}.`);
    }
    if (action === 'new-ticket') ticketForm();
    if (action === 'ticket-detail')
      ticketDetail(data.tickets.find((t) => t.id === target.dataset.id));
    if (action === 'edit-ticket') ticketForm(data.tickets.find((t) => t.id === target.dataset.id));
    if (action === 'notify-ticket')
      toast(`Notificação simulada enviada para o responsável por ${target.dataset.id}.`, 'success');
    if (action === 'delete') confirmDelete(target.dataset.kind, target.dataset.id);
    if (action === 'export-tickets')
      downloadCSV('taskboard-chamados.csv', [
        ['ID', 'Assunto', 'Cliente', 'Empresa', 'Sistema', 'Prioridade', 'Status', 'Data'],
        ...visibleTickets().map((t) => [
          t.id,
          t.title,
          t.client,
          t.company,
          t.system,
          t.priority,
          t.status,
          t.date,
        ]),
      ]);
    if (action === 'reset-data') {
      data = clone(seed);
      save();
      ui.search = '';
      ui.status = 'Todos';
      ui.system = 'Todos';
      ui.priority = 'Todas';
      render();
      toast('Base fictícia restaurada.', 'success');
    }
    if (action === 'audit') auditModal();
    if (action === 'management-tab') {
      ui.managementTab = target.dataset.tab;
      render();
    }
    if (action === 'user-role') {
      ui.userRole = target.dataset.role;
      render();
    }
    if (action === 'new-user') userForm();
    if (action === 'edit-user') userForm(data.users.find((u) => u.id === target.dataset.id));
    if (action === 'new-company') companyForm();
    if (action === 'edit-company')
      companyForm(data.companies.find((c) => c.id === target.dataset.id));
    if (action === 'company-tickets') {
      ui.view = 'tickets';
      ui.search = target.dataset.name;
      ui.page = 1;
      render();
    }
    if (action === 'export-report')
      downloadCSV('taskboard-resumo-operacional.csv', [
        ['Indicador', 'Valor'],
        ['Total de chamados', data.tickets.length],
        ['Fechados', data.tickets.filter((t) => t.status === 'Fechado').length],
        ['Urgentes', data.tickets.filter((t) => t.priority === 'Urgente').length],
        ['SLA cumprido', '96,4%'],
        ['1ª resposta média', '18 minutos'],
      ]);
    if (action === 'report-period')
      toast(`Período ajustado para ${target.textContent.trim()} (simulação).`);
  });

  app.addEventListener('input', (event) => {
    if (event.target.id === 'ticket-search' || event.target.id === 'global-search') {
      ui.search = event.target.value;
      ui.page = 1;
      render();
      const input = $('#ticket-search') || $('#global-search');
      if (input) {
        input.focus();
        input.setSelectionRange(input.value.length, input.value.length);
      }
    }
    if (event.target.id === 'user-search') {
      ui.userSearch = event.target.value;
      render();
      const input = $('#user-search');
      if (input) {
        input.focus();
        input.setSelectionRange(input.value.length, input.value.length);
      }
    }
  });
  app.addEventListener('change', (event) => {
    if (event.target.id === 'filter-status') {
      ui.status = event.target.value;
      ui.page = 1;
      render();
    }
    if (event.target.id === 'filter-system') {
      ui.system = event.target.value;
      ui.page = 1;
      render();
    }
    if (event.target.id === 'filter-priority') {
      ui.priority = event.target.value;
      ui.page = 1;
      render();
    }
  });

  modalRoot.addEventListener('click', (event) => {
    if (event.target.matches('[data-backdrop]')) {
      modalRoot.innerHTML = '';
      return;
    }
    const target = event.target.closest('[data-action]');
    if (!target) return;
    const action = target.dataset.action;
    if (action === 'close-modal') {
      modalRoot.innerHTML = '';
      return;
    }
    if (action === 'edit-ticket') {
      modalRoot.innerHTML = '';
      ticketForm(data.tickets.find((t) => t.id === target.dataset.id));
    }
    if (action === 'confirm-delete') {
      const { kind, id } = target.dataset;
      if (kind === 'ticket') {
        data.tickets = data.tickets.filter((x) => x.id !== id);
        delete data.comments[id];
      }
      if (kind === 'user') data.users = data.users.filter((x) => x.id !== id);
      if (kind === 'company') data.companies = data.companies.filter((x) => x.id !== id);
      save();
      modalRoot.innerHTML = '';
      render();
      toast('Registro removido da demonstração.', 'success');
    }
  });
  modalRoot.addEventListener('change', (event) => {
    if (event.target.id === 'detail-status') {
      const t = data.tickets.find((x) => x.id === event.target.dataset.id);
      t.status = event.target.value;
      save();
      toast('Status atualizado.', 'success');
    }
  });
  modalRoot.addEventListener('submit', (event) => {
    event.preventDefault();
    const f = new FormData(event.target);
    const values = Object.fromEntries(f.entries());
    if (event.target.id === 'ticket-form') {
      const id = event.target.dataset.id;
      const existing = data.tickets.find((t) => t.id === id);
      if (existing) Object.assign(existing, values);
      else {
        const next = String(
          Math.max(...data.tickets.map((t) => Number(t.id.replace(/\D/g, ''))), 0) + 1,
        ).padStart(3, '0');
        data.tickets.unshift({
          id: `SUP${next}`,
          date: new Date()
            .toLocaleString('pt-BR', {
              day: '2-digit',
              month: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
            })
            .replace(',', ''),
          ...values,
        });
        ui.page = 1;
      }
      save();
      modalRoot.innerHTML = '';
      render();
      toast(existing ? 'Chamado atualizado.' : 'Chamado criado com sucesso.', 'success');
    }
    if (event.target.id === 'comment-form') {
      const id = event.target.dataset.id;
      data.comments[id] = data.comments[id] || [];
      data.comments[id].push({
        author: session.name,
        role: session.role,
        time: 'Agora',
        text: values.comment,
      });
      save();
      ticketDetail(data.tickets.find((t) => t.id === id));
      toast('Comentário adicionado.', 'success');
    }
    if (event.target.id === 'user-form') {
      const id = event.target.dataset.id;
      const existing = data.users.find((u) => u.id === id);
      const payload = { ...values, initials: initials(values.name) };
      if (existing) Object.assign(existing, payload);
      else
        data.users.push({
          id: `USR-${Math.max(1000, ...data.users.map((u) => Number(u.id.replace(/\D/g, '')) || 0)) + 1}`,
          date: new Date().toLocaleDateString('pt-BR'),
          ...payload,
        });
      save();
      modalRoot.innerHTML = '';
      render();
      toast('Usuário salvo.', 'success');
    }
    if (event.target.id === 'company-form') {
      const id = event.target.dataset.id;
      const existing = data.companies.find((c) => c.id === id);
      if (existing) {
        const old = existing.name;
        Object.assign(existing, values);
        data.tickets.forEach((t) => {
          if (t.company === old) t.company = values.name;
        });
        data.users.forEach((u) => {
          if (u.company === old) u.company = values.name;
        });
      } else
        data.companies.push({
          id: `EMP-${String(Math.max(0, ...data.companies.map((c) => Number(c.id.replace(/\D/g, '')) || 0)) + 1).padStart(2, '0')}`,
          ...values,
        });
      save();
      modalRoot.innerHTML = '';
      render();
      toast('Empresa salva.', 'success');
    }
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && modalRoot.innerHTML) modalRoot.innerHTML = '';
  });
  render();
})();
