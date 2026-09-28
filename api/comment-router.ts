import { z } from "zod";
import { createRouter, publicQuery, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { comments } from "@db/schema";
import { eq, desc, sql } from "drizzle-orm";

export const commentRouter = createRouter({
  // ========== 评论列表 ==========
  list: publicQuery
    .input(z.object({ albumId: z.union([z.string(), z.number()]) }))
    .query(async ({ input }) => {
      const db = getDb();
      const albumId =
        typeof input.albumId === "string"
          ? parseInt(input.albumId, 10)
          : input.albumId;

      const rows = await db
        .select()
        .from(comments)
        .where(eq(comments.albumId, albumId))
        .orderBy(desc(comments.createdAt));

      return rows;
    }),

  // ========== 发表评论（登录用户） ==========
  create: authedQuery
    .input(
      z.object({
        albumId: z.union([z.string(), z.number()]),
        text: z.string().min(1).max(500),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const albumId =
        typeof input.albumId === "string"
          ? parseInt(input.albumId, 10)
          : input.albumId;

      const [comment] = await db.insert(comments).values({
        albumId,
        userId: ctx.user.id,
        userName: ctx.user.name || "匿名用户",
        userAvatar: ctx.user.avatar || "",
        text: input.text,
      });

      return { id: Number(comment.insertId) };
    }),

  // ========== 匿名评论（游客） ==========
  createAnonymous: publicQuery
    .input(
      z.object({
        albumId: z.union([z.string(), z.number()]),
        text: z.string().min(1).max(500),
        userName: z.string().min(1).max(50).default("游客"),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const albumId =
        typeof input.albumId === "string"
          ? parseInt(input.albumId, 10)
          : input.albumId;

      const [comment] = await db.insert(comments).values({
        albumId,
        userName: input.userName,
        text: input.text,
      });

      return { id: Number(comment.insertId) };
    }),

  // ========== 删除评论（本人或管理员） ==========
  delete: authedQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const [comment] = await db
        .select()
        .from(comments)
        .where(eq(comments.id, input.id))
        .limit(1);

      if (!comment) throw new Error("Comment not found");
      if (comment.userId !== ctx.user.id && ctx.user.role !== "admin") {
        throw new Error("Permission denied");
      }

      await db.delete(comments).where(eq(comments.id, input.id));
      return { ok: true };
    }),

  // ========== 点赞 ==========
  like: publicQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db
        .update(comments)
        .set({ likes: sql`${comments.likes} + 1` })
        .where(eq(comments.id, input.id));
      return { ok: true };
    }),
});
