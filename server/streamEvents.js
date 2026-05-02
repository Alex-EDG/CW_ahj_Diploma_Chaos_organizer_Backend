const {streamEvents} = require("http-event-stream");

function sse(ctx) {

  streamEvents(ctx.req, ctx.res, {
    async fetch() {
      return [];
    },

    stream(streamContext) {
      const listener = (options) => {
        streamContext.sendEvent({
          data: JSON.stringify(options),
          event: options.event
        });
      };

      ctx.emitter.on("message", listener);
      return () => {
        ctx.emitter.off("message", listener);
      };
    }
  });
  ctx.respond = false;
}

module.exports = function (router) {
  router.get("/api/sse", sse);
};
