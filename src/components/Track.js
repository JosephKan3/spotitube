import React from 'react';
import './Track.css';

class Track extends React.Component {
    constructor(props) {
        super(props)
        this.addTrack = this.addTrack.bind(this)
        this.removeTrack = this.removeTrack.bind(this)
        this.renderTrack = this.renderTrack.bind(this)
    }
    renderAction() {
        if (this.props.isRemoval) {
            return (
                <button className='TrackAction' onClick={this.removeTrack}>-</button>
            )
        } else {
            return (
                <button className='TrackAction' onClick={this.addTrack}>+</button>
            )
        }
    }

    addTrack() {
        this.props.onAdd(this.props.track)
    }

    removeTrack() {
        this.props.onRemoval(this.props.track)
    }


    renderTrack() {
        // Rendering track that was not found by youtube import
        if (this.props.track.notFound) {
            // Duplicate search result from Spotify
            if (this.props.track.duplicate) {
                return (
                    <div className="Error" id={this.props.track.key} onClick={this.props.onClick}>
                        <div className="Navigate" id={this.props.track.key}>
                            <div className='TrackName' id={this.props.track.key}>
                                <h5 className='ErrorMessage' id={this.props.track.key}><span className='ErrorTrackTitle'>{this.props.track.trackName}</span> resulted in a duplicate song match from Spotify. Manually resolve the conflict with <span className='ErrorTrackTitle'>{this.props.track.duplicateName}</span> or only <span className='ErrorTrackTitle'>{this.props.track.recommendationName}</span> will be saved.</h5>
                                {this.renderAction()}
                            </div>
                        </div>
                    </div>           
                )
            // No search results from Spotify
            } else {
                return (
                    <div className="Error" id={this.props.track.key} onClick={this.props.onClick}>
                        <div className="Navigate" id={this.props.track.key}>
                            <div className='TrackName' id={this.props.track.key}>
                                <h5 className='ErrorMessage' id={this.props.track.key}><span className='ErrorTrackTitle'>{this.props.track.trackName}</span> was not found by Spotify. Manually search for the song or the song will not be added to the playlist.</h5>
                                {this.renderAction()}
                            </div>
                        </div>
                    </div>           
                )
            }

        // Rendering track that was found
        } else if (this.props.searchResult) {
            return (
                <div className="SearchResult" id={this.props.track.key} onClick={this.props.onClick}>
                    <div className='TrackInformation' id={this.props.track.key}>
                        <div className='TrackName' id={this.props.track.key}>
                            <img 
                                className="TrackImage"
                                src={this.props.track.image} 
                                alt={this.props.track.name}></img>
                            <h3>{this.props.track.name}</h3>
                            {this.renderAction()}
                        </div>
                        <p>{this.props.track.artist} | {this.props.track.album}</p>
                    </div>
                </div>                
            )
        } else { 
            return (
                <div className="Track" id={this.props.track.key} onClick={this.props.onClick}>
                    <div className='TrackInformation' id={this.props.track.key}>
                        <div className='TrackName' id={this.props.track.key}>
                            <img 
                                className="TrackImage"
                                src={this.props.track.image} 
                                alt={this.props.track.name}></img>
                            <h3>{this.props.track.name}</h3>
                            {this.renderAction()}
                        </div>
                        <p>{this.props.track.artist} | {this.props.track.album}</p>
                    </div>
                </div>                
            )
        }

    }


    render() {
        return(this.renderTrack())
    }
}

export default Track;
