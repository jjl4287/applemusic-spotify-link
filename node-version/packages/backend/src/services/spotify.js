import SpotifyWebApi from 'spotify-web-api-node';
import { SecretManagerServiceClient } from '@google-cloud/secret-manager';

class SpotifyService {
  constructor() {
    this.spotifyApi = null;
  }

  async initialize() {
    try {
      const clientId = process.env.SPOTIFY_CLIENT_ID;
      const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

      if (!clientId || !clientSecret) {
        throw new Error('Failed to retrieve Spotify credentials from Secret Manager');
      }

      console.log('Initializing Spotify service with credentials from Secret Manager');
      this.spotifyApi = new SpotifyWebApi({
        clientId,
        clientSecret
      });

      const data = await this.spotifyApi.clientCredentialsGrant();
      this.spotifyApi.setAccessToken(data.body.access_token);
      console.log('Successfully initialized Spotify service');
      // Set up token refresh before it expires
      setTimeout(() => this.initialize(), (data.body.expires_in - 60) * 1000);
    } catch (error) {
      console.error('Error initializing Spotify service:', error);
      throw error;
    }
  }

  sanitizeTrackName(name) {
    if (!name) return '';
    
    // Step 1: Normalize unicode characters and diacritics
    let sanitized = name.normalize('NFKD').replace(/[\u0300-\u036f]/g, '');
    
    // Step 2: Handle multiple artists and featuring artists
    sanitized = sanitized
      .replace(/(?:feat\.|ft\.|featuring|with|&|,)\s+[^\(\[\{]+(?=[\(\[\{]|$)/gi, '')
      .replace(/\s*[,&]\s*(?=[^\(\[\{]+(?:[\(\[\{]|$))/g, '');
    
    // Step 3: Handle special editions and versions
    sanitized = sanitized
      // First, handle special editions and deluxe versions
      .replace(/[\(\[\{](?:(?:20\d{2}|19\d{2})?\s*(?:super\s+)?(?:deluxe|anniversary|special|expanded|collectors?|limited|exclusive|japanese|european|international|standard|digital|explicit|clean)\s+(?:edition|version|reissue|mix|remaster|release|pressing)).*?[\)\]\}]/gi, '')
      // Then handle other common suffixes
      .replace(/[\(\[\{](?:[Ff]eat|\.|\s[Ff]t\.|[Rr]emastered|[Ll]ive|[Ee]dit|[Vv]ersion|[Rr]emix|[Bb]onus|[Ee]xtended|[Aa]coustic|[Oo]riginal|[Mm]ono|[Ss]tereo|[Ll]p|[Ss]ingle|[Ee]p).*?[\)\]\}]/g, '')
      // Handle numbered/lettered versions (e.g., Version 2, Take 3)
      .replace(/[\(\[\{](?:v(?:ersion|\.)?\s*\d+|take\s*\d+)[\)\]\}]/gi, '')
      // Keep parentheses content that might be part of the actual title
      .replace(/[\(\[\{]((?![Ff]eat|[Rr]emastered|[Ll]ive|[Ee]dit|[Vv]ersion|[Rr]emix).{1,30}?)[\)\]\}]/g, '$1')
      // Remove special characters but keep essential punctuation and international characters
      .replace(/[^\w\s\-\'\.-\uffff]/g, '')
      // Normalize spaces around punctuation
      .replace(/\s*([\-\'\.])\s*/g, '$1')
      // Remove dots from the end
      .replace(/\.+$/, '')
      // Trim whitespace and normalize multiple spaces
      .trim()
      .replace(/\s+/g, ' ');

    return sanitized;
  }

  async searchTrack(title, artist) {
    try {
      // Sanitize the title before searching
      const sanitizedTitle = this.sanitizeTrackName(title);
      const sanitizedArtist = this.sanitizeTrackName(artist);
      
      // Try exact match first
      const exactQuery = `track:"${sanitizedTitle}" artist:"${sanitizedArtist}"`;
      let response = await this.spotifyApi.searchTracks(exactQuery, { limit: 50 });
      
      // If no results, try a more lenient search
      if (!response.body.tracks.items.length) {
        const lenientQuery = `${sanitizedTitle} ${sanitizedArtist}`;
        response = await this.spotifyApi.searchTracks(lenientQuery, { limit: 50 });
      }
      
      if (!response.body.tracks.items.length) {
        return null;
      }

      const tracks = response.body.tracks.items;
      let bestMatch = tracks[0];
      let highestScore = 0;

      for (const track of tracks) {
        const sanitizedTrackName = this.sanitizeTrackName(track.name);
        const sanitizedTrackArtist = this.sanitizeTrackName(track.artists[0].name);
        
        const titleSimilarity = this.calculateSimilarity(sanitizedTitle.toLowerCase(), sanitizedTrackName.toLowerCase());
        const artistSimilarity = this.calculateSimilarity(sanitizedArtist.toLowerCase(), sanitizedTrackArtist.toLowerCase());
        
        // Check for exact matches (case-insensitive)
        const exactTitleMatch = sanitizedTitle.toLowerCase() === sanitizedTrackName.toLowerCase() ? 0.2 : 0;
        const exactArtistMatch = sanitizedArtist.toLowerCase() === sanitizedTrackArtist.toLowerCase() ? 0.2 : 0;
        
        // Add popularity score (normalized from 0-100 to 0-1)
        const popularityScore = track.popularity / 100;
        
        // Weight the scores (40% similarity, 40% exact match bonus, 20% popularity)
        const combinedScore = (titleSimilarity + artistSimilarity) * 0.4 + 
                            (exactTitleMatch + exactArtistMatch) + 
                            popularityScore * 0.2;

        if (combinedScore > highestScore) {
          highestScore = combinedScore;
          bestMatch = track;
        }
      }

      // Adjust threshold based on whether we found exact matches
      const threshold = sanitizedTitle.toLowerCase() === this.sanitizeTrackName(bestMatch.name).toLowerCase() ? 0.3 : 0.4;
      
      if (highestScore > threshold) {
        return {
          url: bestMatch.external_urls.spotify,
          album_art: bestMatch.album.images[0].url,
          album: bestMatch.album.name,
          release_date: bestMatch.album.release_date
        };
      }

      return null;
    } catch (error) {
      console.error('Error searching Spotify:', error);
      throw error;
    }
  }

  async searchArtist(query) {
    try {
      const response = await this.spotifyApi.searchArtists(query);
      if (!response.body.artists.items.length) {
        return null;
      }

      const artist = response.body.artists.items[0];
      return {
        url: artist.external_urls.spotify,
        album_art: artist.images[0]?.url,
        release_date: null,
        album: null
      };
    } catch (error) {
      console.error('Error searching Spotify artist:', error);
      return null;
    }
  }

  async searchAlbum(title, artist) {
    try {
      // Sanitize inputs
      const sanitizedTitle = this.sanitizeTrackName(title);
      const sanitizedArtist = this.sanitizeTrackName(artist);
      
      // Try exact match first
      const exactQuery = `album:"${sanitizedTitle}" artist:"${sanitizedArtist}"`;
      let response = await this.spotifyApi.searchAlbums(exactQuery, { limit: 50 });
      
      // If no results, try a more lenient search
      if (!response.body.albums.items.length) {
        const lenientQuery = `${sanitizedTitle} ${sanitizedArtist}`;
        response = await this.spotifyApi.searchAlbums(lenientQuery, { limit: 50 });
      }
      
      if (!response.body.albums.items.length) {
        return null;
      }

      const albums = response.body.albums.items;
      let bestMatch = albums[0];
      let highestScore = 0;

      for (const album of albums) {
        const sanitizedAlbumName = this.sanitizeTrackName(album.name);
        const sanitizedAlbumArtist = this.sanitizeTrackName(album.artists[0].name);
        
        const titleSimilarity = this.calculateSimilarity(sanitizedTitle.toLowerCase(), sanitizedAlbumName.toLowerCase());
        const artistSimilarity = this.calculateSimilarity(sanitizedArtist.toLowerCase(), sanitizedAlbumArtist.toLowerCase());
        
        // Check for exact matches (case-insensitive)
        const exactTitleMatch = sanitizedTitle.toLowerCase() === sanitizedAlbumName.toLowerCase() ? 0.2 : 0;
        const exactArtistMatch = sanitizedArtist.toLowerCase() === sanitizedAlbumArtist.toLowerCase() ? 0.2 : 0;
        
        // Add popularity score if available
        const popularityScore = album.popularity ? album.popularity / 100 : 0;
        
        // Weight the scores (40% similarity, 40% exact match bonus, 20% popularity)
        const combinedScore = (titleSimilarity + artistSimilarity) * 0.4 + 
                            (exactTitleMatch + exactArtistMatch) + 
                            popularityScore * 0.2;

        if (combinedScore > highestScore) {
          highestScore = combinedScore;
          bestMatch = album;
        }
      }

      // Adjust threshold based on whether we found exact matches
      const threshold = sanitizedTitle.toLowerCase() === this.sanitizeTrackName(bestMatch.name).toLowerCase() ? 0.3 : 0.4;
      
      if (highestScore > threshold) {
        return {
          url: bestMatch.external_urls.spotify,
          album_art: bestMatch.images[0].url,
          name: bestMatch.name,
          release_date: bestMatch.release_date,
          total_tracks: bestMatch.total_tracks
        };
      }

      return null;
    } catch (error) {
      console.error('Error searching Spotify:', error);
      throw error;
    }
  }

  calculateSimilarity(str1, str2) {
    const len1 = str1.length;
    const len2 = str2.length;
    const matrix = Array(len1 + 1).fill().map(() => Array(len2 + 1).fill(0));

    for (let i = 0; i <= len1; i++) matrix[i][0] = i;
    for (let j = 0; j <= len2; j++) matrix[0][j] = j;

    for (let i = 1; i <= len1; i++) {
      for (let j = 1; j <= len2; j++) {
        const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] + cost
        );
      }
    }

    return 1 - (matrix[len1][len2] / Math.max(len1, len2));
  }
}

export default SpotifyService;