# 校园照片墙 - 协作指南

写给协作者：本文档说明如何在不修改任何代码的前提下，向照片墙添加、编辑或删除图集。

> **页面与资源路径约定**：HTML 页面位于 `pages/html/` 下，组件在 `components/`、数据在 `pages/resource/`、公共样式为 `pages/html/index.css`。页面中引用资源统一使用相对路径（如 `../../components/mc-navbar.js`、`../resource/...`）。**不要改动现有页面的脚本与样式引用方式**，否则组件会加载失败。

---

## 一、项目结构速览

```
项目根目录/
├── components/                     # Web Components（不要修改）
│   ├── mc-navbar.js                # 顶部导航栏（含搜索）
│   ├── skeleton-card.js            # 图集卡片（含分类配色表）
│   ├── bilibili-article-card.js    # 横向文章卡片
│   ├── cir-search.js               # 圆形搜索组件
│   └── particle-search.js          # 粒子动画搜索框
├── pages/
│   └── html/
│       ├── index.html              # 首页（轮播 + 五大分类模块 + 全部照片流）
│       ├── redstone-intro.html     # 活动介绍（校园活动图鉴 + 参与指南）
│       ├── mechanism.html          # 活动回顾（文艺 / 体育 / 学术 胶囊 Tab + 分页）
│       ├── redstone-machines.html  # 精彩瞬间（标签筛选 + 搜索 + 分页）
│       ├── building.html           # 校园风光（粒子搜索 + 卡片网格）
│       ├── schematics.html         # 集体相册（侧边栏分类 + 瀑布流 + 大图预览）
│       ├── article.html            # 图集详情页（目录 + 内容 + 评论）
│       ├── login.html              # 登录 / 注册页
│       └── index.css               # 公共样式
├── pages/
│   └── resource/                   # 数据（你主要操作的地方）
│       ├── folders.json            # 图集索引（必须维护）
│       ├── 毕业季合影/              # 一个图集 = 一个文件夹
│       │   ├── 毕业季合影.json      # 图集元数据（必须与文件夹同名）
│       │   ├── 1.jpg
│       │   └── 2.jpg
├── pages/
│   └── image/
│       └── logo.png                # 站点 Logo
├── README.md
├── 校园照片墙-协作指南.md            # 本文件
└── LICENSE
```

### 数据加载原理（各页面内置脚本）

```
1. 读取 pages/resource/folders.json       → 获取所有图集文件夹名数组
2. 对每个文件夹名：
   请求 pages/resource/<文件夹>/<文件夹>.json → 获取图集元数据
3. 取 cards[0] 作为封面卡片
4. 图片路径拼接规则：pages/resource/<文件夹>/<cards[i].image>
5. 详情页通过 article.html?id=<文件夹> 读取对应图集
```

### 页面跳转关系

| 来源 | 去向 | 说明 |
|------|------|------|
| 首页分类模块「查看更多」 | `redstone-intro.html` / `mechanism.html` / `redstone-machines.html` / `building.html` / `schematics.html` | 进入对应分类页 |
| 任意卡片 / 搜索结果 | `article.html?id=<文件夹>` | 进入图集详情页 |
| 导航栏搜索 | `article.html`（单结果）或 `search-results.html`（多结果） | 全局搜索 |
| 顶部头像 | `login.html` | 登录页 |

---

## 二、添加新图集（完整步骤）

### 第 1 步：在 `pages/resource/` 下新建文件夹

```
pages/resource/毕业季合影/
```

> **命名建议**：使用中文短名或英文短横线，避免空格和特殊字符。当前 `folders.json` 中已预置 16 个活动目录名（迎新晚会、秋季运动会、社团招新等），可直接使用。

### 第 2 步：放入照片文件

```
pages/resource/毕业季合影/1.jpg
pages/resource/毕业季合影/2.jpg
pages/resource/毕业季合影/3.png
```

> ⚠️ **注意**：图片文件名不要包含中文（避免编码问题），建议用数字或英文命名。

### 第 3 步：创建图集元数据 JSON 文件

**文件名必须与文件夹名完全一致**（包括大小写），后缀为 `.json`：

```
pages/resource/毕业季合影/毕业季合影.json
```

**完整模板**（复制后按需修改）：

```json
{
  "title": "毕业季合影",
  "category": "毕业季",
  "categories": ["毕业季"],
  "categoryColors": ["#16a085"],
  "intro": "2026届毕业生大合影，记录青春最后一面。",
  "bilibili": "",
  "cards": [
    {
      "title": "全景合影",
      "intro": "全体毕业生与老师合影",
      "image": "1.jpg"
    },
    {
      "title": "恩师献花",
      "intro": "学生代表向老师献花",
      "image": "2.jpg"
    }
  ],
  "content": "<h2>毕业快乐</h2><p>四年时光，感谢相遇。</p>"
}
```

**空白模板**：

```json
{
  "title": "",
  "category": "",
  "categories": [""],
  "categoryColors": [""],
  "intro": "",
  "cards": [
    {
      "title": "",
      "intro": "",
      "image": ""
    }
  ],
  "content": ""
}
```

### 第 4 步：注册到 `pages/resource/folders.json`

打开 `pages/resource/folders.json`，将新文件夹名加入数组：

```json
[
  "迎新晚会",
  "秋季运动会",
  "毕业季合影"
]
```

> ⚠️ **这是最容易忘记的一步！** 不加进 `folders.json`，网页不会加载该图集。

### 第 5 步：让它出现在对应分类页

分类页会**自动**读取 `folders.json` 并按 `category` / `categories` 归组，无需手动配置。只要第 3 步的 JSON 里填对了分类字段，图集就会出现在对应页面中：

| 分类字段取值 | 出现的页面 |
|--------------|-----------|
| `活动介绍` | 首页「活动介绍」模块 + 活动介绍页 |
| `活动回顾` | 首页「活动回顾」模块 + 活动回顾页（按关键词自动进入文艺/体育/学术 Tab） |
| `精彩瞬间` | 首页「精彩瞬间」模块 + 精彩瞬间页（按关键词自动进入晚会/比赛/招新/讲座/志愿标签） |
| `校园风光` | 首页「校园风光」模块 + 校园风光页 |
| `集体相册` | 首页「集体相册」模块 + 集体相册页（按关键词自动进入班级/社团/活动合影侧边栏） |

如果想让某个分类在**首页**的分类模块里露出，打开 `pages/html/index.html`，找到对应的 `<section class="category-section">`，按已有结构补一个 `cards-container` 占位节点即可（渲染逻辑会自动填充，每个模块最多显示 8 张）。

---

## 三、字段说明

### 顶层字段

| 字段 | 必填 | 说明 | 示例 |
|------|------|------|------|
| `title` | ✅ | 图集标题，显示在详情页和卡片上 | `"毕业季合影"` |
| `category` | ✅ | 主分类（见下方分类列表） | `"毕业季"` |
| `categories` | ✅ | 分类数组，可填多个 | `["毕业季", "校园风光"]` |
| `categoryColors` | ❌ | 对应分类的标签颜色，不填则自动分配 | `["#16a085"]` |
| `intro` | ✅ | 一句话简介，显示在卡片底部 | `"2026届毕业生大合影"` |
| `id` | ❌ | 自定义图集 ID，不填则使用文件夹名 | `"graduation-2026"` |
| `url` | ❌ | 若填写，卡片点击后直接跳转该外链而非详情页 | `"https://..."` |
| `bilibili` | ❌ | B 站视频链接，详情页会显示「相关视频」嵌入区 | `"https://www.bilibili.com/video/..."` |
| `content` | ❌ | 详情页正文介绍，支持 HTML 标签 | `"<h2>毕业快乐</h2>"` |

### `cards[]` 子字段

| 字段 | 必填 | 说明 |
|------|------|------|
| `title` | ✅ | 单张照片标题 |
| `intro` | ❌ | 单张照片说明文字 |
| `image` | ✅ | 照片文件名（相对于当前文件夹） |

---

## 四、分类列表

卡片配色表预置在 `components/skeleton-card.js` 和 `pages/html/article.html` 的 `CATEGORY_COLORS` 中：

| 分类名 | 默认颜色 |
|--------|----------|
| `活动介绍` | `#B22222` |
| `活动回顾` | `#2196F3` |
| `精彩瞬间` | `#FF9800` |
| `校园风光` | `#9C27B0` |
| `集体相册` | `#4CAF50` |
| `毕业季` | `#2E7D32` |
| `学术讲座` | `#E76F00` |

- `category` 和 `categories` 字段填写上述分类名即可
- 颜色会自动分配，也可以在 `categoryColors` 中自行指定十六进制色值
- 如果填了不在列表中的分类名，系统会**自动生成稳定颜色**

> 活动回顾页的文艺/体育/学术、精彩瞬间页的晚会/比赛/招新/讲座/志愿、集体相册页的班级/社团/活动合影，均为**关键词自动归组**（匹配标题和简介中的关键词），无需在 JSON 中额外填写。如需新增分类或调整关键词，需由维护者修改对应页面的脚本。

---

## 五、编辑现有图集

1. 找到 `pages/resource/<图集文件夹>/<图集名>.json`
2. 修改 JSON 内容（增删 `cards`、改文字等）
3. 如果添加了新照片文件，确保 `image` 字段指向正确文件名
4. 提交更改

---

## 六、删除图集

1. 删除 `pages/resource/` 下对应的整个文件夹
2. 打开 `pages/resource/folders.json`，从数组中移除该文件夹名
3. 提交更改

---

## 七、注意事项（重要）

| 事项 | 说明 |
|------|------|
| ⚠️ JSON 必须合法 | 逗号不能多也不能少，引号必须是双引号。推荐用 VS Code 编辑，自带 JSON 校验 |
| ⚠️ 文件名必须匹配 | JSON 文件名必须与文件夹名**完全一致**，否则 `fetch()` 会 404 |
| ⚠️ 图片路径 | `cards[].image` 只写文件名，系统自动拼接为 `pages/resource/<文件夹>/<文件名>` |
| ⚠️ 图片缺失 | 图片加载失败时会显示占位图，不影响页面运行 |
| ⚠️ 不要改动组件引用 | 页面通过 `../../components/*.js` 加载 Web Components，移动或重命名组件会导致白屏 |
| ✅ 图片压缩 | 建议上传前压缩图片，避免仓库体积过大 |
| ✅ 同步 folders.json | 每次增删图集后，**务必**同步更新 `folders.json` |

---

## 八、本地预览方法

由于项目使用 `fetch()` 加载本地 JSON，直接双击 HTML 文件会因浏览器安全限制（CORS）无法加载数据。需要启动本地服务器：

### VS Code 插件

安装 `Live Server` 插件 → 右键 `pages/html/index.html` → `Open with Live Server`

### 命令行

```bash
# 在项目根目录执行（Python 3）
python -m http.server 8000
# 然后浏览器访问 http://localhost:8000/pages/html/index.html
```

---

## 九、Git 协作流程

1. 从最新 `main` 分支拉取代码
2. 创建自己的分支：`git switch -c feature/add-<图集名>`
3. 按上述步骤添加 / 修改图集
4. 提交并推送：
   ```bash
   git add .
   git commit -m "feat: 添加毕业季合影图集"
   git push -u origin feature/add-毕业季合影
   ```
5. 在 GitHub 上发起 Pull Request，等待 Review 后合并

### 提交信息规范

| 类型 | 说明 | 示例 |
|------|------|------|
| `feat` | 新增图集 | `feat: 添加毕业季合影图集` |
| `update` | 更新已有图集 | `update: 补充运动会图集照片` |
| `fix` | 修复数据问题 | `fix: 修正文件夹名大小写` |
| `docs` | 仅文档变更 | `docs: 更新协作指南` |

如有疑问，请在仓库提 Issue 或联系项目维护者。
