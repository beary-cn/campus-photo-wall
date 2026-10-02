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
import { albums, albumPhotos, users } from "@db/schema";
import { eq, desc, sql } from "drizzle-orm";
import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import bcrypt from "bcryptjs";
import * as jose from "jose";

const app = new Hono<{ Bindings: HttpBindings }>();

app.use(bodyLimit({ maxSize: 50 * 1024 * 1024 }));

// 上传的图片静态服务
app.use("/uploads/*", serveStatic({ root: "." }));

// 根路径重定向到照片墙首页
app.get("/", (c) => c.redirect("/pages/html/index.html"));

// ==================== JWT 工具函数 ====================

const JWT_SECRET = new TextEncoder().encode(env.appSecret || "campus-photo-wall-secret-key");

async function signToken(payload: { userId: number; username: string; role: string }) {
  return new jose.SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .setIssuedAt()
    .sign(JWT_SECRET);
}

async function verifyToken(token: string) {
  try {
    const { payload } = await jose.jwtVerify(token, JWT_SECRET, { clockTolerance: 60 });
    return payload as unknown as { userId: number; username: string; role: string };
  } catch {
    return null;
  }
}

async function getAuthUser(c: any) {
  const auth = c.req.header("Authorization");
  const token = auth?.replace("Bearer ", "");
  if (!token) return null;
  const claim = await verifyToken(token);
  if (!claim) return null;
  const db = getDb();
  const [user] = await db.select().from(users).where(eq(users.id, claim.userId)).limit(1);
  return user || null;
}

// ==================== REST API：用户认证 ====================

// 注册
app.post("/api/auth/register", async (c) => {
  const db = getDb();
  const body = await c.req.json<{ username: string; password: string; name?: string }>();

  if (!body.username || !body.password) {
    return c.json({ error: "用户名和密码不能为空" }, 400);
  }
  if (body.username.length < 3 || body.username.length > 20) {
    return c.json({ error: "用户名长度 3-20 位" }, 400);
  }
  if (body.password.length < 6) {
    return c.json({ error: "密码至少 6 位" }, 400);
  }

  const [existing] = await db.select().from(users).where(eq(users.username, body.username)).limit(1);
  if (existing) {
    return c.json({ error: "用户名已存在" }, 409);
  }

  const passwordHash = await bcrypt.hash(body.password, 10);

  const [result] = await db.insert(users).values({
    username: body.username,
    passwordHash,
    name: body.name || body.username,
    avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(body.name || body.username)}`,
  });

  const userId = Number(result.insertId);
  const token = await signToken({ userId, username: body.username, role: "user" });

  return c.json({
    data: {
      token,
      user: {
        id: userId,
        username: body.username,
        name: body.name || body.username,
        role: "user",
      },
    },
  });
});

// 登录
app.post("/api/auth/login", async (c) => {
  const db = getDb();
  const body = await c.req.json<{ username: string; password: string }>();

  if (!body.username || !body.password) {
    return c.json({ error: "用户名和密码不能为空" }, 400);
  }

  const [user] = await db.select().from(users).where(eq(users.username, body.username)).limit(1);
  if (!user || !user.passwordHash) {
    return c.json({ error: "用户名或密码错误" }, 401);
  }

  const valid = await bcrypt.compare(body.password, user.passwordHash);
  if (!valid) {
    return c.json({ error: "用户名或密码错误" }, 401);
  }

  await db.update(users).set({ lastSignInAt: new Date() }).where(eq(users.id, user.id));

  const token = await signToken({ userId: user.id, username: user.username!, role: user.role });

  return c.json({
    data: {
      token,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        avatar: user.avatar,
        role: user.role,
      },
    },
  });
});

// 获取当前用户
app.get("/api/auth/me", async (c) => {
  const user = await getAuthUser(c);
  if (!user) {
    return c.json({ error: "未登录" }, 401);
  }
  return c.json({
    data: {
      id: user.id,
      username: user.username,
      name: user.name,
      avatar: user.avatar,
      role: user.role,
    },
  });
});

// 更新用户信息（名称、头像）
app.patch("/api/auth/me", async (c) => {
  const user = await getAuthUser(c);
  if (!user) return c.json({ error: "未登录" }, 401);

  const db = getDb();
  const body = await c.req.json<{ name?: string; avatar?: string }>();
  const updates: Record<string, any> = {};
  if (body.name !== undefined) updates.name = body.name;
  if (body.avatar !== undefined) updates.avatar = body.avatar;

  await db.update(users).set(updates).where(eq(users.id, user.id));
  return c.json({ ok: true });
});

// 修改密码
app.post("/api/auth/change-password", async (c) => {
  const user = await getAuthUser(c);
  if (!user) return c.json({ error: "未登录" }, 401);

  const db = getDb();
  const body = await c.req.json<{ oldPassword: string; newPassword: string }>();

  if (!body.oldPassword || !body.newPassword) {
    return c.json({ error: "旧密码和新密码不能为空" }, 400);
  }
  if (body.newPassword.length < 6) {
    return c.json({ error: "新密码至少 6 位" }, 400);
  }

  const [current] = await db.select().from(users).where(eq(users.id, user.id)).limit(1);
  if (!current || !current.passwordHash) {
    return c.json({ error: "无法修改密码" }, 400);
  }

  const valid = await bcrypt.compare(body.oldPassword, current.passwordHash);
  if (!valid) {
    return c.json({ error: "旧密码错误" }, 400);
  }

  const newHash = await bcrypt.hash(body.newPassword, 10);
  await db.update(users).set({ passwordHash: newHash }).where(eq(users.id, user.id));
  return c.json({ ok: true });
});

// ==================== REST API：图集 ====================

// 图集列表
app.get("/api/albums", async (c) => {
  const db = getDb();
  const category = c.req.query("category");
  const search = c.req.query("search");
  const userId = c.req.query("userId");
  const limit = parseInt(c.req.query("limit") || "50", 10);
  const offset = parseInt(c.req.query("offset") || "0", 10);

  const conditions: (ReturnType<typeof sql>)[] = [];
  if (category) conditions.push(sql`${albums.category} = ${category}`);
  if (search) conditions.push(sql`(${albums.title} LIKE ${"%" + search + "%"} OR ${albums.intro} LIKE ${"%" + search + "%"})`);
  if (userId) conditions.push(sql`${albums.userId} = ${parseInt(userId, 10)}`);

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

// 创建图集（需登录，关联用户）
app.post("/api/albums", async (c) => {
  const user = await getAuthUser(c);
  if (!user) return c.json({ error: "请先登录" }, 401);

  const db = getDb();
  const body = await c.req.json<{
    folder: string;
    title: string;
    category: string;
    categoriesJson?: string;
    categoryColorsJson?: string;
    intro?: string;
    bilibili?: string;
    content?: string;
    coverImage?: string;
    photos?: { title: string; intro?: string; imagePath: string }[];
  }>();

  if (!body.folder || !body.title) {
    return c.json({ error: "文件夹名和标题不能为空" }, 400);
  }

  const [existing] = await db.select().from(albums).where(eq(albums.folder, body.folder)).limit(1);
  if (existing) {
    return c.json({ error: "图集标识已存在" }, 409);
  }

  const [albumResult] = await db.insert(albums).values({
    userId: user.id,
    folder: body.folder,
    title: body.title,
    category: body.category,
    categoriesJson: body.categoriesJson,
    categoryColorsJson: body.categoryColorsJson,
    intro: body.intro,
    bilibili: body.bilibili,
    content: body.content,
    coverImage: body.coverImage,
  });

  const albumId = Number(albumResult.insertId);

  if (body.photos && body.photos.length > 0) {
    await db.insert(albumPhotos).values(
      body.photos.map((p, i) => ({
        albumId,
        title: p.title,
        intro: p.intro,
        imagePath: p.imagePath,
        sortOrder: i,
      }))
    );
  }

  return c.json({ data: { id: albumId } });
});

// 更新图集（仅创建者或管理员）
app.patch("/api/albums/:id", async (c) => {
  const user = await getAuthUser(c);
  if (!user) return c.json({ error: "请先登录" }, 401);

  const db = getDb();
  const id = parseInt(c.req.param("id"), 10);
  const [album] = await db.select().from(albums).where(eq(albums.id, id)).limit(1);
  if (!album) return c.json({ error: "图集不存在" }, 404);
  if (album.userId !== user.id && user.role !== "admin") {
    return c.json({ error: "无权修改" }, 403);
  }

  const body = await c.req.json<{
    title?: string;
    category?: string;
    intro?: string;
    content?: string;
    coverImage?: string;
  }>();

  await db.update(albums).set(body).where(eq(albums.id, id));
  return c.json({ ok: true });
});

// 删除图集（仅创建者或管理员）
app.delete("/api/albums/:id", async (c) => {
  const user = await getAuthUser(c);
  if (!user) return c.json({ error: "请先登录" }, 401);

  const db = getDb();
  const id = parseInt(c.req.param("id"), 10);
  const [album] = await db.select().from(albums).where(eq(albums.id, id)).limit(1);
  if (!album) return c.json({ error: "图集不存在" }, 404);
  if (album.userId !== user.id && user.role !== "admin") {
    return c.json({ error: "无权删除" }, 403);
  }

  await db.delete(albumPhotos).where(eq(albumPhotos.albumId, id));
  await db.delete(albums).where(eq(albums.id, id));
  return c.json({ ok: true });
});

// ==================== REST API：图片上传 ====================

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
