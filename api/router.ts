import { authRouter } from "./auth-router";
import { albumRouter } from "./album-router";
import { commentRouter } from "./comment-router";
import { uploadRouter } from "./upload-router";
import { createRouter, publicQuery } from "./middleware";

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),
  auth: authRouter,
  album: albumRouter,
  comment: commentRouter,
  upload: uploadRouter,
});

export type AppRouter = typeof appRouter;
