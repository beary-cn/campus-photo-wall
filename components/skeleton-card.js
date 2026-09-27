// ==================== 1. 颜色生成器 ====================
const CATEGORY_COLORS = {
  '红石介绍': '#B22222',
  '机制介绍': '#2196F3',
  '红石机械介绍': '#FF9800',
  '建筑': '#9C27B0',
  '原理图': '#4CAF50',
  '树场': '#2E7D32',
  'Java': '#E76F00',
  '默认': '#607D8B'
};

function getCategoryColor(category) {
  if (!category) return CATEGORY_COLORS['默认'];
  for (const [key, color] of Object.entries(CATEGORY_COLORS)) {
    if (category.includes(key)) return color;
  }
  let hash = 0;
  for (let i = 0; i < category.length; i++) {
    hash = category.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash % 360);
  return `hsl(${hue}, 70%, 45%)`;
}

// ==================== 2. SkeletonCard Web Component ====================

class SkeletonCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  static get observedAttributes() {
    return ['image', 'title', 'intro', 'category', 'category-color', 'categories', 'category-colors', 'article-id', 'article-url', 'base-path'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue !== newValue) this.render();
  }

  connectedCallback() {
    this.render();
    this.addEventListener('click', this.handleClick.bind(this));
  }

  disconnectedCallback() {
    this.removeEventListener('click', this.handleClick.bind(this));
  }

  handleClick() {
    const articleId = this.getAttribute('article-id');
    const articleUrl = this.getAttribute('article-url');
    const basePath = this.getAttribute('base-path') || '.';

    console.log('[SkeletonCard] 点击:', { articleId, articleUrl, basePath });

    if (articleUrl) {
      window.location.href = articleUrl;
      return;
    }

    if (!articleId || articleId === 'null' || articleId === 'undefined') {
      console.error('[SkeletonCard] 错误: article-id 无效:', articleId);
      alert('卡片未设置文章ID，无法跳转');
      return;
    }

    const targetUrl = `${basePath}/article.html?id=${encodeURIComponent(articleId)}`;
    console.log('[SkeletonCard] 跳转到:', targetUrl);
    window.location.href = targetUrl;
  }

  parseCategories() {
    const categoriesAttr = this.getAttribute('categories');
    if (categoriesAttr) {
      try { return JSON.parse(categoriesAttr); } 
      catch (e) { return [categoriesAttr]; }
    }
    const singleCategory = this.getAttribute('category');
    if (singleCategory) return [singleCategory];
    return [];
  }

  parseColors(categories) {
    const colorsAttr = this.getAttribute('category-colors');
    if (colorsAttr) {
      try { return JSON.parse(colorsAttr); } 
      catch (e) { return [colorsAttr]; }
    }
    return categories.map(cat => getCategoryColor(cat));
  }

  render() {
    const image = this.getAttribute('image') || '';
    const title = this.getAttribute('title') || '';
    const intro = this.getAttribute('intro') || '';
    const categories = this.parseCategories();
    const categoryColors = this.parseColors(categories);
    const hasData = image || title || intro;

    const tagsHtml = categories.map((cat, index) => {
      const color = categoryColors[index] || getCategoryColor(cat);
      return `<span class="category-tag" style="background-color: ${color};">${cat}</span>`;
    }).join('');

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: flex;
          flex-direction: column;
          flex-basis: 300px;
          flex-shrink: 0;
          flex-grow: 1;
          max-width: 100%;
          background-color: #FFF;
          box-shadow: 0 5px 10px 0 rgba(0, 0, 0, 0.15);
          border-radius: 10px;
          overflow: hidden;
          margin: 0;
          font-family: "Inter", -apple-system, BlinkMacSystemFont, sans-serif;
          transition: transform 0.3s ease, box-shadow 0.3s ease;
          cursor: pointer;
          position: relative;
        }
        :host(:hover) {
          transform: translateY(-4px);
          box-shadow: 0 12px 24px 0 rgba(0, 0, 0, 0.2);
        }
        .category-tags {
          position: absolute;
          top: 12px;
          left: 12px;
          z-index: 10;
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          max-width: calc(100% - 24px);
        }
        .category-tag {
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 0.7rem;
          font-weight: 600;
          color: #fff;
          box-shadow: 0 2px 8px rgba(0,0,0,0.2);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          opacity: 0;
          transform: translateY(-10px);
          transition: all 0.3s ease;
          white-space: nowrap;
          flex-shrink: 0;
        }
        .category-tag.show {
          opacity: 1;
          transform: translateY(0);
        }
        .category-tag:nth-child(1) { transition-delay: 0ms; }
        .category-tag:nth-child(2) { transition-delay: 80ms; }
        .category-tag:nth-child(3) { transition-delay: 160ms; }
        .category-tag:nth-child(4) { transition-delay: 240ms; }
        .card-img {
          padding-bottom: 56.25%;
          position: relative;
          background-color: #e2e5e7;
          overflow: hidden;
        }
        .card-img::after {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          background: linear-gradient(180deg, transparent 60%, rgba(0,0,0,0.1) 100%);
          pointer-events: none;
        }
        .card-img img {
          position: absolute;
          top: 0; left: 0;
          width: 100%; height: 100%;
          object-fit: cover;
          opacity: 0;
          transition: opacity 0.4s ease, transform 0.5s ease;
        }
        .card-img img.loaded {
          opacity: 1;
        }
        :host(:hover) .card-img img.loaded {
          transform: scale(1.05);
        }
        .card-body {
          padding: 1.25rem;
          flex: 1;
          display: flex;
          flex-direction: column;
          min-height: 0;
        }
        .card-title {
          font-size: 1.15rem;
          line-height: 1.33;
          font-weight: 700;
          margin: 0;
          color: #1a1a1a;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          word-break: break-word;
        }
        .card-title.skeleton {
          min-height: 28px;
          border-radius: 4px;
          background-color: #e2e5e7;
          background-image: linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,0.5), rgba(255,255,255,0));
          background-size: 40px 100%;
          background-repeat: no-repeat;
          background-position: left -40px top 0;
          animation: shine 1.5s ease infinite;
        }
        .card-intro {
          margin-top: 0.5rem;
          line-height: 1.5;
          color: #666;
          font-size: 0.9rem;
          margin-bottom: 0;
          display: -webkit-box;
          -webkit-line-clamp: 4;
          -webkit-box-orient: vertical;
          overflow: hidden;
          word-break: break-word;
          flex-shrink: 0;
        }
        .card-intro.skeleton {
          min-height: 80px;
          border-radius: 4px;
          background-color: #e2e5e7;
          background-image: linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,0.5), rgba(255,255,255,0));
          background-size: 40px 100%;
          background-repeat: no-repeat;
          background-position: left -40px top 0;
          animation: shine 1.5s ease infinite;
        }
        @keyframes shine {
          to { background-position: right -40px top 0; }
        }
      </style>
      <div class="category-tags">
        ${hasData ? tagsHtml.split('>').join(' class="show">') : ''}
      </div>
      <div class="card-img">
        ${hasData ? `<img src="${image}" alt="${title}" />` : ''}
      </div>
      <div class="card-body">
        <h2 class="card-title ${hasData ? '' : 'skeleton'}">${hasData ? title : ''}</h2>
        <p class="card-intro ${hasData ? '' : 'skeleton'}">${hasData ? intro : ''}</p>
      </div>
    `;

    if (hasData) {
      const img = this.shadowRoot.querySelector('img');
      if (img) {
        img.addEventListener('load', () => img.classList.add('loaded'));
        if (img.complete) img.classList.add('loaded');
        img.addEventListener('error', () => {
          img.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="225"><rect fill="%23e2e5e7" width="400" height="225"/><text fill="%23999" x="50%25" y="50%25" text-anchor="middle" dy=".3em">图片加载失败</text></svg>';
          img.classList.add('loaded');
        });
      }
    }
  }
}

customElements.define('skeleton-card', SkeletonCard);

// ==================== 3. CardLoader 组件 ====================

class CardLoader extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._folders = [];
    this._container = null;
  }

  static get observedAttributes() {
    return ['resource-path', 'max-cards', 'shuffle', 'base-path'];
  }

  async connectedCallback() {
    this.render();
    const resourcePath = this.getAttribute('resource-path') || './resource';
    const maxCards = parseInt(this.getAttribute('max-cards')) || Infinity;
    const shuffle = this.hasAttribute('shuffle');
    await this.loadFolders(resourcePath, maxCards, shuffle);
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host { display: block; width: 100%; }
        .container {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 1.5rem;
          width: 100%;
        }
        .loading-state { text-align: center; padding: 3rem; color: #999; font-size: 0.9rem; }
        .error-state { text-align: center; padding: 2rem; color: #e74c3c; background: #fdeaea; border-radius: 8px; margin: 1rem 0; }
        .empty-state { text-align: center; padding: 3rem; color: #999; }
        .progress-bar { width: 100%; height: 3px; background: #e2e5e7; border-radius: 2px; margin-bottom: 1rem; overflow: hidden; }
        .progress-bar-fill { height: 100%; background: linear-gradient(90deg, #ff8c42, #ff6b9d); border-radius: 2px; transition: width 0.3s ease; }
      </style>
      <div class="progress-bar" id="progress-bar" style="display:none;"><div class="progress-bar-fill" id="progress-fill" style="width:0%"></div></div>
      <div class="container" id="card-container"></div>
    `;
    this._container = this.shadowRoot.getElementById('card-container');
  }

  async loadFolders(resourcePath, maxCards, shuffle) {
    try {
      console.log('[CardLoader] 开始加载, resourcePath:', resourcePath);
      const foldersResponse = await fetch(`${resourcePath}/folders.json`);
      if (!foldersResponse.ok) throw new Error('folders.json 加载失败');
      this._folders = await foldersResponse.json();
      console.log('[CardLoader] folders:', this._folders);

      if (shuffle) this._folders = this._folders.sort(() => Math.random() - 0.5);
      if (maxCards !== Infinity) this._folders = this._folders.slice(0, maxCards);

      const progressBar = this.shadowRoot.getElementById('progress-bar');
      const progressFill = this.shadowRoot.getElementById('progress-fill');
      progressBar.style.display = 'block';

      const loadPromises = this._folders.map((folder, index) => 
        this.loadCard(resourcePath, folder, index, progressFill, this._folders.length)
      );

      await Promise.all(loadPromises);
      progressBar.style.display = 'none';

      if (this._container.children.length === 0) {
        this._container.innerHTML = '<div class="empty-state">暂无资源卡片</div>';
      }
      console.log('[CardLoader] 加载完成');
    } catch (error) {
      console.error('[CardLoader] 加载失败:', error);
      this._container.innerHTML = `<div class="error-state"><strong>⚠️ 加载失败</strong><br>${error.message}</div>`;
    }
  }

  async loadCard(resourcePath, folder, index, progressFill, total) {
    const folderPath = `${resourcePath}/${folder}`;
    console.log('[CardLoader] 加载文件夹:', folder, '路径:', folderPath);

    try {
      const cardEl = document.createElement('skeleton-card');
      cardEl.classList.add('loading');
      this._container.appendChild(cardEl);

      const response = await fetch(`${folderPath}/${folder}.json`);
      if (!response.ok) throw new Error(`JSON 加载失败: ${folder}`);
      const data = await response.json();
      console.log('[CardLoader] JSON数据:', folder, data);

      await this.delay(200 + Math.random() * 300);

      if (data.cards && data.cards.length > 0) {
        const card = data.cards[0];
        cardEl.setAttribute('image', `${folderPath}/${card.image}`);
        cardEl.setAttribute('title', card.title);
        cardEl.setAttribute('intro', card.intro);

        // 关键：确保 article-id 有值
        const articleId = data.id || folder;
        console.log('[CardLoader] 设置 article-id:', articleId, '(data.id:', data.id, ', folder:', folder, ')');
        cardEl.setAttribute('article-id', String(articleId));

        if (data.url) cardEl.setAttribute('article-url', data.url);

        const basePath = this.getAttribute('base-path');
        if (basePath) cardEl.setAttribute('base-path', basePath);

        if (data.categories && Array.isArray(data.categories)) {
          cardEl.setAttribute('categories', JSON.stringify(data.categories));
          if (data.categoryColors && Array.isArray(data.categoryColors)) {
            cardEl.setAttribute('category-colors', JSON.stringify(data.categoryColors));
          }
        } else if (data.category) {
          cardEl.setAttribute('category', data.category);
          if (data.categoryColor) {
            cardEl.setAttribute('category-color', data.categoryColor);
          }
        } else {
          cardEl.setAttribute('category', folder);
        }

        cardEl.classList.remove('loading');
        console.log('[CardLoader] 卡片加载完成:', articleId);
      } else {
        console.warn('[CardLoader] 没有卡片数据:', folder);
        cardEl.remove();
      }

      if (progressFill) {
        progressFill.style.width = `${((index + 1) / total) * 100}%`;
      }
    } catch (error) {
      console.error(`[CardLoader] 加载 ${folder} 失败:`, error);
      const placeholder = this._container.querySelector('.loading');
      if (placeholder) placeholder.remove();
    }
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

customElements.define('card-loader', CardLoader);