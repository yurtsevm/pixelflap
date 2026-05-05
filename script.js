const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const scoreDisplay = document.getElementById('score-display');
const finalScoreDisplay = document.getElementById('final-score');
const highScoreDisplay = document.getElementById('high-score');
const storeBtn = document.getElementById('store-btn');
const storeScreen = document.getElementById('store-screen');
const closeStoreBtn = document.getElementById('close-store-btn');
const skinsContainer = document.getElementById('skins-container');

// Oyun Değişkenleri
let frames = 0;
let gameState = 'start'; // start, play, over
let score = 0;
let highScore = localStorage.getItem('pixelFlapHighScore') || 0;

// Renk Paleti (Pixel Style)
const colors = {
    background: '#7bc8cc',
    bird: '#ffc107',
    birdOutline: '#000000',
    birdBeak: '#e53935',
    pipe: '#558b2f',
    pipeOutline: '#000000'
};

// Mağaza ve Kuş Tipleri
const skins = [
    { id: 0, name: 'Sarı', color: '#ffc107', beak: '#e53935' },
    { id: 1, name: 'Kırmızı', color: '#f44336', beak: '#ffeb3b' },
    { id: 2, name: 'Mavi', color: '#29b6f6', beak: '#ff9800' },
    { id: 3, name: 'Yeşil', color: '#66bb6a', beak: '#ff5722' },
    { id: 4, name: 'Siyah', color: '#424242', beak: '#ffeb3b' },
    { id: 5, name: 'Pembe', color: '#e91e63', beak: '#ffeb3b' }
];
let currentSkinId = parseInt(localStorage.getItem('pixelFlapSkin')) || 0;

function updateBirdColors() {
    let skin = skins.find(s => s.id === currentSkinId) || skins[0];
    colors.bird = skin.color;
    colors.birdBeak = skin.beak;
}
updateBirdColors();

// Bulutlar (Arkaplan Süslemesi)
const clouds = [
    {x: 50, y: 80, w: 70, h: 25},
    {x: 250, y: 130, w: 90, h: 30},
    {x: 120, y: 280, w: 60, h: 20},
    {x: 340, y: 60, w: 80, h: 25}
];

// Hava Durumu Sistemi
let currentWeather = 'normal';
let weatherParticles = [];

function generateWeather() {
    let rand = Math.random();
    if (rand < 0.10) {
        currentWeather = 'snow';
    } else if (rand < 0.40) {
        currentWeather = 'rain';
    } else if (rand < 0.70) {
        currentWeather = 'sunny';
    } else {
        currentWeather = 'normal';
    }
    
    weatherParticles = [];
    
    if (currentWeather === 'rain') {
        for(let i=0; i<30; i++) {
            weatherParticles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                speed: Math.random() * 5 + 8,
                length: Math.random() * 10 + 10
            });
        }
    } else if (currentWeather === 'snow') {
        for(let i=0; i<50; i++) {
            weatherParticles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                radius: Math.random() * 2 + 1,
                speed: Math.random() * 1.5 + 0.5,
                drift: Math.random() * 1 - 0.5
            });
        }
    }
}

// Kuş Objesi
const bird = {
    x: 100,
    y: 250,
    radius: 14, // Aslında karenin yarısı gibi (28x28 boyut)
    velocity: 0,
    gravity: 0.15,
    jump: -4.5,
    rotation: 0,
    lastFlapTime: 0,
    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        
        // Dönüş efekti
        this.rotation = Math.min(Math.PI / 4, Math.max(-Math.PI / 4, (this.velocity * 0.12)));
        ctx.rotate(this.rotation);

        // Kuşun Gövdesi (Hafif yuvarlatılmış kare)
        ctx.fillStyle = colors.bird;
        ctx.beginPath();
        ctx.roundRect(-this.radius, -this.radius, this.radius * 2, this.radius * 2, 5); // 5 piksel yuvarlaklık
        ctx.fill();
        ctx.lineWidth = 3;
        ctx.strokeStyle = colors.birdOutline;
        ctx.stroke();

        // Göz (Beyaz Kare)
        ctx.fillStyle = 'white';
        ctx.fillRect(this.radius - 12, -this.radius + 4, 10, 10);
        ctx.strokeRect(this.radius - 12, -this.radius + 4, 10, 10);
        
        // Göz Bebeği (Siyah Kare)
        ctx.fillStyle = 'black';
        ctx.fillRect(this.radius - 8, -this.radius + 8, 4, 4);

        // Gaga (Kırmızı Dikdörtgen)
        ctx.fillStyle = colors.birdBeak;
        ctx.fillRect(this.radius, 0, 12, 8);
        ctx.strokeRect(this.radius, 0, 12, 8);
        
        ctx.restore();
    },
    update() {
        let currentGravity = this.gravity;
        // Kuş tepe noktasındayken (hızı sıfıra yakınken) yerçekimini geçici olarak azalt
        // Böylece düşmeye başlamadan önce havada biraz daha asılı kalır
        if (this.velocity > -1.5 && this.velocity < 2) {
            currentGravity = this.gravity * 0.4;
        }
        
        this.velocity += currentGravity;
        if (this.velocity > 6) this.velocity = 6;
        this.y += this.velocity;
        
        // Yere Çarpma Kontrolü (Canvas'ın en altı)
        if (this.y + this.radius >= canvas.height) {
            this.y = canvas.height - this.radius;
            gameOver();
        }
        
        // Tavana Çarpma Kontrolü
        if (this.y - this.radius <= 0) {
            this.y = this.radius;
            this.velocity = 0;
        }
    },
    flap() {
        const now = Date.now();
        const timeSinceLastFlap = now - this.lastFlapTime;
        
        if (timeSinceLastFlap < 350 && this.velocity < 0) {
            this.velocity = Math.max(this.velocity + (this.jump * 0.6), this.jump * 1.8);
        } else {
            this.velocity = this.jump;
        }
        
        this.lastFlapTime = now;
    }
};

// Borular Objesi
const pipes = {
    items: [],
    width: 60,
    gap: 200,
    baseDx: 1.5,
    pipeDistance: 330,
    framesSinceLastPipe: 0,
    draw() {
        for (let i = 0; i < this.items.length; i++) {
            let p = this.items[i];
            
            ctx.fillStyle = colors.pipe;
            ctx.strokeStyle = colors.pipeOutline;
            ctx.lineWidth = 4;
            
            // Üst boru gövdesi
            ctx.fillRect(p.x, 0, this.width, p.top);
            ctx.strokeRect(p.x, 0, this.width, p.top);
            
            // Alt boru gövdesi
            ctx.fillRect(p.x, canvas.height - p.bottom, this.width, p.bottom);
            ctx.strokeRect(p.x, canvas.height - p.bottom, this.width, p.bottom);

            // Üst boru başlığı
            ctx.fillRect(p.x - 6, p.top - 24, this.width + 12, 24);
            ctx.strokeRect(p.x - 6, p.top - 24, this.width + 12, 24);
            
            // Alt boru başlığı
            ctx.fillRect(p.x - 6, canvas.height - p.bottom, this.width + 12, 24);
            ctx.strokeRect(p.x - 6, canvas.height - p.bottom, this.width + 12, 24);
        }
    },
    update() {
        let currentDx = this.baseDx;
        if (score > 5) {
            currentDx += (score - 5) * 0.08;
            currentDx = Math.min(currentDx, 4);
        }

        let requiredFrames = Math.floor(this.pipeDistance / currentDx);
        this.framesSinceLastPipe++;

        if (this.framesSinceLastPipe >= requiredFrames) {
            let topPosition = Math.random() * (canvas.height - this.gap - 100) + 50;
            let bottomPosition = canvas.height - this.gap - topPosition;
            this.items.push({
                x: canvas.width,
                top: topPosition,
                bottom: bottomPosition,
                passed: false
            });
            this.framesSinceLastPipe = 0;
        }
        
        for (let i = 0; i < this.items.length; i++) {
            let p = this.items[i];
            p.x -= currentDx;
            
            // Kare Çarpışma Tespiti
            let birdLeft = bird.x - bird.radius;
            let birdRight = bird.x + bird.radius; // Gagayı çarpışma hesabından çıkardık (sadece gövde)
            let birdTop = bird.y - bird.radius;
            let birdBottom = bird.y + bird.radius;

            let pipeLeft = p.x - 6;
            let pipeRight = p.x + this.width + 6;

            if (birdRight > pipeLeft && birdLeft < pipeRight) {
                if (birdTop < p.top || birdBottom > canvas.height - p.bottom) {
                    gameOver();
                }
            }
            
            if (p.x + this.width < bird.x && !p.passed) {
                score++;
                scoreDisplay.innerText = score;
                p.passed = true;
            }
            
            if (p.x + this.width + 12 < 0) {
                this.items.shift();
                i--;
            }
        }
    },
    reset() {
        this.items = [];
        this.framesSinceLastPipe = Math.floor(this.pipeDistance / this.baseDx);
    }
};

function drawBackground() {
    // Hava durumuna göre arkaplan rengi
    if (currentWeather === 'rain') {
        ctx.fillStyle = '#6ab1b5'; // Kapalı hava
    } else if (currentWeather === 'snow') {
        ctx.fillStyle = '#8dcdd1'; // Soğuk hava
    } else {
        ctx.fillStyle = colors.background;
    }
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (currentWeather === 'sunny') {
        // Güneş
        ctx.fillStyle = 'rgba(255, 235, 59, 0.4)';
        ctx.beginPath();
        ctx.arc(150, 150, 40, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(255, 235, 59, 0.2)';
        ctx.beginPath();
        ctx.arc(150, 150, 60, 0, Math.PI * 2);
        ctx.fill();
    }

    // Bulutları Çiz
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    clouds.forEach(cloud => {
        cloud.x -= (currentWeather === 'rain' ? 0.6 : 0.3); // Yağmurlu havada bulutlar daha hızlı
        if (cloud.x + cloud.w < 0) {
            cloud.x = canvas.width + 50;
            cloud.y = Math.random() * (canvas.height / 2);
        }
        ctx.beginPath();
        ctx.roundRect(cloud.x, cloud.y, cloud.w, cloud.h, cloud.h / 2);
        ctx.fill();
    });
    
    // Hava Durumu Efektleri (Yağmur ve Kar Parçacıkları)
    if (currentWeather === 'rain') {
        ctx.strokeStyle = 'rgba(200, 220, 255, 0.5)';
        ctx.lineWidth = 1.5;
        weatherParticles.forEach(p => {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p.x - p.speed * 0.2, p.y + p.length);
            ctx.stroke();
            
            if (gameState === 'play') {
                p.y += p.speed;
                p.x -= p.speed * 0.2;
                if (p.y > canvas.height) {
                    p.y = -20;
                    p.x = Math.random() * canvas.width + 100;
                }
            }
        });
    } else if (currentWeather === 'snow') {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        weatherParticles.forEach(p => {
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fill();
            
            if (gameState === 'play') {
                p.y += p.speed;
                p.x += Math.sin(frames * 0.05 + p.y) * p.drift;
                if (p.y > canvas.height) {
                    p.y = -10;
                    p.x = Math.random() * canvas.width;
                }
            }
        });
    }
}

function draw() {
    drawBackground();
    bird.draw();
    pipes.draw();
}

function update() {
    if (gameState !== 'play') return;
    bird.update();
    pipes.update();
}

let lastTime = 0;
let accumulator = 0;
// Oyun hızını cihazın yenileme hızından bağımsız hale getirmek için sabit zaman adımı (200 FPS'e sabitlendi)
const TIME_STEP = 1000 / 200;

function loop(timestamp) {
    if (!lastTime) lastTime = timestamp;
    let dt = timestamp - lastTime;
    
    // Sekme arka planda kaldığında devasa atlamaları engelle
    if (dt > 100) dt = 100;
    
    lastTime = timestamp;
    accumulator += dt;

    while (accumulator >= TIME_STEP) {
        update();
        frames++;
        accumulator -= TIME_STEP;
    }
    
    draw();
    
    if (gameState === 'play') {
        requestAnimationFrame(loop);
    }
}

function startGame() {
    generateWeather();
    gameState = 'play';
    bird.y = 250;
    bird.velocity = 0;
    bird.rotation = 0;
    pipes.reset();
    score = 0;
    frames = 0;
    scoreDisplay.innerText = score;
    
    startScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    
    bird.flap();
    lastTime = 0;
    accumulator = 0;
    requestAnimationFrame(loop);
}

function gameOver() {
    gameState = 'over';
    finalScoreDisplay.innerText = score;
    
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('pixelFlapHighScore', highScore);
    }
    highScoreDisplay.innerText = highScore;
    
    gameOverScreen.classList.remove('hidden');
}

// Kontroller
function handleInput(e) {
    if (e.type === 'keydown' && e.code !== 'Space') return;
    
    if (e.type === 'keydown' && e.code === 'Space') {
        e.preventDefault();
    }
    
    // Mağaza açıksa oyunu başlatma
    if (!storeScreen.classList.contains('hidden')) return;

    if (gameState === 'start' || gameState === 'over') {
        startGame();
    } else if (gameState === 'play') {
        bird.flap();
    }
}

window.addEventListener('keydown', handleInput);
window.addEventListener('mousedown', handleInput);
window.addEventListener('touchstart', handleInput, {passive: false});

// Mağaza İşlemleri
function renderStore() {
    skinsContainer.innerHTML = '';
    skins.forEach(skin => {
        let item = document.createElement('div');
        item.className = 'skin-item' + (skin.id === currentSkinId ? ' selected' : '');
        item.onclick = (e) => {
            e.stopPropagation();
            currentSkinId = skin.id;
            localStorage.setItem('pixelFlapSkin', currentSkinId);
            updateBirdColors();
            renderStore();
            draw(); // Ekranı güncelle
        };
        let preview = document.createElement('div');
        preview.className = 'skin-preview';
        preview.style.backgroundColor = skin.color;
        item.appendChild(preview);
        skinsContainer.appendChild(item);
    });
}

storeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (gameState === 'start' || gameState === 'over') {
        storeScreen.classList.remove('hidden');
        renderStore();
    }
});

closeStoreBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    storeScreen.classList.add('hidden');
});

storeScreen.addEventListener('mousedown', e => e.stopPropagation());
storeScreen.addEventListener('touchstart', e => e.stopPropagation());

// Fontun yüklenmesini bekle ve ilk kareyi çiz
document.fonts.ready.then(() => {
    draw();
});
