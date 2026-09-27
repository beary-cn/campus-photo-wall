// ==================== B站专栏风格横向卡片 Web Component ====================

class BilibiliArticleCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  static get observedAttributes() {
    return ['image', 'title', 'intro', 'category', 'category-color', 'categories', 'article-id', 'article-url', 'base-path'];
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

    console.log('[BilibiliArticleCard] 点击:', { articleId, articleUrl, basePath });

    if (articleUrl) {
      window.location.href = articleUrl;
      return;
    }

    if (!articleId || articleId === 'null' || articleId === 'undefined') {
      console.error('[BilibiliArticleCard] 错误: article-id 无效:', articleId);
      alert('卡片未设置文章ID，无法跳转');
      return;
    }

    const targetUrl = `${basePath}/article.html?id=${encodeURIComponent(articleId)}`;
    console.log('[BilibiliArticleCard] 跳转到:', targetUrl);
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
    return categories.map(() => '#9499a0');
  }

  render() {
    const image = this.getAttribute('image') || '';
    const title = this.getAttribute('title') || '';
    const intro = this.getAttribute('intro') || '';
    const categories = this.parseCategories();
    const categoryColors = this.parseColors(categories);
    const hasData = image || title || intro;

    const tagsHtml = categories.map((cat, index) => {
      const color = categoryColors[index] || '#9499a0';
      return `<span class="category-tag" style="color: ${color};">${cat}</span>`;
    }).join('');

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          width: 100%;
          font-family: "PingFang SC", "Microsoft YaHei", -apple-system, BlinkMacSystemFont, sans-serif;
        }
        .article-card {
          display: flex;
          align-items: flex-start;
          gap: 16px;
          padding: 16px 0;
          border-bottom: 1px solid #e3e5e7;
          background: #fff;
          cursor: pointer;
          transition: background-color 0.2s ease;
        }
        .article-card:hover {
          background-color: #fafafa;
        }
        .card-content {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .card-title {
          font-size: 16px;
          font-weight: 600;
          line-height: 1.5;
          color: #18191c;
          margin: 0;
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;
          overflow: hidden;
          word-break: break-word;
          transition: color 0.2s ease;
        }
        .article-card:hover .card-title {
          color: #00aeec;
        }
        .card-title.skeleton {
          min-height: 24px;
          width: 70%;
          border-radius: 4px;
          background-color: #e3e5e7;
          background-image: linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,0.5), rgba(255,255,255,0));
          background-size: 40px 100%;
          background-repeat: no-repeat;
          background-position: left -40px top 0;
          animation: shine 1.5s ease infinite;
        }
        .card-intro {
          font-size: 14px;
          line-height: 1.6;
          color: #9499a0;
          margin: 0;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          word-break: break-word;
        }
        .card-intro.skeleton {
          min-height: 44px;
          border-radius: 4px;
          background-color: #e3e5e7;
          background-image: linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,0.5), rgba(255,255,255,0));
          background-size: 40px 100%;
          background-repeat: no-repeat;
          background-position: left -40px top 0;
          animation: shine 1.5s ease infinite;
        }
        .category-tags {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }
        .category-tag {
          font-size: 12px;
          font-weight: 500;
          line-height: 1.4;
        }
        .card-img-wrapper {
          position: relative;
          width: 160px;
          height: 100px;
          flex-shrink: 0;
          border-radius: 6px;
          overflow: hidden;
          background-color: #f1f2f3;
        }
        .card-img-wrapper img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          opacity: 0;
          transition: opacity 0.3s ease, transform 0.4s ease;
        }
        .card-img-wrapper img.loaded {
          opacity: 1;
        }
        .article-card:hover .card-img-wrapper img.loaded {
          transform: scale(1.05);
        }
        @keyframes shine {
          to { background-position: right -40px top 0; }
        }
        @media (max-width: 600px) {
          .card-img-wrapper { width: 120px; height: 75px; }
          .card-title { font-size: 15px; }
          .card-intro { font-size: 13px; -webkit-line-clamp: 1; }
        }
      </style>
      <div class="article-card">
        <div class="card-content">
          <h2 class="card-title ${hasData ? '' : 'skeleton'}">${hasData ? title : ''}</h2>
          <p class="card-intro ${hasData ? '' : 'skeleton'}">${hasData ? intro : ''}</p>
          ${hasData && categories.length > 0 ? `<div class="category-tags">${tagsHtml}</div>` : ''}
        </div>
        ${hasData ? `<div class="card-img-wrapper"><img src="${image}" alt="${title}" /></div>` : ''}
      </div>
    `;

    if (hasData) {
      const img = this.shadowRoot.querySelector('.card-img-wrapper img');
      if (img) {
        img.addEventListener('load', () => img.classList.add('loaded'));
        if (img.complete) img.classList.add('loaded');
        img.addEventListener('error', () => {
          img.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="160" height="100"><rect fill="%23f1f2f3" width="160" height="100"/><text fill="%239499a0" x="50%25" y="50%25" text-anchor="middle" dy=".3em" font-size="12">无图</text></svg>';
          img.classList.add('loaded');
        });
      }
    }
  }
}

customElements.define('bilibili-article-card', BilibiliArticleCard);

// ==================== ArticleLoader 组件 ====================

class ArticleLoader extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._folders = [];
    this._container = null;
  }

  static get observedAttributes() {
    return ['resource-path', 'max-cards', 'shuffle', 'filter-category', 'base-path'];
  }

  async connectedCallback() {
    this.render();
    const resourcePath = this.getAttribute('resource-path') || './resource';
    const maxCards = parseInt(this.getAttribute('max-cards')) || Infinity;
    const shuffle = this.hasAttribute('shuffle');
    const filterCategory = this.getAttribute('filter-category') || '';
    await this.loadFolders(resourcePath, maxCards, shuffle, filterCategory);
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host { display: block; width: 100%; }
        .container {
          display: flex;
          flex-direction: column;
          width: 100%;
          background: #fff;
          border-radius: 8px;
          overflow: hidden;
        }
        .loading-state { text-align: center; padding: 3rem; color: #9499a0; font-size: 0.9rem; }
        .error-state { text-align: center; padding: 2rem; color: #e74c3c; background: #fdeaea; border-radius: 8px; margin: 1rem 0; }
        .empty-state { text-align: center; padding: 3rem; color: #9499a0; background: #fff; border-radius: 8px; }
        .progress-bar { width: 100%; height: 3px; background: #e3e5e7; border-radius: 2px; margin-bottom: 1rem; overflow: hidden; }
        .progress-bar-fill { height: 100%; background: linear-gradient(90deg, #00aeec, #ff6699); border-radius: 2px; transition: width 0.3s ease; }
      </style>
      <div class="progress-bar" id="progress-bar" style="display:none;"><div class="progress-bar-fill" id="progress-fill" style="width:0%"></div></div>
      <div class="container" id="card-container"></div>
    `;
    this._container = this.shadowRoot.getElementById('card-container');
  }

  async loadFolders(resourcePath, maxCards, shuffle, filterCategory) {
    try {
      console.log('[ArticleLoader] 开始加载, resourcePath:', resourcePath);
      const foldersResponse = await fetch(`${resourcePath}/folders.json`);
      if (!foldersResponse.ok) throw new Error('folders.json 加载失败');
      this._folders = await foldersResponse.json();
      console.log('[ArticleLoader] folders:', this._folders);

      if (shuffle) this._folders = this._folders.sort(() => Math.random() - 0.5);
      if (maxCards !== Infinity) this._folders = this._folders.slice(0, maxCards);

      const progressBar = this.shadowRoot.getElementById('progress-bar');
      const progressFill = this.shadowRoot.getElementById('progress-fill');
      progressBar.style.display = 'block';

      const loadPromises = this._folders.map((folder, index) => 
        this.loadCard(resourcePath, folder, index, progressFill, this._folders.length, filterCategory)
      );

      await Promise.all(loadPromises);
      progressBar.style.display = 'none';

      if (this._container.children.length === 0) {
        this._container.innerHTML = '<div class="empty-state">暂无照片</div>';
      }
    } catch (error) {
      console.error('[ArticleLoader] 加载失败:', error);
      this._container.innerHTML = `<div class="error-state"><strong>⚠️ 加载失败</strong><br>${error.message}</div>`;
    }
  }

  async loadCard(resourcePath, folder, index, progressFill, total, filterCategory) {
    const folderPath = `${resourcePath}/${folder}`;
    console.log('[ArticleLoader] 加载文件夹:', folder, '路径:', folderPath);

    try {
      const cardEl = document.createElement('bilibili-article-card');
      cardEl.classList.add('loading');
      this._container.appendChild(cardEl);

      const response = await fetch(`${folderPath}/${folder}.json`);
      if (!response.ok) throw new Error(`JSON 加载失败: ${folder}`);
      const data = await response.json();
      console.log('[ArticleLoader] JSON数据:', folder, data);

      if (filterCategory) {
        const categories = data.categories || [];
        const category = data.category || '';
        if (!categories.includes(filterCategory) && category !== filterCategory) {
          cardEl.remove();
          return;
        }
      }

      await this.delay(200 + Math.random() * 300);

      if (data.cards && data.cards.length > 0) {
        const card = data.cards[0];
        cardEl.setAttribute('image', `${folderPath}/${card.image}`);
        cardEl.setAttribute('title', card.title);
        cardEl.setAttribute('intro', card.intro);

        // 关键：确保 article-id 有值
        const articleId = data.id || folder;
        console.log('[ArticleLoader] 设置 article-id:', articleId, '(data.id:', data.id, ', folder:', folder, ')');
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
        }

        cardEl.classList.remove('loading');
        console.log('[ArticleLoader] 卡片加载完成:', articleId);
      } else {
        console.warn('[ArticleLoader] 没有卡片数据:', folder);
        cardEl.remove();
      }

      if (progressFill) {
        progressFill.style.width = `${((index + 1) / total) * 100}%`;
      }
    } catch (error) {
      console.error(`[ArticleLoader] 加载 ${folder} 失败:`, error);
      const placeholder = this._container.querySelector('.loading');
      if (placeholder) placeholder.remove();
    }
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

customElements.define('article-loader', ArticleLoader);