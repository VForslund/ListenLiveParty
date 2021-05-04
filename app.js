// Imports
const express = require('express')
const app = express();
const port = 8080;
const socket = require('socket.io');
var request = require('request');
var querystring = require('querystring');
var cors = require('cors');
var cookieParser = require('cookie-parser');
const https = require('https');
const SpotifyWebApi = require('spotify-web-api-node');
const spotifyApi = new SpotifyWebApi();

// Static Files
const client_id = '598e7602035a4a1790be6b37e4d786ca';
const client_secret = '020025f7f0174443b389f3e730442c7e';
const redirect_uri = 'http://localhost:8080/callback';


var oldsong= "";
const scopes =
  ' streaming'
  +' user-read-email'
  +' user-read-private'
  +' user-read-playback-state'
  +' user-modify-playback-state'
  +' user-read-currently-playing'
  +' app-remote-control'
  +' playlist-read-collaborative'
  +' playlist-modify-public'
  +' playlist-read-private'
  +' playlist-modify-private'
  +' user-library-modify'
  +' user-library-read'
  +' user-top-read'
  +' user-read-playback-position'
  +' user-read-recently-played'
  +' user-follow-read'
  +' user-follow-modify';

app.use(express.static(__dirname + '/public'))
  .use(cors())
  .use(cookieParser());
app.use('/css', express.static(__dirname + 'public/css'));
app.use('/js', express.static(__dirname + 'public/js'));
app.use('/img', express.static(__dirname + 'public/img'));

app.get('', (req, res) => {
  res.sendFile(__dirname + '/public/views/index.html');
})
app.get('/index', (req, res) => {
  res.sendFile(__dirname + '/public/views/index.html');
})
app.get('/contact', (req, res) => {
  res.sendFile(__dirname + '/public/views/contact.html');
})
app.get('/news', (req, res) => {
  res.sendFile(__dirname + '/public/views/news.html');
})
app.get('/topstreams', (req, res) => {
  res.sendFile(__dirname + '/public/views/topstreams.html');
})

var generateRandomString = function(length) {
  var text = '';
  var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (var i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};


var stateKey = 'spotify_auth_state';
app.get('/login', function(req, res) {

  var state = generateRandomString(16);
  res.cookie(stateKey, state);

  // your application requests authorization
  res.redirect('https://accounts.spotify.com/authorize?' +
    querystring.stringify({
      response_type: 'code',
      client_id: client_id,
      scope: scopes,
      redirect_uri: redirect_uri,
      state: state
    }));
});

app.get('/callback', function(req, res) {

  // your application requests refresh and access tokens
  // after checking the state parameter

  var code = req.query.code || null;
  var state = req.query.state || null;
  var storedState = req.cookies ? req.cookies[stateKey] : null;

  if (state === null || state !== storedState) {
    res.redirect('/#' +
      querystring.stringify({
        error: 'state_mismatch'
      }));
  } else {
    res.clearCookie(stateKey);
    var authOptions = {
      url: 'https://accounts.spotify.com/api/token',
      form: {
        code: code,
        redirect_uri: redirect_uri,
        grant_type: 'authorization_code'
      },
      headers: {
        'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64'))
      },
      json: true
    };

    request.post(authOptions, function(error, response, body) {
      if (!error && response.statusCode === 200) {

        var access_token = body.access_token,
          refresh_token = body.refresh_token;
        spotifyApi.setAccessToken(access_token);

        var options = {
          url: 'https://api.spotify.com/v1/me',
          headers: {
            'Authorization': 'Bearer ' + access_token
          },
          json: true
        };

        async function getMyCurrentPlayingTrack(userName) {
          spotifyApi.getMyCurrentPlayingTrack(userName)
            .then(function(data) {
              console.log('Now playing: ' + data.body.item.name);
            }, function(err) {
              console.log('Something went wrong!', err);
            });
        }

        // use the access token to access the Spotify Web API
        request.get(options, function(error, response, body) {
          console.log(body);
          if(typeof (body.id) !== 'undefined'){
          getMyCurrentPlayingTrack(body.id)
        }
        });

        // we can also pass the token to the browser to make requests from there
        res.redirect('/#' +
          querystring.stringify({
            access_token: access_token,
            refresh_token: refresh_token
          }));
      } else {
        res.redirect('/#' +
          querystring.stringify({
            error: 'invalid_token'
          }));
      }
    });
  }
});

app.get('/refresh_token', function(req, res) {

  // requesting access token from refresh token
  var refresh_token = req.query.refresh_token;
  var authOptions = {
    url: 'https://accounts.spotify.com/api/token',
    headers: {
      'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64'))
    },
    form: {
      grant_type: 'refresh_token',
      refresh_token: refresh_token
    },
    json: true
  };

  request.post(authOptions, function(error, response, body) {
    if (!error && response.statusCode === 200) {
      var access_token = body.access_token;
      res.send({
        'access_token': access_token
      });
    }
  });
});


// Server
var server = app.listen(port, () => console.log('Listening on port ' + port));
var io = socket(server);

io.sockets.on('connection', newConnection);


function newConnection(socket) {
  console.log("New connection: " + socket.id);
  io.to(socket.id).emit('Hello', "Welcome");
  socket.broadcast.emit('HelloAll', socket.id);
  socket.on('msg', readMsg);
  socket.on('DJ', sendCurrentSongID);
  socket.on('playing', currentSong);

  function sendCurrentSongID(data) {
    console.log(data);
    socket.broadcast.emit('play', data);

  }
}


function currentSong(data) {
  if (oldsong != data){
    console.log("The DJ is currently playing: " + data);
    io.sockets.emit("playing", data);
    oldsong=data;
  }
}

function readMsg(data) {

  console.log(data);
  fetchAccessToken(data);
}






// send to all: socket.broadcast.emit('Hello', socket.id);

// send to all and self: io.sockets.emit('Hello', socket.id);

// repsond to to one client: io.to(socket.id).emit('Hello', "Welcome");

// to all clients in room1: io.in("room1").emit('Hello', "Welcome");
