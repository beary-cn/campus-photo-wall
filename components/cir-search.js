class CirSearch extends HTMLElement {
    static get observedAttributes() {
        return ['placeholder', 'width'];
    }

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.render();
    }

    attributeChangedCallback(name, oldVal, newVal) {
        if (!this.shadowRoot) return;
        if (name === 'placeholder') {
            const input = this.shadowRoot.querySelector('.cir-search__field');
            if (input) input.placeholder = newVal || '搜索...';
        }
        if (name === 'width') {
            this.render();
        }
    }

    render() {
        const placeholder = this.getAttribute('placeholder') || '搜索活动照片...';
        // 支持外部通过 width 属性控制，默认 auto 自适应
        const width = this.getAttribute('width') || 'auto';
        const minWidth = this.getAttribute('min-width') || '120px';

        this.shadowRoot.innerHTML = `
            <style>
                @import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;500&display=swap");

                :host {
                    display: inline-flex;
                    width: ${width === 'auto' ? '100%' : width};
                    min-width: ${minWidth};
                }

                .cir-search {
                    display: inline-flex;
                    align-items: center;
                    gap: 10px;
                    width: 100%;
                    height: 48px;
                    padding: 0 8px 0 18px;
                    background: var(--search-bg, #ffffff);
                    border: 1px solid var(--search-border, #e3e8ee);
                    border-radius: 999px;
                    box-shadow:
                        0 1px 1px rgba(14, 17, 22, 0.03),
                        0 18px 36px -22px rgba(14, 17, 22, 0.18);
                    font-family: "Inter", system-ui, -apple-system, sans-serif;
                    transition:
                        border-color 220ms cubic-bezier(0.22, 1, 0.36, 1),
                        box-shadow 220ms cubic-bezier(0.22, 1, 0.36, 1);
                }

                .cir-search__icon {
                    width: 16px;
                    height: 16px;
                    color: var(--search-icon-color, #5b6472);
                    flex-shrink: 0;
                }

                .cir-search__field {
                    flex: 1;
                    min-width: 0;
                    border: 0;
                    outline: 0;
                    background: transparent;
                    font: inherit;
                    font-size: 14px;
                    color: var(--search-text-color, #0e1116);
                }

                .cir-search__field::placeholder {
                    color: var(--search-placeholder-color, #8a93a3);
                }

                .cir-search__kbd {
                    display: inline-flex;
                    align-items: center;
                    height: 28px;
                    padding: 0 10px;
                    background: var(--search-kbd-bg, #f3f6fa);
                    border: 1px solid var(--search-kbd-border, #eef2f6);
                    border-radius: 999px;
                    font-family: "Inter", system-ui, sans-serif;
                    font-size: 11px;
                    font-weight: 500;
                    color: var(--search-kbd-color, #5b6472);
                    letter-spacing: 0.02em;
                    flex-shrink: 0;
                }

                .cir-search:focus-within {
                    border-color: var(--search-focus-color, #2e7def);
                    box-shadow:
                        0 0 0 3px var(--search-focus-shadow, rgba(46, 125, 239, 0.22)),
                        0 18px 36px -22px rgba(14, 17, 22, 0.2);
                }

                /* 小屏幕下隐藏键盘快捷键提示 */
                @media (max-width: 480px) {
                    .cir-search__kbd {
                        display: none;
                    }
                    .cir-search {
                        padding: 0 12px 0 14px;
                    }
                }
            </style>
            <label class="cir-search">
                <svg class="cir-search__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <circle cx="11" cy="11" r="8"></circle>
                    <path d="m21 21-4.34-4.34"></path>
                </svg>
                <input class="cir-search__field" type="search" placeholder="${placeholder}" aria-label="Search" />
                <kbd class="cir-search__kbd">⌘ K</kbd>
            </label>
        `;
    }
}

customElements.define('cir-search', CirSearch);