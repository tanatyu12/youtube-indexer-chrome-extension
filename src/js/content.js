$(function() {
  window.addEventListener("load", main, false);

  function main(e) {
    const jsInitCheckTimer = setInterval(jsLoaded, 1000);
    function jsLoaded() {
      existsMustElement = $('#info-text') != null && $('.ytp-time-current') != null && $('.title') != null && document.querySelector('.ytd-channel-name') != null;
      if (existsMustElement) {
        clearInterval(jsInitCheckTimer);
        console.log("コンテントスクリプトだよ");

        // 画面内にボタンを追加して、clickされたら何か処理させる
        $("#info-text").after("<input type='button' value='index' id='sendButton' style='margin: 0px 10px'>");
        $("#sendButton").click(function() {
          console.log('ボタンが押された');
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
          let folder = {
            id: channelId,
            name: channelName,
          };
          let index = {
            id: movieId+playbackPosition,
            movieId: movieId,
            folderId: channelId,
            position: playbackPosition,
            title: title,
            url: url,
          };
          chrome.runtime.sendMessage({
            message: 'save',
            folder: folder,
            index: index
          }, function(response) {
            console.log(response);
          });
        });
      }
    }
  };

  function getPlayingMovieId() {
    var arg = new Object;

    // 変数pairにURLの?の後ろを&で区切ったものを配列にして代入
    var pair = location.search.substring(1).split('&');

    for(var i = 0; pair[i]; i++) {
    　　// 変数kvにpairを=で区切り配列に分割する
        var kv = pair[i].split('=');
    　　// 最初に定義したオブジェクトargに連想配列として格納
        arg[kv[0]] = kv[1];
    }
    return arg['v'];
  }
});