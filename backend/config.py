import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    SPOTIFY_CLIENT_ID = os.getenv('SPOTIFY_CLIENT_ID')
    SPOTIFY_CLIENT_SECRET = os.getenv('SPOTIFY_CLIENT_SECRET')
    
    # API Settings
    API_TITLE = "Apple Music to Spotify Converter API"
    API_DESCRIPTION = "API for converting Apple Music links to Spotify links"
    API_VERSION = "1.0.0"
    
    # CORS Settings
    CORS_ORIGINS = ["*"]  # In production, replace with specific origins
    CORS_CREDENTIALS = True
    CORS_METHODS = ["*"]
    CORS_HEADERS = ["*"]