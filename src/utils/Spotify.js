const clientID = "d4d7f598a5484e4dbe9a51d68a3acf9e"
const redirect_uri = "http://localhost:3000/"
// const redirect_uri = "http://spotitube.surge.sh/"
let accessToken


const Spotify = {
    getAccessToken() {
        if (accessToken) {
            return accessToken
        } else {
            const accessTokenMatch = window.location.href.match(/access_token=([^&]*)/)
            const expiresInMatch = window.location.href.match(/expires_in=([^&]*)/)

            if (accessTokenMatch && expiresInMatch) {
                accessToken = accessTokenMatch[1]
                const expiresIn = Number(expiresInMatch[1])
                window.setTimeout(() => accessToken = '', expiresIn * 1000)
                window.history.pushState("Access Token", null, "/")
                return accessToken
            } else {
                let params = `?client_id=${clientID}&response_type=token&scope=playlist-modify-public&redirect_uri=${redirect_uri}`
                window.location = "https://accounts.spotify.com/authorize" + params
            }
        }
    },

    async search(query, accessToken) {
        return fetch(`https://api.spotify.com/v1/search?type=track&q=${query}`, {
            headers: {
                Authorization: `Bearer ${Spotify.getAccessToken()}`
            }
        }).then(
            response => {
                return response.json()
            }
        ).then(
            jsonResponse => {
                    if (!jsonResponse.tracks) {
                    return []
                }
                return jsonResponse.tracks.items.map(
                    track => (
                        {
                            name: track.name,
                            artist: track.artists[0].name,
                            album: track.album.name,
                            key: track.id,
                            uri: track.uri,
                            image: track.album.images[0].url
                        }
                    )
                )
            }
        )
    },

    savePlaylist(name, trackUris) {
        if (!name || !trackUris.length) {
            return
        }
        const accessToken = Spotify.getAccessToken()
        const headers = {
            Authorization: `Bearer ${accessToken}`
        }
        let userId
        const url = "https://api.spotify.com/v1/me"
        // GET Request, retrieves userId
        return fetch(url, {headers: headers}).then(
            response => {
                return response.json()
            }
        ).then(
            jsonResponse => {
                userId = jsonResponse.id
                // POST Request, creating playlist
                return fetch(`https://api.spotify.com/v1/users/${userId}/playlists`, {
                    headers: {
                        Authorization: `Bearer ${accessToken}`
                    },    
                    method: "POST",
                    body: JSON.stringify({name: name})
                }).then(
                    response => {
                        return response.json()
                    }
                ).then(
                    jsonResponse => {
                        const playlist_id = jsonResponse.id
                        //POST Request, adds songs to playlist
                        return fetch(`https://api.spotify.com/v1/users/${userId}/playlists/${playlist_id}/tracks`, {
                            headers: {
                                Authorization: `Bearer ${accessToken}`                            },
                            method: "POST",
                            body: JSON.stringify({uris: trackUris})
                        })
                    }
                )
            }
        )
        
    }
}

export default Spotify

