// Oyun değişkenleri
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const startButton = document.getElementById('start-button');
const restartButton = document.getElementById('restart-button');
const scoreElement = document.getElementById('score');
const timeElement = document.getElementById('time');
const livesElement = document.getElementById('lives');
const finalScoreElement = document.getElementById('final-score');

// DOM yüklenmeden önce erişim hatası olmaması için kontrol
if (!canvas) {
    window.addEventListener('DOMContentLoaded', () => {
        location.reload();
    });
}

// Oyun ayarları
const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;
const PLAYER_SIZE = 20;
const DELIVERY_SIZE = 15;
const SHIELD_SIZE = 20;
const BASE_OBSTACLE_COUNT = 5;
const DELIVERY_TIME = 10; // saniye
const STUN_TIME = 2000; // milisaniye
const SHIELD_TIME = 3000; // milisaniye
const SHIELD_SPAWN_CHANCE = 0.005; // Her frame'de kalkan oluşma olasılığı

// Local storage'dan maxLevel'i yükle
function loadMaxLevel() {
    const savedMaxLevel = localStorage.getItem('kuryeOyunuMaxLevel');
    return savedMaxLevel ? parseInt(savedMaxLevel) : 1;
}

// Local storage'a maxLevel'i kaydet
function saveMaxLevel(level) {
    localStorage.setItem('kuryeOyunuMaxLevel', level.toString());
}

// Oyun durumu
let gameRunning = false;
let score = 0;
let level = 1;
let maxLevel = loadMaxLevel();
let lives = 3;
let deliveryTimer = DELIVERY_TIME;
let lastTime = 0;
let isStunned = false;
let stunnedUntil = 0;
let hasShield = false;
let shieldUntil = 0;
let shield = null;
let package = null;
let hasPackage = false;
let currentScreen = "start";

// Harita elemanları
const MAP = {
    roads: [
        { x: 100, y: 0, width: 50, height: GAME_HEIGHT, color: '#555' },
        { x: 300, y: 0, width: 50, height: GAME_HEIGHT, color: '#555' },
        { x: 500, y: 0, width: 50, height: GAME_HEIGHT, color: '#555' },
        { x: 700, y: 0, width: 50, height: GAME_HEIGHT, color: '#555' },
        { x: 0, y: 100, width: GAME_WIDTH, height: 50, color: '#555' },
        { x: 0, y: 300, width: GAME_WIDTH, height: 50, color: '#555' },
        { x: 0, y: 500, width: GAME_WIDTH, height: 50, color: '#555' }
    ],
    buildings: [
        { x: 0, y: 0, width: 80, height: 80, color: '#8B4513' },
        { x: 170, y: 0, width: 110, height: 80, color: '#8B4513' },
        { x: 370, y: 0, width: 110, height: 80, color: '#8B4513' },
        { x: 570, y: 0, width: 110, height: 80, color: '#8B4513' },
        { x: 0, y: 170, width: 80, height: 110, color: '#8B4513' },
        { x: 170, y: 170, width: 110, height: 110, color: '#8B4513' },
        { x: 370, y: 170, width: 110, height: 110, color: '#8B4513' },
        { x: 570, y: 170, width: 110, height: 110, color: '#8B4513' },
        { x: 0, y: 370, width: 80, height: 110, color: '#8B4513' },
        { x: 170, y: 370, width: 110, height: 110, color: '#8B4513' },
        { x: 370, y: 370, width: 110, height: 110, color: '#8B4513' },
        { x: 570, y: 370, width: 110, height: 110, color: '#8B4513' }
    ]
};

// Oyuncu
const player = {
    x: GAME_WIDTH / 2,
    y: GAME_HEIGHT / 2,
    width: PLAYER_SIZE,
    height: PLAYER_SIZE,
    color: '#00F',
    speed: 5,
    dx: 0,
    dy: 0
};

// Teslimat noktası
let deliveryPoint = {
    x: 0,
    y: 0,
    width: DELIVERY_SIZE,
    height: DELIVERY_SIZE,
    color: '#F00',
    visible: false
};

// Engeller
let obstacles = [];

// Tuş kontrolleri
const keys = {
    ArrowUp: false,
    ArrowDown: false,
    ArrowLeft: false,
    ArrowRight: false
};

// Oyunu başlat
function init(selectedLevel = 1) {
    // Canvas boyutunu ayarla
    canvas.width = GAME_WIDTH;
    canvas.height = GAME_HEIGHT;
    
    // Oyun değişkenlerini sıfırla
    score = 0;
    level = selectedLevel;
    lives = 3;
    deliveryTimer = DELIVERY_TIME;
    isStunned = false;
    hasShield = false;
    hasPackage = false;
    shield = null;
    package = null;
    currentScreen = "game";
    
    // Skoru güncelle
    updateUI();
    
    // Paketi oluştur
    createPackage();
    
    // Teslimat noktasını gizle
    hideDeliveryPoint();
    
    // Engelleri oluştur
    createObstacles();
    
    // Oyunu başlat
    gameRunning = true;
    
    // Ekranları güncelle
    startScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    document.getElementById('level-select-screen').classList.add('hidden');
    
    // Oyun döngüsünü başlat
    requestAnimationFrame(gameLoop);
}

// Teslimat noktası oluştur
function createDeliveryPoint() {
    // Yol üzerinde rastgele bir konum seç
    const roadIndex = Math.floor(Math.random() * MAP.roads.length);
    const road = MAP.roads[roadIndex];
    
    if (road.width > road.height) {
        // Yatay yol
        deliveryPoint.x = road.x + Math.random() * (road.width - DELIVERY_SIZE);
        deliveryPoint.y = road.y + (road.height - DELIVERY_SIZE) / 2;
    } else {
        // Dikey yol
        deliveryPoint.x = road.x + (road.width - DELIVERY_SIZE) / 2;
        deliveryPoint.y = road.y + Math.random() * (road.height - DELIVERY_SIZE);
    }
}

// Level zorluk ayarları
const LEVEL_DIFFICULTIES = [
    { obstacleCount: 5, obstacleSpeed: 1.0 },  // Level 1
    { obstacleCount: 7, obstacleSpeed: 1.2 },  // Level 2
    { obstacleCount: 9, obstacleSpeed: 1.4 },  // Level 3
    { obstacleCount: 11, obstacleSpeed: 1.6 }, // Level 4
    { obstacleCount: 13, obstacleSpeed: 1.8 }, // Level 5
    { obstacleCount: 15, obstacleSpeed: 2.0 }, // Level 6
    { obstacleCount: 17, obstacleSpeed: 2.2 }, // Level 7
    { obstacleCount: 19, obstacleSpeed: 2.4 }, // Level 8
    { obstacleCount: 21, obstacleSpeed: 2.6 }, // Level 9
    { obstacleCount: 23, obstacleSpeed: 2.8 }  // Level 10
];

// Engelleri oluştur
function createObstacles() {
    obstacles = [];
    
    // Level'a göre zorluk ayarını al (1-tabanlı indeks)
    const levelIndex = Math.min(level - 1, LEVEL_DIFFICULTIES.length - 1);
    const difficulty = LEVEL_DIFFICULTIES[levelIndex];
    
    for (let i = 0; i < difficulty.obstacleCount; i++) {
        // Yol üzerinde rastgele bir konum seç
        const roadIndex = Math.floor(Math.random() * MAP.roads.length);
        const road = MAP.roads[roadIndex];
        
        let obstacle = {
            x: 0,
            y: 0,
            width: 30,
            height: 15,
            color: '#FF0',
            speed: difficulty.obstacleSpeed + Math.random(),
            direction: Math.floor(Math.random() * 4) // 0: yukarı, 1: sağ, 2: aşağı, 3: sol
        };
        
        if (road.width > road.height) {
            // Yatay yol
            obstacle.y = road.y + (road.height - obstacle.height) / 2;
            if (Math.random() > 0.5) {
                // Soldan sağa
                obstacle.x = road.x;
                obstacle.direction = 1;
            } else {
                // Sağdan sola
                obstacle.x = road.x + road.width - obstacle.width;
                obstacle.direction = 3;
            }
        } else {
            // Dikey yol
            obstacle.x = road.x + (road.width - obstacle.width) / 2;
            if (Math.random() > 0.5) {
                // Yukarıdan aşağı
                obstacle.y = road.y;
                obstacle.direction = 2;
            } else {
                // Aşağıdan yukarı
                obstacle.y = road.y + road.height - obstacle.height;
                obstacle.direction = 0;
            }
        }
        
        obstacles.push(obstacle);
    }
}

// Çarpışma kontrolü
function checkCollision(rect1, rect2) {
    return (
        rect1.x < rect2.x + rect2.width &&
        rect1.x + rect1.width > rect2.x &&
        rect1.y < rect2.y + rect2.height &&
        rect1.y + rect1.height > rect2.y
    );
}

// Oyuncuyu güncelle
function updatePlayer() {
    // Eğer oyuncu stun durumundaysa hareket etme
    if (isStunned) {
        if (Date.now() > stunnedUntil) {
            isStunned = false;
            player.color = '#00F';
        } else {
            return;
        }
    }
    
    // Kalkan süresini kontrol et
    if (hasShield && Date.now() > shieldUntil) {
        hasShield = false;
    }
    
    // Tuş kontrollerine göre hareket yönünü belirle
    player.dx = 0;
    player.dy = 0;
    
    // Sadece bir yön tuşu aktif olsun (öncelik sırası: yukarı, aşağı, sol, sağ)
    if (keys.ArrowUp) {
        player.dy = -player.speed;
    } else if (keys.ArrowDown) {
        player.dy = player.speed;
    }
    
    if (keys.ArrowLeft) {
        player.dx = -player.speed;
    } else if (keys.ArrowRight) {
        player.dx = player.speed;
    }
    
    // Oyuncuyu hareket ettir
    player.x += player.dx;
    player.y += player.dy;
    
    // Ekran sınırlarını kontrol et
    if (player.x < 0) player.x = 0;
    if (player.x + player.width > GAME_WIDTH) player.x = GAME_WIDTH - player.width;
    if (player.y < 0) player.y = 0;
    if (player.y + player.height > GAME_HEIGHT) player.y = GAME_HEIGHT - player.height;
    
    // Paket ve teslimat noktası kontrolü
    if (!hasPackage && package && checkCollision(player, package)) {
        // Paketi al
        hasPackage = true;
        
        // Teslimat noktasını göster
        showDeliveryPoint();
        
        // Süreyi sıfırla
        deliveryTimer = DELIVERY_TIME;
        
        // UI güncelle
        updateUI();
    } else if (hasPackage && deliveryPoint.visible && checkCollision(player, deliveryPoint)) {
        // Puan ekle
        score += 10;
        
        // Level kontrolü - artık oyun içinde level atlamıyoruz
        
        // Paketi bırak ve yeni paket oluştur
        hasPackage = false;
        createPackage();
        
        // Teslimat noktasını gizle
        hideDeliveryPoint();
        
        // Süreyi sıfırla
        deliveryTimer = DELIVERY_TIME;
        
        // UI güncelle
        updateUI();
    }
    
    // Engellere çarpma kontrolü
    for (let obstacle of obstacles) {
        if (checkCollision(player, obstacle)) {
            // Eğer kalkan varsa çarpmayı engelle ve devam et
            if (hasShield) {
                break;
            }
            
            // Puan azalt
            score -= 3;
            
            // Can azalt
            lives--;
            
            // Oyuncuyu stun yap
            isStunned = true;
            stunnedUntil = Date.now() + STUN_TIME;
            player.color = '#AAA'; // Stun durumunda renk değiştir
            
            // Oyuncuyu yolun dışına taşı
            movePlayerOutOfRoad();
            
            // UI güncelle
            updateUI();
            
            // Oyun bitti mi kontrol et
            if (lives <= 0) {
                gameOver();
            }
            
            break;
        }
    }
    
    // Kalkan kontrolü
    if (shield && checkCollision(player, shield)) {
        // Kalkanı al
        hasShield = true;
        shieldUntil = Date.now() + SHIELD_TIME;
        shield = null;
        
        // Kalkan alındı mesajı
        const shieldElement = document.getElementById('shield-status');
        if (shieldElement) {
            shieldElement.textContent = "Aktif";
            shieldElement.style.color = "#0FF";
            
            // 3 saniye sonra mesajı kaldır
            setTimeout(() => {
                if (!hasShield) {
                    shieldElement.textContent = "Yok";
                    shieldElement.style.color = "white";
                }
            }, SHIELD_TIME);
        }
    }
}

// Engelleri güncelle
function updateObstacles(deltaTime) {
    for (let obstacle of obstacles) {
        // Engeli hareket ettir
        switch (obstacle.direction) {
            case 0: // Yukarı
                obstacle.y -= obstacle.speed;
                break;
            case 1: // Sağ
                obstacle.x += obstacle.speed;
                break;
            case 2: // Aşağı
                obstacle.y += obstacle.speed;
                break;
            case 3: // Sol
                obstacle.x -= obstacle.speed;
                break;
        }
        
        // Ekran dışına çıktıysa yeniden konumlandır
        if (obstacle.x < -obstacle.width || 
            obstacle.x > GAME_WIDTH || 
            obstacle.y < -obstacle.height || 
            obstacle.y > GAME_HEIGHT) {
            
            // Rastgele bir yol seç
            const roadIndex = Math.floor(Math.random() * MAP.roads.length);
            const road = MAP.roads[roadIndex];
            
            if (road.width > road.height) {
                // Yatay yol
                obstacle.y = road.y + (road.height - obstacle.height) / 2;
                if (Math.random() > 0.5) {
                    // Soldan sağa
                    obstacle.x = road.x;
                    obstacle.direction = 1;
                } else {
                    // Sağdan sola
                    obstacle.x = road.x + road.width - obstacle.width;
                    obstacle.direction = 3;
                }
            } else {
                // Dikey yol
                obstacle.x = road.x + (road.width - obstacle.width) / 2;
                if (Math.random() > 0.5) {
                    // Yukarıdan aşağı
                    obstacle.y = road.y;
                    obstacle.direction = 2;
                } else {
                    // Aşağıdan yukarı
                    obstacle.y = road.y + road.height - obstacle.height;
                    obstacle.direction = 0;
                }
            }
        }
    }
}

// Teslimat süresini güncelle
function updateDeliveryTimer(deltaTime) {
    // Sadece paket alınmışsa süreyi azalt
    if (hasPackage) {
        deliveryTimer -= deltaTime;
        
        if (deliveryTimer <= 0) {
            // Puan azalt
            score -= 5;
            
            // Paketi düşür ve yeni paket oluştur
            hasPackage = false;
            createPackage();
            
            // Teslimat noktasını gizle
            hideDeliveryPoint();
            
            // Süreyi sıfırla
            deliveryTimer = DELIVERY_TIME;
            
            // UI güncelle
            updateUI();
        }
    }
}

// Kalkan oluştur
function createShield() {
    // Rastgele bir yol seç
    const roadIndex = Math.floor(Math.random() * MAP.roads.length);
    const road = MAP.roads[roadIndex];
    
    shield = {
        x: 0,
        y: 0,
        width: SHIELD_SIZE,
        height: SHIELD_SIZE,
        color: '#0FF'
    };
    
    if (road.width > road.height) {
        // Yatay yol
        shield.x = road.x + Math.random() * (road.width - SHIELD_SIZE);
        shield.y = road.y + (road.height - SHIELD_SIZE) / 2;
    } else {
        // Dikey yol
        shield.x = road.x + (road.width - SHIELD_SIZE) / 2;
        shield.y = road.y + Math.random() * (road.height - SHIELD_SIZE);
    }
}

// UI güncelle
function updateUI() {
    scoreElement.textContent = score;
    timeElement.textContent = hasPackage ? Math.ceil(deliveryTimer) : "-";
    livesElement.textContent = lives;
    
    // Kalkan durumunu güncelle
    const shieldElement = document.getElementById('shield-status');
    if (shieldElement) {
        if (hasShield) {
            shieldElement.textContent = "Aktif";
            shieldElement.style.color = "#0FF";
        } else {
            shieldElement.textContent = "Yok";
            shieldElement.style.color = "white";
        }
    }
    
    // Level bilgisini güncelle
    const levelElement = document.getElementById('level');
    if (levelElement) {
        levelElement.textContent = level;
    }
    
    // Bir sonraki level için gereken puanı göster
    const nextLevelElement = document.getElementById('next-level-score');
    if (nextLevelElement) {
        const pointsNeeded = 50 - (score % 50);
        nextLevelElement.textContent = pointsNeeded;
    }
}

// Haritayı çiz
function drawMap() {
    // Arka planı çiz (yeşil alan)
    ctx.fillStyle = '#4CAF50';
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    
    // Yolları çiz
    for (let road of MAP.roads) {
        ctx.fillStyle = road.color;
        ctx.fillRect(road.x, road.y, road.width, road.height);
    }
    
    // Binaları çiz
    for (let building of MAP.buildings) {
        ctx.fillStyle = building.color;
        ctx.fillRect(building.x, building.y, building.width, building.height);
    }
}

// Oyuncuyu çiz
function drawPlayer() {
    // Oyuncuyu çiz
    ctx.fillStyle = player.color;
    ctx.fillRect(player.x, player.y, player.width, player.height);
    
    // Paket taşıyorsa üzerinde göster
    if (hasPackage) {
        ctx.fillStyle = '#F00';
        ctx.fillRect(
            player.x + player.width/4, 
            player.y + player.height/4, 
            player.width/2, 
            player.height/2
        );
    }
    
    // Kalkan aktifse oyuncunun etrafına mavi çember çiz
    if (hasShield) {
        ctx.strokeStyle = '#0FF';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(
            player.x + player.width / 2, 
            player.y + player.height / 2, 
            player.width * 0.8, 
            0, 
            Math.PI * 2
        );
        ctx.stroke();
    }
}

// Teslimat noktasını çiz
function drawDeliveryPoint() {
    if (deliveryPoint.visible) {
        ctx.fillStyle = deliveryPoint.color;
        ctx.fillRect(deliveryPoint.x, deliveryPoint.y, deliveryPoint.width, deliveryPoint.height);
    }
}

// Teslimat noktasını gizle
function hideDeliveryPoint() {
    deliveryPoint.visible = false;
}

// Teslimat noktasını göster
function showDeliveryPoint() {
    deliveryPoint.visible = true;
    createDeliveryPoint();
}

// Paketi oluştur
function createPackage() {
    // Rastgele bir yol seç
    const roadIndex = Math.floor(Math.random() * MAP.roads.length);
    const road = MAP.roads[roadIndex];
    
    package = {
        x: 0,
        y: 0,
        width: DELIVERY_SIZE,
        height: DELIVERY_SIZE,
        color: '#F00'
    };
    
    if (road.width > road.height) {
        // Yatay yol
        package.x = road.x + Math.random() * (road.width - DELIVERY_SIZE);
        package.y = road.y + (road.height - DELIVERY_SIZE) / 2;
    } else {
        // Dikey yol
        package.x = road.x + (road.width - DELIVERY_SIZE) / 2;
        package.y = road.y + Math.random() * (road.height - DELIVERY_SIZE);
    }
}

// Paketi çiz
function drawPackage() {
    if (package && !hasPackage) {
        ctx.fillStyle = package.color;
        ctx.fillRect(package.x, package.y, package.width, package.height);
    }
}

// Engelleri çiz
function drawObstacles() {
    for (let obstacle of obstacles) {
        ctx.fillStyle = obstacle.color;
        ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
    }
}

// Kalkanı çiz
function drawShield() {
    if (shield) {
        ctx.fillStyle = shield.color;
        ctx.beginPath();
        ctx.arc(shield.x + shield.width/2, shield.y + shield.height/2, shield.width/2, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Oyun döngüsü
function gameLoop(timestamp) {
    // Delta time hesapla (saniye cinsinden)
    const deltaTime = (timestamp - lastTime) / 1000;
    lastTime = timestamp;
    
    // Ekranı temizle
    ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    
    // Haritayı çiz
    drawMap();
    
    // Paketi çiz
    drawPackage();
    
    // Teslimat noktasını çiz
    drawDeliveryPoint();
    
    // Kalkanı çiz
    drawShield();
    
    // Engelleri çiz
    drawObstacles();
    
    // Oyuncuyu çiz
    drawPlayer();
    
    // Oyuncuyu güncelle
    updatePlayer();
    
    // Engelleri güncelle
    updateObstacles(deltaTime);
    
    // Teslimat süresini güncelle
    updateDeliveryTimer(deltaTime);
    
    // Rastgele kalkan oluştur
    if (!shield && !hasShield && Math.random() < SHIELD_SPAWN_CHANCE) {
        createShield();
    }
    
    // UI güncelle
    updateUI();
    
    // Oyun devam ediyorsa döngüyü sürdür
    if (gameRunning) {
        requestAnimationFrame(gameLoop);
    }
}

// Oyuncuyu yolun dışına taşı
function movePlayerOutOfRoad() {
    // Oyuncunun yol üzerinde olup olmadığını kontrol et
    let isOnRoad = false;
    let closestRoad = null;
    let minDistance = Infinity;
    
    // Oyuncunun merkez noktası
    const playerCenterX = player.x + player.width / 2;
    const playerCenterY = player.y + player.height / 2;
    
    // Tüm yolları kontrol et
    for (const road of MAP.roads) {
        if (playerCenterX >= road.x && 
            playerCenterX <= road.x + road.width && 
            playerCenterY >= road.y && 
            playerCenterY <= road.y + road.height) {
            isOnRoad = true;
            
            // En yakın yol kenarını bul
            const distToLeft = Math.abs(playerCenterX - road.x);
            const distToRight = Math.abs(playerCenterX - (road.x + road.width));
            const distToTop = Math.abs(playerCenterY - road.y);
            const distToBottom = Math.abs(playerCenterY - (road.y + road.height));
            
            // En yakın kenarı bul
            const minEdgeDist = Math.min(distToLeft, distToRight, distToTop, distToBottom);
            
            // Oyuncuyu en yakın kenara taşı
            if (minEdgeDist === distToLeft) {
                player.x = road.x - player.width - 5;
            } else if (minEdgeDist === distToRight) {
                player.x = road.x + road.width + 5;
            } else if (minEdgeDist === distToTop) {
                player.y = road.y - player.height - 5;
            } else if (minEdgeDist === distToBottom) {
                player.y = road.y + road.height + 5;
            }
            
            break;
        }
        
        // Eğer yol üzerinde değilse, en yakın yolu bul
        const roadCenterX = road.x + road.width / 2;
        const roadCenterY = road.y + road.height / 2;
        const distance = Math.sqrt(
            Math.pow(playerCenterX - roadCenterX, 2) + 
            Math.pow(playerCenterY - roadCenterY, 2)
        );
        
        if (distance < minDistance) {
            minDistance = distance;
            closestRoad = road;
        }
    }
    
    // Ekran sınırlarını kontrol et
    if (player.x < 0) player.x = 0;
    if (player.x + player.width > GAME_WIDTH) player.x = GAME_WIDTH - player.width;
    if (player.y < 0) player.y = 0;
    if (player.y + player.height > GAME_HEIGHT) player.y = GAME_HEIGHT - player.height;
}

// Oyun bitti
function gameOver() {
    gameRunning = false;
    finalScoreElement.textContent = score;
    gameOverScreen.classList.remove('hidden');
    currentScreen = "gameOver";
    
    // Bir sonraki levelin kilidini aç (eğer yeterli puan yapıldıysa)
    if (score >= 50 && level >= maxLevel) {
        maxLevel = Math.min(level + 1, LEVEL_DIFFICULTIES.length);
        // Local storage'a kaydet
        saveMaxLevel(maxLevel);
        // Level seçim ekranını güncelle
        updateLevelSelectScreen();
    }
}

// Tuş olayları
document.addEventListener('keydown', (e) => {
    if (keys.hasOwnProperty(e.key)) {
        e.preventDefault(); // Sayfanın kaymasını engelle
        keys[e.key] = true;
    }
    
    // Oyun bitti ekranında Space veya Enter ile devam et
    if (currentScreen === "gameOver" && (e.key === " " || e.key === "Enter")) {
        e.preventDefault();
        init(level);
    }
});

document.addEventListener('keyup', (e) => {
    if (keys.hasOwnProperty(e.key)) {
        e.preventDefault(); // Sayfanın kaymasını engelle
        keys[e.key] = false;
    }
});

// Level seçim ekranını oluştur
function createLevelSelectScreen() {
    const levelButtonsContainer = document.getElementById('level-buttons');
    levelButtonsContainer.innerHTML = '';
    
    // Local storage'dan maxLevel'i yükle (güncel olduğundan emin olmak için)
    maxLevel = loadMaxLevel();
    
    // 10 level oluştur
    for (let i = 1; i <= 10; i++) {
        const button = document.createElement('button');
        button.textContent = i;
        button.classList.add('level-button');
        
        // Açık level'ları işaretle
        if (i <= maxLevel) {
            button.classList.add('unlocked');
            button.addEventListener('click', () => {
                init(i);
            });
        }
        
        levelButtonsContainer.appendChild(button);
    }
}

// Level seçim ekranını güncelle
function updateLevelSelectScreen() {
    // Local storage'dan maxLevel'i yükle (güncel olduğundan emin olmak için)
    maxLevel = loadMaxLevel();
    
    const levelButtons = document.querySelectorAll('.level-button');
    levelButtons.forEach((button, index) => {
        const levelNum = index + 1;
        if (levelNum <= maxLevel) {
            button.classList.add('unlocked');
            // Event listener'ı temizle ve yeniden ekle
            const oldButton = button.cloneNode(true);
            button.parentNode.replaceChild(oldButton, button);
            oldButton.addEventListener('click', () => {
                init(levelNum);
            });
        }
    });
}

// Level seçim ekranını göster
function showLevelSelectScreen() {
    startScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    document.getElementById('level-select-screen').classList.remove('hidden');
    currentScreen = "levelSelect";
    
    // Level seçim ekranını oluştur
    createLevelSelectScreen();
}

// Buton olayları
startButton.addEventListener('click', () => init(1));
restartButton.addEventListener('click', () => init(level));

// Level seçim butonları
document.getElementById('level-select-button').addEventListener('click', showLevelSelectScreen);
document.getElementById('level-select-button-end').addEventListener('click', showLevelSelectScreen);
document.getElementById('back-button').addEventListener('click', () => {
    document.getElementById('level-select-screen').classList.add('hidden');
    startScreen.classList.remove('hidden');
    currentScreen = "start";
});

// Levelleri sıfırlama butonu
document.getElementById('reset-levels-button').addEventListener('click', () => {
    if (confirm('Tüm level ilerlemeleriniz sıfırlanacak. Emin misiniz?')) {
        maxLevel = 1;
        saveMaxLevel(1);
        createLevelSelectScreen();
        alert('Tüm leveller sıfırlandı.');
    }
});

// Sayfa yüklendiğinde
window.addEventListener('load', () => {
    // Canvas boyutunu ayarla
    canvas.width = GAME_WIDTH;
    canvas.height = GAME_HEIGHT;
    
    // Local storage'dan maxLevel'i yükle
    maxLevel = loadMaxLevel();
    console.log("Yüklenen maxLevel:", maxLevel);
    
    // Başlangıç ekranını göster
    startScreen.classList.remove('hidden');
    currentScreen = "start";
    
    // Level seçim ekranını oluştur
    createLevelSelectScreen();
    
    // Sayfa boyutunu ayarla
    document.body.style.width = '100%';
    document.body.style.height = '100%';
    document.documentElement.style.width = '100%';
    document.documentElement.style.height = '100%';
});