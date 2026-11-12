import fs from 'node:fs';
import path from 'node:path';

const MATERIALS_DIR = path.join(process.cwd(), 'lumo-materials', 'metadata');
const OUTPUT_FILE = path.join(process.cwd(), 'src', 'data', 'catalogo.json');
const R2_BASE_URL = 'https://pub-9d39f9ae84344837a517f2dfdde5f23b.r2.dev';

function readLines(filePath) {
  return fs.readFileSync(filePath, 'utf-8').split('\n').map(l => l.trim()).filter(l => l);
}

function parseArray(str) {
  if (!str) return [];
  try {
    const cleaned = str.replace(/^\[|\]$/g, '').split(',').map(s => s.trim().replace(/^["']|["']$/g, '')).filter(Boolean);
    return cleaned;
  } catch { return []; }
}

function parseDescription(lines) {
  const descIndex = lines.findIndex(l => l.startsWith('- Description:'));
  if (descIndex === -1) return { en: '' };
  const desc = {};
  for (let i = descIndex + 1; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith('-')) break; // Para quando chegar no próximo campo
    const match = line.match(/^\s*-\s*\[(\w+)\]:\s*(.*)$/);
    if (match) {
      desc[match[1]] = match[2];
    }
  }
  return desc;
}

function ingest() {
  console.log('Iniciando ingestão de metadados...');
  
  if (!fs.existsSync(MATERIALS_DIR)) {
    console.error(`Pasta não encontrada: ${MATERIALS_DIR}`);
    return;
  }

  const files = fs.readdirSync(MATERIALS_DIR);
  const labelsMap = new Map();
  const artistsMap = new Map();
  const albumsMap = new Map();
  const tracksMap = new Map();

  // 1. Leitura dos arquivos V4
  files.forEach(file => {
    const lines = readLines(path.join(MATERIALS_DIR, file));
    if (lines.length === 0) return;

    const type = lines[0].split('_')[0];
    const id = lines[0]; 

    if (type === 'label') {
      const name = lines.find(l => l.startsWith('- Name:'))?.replace('- Name:', '').trim() || '';
      const slug = lines.find(l => l.startsWith('- Slug (URL):'))?.replace('- Slug (URL):', '').trim() || lines[0].replace('label_', '').trim();
      const desc = parseDescription(lines);
      labelsMap.set(id, { name, slug, descricao: desc });
    }
    else if (type === 'artist') {
      const name = lines.find(l => l.startsWith('- Name:'))?.replace('- Name:', '').trim() || '';
      const slug = lines.find(l => l.startsWith('- Slug (URL):'))?.replace('- Slug (URL):', '').trim() || '';
      const desc = parseDescription(lines);
      
      // Tenta ler o campo 'Label:' do V4. Se não existir, usa o nome do arquivo como fallback.
      let labelSlug = lines.find(l => l.startsWith('- Label:'))?.replace('- Label:', '').trim();
      if (!labelSlug) {
        // Fallback para o MVP: se o nome do arquivo tem "noise" ou "vex", é loop-77, senão ul7r4
        labelSlug = slug.match(/noise|vex/) ? 'loop-77' : 'ul7r4';
      }
      
      const albumsList = lines.filter(l => l.match(/- \d+\. album_/)).map(l => l.replace(/- \d+\. /, '').trim());
      artistsMap.set(id, { name, slug, descricao: desc, labelSlug, albumsList, albums: [] });
    } 
    else if (type === 'album') {
      const title = lines.find(l => l.startsWith('- Album Title:'))?.replace('- Album Title:', '').trim() || '';
      const slug = lines.find(l => l.startsWith('- Slug (URL):'))?.replace('- Slug (URL):', '').trim() || '';
      const artistRef = lines.find(l => l.startsWith('- Artist:'))?.replace('- Artist:', '').trim() || '';
      const releaseYear = lines.find(l => l.startsWith('- Release Year:'))?.replace('- Release Year:', '').trim() || '';
      const releaseStatus = lines.find(l => l.startsWith('- Release Status:'))?.replace('- Release Status:', '').trim() || 'Unreleased';
      const tracksList = lines.filter(l => l.match(/- \d+\. track_/)).map(l => l.replace(/- \d+\. /, '').trim());
      
      albumsMap.set(id, { title, slug, artistRef, releaseYear, releaseStatus, tracksList, tracks: [] });
    } 
    else if (type === 'track') {
      const title = lines.find(l => l.startsWith('- Track Title:'))?.replace('- Track Title:', '').trim() || '';
      const slug = lines.find(l => l.startsWith('- Slug (URL):'))?.replace('- Slug (URL):', '').trim() || '';
      const genresStr = lines.find(l => l.startsWith('- Genres (macro):'))?.replace('- Genres (macro):', '').trim() || '[]';
      const subgenresStr = lines.find(l => l.startsWith('- Subgenres (micro):'))?.replace('- Subgenres (micro):', '').trim() || '[]';
      const duration = lines.find(l => l.startsWith('- Exact Duration'))?.replace('- Exact Duration (mm:ss):', '').trim() || '';
      const releaseStatus = lines.find(l => l.startsWith('- Release Status:'))?.replace('- Release Status:', '').trim() || 'Unreleased';
      
      const lyricsIndex = lines.findIndex(l => l.startsWith('- Lyrics (plain text):'));
      let lyrics = { en: '' };
      if (lyricsIndex !== -1) {
        const lyricsLines = [];
        for (let i = lyricsIndex + 1; i < lines.length; i++) {
          if (lines[i].startsWith('-')) break;
          lyricsLines.push(lines[i]);
        }
        lyrics.en = lyricsLines.join('\n');
      }

      const artistSlug = lines.find(l => l.startsWith('- Artist:'))?.replace('- Artist:', '').trim() || 'unknown';

      tracksMap.set(id, { 
        title, slug, duration, releaseStatus, 
        track_genres: parseArray(genresStr), 
        track_subgenres: parseArray(subgenresStr),
        lyrics: lyrics,
        audio: `${R2_BASE_URL}/audio/track_${artistSlug}_${slug}.mp3` 
      });
    }
  });

  // 2. Processamento dos Álbuns
  for (const [albumId, album] of albumsMap.entries()) {
    let albumGenres = new Set();
    let albumSubgenres = new Set();
    let allTracksReleased = true;

    album.tracksList.forEach(trackRef => {
      const track = tracksMap.get(trackRef);
      if (track) {
        album.tracks.push(track);
        if (track.releaseStatus !== 'Released') allTracksReleased = false;
        
        track.track_genres.forEach(g => albumGenres.add(g));
        track.track_subgenres.forEach(sg => albumSubgenres.add(sg));
      }
    });

    album.isVisible = allTracksReleased && album.tracks.length > 0;
    album.genero = Array.from(albumGenres);
    album.subgenero = Array.from(albumSubgenres);
    
    const artistForAlbum = artistsMap.get(`artist_${album.artistRef.replace('artist_', '')}`);
    const artistSlug = artistForAlbum ? artistForAlbum.slug : 'unknown';
    album.capa = `${R2_BASE_URL}/image/album_${artistSlug}_${album.slug}.jpg`;
  }

  // 3. Processamento dos Artistas
  const artistasFinais = [];
  for (const [artistId, artist] of artistsMap.entries()) {
    let artistGenres = new Set();
    let artistSubgenres = new Set();
    let hasVisibleAlbum = false;
    let totalTracks = 0;

    artist.albumsList.forEach(albumRef => {
      const album = albumsMap.get(albumRef);
      if (album) {
        artist.albums.push(album);
        if (album.isVisible) {
          hasVisibleAlbum = true;
          totalTracks += album.tracks.length;
        }
        
        album.genero.forEach(g => artistGenres.add(g));
        album.subgenero.forEach(sg => artistSubgenres.add(sg));
      }
    });

    if (hasVisibleAlbum) {
      artistasFinais.push({
        nome: artist.name,
        slug: artist.slug,
        descricao: artist.descricao,
        label: artist.labelSlug,
        genero: Array.from(artistGenres),
        subgenero: Array.from(artistSubgenres),
        foto: `${R2_BASE_URL}/image/artist_${artist.slug}.jpg`,
        totalAlbuns: artist.albums.filter(a => a.isVisible).length,
        totalFaixas: totalTracks,
        albuns: artist.albums
      });
    }
  }

  // 4. Processamento dos Labels (Selos)
  const labelsFinais = [];
  for (const [labelId, label] of labelsMap.entries()) {
    const artistasDoLabel = artistasFinais.filter(a => a.label === label.slug);
    
    if (artistasDoLabel.length > 0) {
      labelsFinais.push({
        nome: label.name,
        slug: label.slug,
        descricao: label.descricao,
        imagemFundo: `${R2_BASE_URL}/image/label_${label.slug}.jpg`,
        artistas: artistasDoLabel
      });
    }
  }

  // 5. Salva o catálogo final
  const catalogo = { 
    labels: labelsFinais,
    artistas: artistasFinais 
  };
  
  const dataDir = path.dirname(OUTPUT_FILE);
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(catalogo, null, 2), 'utf-8');
  
  console.log(`\nSucesso! Catálogo gerado com ${labelsFinais.length} selos e ${artistasFinais.length} artistas visíveis.`);
  console.log(`Arquivo salvo em: ${OUTPUT_FILE}`);
}

ingest();