(function() {
    /**
     * 【1. 图片素材配置】
     * 建议使用 64x64 或 128x128 的透明 PNG
     */
    const assets = {
        spring: 'img/樱花.png', // 樱花瓣
        summer: 'img/绿叶.png', // 绿叶
        autumn: 'img/枫叶.png', // 枫叶
        winter: 'img/雪花.png'  // 雪花
    };

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    // pointer-events:none 保证点击穿透，不影响网页操作
    canvas.style.cssText = 'position:fixed;top:0;left:0;pointer-events:none;z-index:999999;';
    document.body.appendChild(canvas);

    let width, height, particles = [];
    let currentSeason = ''; 
    let imgObj = new Image();

    /**
     * 【2. 切换季节与密度控制】
     */
    function setSeason(s) {
        if (!assets[s]) return;
        currentSeason = s;
        const newImg = new Image();
        newImg.src = assets[s];
        newImg.onload = () => {
            imgObj = newImg;
            particles = [];
            
            // --- 调节密度 ---
            // 这里的数字就是屏幕上同时出现的粒子数量
            const counts = { 
                spring: 50,  // 樱花建议中等密度
                summer: 30,  // 绿叶建议稀疏一点，显得清爽
                autumn: 60,  // 枫叶建议多一点，有凋零感
                winter: 80  // 雪花建议多一些，营造氛围
            };
            
            for (let i = 0; i < (counts[s] || 50); i++) {
                particles.push(new Particle(true));
            }
            console.log(`当前效果：${s} (按1-4切换)`);
        };
    }

    // 键盘监听逻辑
    window.addEventListener('keydown', (e) => {
        const keyMap = { '1': 'spring', '2': 'summer', '3': 'autumn', '4': 'winter' };
        if (keyMap[e.key]) setSeason(keyMap[e.key]);
    });

    function resize() {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resize);
    resize();

    /**
     * 【3. 粒子物理类】
     * 这里决定了每一个物体的“性格”
     */
    class Particle {
        constructor(randomY = false) {
            this.reset(randomY);
        }

        reset(randomY = false) {
            // --- 调节大小 ---
            // Math.random() * 范围 + 基础大小
            this.size = Math.random() * 15 + 15; 
            
            this.x = Math.random() * width;
            this.y = randomY ? Math.random() * height : -50;
            
            this.phi = Math.random() * Math.PI * 2; 
            this.period = Math.random() * 100 + 100; // 波动周期（值越大摆动越慢）
            
            /**
             * --- 核心参数调节面板 ---
             * velY: 垂直速度（越大掉得越快）
             * velX: 水平速度（正数向右吹，负数向左吹）
             * spinSpeed: 旋转速度（值越大转得越快）
             */
            switch(currentSeason) {
                case 'spring':
                    this.velY = Math.random() * 0.8 + 0.5; // 樱花较轻，慢速下落
                    this.velX = Math.random() * 1.2 + 0.8; // 春风较大，向右偏移
                    this.spinSpeed = Math.random() * 0.05 + 0.02;
                    break;
                case 'summer':
                    this.velY = Math.random() * 0.4 + 0.3; // 绿叶极慢，像在漂浮
                    this.velX = Math.random() * 0.4 - 0.2; // 几乎没风，随机微动
                    this.spinSpeed = 0.01; 
                    break;
                case 'autumn':
                    this.velY = Math.random() * 0.8 + 0.6; // 枫叶重，下落快
                    this.velX = Math.random() * 0.8 - 0.2; // 受风影响
                    this.spinSpeed = Math.random() * 0.04 + 0.02; // 枫叶旋转剧烈
                    break;
                case 'winter':
                    this.velY = Math.random() * 1.0 + 0.8; // 雪花匀速
                    this.velX = 0; // 雪花通常垂直，不设置横向风
                    this.spinSpeed = Math.random() * 0.02;
                    break;
            }
            this.angle = Math.random() * Math.PI * 2;
            this.opacity = Math.random() * 0.6 + 0.4;
        }

        update(tick) {
            const time = tick / this.period;

            /**
             * --- 轨迹算法调节 ---
             */
            switch(currentSeason) {
                case 'spring':
                    // 樱花：y轴带一点正弦波动，x轴加速滑动
                    this.y += this.velY + Math.sin(time * 1.5) * 0.5;
                    this.x += this.velX; 
                    this.angle += this.spinSpeed;
                    break;

                case 'summer':
                    // 绿叶：s型平滑轨迹，angle随波摆动（不转圈）
                    this.y += this.velY;
                    this.x += Math.sin(time * 0.5) * 1.5; // 左右晃动幅度
                    this.angle = Math.sin(time * 0.5) * 0.5; // 摆动角度限制
                    break;

                case 'autumn':
                    // 枫叶：利用abs函数制造出“一跳一跳”的阻力感
                    this.y += this.velY + Math.abs(Math.cos(time * 4)) * 1.0;
                    this.x += this.velX + Math.sin(time * 2) * 2;
                    this.angle = Math.sin(tick * this.spinSpeed) * 0.4;  // 只晃不转
                    break;

                case 'winter':
                    // 雪花：最纯净的线性下落
                    this.y += this.velY;
                    this.x += Math.sin(time) * 0.3; // 极小的空气浮动
                    this.angle += this.spinSpeed;
                    break;
            }

            // --- 边界检查 ---
            // 如果粒子出了屏幕，就重置到顶部
            if (this.y > height + 50 || this.x > width + 50 || this.x < -50) {
                this.reset(false);
            }
        }

        draw() {
            if (!imgObj.complete || !currentSeason) return;
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.angle);
            ctx.globalAlpha = this.opacity;
            
            // 冬天额外开启远近感（越透明的雪花越小）
            let displaySize = this.size;
            if (currentSeason === 'winter') {
                displaySize *= (this.opacity + 0.5); 
            }

            ctx.drawImage(imgObj, -displaySize/2, -displaySize/2, displaySize, displaySize);
            ctx.restore();
        }
    }

    /**
     * 【4. 动画驱动】
     */
    let tick = 0;
    function animate() {
        tick++;
        ctx.clearRect(0, 0, width, height);
        particles.forEach(p => {
            p.update(tick);
            p.draw();
        });
        requestAnimationFrame(animate);
    }

    // 启动逻辑
    const m = new Date().getMonth();
    const startS = (m >= 2 && m <= 4) ? 'spring' : (m >= 5 && m <= 7) ? 'summer' : (m >= 8 && m <= 10) ? 'autumn' : 'winter';
    setSeason(startS);
    animate();

})();