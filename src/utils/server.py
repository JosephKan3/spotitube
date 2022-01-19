# -*- coding: utf-8 -*-

import os
import queue
import flask
import requests
import time

import spotipy
from spotipy.oauth2 import SpotifyOAuth
import google.oauth2.credentials
import google_auth_oauthlib.flow
import googleapiclient.discovery

#Youtube Routes


# This variable specifies the name of a file that contains the OAuth 2.0
# information for this application, including its client_id and client_secret.
CLIENT_SECRETS_FILE = "./clientSecret.json"

# This OAuth 2.0 access scope allows for full read/write access to the
# authenticated user's account and requires requests to use an SSL connection.
SCOPES = ['https://www.googleapis.com/auth/youtube.force-ssl']
API_SERVICE_NAME = 'youtube'
API_VERSION = 'v3'

app = flask.Flask(__name__)
# Note: A secret key is included in the sample so that it works.
# If you use this code in your application, replace this with a truly secret
# key. See https://flask.palletsprojects.com/quickstart/#sessions.
app.secret_key = ';<z8tMnz)=9oPq<nO"3C[CgF;:BF0b-_}xgjG7wm.36qkJ=om,f&wxq[5,L]'
app.config['SESSION_COOKIE_NAME'] = 'spotify-login-session'


@app.route('/')
def index():
  return '<h1>Welcome to Spotitube\'s server, select a valid endpoint to continue.<h1>'

# @app.route('/youtube/favorites')
# def favorites():
#     if 'credentials' not in flask.session:
#         return flask.redirect('authorize')

#     # Load credentials from the session.
#     credentials = google.oauth2.credentials.Credentials(
#         **flask.session['credentials'])

#     youtube = googleapiclient.discovery.build(
#         API_SERVICE_NAME, API_VERSION, credentials=credentials)
#     #API finding liked videos playlist
#     request = youtube.channels().list(
#         part="contentDetails",
#         mine=True
#     )
#     response = request.execute()
#     # likes = response["items"][0]["contentDetails"]["relatedPlaylists"]["likes"]
#     likes = response["items"][0]["contentDetails"]["relatedPlaylists"]

#     #API finding videos in provided playlist
#     playlistRequest = youtube.playlistItems().list(
#         part="snippet",
#         playlistId=str(likes),
#         maxResults=5
#     )
#     likedResponse = playlistRequest.execute()

#     #Building ID and Title Lists
#     idList = []
#     nameList = []
#     for video in likedResponse["items"]:
#         idList.append(video["snippet"]["resourceId"]["videoId"])
#         nameList.append(video["snippet"]["title"])
    
#     suggestionsDic = {}
#     idTitleDic = {}
#     for video in idList:
#         #API finding related videos to given video ID
#         relatedRequest = youtube.search().list(
#             part="snippet",
#             maxResults=5,
#             relatedToVideoId=video,
#             type="video"
#         )
#         suggestions = relatedRequest.execute()

#         #Assembling idTitleDic
#         for suggestion in suggestions["items"]:
#             idTitleDic.update({suggestion["id"]["videoId"]: suggestion["snippet"]["title"]})
#             #Assembling suggestionDic
#             if suggestion["id"]["videoId"] in suggestionsDic:
#                 suggestionsDic[suggestion["id"]["videoId"]] = suggestionsDic[suggestion["id"]["videoId"]]+1
#             else:
#                 suggestionsDic[suggestion["id"]["videoId"]] = 1

#     #Assembling ordered dictionary
#     orderedSuggestionDic = OrderedDict(sorted(suggestionsDic.items(), key=lambda x:x[1], reverse=True))

#     #Max Suggestion Output
#     returnCount = 10
#     counter = 0
#     returnList = []
#     for suggestionEntry in orderedSuggestionDic.keys():
#         returnList.append(suggestionEntry)
#         counter += 1
#         if counter == returnCount:
#             break
#         else:
#             continue
#     flask.session['credentials'] = credentials_to_dict(credentials)
#     return flask.jsonify(returnList)
    

@app.route('/youtube/playlist/<playlistID>/<filter>')
def playlist(playlistID, filter):
    if 'credentials' not in flask.session:
        return flask.redirect('authorize')

  # Load credentials from the session.
    credentials = google.oauth2.credentials.Credentials(
        **flask.session['credentials'])

    youtube = googleapiclient.discovery.build(
        API_SERVICE_NAME, API_VERSION, credentials=credentials)
    # Requesting Video IDs from Playlist
    playlist = youtube.playlistItems().list(
        part="contentDetails",
        playlistId=playlistID,
        maxResults=5
    ).execute()


    # Filtering Non-music videos (CategoryId = 10)
    musicTitlesPlaylist = []
    for video in playlist["items"]:
        videoDetails = youtube.videos().list(
            part="snippet",
            id=video["contentDetails"]["videoId"]
        ).execute()
        isMusic = videoDetails["items"][0]["snippet"]["categoryId"]=="10"
        if (isMusic or filter == "false"):
            musicTitlesPlaylist.append(videoDetails["items"][0]["snippet"]["title"])
    # Save credentials back to session in case access token was refreshed.
    # ACTION ITEM: In a production app, you likely want to save these
    #              credentials in a persistent database instead.
    flask.session['credentials'] = credentials_to_dict(credentials)

    return flask.jsonify(musicTitlesPlaylist)

@app.route('/youtube/test')
def test_api_request():
    if 'credentials' not in flask.session:
        return flask.redirect('authorize')

  # Load credentials from the session.
    credentials = google.oauth2.credentials.Credentials(
        **flask.session['credentials'])

    youtube = googleapiclient.discovery.build(
        API_SERVICE_NAME, API_VERSION, credentials=credentials)

    channel = youtube.channels().list(mine=True, part='snippet').execute()

  # Save credentials back to session in case access token was refreshed.
  # ACTION ITEM: In a production app, you likely want to save these
  #              credentials in a persistent database instead.
    flask.session['credentials'] = credentials_to_dict(credentials)

    return flask.jsonify(**channel)



@app.route('/youtube/authorize')
def authorize():
  # Create flow instance to manage the OAuth 2.0 Authorization Grant Flow steps.
    flow = google_auth_oauthlib.flow.Flow.from_client_secrets_file(
        CLIENT_SECRETS_FILE, scopes=SCOPES)

  # The URI created here must exactly match one of the authorized redirect URIs
  # for the OAuth 2.0 client, which you configured in the API Console. If this
  # value doesn't match an authorized URI, you will get a 'redirect_uri_mismatch'
  # error.
    flow.redirect_uri = flask.url_for('oauth2callback', _external=True)

    authorization_url, state = flow.authorization_url(
      # Enable offline access so that you can refresh an access token without
      # re-prompting the user for permission. Recommended for web server apps.
        access_type='offline',
      # Enable incremental authorization. Recommended as a best practice.
        include_granted_scopes='true')

  # Store the state so the callback can verify the auth server response.
    flask.session['state'] = state

    return flask.redirect(authorization_url)


@app.route('/youtube/oauth2callback')
def oauth2callback():
  # Specify the state when creating the flow in the callback so that it can
  # verified in the authorization server response.
    state = flask.session['state']

    flow = google_auth_oauthlib.flow.Flow.from_client_secrets_file(
        CLIENT_SECRETS_FILE, scopes=SCOPES, state=state)
    flow.redirect_uri = flask.url_for('oauth2callback', _external=True)

  # Use the authorization server's response to fetch the OAuth 2.0 tokens.
    authorization_response = flask.request.url
    flow.fetch_token(authorization_response=authorization_response)

  # Store credentials in the session.
  # ACTION ITEM: In a production app, you likely want to save these
  #              credentials in a persistent database instead.
    credentials = flow.credentials
    flask.session['credentials'] = credentials_to_dict(credentials)

    return flask.redirect(flask.url_for('playlist'))


def credentials_to_dict(credentials):
    return {'token': credentials.token,
        'refresh_token': credentials.refresh_token,
        'token_uri': credentials.token_uri,
        'client_id': credentials.client_id,
        'client_secret': credentials.client_secret,
        'scopes': credentials.scopes}


#Spotify Routes

#Spotify OAuth Client
SPOTIFY_CLIENT_ID = os.environ.get("SPOTIFY_CLIENT_ID")
SPOTIFY_CLIENT_SECRET = os.environ.get("SPOTIFY_CLIENT_SECRET")




@app.route('/spotify/search')
def search():
  query = flask.request.args.get("query")
  if 'spotifyToken' not in flask.session:
    return flask.redirect(flask.url_for('searchAuthorize', query=query), code=307)

  headers = {'Authorization': 'Bearer {token}'.format(token=flask.session['spotifyToken'])}
  response = requests.get("https://api.spotify.com/v1/search?type=track&q=${query}".format(query=query), headers=headers)
  jsonResponse = response.json()
  trackList = []
  for track in jsonResponse["tracks"]["items"]:
    trackList.append({
      "name": track["name"],
      "artist": track["artists"][0]["name"],
      "album": track["album"]["name"],
      "key": track["id"],
      "uri": track["uri"],
      "image": track["album"]["images"][0]["url"]
    })
  return(flask.jsonify(trackList))

@app.route('/spotify/searchAuthorize')
def searchAuthorize():
  query = flask.request.args.get("query")
  auth_response = requests.post('https://accounts.spotify.com/api/token', {
      'grant_type': 'client_credentials',
      'client_id': SPOTIFY_CLIENT_ID,
      'client_secret': SPOTIFY_CLIENT_SECRET,
  })
  # convert the response to JSON
  auth_response_data = auth_response.json()

  # save the access token
  access_token = auth_response_data['access_token']
  flask.session['spotifyToken'] = access_token
  return flask.redirect(flask.url_for('search', query=query), code=307)


@app.route('/spotify/savePlaylist', methods=["GET"])
def savePlaylist():
  # Getting query arguments if not already stored in session
  if "playlistName" not in flask.session:
    flask.session["playlistName"] = flask.request.args.get("playlistName")
  if "trackURIs" not in flask.session:
    flask.session["trackURIs"] = flask.request.args.get("trackURIs")
  playlistName = flask.session["playlistName"]
  trackURIs = flask.session["trackURIs"]

  # Checking if access token is stored in session
  flask.session["token_info"], authorized = getSpotAccessToken()
  flask.session.modified = True
  if not authorized:
    return flask.redirect(flask.url_for("spotOAuthLogin"), code=307)

  sp = spotipy.Spotify(auth=flask.session.get("token_info").get("access_token"))
  # Getting User ID
  userID = sp.me().get("id")

  # Creating Playlist
  playlistID = sp.user_playlist_create(userID, playlistName).get("id")

  # Filling Playlist
  # filledPlaylist = sp.playlist_add_items(playlistID, flask.request.get_json()["trackURIs"])
  filledPlaylist = sp.playlist_add_items(playlistID, [trackURIs])
  flask.session.pop("playlistName")
  flask.session.pop("trackURIs")
  return filledPlaylist


@app.route('/spotify/spotOAuthLogin')
def spotOAuthLogin():
  sp_oauth = create_spotify_oauth()
  oauth_url = sp_oauth.get_authorize_url()
  return flask.redirect(oauth_url)


@app.route('/spotify/saveAuthorize')
def saveAuthorize():
  sp_oauth = create_spotify_oauth()
  playlistName = flask.session["playlistName"]
  trackURIs = flask.session["trackURIs"]
  flask.session.clear()
  flask.session["playlistName"] = playlistName 
  flask.session["trackURIs"] = trackURIs 
  authCode = flask.request.args.get("code")
  token_info = sp_oauth.get_access_token(authCode)
  flask.session["token_info"] = token_info
  return flask.redirect(flask.url_for("savePlaylist"))

# http://127.0.0.1:5000/spotify/savePlaylist?playlistName=HELLO&trackURIs=spotify%3Atrack%3A37XJLOyxY1cMl6lHGcSdZT

def create_spotify_oauth():
  return SpotifyOAuth(
    client_id=SPOTIFY_CLIENT_ID,
    client_secret=SPOTIFY_CLIENT_SECRET,
    redirect_uri=flask.url_for("saveAuthorize", _external=True),
    scope="playlist-modify-public,playlist-modify-private"
  )

def getSpotAccessToken():
  validToken = False
  token_info = flask.session.get("token_info", {})

  # Checking if session has a token
  if not (flask.session.get("token_info", False)):
    token_valud = False
    return token_info, validToken

  # Checking if token is expired
  currentTime = int(time.time())
  tokenExpired = flask.session.get("token_info").get("expires_at") - currentTime < 30

  # Refreshing token if expired
  if (tokenExpired):
    sp_oauth = create_spotify_oauth()
    token_info = sp_oauth.refresh_access_token(flask.session.get("token_info").get("refresh_token"))

  validToken = True
  return token_info, validToken



if __name__ == '__main__':
  # When running locally, disable OAuthlib's HTTPs verification.
  # ACTION ITEM for developers:
  #     When running in production *do not* leave this option enabled.
    os.environ['OAUTHLIB_INSECURE_TRANSPORT'] = '1'

  # Specify a hostname and port that are set as a valid redirect URI
  # for your API project in the Google API Console.
    app.run('localhost', 8080, debug=True)