import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap";
import "../css/popup.css";
require('jquery-ui');
require('jquery-ui/ui/widgets/sortable');
import '@fortawesome/fontawesome-free/js/fontawesome';
import '@fortawesome/fontawesome-free/js/solid';
import '@fortawesome/fontawesome-free/js/regular';
import { sec2time, getUniqueStr } from './util.js';
import { getItem, setItem } from './storage.js';

let folders;
let indices;
let folderMap = {}; // key: folder id, value: folder
let indexMap = {}; // key: index id, value: index
let folderIndicesMap = {}; // key: folder id, value: indices

let clickedType = ''; // folder or index
let clickedId = ''; // folder id or index id

$(function() {
  // adding folder tooltip
  $('.adding-folders').tooltip({
    placement : "top",
    html: true,
    title: 'add folder',
    delay: { "show": 500, "hide": 200 },
    template: '<div class="tooltip" role="tooltip"><div></div><div class="tooltip-inner"></div></div>'
  });

  const getData = async () => {
    folders = await getItem('folders');
    indices = await getItem('indices');
    if (folders === undefined) {
      folders = [];
    }
    if (indices === undefined) {
      indices = [];
    }
    return true
  }

  const render = (folders, indices) => {
    $('#folder-list').empty();
    $('.number-of-indices').text(indices.length);
    folders.forEach(folder => {
      folderMap[folder.id] = folder;
    });
    refreshIndexMap();
    refreshFolderIndicesMap();

    $('#folder-list').sortable({
      cursor: 'move',
      tolerance: 'pointer',
      revert: 200,
      delay: 150,
      activate: function(event, ui) {
        const selectedfolderId = ui.item.attr('id');
        $(`#${selectedfolderId}-contents`).hide();
      },
      beforeStop: function(event, ui) {
        const selectedfolderId = ui.item.attr('id');
        $(`#${selectedfolderId}-contents`).insertAfter(`#${selectedfolderId}`);
        if (ui.item.prev().attr('id')) {
          if (!ui.item.prev().attr('id').match(/-contents$/)) {
            const replacedFolderId = ui.item.prev().attr('id');
            $(`#${replacedFolderId}-contents`).insertAfter(`#${replacedFolderId}`);
          }
        }
      },
      update: function(event, ui) {
        const order = $('#folder-list').sortable('toArray').filter(value => !value.match(/-contents$/));
        changeFolderOrder(order);
        displayIndicesWrapperIfEmpty(ui.item.attr('id'));
      }
    });

    folders.sort(function(a, b) {
      return a.order - b.order;
    });
    // render folder
    folders.forEach(folder => {
      const folderListElm = `<div id="${folder.id}" class="list-group-item list-group-item-action folder ellipsis">
        <i class="fas fa-folder"></i><span class="folder-title">${folder.name}</span>
        <span class="border border-left-0 border-right-0 border-top-0 menu-icon" style="position: absolute;top: 0px;right: 0px;height: 50px; width: 30px;padding-left: 5px;padding-top: 10px;" hidden>
          <i class="fas fa-ellipsis-h"></i>
        </span>
      </div>`;
      $('#folder-list').append(folderListElm);

      // render indices per folder (folder contents)
      const indexListElm = `<div id="${folder.id}-contents" class="list-group indices-wrapper"></div>`;
      $(`#${folder.id}`).after(indexListElm);
      $(`#${folder.id}-contents`).hide();
      $(`#${folder.id}-contents`).sortable({
        cursor: 'move',
        tolerance: 'pointer',
        revert: 200,
        delay: 150,
        connectWith: '.indices-wrapper',
        update: function(event, ui) {
          const order = $(`#${folder.id}-contents`).sortable('toArray');
          const originFolderId = indexMap[ui.item.attr('id')].folderId;
          moveIndexIfReceived(order, folder.id);
          changeIndexOrder(order).then(res => {
            displayIndicesWrapperIfEmpty(originFolderId);
            refreshFolderIndicesMap();
          });
        }
      });
      let indexElmList = [];
      if (folderIndicesMap[folder.id]) {
        folderIndicesMap[folder.id].sort(function(a, b) {
          return a.order - b.order;
        });
        folderIndicesMap[folder.id].forEach((index) => {
          const currentTime = sec2time(index.position);
          const indexElm = `<div id="${index.id}" class="index-wrapper"><a href="${index.url}" class="list-group-item list-group-item-action index border border-right-0 border-left-0" target="_blank">
            <div class="d-flex justify-content-between index-content">
              <small class="font-weight-bold ellipsis index-title">${index.title}</small>
              <small>${currentTime}</small>
            </div>
          </a>
          <span class="menu-item menu-icon" style="position: absolute;top: 0px;right: -30px;height: 50px; width: 30px;padding-left: 5px;padding-top: 10px;" hidden>
            <i class="fas fa-ellipsis-h"></i>
          </span>
          </div>
          `;
          indexElmList.push(indexElm);
        });
      }
      $(`#${folder.id}-contents`).append(indexElmList.join(''));
      displayIndicesWrapperIfEmpty(folder.id);
    });
  }

  const refreshIndexMap = () => {
    indexMap = {};
    indices.forEach(index => {
      indexMap[index.id] = index;
    });
  }

  const refreshFolderIndicesMap = () => {
    folderIndicesMap = {};
    indices.forEach(index => {
      if (!folderIndicesMap[index.folderId]) {
        folderIndicesMap[index.folderId] = [];
      }
      folderIndicesMap[index.folderId].push(index);
    });
  }

  const deleteIndex = async(id) => {
    indices = indices.filter(index => index.id !== id);
    await setItem('indices', indices);
    return true;
  }

  const deleteFolder = async(id) => {
    folders = folders.filter(folder => folder.id !== id);
    await setItem('folders', folders);
    indices = indices.filter(index => index.folderId !== id);
    await setItem('indices', indices);
    return true;
  }

  const editIndex = async(index) => {
    indices = indices.map(value => {
      if (value.id === index.id) {
        return index;
      }
      return value;
    });
    await setItem('indices', indices);
    return true;
  }

  const editFolder = async(folder) => {
    folders = folders.map(value => {
      if (value.id === folder.id) {
        return folder;
      }
      return value;
    });
    await setItem('folders', folders);
    return true;
  }

  const changeIndexOrder = async(order) => {
    order.forEach((value, i) => {
      indexMap[value].order = i;
    });
    indices = Object.values(indexMap);
    await setItem('indices', indices);
    return true;
  }

  const moveIndexIfReceived = (order, receivedFolderId) => {
    order.forEach(value => {
      if (indexMap[value].id !== receivedFolderId) {
        indexMap[value].folderId = receivedFolderId;
      }
    });
  }

  const changeFolderOrder = async(order) => {
    order.forEach((value, i) => {
      folderMap[value].order = i;
    });
    folders = Object.values(folderMap);
    await setItem('folders', folders);
    return true;
  }

  const addFolder = async(folder) => {
    let sameFolderAlreadyExists = false;
    if (folders.length > 0) {
      sameFolderAlreadyExists = folders.filter(val => val.id === folder.id).length > 0;
    }
    if (folders.length === 0 || sameFolderAlreadyExists === false) {
      folder.order = folders.length;
      folders.push(folder);
      await setItem('folders', folders);
    }
    return true;
  }

  const displayIndicesWrapperIfEmpty = (folderId) => {
    if ($(`#${folderId}-contents .index-wrapper`).length === 0) {
      $(`#${folderId}-contents`).css('display', 'block');
    }
  }

  $(document).on('click', '.menu-icon', function(event) {
    if ($(this).parent().hasClass('folder')) {
      clickedType = 'folder';
      clickedId = $(this).parent().attr('id');
    } else if ($(this).parent().hasClass('index-wrapper')) {
      clickedType = 'index';
      clickedId = $(this).parent().attr('id');
    }
    $(this).tooltip({
      trigger: 'manual',
      placement : "bottom",
      html: true,
      title: `<i class="fas fa-edit mr-2"></i><i class="fas fa-trash"></i>`,
      template: '<div class="tooltip" role="tooltip"><div></div><div class="tooltip-inner"></div></div>'
    });
    $(this).tooltip('show');
    $(this).addClass('focused');
    event.stopImmediatePropagation();
  });

  $(document).on({
    'click': function() {
      $('.focused').tooltip('hide');
      if (clickedType === 'index') {
        $('#editIndexTitle').val(indexMap[clickedId].title);
        $('#editIndexModal').modal();
      } else if (clickedType === 'folder') {
        $('#editFolderTitle').val(folderMap[clickedId].name);
        $('#editFolderModal').modal();
      }
    }
  }, '.fa-edit');

  $('#saveIndexChanges').on('click', function() {
    $('#editIndexModal').modal('hide');
    indexMap[clickedId].title = $('#editIndexTitle').val().trim();
    editIndex(indexMap[clickedId]).then(res => {
      $(`#${clickedId} div > .index-title`).text(indexMap[clickedId].title);
    });
  });

  $('#saveFolderChanges').on('click', function() {
    $('#editFolderModal').modal('hide');
    folderMap[clickedId].name = $('#editFolderTitle').val().trim();
    editFolder(folderMap[clickedId]).then(res => {
      $(`#${clickedId} > .folder-title`).text(folderMap[clickedId].name);
    });
  });

  $(document).on({
    'click': function() {
      $('#addFolderModal').modal();
    }
  }, '.fa-plus');

  $('#addFolder').on('click', function() {
    $('#addFolderModal').modal('hide');
    let folder = {
      id: getUniqueStr(),
      name: $('#addFolderTitle').val().trim()
    };
    addFolder(folder).then(res => {
      render(folders, indices);
    });
  });

  $(document).on({
    'click': function() {
      if (clickedType === 'index') {
        deleteIndex(clickedId).then(res => {
          displayIndicesWrapperIfEmpty(indexMap[clickedId].folderId);
          refreshIndexMap();
          refreshFolderIndicesMap();
          $('.focused').tooltip('hide');
          $(`#${clickedId}`).remove();
        });
      } else if (clickedType === 'folder') {
        deleteFolder(clickedId).then(res => {
          refreshIndexMap();
          refreshFolderIndicesMap();
          $('.focused').tooltip('hide');
          $(`#${clickedId}`).remove();
          $(`#${clickedId}-contents`).remove();
        });
      }
    }
  }, '.fa-trash');

  $(document).click(function(event) {
    if(!$(event.target).closest('.tooltip').length) {
      $('.focused').tooltip('hide');
    }
  });

  $(document).on({
    'click': function() {
      const id = $(this).attr('id');
      if (!folderIndicesMap[id]) {
        return;
      }
      if($(`#${id}-contents`).is(":hidden")) {
        $(`#${id}-contents`).slideDown(300);
      } else {
        $(`#${id}-contents`).slideUp(300);
      }
    },
    'mouseover': function() {
      $(this).children('.menu-icon').eq(0).removeAttr('hidden');
    },
    'mouseout': function() {
      $(this).children('.menu-icon').eq(0).attr('hidden', 'hidden');
    },
  }, '.folder');

  $(document).on({
    'mouseover': function() {
      $(this).children('.menu-icon').eq(0).removeAttr('hidden');
    },
    'mouseout': function() {
      $(this).children('.menu-icon').eq(0).attr('hidden', 'hidden');
    }
  }, '.index-wrapper');

  getData().then(res => {
    render(folders, indices);
  });
});