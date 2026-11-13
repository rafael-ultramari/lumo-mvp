import fs from 'node:fs';
import path from 'node:path';

const MATERIALS_DIR = path.join(process.cwd(), 'lumo-materials', 'metadata');
const OUTPUT_FILE = path.join(process.cwd(), 'src', 'data', 'catalogo.json');
const R2_BASE_URL = 'https://pub-9d39f9ae84344837a517f2dfdde5f23b.r2.dev';

function readFile(filePath) {
  return fs.readFileSync(filePath, 'utf-8');
}

function parseArray(str) {
  if (!str) return [];
  try {
    const cleaned = str.replace(/^\[|\]$/g, '').split(',').map(s => s.trim().replace(/^["']|["']$/g, '')).filter(Boolean);
    return cleaned;
  } catch { return []; }
}

function extractDescription(text) {
  const match = text.match(/- Description:\s*\n\s*- \[en\]: ([\s\S]*?)(?=\n- |$)/i);
  if (match) {
    return { en: match[1].trim().replace(/\n\s*/g, ' ') };
  }
  return { en: '' };
}

function extractLyrics(text) {
  const match = text.match(/- Lyrics \(plain text\):\s*\n\s*- \[en\]: ([\s\S]*?)(?=\n- |$)/i);
  if (match) {
    return { en: match[1].trim() };
  }
  return { en: '' };
}

function parseDuration(durationStr) {
  if (!durationStr) return 0;
  const parts = durationStr.split(':');
  if (parts.length === 2) {
    return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
  }
  return 0;
}

function formatDuration(totalSeconds) {
  if (isNaN(totalSeconds) || totalSeconds === 0) return '0:00';
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
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

  files.forEach(file => {
    const text = readFile(path.join(MATERIALS_DIR, file));
    if (!text) return;

    const firstLine = text.split('\n')[0].trim();
    const type = firstLine.split('_')[0];
    const id = firstLine; 

    if (type === 'label') {
      const name = text.match(/- Name: (.*)/)?.[1]?.trim() || '';
      const slug = text.match(/- Slug \(URL\): (.*)/)?.[1]?.trim() || id.replace('label_', '').trim();
      const desc = extractDescription(text);
      labelsMap.set(id, { name, slug, descricao: desc });
    }
    else if (type === 'artist') {
      const name = text.match(/- Name: (.*)/)?.[1]?.trim() || '';
      const slug = text.match(/- Slug \(URL\): (.*)/)?.[1]?.trim() || '';
      const desc = extractDescription(text);
      
      let labelSlug = text.match(/- Label: (.*)/)?.[1]?.trim();
      if (!labelSlug) {
        labelSlug = slug.match(/noise|vex/) ? 'loop-77' : 'ul7r4';
      }
      
      const albumsBlock = text.match(/- Albums:\s*\n([\s\S]*?)(?=\n- |$)/);
      const albumsList = albumsBlock ? albumsBlock[1].split('\n').map(l => l.replace(/- \d+\. /, '').trim()).filter(Boolean) : [];
      
      artistsMap.set(id, { name, slug, descricao: desc, labelSlug, albumsList, albums: [] });
    } 
    else if (type === 'album') {
      const title = text.match(/- Album Title: (.*)/)?.[1]?.trim() || '';
      const slug = text.match(/- Slug \(URL\): (.*)/)?.[1]?.trim() || '';
      const artistRef = text.match(/- Artist: (.*)/)?.[1]?.trim() || '';
      const releaseYear = text.match(/- Release Year: (.*)/)?.[1]?.trim() || '';
      
      const desc = extractDescription(text);
      
      const tracksBlock = text.match(/- Tracks:\s*\n([\s\S]*?)(?=\n- |$)/);
      const tracksList = tracksBlock ? tracksBlock[1].split('\n').map(l => l.replace(/- \d+\. /, '').trim()).filter(Boolean) : [];
      
      albumsMap.set(id, { title, slug, artistRef, releaseYear, descricao: desc, tracksList, tracks: [] });
    } 
    else if (type === 'track') {
      const title = text.match(/- Track Title: (.*)/)?.[1]?.trim() || '';
      const slug = text.match(/- Slug \(URL\): (.*)/)?.[1]?.trim() || '';
      
      const genresStr = text.match(/- Genres \(macro\): (.*)/)?.[1]?.trim() || '[]';
      const subgenresStr = text.match(/- Subgenres \(micro\): (.*)/)?.[1]?.trim() || '[]';
      const duration = text.match(/- Exact Duration \(mm:ss\): (.*)/)?.[1]?.trim() || '';
      
      let releaseStatus = text.match(/- Release Status: (.*)/)?.[1]?.trim() || 'Unreleased';
      releaseStatus = releaseStatus.trim();

      // NOVO: Lê o campo "Official Music Video?"
      const hasVideo = text.match(/- Official Music Video\?: (.*)/)?.[1]?.trim().toLowerCase() === 'yes';

      const desc = extractDescription(text);
      const lyrics = extractLyrics(text);
      
      const artistSlug = text.match(/- Artist: (.*)/)?.[1]?.trim() || 'unknown';

      tracksMap.set(id, { 
        title, slug, duration, releaseStatus, 
        track_genres: parseArray(genresStr), 
        track_subgenres: parseArray(subgenresStr),
        descricao: desc,
        lyrics: lyrics,
        hasVideo: hasVideo, // NOVO CAMPO
        audio: `${R2_BASE_URL}/audio/track_${artistSlug}_${slug}.mp3` 
      });
    }
  });

  for (const [albumId, album] of albumsMap.entries()) {
    let albumGenres = new Set();
    let albumSubgenres = new Set();
    let allTracksReleased = true;
    let totalSeconds = 0;

    album.tracksList.forEach(trackRef => {
      const track = tracksMap.get(trackRef);
      if (track) {
        album.tracks.push(track);
        
        if (track.releaseStatus !== 'Released') {
          allTracksReleased = false;
        }
        
        track.track_genres.forEach(g => albumGenres.add(g));
        track.track_subgenres.forEach(sg => albumSubgenres.add(sg));
        
        totalSeconds += parseDuration(track.duration);
      } else {
        allTracksReleased = false;
      }
    });

    album.isVisible = allTracksReleased && album.tracks.length > 0;
    album.genero = Array.from(albumGenres);
    album.subgenero = Array.from(albumSubgenres);
    album.totalDuration = formatDuration(totalSeconds);
    
    const artistForAlbum = artistsMap.get(`artist_${album.artistRef.replace('artist_', '')}`);
    const artistSlug = artistForAlbum ? artistForAlbum.slug : 'unknown';
    album.capa = `${R2_BASE_URL}/image/album_${artistSlug}_${album.slug}.jpg`;
  }

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