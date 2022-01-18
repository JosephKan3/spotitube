# -*- coding: utf-8 -*-

import os
import queue
import flask
import requests
from collections import OrderedDict


import google.oauth2.credentials
import google_auth_oauthlib.flow
import googleapiclient.discovery

#Youtube Routes


# This variable specifies the name of a file that contains the OAuth 2.0
# information for this application, including its client_id and client_secret.
CLIENT_SECRETS_FILE = "deskSecret.json"

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


@app.route('/')
def index():
  return(flask.redirect(flask.url_for("savePlaylist")))

  # return '<h1>Welcome to Spotitube\'s server, select a valid endpoint to continue.<h1>'

@app.route('/youtube/')
def youtubeIndex():
  return print_index_table()


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


@app.route('/youtube/revoke')
def revoke():
    if 'credentials' not in flask.session:
        return ('You need to <a href="/authorize">authorize</a> before ' +
            'testing the code to revoke credentials.')

    credentials = google.oauth2.credentials.Credentials(
        **flask.session['credentials'])

    revoke = requests.post('https://oauth2.googleapis.com/revoke',
        params={'token': credentials.token},
        headers = {'content-type': 'application/x-www-form-urlencoded'})

    status_code = getattr(revoke, 'status_code')
    if status_code == 200:
        return('Credentials successfully revoked.' + print_index_table())
    else:
        return('An error occurred.' + print_index_table())


@app.route('/youtube/clear')
def clear_credentials():
    if 'credentials' in flask.session:
        del flask.session['credentials']
    return ('Credentials have been cleared.<br><br>' +
        print_index_table())


def credentials_to_dict(credentials):
    return {'token': credentials.token,
        'refresh_token': credentials.refresh_token,
        'token_uri': credentials.token_uri,
        'client_id': credentials.client_id,
        'client_secret': credentials.client_secret,
        'scopes': credentials.scopes}

def print_index_table():
    return ('<table>' +
        '<tr><td><a href="/test">Test an API request</a></td>' +
        '<td>Submit an API request and see a formatted JSON response. ' +
        '    Go through the authorization flow if there are no stored ' +
        '    credentials for the user.</td></tr>' +
        '<tr><td><a href="/authorize">Test the auth flow directly</a></td>' +
        '<td>Go directly to the authorization flow. If there are stored ' +
        '    credentials, you still might not be prompted to reauthorize ' +
        '    the application.</td></tr>' +
        '<tr><td><a href="/revoke">Revoke current credentials</a></td>' +
        '<td>Revoke the access token associated with the current user ' +
        '    session. After revoking credentials, if you go to the test ' +
        '    page, you should see an <code>invalid_grant</code> error.' +
        '</td></tr>' +
        '<tr><td><a href="/clear">Clear Flask session credentials</a></td>' +
        '<td>Clear the access token currently stored in the user session. ' +
        '    After clearing the token, if you <a href="/test">test the ' +
        '    API request</a> again, you should go back to the auth flow.' +
        '</td></tr></table>')


#Spotify Routes

#Spotify OAuth Client
clientID = os.environ.get("SPOTIFY_CLIENT_ID") or "d4d7f598a5484e4dbe9a51d68a3acf9e"
clientSecret = os.environ.get("SPOTIFY_CLIENT_SECRET") or "250f4559c6cc4313b90d39f7c18442a9"

@app.route('/spotify/search/<string:query>')
def search(query):
  if 'spotifyToken' not in flask.session:
    return flask.redirect('searchAuthorize')
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
  auth_response = requests.post('https://accounts.spotify.com/api/token', {
      'grant_type': 'client_credentials',
      'client_id': clientID,
      'client_secret': clientSecret,
  })

  # convert the response to JSON
  auth_response_data = auth_response.json()

  # save the access token
  access_token = auth_response_data['access_token']
  flask.session['spotifyToken'] = access_token
  return flask.redirect(flask.url_for('search'))


@app.route('/spotify/savePlaylist', methods=["GET"])
def savePlaylist():
  if 'spotifyOAuthToken' not in flask.session:
    return flask.redirect('saveAuthorize')
  OAuthToken = flask.session['spotifyOAuthToken']
  headers = {'Authorization': 'Bearer {token}'.format(token=flask.session['spotifyToken'])}
  # Request for UserID
  userID = requests.get("https://api.spotify.com/v1/me", headers=headers).json()
  print(userID)
  return(userID)
  

@app.route('/spotify/saveAuthorize')
def saveAuthorize():
  redirectURI = "http://127.0.0.1:5000/"
  params = "?client_id=${clientID}&response_type=token&scope=playlist-modify-public&redirect_uri=${redirect_uri}".format(clientID=clientID, redirect_uri=redirectURI)
  uri = 'https://accounts.spotify.com/authorize' + params
  print(uri)
  return flask.redirect(redirectURI)


if __name__ == '__main__':
  # When running locally, disable OAuthlib's HTTPs verification.
  # ACTION ITEM for developers:
  #     When running in production *do not* leave this option enabled.
    os.environ['OAUTHLIB_INSECURE_TRANSPORT'] = '1'

  # Specify a hostname and port that are set as a valid redirect URI
  # for your API project in the Google API Console.
    app.run('localhost', 8080, debug=True)