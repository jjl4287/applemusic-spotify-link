import pytest
from unittest.mock import patch, MagicMock
from backend.core.converter import get_apple_music_info, search_spotify, clean_title

def test_clean_title():
    assert clean_title("Song Name (Live Version)") == "Song Name"
    assert clean_title("Album Title (Deluxe Edition)") == "Album Title"
    assert clean_title("Track (feat. Artist)") == "Track"

@patch('backend.core.converter.requests.get')
def test_get_apple_music_info_track(mock_get):
    mock_response = MagicMock()
    mock_response.text = '''
    <meta property="og:title" content="Song Title by Artist Name on Apple Music" />
    <meta property="music:musician" content="Artist Name" />
    '''
    mock_get.return_value = mock_response

    content_type, title, artist = get_apple_music_info('https://music.apple.com/us/album/song?i=123')
    assert content_type == 'track'
    assert title == 'Song Title'
    assert artist == 'Artist Name'

@patch('backend.core.converter.requests.get')
def test_get_apple_music_info_album(mock_get):
    mock_response = MagicMock()
    mock_response.text = '''
    <meta property="og:title" content="Album Title by Artist Name on Apple Music" />
    <meta property="music:musician" content="Artist Name" />
    '''
    mock_get.return_value = mock_response

    content_type, title, artist = get_apple_music_info('https://music.apple.com/us/album/123')
    assert content_type == 'album'
    assert title == 'Album Title'
    assert artist == 'Artist Name'

@patch('backend.core.converter.spotipy.Spotify')
def test_search_spotify_track(mock_spotify):
    mock_spotify_instance = MagicMock()
    mock_spotify_instance.search.return_value = {
        'tracks': {
            'items': [{
                'name': 'Song Title',
                'artists': [{'name': 'Artist Name'}],
                'popularity': 80,
                'external_urls': {'spotify': 'https://open.spotify.com/track/123'}
            }]
        }
    }
    mock_spotify.return_value = mock_spotify_instance

    with patch.dict('os.environ', {'SPOTIFY_CLIENT_ID': 'test', 'SPOTIFY_CLIENT_SECRET': 'test'}):
        result = search_spotify('Song Title', 'Artist Name', 'track')
        assert result == 'https://open.spotify.com/track/123'

@patch('backend.core.converter.spotipy.Spotify')
def test_search_spotify_album(mock_spotify):
    mock_spotify_instance = MagicMock()
    mock_spotify_instance.search.return_value = {
        'albums': {
            'items': [{
                'name': 'Album Title',
                'artists': [{'name': 'Artist Name'}],
                'external_urls': {'spotify': 'https://open.spotify.com/album/123'}
            }]
        }
    }
    mock_spotify.return_value = mock_spotify_instance

    with patch.dict('os.environ', {'SPOTIFY_CLIENT_ID': 'test', 'SPOTIFY_CLIENT_SECRET': 'test'}):
        result = search_spotify('Album Title', 'Artist Name', 'album')
        assert result == 'https://open.spotify.com/album/123'