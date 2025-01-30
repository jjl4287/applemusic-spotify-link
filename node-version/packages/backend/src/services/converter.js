class ConverterService {
  constructor() {
    this.spotifyRegex = /^(?:https?:\/\/)?(?:open\.)?spotify\.com\/(track|album|artist|playlist)\/([a-zA-Z0-9]+)(?:\?.+)?$/;
    this.appleMusicRegex = /^(?:https?:\/\/)?music\.apple\.com\/([a-z]{2})\/(?:[^\/]+\/)?(?:([^\/]+)\/)?([^\/\?]+)(?:\?.*)?$/;
  }

  async parseAppleMusicLink(url) {
    const match = url.match(this.appleMusicRegex);
    if (!match) {
      throw new Error('Invalid Apple Music URL');
    }

    try {
      const [, country, type, id] = match;
      const response = await fetch(url);
      const html = await response.text();
      
      // Extract title and artist from meta tags with multiple fallback patterns
      const titlePatterns = [
        /<meta property="og:title" content="([^"]+)"/i,
        /<meta name="apple:title" content="([^"]+)"/i,
        /<title>([^<]+)<\/title>/i
      ];
      
      const artistPatterns = [
        {
          pattern: /<meta property="music:musician" content="([^"]+)" *\/?>/i,
          type: 'url'
        },
        {
          pattern: /<meta name="apple:artist" content="([^"]+)" *\/?>/i,
          type: 'text'
        },
        {
          pattern: /<meta property="og:description" content="(?:Song|Album|Track) · ([^·]+?) ·/i,
          type: 'text'
        },
        {
          pattern: /<div class="product-creator"[^>]*>([^<]+)<\/div>/i,
          type: 'text'
        },
        {
          pattern: /<meta property="og:title" content="[^"]+? by ([^"]+)"/i,
          type: 'text'
        },
        {
          pattern: /<meta property="og:description" content="[^"]*?(?:Song|Album|Track)?[^"]*?by ([^"]+)"/i,
          type: 'text'
        },
        {
          pattern: /<meta property="og:description" content="[^"]*?Artist[^"]*?([^"]+)"/i,
          type: 'text'
        },
        {
          pattern: /<meta name="description" content="[^"]*?by ([^"]+?)(?:on Apple Music| ·|\.)/i,
          type: 'text'
        },
        {
          pattern: /<div[^>]*class="[^"]*artist-name[^"]*"[^>]*>([^<]+)<\/div>/i,
          type: 'text'
        },
        {
          pattern: /<meta property="og:description" content="[^"]*?(?:Song|Album|Track) · ([^·]+?) ·/i,
          type: 'text'
        },
        {
          pattern: /<meta property="og:description" content="[^"]*?(?:Song|Album|Track) by ([^"]+?)(?:on Apple Music| ·|\.)/i,
          type: 'text'
        },
        {
          pattern: /<meta name="description" content="[^"]*?(?:Song|Album|Track) · ([^·]+?) ·/i,
          type: 'text'
        }
      ];
      
      let titleMatch = null;
      let artistMatch = null;
      let artistUrl = null;
      
      for (const pattern of titlePatterns) {
        titleMatch = html.match(pattern);
        if (titleMatch) break;
      }
      
      for (const { pattern, type } of artistPatterns) {
        const match = html.match(pattern);
        if (match) {
          if (type === 'url' && !artistUrl) {
            artistUrl = match[1];
          }
          if (!artistMatch) {
            artistMatch = match;
          }
          if (artistMatch && artistUrl) break;
        }
      }
      
      if (!titleMatch || !artistMatch) {
        console.error('Failed to extract metadata with patterns:', { titleMatch, artistMatch });
        throw new Error('Could not extract song information');
      }
      
      // Clean up title if it contains " - Single" or similar suffixes
      let title = titleMatch[1].replace(/ - Single$| - EP$| - Album$/i, '');
      if (title.includes(' by ')) {
        title = title.split(' by ')[0];
      }

      // Clean up artist name to ensure it's plain text
      let artist = artistMatch[1].trim();
      // Remove any URLs that might be in the artist name
      artist = artist.replace(/https?:\/\/[^\s]+/g, '').trim();
      // Remove any HTML entities
      artist = artist.replace(/&[^;]+;/g, '').trim();
      // Remove any remaining special characters except letters, numbers, spaces, and basic punctuation
      artist = artist.replace(/[^\w\s.,'-]/g, '').trim();

      // Determine content type from URL structure and query parameters
      let contentType = type || 'track';
      if (url.includes('?i=')) {
        contentType = 'track';
      } else if (url.includes('/artist/')) {
        contentType = 'artist';
      } else if (url.includes('/album/')) {
        contentType = 'album';
      }

      // Extract artist name from URL if not found in metadata
      if (!artist || artist.trim() === '') {
        // Try to extract artist from artistUrl if available
        if (artistUrl) {
          const artistUrlParts = artistUrl.split('/');
          const artistIndex = artistUrlParts.indexOf('artist');
          if (artistIndex !== -1 && artistIndex + 1 < artistUrlParts.length) {
            artist = artistUrlParts[artistIndex + 1]
              .split('-')
              .map(word => word.charAt(0).toUpperCase() + word.slice(1))
              .join(' ')
              .replace(/[0-9]/g, '');
          }
        }
        
        // If still no artist, try to extract from URL path
        if (!artist || artist.trim() === '') {
          const urlParts = url.split('/');
          const artistIndex = urlParts.indexOf('artist');
          if (artistIndex !== -1 && artistIndex + 1 < urlParts.length) {
            artist = urlParts[artistIndex + 1]
              .split('-')
              .map(word => word.charAt(0).toUpperCase() + word.slice(1))
              .join(' ')
              .replace(/[0-9]/g, '');
          }
        }
        
        // If still no artist, try to extract from album path for track URLs
        if ((!artist || artist.trim() === '') && url.includes('?i=')) {
          const urlParts = url.split('/');
          const albumIndex = urlParts.indexOf('album');
          if (albumIndex !== -1 && albumIndex + 1 < urlParts.length) {
            const albumPath = urlParts[albumIndex + 1];
            if (albumPath.includes('-')) {
              // Assume the first part before a hyphen in album path might be the artist
              artist = albumPath.split('-')[0]
                .split('_')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ')
                .replace(/[0-9]/g, '');
            }
          }
        }
      }

      // Clean up title for artist pages
      if (contentType === 'artist') {
        title = title.replace(/ on Apple Music\.?$/, '');
        artist = title; // For artist pages, use the cleaned title as the artist name
      }

      return {
        title: title,
        artist: artist,
        artistUrl: artistUrl,
        type: contentType,
        country,
        id,
        originalUrl: url
      };
    } catch (error) {
      console.error('Error parsing Apple Music link:', error);
      throw error;
    }
  }

  isValidAppleMusicLink(url) {
    return this.appleMusicRegex.test(url);
  }

  isValidSpotifyLink(url) {
    return this.spotifyRegex.test(url);
  }

  sortByRelevance(items, searchTitle, searchArtist) {
    return items.sort((a, b) => {
      // Exact title match gets highest priority
      const aExactTitle = a.name.toLowerCase() === searchTitle.toLowerCase();
      const bExactTitle = b.name.toLowerCase() === searchTitle.toLowerCase();
      if (aExactTitle && !bExactTitle) return -1;
      if (!aExactTitle && bExactTitle) return 1;

      // Then check artist match
      const aArtistMatch = a.artists?.[0]?.name.toLowerCase() === searchArtist.toLowerCase();
      const bArtistMatch = b.artists?.[0]?.name.toLowerCase() === searchArtist.toLowerCase();
      if (aArtistMatch && !bArtistMatch) return -1;
      if (!aArtistMatch && bArtistMatch) return 1;

      // Finally sort by popularity
      return b.popularity - a.popularity;
    });
  }
}

export default ConverterService;