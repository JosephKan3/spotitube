import React from 'react';
import "./YoutubeButton.css"

class YoutubeButton extends React.Component {
    constructor(props) {
        super(props)

        this.handleSearchPlaylist = this.handleSearchPlaylist.bind(this)
        this.handlePlaylistChange = this.handlePlaylistChange.bind(this)
    }

    handleSearchPlaylist(event) {
        this.props.onFindYoutube(this.props.playlistID)
    }

    handlePlaylistChange(event) {
        this.props.onUpdate(event.target.value)
    }

    render() {
        return(
            <div className='Youtube'>
                <button
                    onClick={this.props.onSign}
                >Sign in to Youtube</button>
                <input
                    className='PlaylistInput'
                    value={this.props.playlistID}
                    placeholder="Enter Youtube Playlist ID or URL"
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