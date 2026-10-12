# 校园活动照片墙

> 电子科技大学成都学院校园活动照片展示平台。前端保留原生 HTML + Web Components 体验，后端使用 Node.js + MySQL 提供数据持久化、用户认证和活动发布。

---

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | 原生 HTML + Web Components (`mc-navbar`、`skeleton-card`) |
| 后端 | Node.js + Hono + tRPC + Drizzle ORM |
| 数据库 | MySQL 8.0 |
| 认证 | OAuth 2.0 (Kimi) + 账号密码登录（JWT） |
| 构建 | Vite |

---

## 项目结构

```
.
├── api/                        # 后端 API
│   ├── boot.ts                 # 服务器入口（REST API + tRPC）
│   ├── album-router.ts         # 图集 tRPC 路由
│   ├── auth-router.ts          # OAuth 登录
│   ├── upload-router.ts        # 图片上传
│   ├── types/                  # 类型声明
│   │   └── bcryptjs.d.ts
│   └── ...
├── db/
│   ├── schema.ts               # 数据库表定义
│   └── seed.ts                 # 数据迁移脚本
├── public/                     # 前端静态页面
│   ├── components/
│   │   ├── mc-navbar.js        # 导航栏组件（含用户下拉菜单）
│   │   └── skeleton-card.js    # 骨架屏组件
│   └── pages/
│       ├── html/               # HTML 页面
│       │   ├── index.html      # 照片墙首页
│       │   ├── article.html    # 活动详情页
│       │   ├── schematics.html # 集体相册
│       │   ├── login.html      # 登录/注册页
│       │   ├── profile.html    # 个人主页（修改昵称/头像/密码）
│       │   └── my-posts.html   # 我的发布（管理已发布活动）
│       └── resource/           # 旧 JSON 数据（可导入数据库）
├── src/                        # React 前端（框架自带，可扩展管理后台）
├── contracts/                  # 前后端共享类型
├── .env.example                # 环境变量模板
├── package.json
└── README.md                   # 本文件
```

---

## 快速开始

### 1. 环境要求

- Node.js 18+
- MySQL 8.0+

### 2. 安装依赖

```bash
npm install
```

### 3. 配置数据库

复制 `.env.example` 为 `.env`，填写你的数据库地址：

```bash
# 本地 MySQL 示例
DATABASE_URL=mysql://用户名:密码@localhost:3306/campus_photo_wall
```

创建数据库：

```sql
CREATE DATABASE campus_photo_wall DEFAULT CHARACTER SET utf8mb4;
```

### 4. 推送数据库表

```bash
npm run db:push
```

这会创建 `users`、`albums`、`albumPhotos` 三张表。

### 5. 导入旧数据（可选）

如果 `public/pages/resource/` 下有旧的 JSON 图集数据：

```bash
npx tsx db/seed.ts
```

### 6. 启动开发服务器

```bash
npm run dev
```

访问 `http://localhost:3000/pages/html/index.html`

---

## 用户系统

### 登录方式

支持两种方式登录：

1. **账号密码登录** — 在 `login.html` 页面注册/登录
2. **Kimi OAuth** — 点击头像选择登录，扫码/账号授权

### 用户角色

首次注册的用户 `role` 为 `user`，手动改为 `admin` 即可获得管理权限：

```sql
UPDATE users SET role = 'admin' WHERE id = 1;
```

### 个人主页

登录后点击头像 → **个人主页**，可修改：
- 昵称
- 头像（预设或上传自定义）
- 密码

### 我的发布

登录后点击头像 → **我的发布**，可：
- 查看自己发布的所有活动
- 新建活动（填写标题、分类、简介、封面）
- 删除自己发布的活动

---

## 添加图集

### 方式一：通过"我的发布"页面（推荐）

1. 登录后点击头像 → **我的发布**
2. 点击"新建活动"
3. 填写标题、选择分类、上传封面
4. 发布后自动跳转到活动详情页补充内容

### 方式二：直接操作数据库（批量）

```sql
-- 插入图集
INSERT INTO albums (folder, title, category, intro, coverImage, userId)
VALUES ('运动会', '秋季运动会', '笃行', '精彩瞬间', '/uploads/运动会/1.jpg', 1);

-- 插入照片
INSERT INTO albumPhotos (albumId, title, intro, imagePath, sortOrder)
VALUES (1, '百米冲刺', '男子100米决赛', '/uploads/运动会/1.jpg', 0);
```

### 方式三：导入 JSON 数据

把图集文件夹放入 `public/pages/resource/`，更新 `folders.json`，然后执行：

```bash
npx tsx db/seed.ts
```

---

## 主要 API

### 认证

```
POST /api/auth/register           # 注册（username, password, name?）
POST /api/auth/login              # 登录（username, password）
GET  /api/auth/me                 # 获取当前用户（需 Bearer Token）
PATCH /api/auth/me                # 更新用户信息（name, avatar）
POST /api/auth/change-password    # 修改密码（oldPassword, newPassword）
```

### 图集

```
GET  /api/albums                  # 图集列表
     ?category=明德              # 按分类筛选
     ?search=迎新                # 搜索
     ?userId=1                   # 按用户筛选
     ?limit=20&offset=0          # 分页

GET  /api/albums/:id              # 图集详情（by ID）
GET  /api/albums/folder/:folder   # 图集详情（by 文件夹名）
POST /api/albums                  # 创建图集（需登录，自动关联用户）
PATCH /api/albums/:id             # 更新图集（仅创建者/管理员）
DELETE /api/albums/:id            # 删除图集（仅创建者/管理员）
```

### 上传

```
POST /api/upload                  # 上传图片（body: base64）
```

### tRPC

```
GET /api/trpc/*                   # tRPC 端点（供管理后台扩展）
```

---

## 分类配色

| 分类 | 颜色 |
|------|------|
| 明德 | `#B22222` |
| 博学 | `#2196F3` |
| 笃行 | `#4CAF50` |
| 尽美 | `#FF9800` |

---

## 生产部署

```bash
npm run build    # 构建
npm start        # 生产模式启动
```

使用 PM2 守护：

```bash
npm install -g pm2
pm2 start dist/boot.js --name "photo-wall"
pm2 save
pm2 startup
```
