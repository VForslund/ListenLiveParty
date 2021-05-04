var oldID;
var playerSpace = {};

window.onSpotifyWebPlaybackSDKReady = () => {


  var url = new URL(window.location.hash);
  var code = document.URL.substr(document.URL.indexOf('#') + 1);
  code = code.split('&')[0];
  code = code.split('=')[1];

  console.log(code);


  const token = code;
  playerSpace.player = new Spotify.Player({
    name: 'Listen Party',
    getOAuthToken: cb => {
      cb(token);
    },
    volume: 1
  });


  // Error handling
  playerSpace.player.addListener('initialization_error', ({
    message
  }) => {
    console.error(message);
  });
  playerSpace.player.addListener('authentication_error', ({
    message
  }) => {
    console.error(message);
  });
  playerSpace.player.addListener('account_error', ({
    message
  }) => {
    console.error(message);
  });
  playerSpace.player.addListener('playback_error', ({
    message
  }) => {
    console.error(message);
  });

  // Playback status updates
  playerSpace.player.addListener('player_state_changed', ({
    //position,
    duration,
    track_window: {
      current_track
    }
  }) => {
    var time = duration / 1000;
    var minutes = Math.floor(time / 60);
    var seconds = Math.round(time - minutes * 60);
    console.log('Length of Song ', duration);
    document.getElementById("totalTime").innerHTML = minutes + ":" + seconds;
    console.log('Currently Playing', current_track.name);
    document.getElementById("imageid").src = current_track.album.images[0].url;
    document.getElementById('ProgressSlider');
    var progress = current_track.duration;

    if (current_track.id !== oldID && dj == true) {
      socket.emit('DJ', current_track.id);
      console.log(current_track.id);
      oldID = current_track.id;
      socket.emit('playing', current_track.name);
    }

  });

  // Ready
  playerSpace.player.addListener('ready', ({
    device_id
  }) => {
    console.log('Ready with Device ID', device_id);


    playerSpace.play = ({
      spotify_uri,
      playerInstance: {
        _options: {
          getOAuthToken,
          id
        }
      }
    }) => {
      getOAuthToken(access_token => {
        fetch(`https://api.spotify.com/v1/me/player/play?device_id=${device_id}`, {
          method: 'PUT',
          body: JSON.stringify({
            uris: [spotify_uri]
          }),
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${access_token}`
          },
        });
      });
    };
  });

  // Not Ready
  playerSpace.player.addListener('not_ready', ({
    device_id
  }) => {
    console.log('Device ID has gone offline', device_id);
  });

  // Connect to the player!
  playerSpace.player.connect();

};
var seconds = 0;
//var sec = getElementById('ProgressSlider');
/*function.getSongSeconds() {
  seconds += 1;
  sec.innerText "Song time is " + seconds + "seconds";
}*/

function play() {
  playerSpace.play({
    playerInstance: playerSpace.player,
    spotify_uri: 'spotify:track:4NsPgRYUdHu2Q5JRNgXYU5',
  });
  console.log('Toggled playback!');
  var btn = document.getElementById("toggleButton");
  btn.classList.toggle("paused");
}

function playID(ID) {
  playerSpace.play({
    playerInstance: playerSpace.player,
    spotify_uri: 'spotify:track:'+ID,
  });
  console.log('Toggled playback!');
  var btn = document.getElementById("toggleButton");
  btn.classList.toggle("paused");
}

function togglePlay() {
  playerSpace.player.togglePlay().then(() => {
    console.log('Toggled playback!');
    var btn = document.getElementById("toggleButton");
    btn.classList.toggle("paused");
    return false;
  });
}

function updateVolume(val) {
  playerSpace.player.setVolume((val * 1.0) / 100);
  console.log((val * 1.0) / 100);
}
