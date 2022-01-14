import React from 'react';
import './SearchResults.css';
import TrackList from './TrackList';

class SearchResults extends React.Component {
    render() {
        return(
            <div className='SearchResults'>
                <h1 className='Subheading'>Search Results</h1>
                <TrackList
                    tracks={this.props.tracks}
                    isRemoval={false}
                    onAdd={this.props.onAdd}
                />
            </div>

        )
    }
}

export default SearchResults;