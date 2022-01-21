import logo from './logo.svg';
import axios from 'axios'
import './App.css';
import React from 'react';
import SearchResults from './components/SearchResults';
import NavigationBar from './components/NavigationBar';
import SearchBar from './components/SearchBar';
import Playlist from './components/Playlist';
import YoutubeButton from './components/YoutubeButton';

class App extends React.Component {
    constructor(props) {
        super(props)

        this.sampleTracks = [
            {
                name: "Gangnam Style",
                artist: "Psy",
                album: "Culture", 
                key: "45675468576324542",
                image: "https://i.scdn.co/image/ab67616d0000b2736cfc57e5358c5e39e79bccbd"
            }, {
                name: "Dynamite",
                artist: "Captain Sparklez",
                album: "Minecrack", 
                key: "4327533534931",
                image: "https://i.scdn.co/image/ab67616d0000b2736cfc57e5358c5e39e79bccbd"
            }
        ]


        this.state = {
            searchResults: this.sampleTracks,
            playlist: {
                playlistName: "Playlist Name",
                playlistTracks: []
            },
            youtubeCredentials: {},
            youtubeRedirect: false,
            spotifyCredentials: {},
            spotifyRedirect: false
        }

        this.handleAdd = this.handleAdd.bind(this)
        this.handleRemoval = this.handleRemoval.bind(this)
        this.updatePlaylistName = this.updatePlaylistName.bind(this)
        this.savePlaylist = this.savePlaylist.bind(this)
        this.search = this.search.bind(this)
        this.findYoutubePlaylist = this.findYoutubePlaylist.bind(this)
        this.getYoutubeAccessToken = this.getYoutubeAccessToken.bind(this)
        this.getSpotifyAccessToken = this.getSpotifyAccessToken.bind(this)
        this.getYoutubeAuthUrl = this.getYoutubeAuthUrl.bind(this)
        this.getSpotifyAuthUrl = this.getSpotifyAuthUrl.bind(this)


        // Fetching local state
        let localState = JSON.parse(localStorage.getItem("state"))
        if (localState != null) {
            this.state = localState
        }
    }



    
    handleRemoval(track) {
        let tracks = this.state.playlist.playlistTracks
        let trackPosition = -1
        for (let trackNum = 0; trackNum < tracks.length; trackNum++) {
            if (track.key === tracks[trackNum].key) {
                trackPosition = trackNum
            }
        }
        if (trackPosition === -1) {
            return
        } else {
            tracks.splice(trackPosition, 1)
            console.log(this.state.searchResults)
            this.setState({playlist: {
                playlistName: this.state.playlist.playlistName,
                playlistTracks: tracks
            }}, () => {
                localStorage.setItem("state", JSON.stringify(this.state))
            })
            console.log(this.state.searchResults)
        }
    }

    handleAdd(track) {
        let tracks = this.state.playlist.playlistTracks
        if (tracks.find(searchTrack => {
            return track.key === searchTrack.key
        })) {
            return
        } else {
            tracks.push(track)
            this.setState({playlist: {
                playlistName: this.state.playlist.playlistName,
                playlistTracks: tracks
            }}, () => {
                localStorage.setItem("state", JSON.stringify(this.state))
            })
        }
    }

    updatePlaylistName(name) {
        this.setState({playlist: {
            playlistName: name,
            playlistTracks: this.state.playlist.playlistTracks
        }})
    }

    getYoutubeAuthUrl() {
        this.setState({youtubeRedirect: true}, () => {
            localStorage.setItem("state", JSON.stringify(this.state))
            axios.get("http://127.0.0.1:5000/youtube/getAuthUrl").then(response => {
                let authUrl = response.data
                window.location.replace(authUrl)
            })
        })
    }

    getYoutubeAccessToken() {
        return new Promise((resolve, reject) => {
            try {
                let authCode = decodeURIComponent(window.location.href.match(/code=([^&]*)/)[1])
                let authState = decodeURIComponent(window.location.href.match(/state=([^&]*)/)[1])
                axios.get("http://127.0.0.1:5000/youtube/token", {params: {
                    authCode:authCode,
                    authState:authState
                }}).then(response => {
                    let credentials = JSON.parse(response.request.responseText)
                    this.setState({
                        youtubeCredentials: credentials,
                        youtubeRedirect: false
                    }, () => {
                        localStorage.setItem("state", JSON.stringify(this.state))
                        resolve(true)
                    })
                }).catch(error => {
                    reject(false)
                })
            } catch {
                reject(false)
            }
        })
    }

    async findYoutubePlaylist(playlistID) {
        // If authenticated
        let hasCreds = this.state.youtubeCredentials.token !== undefined
        let tokenFound = false
        if (!hasCreds) {
            // If creds are not stored, check for an auth code in URL
            tokenFound = await this.getYoutubeAccessToken().catch(() => {
                tokenFound = false
            })
        }
        // If either credentials or auth code are found, send request
        if (tokenFound || hasCreds) {
            axios.get("http://127.0.0.1:5000/youtube/playlist", {params: {
                playlistID:playlistID,
                filter: false,
                credentials: this.state.youtubeCredentials
            }}).then(response => {
                let youtubeTrackList = response.data
                this.bulkSearch(youtubeTrackList)
            })
        // Begin auth code flow
        } else {
            this.getYoutubeAuthUrl()
        }
    }

    async bulkSearch(trackNames) {
        console.log(trackNames)
        let searchPromises = []
        axios.get("http://127.0.0.1:5000/spotify/searchToken").then(response => {
            for (let i = 0; i < trackNames.length; i++) {
                searchPromises.push(
                    axios.get("http://127.0.0.1:5000/spotify/search", {params: {
                        query: trackNames[i],
                        token: response.data
                    }})
                )
            }
            Promise.all(searchPromises).then((responses) => {
                let ytPlaylist = responses.map((response) => {
                    // Selecting best recommendation from Spotify
                    return response.data[0]
                })
                let filtedYtPlaylist = ytPlaylist.filter((track) => {
                    return track !== undefined
                })
                console.log(filtedYtPlaylist)
                this.setState({
                    playlist: {
                        playlistName: this.state.playlistName,
                        playlistTracks: filtedYtPlaylist
                    }}, () => {
                    localStorage.setItem("state", JSON.stringify(this.state))
                })
            })
        })
    }

    // Spotify Search does not require OAuth
    search(query) {
        console.log(`Searching for: ${query}.`)
        axios.get("http://127.0.0.1:5000/spotify/searchToken").then(response => {
            axios.get("http://127.0.0.1:5000/spotify/search", {params: {
                query: query,
                token: response.data
            }}).then((response) => {
                this.setState({searchResults: response.data}, () => {
                    localStorage.setItem("state", JSON.stringify(this.state))
                })
            })
        })
    }

    // Spotify Save requires OAuth
    getSpotifyAuthUrl() {
        this.setState({spotifyRedirect: true}, () => {
            axios.get("http://127.0.0.1:5000/spotify/getAuthUrl").then(response => {
                localStorage.setItem("state", JSON.stringify(this.state))
                let authUrl = response.data
                window.location.replace(authUrl)
            })
        })
    }

    getSpotifyAccessToken(authCode) {
        if (this.state.spotifyRedirect) {
            axios.get("http://127.0.0.1:5000/spotify/token", {params: {
                authCode:authCode,
            }}).then(response => {
                this.setState({
                    spotifyCredentials: response.data,
                    spotifyRedirect: false
                }, () => {
                    localStorage.setItem("state", JSON.stringify(this.state))
                })
            })
        }
    }

    async savePlaylist() {
        // If credentials are stored
        let hasCreds = this.state.spotifyCredentials.access_token !== undefined
        if (!hasCreds) {
            console.log("No creds")
            // If auth code not found in URL
            if (window.location.href.match(/code=([^&]*)/) === null) {
                this.getSpotifyAuthUrl()
            // If auth code found
            } else {
                console.log("getting code")
                let authCode = decodeURIComponent(window.location.href.match(/code=([^&]*)/)[1])
                this.getSpotifyAccessToken(authCode)
            }
        }
        // Execute save request
        let playlistTrackUris = this.state.playlist.playlistTracks.map(track => {
            return track.uri
        })
        axios.get("http://127.0.0.1:5000/spotify/savePlaylist", {params: {
            playlistName: this.state.playlist.playlistName,
            playlistTracks: encodeURIComponent(JSON.stringify(playlistTrackUris)),
            credentials: this.state.spotifyCredentials
        }})
    }

    render() {
        return (
            <div className='App'>
                <div className="SpotifyBox">
                    <NavigationBar></NavigationBar>
                    <SearchBar
                        onSearch={this.search}
                    />
                    <YoutubeButton
                        onFindYoutube={this.findYoutubePlaylist}
                        onSign={this.getYoutubeAuthUrl}
                    ></YoutubeButton>
                    <div className='Tracks'>
                        <SearchResults
                            tracks={this.state.searchResults}
                            isRemoval={false}
                            onAdd={this.handleAdd}
                        />
                        <Playlist
                            onNameChange={this.updatePlaylistName}
                            tracks={this.state.playlist.playlistTracks}
                            isRemoval={true}
                            onRemoval={this.handleRemoval}
                            onSave={this.savePlaylist}
                        />
                    </div>
                </div>
            </div>
 
          )
    }
}

export default App;
