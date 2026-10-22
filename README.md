<div align="center">

# ✈️ AtmosBag

**Sua bagagem, em cada etapa do voo.**

Rastreio de bagagem em tempo real para passageiros e operação, com identidade visual Azul,
landing page pública, tema claro/escuro automático e deploy web na Vercel.

[![Expo](https://img.shields.io/badge/Expo-SDK%2057-000020?logo=expo&logoColor=white)](https://expo.dev)
[![React Native](https://img.shields.io/badge/React%20Native-0.86-61DAFB?logo=react&logoColor=white)](https://reactnative.dev)
[![Supabase](https://img.shields.io/badge/Supabase-Postgres%20%2B%20Realtime-3FCF8E?logo=supabase&logoColor=white)](https://supabase.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Vercel](https://img.shields.io/badge/Deploy-Vercel-000000?logo=vercel&logoColor=white)](https://vercel.com)

[Visão geral](#-visão-geral) · [Funcionalidades](#-funcionalidades) · [Como rodar](#-como-rodar) · [Supabase](#-supabase) · [Deploy](#-deploy-na-vercel)

</div>

---

## ✨ Visão geral

O **AtmosBag** acompanha a jornada da bagagem do check-in à esteira. O passageiro vincula a
etiqueta IATA de 10 dígitos, vê cada checkpoint registrado pela operação e recebe avisos quando
algo foge do previsto. A operação usa os mesmos dados para registrar leituras, monitorar conexões,
abrir RIB e cumprir os prazos ANAC.

O projeto é um app **Expo Router** com React Native Web, pensado primeiro para celular e com
layout responsivo para o navegador. A landing page pública fica em `/` e apresenta a seção
**“Como funciona?”** antes de levar para login ou cadastro.

### O que tem no app

| Rota | Área | Descrição |
| --- | --- | --- |
| `/` | Público | Landing page AtmosBag com “Como funciona?” e CTAs |
| `/login/login` | Público | Login de passageiros e equipe |
| `/login/cadastro` | Público | Cadastro de passageiro com confirmação de e-mail |
| `/cliente` | Passageiro | Minhas malas, linha do tempo, vínculo por tag e RIB |
| `/selecao-voo` | Handling | Escolha do voo antes da leitura |
| `/scanner` | Handling | Câmera + entrada manual, checkpoints e fila offline |
| `/handling` | Handling | Visão da operação de solo |
| `/cco` | CCO | Voos monitorados, status e atrasos |
| `/sac` | SAC | Atendimento e prazos ANAC |
| `/admin-dashboard` | Admin | Visão geral, alertas e conformidade IATA |
| `/admin` | Admin | Gestão de malas, locais e vínculo de dono |

---

## 🚀 Funcionalidades

### Para o passageiro

- Cadastro e login com e-mail e senha.
- Perfil de passageiro criado automaticamente no primeiro acesso.
- Vínculo da bagagem pela etiqueta IATA (10 dígitos).
- Linha do tempo com aceitação, carregamento, transferência, chegada e entrega.
- Alertas de conexão e mensagens amigáveis traduzidas pelo app.
- Abertura de RIB (Registro de Irregularidade de Bagagem) e acompanhamento do prazo ANAC.

### Para a operação

- Scanner com câmera e alternativa de digitação manual da etiqueta.
- Seleção de voo antes do registro do checkpoint.
- Fila offline com sincronização automática quando a internet volta.
- Validação de mala x voo e alertas de irregularidade.
- Painéis dedicados para **Handling**, **CCO** e **SAC**.
- Administração de malas, locais, donos e visão de conformidade IATA.

### Experiência

- Landing page pública com identidade visual AtmosBag/Azul.
- Cards arredondados, azul-marinho, azul-céu e tipografia moderna.
- Layout mobile-first e responsivo no web.
- Tema escuro automático conforme a preferência do dispositivo.
- Metadados web com título **AtmosBag | Azul** e `theme-color` **#002060**.

---

## 🧱 Stack

| Camada | Tecnologia |
| --- | --- |
| App | Expo SDK 57 + React Native 0.86 + React 19 |
| Rotas | Expo Router (file-based routing) |
| Web | React Native Web + export estático |
| Backend | Supabase (Auth, Postgres, Realtime) |
| Câmera | `expo-camera` |
| Offline | AsyncStorage + NetInfo |
| Linguagem | TypeScript 6 |
| Deploy | Vercel (`dist` + SPA fallback) |

---

## 📁 Estrutura

```text
.
├── src/
│   ├── app/                 # rotas (cada arquivo é uma tela)
│   │   ├── _layout.tsx      # tema, Stack, título e efeitos globais
│   │   ├── +html.tsx        # theme-color, metadados e fonte no web
│   │   ├── index.tsx        # landing page
│   │   ├── login/           # login e cadastro
│   │   ├── cliente.tsx
│   │   ├── scanner.tsx
│   │   ├── selecao-voo.tsx
│   │   ├── handling.tsx
│   │   ├── cco.tsx
│   │   ├── sac.tsx
│   │   ├── admin.tsx
│   │   └── admin-dashboard.tsx
│   ├── components/          # cabeçalho, cards, botões, marca, toast...
│   ├── constants/           # tema, IATA, áreas e locais
│   ├── hooks/               # tema, realtime, offline, usuário atual
│   ├── lib/                 # erros, checkpoints, ANAC, fila offline
│   ├── global.css           # fonte, scrollbar e fundo inicial
│   └── supabase.ts          # client do Supabase
├── supabase/
│   ├── migrations/          # 001 → 012
│   ├── scripts/             # seeds e padronização de IDs
│   └── functions/interline/ # função opcional de integração
├── assets/
├── app.json
├── vercel.json
└── README.md
```

---

## 🛠️ Como rodar

### Pré-requisitos

- **Node.js 22.13+**
- npm (o projeto usa `package-lock.json`)
- Conta e projeto no [Supabase](https://supabase.com)
- Para câmera no celular: development build ou Expo Go compatível com os módulos usados

### 1. Instale as dependências

```bash
npm install
```

### 2. Configure o ambiente

Crie um arquivo `.env` na raiz:

```env
EXPO_PUBLIC_SUPABASE_URL=https://SEU-PROJETO.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=sua-anon-key
```

> A `anon key` serve para o app em execução. Ela **não** executa migrations, DDL ou alterações
> administrativas no banco. Para isso, use o SQL Editor do Supabase ou uma conexão com service role.

### 3. Suba o app

```bash
npx expo start
```

Atalhos úteis:

```bash
npx expo start --web      # versão web em desenvolvimento
npx expo start --android
npx expo start --ios
```

Se adicionar uma biblioteca com código nativo, use sempre:

```bash
npx expo install <pacote>
```

---

## 🗄️ Supabase

### Migrations

Rode os arquivos de `supabase/migrations` **em ordem** no SQL Editor do projeto:

| Arquivo | Para que serve |
| --- | --- |
| `001_usuarios_perfis_cargo.sql` | Cria/ajusta perfis e cargos |
| `002_malas_checkpoints.sql` | Dono da mala, RLS e políticas base |
| `003_malas_insert_staff.sql` | Permite que a operação crie malas |
| `004_perfis_update_own.sql` | Usuário atualiza o próprio perfil |
| `005_obter_mensagem_cliente.sql` | RPC de mensagens amigáveis |
| `006_cliente_somente_propria_mala.sql` | Cliente vê apenas as próprias malas |
| `007_alertas_realtime.sql` | Publica alertas no Realtime |
| `008_cliente_vincular_mala.sql` | Vínculo da mala por etiqueta IATA |
| `009_tag_iata_check.sql` | Valida `tag_iata` com 10 dígitos |
| `010_obter_mensagem_cliente.sql` | RPC compatível com os dois schemas de mensagens |
| `011_autofill_checkpoint.sql` | Preenche `hora`, `id_funcionario` e `local` no scanner |
| `012_perfil_automatico.sql` | Cria perfil de cliente no primeiro cadastro |

> A migration `011` é necessária porque `historico_checkpoints.local` é `NOT NULL` no projeto
> atual. A `012` usa o metadata `cargo = 'cliente'` enviado pelo app; contas de staff criadas
> pelo Dashboard não são afetadas.

### Scripts de dados

- `supabase/scripts/seed_demo_iata.sql` — cria as malas de demonstração.
- `supabase/scripts/seed_teste_lacuna.sql` — cenário de teste de lacuna/checkpoint.
- `supabase/scripts/padronizar_ids_iata.sql` — move `DEMO-MALA-01..06` para
  `9900000001..9900000006` em uma transação, preservando histórico, trechos e alertas.

### Confirmação de e-mail

O projeto mantém a confirmação de e-mail **ligada** para usuários reais. Contas de teste com
e-mails falsos precisam ser confirmadas manualmente em **Authentication → Users** no Supabase.
Depois de confirmar, garanta que o perfil exista em `usuarios_perfis` com o `cargo` e a `area`
corretos.

### Contas de demonstração

| E-mail | Senha | Perfil esperado |
| --- | --- | --- |
| `cliente@gmail.com` | `123456` | `cargo = cliente` |
| `funcionario@gmail.com` | `123456` | `cargo = funcionario` |
| `admin@gmail.com` | `123456` | `cargo = admin` |
| `handling@gmail.com` | `123456` | `cargo = funcionario`, `area = handling` |
| `sac.teste@gmail.com` | `123456` | `area = sac` |
| `cco.teste@gmail.com` | `123456` | `area = cco` |

> Essas contas são apenas para demonstração. Em produção, remova ou desative os acessos de teste.

### Edge Function opcional

A função `supabase/functions/interline` pode ser publicada separadamente. Consulte
[`supabase/functions/interline/README.md`](supabase/functions/interline/README.md) para os
segredos e o deploy.

---

## ▲ Deploy na Vercel

O projeto já está preparado para o deploy estático:

```bash
npx expo export --platform web
```

O resultado fica em `dist/`. O arquivo `vercel.json` configura:

- build `npx expo export --platform web`;
- saída em `dist`;
- fallback de todas as rotas para `index.html`, para recarregar páginas internas sem 404;
- `framework: null` para a Vercel não sobrescrever o build.

Configuração esperada no painel da Vercel:

| Campo | Valor |
| --- | --- |
| Framework Preset | Other (ou `null` pelo `vercel.json`) |
| Build Command | `npx expo export --platform web` |
| Output Directory | `dist` |
| Variáveis | `EXPO_PUBLIC_SUPABASE_URL` e `EXPO_PUBLIC_SUPABASE_ANON_KEY` |

Para testar o build localmente com o mesmo fallback de rotas da Vercel:

```bash
npx serve dist --single
```

### Metadados web

O título global é definido pelo `Head` de `expo-router/head` em `src/app/_layout.tsx`:

- `<title>AtmosBag | Azul</title>`, aplicado a todas as rotas e ao HTML estático.

O arquivo `src/app/+html.tsx` complementa o documento com:

- `theme-color` `#002060`;
- descrição, Open Graph e Twitter Card;
- fonte **Manrope** no web (fallback para a fonte do sistema no nativo);
- fundo inicial claro/escuro antes da hidratação, evitando flash de tema.

O export estático gera apenas um `<title>`, sem a tag vazia que o React Helmet
insere quando nenhuma rota declara um título.

---

## 🎨 Identidade visual

| Token | Claro | Escuro |
| --- | --- | --- |
| Marca (`primary`) | `#002060` | `#002060` |
| Destaque (`accent`) | `#0077B6` | `#38BDF8` |
| Azul-céu (`sky`) | `#7DD3FC` | `#7DD3FC` |
| Fundo (`background`) | `#F2F7FC` | `#061426` |
| Cartão (`backgroundElement`) | `#FFFFFF` | `#0B2140` |
| Borda (`border`) | `#D7E7F5` | `#1A3A5C` |

O tema escuro é escolhido automaticamente por `useColorScheme` + `ThemeProvider` e a
configuração `userInterfaceStyle: "automatic"` no `app.json`. A landing page, o login, o
cadastro e todas as telas operacionais usam os mesmos tokens.

---

## ✅ Qualidade

Antes de abrir PR ou publicar:

```bash
npx tsc --noEmit
npx expo lint
npx expo export --platform web
```

Checklist manual recomendado:

- login de passageiro, staff e admin;
- vínculo de mala por tag IATA;
- scanner com câmera e digitação manual;
- fila offline (modo avião → online);
- toast de alerta em tempo real;
- abertura de RIB e prazos ANAC;
- recarregar rotas internas no deploy da Vercel;
- alternar a preferência de tema do dispositivo.

---

## 📄 Licença

Este projeto está sob a licença MIT. Consulte [`LICENSE`](LICENSE).

<div align="center">

Feito com 💙 para a **Azul** · **AtmosBag**

</div>
