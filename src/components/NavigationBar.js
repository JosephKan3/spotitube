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
                </ul>

            </div>            


            // <header class="masthead" id="spotify">
            //     <div class="container px-4 px-lg-5 d-flex h-100 align-items-center justify-content-center">
            //         <div class="d-flex justify-content-center">
            //             <div class="text-center">
            //                 <h1 class="mx-auto my-0 text-uppercase">Playlist Area</h1>
            //             </div>
            //         </div>
            //     </div>
            // </header>
        )
    }
}

export default NavigationBar;