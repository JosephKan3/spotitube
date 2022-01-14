import React from 'react';
import './TrackList.css';
import Track from './Track'

class TrackList extends React.Component {
    render() {
        return(
            <div className='TrackList'>
                {this.props.tracks.map(track => {
                    return <Track
                    track={track}
                    key={track.key}
                    isRemoval={this.props.isRemoval}
                    onAdd={this.props.onAdd}
                    onRemoval={this.props.onRemoval}
                    />
                })}
            </div>
        )
    }
}

export default TrackList;