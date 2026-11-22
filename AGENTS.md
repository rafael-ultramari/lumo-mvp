# AGENTS.md — LUMO Studio Platform (MVP)

## 1. Visão Geral
- **Projeto:** LUMO Studio Platform (Ecossistema que abriga os selos UL7R4, Loop 77 e futuramente LUMO Roots).
- **Stack:** Astro (SSG), HTML/CSS/JS.
- **Ferramenta de desenvolvimento:** OpenCode.
- **Idiomas:** i18n nativo (Inglês padrão na raiz `/`, Português com prefixo `/pt/`). Estrutura preparada para N idiomas.
- **Infraestrutura:**
  - Site: Netlify (deploy estático).
  - Storage: Cloudflare R2 (MP3 e imagens).

## 2. Escopo Fechado da v1 (MVP)
**NÃO IMPLEMENTAR:**
- Autenticação, login, contas de usuário.
- Curtidas, favoritos, playlists criadas/gerenciadas por usuários.
- Qualquer feature que dependa de sessão de usuário.
- Não adicionar botões, ícones ou textos que sugiram essas features.

Se uma tarefa parecer exigir isso, **pare e pergunte** antes de codar.

> A playlist contextual interna do Player (EP-02) é arquitetura de reprodução, não recurso de playlist pessoal do usuário; ainda assim, deve ser planejada e aprovada antes de implementação.

## 3. Arquitetura de Dados e Metadados (Padrão V4)
Os metadados chegam em arquivos de texto estruturado (Padrão V4) na pasta `/lumo-materials/metadata/`.
O script de ingestão converte esses arquivos V4 para o JSON do catálogo (`catalogo.json` na estrutura atual).

**Hierarquia:** Universo (Label) → Artista → Álbum → Faixa.

### Regras de Gênero (Herança)
- Gêneros e subgêneros são preenchidos apenas na Faixa (Track), nos campos `Genres (macro)` e `Subgenres (micro)`.
- O Álbum herda a união de gêneros/subgêneros das suas faixas (sem duplicatas, mantendo ordem de prioridade).
- O Artista herda a união dos gêneros/subgêneros dos seus álbuns.
- A lógica de agrupamento deve ser feita no build, não no input.
- Os campos `genero` e `subgenero` são arrays de strings, nunca strings únicas.

### Imagens de Tracks
- O padrão de nomenclatura das imagens individuais de faixas no Cloudflare R2 é `track_{artista}_{slug}.jpg`.
- Quando uma imagem individual da faixa estiver disponível, ela deve ser utilizada.
- Na ausência de imagem individual, utilizar a capa do álbum como fallback.
- Preservar o padrão de URLs e a lógica de fallback ao alterar o `ingest.js` ou os componentes que consomem os dados.

### Slugs
- O slug é imutável após a publicação. Nunca altere o slug de um artista, álbum ou faixa já publicado.
- Slugs podem se repetir em níveis diferentes; a hierarquia de rotas do Astro resolve isso naturalmente.

## 4. Regra de Renderização Condicional
A regra oficial é **"Álbum Completo ou Nada"**.
- Um álbum só é gerado no build público se todas as suas faixas estiverem com `Release Status: Released`.
- Um artista só aparece no build público se tiver pelo menos um álbum visível.
- Não existirão faixas Unreleased dentro de um álbum visível (sem cadeados ou "em breve").
- Em ambiente de desenvolvimento (`astro dev`) ou preview interno, todo o catálogo é exibido.

## 5. i18n (Internacionalização)
- O JSON do catálogo terá textos aninhados por idioma: `"descricao": { "en": "...", "pt": "..." }`.
- O idioma padrão (inglês) fica na raiz da URL.
- O português fica sob o prefixo `/pt/`.
- A detecção de idioma do navegador deve ser implementada no cliente (se `navigator.language` for pt-BR, redirecionar para `/pt/`).
- As strings da interface devem ser traduzidas e centralizadas em um helper `t()`.
- Configurar `hreflang` e `canonical` em todas as páginas para SEO.

## 6. Filtros Facetados e Busca
- Toda a lógica roda no cliente (JavaScript), sem backend.
- Lógica: AND entre facetas (texto, tipo, gênero, subgênero), OR dentro de cada faceta.
- Índice de busca gerado no build (`search-index.json`) a partir do catálogo enriquecido.
- O estado dos filtros ativos deve ser refletido na query string (`?q=...&tipo=...&genero=...`).
- Ordenação por relevância:
  - Menor índice (posição no array `genero`) entre os gêneros selecionados presentes no item.
  - Desempate: ordem alfabética.
- Ao selecionar um gênero, exibir apenas os subgêneros pertencentes a ele.

## 7. Otimização de Imagens (Caminho A)
- As imagens (capas) estão no R2 e devem ser otimizadas no build.
- Configurar `image.remotePatterns` no `astro.config.mjs` para autorizar o domínio do R2.
- Usar o componente `<Image />` do `astro:assets` (ou wrapper `CoverImage.astro`).
- O Astro deve baixar a imagem original, converter para WebP/AVIF e gerar `srcset` automaticamente.

## 8. Estrutura de Pastas e Componentes
- `/src/pages/` — páginas e rotas do Astro.
- `/src/components/` — componentes de UI (Player, CoverImage, Share, SearchFilters).
- `/src/data/` — dados gerados e estáticos.
- `/src/i18n/` — arquivos de tradução da interface e helpers.
- `/lumo-materials/` — pasta de entrada de arquivos (áudio, capas, V4 metadata). Esta pasta não deve ser deployada.

## 9. Player e Compartilhamento
- Player: usar Howler.js como engine de áudio e construir UI própria (sem bibliotecas prontas).
- O Player é global e deve persistir durante a navegação entre páginas; a integração com Astro ViewTransitions não deve destruir nem reinicializar indevidamente sua reprodução ou estado.
- A comunicação entre páginas/componentes e o Player deve utilizar eventos customizados como contratos, evitando acoplamento direto.
- `playPlaylist` é o contrato previsto para a arquitetura EP-02 (Playlist Contextual). A migração do contrato atual deve ser planejada e validada; não presumir que EP-02 já está implementada.
- O tema visual pode mudar por universo usando CSS variables (ex.: `--accent`, `--bg`).
- Compartilhamento em 3 níveis (Faixa, Álbum, Artista):
  - Web Share API (nativo mobile).
  - Botões diretos para WhatsApp e X (Twitter).
  - Botão "Copiar Link" (essencial para Instagram).

### 9.1 Estado Reativo e Contexto de Reprodução
- O GlobalPlayer deve emitir um evento `trackChanged` sempre que a faixa atual mudar.
- As páginas que exibem entidades reproduzíveis (Álbum, Artista, Track e listagens) devem escutar esse evento.
- A classe `.is-playing` deve ser aplicada ao elemento correspondente (linha da tracklist, card do álbum, etc.).
- O indicador visual deve ser limpo automaticamente quando a entidade não for mais a atual.
- Essa lógica é transversal e depende da arquitetura de Playlist (EP-02).
- Não implementar essa lógica antes da estabilização do EP-02.

## 10. Organização e Convenções de CSS
- Centralizar estilos genuinamente compartilhados; evitar duplicações.
- Não mover estilos para arquivos compartilhados apenas para centralizar código: deve existir responsabilidade compartilhada real.
- Preservar estilos específicos de páginas quando não forem reutilizáveis.
- `global.css`: estilos globais, base, estrutura e regras gerais.
- `mobile.css`: ajustes e regras globais específicas para mobile.
- `src/styles/shared/`: estilos compartilhados entre páginas com responsabilidades definidas.
- CSS específico de página: regras exclusivas daquela página.
- Consolidar e documentar breakpoints; evitar valores diferentes para o mesmo comportamento responsivo sem justificativa.
- Considerar desktop, tablet e mobile quando aplicável.
- Preservar comportamentos responsivos existentes e evitar regras duplicadas.
- Dark Mode é o tema padrão e identidade visual principal do LUMO.
- Sistema de temas deve usar variáveis CSS centralizadas e permitir expansão sem duplicar a estrutura de estilos.
- Não usar inversão simplista de cores: considerar imagens, fundos, overlays, legibilidade e identidade visual.

## 11. Princípios de Desenvolvimento e Processo
1. Trabalhar gradualmente, preferencialmente um arquivo por vez durante revisões e refatorações.
2. Não implementar alterações sem aprovação explícita.
3. Preservar comportamentos existentes, salvo quando uma mudança for aprovada.
4. Não misturar refatorações arquiteturais com correções pontuais sem necessidade.
5. Validar alterações antes de marcar tarefas como concluídas.
6. Não declarar builds, testes, verificações ou validações como concluídos sem execução real.
7. Manter decisões de negócio e arquiteturais documentadas.
8. Não criar arquivos ou abstrações desnecessárias.
9. Antes de modificar componente global, avaliar páginas e funcionalidades que dependem dele.
10. Preservar o funcionamento do Player durante a navegação; avaliar lifecycle, eventos, estado e possíveis inicializações duplicadas.
11. Avisar antecipadamente sobre ferramentas, serviços ou operações que possam consumir cotas, créditos ou recursos limitados; não executar operações potencialmente custosas sem autorização.
12. Distinguir verificações locais de consultas a serviços externos e declarar limitações relevantes.
13. O usuário mantém aprovação e aplicação das mudanças de código, salvo autorização específica para atuação direta no repositório.

## 12. Documentação e Roadmap
- `README.md` deve apresentar o projeto e conter instruções de instalação, configuração necessária, execução local (`npm install`, `npm run dev`), build e preview, para orientar novos desenvolvedores.
- `ROADMAP.md` é a fonte oficial de fases, prioridades, pendências, projetos futuros e status.
- `AGENTS.md` contém instruções permanentes de desenvolvimento, arquitetura e convenções.
- Não duplicar o roadmap inteiro neste arquivo.
- Consultar o `ROADMAP.md` antes de iniciar tarefas planejadas ou projetos arquiteturais.
- Atualizar o roadmap somente quando o status for confirmado; não marcar como concluído apenas porque o código foi escrito.

## 13. Projetos Arquiteturais
- **EP-01 — Sistema de Temas:** consolidar CSS antes de introduzir temas.
- **EP-02 — Playlist Contextual:** planejar e validar a arquitetura de reprodução antes de modularizar o catálogo.
- **EP-03 — Modularização do Catálogo:** executar somente após EP-02 estar implementado, validado e estabilizado.
- EP-02 e EP-03 não devem ser desenvolvidos simultaneamente.
- Mudanças arquiteturais devem ser planejadas, isoladas em etapas, aprovadas e validadas antes de iniciar projetos dependentes.

## 14. O que NÃO fazer
- Não usar SSR no MVP (`output: 'static'`).
- Não adicionar dependências de autenticação ou banco de dados.
- Não usar serviços pagos de imagem (ex.: Cloudflare Images); utilizar a estratégia aprovada de `astro:assets`.
- Não alterar a ordem dos gêneros definida pelos selos no JSON original.
- Não remover funcionalidades ou alterar contratos de dados sem avaliar dependências e obter aprovação.
- Não considerar uma refatoração concluída somente porque o código foi reorganizado; validar o comportamento anterior e posterior quando possível.

## 15. Comandos
- `npm run dev` (ou `astro dev`) — Ambiente de desenvolvimento.
- `npm run build` — Build de produção.
- `npm run preview` — Preview do build.

Consulte `ROADMAP.md` para fases, sequência, dependências e status das tarefas.
