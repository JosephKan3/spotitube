import React from 'react';
import './Track.css';

class Track extends React.Component {
    constructor(props) {
        super(props)
        this.addTrack = this.addTrack.bind(this)
        this.removeTrack = this.removeTrack.bind(this)
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


    render() {
        return(
            <div className="Track">
                <div className='TrackInformation'>
                    <div className='TrackName'>
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

export default Track;
