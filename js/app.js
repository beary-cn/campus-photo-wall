/* ============================================================
   校园照片墙 - 公共脚本
   ------------------------------------------------------------
   数据约定（与原项目一致）：
     data/folders.json                -> 所有图集文件夹名列表
     data/<文件夹>/<文件夹>.json     -> 该图集的描述信息
     data/<文件夹>/<图片文件名>      -> 图片资源

   页面位于 pages/html/ 下，资源位于 ../data/ 下。
   ============================================================ */

const DATA_PATH = '../data';

// 占位图（图片缺失或加载失败时显示）
const PLACEHOLDER_IMG = 'data:image/svg+xml;utf8,' + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600">' +
    '<rect fill="#e8eaed" width="800" height="600"/>' +
    '<g fill="#9aa0a6" font-family="sans-serif">' +
    '<rect x="330" y="230" width="140" height="100" rx="8" fill="none" stroke="#9aa0a6" stroke-width="6"/>' +
    '<circle cx="365" cy="262" r="10" fill="#9aa0a6"/>' +
    '<path d="M340 320 l40 -45 l30 30 l25 -25 l35 40 z" fill="#9aa0a6"/>' +
    '<text x="400" y="380" text-anchor="middle" font-size="22">暂无图片</text>' +
    '</g></svg>'
);
window.__PH__ = PLACEHOLDER_IMG;

// 分类配置（图集 JSON 的 category / categories 字段使用这些 key）
const CATEGORIES = [
    { key: '校园风光', icon: '🏞️', color: '#4a90d9' },
    { key: '课堂瞬间', icon: '📖', color: '#e67e22' },
    { key: '社团活动', icon: '🎸', color: '#9b59b6' },
    { key: '体育竞技', icon: '🏀', color: '#e74c3c' },
    { key: '毕业季',   icon: '🎓', color: '#16a085' },
    { key: '其他',     icon: '📷', color: '#7f8c8d' }
];

function getCategoryColor(cat) {
    const found = CATEGORIES.find(c => c.key === cat);
    if (found) return found.color;
    // 未知分类：按名字生成稳定颜色
    let hash = 0;
    for (let i = 0; i < (cat || '').length; i++) {
        hash = cat.charCodeAt(i) + ((hash << 5) - hash);
    }
    return `hsl(${Math.abs(hash % 360)}, 60%, 45%)`;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text == null ? '' : String(text);
    return div.innerHTML;
}

/* ========== 加载全部图集数据 ==========
   返回数组，每项: { folder, data, card, cards, categories,
                    categoryColors, date, title, intro, cover } */
async function fetchAllPhotos() {
    const r = await fetch(`${DATA_PATH}/folders.json`);
    if (!r.ok) throw new Error('folders.json 加载失败（请确认通过本地服务器访问）');
    const folders = await r.json();

    const photos = [];
    await Promise.all(folders.map(async (folder) => {
        try {
            const res = await fetch(`${DATA_PATH}/${folder}/${folder}.json`);
            if (!res.ok) return;
            const data = await res.json();
            const cats = data.categories || [data.category || '其他'];
            const colors = data.categoryColors || cats.map(getCategoryColor);
            const cards = data.cards || [];
            if (cards.length === 0) return;

            photos.push({
                folder: folder,
                data: data,
                card: cards[0],
                cards: cards,
                categories: cats,
                categoryColors: colors,
                title: data.title || cards[0].title || folder,
                intro: data.intro || cards[0].intro || '',
                cover: cards[0].image || '',
                date: data.date || cards[0].date || ''
            });
        } catch (e) {
            console.warn(`加载 ${folder} 失败:`, e);
        }
    }));

    // 按日期倒序（新的在前），无日期的排最后
    photos.sort((a, b) => String(b.date).localeCompare(String(a.date)));
    return photos;
}

/* ========== 创建照片卡片（返回 DOM 元素） ==========
   原项目的 createPhotoCard 逻辑保持不变，
   详情跳转统一指向 article.html?id=<folder> */
function createPhotoCard(photo, options) {
    const opts = options || {};
    const cat = photo.categories[0] || '其他';
    const color = photo.categoryColors[0] || getCategoryColor(cat);

    const card = document.createElement('a');
    card.className = 'photo-card';
    card.href = `article.html?id=${encodeURIComponent(photo.folder)}`;

    const imgSrc = photo.cover
        ? `${DATA_PATH}/${photo.folder}/${photo.cover}`
        : PLACEHOLDER_IMG;

    card.innerHTML = `
        <div class="photo-card-imgwrap">
            <img loading="lazy" src="${imgSrc}" alt="${escapeHtml(photo.title)}"
                 onerror="this.onerror=null;this.src=window.__PH__">
            ${opts.showCat === false ? '' : `<span class="photo-card-tag" style="background:${color};">${escapeHtml(cat)}</span>`}
        </div>
        <div class="photo-card-body">
            <div class="photo-card-title">${escapeHtml(photo.title)}</div>
            <div class="photo-card-meta">
                ${photo.date ? `<span>📅 ${escapeHtml(photo.date)}</span>` : ''}
                ${photo.cards.length > 1 ? `<span>🖼️ ${photo.cards.length} 张</span>` : ''}
            </div>
            ${opts.showIntro === false ? '' : `<div class="photo-card-intro">${escapeHtml(photo.intro)}</div>`}
        </div>
    `;
    return card;
}

/* ========== 用 skeleton-card 组件渲染卡片 ==========
   供首页 / 分类页 / 详情页等复用，保证组件封装不被破坏 */
function createSkeletonCard(photo) {
    const sk = document.createElement('skeleton-card');
    sk.setAttribute('image', `${DATA_PATH}/${photo.folder}/${photo.cover}`);
    sk.setAttribute('title', photo.title);
    sk.setAttribute('intro', photo.intro);
    sk.setAttribute('article-id', photo.folder);
    sk.setAttribute('base-path', '..');
    sk.setAttribute('categories', JSON.stringify(photo.categories));
    if (photo.categoryColors && photo.categoryColors.length > 0) {
        sk.setAttribute('category-colors', JSON.stringify(photo.categoryColors));
    }
    return sk;
}
