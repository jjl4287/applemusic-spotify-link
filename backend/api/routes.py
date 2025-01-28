from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from backend.core.models import ConversionRequest, ConversionResponse
from backend.core.converter import get_apple_music_info, search_spotify
from backend.config import Config

app = FastAPI(
    title=Config.API_TITLE,
    description=Config.API_DESCRIPTION,
    version=Config.API_VERSION
)

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=Config.CORS_ORIGINS,
    allow_credentials=Config.CORS_CREDENTIALS,
    allow_methods=Config.CORS_METHODS,
    allow_headers=Config.CORS_HEADERS,
)

@app.post("/convert", response_model=ConversionResponse)
async def convert_link(request: ConversionRequest):
    if not request.apple_music_url.startswith('https://music.apple.com/'):
        raise HTTPException(status_code=400, detail="Invalid Apple Music URL")
    
    content_type, title, artist = get_apple_music_info(request.apple_music_url)
    
    if not title or not artist:
        raise HTTPException(status_code=404, detail="Could not extract information from Apple Music")
    
    spotify_data = search_spotify(title, artist, content_type)
    
    if not spotify_data:
        return ConversionResponse(
            spotify_url=None,
            title=title,
            artist=artist,
            content_type=content_type,
            error=f"No matching {content_type} found on Spotify"
        )
    
    return ConversionResponse(
        spotify_url=spotify_data["url"],
        title=title,
        artist=artist,
        content_type=content_type,
        album_art=spotify_data["album_art"],
        album=spotify_data["album"],
        release_date=spotify_data["release_date"],
        error=None
    )

@app.get("/health")
async def health_check():
    return {"status": "healthy"}