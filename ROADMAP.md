# 🏗️ ROADMAP OFICIAL — LUMO PLATFORM
**MVP → Lançamento → Evolução da Plataforma**

**Versão:** Novembro de 2026  
**Projeto:** LUMO Studio Platform

**Objetivo:** Consolidar as pendências, acompanhar a estabilização do MVP, organizar o lançamento e planejar a evolução arquitetural da plataforma.

---

# 1. VISÃO GERAL

O LUMO é uma plataforma musical com foco em catálogo, descoberta e experiência imersiva de reprodução.

A evolução será dividida em sete fases:

1. **Consolidação da Base Visual** — CSS, temas e padrões.
2. **Estabilização e Preparação para Lançamento** — correções críticas, navegação e conteúdo.
3. **Melhorias Funcionais** — refinamentos de experiência.
4. **Arquitetura de Reprodução** — Playlist contextual (EP-02).
5. **Modularização de Dados** — catálogo JSON (EP-03).
6. **Experiência Mobile** — redesenho dedicado.
7. **Lançamento** — Deploy e validação de produção.

---

# 2. FASE 1 — CONSOLIDAÇÃO DA BASE VISUAL

## Etapa 1A — Consolidação dos CSS

- [ ] Revisar `global.css`
- [ ] Revisar `mobile.css`
- [ ] Revisar os CSS compartilhados
- [ ] Revisar os CSS específicos das páginas
- [ ] Consolidar breakpoints e padrões
- [ ] Documentar regras no `AGENTS.md`
- [ ] Finalizar **M-09** e **M-11**

## Etapa 1B — Sistema de Temas (EP-01)

- [ ] Criar `themes.css` com variáveis CSS
- [ ] Implementar Dark Mode como tema padrão e prioridade
- [ ] Implementar Light Mode (`.theme-light`)
- [ ] Preparar arquitetura para temas futuros
- [ ] Persistência de preferência no `localStorage`
- [ ] Detecção de `prefers-color-scheme`
- [ ] Botão de alternância no Header
- [ ] Prevenção de flash durante carregamento (script inline no `<head>`)

**Prioridade de produto:** Dark Mode é a identidade visual principal do LUMO. O Light Mode é uma evolução planejada e pode ser adiado para depois do MVP, caso necessário, sem comprometer a arquitetura do sistema de temas.

## Etapa 1C — Validação Visual

- [ ] Revisar todas as páginas em Dark Mode
- [ ] Revisar todas as páginas em Light Mode, caso implementado
- [ ] Corrigir inconsistências
- [ ] Verificar Player, navegação, listagens e páginas de detalhes

## Pendências relacionadas

### M-09 — Padrões Desktop/Mobile
Consolidar breakpoints, comportamento responsivo e documentar as regras.

### M-11 — Estrutura CSS Mobile
Organizar e padronizar a estrutura mobile, evitando duplicações e conflitos.

### M-12 — Fundos das páginas de listagem
- [x] Labels
- [x] Artists
- [x] Albums
- [x] Tracks
- [x] Videos
- [ ] Genres — pendente da criação da página M-13

**Nota:** A validação na Fase 1 contempla as cinco listagens existentes. O fundo de Genres será implementado e validado após a criação da página na Fase 2.

---

# 3. FASE 2 — ESTABILIZAÇÃO E PREPARAÇÃO PARA LANÇAMENTO

## Prioridade crítica

- [ ] **A-01** — Player ao voltar no celular
- [ ] **A-02** — Página de faixa cortada no celular
- [ ] **A-08** — Sincronização do estado/ícone do Player

## Navegação e conteúdo

- [ ] **A-03** — Links clicáveis globais
- [ ] **A-05** — Detecção de idioma e redirecionamento
- [ ] **A-06** — Traduções completas (EN/PT)
- [ ] **A-07** — Media Session API
- [ ] **M-07** — Página About
- [ ] **M-08** — Limitação e apresentação das descrições
- [ ] **M-10** — Definição e implementação da regra de gêneros entre faixas
- [ ] **M-13** — Página de Gêneros

### M-13 — Página de Gêneros

Criar uma página de navegação para explorar os gêneros musicais e seus conteúdos relacionados.

Escopo inicial:
- Listar gêneros disponíveis
- Permitir navegação para conteúdos associados
- Manter consistência com o sistema visual das demais listagens
- Preparar estrutura para futura integração com `/explorar`

Após a criação da página:
- [ ] Implementar fundo contextual
- [ ] Validar responsividade
- [ ] Validar integração com navegação e catálogo

## Testes e validação

- [x] **CT-05** — Validação do Pipeline de Ingestão (concluído; referência técnica)
- [ ] Testes gerais de lançamento
- [ ] Validar navegação entre páginas
- [ ] Validar reprodução e continuidade do Player
- [ ] Validar comportamento mobile
- [ ] Validar links internos e externos
- [ ] Validar conteúdo e imagens

---

# 4. FASE 3 — MELHORIAS FUNCIONAIS

- [ ] **M-01** — Botão de voltar mais discreto e alinhado ao container
- [ ] **M-02** — Ordenamento alfabético em Albums, Tracks e Videos
- [ ] **M-05** — Controle de volume com porcentagem exata e transição suave
- [ ] **M-06** — Imagem individual por faixa no Player e listagens
- [ ] **B-01** — Fullscreen para Player/Vídeo
- [ ] **B-02** — Navegação interna do Player

---

# 5. FASE 4 — EVOLUÇÃO DA ARQUITETURA DE REPRODUÇÃO

## EP-02 — Playlist Contextual

### Planejamento
- [ ] Definir modelo de Playlist
- [ ] Definir contexto de reprodução
- [ ] Definir estado do Player
- [ ] Definir contrato do evento `playPlaylist`

### Implementação
- [ ] Refatorar `GlobalPlayer.astro`
- [ ] Migrar páginas gradualmente para o novo sistema
- [ ] Validar reprodução de álbum
- [ ] Validar reprodução de artista
- [ ] Validar reprodução de faixa
- [ ] Validar navegação e continuidade
- [ ] Implementar **M-03** — Tocar Tudo em Tracks
- [ ] Implementar **M-04** — Play Discografia de Artista
- [ ] Estabilizar a arquitetura

**Diretriz:** EP-02 não deve ser executado simultaneamente com EP-03. A arquitetura de reprodução deve ser implementada, validada e estabilizada antes da modularização dos dados.

---

# 6. FASE 5 — MODULARIZAÇÃO DE DADOS

## EP-03 — Catálogo Modular

### Planejamento
- [ ] Revisar estrutura atual do catálogo
- [ ] Definir modelos modulares:
  - `labels.json`
  - `artistas.json`
  - `albums.json`
  - `tracks.json`
- [ ] Definir relações entre entidades
- [ ] Definir regras de integridade
- [ ] Planejar compatibilidade com as páginas existentes

### Implementação
- [ ] Refatorar geração de dados (`ingest.js`)
- [ ] Separar os JSON
- [ ] Adaptar imports e consumo de dados
- [ ] Validar todas as páginas
- [ ] Comparar resultados com a estrutura anterior
- [ ] Validar relações e consistência do catálogo
- [ ] Validar build

**Pré-requisito:** EP-02 completamente implementado, validado e estabilizado.

**Diretriz:** A modularização deve preservar as regras atuais do catálogo e não pode comprometer a experiência de reprodução.

---

# 7. FASE 6 — EXPERIÊNCIA MOBILE

## A-09 — Redesenho da Experiência Mobile

- [ ] Planejar navegação mobile
- [ ] Redesenhar estrutura de navegação
- [ ] Adaptar listagens
- [ ] Adaptar páginas de detalhes
- [ ] Integrar Player à experiência mobile
- [ ] Revisar interações de toque
- [ ] Revisar espaçamentos e hierarquia visual
- [ ] Validar diferentes tamanhos de tela

**Pré-requisito recomendado:** CSS consolidado e sistema de temas definido (Fase 1).

**Observação:** Correções críticas de mobile, como A-01 e A-02, não devem aguardar esta fase.

---

# 8. FASE 7 — LANÇAMENTO

## E-01 — Deploy na Netlify

### Preparação
- [ ] Build final
- [ ] Testes de páginas
- [ ] Teste de Player
- [ ] Teste mobile
- [ ] Teste de links
- [ ] Verificação de assets
- [ ] Verificação de domínio
- [ ] Verificação de canonical
- [ ] Verificação de SEO
- [ ] Verificação de Open Graph

### Deploy
- [ ] Deploy
- [ ] Teste de produção
- [ ] Validação final

**Dependência externa:** Renovação dos créditos da Netlify prevista para 11/12/2026.

---

# 9. CORREÇÕES TÉCNICAS JÁ REALIZADAS

## CT-01 — Domínio oficial
**Status:** Concluído

## CT-02 — Refatoração dos CSS das páginas de detalhes
**Status:** Concluído

## CT-03 — Refatoração dos CSS das listagens
**Status:** Concluído

## CT-04 — Fundo das páginas de listagem
**Status:** Parcialmente concluído

Fundos implementados em Labels, Artists, Albums, Tracks e Videos. Genres permanece pendente até M-13.

## CT-05 — Validação do Pipeline de Ingestão
**Status:** Concluído

O pipeline de ingestão foi validado e sua robustez foi trabalhada. O estado atual do catálogo é a referência para futuras alterações arquiteturais.

A modularização do pipeline e dos arquivos de dados permanece como projeto independente (EP-03).

---

# 10. REGRAS DE DESENVOLVIMENTO

1. Trabalhar um arquivo por vez durante revisões e refatorações.
2. Não implementar alterações sem autorização.
3. Preservar comportamentos existentes, salvo quando uma mudança for aprovada.
4. Não misturar refatorações arquiteturais com correções de bugs sem necessidade.
5. Validar alterações antes de marcar tarefas como concluídas.
6. Não declarar testes executados sem execução real.
7. Manter decisões de negócio documentadas.
8. Centralizar estilos compartilhados e evitar duplicações.
9. Não criar novos arquivos sem necessidade justificada.
10. Preservar o funcionamento do Player durante a navegação.
11. Avisar antecipadamente sobre ferramentas, serviços ou operações que possam consumir cotas ou créditos.
12. Manter o usuário responsável pela aprovação e aplicação das alterações.

---

# 11. DEPENDÊNCIAS ENTRE PROJETOS

## Base Visual

CSS consolidado (M-09 + M-11)  
↓  
EP-01 — Sistema de Temas  
↓  
A-09 — Redesenho Mobile

## Arquitetura de Dados e Reprodução

Pipeline atual validado (CT-05)  
↓  
EP-02 — Playlist Contextual  
↓  
Validação e estabilização do Player  
↓  
EP-03 — Modularização do Catálogo

## Página de Gêneros

Listagens existentes com fundos (M-12 parcial)  
↓  
M-13 — Criação da página Genres  
↓  
Implementação do fundo contextual de Genres  
↓  
M-12 concluído

---

# 12. DIREÇÃO ESTRATÉGICA

**Estabilidade antes de expansão:** funcionalidades novas não devem comprometer a experiência principal.

**Arquitetura antes de complexidade:** recursos que dependem de estruturas maiores devem possuir planejamento técnico antes da implementação.

**Consistência antes de quantidade:** o catálogo e a experiência visual devem permanecer coerentes à medida que a plataforma cresce.

**Evolução gradual:** grandes mudanças arquiteturais devem ser isoladas, implementadas por etapas e validadas antes de iniciar projetos dependentes.

O objetivo final é transformar o LUMO de um MVP funcional em uma plataforma musical modular, escalável, visualmente consistente e preparada para novos recursos, mantendo sua identidade e experiência imersiva.
