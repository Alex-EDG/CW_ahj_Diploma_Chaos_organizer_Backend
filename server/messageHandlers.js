const fs = require("fs");
const dataConfig = fs.readFileSync("./config.json", "utf8");
const config = JSON.parse(dataConfig);

function getRequestContentValue(ctx) {
  const contentType = ctx.request.header["content-type"];

  const body = contentType.startsWith("text/")
    ? ctx.request.body
    : ctx.rawRequestBody;

  const name = ctx.request.header["x-file-name"];

  return {
    text: decodeURI(ctx.request.header["x-file-describe"]),
    name: name,
    id: `${ctx.storage.putData(body, contentType, name)}`
  };

}

function getRequestLocation(ctx) {
  if (!ctx.request.header["x-longitude"] || !ctx.request.header["x-latitude"]) {
    return null;
  }

  return {
    longitude: parseFloat(ctx.request.header["x-longitude"]),
    latitude: parseFloat(ctx.request.header["x-latitude"])
  };
}

function createNewFileMsg(ctx) {
  if (!ctx.request.header["x-file-describe"] || !ctx.request.header["x-file-name"]) {
    ctx.response.status = 400;
    ctx.response.body = "Message must have name and description in request.headers";
    return;
  }

  const content = getRequestContentValue(ctx);
  const message = {
    content: content,
    type: ctx.request.header["content-type"],
    location: getRequestLocation(ctx)
  };

  const saveMsg = ctx.db.createSaveMsg(message);

  if (!saveMsg) {
    ctx.response.status = 500;
    ctx.response.body = "Message is not create";
    return;
  }

  ctx.response.body = JSON.stringify(saveMsg);
}

function createNewTextMsg(ctx) {

  const content = {text: ctx.request.body, name: null, id: null};
  const message = {
    content: content,
    type: ctx.request.header["content-type"],
    location: getRequestLocation(ctx)
  };

  const saveMsg = ctx.db.createSaveMsg(message);

  if (!saveMsg) {
    ctx.response.status = 500;
    ctx.response.body = "Message is not create";
    return;
  }

  ctx.response.body = JSON.stringify(saveMsg);
}

function getLastMsgList(ctx) {
  const start = ctx.query.start;
  const limit = ctx.query.limit;
  const text = ctx.query.text;
  const type = ctx.query.type;
  const favorite = ctx.query.favorite;

  const list = ctx.db.getLastMsgList(start, limit, text, type, favorite);
  if (!list) {
    ctx.response.status = 500;
    ctx.response.body = "Something is wrong";
    return;
  }
  ctx.response.body = JSON.stringify(list);
}

function toAndFromFavorite(ctx) {
  const id = ctx.params.id;
  const isFavorite = JSON.parse(ctx.request.body)
  if (!ctx.db.toFavorite(id,isFavorite)) {
    ctx.response.status = 500;
    ctx.response.body = "Message with this id is not found";
    return;
  }
  ctx.response.body = "ok";
}


function getPinMsg(ctx) {
  const pin = ctx.db.getPinMsg();
  if (!pin || !pin.content) {
    ctx.response.status = 404;
    ctx.response.body = "Pin was not found";
    return;
  }
  ctx.response.body = JSON.stringify(pin);
}

function putPinMsg(ctx) {
  const id = ctx.request.body;
  if (!id) {
    ctx.response.status = 400;
    ctx.response.body = "Id was not found";
    return;
  }

  const pin = ctx.db.putPinMsg(id);
  if (!pin) {
    ctx.response.status = 500;
    ctx.response.body = "Message with such id was not found";
    return;
  }
  ctx.response.body = JSON.stringify(pin);
}

function deletePinMsg(ctx) {
  const pinDelete = ctx.db.deletePinMsg();
  if (pinDelete) {
    ctx.response.status = 500;
    ctx.response.body = "Something is wrong";
  }
  ctx.response.body = "ok";
}

function deleteMessage(ctx) {
  const id = ctx.params.id;
  const result = ctx.db.deleteMsg(id);

  if (!result.isMessageDeleted && result.text) {
    ctx.response.status = 500;
    ctx.response.body = result.text;
    return;
  }

  if (result.href) {
    const isContentDeleted = ctx.storage.deleteData(result.href);

    if (!isContentDeleted.result) {
      ctx.response.status = 500;
      ctx.response.body = isContentDeleted.text;
    }
  }
  ctx.db.onDeleteMessage(id);
  ctx.response.body = "ok";
}

function resetMessages(ctx) {
  fs.rmSync(ctx.storage.path, {recursive: true, force: true});
  fs.rmSync(ctx.db.path, {recursive: true, force: true});
  fs.cpSync(`${config["defaultUserData"]}/storage/default`, ctx.storage.path, {recursive: true});
  fs.cpSync(`${config["defaultUserData"]}/default.json`, ctx.db.path, {recursive: true});

  ctx.response.body = "ok";
}

module.exports = function (router) {
  router.get("/api/messages", getLastMsgList);
  router.get("/api/messages/pin", getPinMsg);
  router.put("/api/messages/pin", putPinMsg);
  router.post("/api/messages/text", createNewTextMsg);
  router.post("/api/messages/file", createNewFileMsg);
  router.patch("/api/messages/:id", toAndFromFavorite);
  router.delete("/api/messages/pin", deletePinMsg);
  router.delete("/api/messages/:id", deleteMessage);
  router.post("/api/messages/reset", resetMessages);
};
