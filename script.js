const screens = {
    start: document.getElementById('start-screen'),
    game: document.getElementById('game-screen'),
    gameOver: document.getElementById('game-over-screen')
};

const UI = {
    score: document.getElementById('score'),
    highScore: document.getElementById('high-score'),
    speed: document.getElementById('speed'),
    shieldCount: document.getElementById('shield-count'),
    boostStatus: document.getElementById('boost-status'),
    slowStatus: document.getElementById('slow-status'),
    finalScore: document.getElementById('final-score'),
    startBtn: document.getElementById('start-btn'),
    restartBtn: document.getElementById('restart-btn'),
    homeBtn: document.getElementById('home-btn')
};

const gameArea = document.getElementById('game-area');
const robot = document.getElementById('robot');
const obstaclesContainer = document.getElementById('obstacles');
const ground = document.querySelector('.ground');

let isGameActive = false;
let isJumping = false;

// Game Variables
let score = 0;
let highScore = localStorage.getItem('neonRunHighScore') || 0;
let speed = 1.0;
let lastTime = 0;
let speedIncreaseTimer = 0;
let obstacleTimer = 0;
let nextObstacleTime = 0;

let robotY = 0; // vertical position relative to ground
let robotVelocity = 0;
const gravity = -0.7;
const jumpPower = 16;

let shieldsRemaining = 2;
let isInvincible = false;
let canBoost = true;
let canSlow = false;
let slowCooldown = 5000;

const rocks = [];

// Initialize
UI.highScore.textContent = Math.floor(highScore);

function switchScreen(screenName) {
    Object.values(screens).forEach(s => s.classList.remove('active'));
    screens[screenName].classList.add('active');
}

function startGame() {
    isGameActive = true;
    score = 0;
    speed = 1.0; // Reset to 1 on restart
    speedIncreaseTimer = 0;
    obstacleTimer = 0;
    nextObstacleTime = getRandomObstacleTime();
    
    // reset robot
    robotY = 0;
    robotVelocity = 0;
    updateRobotPosition();
    robot.classList.add('run');
    
    // clear rocks
    rocks.forEach(rock => rock.element.remove());
    rocks.length = 0;
    
    shieldsRemaining = 2;
    isInvincible = false;
    canBoost = true;
    canSlow = false;
    slowCooldown = 5000;
    
    UI.shieldCount.textContent = shieldsRemaining;
    UI.boostStatus.textContent = "READY";
    UI.boostStatus.className = "ready";
    UI.slowStatus.textContent = "WAIT";
    UI.slowStatus.className = "cooldown";
    robot.classList.remove('shield-active');
    
    ground.classList.add('moving');
    
    switchScreen('game');
    lastTime = performance.now();
    requestAnimationFrame(gameLoop);
}

function gameOver() {
    isGameActive = false;
    robot.classList.remove('run');
    ground.classList.remove('moving');
    
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('neonRunHighScore', highScore);
        UI.highScore.textContent = Math.floor(highScore);
    }
    
    UI.finalScore.textContent = Math.floor(score);
    switchScreen('gameOver');
}

function getRandomObstacleTime() {
    // interval gets shorter as speed increases
    const baseTime = 1200;
    const minTime = 500;
    let time = (baseTime / speed) + Math.random() * 800;
    return Math.max(time, minTime);
}

function createObstacle() {
    const rockEl = document.createElement('div');
    if (Math.random() > 0.7) {
        rockEl.classList.add('tall-rock');
    } else {
        rockEl.classList.add('rock');
    }
    obstaclesContainer.appendChild(rockEl);
    
    rocks.push({
        element: rockEl,
        x: gameArea.clientWidth // start at right edge
    });
}

function jump() {
    if (!isGameActive || isJumping) return;
    isJumping = true;
    robotVelocity = jumpPower;
    robot.classList.remove('run');
}

function boostSpeed() {
    if (!isGameActive || !canBoost) return;
    
    speed *= 2; // double current speed
    updateSpeedUI();
    
    canBoost = false;
    UI.boostStatus.textContent = "COOLDOWN";
    UI.boostStatus.className = "cooldown";
    
    setTimeout(() => {
        if(isGameActive) {
            canBoost = true;
            UI.boostStatus.textContent = "READY";
            UI.boostStatus.className = "ready";
        }
    }, 2500);
    
    // Create a visual feedback for boost
    const glow = document.querySelector('.robot-glow');
    glow.style.background = 'var(--neon-pink)';
    glow.style.transform = 'translateX(-50%) scale(1.5)';
    setTimeout(() => {
        glow.style.background = 'var(--neon-blue)';
        glow.style.transform = 'translateX(-50%) scale(1)';
    }, 500);
}

function activateShield() {
    if (!isGameActive || shieldsRemaining <= 0 || isInvincible) return;
    
    shieldsRemaining--;
    UI.shieldCount.textContent = shieldsRemaining;
    
    isInvincible = true;
    robot.classList.add('shield-active');
    
    setTimeout(() => {
        isInvincible = false;
        robot.classList.remove('shield-active');
    }, 3000);
}

function applySlow() {
    if (!isGameActive || !canSlow) return;
    
    speed *= 0.8;
    updateSpeedUI();
    
    canSlow = false;
    slowCooldown = 5000;
    UI.slowStatus.textContent = "COOLDOWN";
    UI.slowStatus.className = "cooldown";
    
    const glow = document.querySelector('.robot-glow');
    glow.style.background = '#facc15';
    glow.style.transform = 'translateX(-50%) scale(1.5)';
    setTimeout(() => {
        glow.style.background = 'var(--neon-blue)';
        glow.style.transform = 'translateX(-50%) scale(1)';
    }, 500);
}

function updateSpeedUI() {
    UI.speed.textContent = speed.toFixed(1);
    // visually update ground speed based on a baseline
    let animSpeed = 2 / speed;
    // Cap animation speed so it doesn't look too glitchy if speed goes crazy high
    animSpeed = Math.max(animSpeed, 0.2);
    ground.style.animationDuration = `${animSpeed}s`;
}

function checkCollision(rock) {
    const robotRect = robot.getBoundingClientRect();
    const rockRect = rock.element.getBoundingClientRect();
    
    // simple AABB (Axis-Aligned Bounding Box)
    // Reduce hit box slightly for fairer gameplay
    const paddingX = 15;
    const paddingY = 15;
    
    if (
        robotRect.left < rockRect.right - paddingX &&
        robotRect.right > rockRect.left + paddingX &&
        robotRect.top < rockRect.bottom - paddingY &&
        robotRect.bottom > rockRect.top + paddingY
    ) {
        return true;
    }
    return false;
}

function gameLoop(timestamp) {
    if (!isGameActive) return;
    
    const deltaTime = timestamp - lastTime;
    lastTime = timestamp;
    
    // Safety check to prevent huge delta times if tab is inactive
    if (deltaTime > 100) {
        requestAnimationFrame(gameLoop);
        return;
    }
    
    if (!canSlow) {
        slowCooldown -= deltaTime;
        if (slowCooldown <= 0) {
            canSlow = true;
            UI.slowStatus.textContent = "READY";
            UI.slowStatus.className = "ready";
        }
    }

    // --- Update Speed & Score ---
    speedIncreaseTimer += deltaTime;
    if (speedIncreaseTimer >= 1000) {
        speed += 0.01;
        speedIncreaseTimer -= 1000;
        updateSpeedUI();
    }
    
    // Score increases based on current speed
    score += speed * deltaTime * 0.01;
    UI.score.textContent = Math.floor(score);
    
    // --- Update Robot Physics ---
    if (isJumping) {
        robotY += robotVelocity;
        robotVelocity += gravity;
        
        if (robotY <= 0) {
            robotY = 0;
            isJumping = false;
            robotVelocity = 0;
            robot.classList.add('run');
        }
        updateRobotPosition();
    }
    
    // --- Update Obstacles ---
    obstacleTimer += deltaTime;
    if (obstacleTimer >= nextObstacleTime) {
        createObstacle();
        obstacleTimer = 0;
        nextObstacleTime = getRandomObstacleTime();
    }
    
    // Base move amount pixels per ms, scaled by speed
    const baseMoveSpeed = 0.45;
    const moveAmount = baseMoveSpeed * speed * deltaTime; 
    
    for (let i = rocks.length - 1; i >= 0; i--) {
        const rock = rocks[i];
        rock.x -= moveAmount;
        rock.element.style.left = `${rock.x}px`;
        
        if (!isInvincible && checkCollision(rock)) {
            gameOver();
            return;
        }
        
        // Remove if off screen
        if (rock.x < -60) {
            rock.element.remove();
            rocks.splice(i, 1);
        }
    }
    
    requestAnimationFrame(gameLoop);
}

function updateRobotPosition() {
    // 80 is the ground height
    robot.style.bottom = `${80 + robotY}px`;
}

// Event Listeners
UI.startBtn.addEventListener('click', startGame);
UI.restartBtn.addEventListener('click', startGame);
UI.homeBtn.addEventListener('click', () => switchScreen('start'));

window.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        if(isGameActive) {
            jump();
            e.preventDefault(); // prevent scrolling
        }
    }
    if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
        if (isGameActive) {
            activateShield();
            e.preventDefault();
        }
    }
    if (e.code === 'ControlLeft' || e.code === 'ControlRight') {
        if (isGameActive) {
            applySlow();
            e.preventDefault();
        }
    }
    if (e.code === 'Enter') {
        e.preventDefault(); // 버튼 클릭 이벤트(초기화 등)가 중복 발생하지 않도록 기본 동작 막기
        if(isGameActive) {
            boostSpeed();
        } else if (screens.start.classList.contains('active') || screens.gameOver.classList.contains('active')) {
            startGame();
        }
    }
});

// Initial Setup
updateSpeedUI();
