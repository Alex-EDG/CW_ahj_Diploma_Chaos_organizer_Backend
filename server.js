const Koa = require("koa");
const Router = require("koa-router");
const cors = require("@koa/cors");
const uuid = require("uuid");
const Emitter = require("component-emitter");

const koaBody = require("koa-body");

const rawBody = require("raw-body");
const Database = require("./components/dataBase");
const FileStorage = require("./components/fileStorage");
const fs = require("fs");
const dataConfig = fs.readFileSync("config.json", "utf8");
const config = JSON.parse(dataConfig);
const emitter = new Emitter();

const app = new Koa();

app.use(cors({
  credentials: true
}));

app.use(function* (next) {
  this.db = new Database(`${config.databasePath}/db.json`,emitter);
  this.storage = new FileStorage(`${config.fileStoragePath}`);
  this.emitter = emitter
  yield next;
});


app.use(function* (next) {
  const type = this.req.headers["content-type"];
  if (type && !type.startsWith("text/") && type !== "application/json") {
    this.rawRequestBody = yield rawBody(this.req);
  }
  yield next;
});

app.use(koaBody({
  includeUnparsed: true,
  urlencoded: false,
  json: false,
}));

const router = new Router();
router.get("/", ctx => ctx.response.body = "I'm alive");

require("./components/messageHandlers")(router);
require("./components/contentHandlers")(router);
require("./components/streamEvents")(router);

app.use(router.routes()).use(router.allowedMethods());


const port = config.listenPort;
app.listen(port, () => {
  console.log(`Server running on port ${port}...`);
});

