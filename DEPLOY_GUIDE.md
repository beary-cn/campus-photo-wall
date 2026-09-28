# 校园照片墙 - 后端部署教程

> 本文档详细说明如何将照片墙从纯前端 JSON 模式迁移到 **Node.js + MySQL 全栈模式**，并实现图集数据持久化、评论系统、用户登录等功能。

---

## 一、技术栈

| 层级 | 技术 | 说明 |
|------|------|------|
| 前端 | 原生 HTML + Web Components | 保留你现有的页面结构 |
| 后端 | Node.js + Hono + tRPC | 高性能 HTTP 框架 + 类型安全 API |
| 数据库 | MySQL + Drizzle ORM | 自动迁移、类型安全查询 |
| 认证 | OAuth 2.0 (Kimi) | 扫码登录，JWT 会话 |
| 部署 | 单文件启动 | `npm start` 同时托管前端 + API |

---

## 二、环境准备

### 1. 安装 Node.js

需要 Node.js 18+，推荐 20 LTS。

```bash
# 检查版本
node -v   # 应 >= v18.0.0
npm -v    # 应 >= 9.0.0
```

如果没有安装，去 https://nodejs.org 下载安装包，或使用 nvm：

```bash
nvm install 20
nvm use 20
```

### 2. MySQL 数据库

本项目使用 MySQL 8.0+。你有两种选择：

**选项 A：本地安装 MySQL**

```bash
# macOS
brew install mysql
brew services start mysql

# Ubuntu/Debian
sudo apt-get install mysql-server
sudo systemctl start mysql

# 创建数据库
mysql -u root -p
CREATE DATABASE campus_photo_wall DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'campus'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON campus_photo_wall.* TO 'campus'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

**选项 B：使用云数据库（推荐）**

阿里云、腾讯云等都提供免费的 MySQL 实例，创建后拿到连接地址即可。

---

## 三、项目配置

### 1. 解压项目

将本项目解压到你的工作目录：

```bash
cd /path/to/your/workspace
# 解压 campus-photo-wall-fullstack.zip
```

### 2. 配置数据库连接

打开项目根目录的 `.env` 文件，修改 `DATABASE_URL`：

```bash
# 本地 MySQL
DATABASE_URL=mysql://用户名:密码@localhost:3306/数据库名

# 示例
DATABASE_URL=mysql://campus:your_password@localhost:3306/campus_photo_wall

# 云数据库（阿里云 RDS 示例）
DATABASE_URL=mysql://campus:your_password@xxx.mysql.rds.aliyuncs.com:3306/campus_photo_wall
```

> ⚠️ **注意**：`.env` 文件里已经有预置的 `APP_ID`、`APP_SECRET`、`VITE_KIMI_AUTH_URL` 等 OAuth 配置，**不要修改**，这些由平台提供，直接可用。

### 3. 安装依赖

```bash
cd campus-photo-wall-fullstack
npm install
```

这个过程需要 2-5 分钟，取决于网络速度。

---

## 四、数据库初始化

### 1. 推送数据库表结构

```bash
npm run db:push
```

这会根据 `db/schema.ts` 自动在 MySQL 中创建以下表：

| 表名 | 说明 |
|------|------|
| `users` | 用户表（OAuth 登录后自动创建） |
| `albums` | 图集表 |
| `albumPhotos` | 图集内的照片 |
| `comments` | 评论表 |

### 2. 导入现有图集数据

如果你之前有 JSON 格式的图集数据，使用 seed 脚本导入：

```bash
# 把旧数据放到 public/pages/resource/ 下（保持原来的文件夹结构）
# 然后执行：
npx tsx db/seed.ts
```

**seed 脚本会做的事情**：
1. 读取 `public/pages/resource/folders.json`
2. 逐个读取每个图集文件夹下的 `<文件夹>.json`
3. 插入到 `albums` 表
4. 把 `cards` 里的每张照片插入到 `albumPhotos` 表

> 如果没有旧数据，可以跳过这一步，以后通过管理后台或 API 添加图集。

---

## 五、启动开发服务器

```bash
npm run dev
```

打开浏览器访问：
- 照片墙首页：`http://localhost:3000/pages/html/index.html`
- API 测试：`http://localhost:3000/api/albums`

开发服务器支持热更新，修改代码后自动刷新。

---

## 六、API 说明

### 图集相关

```
GET  /api/albums                    # 图集列表
     ?category=明德                 # 按分类筛选
     ?search=迎新                   # 搜索关键词
     ?limit=20&offset=0             # 分页

GET  /api/albums/:id                # 图集详情（by ID）
GET  /api/albums/folder/:folder     # 图集详情（by 文件夹名）

# 以下需要管理员权限（通过 tRPC 调用）
POST /api/trpc/album.create         # 创建图集
POST /api/trpc/album.update         # 更新图集
POST /api/trpc/album.delete         # 删除图集
```

### 评论相关

```
GET  /api/albums/:id/comments       # 评论列表
POST /api/albums/:id/comments       # 发表评论（body: { text, userName }）
POST /api/comments/:id/like         # 点赞
```

### 图片上传

```
POST /api/upload                    # 上传图片
body: {
  "albumFolder": "迎新晚会",
  "filename": "1.jpg",
  "base64": "data:image/jpeg;base64,/9j/4AAQ..."
}
```

上传后的图片可通过 `/uploads/<文件夹>/<文件名>` 访问。

---

## 七、生产部署

### 1. 构建

```bash
npm run build
```

这会生成：
- `dist/public/` — 前端静态文件
- `dist/boot.js` — 后端服务入口

### 2. 启动生产服务器

```bash
npm start
```

默认监听 `0.0.0.0:3000`，同时提供：
- 静态文件服务（前端页面）
- REST API（`/api/*`）
- 图片静态服务（`/uploads/*`）

### 3. 使用 PM2 守护进程（推荐）

```bash
npm install -g pm2
pm2 start dist/boot.js --name "photo-wall"
pm2 save
pm2 startup
```

### 4. Nginx 反向代理（可选）

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## 八、添加新图集（三种方式）

### 方式 1：直接操作数据库（适合批量）

```bash
# 进入数据库
mysql -u campus -p campus_photo_wall

# 插入图集
INSERT INTO albums (folder, title, category, intro, coverImage)
VALUES ('运动会', '秋季运动会', '笃行', '2026年秋季运动会精彩瞬间', '/uploads/运动会/1.jpg');

# 插入照片
INSERT INTO albumPhotos (albumId, title, intro, imagePath, sortOrder)
VALUES (1, '百米冲刺', '男子100米决赛', '/uploads/运动会/1.jpg', 0);
```

### 方式 2：调用 tRPC API（适合开发）

```bash
curl -X POST http://localhost:3000/api/trpc/album.create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <你的JWT_TOKEN>" \
  -d '{
    "folder": "运动会",
    "title": "秋季运动会",
    "category": "笃行",
    "intro": "精彩瞬间",
    "photos": [
      { "title": "百米冲刺", "imagePath": "/uploads/运动会/1.jpg" }
    ]
  }'
```

### 方式 3：未来可扩展 Web 管理后台

可以在 `src/App.tsx` 中开发 React 管理页面，调用 tRPC API 实现图形化增删改查。

---

## 九、用户登录

### OAuth 2.0（推荐）

1. 点击导航栏右上角头像 → 「登录」
2. 跳转到 Kimi 授权页，扫码或账号登录
3. 自动跳转回照片墙，已获取头像和昵称
4. 用户信息存入 `users` 表

### 设置管理员

```bash
mysql -u campus -p campus_photo_wall
UPDATE users SET role = 'admin' WHERE id = 1;
```

管理员可调用 `album.create/update/delete` 等管理接口。

---

## 十、项目结构

```
campus-photo-wall/
├── api/
│   ├── boot.ts              # 服务器入口（REST API + tRPC + 静态文件）
│   ├── album-router.ts      # 图集 CRUD（tRPC）
│   ├── comment-router.ts    # 评论系统（tRPC）
│   ├── upload-router.ts     # 图片上传（tRPC）
│   ├── auth-router.ts       # OAuth 认证（tRPC）
│   ├── middleware.ts        # 权限中间件（public/authed/admin）
│   └── queries/
│       └── connection.ts    # 数据库连接
├── db/
│   ├── schema.ts            # 数据库表定义
│   └── seed.ts              # 数据导入脚本
├── public/                   # 前端静态文件（原生前端页面）
│   ├── components/
│   │   ├── mc-navbar.js
│   │   └── skeleton-card.js
│   └── pages/
│       ├── html/            # HTML 页面
│       ├── image/           # Logo 等
│       └── resource/        # 旧数据目录（可删除）
├── src/                      # React 前端（Vite 默认，可扩展管理后台）
│   ├── App.tsx
│   └── main.tsx
├── contracts/                # 前后端共享类型
├── dist/                     # 构建输出
│   ├── public/              # 前端构建产物
│   └── boot.js              # 后端构建产物
├── .env                      # 环境变量（数据库连接、OAuth 配置）
├── package.json
├── vite.config.ts
└── DEPLOY_GUIDE.md          # 本文件
```

---

## 十一、常见问题

**Q: `npm install` 很慢或失败？**
A: 设置淘宝镜像：`npm config set registry https://registry.npmmirror.com`

**Q: `npm run db:push` 报错连接失败？**
A: 检查 `.env` 中的 `DATABASE_URL` 是否正确，MySQL 是否运行，防火墙是否放行端口。

**Q: 前端页面能打开但数据加载不出来？**
A: 检查后端是否启动（`npm run dev`），浏览器开发者工具 Network 面板看 `/api/albums` 请求是否 200。

**Q: 如何备份数据库？**
A: `mysqldump -u campus -p campus_photo_wall > backup.sql`

**Q: 上传的图片存在哪里？**
A: 项目根目录的 `uploads/` 文件夹。生产环境建议配置云存储（OSS/S3）。

---

## 十二、后续扩展建议

| 功能 | 实现方式 |
|------|----------|
| Web 管理后台 | 在 `src/` 下开发 React 页面，调用 tRPC API |
| 图集批量导入 | 扩展 seed.ts，支持从 Excel/CSV 导入 |
| 图片云存储 | 接入阿里云 OSS，替换本地 uploads/ |
| 点赞/收藏 | 新增 `likes` 表，关联 userId + albumId |
| 通知系统 | 评论回复时发送邮件或站内信 |

---

如有问题，在 GitHub 仓库提 Issue 或联系项目维护者。
