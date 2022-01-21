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
            spotifyToken: {},
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


        // Fetching local state
        let localState = JSON.parse(localStorage.getItem("state"))
        if (localState != null) {
            this.state = localState
        }
        // if (this.state.youtubeRedirect) {
        //     this.getYoutubeAccessToken()
        // }
        // if (this.state.spotifyRedirect) {
        //     this.getSpotifyAccessToken()
        // }
    }


    async search(query) {
        console.log(`Searching for: ${query}.`)
        window.open("https://spotitubev2.herokuapp.com/spotify/search?query=Uptown%20funk")
        fetch(`https://spotitubev2.herokuapp.com/spotify/search?query=${query}`).then((response) => {
            window.open(response)
            console.log(response)
            this.setState({searchResults: response})
        })
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
            }})
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
            }})
        }
    }

    updatePlaylistName(name) {
        this.setState({playlist: {
            playlistName: name,
            playlistTracks: this.state.playlist.playlistTracks
        }})
    }



    getSpotifyAccessToken() {
        if (this.state.spotifyRedirect) {
            let authCode = decodeURIComponent(window.location.href.match(/code=([^&]*)/)[1])
            axios.get("http://127.0.0.1:5000/youtube/token", {params: {
                authCode:authCode,
            }}).then(response => {
                console.log(response)
                this.setState({
                    spotifyToken: response.request.responseText,
                    spotifyRedirect: false
                }, () => {
                    localStorage.setItem("state", JSON.stringify(this.state))
                })
            })
        }
    }

    getYoutubeAuthUrl() {
        this.setState({youtubeRedirect: true}, () => {
            localStorage.setItem("state", JSON.stringify(this.state))
            fetch(`http://127.0.0.1:5000/youtube/getAuthUrl`).then(response => {
                return response.text()
            }).then(responseText => {
                window.location.replace(responseText)
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
                credentials:this.state.youtubeCredentials
            }}).then(response => {
                let youtubeTrackList = response.data
                for (let i = 0; i < youtubeTrackList.length; i++) {
                    // TODO: Handle response with Spotify
                    console.log(youtubeTrackList[i])
                }
            })
        // Begin auth code flow
        } else {
            this.getYoutubeAuthUrl()
        }
    }



    async savePlaylist() {
        let trackUris = this.state.playlist.playlistTracks.map(track => {
            return track.uri
        })

        // let tracks = await axios.get("https://spotitubev2.herokuapp.com/spotify/search", {
        // })
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
