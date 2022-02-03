import axios from 'axios'
import {v4 as uuidv4} from "uuid"
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
            spotifyRedirect: false,
            playlistID: "",
            searchQuery: ""
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
        this.updatePlaylistID = this.updatePlaylistID.bind(this)
        this.updateSearchQuery = this.updateSearchQuery.bind(this)
        this.clearPlaylist = this.clearPlaylist.bind(this)

        // Fetching local state
        let localState = JSON.parse(localStorage.getItem("state"))
        if (localState != null) {
            this.state = localState
        }
    }

    handleRemoval(track) {
        let tracks = this.state.playlist.playlistTracks
        let trackPosition = -1
        // Removing error tracks
        if (track.notFound) {
            for (let trackNum = 0; trackNum < tracks.length; trackNum++) {
                if (track.trackName === tracks[trackNum].trackName) {
                    trackPosition = trackNum
                }
            }
        } else {
            // Removing fully formed tracks
            for (let trackNum = 0; trackNum < tracks.length; trackNum++) {
                if (track.key === tracks[trackNum].key) {
                    trackPosition = trackNum
                }
            }
        }

        // If track still not found, returns
        if (trackPosition === -1) {
            return
        // Removing track from tracklist
        } else {
            tracks.splice(trackPosition, 1)
            this.setState({playlist: {
                playlistName: this.state.playlist.playlistName,
                playlistTracks: tracks
            }}, () => {
                localStorage.setItem("state", JSON.stringify(this.state))
            })
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

    updatePlaylistID(playlistID) {
        this.setState({playlistID: playlistID})
    }

    updateSearchQuery(query) {
        this.setState({searchQuery: query})
    }

    updatePlaylistName(name) {
        this.setState({playlist: {
            playlistName: name,
            playlistTracks: this.state.playlist.playlistTracks
        }})
    }

    clearPlaylist() {
        this.setState({
            playlist: {
                playlistName: "Enter Playlist Name Here",
                playlistTracks: []
            }
        }, () => {
            localStorage.setItem("state", JSON.stringify(this.state))
        })
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

    async findYoutubePlaylist(playlistInput) {
        // If authenticated
        let hasCreds = this.state.youtubeCredentials.token !== undefined
        let tokenFound = false
        if (!hasCreds) {
            // If creds are not stored, check for an auth code in URL
            tokenFound = await this.getYoutubeAccessToken().catch(() => {
                tokenFound = false
            })
        }

        let playlistID = playlistInput
        // Parse Playlist ID
        if (playlistInput.match(/list=([^&])*/)) {
            playlistID = playlistInput.match(/list=([^&])*/)[0].slice(5)
            console.log(playlistID)
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
        // Filters out (Official Video) and [Official Video] tags that break the Spotify search query
        let cleanTrackNames = trackNames.map((trackName) => {
            return trackName.split("(")[0].split("[")[0]
        })
        let searchPromises = []
        axios.get("http://127.0.0.1:5000/spotify/searchToken").then(response => {
            for (let i = 0; i < trackNames.length; i++) {
                searchPromises.push(
                    axios.get("http://127.0.0.1:5000/spotify/search", {params: {
                        query: cleanTrackNames[i],
                        token: response.data
                    }})
                )
            }
            Promise.all(searchPromises).then((responses) => {
                let ytPlaylist = []
                for (let i = 0; i < responses.length; i++) {
                    let recommendation = responses[i].data[0]
                    // If no recommendation was generated by spotify, return an error track with a uuid
                    if (recommendation === undefined) {
                        ytPlaylist.push({
                            notFound: true,
                            trackName: trackNames[i],
                            key: uuidv4(),
                            duplicate: false
                        })
                    } else {
                        // Filters out duplicate search results -- likely indicates an inaccurate search O(n^2), TODO?
                        let duplicate = false
                        let duplicateName = ""
                        for (let j = 0; j < ytPlaylist.length; j++) {
                            if (recommendation.key === ytPlaylist[j].key) {
                                duplicate = true
                                duplicateName = trackNames[j]
                                break
                            }
                        }
                        // Returns a duplicate song object
                        if (duplicate) {
                            ytPlaylist.push({
                                notFound: true,
                                trackName: trackNames[i],
                                key: uuidv4(),
                                duplicate: true,
                                duplicateName: duplicateName,
                                recommendationName: recommendation.name
                            })
                            continue
                        } else {
                            ytPlaylist.push(recommendation)
                        }
                    }
                }
                console.log(ytPlaylist)
                this.setState({
                    playlist: {
                        playlistName: this.state.playlist.playlistName,
                        playlistTracks: ytPlaylist
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
        return new Promise((resolve, reject) => {
            if (this.state.spotifyRedirect) {
                axios.get("http://127.0.0.1:5000/spotify/token", {params: {
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
                if (track.notFound) {
                    return undefined
                } else {
                    return track.uri
                }
            })
            let filteredTrackUris = playlistTrackUris.filter(track => {
                return track !== undefined
            })

            // Only sends 50 tracks at a time due to query string limits
            let start = 0
            let currentTrackUris = filteredTrackUris.slice(start, start + 50)
            console.log(currentTrackUris)
            axios.get("http://127.0.0.1:5000/spotify/savePlaylist", {params: {
                playlistName: this.state.playlist.playlistName,
                playlistTracks: encodeURIComponent(JSON.stringify(currentTrackUris)),
                credentials: this.state.spotifyCredentials
            }}).then(response => {
                // If no error in status, render saved notification
                if (response.status < 400) {
                    // Update credentials in case of refresh access token
                    this.setState({spotifyCredentials: response.data.credentials})
                    playlistID = response.data.playlistID
                    // Continue sending requests untill all of the filteredTrackUris have been added
                    while (true) {
                        start += 50
                        currentTrackUris = filteredTrackUris.slice(start, start + 50)
                        if (currentTrackUris.length === 0) {

                        }
                    }

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
                        onUpdate={this.updateSearchQuery}
                        searchQuery={this.state.searchQuery}
                    />
                    <YoutubeButton
                        onFindYoutube={this.findYoutubePlaylist}
                        onSign={this.getYoutubeAuthUrl}
                        onUpdate={this.updatePlaylistID}
                        playlistID={this.state.playlistID}
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
                            onLogin={this.getSpotifyAuthUrl}
                            onSave={this.savePlaylist}
                            onClear={this.clearPlaylist}
                        />
                    </div>
                </div>
            </div>
 
          )
    }
}

export default App;
