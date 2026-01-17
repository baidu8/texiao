(function() {
    /**
     * 【1. 素材路径配置】
     */
    const assets = {
        spring: 'img/樱花.png',
        summer: 'img/绿叶.png',
        autumn: 'img/枫叶.png',
        winter: 'img/雪花.png',
        cloud:  'img/云.png' 
    };
    
    // 已经填入你提供的 KEY
    const WEATHER_KEY = '819617e9cbcc4cbf885a965f4da169ff'; 

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.style.cssText = 'position:fixed;top:0;left:0;pointer-events:none;z-index:999999;';
    document.body.appendChild(canvas);

    let width, height, particles = [], splashes = [];
    let currentSeason = 'spring', currentWeather = 'clear'; 
    
    /**
     * 【新功能：自动季节判断】
     * 3-5月 春 | 6-8月 夏 | 9-11月 秋 | 12-2月 冬
     */
    function autoGetSeason() {
        const month = new Date().getMonth() + 1; 
        if (month >= 3 && month <= 5) return 'spring';
        if (month >= 6 && month <= 8) return 'summer';
        if (month >= 9 && month <= 11) return 'autumn';
        return 'winter';
    }

    // 图片加载池
    const imgPool = {};
    Object.keys(assets).forEach(key => {
        imgPool[key] = new Image();
        imgPool[key].src = assets[key];
    });

    // 快捷键映射
    const weatherMap = { 'q': 'clear', 'w': 'rain', 'e': 'windy', 'r': 'cloudy' };
    const seasonMap = { '1': 'spring', '2': 'summer', '3': 'autumn', '4': 'winter' };

    window.addEventListener('keydown', (e) => {
        const key = e.key.toLowerCase();
        if (seasonMap[key]) { currentSeason = seasonMap[key]; refreshParticles(); }
        else if (weatherMap[key]) { currentWeather = weatherMap[key]; refreshParticles(); }
    });

    async function syncWeather() {
        if (WEATHER_KEY === '你的API_KEY' || !WEATHER_KEY) return;
        try {
            const ipRes = await fetch('https://ipapi.co/json/');
            const ipData = await ipRes.json();
            const loc = `${ipData.longitude},${ipData.latitude}`;
            // 注意：此处使用了你提供的和风天气 API 地址
            const res = await fetch(`https://kr2x884ghf.re.qweatherapi.com/v7/weather/now?location=${loc}&key=${WEATHER_KEY}`);
            const data = await res.json();
            if (data.code === '200') {
                const text = data.now.text;
                if (text.includes('雨')) currentWeather = 'rain';
                else if (text.includes('风')) currentWeather = 'windy';
                else if (text.includes('阴') || text.includes('云') || text.includes('霾')) currentWeather = 'cloudy';
                else currentWeather = 'clear';
                refreshParticles();
            }
        } catch (e) { console.error("天气同步失败"); }
    }

    function refreshParticles() {
        particles = [];
        const countMap = { 
            clear: 60,   
            rain: 100,   
            windy: 80,   
            cloudy: 5    
        };
        let count = countMap[currentWeather] || 50;
        for (let i = 0; i < count; i++) particles.push(new Particle(true));
    }

    function resize() {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resize);
    resize();

    class Splash {
        constructor(x, y) {
            this.x = x; this.y = y;
            this.vx = (Math.random() - 0.5) * 4;
            this.vy = -Math.random() * 3 - 2;
            this.gravity = 0.25;
            this.life = 1.0;
        }
        update() { 
            this.x += this.vx; this.y += this.vy; 
            this.vy += this.gravity; 
            this.life -= 0.04;
        }
        draw() {
            ctx.fillStyle = `rgba(100, 130, 160, ${this.life})`;
            ctx.beginPath(); ctx.arc(this.x, this.y, 1.5, 0, Math.PI * 2); ctx.fill();
        }
    }

    class Particle {
        constructor(randomY = false) { this.reset(randomY); }

        reset(randomY = false) {
            this.opacity = Math.random() * 0.5 + 0.3;
            this.angle = Math.random() * Math.PI * 2;
            
            if (currentWeather === 'cloudy') {
                this.x = randomY ? Math.random() * width : -300;
                this.y = Math.random() * height * 0.4;
                this.size = Math.random() * 80 + 130;
                this.velX = Math.random() * 0.3 + 0.2;
                this.velY = 0;
            } else if (currentWeather === 'windy') {
                this.x = randomY ? Math.random() * width : -200;
                this.y = Math.random() * height;
                this.velX = Math.random() * 15 + 15;
                this.velY = (Math.random() - 0.5) * 2;
                this.len = Math.random() * 150 + 100;
            } else if (currentWeather === 'rain') {
                this.x = Math.random() * width;
                this.y = randomY ? Math.random() * height : -100;
                this.velY = Math.random() * 5 + 10;
                this.velX = 0;
            } else {
                this.x = Math.random() * width;
                this.y = randomY ? Math.random() * height : -100;
                this.size = Math.random() * 15 + 15;
                const s = currentSeason;
                this.velY = s === 'summer' ? 0.4 : (s === 'autumn' ? 1.0 : 0.7);
                this.velX = (Math.random() - 0.5) * 0.5 + (s === 'spring' ? 0.8 : 0);
                this.spinSpeed = s === 'autumn' ? 0.05 : 0.02;
            }
        }

        update(tick) {
            if (currentWeather === 'rain') {
                this.y += this.velY;
                if (this.y >= height - 5) {
                    for(let i=0; i<3; i++) splashes.push(new Splash(this.x, height - 2));
                    this.reset(false);
                }
            } else {
                this.x += (this.velX || 0);
                this.y += (this.velY || 0);
                this.angle += (this.spinSpeed || 0);
                if(currentWeather === 'clear') this.x += Math.sin(tick / 50) * 0.5;
            }
            let limit = (currentWeather === 'cloudy') ? width + 500 : width + 200;
            if (this.x > limit || this.y > height + 200 || this.y < -300) this.reset(false);
        }

        draw() {
            ctx.save();
            ctx.globalAlpha = this.opacity;
            if (currentWeather === 'rain') {
                ctx.strokeStyle = `rgba(80, 110, 150, ${this.opacity})`;
                ctx.lineWidth = 2;
                ctx.beginPath(); ctx.moveTo(this.x, this.y); ctx.lineTo(this.x, this.y + 20); ctx.stroke();
            } else if (currentWeather === 'windy') {
                ctx.strokeStyle = `rgba(180, 180, 180, 0.4)`;
                ctx.lineWidth = 1;
                ctx.beginPath(); ctx.moveTo(this.x, this.y); ctx.lineTo(this.x - this.len, this.y); ctx.stroke();
            } else if (currentWeather === 'cloudy') {
                const img = imgPool['cloud'];
                if (img.complete && img.naturalWidth > 0) {
                    ctx.drawImage(img, this.x, this.y, this.size, this.size * 0.6);
                } else {
                    ctx.fillStyle = 'rgba(200, 220, 240, 0.15)';
                    ctx.beginPath(); ctx.arc(this.x, this.y, 40, 0, Math.PI*2); ctx.fill();
                }
            } else {
                const img = imgPool[currentSeason];
                if (img.complete && img.naturalWidth > 0) {
                    ctx.translate(this.x, this.y);
                    ctx.rotate(this.angle);
                    ctx.drawImage(img, -this.size/2, -this.size/2, this.size, this.size);
                }
            }
            ctx.restore();
        }
    }

    function animate(tick) {
        ctx.clearRect(0, 0, width, height);
        particles.forEach(p => { p.update(tick); p.draw(); });
        splashes = splashes.filter(s => s.life > 0);
        splashes.forEach(s => { s.update(); s.draw(); });
        requestAnimationFrame(() => animate(tick + 1));
    }

    /**
     * 【启动区】
     */
    syncWeather();                   // 随后联网尝试同步当前天气
    currentSeason = autoGetSeason(); // 启动时立刻根据月份判断季节
    refreshParticles();              // 根据自动判断的季节生成第一批粒子
    animate(0);                      // 开启循环动画
})();