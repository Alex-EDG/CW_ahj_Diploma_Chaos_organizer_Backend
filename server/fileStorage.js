const fs = require("fs");
const uuid = require("uuid");

class FileStorage {
  constructor(path) {
    this.path = path;
  }

  getPath(id) {
    return {contentPath: `${this.path}/${id}`, typePath: `${this.path}/${id}.meta`};
  }

  putData(content, type, name) {
    if (!fs.existsSync(this.path)) {
      fs.mkdirSync(this.path, {recursive: true});
    }
    const id = uuid.v4();
    const data = JSON.stringify({type, name});
    fs.writeFileSync(`${this.path}/${id}`, content);
    fs.writeFileSync(`${this.path}/${id}.meta`, data, "utf-8");
    return id;
  }

  getData(id) {
    const {contentPath, typePath} = this.getPath(id);

    if (!fs.existsSync(contentPath) || !fs.existsSync(typePath)) {
      return null;
    }

    const content = fs.readFileSync(`${this.path}/${id}`);
    const meta = JSON.parse(fs.readFileSync(`${this.path}/${id}.meta`, "utf-8"));

    return {meta, content};
  }

  deleteData(id) {
    const path = `${this.path}/${id}`;
    const metaPath = `${this.path}/${id}.meta`;
    if (!fs.existsSync(path) || !fs.existsSync(metaPath)) {
      return {result: false, text: "Content was not found"};
    }
    fs.rmSync(`${this.path}/${id}`);
    fs.rmSync(`${this.path}/${id}.meta`);
    if (fs.existsSync(path) || fs.existsSync(metaPath)) {
      return {result: false, text: "Content was not delete"};
    }
    return {result: true, text: null};
  }
}

module.exports = FileStorage;
