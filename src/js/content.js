import { Folder, Index } from './datatype.js';

$(function() {
  window.addEventListener("load", main, false);

  function main(e) {
    const jsInitCheckTimer = setInterval(jsLoaded, 1000);
    function jsLoaded() {
      const existsMustElement = $('#info-text') != null && $('.ytp-time-current') != null && $('.title') != null && document.querySelector('.ytd-channel-name') != null;
      if (existsMustElement) {
        clearInterval(jsInitCheckTimer);

        $("#info-text").after("<input type='button' value='index' id='sendButton' style='margin: 0px 10px'>");
        $("#sendButton").click(function() {
          const currentTime = $('.ytp-time-current').text();
          let h = 0;
          let m = 0;
          let s = 0;
          if (currentTime.length > 5) {
            // [1:00:00]~
            [h, m, s] = currentTime.split(':');
          } else {
            // [0:00]~[59:59]
            [m, s] = currentTime.split(':');
          }
          const playbackPosition = parseInt(h) * 3600 + parseInt(m) * 60 + parseInt(s);
          const title = $('#info-contents .ytd-watch-flexy #container .title').text().trim();
          const channelName = document.querySelector('.ytd-channel-name').innerText.trim();
          const channelId = $('.ytd-channel-name > a').attr('href').split('/')[2];
          const movieId =getPlayingMovieId();
          const url = `https://youtu.be/${movieId}?t=${playbackPosition}`;
          let folder = new Folder(channelId, channelName);
          let index = new Index(movieId+playbackPosition, movieId, channelId, playbackPosition, title, url);
          chrome.runtime.sendMessage({
            message: 'save',
            folder: folder,
            index: index
          });
        });
      }
    }
  };

  function getPlayingMovieId() {
    var arg = new Object;

    var pair = location.search.substring(1).split('&');

    for(var i = 0; pair[i]; i++) {
        var kv = pair[i].split('=');
        arg[kv[0]] = kv[1];
    }
    return arg['v'];
  }
});