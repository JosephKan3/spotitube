# -*- coding: utf-8 -*-

from email.utils import decode_params
import os
import flask
import requests
import time
import json
import urllib.parse

import spotipy
from spotipy.oauth2 import SpotifyOAuth
from flask_cors import CORS
import google.oauth2.credentials
import google_auth_oauthlib.flow
import googleapiclient.discovery

app = flask.Flask(__name__)
cors = CORS(app)
app.secret_key = ';<z8tMnz)=9oPq<nO"3C[CgF;:BF0b-_}xgjG7wm.36qkJ=om,f&wxq[5,L]'
app.config['SESSION_COOKIE_NAME'] = 'spotitube-login-session'
app.config['CORS_HEADERS'] = 'Content-Type'


# This variable specifies the name of a file that contains the OAuth 2.0
# information for this application, including its client_id and client_secret.
#Youtube OAuth Client
REDIRECT_URI=os.environ.get("REDIRECT_URI")
PLAYLIST_MAX_RESULTS=os.environ.get("MAX_PLAYLIST_RESULTS")
CLIENT_SECRETS_FILE = "./clientSecret.json"
SCOPES = ['https://www.googleapis.com/auth/youtube.force-ssl']
API_SERVICE_NAME = 'youtube'
API_VERSION = 'v3'

#Spotify OAuth Client
SPOTIFY_CLIENT_ID = os.environ.get("SPOTIFY_CLIENT_ID")
SPOTIFY_CLIENT_SECRET = os.environ.get("SPOTIFY_CLIENT_SECRET")


#Youtube Routes

@app.route('/')
def index():
  return '<h1>Welcome to Spotitube\'s server, select a valid endpoint to continue.<h1>'

@app.route('/youtube/getAuthUrl')
def getYoutubeAuthUrl():
  # Create flow instance to manage the OAuth 2.0 Authorization Grant Flow steps.
    flow = google_auth_oauthlib.flow.Flow.from_client_secrets_file(
        CLIENT_SECRETS_FILE, scopes=SCOPES)
    # flow.redirect_uri = flask.url_for('oauth2callback', _external=True)
    flow.redirect_uri = REDIRECT_URI

    authorization_url, state = flow.authorization_url(
      # Enable offline access so that you can refresh an access token without re-prompting the user for permission
        access_type='offline',
      # Enable incremental authorization. Recommended as a best practice.
        include_granted_scopes='true')
    flask.session['state'] = state
    return (authorization_url)


@app.route('/youtube/token')
def getYoutubeAccessToken():
    flow = google_auth_oauthlib.flow.Flow.from_client_secrets_file(
        CLIENT_SECRETS_FILE, scopes=SCOPES, state=flask.request.args.get("authState"))
    flow.redirect_uri = REDIRECT_URI
    # Use the authorization server's response to fetch the OAuth 2.0 tokens.
    flow.fetch_token(code=flask.request.args.get("authCode"))
    credentials = flow.credentials
    flask.session['credentials'] = credentials_to_dict(credentials)
    return credentials_to_dict(credentials)


@app.route('/youtube/playlist')
def playlist():
    fullCred = getFullCredentials(json.loads(flask.request.args.get("credentials")))
  # Load credentials from the session.
    credentials = google.oauth2.credentials.Credentials(
        **fullCred)

    youtube = googleapiclient.discovery.build(
        API_SERVICE_NAME, API_VERSION, credentials=credentials)
    
    musicTitlesPlaylist = []
    # Requesting Video IDs from Playlist
    playlist = youtube.playlistItems().list(
        part="contentDetails",
        playlistId=flask.request.args.get("playlistID"),
        maxResults=min(50, int(PLAYLIST_MAX_RESULTS))
    ).execute()
    
    
    
    print(playlist["nextPageToken"])
    # Filtering Non-music videos (CategoryId = 10)
    for video in playlist["items"]:
        videoDetails = youtube.videos().list(
            part="snippet",
            id=video["contentDetails"]["videoId"]
        ).execute()
        try:
          isMusic = videoDetails["items"][0]["snippet"]["categoryId"]=="10"
          if (isMusic or flask.request.args.get("filter") == "false"):
            musicTitlesPlaylist.append(videoDetails["items"][0]["snippet"]["title"])
        except IndexError as e:
          continue
    flask.session['credentials'] = credentials_to_dict(credentials)

    return flask.jsonify(musicTitlesPlaylist)

def credentials_to_dict(credentials):
    return {'token': credentials.token,
        'refresh_token': credentials.refresh_token,
        'token_uri': credentials.token_uri,
        'scopes': credentials.scopes}

def getFullCredentials(partialCredentials):
    f = open(CLIENT_SECRETS_FILE, "r")
    clientSecretData = json.load(f)["web"]
    return {
      'token': partialCredentials["token"],
      'refresh_token': partialCredentials["refresh_token"],
      'token_uri': partialCredentials["token_uri"],
      'client_id': clientSecretData["client_id"],
      'client_secret': clientSecretData["client_secret"],
      'scopes': partialCredentials["scopes"]}



#Spotify Routes

@app.route('/spotify/searchToken')
def getSpotifySearchToken():
  auth_response = requests.post('https://accounts.spotify.com/api/token', {
    'grant_type': 'client_credentials',
    'client_id': SPOTIFY_CLIENT_ID,
    'client_secret': SPOTIFY_CLIENT_SECRET,
  })
  auth_response_data = auth_response.json()
  # Save the access token
  access_token = auth_response_data['access_token']
  return access_token


@app.route('/spotify/search')
def search():
  headers = {'Authorization': 'Bearer {token}'.format(token=flask.request.args.get("token"))}
  response = requests.get("https://api.spotify.com/v1/search?type=track&q=${query}".format(query=flask.request.args.get("query")), headers=headers)
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


@app.route('/spotify/getAuthUrl')
def getSpotifyAuthUrl():
  sp_oauth = create_spotify_oauth()
  oauth_url = sp_oauth.get_authorize_url()
  return oauth_url

@app.route('/spotify/token')
def getSpotifyAccessToken():
  sp_oauth = create_spotify_oauth()
  authCode = flask.request.args.get("authCode")
  token_info = sp_oauth.get_access_token(authCode)
  return token_info


@app.route('/spotify/savePlaylist', methods=["GET"])
def savePlaylist():
  playlistName = flask.request.args.get("playlistName")
  trackURIs = json.loads(urllib.parse.unquote(flask.request.args.get("playlistTracks")))
  credentials = json.loads(flask.request.args.get("credentials"))
  print(credentials)

  # Check if refresh needed
  if (credentials["expires_at"] - int(time.time()) < 60):
    sp_oauth = create_spotify_oauth()
    credentials = sp_oauth.refresh_access_token(credentials["refresh_token"])

  sp = spotipy.Spotify(auth=credentials["access_token"])
  # Getting User ID
  userID = sp.me().get("id")

  # Creating Playlist
  playlistID = sp.user_playlist_create(userID, playlistName).get("id")

  # Filling Playlist
  sp.playlist_add_items(playlistID, trackURIs)
  return credentials

def create_spotify_oauth():
  return SpotifyOAuth(
    client_id=SPOTIFY_CLIENT_ID,
    client_secret=SPOTIFY_CLIENT_SECRET,
    redirect_uri=REDIRECT_URI,
    scope="playlist-modify-public,playlist-modify-private"
  )

if __name__ == '__main__':
  # When running locally, disable OAuthlib's HTTPs verification.
  # ACTION ITEM for developers:
  #     When running in production *do not* leave this option enabled.
    # os.environ['OAUTHLIB_INSECURE_TRANSPORT'] = '1'
    # app.run('localhost', 8080, debug=True)
    port = int(os.environ.get('PORT'))
    app.run(host="0.0.0.0", port=port, debug=True)