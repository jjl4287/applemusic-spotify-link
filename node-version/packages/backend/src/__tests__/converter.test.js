import { describe, expect, test, jest } from '@jest/globals';
import ConverterService from '../services/converter.js';

describe('ConverterService', () => {
  const converter = new ConverterService();

  test('validates Apple Music URL correctly', () => {
    const validUrl = 'https://music.apple.com/us/album/test';
    const invalidUrl = 'https://invalid-url.com';

    expect(converter.isValidAppleMusicLink(validUrl)).toBe(true);
    expect(converter.isValidAppleMusicLink(invalidUrl)).toBe(false);
  });

  test('validates Spotify URL correctly', () => {
    const validUrl = 'https://open.spotify.com/track/123';
    const invalidUrl = 'https://invalid-url.com';

    expect(converter.isValidSpotifyLink(validUrl)).toBe(true);
    expect(converter.isValidSpotifyLink(invalidUrl)).toBe(false);
  });

  test('parses Apple Music link correctly', async () => {
    const appleMusicUrl = 'https://music.apple.com/us/album/funeral/1249417623';
    
    global.fetch = jest.fn(() =>
      Promise.resolve({
        text: () => Promise.resolve(`
          <meta property="og:title" content="Funeral" />
          <meta property="og:description" content="Arcade Fire on Apple Music" />
          <meta property="music:type" content="album" />
        `)
      })
    );

    const result = await converter.parseAppleMusicLink(appleMusicUrl);
    expect(result).toEqual({
      title: 'Funeral',
      artist: 'Arcade Fire',
      type: 'album',
      country: 'us',
      id: '1249417623',
      originalUrl: appleMusicUrl
    });
  });

  test('sorts items by relevance correctly', () => {
    const items = [
      { name: 'Test Song', artists: [{ name: 'Test Artist' }], popularity: 50 },
      { name: 'Exact Match', artists: [{ name: 'Exact Artist' }], popularity: 40 },
      { name: 'Another Song', artists: [{ name: 'Another Artist' }], popularity: 60 }
    ];

    const sortedItems = converter.sortByRelevance(items, 'Exact Match', 'Exact Artist');
    expect(sortedItems[0].name).toBe('Exact Match');
  });

  test('throws error for invalid Apple Music URL', async () => {
    const invalidUrl = 'https://invalid-url.com';
    
    await expect(converter.parseAppleMusicLink(invalidUrl))
      .rejects
      .toThrow('Invalid Apple Music URL');
  });
});