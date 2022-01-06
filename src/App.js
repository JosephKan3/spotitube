import logo from './logo.svg';
import './App.css';
import React from 'react';

class App extends React.Component {
    render() {
        return (
            <div className="App">
                <div>
                <body id="page-top">
                        <nav class="navbar navbar-expand-lg navbar-light fixed-top">
                                <h1 className="Title">Spot<span className="Highlight">i</span>tube</h1>
                            <div class="container px-4 px-lg-5">

                                <div class="collapse navbar-collapse" id="navbarResponsive">
                                    <ul class="navbar-nav ms-auto">
                                        <li class="nav-item"><a class="nav-link" href="#spotify">Spotify</a></li>
                                        <li class="nav-item"><a class="nav-link" href="#youtube">Youtube</a></li>
                                    </ul>
                                </div>
                            </div>
                        </nav>
                        {/* <!-- Masthead--> */}
                        <header class="masthead" id="spotify">
                            <div class="container px-4 px-lg-5 d-flex h-100 align-items-center justify-content-center">
                                <div class="d-flex justify-content-center">
                                    <div class="text-center">
                                        <h1 class="mx-auto my-0 text-uppercase">Playlist Area</h1>
                                    </div>
                                </div>
                            </div>
                        </header>
                        {/* <!-- About--> */}
                        <section class="about-section text-center" id="youtube">
                            <div class="container px-4 px-lg-5">
                                <div class="row gx-4 gx-lg-5 justify-content-center">
                                    <div class="col-lg-8">
                                        <h2 class="text-white mb-4">Youtube Connection</h2>
                                    </div>
                                </div>
                            </div>
                        </section>
                    </body>
                </div>
            </div>

          )
    }
}

export default App;
