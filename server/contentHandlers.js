function getContent(ctx, download) {
  const {meta, content} = ctx.storage.getData(ctx.params.id) ?? {};
  if (!content) {
    ctx.response.status = 404;
    ctx.response.body = "Content is not found";
    return;
  }
  ctx.set("content-type", meta.type);
  if (download) {
    ctx.set("content-disposition", `attachment; filename=${meta.name}`,);
  }
  ctx.response.body = content;
}

module.exports = function (router) {

  router.get("/api/content/:id", ctx => getContent(ctx, false));
  router.get("/api/download/:id", ctx => getContent(ctx, true));
};
