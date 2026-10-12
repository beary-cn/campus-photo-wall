import { albumRouter } from "./album-router";
import { uploadRouter } from "./upload-router";
import { createRouter, publicQuery } from "./middleware";

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),
  album: albumRouter,
  upload: uploadRouter,
});

export type AppRouter = typeof appRouter;
