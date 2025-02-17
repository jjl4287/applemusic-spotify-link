import express from 'express';
import dotenv from 'dotenv';
import SpotifyService from '../services/spotify.js';
import ConverterService from '../services/converter.js';

// Load environment variables
dotenv.config();

const router = express.Router();
const spotifyService = new SpotifyService();
const converterService = new ConverterService();

// Initialize Spotify service and track initialization status
let spotifyInitialized = false;
let initializationError = null;

spotifyService.initialize()
  .then(() => {
    spotifyInitialized = true;
    console.log('Spotify service initialized successfully');
  })
  .catch(err => {
    initializationError = err;
    console.error('Failed to initialize Spotify service:', err);
  });

// Convert endpoint
router.post('/convert', async (req, res) => {
  // Check if Spotify service is ready
  if (!spotifyInitialized) {
    if (initializationError) {
      return res.status(503).json({
        error: 'Service Unavailable',
        message: 'Spotify service initialization failed. Please try again later.'
      });
    }
    return res.status(503).json({
      error: 'Service Unavailable',
      message: 'Spotify service is initializing. Please try again in a few moments.'
    });
  }

  console.log('Received conversion request:', req.body);
  
  try {
    const { apple_music_url } = req.body;
    
    if (!apple_music_url) {
      console.warn('Request received without URL');
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Apple Music URL is required'
      });
    }

    if (!converterService.isValidAppleMusicLink(apple_music_url)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid Apple Music URL format'
      });
    }

    console.log('Parsing Apple Music link:', apple_music_url);
    // Parse Apple Music link and extract metadata
    const songInfo = await converterService.parseAppleMusicLink(apple_music_url);
    console.log('Extracted song info:', songInfo);
    
    // Search based on content type
    let spotifyData;
    try {
      console.log(`Searching Spotify for ${songInfo.type}:`, {
        title: songInfo.title,
        artist: songInfo.artist
      });

      if (songInfo.type === 'album') {
        spotifyData = await spotifyService.searchAlbum(songInfo.title, songInfo.artist);
      } else if (songInfo.type === 'artist') {
        spotifyData = await spotifyService.searchArtist(songInfo.artist);
      } else {
        spotifyData = await spotifyService.searchTrack(songInfo.title, songInfo.artist);
      }
      
      if (!spotifyData) {
        return res.status(404).json({
          error: 'Not Found',
          message: `No matching ${songInfo.type} found on Spotify`
        });
      }
    } catch (error) {
      console.error('Error searching Spotify:', error);
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to search Spotify. Please try again later.'
      });
    }

    return res.json({
      spotify_url: spotifyData.url,
      title: songInfo.title,
      artist: songInfo.artist,
      content_type: songInfo.type,
      album_art: spotifyData.album_art,
      album: spotifyData.album,
      release_date: spotifyData.release_date,
      genres: spotifyData.genres
    });

  } catch (error) {
    console.error('Error converting link:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: error.message
    });
  }
});

export default router;