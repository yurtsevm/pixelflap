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
let gameOverTime = 0;
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
    { id: 0, name: 'Sarı', type: 'color', color: '#ffc107', beak: '#e53935' },
    { id: 1, name: 'Kırmızı', type: 'color', color: '#f44336', beak: '#ffeb3b' },
    { id: 2, name: 'Mavi', type: 'color', color: '#29b6f6', beak: '#ff9800' },
    { id: 3, name: 'Yeşil', type: 'color', color: '#66bb6a', beak: '#ff5722' },
    { id: 4, name: 'Siyah', type: 'color', color: '#424242', beak: '#ffeb3b' },
    { id: 5, name: 'Pembe', type: 'color', color: '#e91e63', beak: '#ffeb3b' },
    { id: 6, name: 'Aslan', type: 'color', color: '#fb8c00', beak: '#8d6e63' },
    { id: 7, name: 'Kanarya', type: 'color', color: '#ffee58', beak: '#f57c00' },
    { id: 8, name: 'Kaplan', type: 'color', color: '#800000', beak: '#212121' },
    { id: 9, name: 'Kartal', type: 'color', color: '#4e342e', beak: '#fdd835' },
    { id: 10, name: 'Timsah', type: 'color', color: '#388e3c', beak: '#81c784' }
];

// Resimleri önyükle
skins.forEach(skin => {
    if (skin.type === 'image') {
        skin.img = new Image();
        skin.img.src = skin.src;
    }
});

let currentSkinId = parseInt(localStorage.getItem('pixelFlapSkin')) || 0;
let currentSkin = skins[0];

function updateBirdSkin() {
    currentSkin = skins.find(s => s.id === currentSkinId) || skins[0];
    if (currentSkin.type === 'color') {
        colors.bird = currentSkin.color;
        colors.birdBeak = currentSkin.beak;
    }
}
updateBirdSkin();

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
// Skin Çizim Yardımcı Fonksiyonu
function drawSkinOnCtx(ctx, skin, radius) {
    let baseColor = skin.type === 'color' ? skin.color : colors.bird;
    let beakColor = skin.type === 'color' ? skin.beak : colors.birdBeak;

    if (skin.type === 'image' && skin.img && skin.img.complete) {
        ctx.drawImage(skin.img, -radius * 1.5, -radius * 1.5, radius * 3, radius * 3);
    } else if (skin.name === 'Aslan') {
        ctx.lineWidth = 2;
        ctx.strokeStyle = colors.birdOutline;
        
        ctx.fillStyle = '#ffca28'; 
        ctx.beginPath();
        for (let i = 0; i < 18; i++) {
            let angle = (i * Math.PI * 2) / 18;
            let r = (i % 2 === 0) ? radius + 8 : radius + 3;
            ctx.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
        }
        ctx.closePath();
        ctx.fill(); ctx.stroke();

        ctx.fillStyle = baseColor; 
        ctx.beginPath();
        ctx.arc(-2, -radius + 2, 4, 0, Math.PI * 2);
        ctx.arc(8, -radius + 1, 4, 0, Math.PI * 2);
        ctx.fill(); ctx.stroke();

        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.fill(); ctx.stroke();

        ctx.fillStyle = '#ffe0b2';
        ctx.beginPath();
        ctx.ellipse(radius - 2, 5, 8, 5, 0, 0, Math.PI * 2);
        ctx.fill(); ctx.stroke();

        ctx.fillStyle = '#212121';
        ctx.beginPath();
        ctx.moveTo(radius + 5, 2); ctx.lineTo(radius - 1, 1); ctx.lineTo(radius + 2, 6);
        ctx.closePath(); ctx.fill();

        ctx.fillStyle = 'white';
        ctx.beginPath(); ctx.arc(radius - 6, -3, 4, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        
        ctx.fillStyle = 'black'; 
        ctx.beginPath(); ctx.arc(radius - 4, -3, 2, 0, Math.PI * 2); ctx.fill();

        ctx.beginPath();
        ctx.moveTo(radius + 1, 5); ctx.lineTo(radius + 10, 4);
        ctx.moveTo(radius + 2, 7); ctx.lineTo(radius + 11, 8);
        ctx.stroke();
    } else if (skin.name === 'Kaplan') {
        ctx.lineWidth = 2;
        ctx.strokeStyle = colors.birdOutline;
        
        ctx.fillStyle = baseColor; 
        ctx.beginPath();
        ctx.arc(-4, -radius + 2, 4, 0, Math.PI * 2);
        ctx.arc(6, -radius + 1, 4, 0, Math.PI * 2);
        ctx.fill(); ctx.stroke();
        
        ctx.fillStyle = 'white'; 
        ctx.beginPath();
        ctx.arc(-4, -radius + 2, 1.5, 0, Math.PI * 2);
        ctx.arc(6, -radius + 1, 1.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = baseColor;
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.fill(); ctx.stroke();

        ctx.fillStyle = '#1e90ff';
        ctx.fillRect(-2, -radius, 2, 6); ctx.fillRect(3, -radius, 2, 6);
        ctx.fillRect(-radius, -2, 4, 2); ctx.fillRect(-radius, 3, 4, 2);

        ctx.fillStyle = 'white';
        ctx.beginPath(); ctx.ellipse(radius - 3, 5, 7, 5, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

        ctx.fillStyle = '#212121';
        ctx.beginPath();
        ctx.moveTo(radius + 3, 2); ctx.lineTo(radius - 3, 1); ctx.lineTo(radius, 5);
        ctx.closePath(); ctx.fill();

        ctx.fillStyle = 'white';
        ctx.beginPath(); ctx.arc(radius - 6, -3, 4, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.fillStyle = 'black'; 
        ctx.beginPath(); ctx.arc(radius - 4, -3, 2, 0, Math.PI * 2); ctx.fill();

        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.moveTo(radius - 1, 9); ctx.lineTo(radius + 1, 13); ctx.lineTo(radius + 3, 9);
        ctx.closePath(); ctx.fill(); ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(radius - 4, 5); ctx.lineTo(radius + 5, 4);
        ctx.moveTo(radius - 3, 7); ctx.lineTo(radius + 6, 8);
        ctx.stroke();
    } else {
        ctx.lineWidth = 3;
        ctx.strokeStyle = colors.birdOutline;
        if (skin.name === 'Timsah') {
            ctx.fillStyle = '#1b5e20';
            ctx.fillRect(-10, -radius - 3, 4, 6); ctx.strokeRect(-10, -radius - 3, 4, 6);
            ctx.fillRect(-2, -radius - 3, 4, 6); ctx.strokeRect(-2, -radius - 3, 4, 6);
            ctx.fillRect(6, -radius - 3, 4, 6); ctx.strokeRect(6, -radius - 3, 4, 6);
        } else if (skin.name === 'Kanarya') {
            ctx.fillStyle = '#fbc02d';
            ctx.fillRect(-2, -radius - 4, 4, 8); ctx.strokeRect(-2, -radius - 4, 4, 8);
        }

        ctx.fillStyle = baseColor;
        ctx.beginPath();
        ctx.roundRect(-radius, -radius, radius * 2, radius * 2, 5);
        ctx.fill();

        if (skin.name === 'Kartal') {
            ctx.save();
            ctx.beginPath(); ctx.roundRect(-radius, -radius, radius * 2, radius * 2, 5); ctx.clip();
            ctx.fillStyle = 'white'; 
            ctx.fillRect(-radius, -radius, radius * 2, radius * 1.3);
            ctx.restore();
        } else if (skin.name === 'Kanarya') {
            ctx.fillStyle = '#fbc02d'; 
            ctx.fillRect(-8, 0, 10, 6);
        }

        ctx.beginPath();
        ctx.roundRect(-radius, -radius, radius * 2, radius * 2, 5);
        ctx.stroke();

        ctx.fillStyle = 'white';
        ctx.fillRect(radius - 12, -radius + 4, 10, 10);
        ctx.strokeRect(radius - 12, -radius + 4, 10, 10);
        
        ctx.fillStyle = 'black';
        ctx.fillRect(radius - 8, -radius + 8, 4, 4);

        let beakWidth = skin.name === 'Timsah' ? 16 : 12;
        ctx.fillStyle = beakColor;
        ctx.fillRect(radius, 0, beakWidth, 8);
        ctx.strokeRect(radius, 0, beakWidth, 8);

        if (skin.name === 'Timsah') {
            ctx.fillStyle = 'white';
            ctx.beginPath();
            ctx.moveTo(radius + 2, 8); ctx.lineTo(radius + 4, 12); ctx.lineTo(radius + 6, 8);
            ctx.moveTo(radius + 8, 8); ctx.lineTo(radius + 10, 12); ctx.lineTo(radius + 12, 8);
            ctx.moveTo(radius + 14, 8); ctx.lineTo(radius + 15, 11); ctx.lineTo(radius + 16, 8);
            ctx.fill(); ctx.stroke();
        }
    }
}

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

        drawSkinOnCtx(ctx, currentSkin, this.radius);
        
        ctx.restore();
    },
    update(dtMultiplier = 1) {
        let currentGravity = this.gravity;
        // Kuş tepe noktasındayken (hızı sıfıra yakınken) yerçekimini geçici olarak azalt
        if (this.velocity > -1.5 && this.velocity < 2) {
            currentGravity = this.gravity * 0.4;
        }
        
        this.velocity += currentGravity * dtMultiplier;
        if (this.velocity > 6) this.velocity = 6;
        this.y += this.velocity * dtMultiplier;
        
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
    update(dtMultiplier = 1) {
        let currentDx = this.baseDx;
        if (score > 5) {
            currentDx += (score - 5) * 0.08;
            currentDx = Math.min(currentDx, 4);
        }

        let requiredFrames = this.pipeDistance / currentDx;
        this.framesSinceLastPipe += dtMultiplier;

        if (this.framesSinceLastPipe >= requiredFrames) {
            let topPosition = Math.random() * (canvas.height - this.gap - 100) + 50;
            let bottomPosition = canvas.height - this.gap - topPosition;
            this.items.push({
                x: canvas.width,
                top: topPosition,
                bottom: bottomPosition,
                passed: false
            });
            this.framesSinceLastPipe -= requiredFrames;
        }
        
        for (let i = 0; i < this.items.length; i++) {
            let p = this.items[i];
            p.x -= currentDx * dtMultiplier;
            
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

function drawBackground(dtMultiplier = 1) {
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
        cloud.x -= (currentWeather === 'rain' ? 0.6 : 0.3) * dtMultiplier; // Yağmurlu havada bulutlar daha hızlı
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
                p.y += p.speed * dtMultiplier;
                p.x -= p.speed * 0.2 * dtMultiplier;
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
                p.y += p.speed * dtMultiplier;
                p.x += Math.sin(frames * 0.05 + p.y) * p.drift * dtMultiplier;
                if (p.y > canvas.height) {
                    p.y = -10;
                    p.x = Math.random() * canvas.width;
                }
            }
        });
    }
}

function draw(dtMultiplier = 1) {
    drawBackground(dtMultiplier);
    bird.draw();
    pipes.draw();
}

function update(dtMultiplier) {
    if (gameState !== 'play') return;
    bird.update(dtMultiplier);
    pipes.update(dtMultiplier);
}

let lastTime = 0;

function loop(timestamp) {
    if (!lastTime) lastTime = timestamp;
    let dt = timestamp - lastTime;
    
    // Sekme arka planda kaldığında devasa atlamaları engelle
    if (dt > 100) dt = 100;
    lastTime = timestamp;
    
    // Referans cihaz 200Hz olduğu için, taban gecikmeyi 5ms (1000/200) alıyoruz.
    let dtMultiplier = dt / 5;

    update(dtMultiplier);
    frames += dtMultiplier;
    
    draw(dtMultiplier);
    
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
    requestAnimationFrame(loop);
}

function gameOver() {
    gameState = 'over';
    gameOverTime = Date.now();
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
    
    // Boşluk tuşunun kaydırmasını ve mobil tarayıcıların "touchstart" sonrasında sahte bir "mousedown" göndererek çift zıplamaya sebep olmasını engelle
    if (e.cancelable && (e.type === 'keydown' || e.type === 'touchstart')) {
        e.preventDefault();
    }
    
    // Mağaza açıksa oyunu başlatma
    if (!storeScreen.classList.contains('hidden')) return;

    if (gameState === 'start') {
        startGame();
    } else if (gameState === 'over') {
        // Oyun bittikten sonra yanlışlıkla yeniden başlamayı engellemek için 1 saniye bekleme süresi
        if (Date.now() - gameOverTime >= 1000) {
            startGame();
        }
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
            updateBirdSkin();
            renderStore();
            draw(); // Ekranı güncelle
        };
        let preview = document.createElement('canvas');
        preview.className = 'skin-preview';
        preview.width = 36;
        preview.height = 36;
        let pCtx = preview.getContext('2d');
        pCtx.translate(16, 18); // Merkez
        drawSkinOnCtx(pCtx, skin, 10); // Küçültülmüş yarıçapla çiz
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
