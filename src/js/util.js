const sec2time = (sec) => {
  const h = Math.floor(sec / 3600);
  if (h > 0) {
    sec -= h * 3600;
  }
  let m = Math.floor(sec / 60);
  if (m > 0) {
    sec -= m * 60;
  }
  const s = ('00' + sec).slice(-2);
  let time;
  if (h > 0) {
    m = ('00' + m).slice(-2);
    time = `${h}:${m}:${s}`;
  } else {
    time = `${m}:${s}`;
  }
  return time;
};

const getUniqueStr = (strong=1000) => {
  return new Date().getTime().toString(16)  + Math.floor(strong*Math.random()).toString(16);
};

module.exports = {
  sec2time: sec2time,
  getUniqueStr: getUniqueStr
}