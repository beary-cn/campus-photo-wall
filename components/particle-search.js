class ParticleSearch extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.colors = ['#B2949D', '#FFF578', '#FF5F8D', '#37A9CC', '#188EB2'];
        this.stage = null;
        this.textStage = null;
        this.form = null;
        this.input = null;
        this.circles = [];
        this.textPixels = [];
        this.textFormed = false;
        this.offsetX = 0;
        this.offsetY = 0;
        this.text = null;
    }

    connectedCallback() {
        this.render();
        this.init();
    }

    render() {
        const template = document.createElement('template');
        template.innerHTML = `
            <style>
                :host {
                    display: block;
                    width: 100%;
                    max-width: 600px;
                    position: relative;
                }
                .container {
                    width: 100%;
                    background: #fff;
                    border-radius: 16px;
                    box-shadow: 0 10px 40px rgba(0,0,0,0.1);
                    overflow: hidden;
                    position: relative;
                }
                .canvas-wrapper {
                    position: relative;
                    width: 100%;
                    height: 300px;
                    background: #eee;
                    overflow: hidden;
                }
                #text { display: none; }
                #stage {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                }
                .search-box {
                    padding: 20px 30px;
                    background: #fff;
                    border-top: 1px solid #eee;
                    display: flex;
                    gap: 10px;
                    align-items: center;
                }
                input[type="text"] {
                    flex: 1;
                    border: 2px solid #ddd;
                    border-radius: 8px;
                    padding: 12px 16px;
                    font-size: 16px;
                    font-family: 'Source Sans Pro', sans-serif;
                    text-transform: uppercase;
                    outline: none;
                    transition: border-color 0.3s;
                }
                input[type="text"]:focus {
                    border-color: mediumpurple;
                }
                input[type="submit"] {
                    width: 100px;
                    border: 0;
                    border-radius: 8px;
                    line-height: 42px;
                    height: 42px;
                    color: #fff;
                    background: mediumpurple;
                    font-size: 16px;
                    font-family: 'Source Sans Pro', sans-serif;
                    cursor: pointer;
                    transition: background 0.3s, transform 0.1s;
                }
                input[type="submit"]:hover {
                    background: #9370db;
                }
                input[type="submit"]:active {
                    transform: scale(0.95);
                }
                .title {
                    position: absolute;
                    top: 15px;
                    left: 20px;
                    font-size: 14px;
                    color: #999;
                    text-transform: uppercase;
                    letter-spacing: 2px;
                    z-index: 10;
                }
                * {
                    position: static;
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }
            </style>
            <div class="container">
                <div class="canvas-wrapper">
                    <span class="title">Particle Search</span>
                    <canvas id="text" width="600" height="200"></canvas>
                    <canvas id="stage"></canvas>
                </div>
                <div class="search-box">
                    <input type="text" id="inputText" value="HELLO" placeholder="输入文字..." />
                    <input type="submit" value="TRY IT" />
                </div>
            </div>
        `;
        this.shadowRoot.appendChild(template.content.cloneNode(true));
    }

    init() {
        this.initStages();
        this.initForm();
        this.initText();
        this.initCircles();
        this.animate();
        this.addListeners();
        setTimeout(() => {
            this.createText(this.input.value.toUpperCase());
        }, 500);
    }

    initStages() {
        const wrapper = this.shadowRoot.querySelector('.canvas-wrapper');
        const rect = wrapper.getBoundingClientRect();
        this.offsetX = (rect.width - 600) / 2;
        this.offsetY = (rect.height - 200) / 2;
        this.textStage = new createjs.Stage(this.shadowRoot.getElementById('text'));
        this.textStage.canvas.width = 600;
        this.textStage.canvas.height = 200;
        this.stage = new createjs.Stage(this.shadowRoot.getElementById('stage'));
        this.stage.canvas.width = rect.width;
        this.stage.canvas.height = rect.height;
    }

    initForm() {
        this.input = this.shadowRoot.getElementById('inputText');
    }

    initText() {
        this.text = new createjs.Text("t", "80px 'Source Sans Pro'", "#eee");
        this.text.textAlign = 'center';
        this.text.x = 300;
    }

    initCircles() {
        this.circles = [];
        const wrapper = this.shadowRoot.querySelector('.canvas-wrapper');
        const rect = wrapper.getBoundingClientRect();
        for (let i = 0; i < 600; i++) {
            const circle = new createjs.Shape();
            const r = 7;
            const x = rect.width * Math.random();
            const y = rect.height * Math.random();
            const color = this.colors[Math.floor(i % this.colors.length)];
            const alpha = 0.2 + Math.random() * 0.5;
            circle.alpha = alpha;
            circle.radius = r;
            circle.graphics.beginFill(color).drawCircle(0, 0, r);
            circle.x = x;
            circle.y = y;
            this.circles.push(circle);
            this.stage.addChild(circle);
            circle.movement = 'float';
            this.tweenCircle(circle);
        }
    }

    animate() {
        this.stage.update();
        requestAnimationFrame(() => this.animate());
    }

    tweenCircle(c, dir) {
        if (c.tween) c.tween.kill();
        const wrapper = this.shadowRoot.querySelector('.canvas-wrapper');
        const rect = wrapper.getBoundingClientRect();
        if (dir === 'in') {
            c.tween = TweenLite.to(c, 0.4, {
                x: c.originX, y: c.originY,
                ease: Quad.easeInOut, alpha: 1, radius: 5,
                scaleX: 0.4, scaleY: 0.4,
                onComplete: () => {
                    c.movement = 'jiggle';
                    this.tweenCircle(c);
                }
            });
        } else if (dir === 'out') {
            c.tween = TweenLite.to(c, 0.8, {
                x: rect.width * Math.random(), y: rect.height * Math.random(),
                ease: Quad.easeInOut, alpha: 0.2 + Math.random() * 0.5,
                scaleX: 1, scaleY: 1,
                onComplete: () => {
                    c.movement = 'float';
                    this.tweenCircle(c);
                }
            });
        } else {
            if (c.movement === 'float') {
                c.tween = TweenLite.to(c, 5 + Math.random() * 3.5, {
                    x: c.x + (-100 + Math.random() * 200),
                    y: c.y + (-100 + Math.random() * 200),
                    ease: Quad.easeInOut, alpha: 0.2 + Math.random() * 0.5,
                    onComplete: () => this.tweenCircle(c)
                });
            } else {
                c.tween = TweenLite.to(c, 0.05, {
                    x: c.originX + Math.random() * 3,
                    y: c.originY + Math.random() * 3,
                    ease: Quad.easeInOut,
                    onComplete: () => this.tweenCircle(c)
                });
            }
        }
    }

    formText() {
        for (let i = 0, l = this.textPixels.length; i < l; i++) {
            this.circles[i].originX = this.offsetX + this.textPixels[i].x;
            this.circles[i].originY = this.offsetY + this.textPixels[i].y;
            this.tweenCircle(this.circles[i], 'in');
        }
        this.textFormed = true;
        if (this.textPixels.length < this.circles.length) {
            for (let j = this.textPixels.length; j < this.circles.length; j++) {
                this.circles[j].tween = TweenLite.to(this.circles[j], 0.4, { alpha: 0.1 });
            }
        }
    }

    explode() {
        for (let i = 0, l = this.textPixels.length; i < l; i++) {
            this.tweenCircle(this.circles[i], 'out');
        }
        if (this.textPixels.length < this.circles.length) {
            for (let j = this.textPixels.length; j < this.circles.length; j++) {
                this.circles[j].tween = TweenLite.to(this.circles[j], 0.4, { alpha: 1 });
            }
        }
    }

    addListeners() {
        const submitBtn = this.shadowRoot.querySelector('input[type="submit"]');
        submitBtn.addEventListener('click', (e) => {
            e.preventDefault();
            this.handleSubmit();
        });
        this.input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.handleSubmit();
            }
        });
    }

    handleSubmit() {
        if (this.textFormed) {
            this.explode();
            if (this.input.value !== '') {
                setTimeout(() => this.createText(this.input.value.toUpperCase()), 810);
            } else {
                this.textFormed = false;
            }
        } else {
            this.createText(this.input.value.toUpperCase());
        }
    }

    createText(t) {
        const fontSize = Math.min(860 / (t.length), 160);
        this.text.text = t;
        this.text.font = "900 " + fontSize + "px 'Source Sans Pro'";
        this.text.textAlign = 'center';
        this.text.x = 300;
        this.text.y = (172 - fontSize) / 2;
        this.textStage.addChild(this.text);
        this.textStage.update();
        const ctx = this.shadowRoot.getElementById('text').getContext('2d');
        const pix = ctx.getImageData(0, 0, 600, 200).data;
        this.textPixels = [];
        for (let i = pix.length; i >= 0; i -= 4) {
            if (pix[i] !== 0) {
                const x = (i / 4) % 600;
                const y = Math.floor(Math.floor(i / 600) / 4);
                if ((x && x % 8 === 0) && (y && y % 8 === 0)) {
                    this.textPixels.push({ x: x, y: y });
                }
            }
        }
        this.formText();
    }
}

customElements.define('particle-search', ParticleSearch);
//依赖引入（在 HTML 中使用前需要加载）：
//HTML
//<script src="https://cdnjs.cloudflare.com/ajax/libs/EaselJS/1.0.2/easeljs.min.js"></script>
//<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/2.1.3/TweenLite.min.js"></script>
//<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/2.1.3/plugins/CSSPlugin.min.js"></script>
//<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/2.1.3/easing/EasePack.min.js"></script>
//<link href="https://fonts.googleapis.com/css2?family=Source+Sans+Pro:wght@900&display=swap" rel="stylesheet"></link>