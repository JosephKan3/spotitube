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
        this.state = {
            searchResults: [],
            playlist: {
                playlistName: "Enter Playlist Name Here",
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
            axios.get("https://spotitubev2.herokuapp.com/youtube/getAuthUrl").then(response => {
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
                axios.get("https://spotitubev2.herokuapp.com/youtube/token", {params: {
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
            axios.get("https://spotitubev2.herokuapp.com/youtube/playlist", {params: {
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
        axios.get("https://spotitubev2.herokuapp.com/spotify/searchToken").then(response => {
            for (let i = 0; i < trackNames.length; i++) {
                searchPromises.push(
                    axios.get("https://spotitubev2.herokuapp.com/spotify/search", {params: {
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
        axios.get("https://spotitubev2.herokuapp.com/spotify/searchToken").then(response => {
            axios.get("https://spotitubev2.herokuapp.com/spotify/search", {params: {
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
            axios.get("https://spotitubev2.herokuapp.com/spotify/getAuthUrl").then(response => {
                localStorage.setItem("state", JSON.stringify(this.state))
                let authUrl = response.data
                window.location.replace(authUrl)
            })
        })
    }

    getSpotifyAccessToken(authCode) {
        return new Promise((resolve, reject) => {
            if (this.state.spotifyRedirect) {
                axios.get("https://spotitubev2.herokuapp.com/spotify/token", {params: {
                    authCode:authCode,
                }}).then(response => {
                    this.setState({
                        spotifyCredentials: response.data,
                        spotifyRedirect: false
                    }, () => {
                        localStorage.setItem("state", JSON.stringify(this.state))
                        resolve()
                    })
                }).catch((error) => {
                    reject(error)
                })
            }
        })

    }

    async savePlaylist() {
        return new Promise(async (resolve, reject) => {
            // If credentials are stored
            let hasCreds = this.state.spotifyCredentials.access_token !== undefined
            if (!hasCreds) {
                // If not redirected
                if (!this.state.spotifyRedirect) {
                    console.log("ONE")
                    this.getSpotifyAuthUrl()
                    reject("authenticating")
                // If auth code found
                } else {
                    console.log("TWO")
                    let authCode = decodeURIComponent(window.location.href.match(/code=([^&]*)/)[1])
                    await this.getSpotifyAccessToken(authCode)
                }
            }
            // Execute save request
            let playlistTrackUris = this.state.playlist.playlistTracks.map(track => {
                return track.uri
            })
            console.log("THREE")
            axios.get("https://spotitubev2.herokuapp.com/spotify/savePlaylist", {params: {
                playlistName: this.state.playlist.playlistName,
                playlistTracks: encodeURIComponent(JSON.stringify(playlistTrackUris)),
                credentials: this.state.spotifyCredentials
            }}).then(response => {
                // If no error in status, render saved notification
                if (response.status < 400) {
                    // Update credentials in case of refresh access token
                    this.setState({spotifyCredentials: response.data})
                    resolve("saved")
                // If error in status, render error notification
                } else {
                    resolve("error")
                }
            })            
        }) 

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
                            name={this.state.playlist.playlistName}
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
