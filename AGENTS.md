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
- Curtidas, favoritos, playlists.
- Qualquer feature que dependa de sessão de usuário.
- Não adicionar botões, ícones ou textos que sugiram essas features.

Se uma tarefa parecer exigir isso, **pare e pergunte** antes de codar.

## 3. Arquitetura de Dados e Metadados (Padrão V4)
Os metadados chegam em arquivos de texto estruturado (Padrão V4) na pasta `/lumo-materials/metadata/`.
O script de ingestão deve converter esses arquivos V4 para um JSON único (`catalogo.json`).

**Hierarquia:** Universo (Label) → Artista → Álbum → Faixa.

**Regras de Gênero (Herança):**
- Gêneros e subgêneros são preenchidos **apenas** na Faixa (Track), nos campos `Genres (macro)` e `Subgenres (micro)`.
- O **Álbum** herda a união de todos os gêneros/subgêneros de suas faixas (sem duplicatas, mantendo a ordem de prioridade).
- O **Artista** herda a união de todos os gêneros/subgêneros de seus álbuns.
- A lógica de agrupamento deve ser feita no build, não no input.
- O campo `genero` e `subgenero` são sempre arrays de strings, nunca strings únicas.

**Slugs:**
- O slug é imutável após a publicação. Nunca altere o slug de um artista, álbum ou faixa já publicado.
- Slugs podem se repetir em níveis diferentes (ex: álbum "Salvage" do artista A e faixa "Salvage" do artista B). A hierarquia de rotas do Astro resolve isso naturalmente.

## 4. Regra de Renderização Condicional
A regra oficial é **"Álbum Completo ou Nada"**.
- Um **Álbum** só é gerado no build público se **TODAS** as suas faixas estiverem com `Release Status: Released`.
- Um **Artista** só aparece no build público se tiver pelo menos um álbum visível.
- Não existirão faixas Unreleased dentro de um álbum visível (sem cadeados ou "em breve").
- Em ambiente de desenvolvimento (`astro dev`) ou preview interno, todo o catálogo é exibido.

## 5. i18n (Internacionalização)
- O JSON do catálogo terá os textos aninhados por idioma: `"descricao": { "en": "...", "pt": "..." }`.
- O idioma padrão (inglês) fica na raiz da URL.
- O português fica sob o prefixo `/pt/`.
- A detecção de idioma do navegador deve ser implementada no cliente (se `navigator.language` for pt-BR, redirecionar para `/pt/`).
- As strings da interface também devem ser traduzidas e centralizadas em um helper `t()`.
- Configurar `hreflang` e `canonical` em todas as páginas para SEO.

## 6. Filtros Facetados e Busca
- Toda a lógica roda no **cliente** (JavaScript), sem backend.
- **Lógica:** AND entre facetas (texto, tipo, gênero, subgênero), OR dentro de cada faceta.
- **Índice de busca:** gerado no build (`search-index.json`) a partir do catálogo enriquecido.
- **Estado na URL:** os filtros ativos devem ser refletidos na query string (`?q=...&tipo=...&genero=...`).
- **Ordenação por relevância:** 
  - Menor índice (posição no array `genero`) entre os gêneros selecionados presentes no item.
  - Desempate: ordem alfabética.
- **Dependência de subgênero:** ao selecionar um gênero, exibir apenas os subgêneros pertencentes a ele.

## 7. Otimização de Imagens (Caminho A)
- As imagens (capas) estão no R2 e devem ser otimizadas no build.
- Configurar `image.remotePatterns` no `astro.config.mjs` para autorizar o domínio do R2.
- Usar o componente `<Image />` do `astro:assets` (ou um wrapper `CoverImage.astro`).
- O Astro deve baixar a imagem original, converter para WebP/AVIF e gerar `srcset` automaticamente.

## 8. Estrutura de Pastas e Componentes
- `/src/pages/[...slug].astro` — Rotas dinâmicas para os 4 níveis.
- `/src/components/` — Componentes de UI (Player, CoverImage, Share, SearchFilters).
- `/src/data/` — JSONs gerados e estáticos.
- `/src/i18n/` — Arquivos de tradução da interface e helpers.
- `/lumo-materials/` — Pasta de entrada de arquivos (áudio, capas, V4 metadata). Esta pasta não deve ser deployada.

## 9. Player e Compartilhamento
- **Player:** Usar Howler.js como engine de áudio e construir a UI própria (sem bibliotecas prontas). O tema visual deve mudar por universo usando CSS variables (`--accent`, `--bg`).
- **Compartilhamento:** Implementar em 3 níveis (Faixa, Álbum, Artista).
  - Usar Web Share API (nativo mobile).
  - Botões diretos para WhatsApp e X (Twitter).
  - Botão "Copiar Link" (essencial para Instagram).

## 10. O que NÃO fazer
- Não usar SSR no MVP (`output: 'static'`).
- Não adicionar dependências de autenticação (Clerk, Supabase, etc.) ou banco de dados.
- Não usar serviços pagos de imagem (ex: Cloudflare Images). Use o `astro:assets`.
- Não alterar a ordem dos gêneros definida pelos selos no JSON original.

## 11. Comandos
- `npm run dev` (ou `astro dev`) — Ambiente de desenvolvimento.
- `npm run build` — Build de produção (com otimização de imagens e filtros de renderização).
- `npm run preview` — Preview do build.