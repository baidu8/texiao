(function() {
    // 1. 动态注入 CSS 样式
    const style = document.createElement('style');
    style.innerHTML = `
        .js-emoji-particle {
            position: fixed;
            pointer-events: none;
            user-select: none;
            z-index: 10000;
            animation: emojiFadeUp 2s ease-out forwards;
        }

        #js-big-emoji-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            display: none;
            justify-content: center;
            align-items: center;
            font-size: 60vw;
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(5px); /* 增加一点模糊感 */
            z-index: 20000;
            cursor: pointer;
            user-select: none;
        }

        @keyframes emojiFadeUp {
            0% { transform: translateY(0) scale(0.5); opacity: 0; }
            20% { opacity: 1; }
            100% { transform: translateY(-120px) scale(1.8); opacity: 0; }
        }
    `;
    document.head.appendChild(style);

    // 2. Emoji 资源库（手势 + 表情）
    function getRandomEmoji() {
        const ranges = [
            [0x1F600, 0x1F64F], // 表情 (Smiling faces, etc.)
            [0x1F910, 0x1F930], // 手势与新表情 (Thinking, hugging, etc.)
            [0x270A, 0x270D],   // 经典手势 (Fist, victory, etc.)
            [0x1F590, 0x1F596], // 更多手势
            [0x1F446, 0x1F450]  // 指向手势
        ];
        const range = ranges[Math.floor(Math.random() * ranges.length)];
        const codePoint = Math.floor(Math.random() * (range[1] - range[0] + 1)) + range[0];
        return String.fromCodePoint(codePoint);
    }

    // 3. 创建飘落的小 Emoji
    function spawnEmoji() {
        const el = document.createElement('div');
        el.className = 'js-emoji-particle';
        el.innerText = getRandomEmoji();
        el.style.left = Math.random() * 95 + 'vw';
        el.style.top = Math.random() * 95 + 'vh';
        el.style.fontSize = (Math.random() * 24 + 16) + 'px';
        document.body.appendChild(el);
        setTimeout(() => el.remove(), 2000);
    }

    // 持续生成
    setInterval(spawnEmoji, 400);

    // 4. 全屏大 Emoji 逻辑
    const overlay = document.createElement('div');
    overlay.id = 'js-big-emoji-overlay';
    document.body.appendChild(overlay);

    let idleTimer;
    const IDLE_THRESHOLD = 10000; // 10秒不动触发

    function showBigEmoji() {
        overlay.innerText = getRandomEmoji();
        overlay.style.display = 'flex';
    }

    function resetTimer() {
        if (overlay.style.display === 'flex') {
            overlay.style.display = 'none';
        }
        clearTimeout(idleTimer);
        idleTimer = setTimeout(showBigEmoji, IDLE_THRESHOLD);
    }

    // 监听交互：点击、移动、滚轮、按键
    ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'].forEach(type => {
        window.addEventListener(type, resetTimer, { passive: true });
    });

    // 初始化
    resetTimer();
})();