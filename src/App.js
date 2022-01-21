import logo from './logo.svg';
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


        // axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest'
        // Fetching local state
        let localState = JSON.parse(localStorage.getItem("state"))
        if (localState != null) {
            this.state = localState
            // Fetching auth tokens following redirect
            if (this.state.youtubeRedirect) {
                let authCode = decodeURIComponent(window.location.href.match(/code=([^&]*)/)[1])
                let authState = decodeURIComponent(window.location.href.match(/state=([^&]*)/)[1])
                console.log("COUNT")
                let count = 0
                fetch(`http://127.0.0.1:5000/youtube/token?authCode=${authCode}&authState=${authState}`).then((response) => {
                    localStorage.setItem("state", JSON.stringify(this.state))
                    count++
                    console.log(response)
                    this.state.youtubeCredentials = response.data
                    this.state.youtubeRedirect = false
                    console.log(count)
                })
            }
            if (this.state.spotifyRedirect) {
                let authCode = decodeURIComponent(window.location.href.match(/code=([^&]*)/)[1])
                fetch(`http://127.0.0.1:5000/spotify/token?authCode=${authCode}`).then((response) => {
                    this.state.spotifyToken = response.request.responseText
                    this.state.spotifyRedirect = false
                })
            }
        }
        localStorage.setItem("state", JSON.stringify(this.state))
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

    findYoutubePlaylist(playlistID) {
        // Saving local state before redirect
        // Starting Youtube Authorization Code Flow if no token
        if (this.state.youtubeCredentials !== {}) {
            this.setState({youtubeRedirect: true}, () => {
                localStorage.setItem("state", JSON.stringify(this.state))
                fetch(`http://127.0.0.1:5000/youtube/getAuthUrl`).then(response => {
                    return response.text()
                }).then(responseText => {
                    window.location.replace(responseText)
                })

            })
        } else {
            fetch(`http://127.0.0.1:5000/youtube/playlist?playlistID=${playlistID}&filter=${false}&credentials=${this.state.youtubeCredentials}`).then((response) => {
                let youtubeTrackList = response.data.tracks
                for (let i = 0; i < youtubeTrackList.length; i++) {
                    // TODO: Handle response
                    console.log(i)
                }
            })
        }
    }

    getYoutubeAccessToken() {
        fetch(`http://127.0.0.1:5000/youtube/playlist/PLQAo3WtfNEjVPqQXmCFpt3gyLb9abaq_2/false`).then((response) => {
            let authURL = response.request.responseText
            // window.open(authURL)
            // console.log(this.state)
            localStorage.setItem("state", this.state)
            // console.log(localStorage.getItem("state"))
            window.location.replace(authURL)
            // console.log(authURL)
        })
    }

    async savePlaylist() {
        let trackUris = this.state.playlist.playlistTracks.map(track => {
            return track.uri
        })

        // let tracks = await axios.get("https://spotitubev2.herokuapp.com/spotify/search", {
        // })
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
                        onFindYoutube={this.findYoutubePlaylist}
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
