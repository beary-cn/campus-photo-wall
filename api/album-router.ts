import { z } from "zod";
import { createRouter, publicQuery, adminQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { albums, albumPhotos } from "@db/schema";
import { eq, desc, sql } from "drizzle-orm";

const listInput = z.object({
  category: z.string().optional(),
  search: z.string().optional(),
  limit: z.number().min(1).max(100).optional().default(50),
  offset: z.number().min(0).optional().default(0),
});

export const albumRouter = createRouter({
  // ========== 图集列表 ==========
  list: publicQuery
    .input(listInput.optional())
    .query(async ({ input }) => {
      const db = getDb();
      const opts = input ?? { limit: 50, offset: 0 };
      const conditions = [];

      if (opts.category) {
        conditions.push(sql`${albums.category} = ${opts.category}`);
      }
      if (opts.search) {
        conditions.push(
          sql`(${albums.title} LIKE ${"%" + opts.search + "%"} OR ${albums.intro} LIKE ${"%" + opts.search + "%"})`
        );
      }

      const rows = await db
        .select()
        .from(albums)
        .where(conditions.length > 0 ? sql.join(conditions, sql` AND `) : undefined)
        .orderBy(desc(albums.createdAt))
        .limit(opts.limit)
        .offset(opts.offset);

      return rows;
    }),

  // ========== 图集详情 ==========
  detail: publicQuery
    .input(z.object({ id: z.union([z.string(), z.number()]) }))
    .query(async ({ input }) => {
      const db = getDb();
      const id = typeof input.id === "string" ? parseInt(input.id, 10) : input.id;

      const [album] = await db.select().from(albums).where(eq(albums.id, id)).limit(1);
      if (!album) throw new Error("Album not found");

      const photos = await db
        .select()
        .from(albumPhotos)
        .where(eq(albumPhotos.albumId, album.id))
        .orderBy(albumPhotos.sortOrder);

      return {
        ...album,
        photos,
      };
    }),

  // ========== 按文件夹名获取详情 ==========
  byFolder: publicQuery
    .input(z.object({ folder: z.string() }))
    .query(async ({ input }) => {
      const db = getDb();
      const [album] = await db
        .select()
        .from(albums)
        .where(eq(albums.folder, input.folder))
        .limit(1);

      if (!album) throw new Error("Album not found");

      const photos = await db
        .select()
        .from(albumPhotos)
        .where(eq(albumPhotos.albumId, album.id))
        .orderBy(albumPhotos.sortOrder);

      return {
        ...album,
        photos,
      };
    }),

  // ========== 创建图集（管理员） ==========
  create: adminQuery
    .input(
      z.object({
        folder: z.string().min(1).max(255),
        title: z.string().min(1).max(255),
        category: z.string().max(64),
        categoriesJson: z.string().optional(),
        categoryColorsJson: z.string().optional(),
        intro: z.string().optional(),
        bilibili: z.string().optional(),
        content: z.string().optional(),
        coverImage: z.string().optional(),
        photos: z
          .array(
            z.object({
              title: z.string(),
              intro: z.string().optional(),
              imagePath: z.string(),
            })
          )
          .optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const [album] = await db.insert(albums).values({
        folder: input.folder,
        title: input.title,
        category: input.category,
        categoriesJson: input.categoriesJson,
        categoryColorsJson: input.categoryColorsJson,
        intro: input.intro,
        bilibili: input.bilibili,
        content: input.content,
        coverImage: input.coverImage,
      });

      const albumId = Number(album.insertId);

      if (input.photos && input.photos.length > 0) {
        await db.insert(albumPhotos).values(
          input.photos.map((p, i) => ({
            albumId,
            title: p.title,
            intro: p.intro,
            imagePath: p.imagePath,
            sortOrder: i,
          }))
        );
      }

      return { id: albumId };
    }),

  // ========== 更新图集（管理员） ==========
  update: adminQuery
    .input(
      z.object({
        id: z.number(),
        folder: z.string().min(1).max(255).optional(),
        title: z.string().min(1).max(255).optional(),
        category: z.string().max(64).optional(),
        categoriesJson: z.string().optional(),
        categoryColorsJson: z.string().optional(),
        intro: z.string().optional(),
        bilibili: z.string().optional(),
        content: z.string().optional(),
        coverImage: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const { id, ...data } = input;
      await db.update(albums).set(data).where(eq(albums.id, id));
      return { ok: true };
    }),

  // ========== 删除图集（管理员） ==========
  delete: adminQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.delete(albumPhotos).where(eq(albumPhotos.albumId, input.id));
      await db.delete(albums).where(eq(albums.id, input.id));
      return { ok: true };
    }),
});
