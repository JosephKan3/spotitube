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
            activeTrack: {},
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
        this.setActiveTrack = this.setActiveTrack.bind(this)
        this.navigateDown = this.navigateDown.bind(this)
        this.navigateUp = this.navigateUp.bind(this)

        // Fetching local state
        let localState = JSON.parse(localStorage.getItem("state"))
        if (localState != null) {
            this.state = localState
        }
    }

    // Adding event listener to handle arrow keys changing active track
    componentDidMount() {
        window.addEventListener("keydown", (event) => {
            if (event.key === "ArrowUp") {
                event.preventDefault()
                this.navigateUp()
            } else if (event.key === "ArrowDown") {
                event.preventDefault()
                this.navigateDown()
            } else {
                return
            }
        })
    }

    async handleRemoval(track) {
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
            console.log(tracks[trackPosition + 1])

            // Moving active track
            await new Promise((resolve, reject) => {
                if (trackPosition + 1 < tracks.length) {
                    this.setState({activeTrack: tracks[trackPosition + 1]}, () => {
                        console.log(tracks[trackPosition + 1])
                        document.getElementById(tracks[trackPosition + 1].key).setAttribute("style", "border: thin solid yellow")
                        resolve()
                    })
                } else if (trackPosition - 1 >= 0) {
                    this.setState({activeTrack: tracks[trackPosition - 1]}, () => {
                        document.getElementById(tracks[trackPosition - 1].key).setAttribute("style", "border: thin solid yellow")
                        resolve()
                    })
                } else {
                    console.log("Empty")
                    this.setState({activeTrack: {}}, () => {
                        resolve()
                    })
                }
            })


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
        // Avoids duplicate tracks
        if (tracks.find(searchTrack => {
            return track.key === searchTrack.key
        })) {
            return
        // Adds track
        } else {
            // Deletes added track from search results
            let searchIndex = this.state.searchResults.map(searchTrack => {return searchTrack.key}).indexOf(track.key)
            let newSearchResults = this.state.searchResults
            newSearchResults.splice(searchIndex, 1)
            this.setState({searchResults: newSearchResults}, () => {
                // Adds track at end if no active track for whatever reason
                if (!this.state.activeTrack.hasOwnProperty("key")) {
                    console.log("Huh?")
                    tracks.push(track)
                    this.setState({
                        playlist: {
                            playlistName: this.state.playlist.playlistName,
                            playlistTracks: tracks
                        },
                        activeTrack: track
                    }, () => {
                        document.getElementById(track.key).setAttribute("style", "border: thin solid yellow")
                        localStorage.setItem("state", JSON.stringify(this.state))
                    })
                // Replaces error tracks
                } else if (this.state.activeTrack.notFound) {
                    let activeTrack = this.state.activeTrack
                    console.log("Not found")
                    let activeIndex = this.state.playlist.playlistTracks.map((playlistTrack) => {return playlistTrack.key}).indexOf(activeTrack.key)
                    tracks[activeIndex] = track
                    console.log(activeIndex)
                    console.log(tracks)
                    this.setState({
                        playlist: {
                            playlistName: this.state.playlist.playlistName,
                            playlistTracks: tracks
                        },
                        activeTrack: track
                    }, () => {
                        document.getElementById(track.key).setAttribute("style", "border: thin solid yellow")
                        localStorage.setItem("state", JSON.stringify(this.state))
                    })
                // Places below current track if current track is valid
                } else {
                    let activeTrack = this.state.activeTrack
                    console.log("Valid track")
                    let activeIndex = this.state.playlist.playlistTracks.map((playlistTrack) => {return playlistTrack.key}).indexOf(activeTrack.key)
                    tracks.splice(activeIndex + 1, 0, track)
                    console.log(activeIndex)
                    console.log(tracks)
                    this.setState({
                        playlist: {
                            playlistName: this.state.playlist.playlistName,
                            playlistTracks: tracks
                        },
                        activeTrack: track
                    }, () => {
                        document.getElementById(activeTrack.key).setAttribute("style", "border: none border-bottom: 1px solid rgba(256, 256, 256, 0.8)")
                        document.getElementById(track.key).setAttribute("style", "border: thin solid yellow")
                        document.getElementById(track.key).scrollIntoView(true)
                        localStorage.setItem("state", JSON.stringify(this.state))
                    })
                } 
                return                
            })
        }
    }

    setActiveTrack(event) {
        let tracks = this.state.playlist.playlistTracks
        // Clearing active track
        for (let i = 0; i < tracks.length; i ++) {
            document.getElementById(tracks[i].key).setAttribute("style", "border: none border-bottom: 1px solid rgba(256, 256, 256, 0.8)")
        }
        
        // Avoids triggering when an inner button is pressed
        if (event.target.className === "TrackAction") {
            return
        }

        // Finding new track index
        let targetTrackIndex = tracks.map((track) => {return track.key}).indexOf(event.target.id)
        // If id not found, check parent element
        if (targetTrackIndex === -1) {
            targetTrackIndex = tracks.map((track) => {return track.key}).indexOf(event.target.parentNode.id)
        }

        if (targetTrackIndex === -1) {
          return  
        }

        // Setting the active track to the target index
        let targetTrack = tracks[targetTrackIndex]
        console.log(targetTrack)

        // Scrolls the active track into view
        this.setState({
            activeTrack: targetTrack
        }, () => {
            document.getElementById(targetTrack.key).setAttribute("style", "border: thin solid yellow")
            localStorage.setItem("state", JSON.stringify(this.state))
        })
    }

    navigateDown() {
        let tracks = this.state.playlist.playlistTracks
        let currentIndex = tracks.map((track) => {return track.key}).indexOf(this.state.activeTrack.key)
        // Does nothing if at end of list
        if (currentIndex + 1 >= tracks.length) {
            return
        // Sets active track to next track
        } else {
            // Changes the active track CSS highlight
            document.getElementById(tracks[currentIndex].key).setAttribute("style", "border: none border-bottom: 1px solid rgba(256, 256, 256, 0.8)")
            document.getElementById(tracks[currentIndex + 1].key).setAttribute("style", "border: thin solid yellow")
            this.setState({
                activeTrack: tracks[currentIndex + 1]
            }, () => {
                document.getElementById(tracks[currentIndex + 1].key).scrollIntoView(true)
                localStorage.setItem("state", JSON.stringify(this.state))
            })
        }
    }

    navigateUp() {
        let tracks = this.state.playlist.playlistTracks
        let currentIndex = tracks.map((track) => {return track.key}).indexOf(this.state.activeTrack.key)
        console.log(tracks)
        // Does nothing if at end of list
        if (currentIndex === 0) {
            return
        // Sets active track to previous track
        } else {
            // Changes the active track CSS highlight
            document.getElementById(tracks[currentIndex].key).setAttribute("style", "border: none border-bottom: 1px solid rgba(256, 256, 256, 0.8)")
            document.getElementById(tracks[currentIndex - 1].key).setAttribute("style", "border: thin solid yellow")
            this.setState({
                activeTrack: tracks[currentIndex - 1]
            }, () => {
                document.getElementById(tracks[currentIndex - 1].key).scrollIntoView(true)
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

    async findYoutubePlaylist(playlistInput, event, button) {
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
        }

        // If either credentials or auth code are found, send request
        if (tokenFound || hasCreds) {
            axios.get("http://127.0.0.1:5000/youtube/playlist", {params: {
                playlistID:playlistID,
                filter: false,
                credentials: this.state.youtubeCredentials
            }}).then(response => {
                let youtubeTrackList = response.data
                this.bulkSearch(youtubeTrackList, event, button)
            })
        // Begin auth code flow
        } else {
            this.getYoutubeAuthUrl()
        }
    }

    async bulkSearch(trackNames, event, button) {
        console.log(trackNames)

        // Load Progress Bar
        button.setState({totalSearchPromises: trackNames.length})

        // Filters out (Official Video) and [Official Video] tags that break the Spotify search query
        // let cleanTrackNames = trackNames.map((trackName) => {
        //     return trackName.split("(")[0].split("[")[0]
        // })
        let searchPromises = []
        axios.get("http://127.0.0.1:5000/spotify/searchToken").then(response => {
            for (let i = 0; i < trackNames.length; i++) {
                searchPromises.push(
                    new Promise((resolve, reject) => {
                        axios.get("http://127.0.0.1:5000/spotify/search", {params: {
                            query: trackNames[i],
                            token: response.data
                        // Fill progress bar
                        }}).then((response) => {
                            button.setState({totalSearchPromisesResolved: button.state.totalSearchPromisesResolved + 1}, () => {
                                let currentProgress = Math.round(button.state.totalSearchPromisesResolved/button.state.totalSearchPromises * 100)
                                event.target.innerText = `Searching, please wait... ${currentProgress}%`
                                resolve(response)
                            })
                        })
                    })

                )
            }
            Promise.all(searchPromises).then((responses) => {
                console.log(responses)
                let ytPlaylist = []
                for (let i = 0; i < responses.length; i++) {
                    let recommendation = responses[i].data[0]
                    // If no recommendation was generated by spotify, return an error track with a uuid
                    if (recommendation === undefined || !recommendation.hasOwnProperty("key")) {
                        ytPlaylist.push({
                            notFound: true,
                            trackName: trackNames[i],
                            key: uuidv4(),
                            duplicate: false,
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
                                recommendationName: recommendation.name,
                            })
                            continue
                        } else {
                            ytPlaylist.push(recommendation)
                        }
                    }
                }
                // Setting active track to the first track in the playlist
                console.log(ytPlaylist)
                this.setState({
                    playlist: {
                        playlistName: this.state.playlist.playlistName,
                        playlistTracks: ytPlaylist
                    },
                    activeTrack: ytPlaylist[0]
                }, () => {
                    localStorage.setItem("state", JSON.stringify(this.state))
                    // Enabling import button after search to allow additional requests
                    event.target.innerText = "Done!"
                    setTimeout(function() {
                        event.target.disabled = false
                        event.target.innerText = "Import Youtube Playlist"
                    }, 3000)

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

    async savePlaylist(event) {
        return new Promise(async (resolve, reject) => {
            // If credentials are stored
            let hasCreds = this.state.spotifyCredentials.access_token !== undefined
            if (!hasCreds) {
                // If not redirected
                if (!this.state.spotifyRedirect) {
                    this.getSpotifyAuthUrl()
                    reject("authenticating")
                // If auth code found
                } else {
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
            axios.get("http://127.0.0.1:5000/spotify/savePlaylist", {params: {
                playlistName: this.state.playlist.playlistName,
                playlistTracks: encodeURIComponent(JSON.stringify(currentTrackUris)),
                credentials: this.state.spotifyCredentials
            }}).then(response => {
                // If no error in status, render saved notification
                if (response.status < 400) {
                    // Update credentials in case of refresh access token
                    let creds = response.data.credentials
                    let playlistID = response.data.playlistID
                    this.setState({spotifyCredentials: creds})

                    // Continue sending requests until all of the filteredTrackUris have been added
                    while (true) {
                        start += 50
                        currentTrackUris = filteredTrackUris.slice(start, start + 50)
                        if (currentTrackUris.length === 0) {
                            break
                        } else {
                            axios.get("http://127.0.0.1:5000/spotify/savePlaylist", {params: {
                                playlistName: this.state.playlist.playlistName,
                                playlistTracks: encodeURIComponent(JSON.stringify(currentTrackUris)),
                                credentials: creds,
                                playlistID: playlistID
                            }})
                        }
                    }
                    event.target.innerText = "Saved!"
                    setTimeout(function() {
                        event.target.disabled = false
                        event.target.innerText = "Save to Spotify"
                    }, 3000)
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
                            onClick={this.setActiveTrack}
                        />
                    </div>
                </div>
            </div>
 
          )
    }
}

export default App;
