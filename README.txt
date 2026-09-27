========================================
校园图片墙  使用说明
========================================

【如何打开】
浏览器直接双击 index.html 无法加载数据（浏览器安全限制），
需要在文件夹里起一个本地服务器：

  方法1（推荐）：安装 Python 后，在本文件夹中运行
      python -m http.server 8000
  然后浏览器打开  http://localhost:8000

  方法2：用 VS Code 安装 "Live Server" 插件，
  右键 index.html -> Open with Live Server。

【目录结构】
  index.html   首页（轮播 + 分类模块 + 全部图集）
  wall.html    照片墙（左侧分类栏 + 瀑布流 + 搜索 + 排序 + 大图预览）
  detail.html  图集详情页（相册 + 文字介绍 + 相关图集）
  css/ js/     样式与公共脚本，一般不用改
  data/        所有照片数据（重点操作这里）

【如何添加一个新图集】（3 步）
  1. 在 data/ 下新建一个文件夹，例如：
       data/毕业季合影/
  2. 把照片放进这个文件夹，例如：
       data/毕业季合影/1.jpg
       data/毕业季合影/2.jpg
  3. 在文件夹里建一个与文件夹同名的 .json 文件，
     例如 data/毕业季合影/毕业季合影.json，内容如下：

     {
       "title": "毕业季合影",
       "category": "毕业季",
       "categories": ["毕业季"],
       "categoryColors": ["#16a085"],
       "date": "2026-06-15",
       "photographer": "摄影师名字",
       "location": "拍摄地点",
       "intro": "一句话简介",
       "cards": [
         { "title": "照片标题1", "intro": "说明", "image": "1.jpg", "date": "2026-06-15" },
         { "title": "照片标题2", "intro": "说明", "image": "2.jpg", "date": "2026-06-15" }
       ],
       "content": "<h2>可选的详细文字介绍</h2><p>支持 HTML。</p>"
     }

  4. 打开 data/folders.json，把文件夹名加进去：
       ["示例-图书馆黄昏", "示例-运动会", "毕业季合影"]

  刷新页面即可看到新图集。

【分类说明】
预置分类：校园风光 / 课堂瞬间 / 社团活动 / 体育竞技 / 毕业季 / 其他
category 和 categories 字段写分类名即可，颜色会自动分配，
也可以在 categoryColors 里自己指定。

【提示】
- 图片不存在时会显示"暂无图片"占位图，不影响网页使用。
- 删除示例：删掉 data/ 下的"示例-..."文件夹，并同步修改 folders.json。
