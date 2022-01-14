import React from 'react';
import "./YoutubeButton.css"

class YoutubeButton extends React.Component {
    render() {
        return(
            <div className='Youtube'>
                <button>Sign in to Youtube</button>
                <button>Import Youtube Preferences</button>
                <button>Import Youtube Playlist</button>
            </div>
        )
    }
}

export default YoutubeButton;