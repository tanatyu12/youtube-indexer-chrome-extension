const getItem = async(key) => {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(key, function(data) {
      resolve(data[key]);
    });
  });
}

const setItem = async(key, value) => {
  let obj = {};
  obj[key] = value;
  chrome.storage.local.set(obj);
}

module.exports = {
  getItem: getItem,
  setItem: setItem
}