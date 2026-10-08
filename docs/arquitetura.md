# Organização do TaskBoard

## Fluxo

O HTML declara os scripts com `defer`, nesta ordem: `data.js`, `utils.js`, `storage.js` e `app.js`. Todos compartilham somente o namespace `window.TaskBoard`. Não há compilação, módulos que exijam servidor ou bibliotecas externas.

1. `data.js` define a amostra inicial de chamados, usuários, empresas e comentários.
2. `utils.js` oferece funções de apresentação de textos, classes visuais e exportação CSV.
3. `storage.js` recupera dados locais e a sessão demonstrativa, com fallback quando o armazenamento falha.
4. `app.js` mantém o estado da interface e coordena telas, formulários e eventos.

## Estado

- `data`: registros da demonstração. Uma cópia da base inicial evita modificar a amostra ao editar os registros.
- `session`: perfil de demonstração selecionado. Não contém autenticação real.
- `ui`: visualização, filtros, pesquisa e paginação. É mantido em memória.

O armazenamento usa `taskboard-prototype-v2` e `taskboard-demo-session-v2`. As novas chaves separam a amostra revisada dos dados de versões anteriores, sem apagar dados do protótipo original.

## Organização da interface

O arquivo `app.js` está dividido em seções comentadas: login, estrutura da aplicação, chamados, administração, relatórios, janelas de edição, exportação e eventos. Os templates HTML têm indentação própria para facilitar a leitura. O CSS organiza estilos de base, componentes e adaptações responsivas.

## Manutenção

Para alterar a amostra, edite `data.js`. Para mudar a persistência, edite `storage.js`. Novas regras de texto e CSV ficam em `utils.js`. Uma mudança de tela começa na função de renderização correspondente em `app.js`; ações de botões e formulários ficam no bloco de eventos.

Os testes em `tests/core.test.cjs` verificam proteção de textos e CSV, contatos da amostra e recuperação do armazenamento. Não substituem a verificação visual em um navegador.

## Evolução para uma aplicação real

Uma versão de produção exigiria autenticação e autorização no servidor, validação de entradas, persistência centralizada e integrações reais. A simulação de perfis e métricas desta entrega serve para apresentar e validar fluxos.
