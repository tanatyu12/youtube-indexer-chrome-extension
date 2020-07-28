class Folder {
  constructor(id, name) {
    this.id = id;
    this.name = name;
    this.order = -1;
    return this.folder;
  }
  get folder() {
    return {
      id: this.id,
      name: this.name,
      order: this.order
    };
  }
}
class Index {
  constructor(id, movieId, folderId, position, title, url) {
    this.id = id;
    this.movieId = movieId;
    this.folderId = folderId;
    this.position = position;
    this.title = title;
    this.url = url;
    return this.index;
  }
  get index() {
    return {
      id: this.id,
      movieId: this.movieId,
      folderId: this.folderId,
      position: this.position,
      title: this.title,
      url: this.url
    };
  }
}

module.exports = {
  Folder: Folder,
  Index: Index
}