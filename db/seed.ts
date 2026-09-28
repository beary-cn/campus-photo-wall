import { getDb } from "../api/queries/connection";
import { albums, albumPhotos } from "./schema";
import { readdirSync, readFileSync, statSync } from "fs";
import { join } from "path";

const RESOURCE_DIR = join(process.cwd(), "public", "pages", "resource");

async function seed() {
  const db = getDb();
  console.log("🌱 开始导入现有图集数据...\n");

  // 读取 folders.json
  let folders: string[] = [];
  try {
    const foldersJson = readFileSync(join(RESOURCE_DIR, "folders.json"), "utf-8");
    folders = JSON.parse(foldersJson);
  } catch {
    console.log("⚠️ 未找到 folders.json，跳过导入");
    return;
  }

  for (const folder of folders) {
    const jsonPath = join(RESOURCE_DIR, folder, `${folder}.json`);
    try {
      const raw = readFileSync(jsonPath, "utf-8");
      const data = JSON.parse(raw);

      // 插入图集
      const [albumResult] = await db.insert(albums).values({
        folder,
        title: data.title || folder,
        category: data.category || "",
        categoriesJson: data.categories ? JSON.stringify(data.categories) : null,
        categoryColorsJson: data.categoryColors ? JSON.stringify(data.categoryColors) : null,
        intro: data.intro || "",
        bilibili: data.bilibili || null,
        content: data.content || null,
        coverImage: data.cards?.[0]?.image || null,
      });

      const albumId = Number(albumResult.insertId);

      // 插入照片
      if (data.cards && data.cards.length > 0) {
        await db.insert(albumPhotos).values(
          data.cards.map((card: any, i: number) => ({
            albumId,
            title: card.title || "",
            intro: card.intro || "",
            imagePath: card.image || "",
            sortOrder: i,
          }))
        );
      }

      console.log(`  ✅ ${folder}`);
    } catch (e) {
      console.log(`  ❌ ${folder}: ${(e as Error).message}`);
    }
  }

  console.log("\n🎉 导入完成！");
}

seed().catch(console.error);
