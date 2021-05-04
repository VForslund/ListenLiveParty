var socket;
var code;
var dj = false;

function start() {
  socket = io.connect('http://localhost:8080');
  socket.on('Hello', greeting);
  socket.on('HelloAll', addToList);
  socket.on('token', addToList);
  socket.on('playing', djIsPlaying);
  socket.on('play', playSong);
  if (window.location.search.length > 0) {
    handelReDirect();
  }
}

function addToList(data) {
  var txt = document.getElementById("servertxt").innerHTML;
  txt += "\n" + " A new client was connected to the server: " + data;
  document.getElementById("servertxt").innerHTML = txt;
}

function greeting(data) {
  var txt = document.getElementById("servertxt").innerHTML;
  txt += "\n" + data;
  document.getElementById("servertxt").innerHTML = txt;
}

function djIsPlaying(data) {
  var txt = document.getElementById("servertxt").innerHTML;
  txt += "\n" + data;
  document.getElementById("servertxt").innerHTML = txt;
}

function playForALL() {
  dj = true;
}

function playSong(data) {
  playID(data);
  console.log(data);
}
