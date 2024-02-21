# Spotitube

Spotitube is a cutting-edge web application designed to bridge the gap between Spotify and YouTube, providing users with an innovative platform for managing music playlists across these two popular services. This app allows users to seamlessly search for music on Spotify, create and edit custom playlists, and even import YouTube playlists directly into Spotify.

Visit the deployment here: https://spotitube-khaki.vercel.app/

## Features

- **Import YouTube Playlists:** Conveniently import playlists from YouTube directly into your Spotitube playlist, making it easier to manage all your music in one place.
- **Search Music:** Quickly search for your favorite tracks on Spotify using the Spotitube search functionality.
- **Create Playlists:** Compile your favorite songs into unique playlists with custom names.
- **Edit Playlists:** Add or remove tracks from your playlists, rename them, or clear them entirely with ease.
- **Responsive Design:** Enjoy a seamless experience across various devices, thanks to the app's responsive design.

### Usage

Use the Search Bar to find tracks on Spotify.
Add tracks to your playlist by clicking on the "+" button next to each search result.
Remove tracks from your playlist using the "-" button next to each track in your playlist.
Import YouTube playlists by entering the playlist URL and clicking the "Import Youtube Playlist" button.
Save your playlist to Spotify by clicking the "Save to Spotify" button.

## Privacy

### Commitment to Privacy

Spotitube is committed to your privacy. We believe in transparency and are committed to being upfront about our privacy practices, including how we treat your personal information.

### User Data

Spotitube is designed with respect for user privacy and does not store any personal data. The application performs all operations in a stateless manner, ensuring that no user data is retained after the session ends.

### Open Source Transparency

The project is open source, allowing anyone to inspect, modify, and enhance the code. By being open source, Spotitube allows for peer review and community auditing of the privacy practices.

### Backend Interactions

The backend serves as a bridge for authentication and communication between Spotify and YouTube services. However, it does not log or retain any personal information or data about the requests it processes. The source code for the backend is available for review at the [Spotitube GitHub repository](https://github.com/JosephKan3/spotitube) under `src/backend`.

### Authorization and Tokens

Authentication tokens are used to interact with Spotify and YouTube APIs and are only transiently present during active sessions. Users grant temporary access to their Spotify and YouTube accounts to facilitate the synchronization of playlists, but no credentials are ever stored by Spotitube.

### Security Practices

While Spotitube uses industry-standard OAuth 2.0 protocols for authorization with Spotify and YouTube APIs, users are encouraged to review the scopes of access they grant and to revoke access from their Spotify and YouTube account settings if they no longer wish to use Spotitube.

### No Tracking or Analytics

Spotitube does not use any form of tracking or analytics. We do not have any third-party scripts that compromise your privacy.

### Contributions to Privacy

As an open source project, we welcome contributions and suggestions on how to improve the privacy aspects of Spotitube. If you have ideas or concerns, please contribute to the project or open an issue on the GitHub repository.

### Contact

If you have any questions regarding privacy while using Spotitube, or have questions about our practices, please contact us via an issue on the GitHub repository.

This privacy notice is subject to change without notice. We recommend reviewing it periodically.
