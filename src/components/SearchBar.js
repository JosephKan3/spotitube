import React from 'react';
import './SearchBar.css';

class SearchBar extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            query: ""
        }
        this.handleQueryChange = this.handleQueryChange.bind(this)
        this.search = this.search.bind(this)
    }

    handleQueryChange(event) {
        this.setState(
            {
                query: event.target.value
            }
        )
    }
    
    search(event) {
        this.props.onSearch(this.state.query)
    }



    render() {
        return(
            <div className='SearchBar'>
                <input
                className="SearchInput"
                placeholder="Enter a Song, Album, or Artist"
                onChange={this.handleQueryChange}
                />
                <button 
                className="SearchButton"
                onClick={this.search}
                >Search</button>

            </div>
        )
    }
}


export default SearchBar