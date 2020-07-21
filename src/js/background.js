import { getItem, setItem } from './storage.js';

const saveIndexAndFolder = async (folder, index) => {
  console.log("save");
  let indices = await getItem('indices');
  let folders = await getItem('folders');
  if (folders === undefined) {
    folders = [];
  }
  let sameFolderAlreadyExists = false;
  if (folders.length > 0) {
    sameFolderAlreadyExists = folders.filter(val => val.id === folder.id).length > 0;
  }
  if (folders.length === 0 || sameFolderAlreadyExists === false) {
    folder.order = folders.length;
    folders.push(folder);
    await setItem('folders', folders);
  }
  if (indices === undefined) {
    indices = [];
  }
  if (indices.length > 0) {
    index.order = indices.filter(val => val.folderId === index.folderId).length;
  } else {
    index.order = 0;
  }
  const existsSameIndex = indices.filter(val => val.id === index.id).length > 0;
  if (!existsSameIndex) {
    indices.push(index);
    await setItem('indices', indices);
  }
  return {
    index: indices,
    folder: folders
  };
}

chrome.runtime.onInstalled.addListener(function() {
    chrome.declarativeContent.onPageChanged.removeRules(undefined, function() {
      chrome.declarativeContent.onPageChanged.addRules([{
        conditions: [new chrome.declarativeContent.PageStateMatcher({
          pageUrl: {hostEquals: 'www.youtube.com'},
        })
        ],
        actions: [new chrome.declarativeContent.ShowPageAction()]
      }]);
    });
});

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    console.log("request");
    console.log(sender.tab ?
                "from a content script:" + sender.tab.url :
                "from the extension");
    if (request.message == "save") {
      console.log(request.index);
      console.log(request.folder);
      saveIndexAndFolder(request.folder, request.index).then(res => {
        console.log(res.index);
        console.log(res.folder);
        return sendResponse(res);
      });
      return true;
    }
});