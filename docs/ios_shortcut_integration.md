# iOS Shortcut Integration Guide

This guide explains how to integrate the Apple Music to Spotify Link Converter with iOS Shortcuts, allowing you to quickly convert Apple Music links to Spotify links on your iOS device.

## Prerequisites

1. Make sure the converter's backend API is running and accessible from your iOS device
2. iOS device with the Shortcuts app installed

## Server Setup

1. Ensure your backend server is running and accessible via HTTPS (required for iOS Shortcuts)
2. Note down your server's URL (e.g., `https://your-server.com`)

## Creating the iOS Shortcut

1. Open the Shortcuts app on your iOS device
2. Tap the + button to create a new shortcut
3. Add the following actions in sequence:

   a. **Share Sheet Input**
      - This allows the shortcut to receive links from the share menu
      - Configure to accept URLs

   b. **URL** action
      - Set the URL to your server's endpoint: `https://your-server.com/convert`

   c. **Get Contents of URL** action
      - Method: POST
      - Request Body: JSON
      - Add the following JSON:
      ```json
      {
          "apple_music_url": "Shortcut Input"
      }
      ```
      - Headers:
        - Content-Type: application/json

   d. **Get Dictionary Value** action
      - Get the "spotify_url" from the response

   e. **Copy to Clipboard** action
      - Copy the Spotify URL to clipboard

   f. **Show Notification** action
      - Display a success message with the converted link

4. Name your shortcut (e.g., "Convert to Spotify")
5. Optional: Add a custom icon and color

## Usage

1. While viewing a song or album in Apple Music, tap the Share button
2. Select your "Convert to Spotify" shortcut from the share sheet
3. The shortcut will convert the link and copy the Spotify URL to your clipboard
4. You'll see a notification when the conversion is complete

## Troubleshooting

- Ensure your server is accessible via HTTPS
- Check that the Apple Music URL is valid
- Verify your server's CORS settings allow requests from iOS devices
- If you receive an error, check the server logs for more details

## Security Considerations

- Consider implementing rate limiting on your server
- Use HTTPS to secure the communication
- Monitor server logs for unusual activity

## Additional Features

You can enhance the shortcut by:
- Adding error handling
- Creating a custom share menu UI
- Adding options to open the Spotify link directly
- Saving conversion history