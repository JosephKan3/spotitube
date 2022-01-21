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
            youtubeAccessToken: "",
            youtubeRedirect: false,
            spotifyAccessToken: "",
            spotifyRedirect: false

        }

        this.handleAdd = this.handleAdd.bind(this)
        this.handleRemoval = this.handleRemoval.bind(this)
        this.updatePlaylistName = this.updatePlaylistName.bind(this)
        this.savePlaylist = this.savePlaylist.bind(this)
        this.search = this.search.bind(this)
        this.findYoutubePlaylist = this.findYoutubePlaylist.bind(this)

        // Fetching local state
        let localState = JSON.parse(localStorage.getItem("state"))
        if (localState != null) {
            this.state = localState
            // Fetching auth tokens following redirect
            if (this.state.youtubeRedirect) {
                console.log("HELLOOOOO")
                let authCode = decodeURIComponent(window.location.href.match(/code=([^&]*)/)[1])
                let authState = decodeURIComponent(window.location.href.match(/state=([^&]*)/)[1])
                console.log(authCode)
                console.log(authState)

                axios.get("http://127.0.0.1:5000/youtube/token", {params: {authCode:authCode, authState:authState}}).then((response) => {
                    this.state.youtubeAccessToken = response.request.responseText
                    this.state.youtubeRedirect = false
                    localStorage.setItem("state", JSON.stringify(this.state))
                })
            }
            if (this.state.spotifyRedirect) {
                let authCode = decodeURIComponent(window.location.href.match(/code=([^&]*)/)[1])
                axios.get("http://127.0.0.1:5000/spotify/token", {params: {authCode:authCode}}).then((response) => {
                    this.state.spotifyAccessToken = response.request.responseText
                    this.state.spotifyRedirect = false
                })
            }
        }
        localStorage.setItem("state", JSON.stringify(this.state))
    }

    async search(query) {
        console.log(`Searching for: ${query}.`)
        window.open("https://spotitubev2.herokuapp.com/spotify/search?query=Uptown%20funk")
        axios.get("https://spotitubev2.herokuapp.com/spotify/search", {params: {
            query: query
        }}).then((response) => {
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

    findYoutubePlaylist(playlistID) {
        // Saving local state before redirect
        // Starting Youtube Authorization Code Flow if no token
        console.log(this.state.youtubeAccessToken)
        if (!this.state.youtubeAccessToken) {
            this.setState({youtubeRedirect: true}, () => {
                localStorage.setItem("state", JSON.stringify(this.state))
                axios.get("http://127.0.0.1:5000/youtube/getAuthUrl").then((response) => {
                    let authURL = response.request.responseText
                    window.location.replace(authURL)
                })
            })

        } else {
            axios.get("http://127.0.0.1:5000/youtube/playlist", {params: {playlistID: playlistID, filter: false}}).then((response) => {
                let authURL = response.request.responseText
                // TODO: Handle response
            })
        }
    }

    getYoutubeAccessToken() {
        axios.get("http://127.0.0.1:5000/youtube/playlist/PLQAo3WtfNEjVPqQXmCFpt3gyLb9abaq_2/false").then((response) => {
            let authURL = response.request.responseText
            // window.open(authURL)
            console.log(this.state)
            localStorage.setItem("state", this.state)
            console.log(localStorage.getItem("state"))
            window.location.replace(authURL)
            console.log(authURL)
        })
    }

    async savePlaylist() {
        let trackUris = this.state.playlist.playlistTracks.map(track => {
            return track.uri
        })

        let tracks = await axios.get("https://spotitubev2.herokuapp.com/spotify/search", {
        })
    }

    render() {
        console.log("RENDER")
        return (
            <div className='App'>
                <div className="SpotifyBox">
                    <NavigationBar></NavigationBar>
                    <SearchBar
                        onSearch={this.search}
                    />
                    <YoutubeButton
                        onSearch={this.findYoutubePlaylist}
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
