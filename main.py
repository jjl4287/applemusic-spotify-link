import os
import re
import sys
import requests
import spotipy
import pyperclip
from bs4 import BeautifulSoup
from dotenv import load_dotenv
from spotipy.oauth2 import SpotifyClientCredentials

load_dotenv()

def clean_title(title):
    # Remove anything in parentheses and clean up extra spaces
    cleaned = re.sub(r'\([^)]*\)', '', title)
    return cleaned.strip()

def get_apple_music_info(url):
    try:
        response = requests.get(url)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Determine content type from URL
        content_type = 'album' if '?i=' not in url else 'track'
        
        title_elem = soup.find('meta', property='og:title')
        artist_elem = soup.find('meta', property='music:musician')
        
        if title_elem and artist_elem:
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
        
        spotify = spotipy.Spotify(auth_manager=SpotifyClientCredentials(
            client_id=client_id,
            client_secret=client_secret
        ))
        
        print(f"\nSearching for {content_type}:")
        print(f"Title: '{title}'")
        print(f"Artist: '{artist}'")
        
        if content_type == 'track':
            query = f'track:"{title}"'
            print(f"Search query: {query}")
            results = spotify.search(q=query, type='track', limit=10)
            
            if results['tracks']['items']:
                tracks = sorted(results['tracks']['items'], 
                              key=lambda x: x['popularity'], 
                              reverse=True)
                
                print("\nTop track results by popularity:")
                for track in tracks[:5]:
                    artists = ", ".join(artist['name'] for artist in track['artists'])
                    print(f"- {track['name']} by {artists} (Popularity: {track['popularity']})")
                
                return tracks[0]['external_urls']['spotify']
        else:  # album search
            query = f'album:"{title}" artist:"{artist}"'
            print(f"Search query: {query}")
            results = spotify.search(q=query, type='album', limit=10)
            
            if results['albums']['items']:
                # For albums, just return the first match as they're usually more unique
                album = results['albums']['items'][0]
                artists = ", ".join(artist['name'] for artist in album['artists'])
                print(f"\nFound album: {album['name']} by {artists}")
                return album['external_urls']['spotify']
        
        return None
    except Exception as e:
        print(f"Error searching Spotify: {e}")
        return None

def main():
    if len(sys.argv) != 2:
        print("Usage: python main.py <apple_music_url>")
        return
    
    apple_music_url = sys.argv[1]
    if not apple_music_url.startswith('https://music.apple.com/'):
        print("Error: Invalid Apple Music URL")
        return
    
    print("Fetching Apple Music information...")
    content_type, title, artist = get_apple_music_info(apple_music_url)
    
    if not title or not artist:
        print("Error: Could not extract information from Apple Music")
        return
    
    print(f"Found: {title} by {artist} (Type: {content_type})")
    print("Searching on Spotify...")
    
    spotify_url = search_spotify(title, artist, content_type)
    
    if spotify_url:
        print(f"\nSpotify Link: {spotify_url}")
        pyperclip.copy(spotify_url)
        print("Link copied to clipboard!")
    else:
        print(f"No matching {content_type} found on Spotify")

if __name__ == '__main__':
    main()