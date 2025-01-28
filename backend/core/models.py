from pydantic import BaseModel
from typing import Optional

class ConversionRequest(BaseModel):
    apple_music_url: str

class ConversionResponse(BaseModel):
    spotify_url: Optional[str] = None
    title: str
    artist: str
    content_type: str
    error: Optional[str] = None
    album_art: Optional[str] = None
    album: Optional[str] = None
    release_date: Optional[str] = None