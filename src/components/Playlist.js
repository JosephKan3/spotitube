import React from 'react';
import './Playlist.css';
import TrackList from "./TrackList"

class Playlist extends React.Component {
    constructor(props) {
        super(props)
        this.handleNameChange = this.handleNameChange.bind(this)
        this.handleSave = this.handleSave.bind(this)
    }

    handleNameChange(event) {
        this.props.onNameChange(event.target.value)
    }

    handleSave(event) {
        this.props.onSave()
    }

    render() {
        return(
            <div className='Playlist'>
                <input
                    className="PlaylistName"
                    defaultValue={this.props.name}
                    onChange={this.handleNameChange}
                />
                <button
                    className='PlaylistSave'
                    onClick={this.handleSave}
                >Save Playlist to Spotify</button>
                <TrackList
                    tracks={this.props.tracks}
                    isRemoval={true}
                    onRemoval={this.props.onRemoval}
                />
            </div>

        )
    }
}


export default Playlist