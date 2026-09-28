class McNavbar extends HTMLElement {
    static get observedAttributes() {
        return [
            'bg-color', 'text-color', 'hover-color', 'active-color',
            'icon-src', 'icon-type', 'icon-color',
            'search-bg', 'search-border', 'search-focus-color',
            'search-placeholder'
        ];
    }

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.user = null;
        this.render();
    }

    attributeChangedCallback() {
        this.render();
    }

    getAttr(name, defaultVal) {
        return this.getAttribute(name) || defaultVal;
    }

    getIconSvg() {
        const type = this.getAttribute('icon-type') || 'grass';
        const icons = {
            grass: `
                <rect x="0" y="0" width="100" height="100" fill="#5C9E34" rx="8"/>
                <rect x="0" y="60" width="100" height="40" fill="#8B6914" rx="8"/>
                <rect x="10" y="10" width="20" height="20" fill="#6ABF3E" rx="2"/>
                <rect x="40" y="15" width="15" height="15" fill="#6ABF3E" rx="2"/>
                <rect x="70" y="8" width="18" height="18" fill="#6ABF3E" rx="2"/>
                <rect x="25" y="35" width="12" height="12" fill="#6ABF3E" rx="2"/>
                <rect x="55" y="40" width="20" height="15" fill="#6ABF3E" rx="2"/>
                <rect x="5" y="68" width="15" height="15" fill="#A07828" rx="2"/>
                <rect x="30" y="72" width="20" height="12" fill="#A07828" rx="2"/>
                <rect x="60" y="65" width="18" height="18" fill="#A07828" rx="2"/>
                <rect x="85" y="75" width="10" height="10" fill="#A07828" rx="2"/>
                <rect x="0" y="0" width="100" height="100" fill="none" stroke="#4a8a2a" stroke-width="3" rx="8"/>
            `,
            redstone: `
                <rect x="0" y="0" width="100" height="100" fill="#2d0a0a" rx="8"/>
                <rect x="15" y="15" width="70" height="70" fill="#8B0000" rx="4"/>
                <circle cx="50" cy="50" r="20" fill="#B22222"/>
                <circle cx="50" cy="50" r="10" fill="#FF4444"/>
                <rect x="0" y="0" width="100" height="100" fill="none" stroke="#660000" stroke-width="3" rx="8"/>
            `,
            diamond: `
                <rect x="0" y="0" width="100" height="100" fill="#0a1628" rx="8"/>
                <polygon points="50,10 85,40 50,90 15,40" fill="#00CED1"/>
                <polygon points="50,10 85,40 50,55 15,40" fill="#40E0D0"/>
                <polygon points="50,55 85,40 50,90" fill="#008B8B"/>
                <polygon points="50,55 15,40 50,90" fill="#20B2AA"/>
                <rect x="0" y="0" width="100" height="100" fill="none" stroke="#004d4d" stroke-width="3" rx="8"/>
            `,
            torch: `
                <rect x="0" y="0" width="100" height="100" fill="#1a1a2e" rx="8"/>
                <rect x="42" y="55" width="16" height="40" fill="#8B6914" rx="2"/>
                <rect x="35" y="20" width="30" height="35" fill="#FFD700" rx="4"/>
                <circle cx="50" cy="30" r="8" fill="#FFF8DC"/>
                <rect x="0" y="0" width="100" height="100" fill="none" stroke="#333" stroke-width="3" rx="8"/>
            `,
            piston: `
                <rect x="0" y="0" width="100" height="100" fill="#3d3d3d" rx="8"/>
                <rect x="10" y="10" width="80" height="30" fill="#8B4513" rx="4"/>
                <rect x="20" y="40" width="60" height="15" fill="#A0522D" rx="2"/>
                <rect x="35" y="55" width="30" height="35" fill="#696969" rx="2"/>
                <rect x="0" y="0" width="100" height="100" fill="none" stroke="#222" stroke-width="3" rx="8"/>
            `,
            command: `
                <rect x="0" y="0" width="100" height="100" fill="#4a2c5a" rx="8"/>
                <rect x="15" y="15" width="70" height="70" fill="#8B5A8C" rx="4"/>
                <text x="50" y="58" text-anchor="middle" fill="#fff" font-size="28" font-family="monospace" font-weight="bold">@_</text>
                <rect x="0" y="0" width="100" height="100" fill="none" stroke="#2d1a35" stroke-width="3" rx="8"/>
            `
        };
        return icons[type] || icons.grass;
    }

    // 获取当前用户信息
    getUser() {
        try {
            return JSON.parse(localStorage.getItem('mc_user') || 'null');
        } catch {
            return null;
        }
    }

    // 退出登录
    logout() {
        localStorage.removeItem('mc_user');
        window.location.reload();
    }

    render() {
        const bgColor        = this.getAttr('bg-color', '#16213e');
        const textColor      = this.getAttr('text-color', '#a0a0c0');
        const hoverColor     = this.getAttr('hover-color', '#ffffff');
        const activeColor    = this.getAttr('active-color', '#4ecca3');
        const searchBg       = this.getAttr('search-bg', '#ffffff');
        const searchBorder   = this.getAttr('search-border', '#e3e8ee');
        const searchFocus    = this.getAttr('search-focus-color', '#2e7def');
        const searchPlaceholder = this.getAttr('search-placeholder', '搜索活动照片...');

        const iconSrc = this.getAttribute('icon-src');
        const iconSvg = this.getIconSvg();
        const user = this.getUser();

        const iconHtml = iconSrc
            ? `<img class="mc-icon" src="${iconSrc}" alt="Logo">`
            : `<svg class="mc-icon" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">${iconSvg}</svg>`;

        // 用户头像区域 - 右上角
        const userAvatarHtml = user && user.isLoggedIn
            ? `<div class="user-avatar-wrapper" id="userMenuTrigger">
                <img class="user-avatar" src="${user.avatar}" alt="${user.name}" title="${user.name}">
                <div class="user-dropdown" id="userDropdown">
                    <div class="user-dropdown-header">
                        <img class="user-dropdown-avatar" src="${user.avatar}" alt="">
                        <div class="user-dropdown-info">
                            <div class="user-dropdown-name">${user.name}</div>
                            <div class="user-dropdown-status">已登录</div>
                        </div>
                    </div>
                    <div class="user-dropdown-divider"></div>
                    <a href="login.html" class="user-dropdown-item" target="_self" onclick="event.preventDefault(); localStorage.removeItem('mc_user'); window.location.reload();">
                        <span class="material-icons">logout</span>
                        <span>退出登录</span>
                    </a>
                </div>
            </div>`
            : `<a href="login.html" class="login-link" title="登录" target="_self">
                <span class="material-icons">account_circle</span>
            </a>`;

        this.shadowRoot.innerHTML = `
            <style>
                @import url("https://fonts.googleapis.com/icon?family=Material+Icons");

                :host {
                    display: block;
                    width: 100%;
                    --navbar-bg: ${bgColor};
                    --nav-text: ${textColor};
                    --nav-hover: ${hoverColor};
                    --nav-active: ${activeColor};
                }

                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }

                .navbar {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    background-color: var(--navbar-bg);
                    padding: 0 24px;
                    height: 60px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.3);
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    z-index: 1000;
                    gap: 16px;
                }

                .nav-left {
                    display: flex;
                    align-items: center;
                    gap: 0;
                    min-width: 0;
                    flex: 1;
                }

                /* ========== 用户头像 - 右上角 ========== */
                .user-avatar-wrapper {
                    position: relative;
                    margin-left: 12px;
                    flex-shrink: 0;
                }

                .user-avatar {
                    width: 36px;
                    height: 36px;
                    border-radius: 50%;
                    cursor: pointer;
                    border: 2px solid rgba(255,255,255,0.2);
                    transition: all 0.3s ease;
                    object-fit: cover;
                }

                .user-avatar:hover {
                    border-color: var(--nav-active);
                    transform: scale(1.1);
                }

                .user-dropdown {
                    position: absolute;
                    top: calc(100% + 8px);
                    right: 0;
                    width: 200px;
                    background: #fff;
                    border-radius: 12px;
                    box-shadow: 0 10px 40px rgba(0,0,0,0.2);
                    padding: 12px 0;
                    opacity: 0;
                    visibility: hidden;
                    transform: translateY(-10px);
                    transition: all 0.25s ease;
                    z-index: 1001;
                }

                .user-dropdown.show {
                    opacity: 1;
                    visibility: visible;
                    transform: translateY(0);
                }

                .user-dropdown-header {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 0 16px 12px;
                }

                .user-dropdown-avatar {
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    object-fit: cover;
                }

                .user-dropdown-info {
                    flex: 1;
                }

                .user-dropdown-name {
                    font-size: 14px;
                    font-weight: 600;
                    color: #1a1a2e;
                }

                .user-dropdown-status {
                    font-size: 12px;
                    color: #767676;
                }

                .user-dropdown-divider {
                    height: 1px;
                    background: #e3e5e7;
                    margin: 8px 0;
                }

                .user-dropdown-item {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 10px 16px;
                    color: #333;
                    text-decoration: none;
                    font-size: 14px;
                    transition: background 0.2s;
                    cursor: pointer;
                }

                .user-dropdown-item:hover {
                    background: #f5f5f5;
                }

                .user-dropdown-item .material-icons {
                    font-size: 18px;
                    color: #767676;
                }

                /* 登录链接 */
                .login-link {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 36px;
                    height: 36px;
                    margin-left: 12px;
                    color: var(--nav-text);
                    text-decoration: none;
                    border-radius: 50%;
                    transition: all 0.3s;
                    flex-shrink: 0;
                }

                .login-link:hover {
                    color: var(--nav-hover);
                    background: rgba(255,255,255,0.1);
                }

                .login-link .material-icons {
                    font-size: 28px;
                }

                .mc-icon {
                    width: 40px;
                    height: 40px;
                    margin-right: 12px;
                    cursor: pointer;
                    transition: transform 0.3s ease;
                    border-radius: 8px;
                    flex-shrink: 0;
                }

                .mc-icon:hover {
                    transform: scale(1.1);
                }

                .nav-links {
                    display: flex;
                    align-items: center;
                    list-style: none;
                    gap: 4px;
                }

                .nav-links li {
                    position: relative;
                    flex-shrink: 0;
                }

                .nav-links a {
                    display: block;
                    padding: 0 14px;
                    height: 60px;
                    line-height: 60px;
                    text-decoration: none;
                    color: var(--nav-text);
                    font-size: 14px;
                    font-weight: 500;
                    transition: all 0.3s ease;
                    border-bottom: 3px solid transparent;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                .nav-links a:hover {
                    color: var(--nav-hover);
                    background-color: rgba(255,255,255,0.05);
                }

                .nav-links a.active {
                    color: var(--nav-active);
                    border-bottom-color: var(--nav-active);
                }

                .nav-right {
                    display: flex;
                    align-items: center;
                    flex-shrink: 0;
                    gap: 8px;
                }

                /* ========== 搜索框样式 ========== */
                .search-box {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    width: 280px;
                    height: 40px;
                    padding: 0 8px 0 18px;
                    background: ${searchBg};
                    border: 1px solid ${searchBorder};
                    border-radius: 999px;
                    box-shadow:
                        0 1px 1px rgba(14, 17, 22, 0.03),
                        0 18px 36px -22px rgba(14, 17, 22, 0.18);
                    font-family: "Inter", system-ui, -apple-system, sans-serif;
                    transition:
                        border-color 220ms cubic-bezier(0.22, 1, 0.36, 1),
                        box-shadow 220ms cubic-bezier(0.22, 1, 0.36, 1);
                }

                .search-box:focus-within {
                    border-color: ${searchFocus};
                    box-shadow:
                        0 0 0 3px ${searchFocus}33,
                        0 18px 36px -22px rgba(14, 17, 22, 0.2);
                }

                .search-box__icon {
                    width: 16px;
                    height: 16px;
                    color: #5b6472;
                    flex-shrink: 0;
                }

                .search-box__field {
                    flex: 1;
                    min-width: 0;
                    border: 0;
                    outline: 0;
                    background: transparent;
                    font: inherit;
                    font-size: 14px;
                    color: #0e1116;
                }

                .search-box__field::placeholder {
                    color: #8a93a3;
                }

                .search-box__kbd {
                    display: inline-flex;
                    align-items: center;
                    height: 24px;
                    padding: 0 8px;
                    background: #f3f6fa;
                    border: 1px solid #eef2f6;
                    border-radius: 999px;
                    font-family: "Inter", system-ui, sans-serif;
                    font-size: 11px;
                    font-weight: 500;
                    color: #5b6472;
                    letter-spacing: 0.02em;
                    flex-shrink: 0;
                }

                /* 搜索建议下拉 */
                .search-suggestions {
                    position: absolute;
                    top: calc(100% + 8px);
                    left: 0;
                    right: 0;
                    background: #fff;
                    border-radius: 12px;
                    box-shadow: 0 10px 40px rgba(0,0,0,0.15);
                    max-height: 400px;
                    overflow-y: auto;
                    opacity: 0;
                    visibility: hidden;
                    transform: translateY(-10px);
                    transition: all 0.25s ease;
                    z-index: 1001;
                }

                .search-suggestions.show {
                    opacity: 1;
                    visibility: visible;
                    transform: translateY(0);
                }

                .search-suggestion-item {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 12px 16px;
                    cursor: pointer;
                    transition: background 0.2s;
                    text-decoration: none;
                    color: #333;
                }

                .search-suggestion-item:hover {
                    background: #f5f5f5;
                }

                .search-suggestion-img {
                    width: 48px;
                    height: 48px;
                    border-radius: 8px;
                    object-fit: cover;
                    background: #e3e5e7;
                }

                .search-suggestion-info {
                    flex: 1;
                    min-width: 0;
                }

                .search-suggestion-title {
                    font-size: 14px;
                    font-weight: 600;
                    color: #1a1a2e;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                .search-suggestion-category {
                    font-size: 12px;
                    color: #767676;
                    margin-top: 2px;
                }

                .search-wrapper {
                    position: relative;
                    width: 280px;
                }

                /* ========== 中等屏幕 ========== */
                @media (max-width: 900px) {
                    .nav-links a {
                        padding: 0 10px;
                        font-size: 13px;
                    }
                    .navbar {
                        padding: 0 16px;
                    }
                    .search-wrapper {
                        width: 200px;
                    }
                    .search-box {
                        width: 200px;
                    }
                }

                /* ========== 小屏幕：汉堡菜单 ========== */
                @media (max-width: 768px) {
                    .navbar {
                        padding: 0 12px;
                        gap: 8px;
                    }

                    .nav-links {
                        display: none;
                        position: absolute;
                        top: 60px;
                        left: 0;
                        right: 0;
                        background-color: var(--navbar-bg);
                        flex-direction: column;
                        padding: 8px 0;
                        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                        border-top: 1px solid rgba(255,255,255,0.05);
                        gap: 0;
                    }

                    .nav-links.open {
                        display: flex;
                    }

                    .nav-links li {
                        width: 100%;
                    }

                    .nav-links a {
                        height: 48px;
                        line-height: 48px;
                        padding: 0 24px;
                        font-size: 14px;
                        border-bottom: none;
                        border-left: 3px solid transparent;
                    }

                    .nav-links a.active {
                        border-bottom-color: transparent;
                        border-left-color: var(--nav-active);
                        background-color: rgba(255,255,255,0.05);
                    }

                    .menu-toggle {
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        width: 36px;
                        height: 36px;
                        background: none;
                        border: none;
                        cursor: pointer;
                        color: var(--nav-text);
                        margin-right: 8px;
                        flex-shrink: 0;
                        border-radius: 6px;
                        transition: background-color 0.2s;
                    }

                    .menu-toggle:hover {
                        background-color: rgba(255,255,255,0.1);
                        color: var(--nav-hover);
                    }

                    .menu-toggle svg {
                        width: 22px;
                        height: 22px;
                    }

                    .search-wrapper {
                        width: auto;
                        flex: 1;
                        min-width: 100px;
                    }
                    .search-box {
                        width: 100%;
                    }
                }

                /* 默认隐藏汉堡按钮 */
                .menu-toggle {
                    display: none;
                }

                @media (max-width: 768px) {
                    .menu-toggle {
                        display: flex;
                    }
                }

                /* 超小屏幕 */
                @media (max-width: 480px) {
                    .search-box__kbd {
                        display: none;
                    }
                    .search-box {
                        padding: 0 12px 0 14px;
                    }
                    .user-avatar {
                        width: 32px;
                        height: 32px;
                    }
                }

                @media (max-width: 400px) {
                    .navbar {
                        padding: 0 8px;
                        gap: 6px;
                    }
                    .mc-icon {
                        width: 32px;
                        height: 32px;
                        margin-right: 6px;
                    }
                    .search-wrapper {
                        min-width: 80px;
                    }
                }

                @media (max-width: 320px) {
                    .search-wrapper {
                        min-width: 60px;
                    }
                }
            </style>

            <nav class="navbar">
                <div class="nav-left">
                    <button class="menu-toggle" aria-label="打开菜单" aria-expanded="false">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <line x1="3" y1="12" x2="21" y2="12"></line>
                            <line x1="3" y1="6" x2="21" y2="6"></line>
                            <line x1="3" y1="18" x2="21" y2="18"></line>
                        </svg>
                    </button>

                    <a href="index.html" target="_self">
                        ${iconHtml}
                    </a>

                    <ul class="nav-links">
                        <li><a href="index.html" target="_self">主页</a></li>
                        <li><a href="schematics.html" target="_self">集体相册</a></li>
                    </ul>
                </div>

                <div class="nav-right">
                    <div class="search-wrapper">
                        <label class="search-box">
                            <svg class="search-box__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                                <circle cx="11" cy="11" r="8"></circle>
                                <path d="m21 21-4.34-4.34"></path>
                            </svg>
                            <input class="search-box__field" type="search" placeholder="${searchPlaceholder}" aria-label="Search" id="navbarSearch" autocomplete="off" />
                            <kbd class="search-box__kbd">⌘ K</kbd>
                        </label>
                        <div class="search-suggestions" id="searchSuggestions"></div>
                    </div>

                    <!-- 用户头像（最右侧） -->
                    ${userAvatarHtml}
                </div>
            </nav>
        `;

        // 绑定汉堡菜单事件
        const menuToggle = this.shadowRoot.querySelector('.menu-toggle');
        const navLinks = this.shadowRoot.querySelector('.nav-links');

        if (menuToggle && navLinks) {
            menuToggle.addEventListener('click', () => {
                const isOpen = navLinks.classList.toggle('open');
                menuToggle.setAttribute('aria-expanded', isOpen);
            });

            navLinks.querySelectorAll('a').forEach(link => {
                link.addEventListener('click', () => {
                    navLinks.classList.remove('open');
                    menuToggle.setAttribute('aria-expanded', 'false');
                });
            });
        }

        // 根据当前页面自动设置 active 类
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';
        this.shadowRoot.querySelectorAll('.nav-links a').forEach(link => {
            const href = link.getAttribute('href');
            if (href === currentPage || (currentPage === '' && href === 'index.html')) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });

        // 用户下拉菜单
        const userMenuTrigger = this.shadowRoot.getElementById('userMenuTrigger');
        const userDropdown = this.shadowRoot.getElementById('userDropdown');

        if (userMenuTrigger && userDropdown) {
            userMenuTrigger.addEventListener('click', (e) => {
                e.stopPropagation();
                userDropdown.classList.toggle('show');
            });

            // 点击外部关闭下拉菜单
            const closeDropdown = (e) => {
                if (!userMenuTrigger.contains(e.target)) {
                    userDropdown.classList.remove('show');
                }
            };
            document.addEventListener('click', closeDropdown);
            // 清理函数存储
            this._closeDropdownHandler = closeDropdown;
        }

        // 搜索功能
        this.setupSearch();
    }

    disconnectedCallback() {
        if (this._closeDropdownHandler) {
            document.removeEventListener('click', this._closeDropdownHandler);
        }
    }

    // 设置搜索功能
    setupSearch() {
        const searchInput = this.shadowRoot.getElementById('navbarSearch');
        const suggestionsEl = this.shadowRoot.getElementById('searchSuggestions');

        if (!searchInput) return;

        let searchTimeout;
        let allData = [];

        // 加载搜索数据
        this.loadSearchData().then(data => {
            allData = data;
        });

        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            const query = e.target.value.trim().toLowerCase();

            if (!query) {
                suggestionsEl.classList.remove('show');
                return;
            }

            searchTimeout = setTimeout(() => {
                const results = allData.filter(item => {
                    const title = (item.title || '').toLowerCase();
                    const intro = (item.intro || '').toLowerCase();
                    return title.includes(query) || intro.includes(query);
                }).slice(0, 8);

                this.renderSuggestions(results, suggestionsEl, query);
            }, 200);
        });

        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const query = searchInput.value.trim();
                if (query) {
                    // 执行搜索 - 跳转到搜索结果页面或当前页面搜索
                    this.performSearch(query, allData);
                }
            }
            if (e.key === 'Escape') {
                suggestionsEl.classList.remove('show');
                searchInput.blur();
            }
        });

        // 点击外部关闭建议
        document.addEventListener('click', (e) => {
            if (!this.shadowRoot.contains(e.target)) {
                suggestionsEl.classList.remove('show');
            }
        });

        // 快捷键 ⌘K / Ctrl+K
        document.addEventListener('keydown', (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                searchInput.focus();
            }
        });
    }

    // 执行搜索
    performSearch(query, allData) {
        const results = allData.filter(item => {
            const title = (item.title || '').toLowerCase();
            const intro = (item.intro || '').toLowerCase();
            const category = (item.category || '').toLowerCase();
            return title.includes(query.toLowerCase()) || 
                   intro.includes(query.toLowerCase()) ||
                   category.includes(query.toLowerCase());
        });

        if (results.length > 0) {
            // 跳转到第一个匹配结果
            window.location.href = `article.html?id=${encodeURIComponent(results[0].folder)}`;
        } else {
            alert('未找到相关结果');
        }
    }

    async loadSearchData() {
        try {
            // 根据当前页面路径确定 resource 路径
            let resourcePath = '/pages/resource';
            const currentPath = window.location.pathname;
            if (currentPath.includes('/pages/html/')) {
                resourcePath = '../resource';
            } else if (currentPath.includes('/pages/')) {
                resourcePath = './resource';
            }

            const response = await fetch(`${resourcePath}/folders.json`);
            if (!response.ok) return [];
            const folders = await response.json();

            const data = [];
            for (const folder of folders) {
                try {
                    const res = await fetch(`${resourcePath}/${folder}/${folder}.json`);
                    if (!res.ok) continue;
                    const json = await res.json();
                    if (json.cards && json.cards[0]) {
                        data.push({
                            ...json.cards[0],
                            folder: folder,
                            category: json.category || json.categories?.[0] || '其他',
                            image: `${resourcePath}/${folder}/${json.cards[0].image}`
                        });
                    }
                } catch (e) {
                    console.warn('加载搜索数据失败:', folder);
                }
            }
            return data;
        } catch (e) {
            console.error('搜索数据加载失败:', e);
            return [];
        }
    }

    renderSuggestions(results, container, query) {
        if (results.length === 0) {
            container.innerHTML = `
                <div class="search-suggestion-item">
                    <div class="search-suggestion-info">
                        <div class="search-suggestion-title">未找到 "${query}" 相关结果</div>
                    </div>
                </div>
            `;
        } else {
            container.innerHTML = results.map(item => `
                <a href="article.html?id=${encodeURIComponent(item.folder)}" class="search-suggestion-item" target="_self">
                    <img class="search-suggestion-img" src="${item.image}" alt="" onerror="this.style.display='none'">
                    <div class="search-suggestion-info">
                        <div class="search-suggestion-title">${item.title}</div>
                        <div class="search-suggestion-category">${item.category}</div>
                    </div>
                </a>
            `).join('');
        }
        container.classList.add('show');
    }
}

customElements.define('mc-navbar', McNavbar);