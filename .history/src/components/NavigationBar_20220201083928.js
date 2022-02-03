import React from 'react';
import './NavigationBar.css';

class NavigationBar extends React.Component {
    render() {
        return(
            <div className="Navigation">
                <h1 className="Title">Spot<span className="Highlight">i</span>Tube</h1>
                <ul className="NavLinks">
                    <li className='NavItem'><a href='#spotify'>Spotify</a></li>
                    <li className='NavItem'><a href='#youtube'>Youtube</a></li>
                    <li className='NavItem'><a href=''>Source Code</a></li>
                </ul>

            </div>            
        )
    }
}

export default NavigationBar;