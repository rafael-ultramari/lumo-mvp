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

function ingest() {
  console.log('Iniciando ingestão de metadados...');
  
  if (!fs.existsSync(MATERIALS_DIR)) {
    console.error(`Pasta não encontrada: ${MATERIALS_DIR}`);
    return;
  }

  const files = fs.readdirSync(MATERIALS_DIR);
  const artistsMap = new Map();
  const albumsMap = new Map();
  const tracksMap = new Map();

  files.forEach(file => {
    const lines = readLines(path.join(MATERIALS_DIR, file));
    if (lines.length === 0) return;

    const type = lines[0].split('_')[0];
    const id = lines[0]; 

    if (type === 'artist') {
      const name = lines.find(l => l.startsWith('- Name:'))?.replace('- Name:', '').trim() || '';
      const slug = lines.find(l => l.startsWith('- Slug (URL):'))?.replace('- Slug (URL):', '').trim() || '';
      const albumsList = lines.filter(l => l.match(/- \d+\. album_/)).map(l => l.replace(/- \d+\. /, '').trim());
      
      artistsMap.set(id, { name, slug, albumsList, albums: [] });
    } 
    else if (type === 'album') {
      const title = lines.find(l => l.startsWith('- Album Title:'))?.replace('- Album Title:', '').trim() || '';
      const slug = lines.find(l => l.startsWith('- Slug (URL):'))?.replace('- Slug (URL):', '').trim() || '';
      const artistRef = lines.find(l => l.startsWith('- Artist:'))?.replace('- Artist:', '').trim() || '';
      const releaseStatus = lines.find(l => l.startsWith('- Release Status:'))?.replace('- Release Status:', '').trim() || 'Unreleased';
      const tracksList = lines.filter(l => l.match(/- \d+\. track_/)).map(l => l.replace(/- \d+\. /, '').trim());
      
      albumsMap.set(id, { title, slug, artistRef, releaseStatus, tracksList, tracks: [] });
    } 
    else if (type === 'track') {
      const title = lines.find(l => l.startsWith('- Track Title:'))?.replace('- Track Title:', '').trim() || '';
      const slug = lines.find(l => l.startsWith('- Slug (URL):'))?.replace('- Slug (URL):', '').trim() || '';
      const genresStr = lines.find(l => l.startsWith('- Genres (macro):'))?.replace('- Genres (macro):', '').trim() || '[]';
      const subgenresStr = lines.find(l => l.startsWith('- Subgenres (micro):'))?.replace('- Subgenres (micro):', '').trim() || '[]';
      const duration = lines.find(l => l.startsWith('- Exact Duration'))?.replace('- Exact Duration (mm:ss):', '').trim() || '';
      const releaseStatus = lines.find(l => l.startsWith('- Release Status:'))?.replace('- Release Status:', '').trim() || 'Unreleased';
      
      const genres = parseArray(genresStr);
      const subgenres = parseArray(subgenresStr);

      tracksMap.set(id, { 
        title, slug, duration, releaseStatus, 
        track_genres: genres, 
        track_subgenres: subgenres,
        audio: `${R2_BASE_URL}/audio/${slug}.mp3` 
      });
    }
  });

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
    
    // CORREÇÃO: O nome do arquivo no R2 usa underline e o slug do artista
    // Ex: album_noise_the-violet-sessions.jpg
    const artistForAlbum = artistsMap.get(`artist_${album.artistRef.replace('artist_', '')}`);
    const artistSlug = artistForAlbum ? artistForAlbum.slug : 'unknown';
    album.capa = `${R2_BASE_URL}/image/album_${artistSlug}_${album.slug}.jpg`;
  }

  const artistasFinais = [];
  for (const [artistId, artist] of artistsMap.entries()) {
    let artistGenres = new Set();
    let artistSubgenres = new Set();
    let hasVisibleAlbum = false;

    artist.albumsList.forEach(albumRef => {
      const album = albumsMap.get(albumRef);
      if (album) {
        artist.albums.push(album);
        if (album.isVisible) hasVisibleAlbum = true;
        
        album.genero.forEach(g => artistGenres.add(g));
        album.subgenero.forEach(sg => artistSubgenres.add(sg));
      }
    });

    if (hasVisibleAlbum) {
      artistasFinais.push({
        nome: artist.name,
        slug: artist.slug,
        genero: Array.from(artistGenres),
        subgenero: Array.from(artistSubgenres),
        // CORREÇÃO: O nome do arquivo no R2 é artist_[slug].jpg
        foto: `${R2_BASE_URL}/image/artist_${artist.slug}.jpg`,
        albuns: artist.albums
      });
    }
  }

  const catalogo = { artistas: artistasFinais };
  
  const dataDir = path.dirname(OUTPUT_FILE);
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(catalogo, null, 2), 'utf-8');
  
  console.log(`\nSucesso! Catálogo gerado com ${artistasFinais.length} artistas visíveis.`);
  console.log(`Arquivo salvo em: ${OUTPUT_FILE}`);
}

ingest();