// Elements
const nameInput = document.getElementById('nameInput');
const totalCountEl = document.getElementById('totalCount');
const remainCountEl = document.getElementById('remainCount');
const excludeCheckbox = document.getElementById('excludeCheckbox');
const resetListBtn = document.getElementById('resetListBtn');
const drawBtn = document.getElementById('drawBtn');
const pickedNameEl = document.getElementById('pickedName');

const timeText = document.getElementById('timeText');
const timerBtns = document.querySelectorAll('.btn-timer');
const toggleTimerBtn = document.getElementById('toggleTimerBtn');
const resetTimerBtn = document.getElementById('resetTimerBtn');

// State
let allNames = [];
let remainNames = [];
let isDrawing = false;

let timerInterval = null;
let remainingSeconds = 0;
let isTimerRunning = false;

// Audio Context for Beep Sound
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playBeep() {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
    oscillator.frequency.exponentialRampToValueAtTime(440, audioCtx.currentTime + 0.5);
    
    gainNode.gain.setValueAtTime(0.5, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
    
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.5);
}

function playAlarm() {
    let count = 0;
    const interval = setInterval(() => {
        playBeep();
        count++;
        if(count >= 3) clearInterval(interval);
    }, 600);
}

// Name Logic
function updateStats() {
    totalCountEl.textContent = allNames.length;
    remainCountEl.textContent = remainNames.length;
}

function parseNames() {
    const rawText = nameInput.value;
    allNames = rawText.split(',')
        .map(n => n.trim())
        .filter(n => n.length > 0);
    remainNames = [...allNames];
    updateStats();
}

nameInput.addEventListener('input', parseNames);

resetListBtn.addEventListener('click', () => {
    remainNames = [...allNames];
    updateStats();
    pickedNameEl.textContent = '대기 중';
    pickedNameEl.className = '';
});

drawBtn.addEventListener('click', () => {
    if (isDrawing) return;
    if (allNames.length === 0) {
        alert('먼저 좌측에 명단을 입력해주세요!');
        nameInput.focus();
        return;
    }
    
    const pool = excludeCheckbox.checked ? remainNames : allNames;
    
    if (pool.length === 0) {
        alert('추첨할 대상이 없습니다. 명단을 초기화하거나 옵션을 변경하세요.');
        return;
    }

    isDrawing = true;
    drawBtn.disabled = true;
    pickedNameEl.className = 'rolling';
    
    // Drum roll effect
    let rolls = 0;
    const maxRolls = 20; // 2 seconds (100ms * 20)
    
    const rollInterval = setInterval(() => {
        const randomIdx = Math.floor(Math.random() * pool.length);
        pickedNameEl.textContent = pool[randomIdx];
        rolls++;
        
        if (rolls >= maxRolls) {
            clearInterval(rollInterval);
            finishDraw(pool);
        }
    }, 100);
});

function finishDraw(pool) {
    const finalIdx = Math.floor(Math.random() * pool.length);
    const winner = pool[finalIdx];
    
    pickedNameEl.textContent = winner;
    pickedNameEl.className = 'picked';
    
    if (excludeCheckbox.checked) {
        // Remove from remaining
        const removeIdx = remainNames.indexOf(winner);
        if (removeIdx > -1) {
            remainNames.splice(removeIdx, 1);
            updateStats();
        }
    }
    
    isDrawing = false;
    drawBtn.disabled = false;
}

// Timer Logic
function updateTimerDisplay() {
    const m = Math.floor(remainingSeconds / 60).toString().padStart(2, '0');
    const s = (remainingSeconds % 60).toString().padStart(2, '0');
    timeText.textContent = `${m}:${s}`;
    
    if (remainingSeconds <= 0 && isTimerRunning) {
        timeText.parentElement.classList.add('danger');
    } else {
        timeText.parentElement.classList.remove('danger');
    }
}

function stopTimer() {
    clearInterval(timerInterval);
    isTimerRunning = false;
}

function startTimer() {
    if (remainingSeconds <= 0) return;
    isTimerRunning = true;
    
    // Web Audio requires user interaction to initialize. Clicking start is a good place.
    if(audioCtx.state === 'suspended') audioCtx.resume();
    
    timerInterval = setInterval(() => {
        remainingSeconds--;
        updateTimerDisplay();
        
        if (remainingSeconds <= 0) {
            stopTimer();
            playAlarm();
        }
    }, 1000);
}

timerBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        stopTimer();
        remainingSeconds = parseInt(btn.dataset.time);
        updateTimerDisplay();
        timeText.parentElement.classList.remove('danger');
    });
});

toggleTimerBtn.addEventListener('click', () => {
    if (isTimerRunning) {
        stopTimer();
    } else {
        startTimer();
    }
});

resetTimerBtn.addEventListener('click', () => {
    stopTimer();
    remainingSeconds = 0;
    updateTimerDisplay();
    timeText.parentElement.classList.remove('danger');
});

// Initialize dummy state
nameInput.value = "홍길동, 이순신, 강감찬, 유관순, 안중근, 윤동주, 김구, 김소월";
parseNames();
