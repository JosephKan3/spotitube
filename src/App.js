import logo from './logo.svg';
import './App.css';
import React from 'react';
import SearchResults from './components/SearchResults';
import NavigationBar from './components/NavigationBar';
import SearchBar from './components/SearchBar';
import Playlist from './components/Playlist';
import Spotify from './utils/Spotify';
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
            accessToken: ""
        }

        this.handleAdd = this.handleAdd.bind(this)
        this.handleRemoval = this.handleRemoval.bind(this)
        this.updatePlaylistName = this.updatePlaylistName.bind(this)
        this.savePlaylist = this.savePlaylist.bind(this)
        this.search = this.search.bind(this)
        


    }


    async search(query) {
        console.log(`Searching for: ${query}.`)
        let tracks = await Spotify.search(query)
        this.setState({searchResults: tracks})
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

    savePlaylist() {
        let trackUris = this.state.playlist.playlistTracks.map(track => {
            return track.uri
        })
        Spotify.savePlaylist(this.state.playlist.playlistName, trackUris)
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
                    <YoutubeButton></YoutubeButton>
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
