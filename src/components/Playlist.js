import React from 'react';
import './Playlist.css';
import TrackList from "./TrackList"

class Playlist extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            saveConfirmation: "none"
        }
        this.handleNameChange = this.handleNameChange.bind(this)
        this.handleSave = this.handleSave.bind(this)
    }

    handleNameChange(event) {
        this.props.onNameChange(event.target.value)
    }

    saveConfirmation() {
        if (this.state.saveConfirmation === "none") {
            return 
        } else if (this.state.saveConfirmation === "saved") {
            return (
                <div className='SaveConfirmation'>
                    <h3>Saved!</h3>
                </div>
            )
        } else if (this.state.saveConfirmation === "error") {
            return (
                <div className='SaveConfirmation'>
                    <h3>Error.</h3>
                </div>
            )
        } else {
            return
        }
    }

    async handleSave(event) {
        // Handle button render
        // TODO: Error message not being returned
        let saved = await this.props.onSave()
        this.setState({saveConfirmation: saved})
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
                {this.saveConfirmation()}
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