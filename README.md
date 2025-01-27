# Apple Music to Spotify Link Converter

A Python script that takes an Apple Music link and finds the corresponding song or album on Spotify, copying the Spotify link to your clipboard.

## Features

- Converts Apple Music links to Spotify links
- Supports both songs and albums
- Automatically copies the Spotify link to clipboard
- Intelligent search matching using track/album name and artist
- Shows search results sorted by popularity

## Prerequisites

- Python 3.x
- Spotify Developer Account (for API credentials)

## Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/applemusic-spotify-link.git
   cd applemusic-spotify-link
   ```

2. Run the setup script to create a virtual environment and install dependencies:
   ```bash
   python setup.py
   ```

3. Activate the virtual environment:
   - On Windows:
     ```bash
     .\venv\Scripts\activate
     ```
   - On macOS/Linux:
     ```bash
     source venv/bin/activate
     ```

4. Create a `.env` file in the project root with your Spotify API credentials:
   ```
   SPOTIFY_CLIENT_ID=your_client_id_here
   SPOTIFY_CLIENT_SECRET=your_client_secret_here
   ```

   To get these credentials:
   1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
   2. Create a new application
   3. Copy the Client ID and Client Secret

## Usage

Run the script with an Apple Music URL as an argument:

```bash
python main.py <apple_music_url>
```

Example:
```bash
python main.py https://music.apple.com/us/album/song-title/123456789
```

## How It Works

The script follows these steps to convert links:

1. **URL Processing**:
   - Takes an Apple Music URL as input
   - Determines if it's a song or album link

2. **Apple Music Data Extraction**:
   - Fetches the webpage content
   - Uses BeautifulSoup to parse the HTML
   - Extracts song/album title and artist information
   - Cleans up the extracted data by removing unnecessary information

3. **Spotify Search**:
   - Authenticates with Spotify API using provided credentials
   - Searches for the song/album using extracted information
   - For tracks: Returns the most popular matching result
   - For albums: Returns the first matching result

4. **Result Handling**:
   - Displays search results and popularity scores
   - Copies the matching Spotify URL to clipboard
   - Shows error messages if no match is found

## Dependencies

- `spotipy`: Spotify API wrapper
- `pyperclip`: Clipboard manipulation
- `requests`: HTTP requests
- `beautifulsoup4`: HTML parsing
- `python-dotenv`: Environment variable management

## Error Handling

The script includes error handling for:
- Invalid Apple Music URLs
- Missing Spotify credentials
- Network connection issues
- No matching results on Spotify

## Contributing

Feel free to submit issues and enhancement requests!

## License

This project is licensed under the terms of the MIT license.
