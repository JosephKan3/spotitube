import React from 'react';
import "./YoutubeButton.css"

class YoutubeButton extends React.Component {
    constructor(props) {
        super(props)
        this.handleSearchPlaylist = this.handleSearchPlaylist.bind(this)
    }

    handleSearchPlaylist(event) {
        this.props.onSearch()
    }

    render() {
        return(
            <div className='Youtube'>
                <button
                    onClick={this.handleSearchPlaylist}
                >Sign in to Youtube</button>
                <button>Import Youtube Preferences</button>
                <button>Import Youtube Playlist</button>
            </div>
        )
    }
}

export default YoutubeButton;