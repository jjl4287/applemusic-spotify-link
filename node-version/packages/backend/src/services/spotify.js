import SpotifyWebApi from 'spotify-web-api-node';
import { SecretManagerServiceClient } from '@google-cloud/secret-manager';

class SpotifyService {
  constructor() {
    this.spotifyApi = null;
    this.secretManagerClient = new SecretManagerServiceClient();
  }

  async initialize() {
    try {
      // Fetch secrets from Google Cloud Secret Manager
      const [clientIdResponse] = await this.secretManagerClient.accessSecretVersion({
        name: 'projects/apple-music-to-spotify/secrets/spotify-client-id/versions/1'
      });
      const [clientSecretResponse] = await this.secretManagerClient.accessSecretVersion({
        name: 'projects/apple-music-to-spotify/secrets/spotify-client-secret/versions/1'
      });

      const clientId = clientIdResponse.payload.data.toString();
      const clientSecret = clientSecretResponse.payload.data.toString();

      console.log('Initializing Spotify service with client ID from Secret Manager');
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

  async searchTrack(title, artist) {
    try {
      const query = `track:${title} artist:${artist}`;
      const response = await this.spotifyApi.searchTracks(query, { limit: 50 });
      
      if (!response.body.tracks.items.length) {
        return null;
      }

      const tracks = response.body.tracks.items;
      let bestMatch = tracks[0];
      let highestSimilarity = 0;

      for (const track of tracks) {
        const titleSimilarity = this.calculateSimilarity(title.toLowerCase(), track.name.toLowerCase());
        const artistSimilarity = this.calculateSimilarity(artist.toLowerCase(), track.artists[0].name.toLowerCase());
        const combinedSimilarity = (titleSimilarity + artistSimilarity) / 2;

        if (combinedSimilarity > highestSimilarity) {
          highestSimilarity = combinedSimilarity;
          bestMatch = track;
        }
      }

      if (highestSimilarity > 0.6) {
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
      const query = `album:${title} artist:${artist}`;
      const response = await this.spotifyApi.searchAlbums(query, { limit: 50 });
      
      if (!response.body.albums.items.length) {
        return null;
      }

      const albums = response.body.albums.items;
      let bestMatch = albums[0];
      let highestSimilarity = 0;

      for (const album of albums) {
        const titleSimilarity = this.calculateSimilarity(title.toLowerCase(), album.name.toLowerCase());
        const artistSimilarity = this.calculateSimilarity(artist.toLowerCase(), album.artists[0].name.toLowerCase());
        const combinedSimilarity = (titleSimilarity + artistSimilarity) / 2;

        if (combinedSimilarity > highestSimilarity) {
          highestSimilarity = combinedSimilarity;
          bestMatch = album;
        }
      }

      if (highestSimilarity > 0.6) {
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