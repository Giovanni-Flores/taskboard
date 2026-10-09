# TaskBoard

Protótipo interativo de gestão de chamados, criado para explorar fluxos de suporte, prioridades e organização operacional. Desenvolvido com HTML, CSS e JavaScript, sem frameworks ou dependências externas.

[Contexto e estudo de caso no portfólio](https://giovanniflores.com.br/projects/sistema-chamados.html)

## Executar

Abra `index.html` no navegador. Não é necessário instalar dependências ou executar uma etapa de build.

Selecione uma conta de demonstração e use `demo123` como senha. Qualquer senha com quatro ou mais caracteres é aceita.

| Perfil  | E-mail de demonstração      |
| ------- | --------------------------- |
| ADM     | `adm@taskboard.example`     |
| Suporte | `suporte@taskboard.example` |
| Cliente | `cliente@empresa.example`   |

Os botões de perfil permitem alternar as visualizações durante a demonstração.

## Funcionalidades

- Busca, filtros por status, sistema e prioridade, e paginação.
- Criação, edição e exclusão de chamados; alteração de status e comentários.
- Cadastro e edição de usuários e empresas de demonstração.
- Painel de relatórios, recorrências e indicadores de exemplo.
- Exportação de chamados filtrados e resumo em CSV.
- Persistência local e restauração da amostra pelo botão ↻.
- Interface adaptada a desktop, tablet e celular.

## Escopo da demonstração

O login e os perfis simulam a experiência de uso; não são autenticação nem autorização reais. Não há servidor, banco de dados, envio de e-mails ou integração com serviços de suporte. Notificações, auditoria, plantão, períodos dos relatórios e parte das métricas são simulações com valores de exemplo, não resultados de uma operação real.

Os registros são armazenados no `localStorage` do navegador e a sessão no `sessionStorage`. Não cadastre dados reais ou credenciais. A base inicial usa nomes de amostra, endereços de e-mail no domínio reservado `.example` e contatos sem validade.

O comportamento do armazenamento em páginas abertas por `file://` pode variar entre navegadores. Caso haja restrição ao armazenamento local, sirva a pasta com um servidor estático local de sua preferência.

## Estrutura

```text
taskboard/
├── index.html
├── README.md
├── .gitignore
├── assets/
│   ├── css/app.css
│   ├── js/
│   │   ├── data.js
│   │   ├── utils.js
│   │   ├── storage.js
│   │   └── app.js
│   └── img/
├── docs/arquitetura.md
└── tests/core.test.cjs
```

## Organização do código

| Arquivo                | Responsabilidade                                             |
| ---------------------- | ------------------------------------------------------------ |
| `assets/js/data.js`    | Base inicial de demonstração                                 |
| `assets/js/utils.js`   | Escape de textos, identificadores visuais e serialização CSV |
| `assets/js/storage.js` | Leitura e gravação dos dados e da sessão                     |
| `assets/js/app.js`     | Renderização das telas, navegação, formulários e eventos     |
| `assets/css/app.css`   | Estilos por componente e regras responsivas                  |

Os scripts usam um único namespace, `window.TaskBoard`, e carregam com `defer` na ordem declarada no HTML. Essa organização mantém a abertura direta do arquivo sem exigir um bundler. A configuração do editor e a formatação ficam em `.editorconfig` e `.prettierrc.json`.

## Verificação

Os testes de regressão não exigem pacotes externos. Com Node.js 22 ou superior, execute na pasta do projeto:

```sh
node --test --test-isolation=none tests/core.test.cjs
```

Eles verificam o escape de textos, a exportação CSV e a recuperação dos dados locais. Para detalhes da estrutura, consulte [a arquitetura](docs/arquitetura.md).

## Demonstração da Tela Principal

<img width="1613" height="1029" alt="DemonstracaoTaskBoard" src="https://github.com/user-attachments/assets/d8d0cffb-b34a-4234-80fb-23feab5c9ef8" />


## Protótipo Navegável

[página navegável deste projeto](https://giovanni-flores.github.io/taskboard/)

## Autor

[Giovanni Flores](https://github.com/Giovanni-Flores) · [Portfólio](https://giovanniflores.com.br/)
