import os
import re
import requests
import spotipy
from bs4 import BeautifulSoup
from spotipy.oauth2 import SpotifyClientCredentials
from difflib import SequenceMatcher

def similarity(a, b):
    return SequenceMatcher(None, a, b).ratio()

def clean_title(title):
    # Remove anything in parentheses, square brackets, and curly braces
    cleaned = re.sub(r'[\(\[\{][^\)\]\}]*[\)\]\}]', '', title)
    return cleaned.strip()

def get_apple_music_info(url):
    try:
        response = requests.get(url)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Determine content type from URL
        if '/artist/' in url:
            content_type = 'artist'
        else:
            content_type = 'album' if '?i=' not in url else 'track'
        
        title_elem = soup.find('meta', property='og:title')
        artist_elem = soup.find('meta', property='music:musician')
        
        if content_type == 'artist':
            title_elem = soup.find('meta', property='og:title')
            if title_elem:
                # Extract just the artist name without any duplicates
                artist = clean_title(title_elem['content'].split(' on Apple')[0].strip())
                # Remove any 'by artist' pattern if present
                if ' by ' in artist:
                    artist = artist.split(' by ')[0].strip()
                return content_type, artist, artist
        elif title_elem and artist_elem:
            full_title = title_elem['content'].split(' on Apple')[0].strip()
            title = full_title.split(' by ')[0].strip()
            artist = full_title.split(' by ')[1].strip()
            
            # Clean titles by removing parenthetical information
            title = clean_title(title)
            artist = clean_title(artist)
            
            return content_type, title, artist
        return None, None, None
    except Exception as e:
        print(f"Error fetching Apple Music info: {e}")
        return None, None, None

def search_spotify(title, artist, content_type='track'):
    try:
        client_id = os.getenv('SPOTIFY_CLIENT_ID')
        client_secret = os.getenv('SPOTIFY_CLIENT_SECRET')
        
        if not client_id or not client_secret:
            print("Error: Spotify credentials not found.")
            return None
        
        sp = spotipy.Spotify(auth_manager=SpotifyClientCredentials(
            client_id=client_id,
            client_secret=client_secret
        ))
        
        # Search query
        if content_type == 'artist':
            # For artist searches, use a single clean artist name
            query = f'artist:"{artist}"'
        else:
            query = f"{title} artist:{artist}"
        search_type = content_type
        
        results = sp.search(q=query, type=search_type, limit=10)
        items = results[f"{search_type}s"]["items"]
        
        if not items:
            return None
        
        # Find best match
        best_match = None
        highest_similarity = 0
        
        for item in items:
            if content_type == 'artist':
                item_name = clean_title(item["name"])
                name_sim = similarity(artist.lower(), item_name.lower())
                combined_sim = name_sim
            else:
                item_title = clean_title(item["name"])
                item_artist = clean_title(item["artists"][0]["name"])
                title_sim = similarity(title.lower(), item_title.lower())
                artist_sim = similarity(artist.lower(), item_artist.lower())
                combined_sim = (title_sim + artist_sim) / 2
            
            if combined_sim > highest_similarity:
                highest_similarity = combined_sim
                best_match = item
        
        # More lenient similarity threshold for artist searches and classical music
        similarity_threshold = 0.3 if content_type == 'artist' else (0.4 if 'classical' in query.lower() else 0.6)
        
        if best_match and highest_similarity > similarity_threshold:
            spotify_url = best_match["external_urls"]["spotify"]
            album_art = best_match["album"]["images"][0]["url"] if content_type == "track" else best_match["images"][0]["url"]
            album = best_match["album"]["name"] if content_type == "track" else None
            release_date = best_match["album"]["release_date"] if content_type == "track" else best_match["release_date"]
            
            return {
                "url": spotify_url,
                "album_art": album_art,
                "album": album,
                "release_date": release_date
            }
        
        return None
    except Exception as e:
        print(f"Error searching Spotify: {e}")
        return None