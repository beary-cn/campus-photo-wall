import {
  mysqlTable,
  mysqlEnum,
  serial,
  varchar,
  text,
  timestamp,
  bigint,
  int,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: serial("id").primaryKey(),
  unionId: varchar("unionId", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 320 }),
  avatar: text("avatar"),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
  lastSignInAt: timestamp("lastSignInAt").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ==================== 图集 ====================
export const albums = mysqlTable("albums", {
  id: serial("id").primaryKey(),
  folder: varchar("folder", { length: 255 }).notNull().unique(),
  title: varchar("title", { length: 255 }).notNull(),
  category: varchar("category", { length: 64 }).notNull().default(""),
  categoriesJson: text("categoriesJson"),
  categoryColorsJson: text("categoryColorsJson"),
  intro: text("intro"),
  bilibili: varchar("bilibili", { length: 512 }),
  content: text("content"),
  coverImage: varchar("coverImage", { length: 512 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type Album = typeof albums.$inferSelect;
export type InsertAlbum = typeof albums.$inferInsert;

// ==================== 照片（图集内的卡片）====================
export const albumPhotos = mysqlTable("albumPhotos", {
  id: serial("id").primaryKey(),
  albumId: bigint("albumId", { mode: "number", unsigned: true })
    .notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  intro: text("intro"),
  imagePath: varchar("imagePath", { length: 512 }).notNull(),
  sortOrder: int("sortOrder").notNull().default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AlbumPhoto = typeof albumPhotos.$inferSelect;
export type InsertAlbumPhoto = typeof albumPhotos.$inferInsert;

// ==================== 评论 ====================
export const comments = mysqlTable("comments", {
  id: serial("id").primaryKey(),
  albumId: bigint("albumId", { mode: "number", unsigned: true })
    .notNull(),
  userId: bigint("userId", { mode: "number", unsigned: true }),
  userName: varchar("userName", { length: 255 }).notNull(),
  userAvatar: text("userAvatar"),
  text: text("text").notNull(),
  likes: int("likes").notNull().default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Comment = typeof comments.$inferSelect;
export type InsertComment = typeof comments.$inferInsert;
