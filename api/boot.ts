import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import { serveStatic } from "@hono/node-server/serve-static";
import type { HttpBindings } from "@hono/node-server";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "./router";
import { createContext } from "./context";
import { env } from "./lib/env";
import { createOAuthCallbackHandler } from "./kimi/auth";
import { Paths } from "@contracts/constants";
import { getDb } from "./queries/connection";
import { albums, albumPhotos, comments } from "@db/schema";
import { eq, desc, sql } from "drizzle-orm";
import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";

const app = new Hono<{ Bindings: HttpBindings }>();

app.use(bodyLimit({ maxSize: 50 * 1024 * 1024 }));

// 上传的图片静态服务
app.use("/uploads/*", serveStatic({ root: "." }));

// 根路径重定向到照片墙首页
app.get("/", (c) => c.redirect("/pages/html/index.html"));

// ==================== REST API（供原生前端调用）====================

// 图集列表
app.get("/api/albums", async (c) => {
  const db = getDb();
  const category = c.req.query("category");
  const search = c.req.query("search");
  const limit = parseInt(c.req.query("limit") || "50", 10);
  const offset = parseInt(c.req.query("offset") || "0", 10);

  const conditions: (ReturnType<typeof sql>)[] = [];
  if (category) conditions.push(sql`${albums.category} = ${category}`);
  if (search) conditions.push(sql`(${albums.title} LIKE ${"%" + search + "%"} OR ${albums.intro} LIKE ${"%" + search + "%"})`);

  const rows = await db
    .select()
    .from(albums)
    .where(conditions.length > 0 ? sql.join(conditions, sql` AND `) : undefined)
    .orderBy(desc(albums.createdAt))
    .limit(limit)
    .offset(offset);

  return c.json({ data: rows });
});

// 图集详情（by folder）
app.get("/api/albums/folder/:folder", async (c) => {
  const db = getDb();
  const folder = c.req.param("folder");
  const [album] = await db.select().from(albums).where(eq(albums.folder, folder)).limit(1);
  if (!album) return c.json({ error: "Not found" }, 404);

  const photos = await db
    .select()
    .from(albumPhotos)
    .where(eq(albumPhotos.albumId, album.id))
    .orderBy(albumPhotos.sortOrder);

  return c.json({ data: { ...album, photos } });
});

// 图集详情（by id）
app.get("/api/albums/:id", async (c) => {
  const db = getDb();
  const id = parseInt(c.req.param("id"), 10);
  const [album] = await db.select().from(albums).where(eq(albums.id, id)).limit(1);
  if (!album) return c.json({ error: "Not found" }, 404);

  const photos = await db
    .select()
    .from(albumPhotos)
    .where(eq(albumPhotos.albumId, album.id))
    .orderBy(albumPhotos.sortOrder);

  return c.json({ data: { ...album, photos } });
});

// 评论列表
app.get("/api/albums/:id/comments", async (c) => {
  const db = getDb();
  const albumId = parseInt(c.req.param("id"), 10);
  const rows = await db
    .select()
    .from(comments)
    .where(eq(comments.albumId, albumId))
    .orderBy(desc(comments.createdAt));
  return c.json({ data: rows });
});

// 发表评论
app.post("/api/albums/:id/comments", async (c) => {
  const db = getDb();
  const albumId = parseInt(c.req.param("id"), 10);
  const body = await c.req.json<{ text: string; userName?: string }>();

  const [comment] = await db.insert(comments).values({
    albumId,
    userName: body.userName || "游客",
    text: body.text,
  });

  return c.json({ data: { id: Number(comment.insertId) } });
});

// 评论点赞
app.post("/api/comments/:id/like", async (c) => {
  const db = getDb();
  const id = parseInt(c.req.param("id"), 10);
  await db
    .update(comments)
    .set({ likes: sql`${comments.likes} + 1` })
    .where(eq(comments.id, id));
  return c.json({ ok: true });
});

// 图片上传（REST，支持 base64）
app.post("/api/upload", async (c) => {
  const body = await c.req.json<{ albumFolder: string; filename: string; base64: string }>();
  const uploadDir = join(process.cwd(), "uploads");
  mkdirSync(uploadDir, { recursive: true });

  const albumDir = join(uploadDir, body.albumFolder.replace(/[^a-zA-Z0-9_-]/g, "_"));
  mkdirSync(albumDir, { recursive: true });

  const base64Data = body.base64.replace(/^data:[^;]+;base64,/, "");
  const buffer = Buffer.from(base64Data, "base64");
  const safeName = body.filename.replace(/[^a-zA-Z0-9._-]/g, "_");
  const filePath = join(albumDir, safeName);
  writeFileSync(filePath, buffer);

  const publicUrl = `/uploads/${body.albumFolder.replace(/[^a-zA-Z0-9_-]/g, "_")}/${safeName}`;
  return c.json({ data: { url: publicUrl, size: buffer.length } });
});

// ==================== tRPC ====================
app.get(Paths.oauthCallback, createOAuthCallbackHandler());
app.use("/api/trpc/*", async (c) => {
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req: c.req.raw,
    router: appRouter,
    createContext,
  });
});
app.all("/api/*", (c) => c.json({ error: "Not Found" }, 404));

export default app;

if (env.isProduction) {
  const { serve } = await import("@hono/node-server");
  const { serveStaticFiles } = await import("./lib/vite");
  serveStaticFiles(app);

  const port = parseInt(process.env.PORT || "3000");
  serve({ fetch: app.fetch, port }, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}
