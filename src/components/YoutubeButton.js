import React from 'react';
import "./YoutubeButton.css"

class YoutubeButton extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            playlistID: ""
        }

        this.handleSearchPlaylist = this.handleSearchPlaylist.bind(this)
        this.handlePlaylistChange = this.handlePlaylistChange.bind(this)
    }

    handleSearchPlaylist(event) {
        this.props.onFindYoutube(this.state.playlistID)
    }

    handlePlaylistChange(event) {
        this.setState({playlistID: event.target.value})
    }

    render() {
        return(
            <div className='Youtube'>
                <button
                    onClick={this.props.onSign}
                >Sign in to Youtube</button>
                <input
                    className='PlaylistInput'
                    placeholder="Enter Youtube Playlist ID"
                    onChange={this.handlePlaylistChange}
                />
                <button
                    onClick={this.handleSearchPlaylist}
                >Import Youtube Playlist</button>
            </div>
        )
    }
}

export default YoutubeButton;