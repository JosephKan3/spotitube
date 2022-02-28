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

    async handleSave(event) {
        // Handle button render
        event.target.disabled = true
        event.target.innerText = "Saving..."
        this.props.onSave(event)
    }

    render() {
        return(
            <div className='Playlist'>
                <input
                    className="PlaylistName"
                    defaultValue={this.props.name}
                    onChange={this.handleNameChange}
                />
                <div className='SaveButtons'>
                    <button
                        className='PlaylistSave'
                        onClick={this.props.onLogin}
                    >Spotify Login</button>
                    <button
                        className='PlaylistSave'
                        onClick={this.handleSave}
                    >Save to Spotify</button>
                    <button
                        className='PlaylistSave'
                        onClick={this.props.onClear}
                    >Clear Playlist</button>
                </div>
                <TrackList
                    tracks={this.props.tracks}
                    isRemoval={true}
                    onRemoval={this.props.onRemoval}
                    onClick={this.props.onClick}
                />
            </div>

        )
    }
}


export default Playlist