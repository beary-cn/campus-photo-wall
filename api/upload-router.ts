import { z } from "zod";
import { createRouter, authedQuery } from "./middleware";
import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";

const UPLOAD_DIR = join(process.cwd(), "uploads");

function ensureUploadDir() {
  try {
    mkdirSync(UPLOAD_DIR, { recursive: true });
  } catch { /* already exists */ }
}

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export const uploadRouter = createRouter({
  // ========== 单文件上传 ==========
  url: authedQuery
    .input(
      z.object({
        albumFolder: z.string().min(1),
        filename: z.string().min(1),
        base64: z.string().min(1),
      })
    )
    .mutation(async ({ input }) => {
      ensureUploadDir();

      const albumDir = join(UPLOAD_DIR, sanitizeFilename(input.albumFolder));
      mkdirSync(albumDir, { recursive: true });

      // base64 可能带 data:image/xxx;base64, 前缀
      const base64Data = input.base64.replace(/^data:[^;]+;base64,/, "");
      const buffer = Buffer.from(base64Data, "base64");

      const safeName = sanitizeFilename(input.filename);
      const filePath = join(albumDir, safeName);
      writeFileSync(filePath, buffer);

      // 返回公开访问 URL（生产环境需改为 CDN/OSS）
      const publicUrl = `/uploads/${sanitizeFilename(input.albumFolder)}/${safeName}`;
      return { url: publicUrl, size: buffer.length };
    }),

  // ========== 批量上传（返回 URL 列表） ==========
  batch: authedQuery
    .input(
      z.object({
        albumFolder: z.string().min(1),
        files: z.array(
          z.object({
            filename: z.string(),
            base64: z.string(),
          })
        ),
      })
    )
    .mutation(async ({ input }) => {
      ensureUploadDir();
      const albumDir = join(UPLOAD_DIR, sanitizeFilename(input.albumFolder));
      mkdirSync(albumDir, { recursive: true });

      const results = input.files.map((file) => {
        const base64Data = file.base64.replace(/^data:[^;]+;base64,/, "");
        const buffer = Buffer.from(base64Data, "base64");
        const safeName = sanitizeFilename(file.filename);
        const filePath = join(albumDir, safeName);
        writeFileSync(filePath, buffer);
        return {
          url: `/uploads/${sanitizeFilename(input.albumFolder)}/${safeName}`,
          size: buffer.length,
        };
      });

      return { files: results };
    }),
});
