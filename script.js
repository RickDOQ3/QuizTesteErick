// Variável global para armazenar as perguntas
let QUESTIONS = [];

// Carregar perguntas do arquivo JSON
async function loadQuestions() {
    try {
        const response = await fetch('questions.json');
        if (!response.ok) {
            throw new Error('Erro ao carregar perguntas');
        }
        QUESTIONS = await response.json();
    } catch (error) {
        console.error('Erro ao carregar perguntas:', error);
        // Fallback para perguntas básicas
        QUESTIONS = [{
            id: 1,
            nivel: "INICIANTE",
            pergunta: "Pergunta de fallback - Erro ao carregar arquivo JSON",
            opcoes: {"A": "Opção A", "B": "Opção B", "C": "Opção C", "D": "Opção D"},
            correta: "A",
            explicacao: "O arquivo questions.json não pôde ser carregado",
            hint: "Verifique se o arquivo questions.json existe"
        }];
    }
}

// Configurações do jogo
const CONFIG = {
    defaultQuestions: 20,
    defaultTimer: 30,
    defaultLives: 5,
    shuffleQuestions: true,
    shuffleOptions: true,
    enableSounds: true,
    enableMusic: false,
    currentMode: 'classic',
    currentTheme: 'dark',
    currentFont: 'Roboto'
};

// Estado do jogo
let gameState = {
    screen: 'start',
    questions: [],
    selectedQuestions: [],
    currentQuestionIndex: 0,
    score: 0,
    streak: 0,
    bestStreak: 0,
    lives: 5,
    startTime: null,
    endTime: null,
    timer: null,
    timeLeft: 30,
    isPaused: false,
    answeredQuestions: [],
    soundsEnabled: true,
    musicEnabled: false,
    gameMode: 'classic',
    timerInterval: null,
    // Sistema de volume refeito do zero
    volumeBgMusic: 0.3,
    volumeSfx: 1.0
};

// Elementos DOM
const elements = {
    // Telas
    startScreen: document.getElementById('start-screen'),
    quizScreen: document.getElementById('quiz-screen'),
    pauseScreen: document.getElementById('pause-screen'),
    resultsScreen: document.getElementById('results-screen'),
    
    // Botões
    startBtn: document.getElementById('start-btn'),
    nextBtn: document.getElementById('next-btn'),
    pauseBtn: document.getElementById('pause-btn'),
    resumeBtn: document.getElementById('resume-btn'),
    restartBtn: document.getElementById('restart-btn'),
    quitBtn: document.getElementById('quit-btn'),
    menuBtn: document.getElementById('menu-btn'),
    newGameBtn: document.getElementById('new-game-btn'),
    shareBtn: document.getElementById('share-btn'),
    hintBtn: document.getElementById('hint-btn'),
    skipBtn: document.getElementById('skip-btn'),
    
    // Configurações
    questionsCount: document.getElementById('questions-count'),
    timerSeconds: document.getElementById('timer-seconds'),
    livesCount: document.getElementById('lives-count'),
    shuffleQuestions: document.getElementById('shuffle-questions'),
    shuffleOptions: document.getElementById('shuffle-options'),
    soundToggle: document.getElementById('sound-toggle'),
    musicToggle: document.getElementById('music-toggle'),
    
    // Personalização
    themeOptions: document.querySelectorAll('.theme-option'),
    fontSelect: document.getElementById('font-select'),
    
    // Sons - URLs
    correctSoundUrl: document.getElementById('correct-sound-url'),
    wrongSoundUrl: document.getElementById('wrong-sound-url'),
    bgMusicUrl: document.getElementById('bg-music-url'),
    testCorrectBtn: document.getElementById('test-correct'),
    testWrongBtn: document.getElementById('test-wrong'),
    testMusicBtn: document.getElementById('test-music'),
    stopMusicBtn: document.getElementById('stop-music-btn'),
    
    // Elementos do quiz
    currentMode: document.getElementById('current-mode'),
    questionCounter: document.getElementById('question-counter'),
    scoreCounter: document.getElementById('score-counter'),
    livesCounter: document.getElementById('lives-counter'),
    timerCounter: document.getElementById('timer-counter'),
    livesContainer: document.getElementById('lives-container'),
    timerContainer: document.getElementById('timer-container'),
    progressFill: document.getElementById('progress-fill'),
    progressText: document.getElementById('progress-text'),
    currentLevel: document.getElementById('current-level'),
    scenario: document.getElementById('scenario'),
    questionText: document.getElementById('question-text'),
    optionA: document.getElementById('option-a'),
    optionB: document.getElementById('option-b'),
    optionC: document.getElementById('option-c'),
    optionD: document.getElementById('option-d'),
    optionButtons: document.querySelectorAll('.option-btn'),
    
    // Feedback
    feedbackContainer: document.getElementById('feedback-container'),
    resultText: document.getElementById('result-text'),
    feedbackText: document.getElementById('feedback-text'),
    
    // Pausa
    pauseMode: document.getElementById('pause-mode'),
    pauseQuestion: document.getElementById('pause-question'),
    pauseScore: document.getElementById('pause-score'),
    pauseTime: document.getElementById('pause-time'),
    pauseTip: document.getElementById('pause-tip'),
    
    // Resultados
    resultsMode: document.getElementById('results-mode'),
    finalScore: document.getElementById('final-score'),
    totalQuestions: document.getElementById('total-questions'),
    scorePercentage: document.getElementById('score-percentage'),
    scoreCircle: document.getElementById('score-circle'),
    totalTime: document.getElementById('total-time'),
    avgTime: document.getElementById('avg-time'),
    finalLives: document.getElementById('final-lives'),
    streak: document.getElementById('streak'),
    eloTitle: document.getElementById('elo-title'),
    eloMessage: document.getElementById('elo-message'),
    answersHistory: document.getElementById('answers-history'),
    
    // Modal
    hintModal: document.getElementById('hint-modal'),
    hintText: document.getElementById('hint-text'),
    modalClose: document.querySelector('.modal-close'),
    
    // Notificação
    notification: document.getElementById('notification'),
    notificationText: document.getElementById('notification-text'),
    notificationIcon: document.getElementById('notification-icon'),
    
    // Áudio
    correctSound: document.getElementById('correct-sound'),
    wrongSound: document.getElementById('wrong-sound'),
    clickSound: document.getElementById('click-sound'),
    bgMusic: document.getElementById('bg-music'),
    timerSound: document.getElementById('timer-sound'),
    
    // NOVO: Elementos do sistema de volume
    bgMusicVolume: document.getElementById('bg-music-volume'),
    sfxVolume: document.getElementById('sfx-volume'),
    bgMusicVolumeValue: document.getElementById('bg-music-volume-value'),
    sfxVolumeValue: document.getElementById('sfx-volume-value')
};

// Modos de jogo
const gameModes = {
    classic: {
        name: 'Clássico',
        hasTimer: false,
        hasLives: false,
        infinite: false,
        description: '20 perguntas aleatórias'
    },
    timer: {
        name: 'Corra Contra o Tempo',
        hasTimer: true,
        hasLives: false,
        infinite: false,
        description: 'Responda antes do tempo acabar!'
    },
    survival: {
        name: 'Sobrevivência',
        hasTimer: false,
        hasLives: true,
        infinite: false,
        description: '5 vidas - cada erro custa uma vida'
    },
    infinite: {
        name: 'Infinito',
        hasTimer: false,
        hasLives: false,
        infinite: true,
        description: 'Perguntas sem fim!'
    }
};

// Dicas gerais para o modo de pausa
const HINTS = [
    "Leia atentamente o cenário antes de responder.",
    "Considere todos os recursos mencionados na pergunta.",
    "Elimine as opções claramente erradas primeiro.",
    "Pense no timing do jogo (early, mid, late).",
    "Considere a composição dos times mencionada.",
    "Lembre-se dos fundamentos: farm > kills.",
    "Wave management é crucial para controle de mapa.",
    "Sempre respeite o Fog of War (névoa de guerra).",
    "Tracke o jungler inimigo pela posição dele.",
    "Adapte sua itemização ao time inimigo.",
    "Objetivos > kills (torres, dragão, barão).",
    "Posicionamento em teamfights é tudo.",
    "Conheça os powerspikes dos campeões.",
    "Use pings para se comunicar com o time.",
    "Não force jogadas quando atrás.",
    "Aproveite janelas de oportunidade (cooldowns).",
    "Faça recall no timing correto.",
    "Controle de visão ganha jogos.",
    "Não lute em desvantagem numérica.",
    "Paciência é uma virtude no LoL."
];

// Inicializar aplicação
async function init() {
    // Carregar configurações salvas
    loadSettings();
    
    // Carregar perguntas do JSON
    await loadQuestions();
    
    // Configurar eventos
    setupEventListeners();
    
    // Inicializar banco de perguntas
    gameState.questions = QUESTIONS;
    
    // Configurar sons padrão
    setupDefaultSounds();
    
    // Aplicar tema e fonte
    applyTheme(CONFIG.currentTheme);
    applyFont(CONFIG.currentFont);
    
    // Aplicar volumes configurados
    applyVolumes();
    
    // Mostrar notificação
    showNotification("Quiz do League of Legends carregado!", "info");
}

// Carregar configurações do localStorage
function loadSettings() {
    // Configurações básicas
    const savedTheme = localStorage.getItem('quizTheme');
    const savedFont = localStorage.getItem('quizFont');
    const savedShuffleQuestions = localStorage.getItem('shuffleQuestions');
    const savedShuffleOptions = localStorage.getItem('shuffleOptions');
    const savedQuestionsCount = localStorage.getItem('questionsCount');
    const savedTimerSeconds = localStorage.getItem('timerSeconds');
    const savedLivesCount = localStorage.getItem('livesCount');
    
    // Configurações de áudio
    const savedSoundsEnabled = localStorage.getItem('soundsEnabled');
    const savedMusicEnabled = localStorage.getItem('musicEnabled');
    
    // Configurações de volume
    const savedVolumeBgMusic = localStorage.getItem('volumeBgMusic');
    const savedVolumeSfx = localStorage.getItem('volumeSfx');
    
    // Aplicar configurações de tema
    if (savedTheme) {
        CONFIG.currentTheme = savedTheme;
        document.querySelectorAll('.theme-option').forEach(opt => {
            opt.classList.remove('active');
            if (opt.dataset.theme === savedTheme) {
                opt.classList.add('active');
            }
        });
    }
    
    // Aplicar configurações de fonte
    if (savedFont) {
        CONFIG.currentFont = savedFont;
        elements.fontSelect.value = savedFont;
    }
    
    // Aplicar configurações de jogo
    if (savedShuffleQuestions !== null) {
        CONFIG.shuffleQuestions = savedShuffleQuestions === 'true';
        elements.shuffleQuestions.checked = CONFIG.shuffleQuestions;
    }
    
    if (savedShuffleOptions !== null) {
        CONFIG.shuffleOptions = savedShuffleOptions === 'true';
        elements.shuffleOptions.checked = CONFIG.shuffleOptions;
    }
    
    if (savedQuestionsCount !== null) {
        CONFIG.defaultQuestions = parseInt(savedQuestionsCount);
        elements.questionsCount.value = CONFIG.defaultQuestions;
    }
    
    if (savedTimerSeconds !== null) {
        CONFIG.defaultTimer = parseInt(savedTimerSeconds);
        elements.timerSeconds.value = CONFIG.defaultTimer;
    }
    
    if (savedLivesCount !== null) {
        CONFIG.defaultLives = parseInt(savedLivesCount);
        elements.livesCount.value = CONFIG.defaultLives;
    }
    
    // Aplicar configurações de áudio
    if (savedSoundsEnabled !== null) {
        gameState.soundsEnabled = savedSoundsEnabled === 'true';
        updateSoundToggleButton();
    }
    
    if (savedMusicEnabled !== null) {
        gameState.musicEnabled = savedMusicEnabled === 'true';
        updateMusicToggleButton();
    }
    
    
    
    // Aplicar configurações de volume
    if (savedVolumeBgMusic !== null) {
        gameState.volumeBgMusic = parseFloat(savedVolumeBgMusic);
        if (elements.bgMusicVolume) {
            elements.bgMusicVolume.value = Math.round(gameState.volumeBgMusic * 100);
        }
        if (elements.bgMusicVolumeValue) {
            elements.bgMusicVolumeValue.textContent = `${Math.round(gameState.volumeBgMusic * 100)}%`;
        }
    }
    
    if (savedVolumeSfx !== null) {
        gameState.volumeSfx = parseFloat(savedVolumeSfx);
        if (elements.sfxVolume) {
            elements.sfxVolume.value = Math.round(gameState.volumeSfx * 100);
        }
        if (elements.sfxVolumeValue) {
            elements.sfxVolumeValue.textContent = `${Math.round(gameState.volumeSfx * 100)}%`;
        }
    }
}

// Salvar configurações no localStorage
function saveSettings() {
    // Configurações básicas
    localStorage.setItem('quizTheme', CONFIG.currentTheme);
    localStorage.setItem('quizFont', CONFIG.currentFont);
    localStorage.setItem('shuffleQuestions', CONFIG.shuffleQuestions);
    localStorage.setItem('shuffleOptions', CONFIG.shuffleOptions);
    localStorage.setItem('questionsCount', CONFIG.defaultQuestions);
    localStorage.setItem('timerSeconds', CONFIG.defaultTimer);
    localStorage.setItem('livesCount', CONFIG.defaultLives);
    
    // Configurações de áudio
    localStorage.setItem('soundsEnabled', gameState.soundsEnabled);
    localStorage.setItem('musicEnabled', gameState.musicEnabled);
    localStorage.setItem('correctSound', elements.correctSound.src);
    localStorage.setItem('wrongSound', elements.wrongSound.src);
    localStorage.setItem('bgMusic', elements.bgMusic.src);
    
    // Configurações de volume
    localStorage.setItem('volumeBgMusic', gameState.volumeBgMusic);
    localStorage.setItem('volumeSfx', gameState.volumeSfx);
}

// Configurar sons padrão
function setupDefaultSounds() {
    // Carregar todos os áudios
    [elements.correctSound, elements.wrongSound, elements.clickSound, elements.timerSound, elements.bgMusic].forEach(audio => {
        audio.load();
    });
}

// Configurar eventos
function setupEventListeners() {
    // Botão de iniciar
    elements.startBtn.addEventListener('click', startGame);
    
    // Modos de jogo
    document.querySelectorAll('.mode-card').forEach(card => {
        card.addEventListener('click', () => selectGameMode(card.dataset.mode));
    });
    
    // Configurações
    elements.questionsCount.addEventListener('change', (e) => {
        CONFIG.defaultQuestions = parseInt(e.target.value);
        saveSettings();
    });

    // Adicione após os outros event listeners de teste de som
    elements.stopMusicBtn.addEventListener('click', stopMusic);
    
    elements.timerSeconds.addEventListener('change', (e) => {
        CONFIG.defaultTimer = parseInt(e.target.value);
        saveSettings();
    });
    
    elements.livesCount.addEventListener('change', (e) => {
        CONFIG.defaultLives = parseInt(e.target.value);
        saveSettings();
    });
    
    elements.shuffleQuestions.addEventListener('change', (e) => {
        CONFIG.shuffleQuestions = e.target.checked;
        saveSettings();
    });
    
    elements.shuffleOptions.addEventListener('change', (e) => {
        CONFIG.shuffleOptions = e.target.checked;
        saveSettings();
    });
    
    // Personalização
    elements.themeOptions.forEach(option => {
        option.addEventListener('click', () => {
            const theme = option.dataset.theme;
            selectTheme(theme);
        });
    });
    
    elements.fontSelect.addEventListener('change', (e) => {
        const font = e.target.value;
        selectFont(font);
    });
    
    // Controles de volume - Sistema refeido
    elements.bgMusicVolume.addEventListener('input', (e) => {
        handleVolumeChange('bgMusic', e.target.value);
    });
    
    elements.sfxVolume.addEventListener('input', (e) => {
        handleVolumeChange('sfx', e.target.value);
    });
    
    // Sons
    elements.soundToggle.addEventListener('click', toggleSounds);
    elements.musicToggle.addEventListener('click', toggleMusic);
    
    
    
    // Testar sons
    elements.testCorrectBtn.addEventListener('click', () => testSound('correct'));
    elements.testWrongBtn.addEventListener('click', () => testSound('wrong'));
    elements.testMusicBtn.addEventListener('click', () => testSound('bgMusic'));
    
    // Quiz
    elements.optionButtons.forEach(btn => {
        btn.addEventListener('click', () => selectOption(btn.dataset.option));
    });
    
    elements.nextBtn.addEventListener('click', nextQuestion);
    elements.pauseBtn.addEventListener('click', pauseGame);
    elements.resumeBtn.addEventListener('click', resumeGame);
    elements.restartBtn.addEventListener('click', restartGame);
    elements.quitBtn.addEventListener('click', quitToMenu);
    elements.menuBtn.addEventListener('click', quitToMenu);
    elements.newGameBtn.addEventListener('click', newGame);
    elements.shareBtn.addEventListener('click', shareResults);
    elements.hintBtn.addEventListener('click', showHint);
    elements.skipBtn.addEventListener('click', skipQuestion);
    
    // Modal
    elements.modalClose.addEventListener('click', () => {
        elements.hintModal.classList.remove('show');
    });
    
    // Fechar modal ao clicar fora
    window.addEventListener('click', (e) => {
        if (e.target === elements.hintModal) {
            elements.hintModal.classList.remove('show');
        }
    });
}

// ============== SISTEMA DE VOLUME REFEITO DO ZERO ==============

// Manipular mudança de volume
// Modifique a função handleVolumeChange para incluir o feedback visual
function handleVolumeChange(type, value) {
    const volume = parseInt(value) / 100;
    
    if (type === 'bgMusic') {
        gameState.volumeBgMusic = volume;
        elements.bgMusicVolumeValue.textContent = `${value}%`;
        
        // Atualizar variável CSS para feedback visual
        document.documentElement.style.setProperty('--volume-percent', value);
        
        // Aplicar volume à música atual
        if (elements.bgMusic) {
            elements.bgMusic.volume = volume;
            
            // Se a música estiver tocando e o volume for 0, pausar
            if (volume === 0 && !elements.bgMusic.paused) {
                elements.bgMusic.pause();
                document.body.classList.remove('music-playing');
            }
            // Se a música não estiver tocando e o volume for > 0 e música habilitada, tocar
            else if (volume > 0 && elements.bgMusic.paused && gameState.musicEnabled) {
                playBackgroundMusic();
            }
        }
        
        // Atualizar estado visual do botão de música
        updateMusicToggleButton();
    } 
    else if (type === 'sfx') {
        gameState.volumeSfx = volume;
        elements.sfxVolumeValue.textContent = `${value}%`;
        
        // Aplicar volume a todos os efeitos sonoros
        [elements.correctSound, elements.wrongSound, elements.clickSound, elements.timerSound].forEach(audio => {
            if (audio) {
                audio.volume = volume;
            }
        });
    }
    
    // Salvar configurações
    saveSettings();
    
    // Mostrar notificação
    const label = type === 'bgMusic' ? 'Música' : 'Efeitos sonoros';
    showNotification(`${label}: ${value}%`, "info");
}

// Função para parar a música
function stopMusic() {
    playSound('click');
    stopBackgroundMusic();
    gameState.musicEnabled = false;
    updateMusicToggleButton();
    saveSettings();
    showNotification("Música parada", "info");
}

// Aplicar volumes configurados
function applyVolumes() {
    // Aplicar volume da música de fundo
    if (elements.bgMusic) {
        elements.bgMusic.volume = gameState.volumeBgMusic;
    }
    
    // Aplicar volume dos efeitos sonoros
    [elements.correctSound, elements.wrongSound, elements.clickSound, elements.timerSound].forEach(audio => {
        if (audio) {
            audio.volume = gameState.volumeSfx;
        }
    });
    
    // Atualizar valores exibidos
    if (elements.bgMusicVolumeValue) {
        elements.bgMusicVolumeValue.textContent = `${Math.round(gameState.volumeBgMusic * 100)}%`;
    }
    
    if (elements.sfxVolumeValue) {
        elements.sfxVolumeValue.textContent = `${Math.round(gameState.volumeSfx * 100)}%`;
    }
    
    // Atualizar posição dos sliders
    if (elements.bgMusicVolume) {
        elements.bgMusicVolume.value = Math.round(gameState.volumeBgMusic * 100);
    }
    
    if (elements.sfxVolume) {
        elements.sfxVolume.value = Math.round(gameState.volumeSfx * 100);
    }
}

// Atualizar botão de sons
function updateSoundToggleButton() {
    elements.soundToggle.classList.toggle('active', gameState.soundsEnabled);
    elements.soundToggle.innerHTML = gameState.soundsEnabled ? 
        '<i class="fas fa-volume-up"></i> Sons' : '<i class="fas fa-volume-mute"></i> Sons';
}

// Atualizar botão de música
function updateMusicToggleButton() {
    const isActive = gameState.musicEnabled && gameState.volumeBgMusic > 0;
    elements.musicToggle.classList.toggle('active', isActive);
    elements.musicToggle.innerHTML = isActive ? 
        '<i class="fas fa-music"></i> Música (Tocando)' : 
        '<i class="fas fa-music"></i> Música';
    
    // Adicionar/remover classe no body para feedback visual
    if (isActive && !elements.bgMusic.paused) {
        document.body.classList.add('music-playing');
    } else {
        document.body.classList.remove('music-playing');
    }
}

// ============== FIM DO SISTEMA DE VOLUME ==============

// Selecionar modo de jogo
function selectGameMode(mode) {
    CONFIG.currentMode = mode;
    
    // Atualizar seleção visual
    document.querySelectorAll('.mode-card').forEach(card => {
        card.classList.remove('active');
    });
    
    document.querySelector(`.mode-card[data-mode="${mode}"]`).classList.add('active');
    
    // Atualizar visibilidade das configurações
    const timerConfig = elements.timerSeconds.parentElement.parentElement;
    const livesConfig = elements.livesCount.parentElement.parentElement;
    
    switch(mode) {
        case 'timer':
            timerConfig.style.display = 'block';
            livesConfig.style.display = 'none';
            break;
        case 'survival':
            timerConfig.style.display = 'none';
            livesConfig.style.display = 'block';
            break;
        default:
            timerConfig.style.display = 'none';
            livesConfig.style.display = 'none';
    }
    
    showNotification(`Modo selecionado: ${gameModes[mode].name}`, "info");
}

// Selecionar tema
function selectTheme(theme) {
    CONFIG.currentTheme = theme;
    applyTheme(theme);
    
    // Atualizar seleção visual
    elements.themeOptions.forEach(opt => {
        opt.classList.remove('active');
    });
    
    document.querySelector(`.theme-option[data-theme="${theme}"]`).classList.add('active');
    
    saveSettings();
    showNotification(`Tema alterado: ${theme}`, "success");
}

// Aplicar tema
function applyTheme(theme) {
    // Remover todas as classes de tema
    document.body.classList.remove('theme-dark', 'theme-blue', 'theme-green', 'theme-purple', 'theme-red');
    
    // Adicionar nova classe
    document.body.classList.add(`theme-${theme}`);
}

// Selecionar fonte
function selectFont(font) {
    CONFIG.currentFont = font;
    applyFont(font);
    saveSettings();
    showNotification(`Fonte alterada: ${font}`, "success");
}

// Aplicar fonte
function applyFont(font) {
    if (font === 'Roboto' || font === 'Roboto Mono') {
        document.body.style.fontFamily = `${font}, sans-serif`;
    } else {
        document.body.style.fontFamily = `${font}, Arial, sans-serif`;
    }
}

// Alternar sons
function toggleSounds() {
    gameState.soundsEnabled = !gameState.soundsEnabled;
    updateSoundToggleButton();
    
    saveSettings();
    showNotification(`Sons ${gameState.soundsEnabled ? 'ativados' : 'desativados'}`, "info");
}

// Alternar música
function toggleMusic() {
    gameState.musicEnabled = !gameState.musicEnabled;
    updateMusicToggleButton();
    
    if (gameState.musicEnabled && gameState.volumeBgMusic > 0) {
        playBackgroundMusic();
    } else {
        stopBackgroundMusic();
    }
    
    saveSettings();
    showNotification(`Música ${gameState.musicEnabled ? 'ativada' : 'desativada'}`, "info");
}

// Atualizar som
function updateSound(type, url) {
    if (!url) return;
    
    try {
        let audioElement;
        switch(type) {
            case 'correct':
                audioElement = elements.correctSound;
                break;
            case 'wrong':
                audioElement = elements.wrongSound;
                break;
            case 'bgMusic':
                audioElement = elements.bgMusic;
                break;
        }
        
        audioElement.src = url;
        audioElement.load();
        
        // Reaplicar volume
        if (type === 'bgMusic') {
            audioElement.volume = gameState.volumeBgMusic;
        } else {
            audioElement.volume = gameState.volumeSfx;
        }
        
        saveSettings();
        showNotification(`Som ${type} atualizado`, "success");
    } catch (error) {
        showNotification(`Erro ao carregar som: ${error.message}`, "error");
    }
}

// Testar som
function testSound(type) {
    if (!gameState.soundsEnabled) {
        showNotification("Ative os sons primeiro!", "warning");
        return;
    }
    
    try {
        let audioElement;
        switch(type) {
            case 'correct':
                audioElement = elements.correctSound;
                break;
            case 'wrong':
                audioElement = elements.wrongSound;
                break;
            case 'bgMusic':
                audioElement = elements.bgMusic;
                break;
        }
        
        // Configurar volume
        if (type === 'bgMusic') {
            audioElement.volume = gameState.volumeBgMusic;
        } else {
            audioElement.volume = gameState.volumeSfx;
        }
        
        audioElement.currentTime = 0;
        audioElement.play().catch(e => {
            showNotification(`Erro ao testar som: ${e.message}`, "error");
        });
    } catch (error) {
        showNotification(`Erro ao testar som: ${error.message}`, "error");
    }
}

// Tocar música de fundo
// Tocar música de fundo
function playBackgroundMusic() {
    if (!gameState.musicEnabled || gameState.volumeBgMusic <= 0) return;
    
    try {
        elements.bgMusic.volume = gameState.volumeBgMusic;
        elements.bgMusic.play().then(() => {
            // Adicionar feedback visual quando a música começa a tocar
            document.body.classList.add('music-playing');
            updateMusicToggleButton();
            showNotification("Música de fundo iniciada", "success");
        }).catch(e => {
            console.log("Auto-play bloqueado:", e);
            // Remover feedback visual se não conseguir tocar
            document.body.classList.remove('music-playing');
            updateMusicToggleButton();
        });
    } catch (e) {
        console.log("Erro ao tocar música:", e);
        document.body.classList.remove('music-playing');
        updateMusicToggleButton();
    }
}

// Parar música de fundo
function stopBackgroundMusic() {
    elements.bgMusic.pause();
    elements.bgMusic.currentTime = 0;
    document.body.classList.remove('music-playing');
    updateMusicToggleButton();
}

// Tocar som
function playSound(type) {
    if (!gameState.soundsEnabled || gameState.volumeSfx <= 0) return;
    
    try {
        let sound;
        switch(type) {
            case 'correct':
                sound = elements.correctSound;
                break;
            case 'wrong':
                sound = elements.wrongSound;
                break;
            case 'click':
                sound = elements.clickSound;
                break;
            case 'timer':
                sound = elements.timerSound;
                break;
            default:
                return;
        }
        
        sound.volume = gameState.volumeSfx;
        sound.currentTime = 0;
        sound.play().catch(e => console.log("Erro ao tocar som:", e));
    } catch (e) {
        console.log("Erro no sistema de som:", e);
    }
}

// Iniciar jogo
function startGame() {
    playSound('click');
    
    // Configurar modo de jogo
    gameState.gameMode = CONFIG.currentMode;
    const mode = gameModes[gameState.gameMode];
    
    // Configurar estado do jogo
    gameState.currentQuestionIndex = 0;
    gameState.score = 0;
    gameState.streak = 0;
    gameState.bestStreak = 0;
    gameState.answeredQuestions = [];
    gameState.startTime = Date.now();
    gameState.endTime = null;
    gameState.isPaused = false;
    
    // Configurar baseado no modo
    if (mode.hasTimer) {
        gameState.timeLeft = CONFIG.defaultTimer;
        gameState.timerInterval = null;
    }
    
    if (mode.hasLives) {
        gameState.lives = CONFIG.defaultLives;
    } else {
        gameState.lives = 0;
    }
    
    // Selecionar perguntas
    selectQuestions();
    
    // Embaralhar opções se necessário
    if (CONFIG.shuffleOptions) {
        shuffleQuestionOptions();
    }
    
    // Atualizar interface para o modo
    updateInterfaceForMode();
    
    // Iniciar música de fundo
    if (gameState.musicEnabled && gameState.volumeBgMusic > 0) {
        playBackgroundMusic();
    }
    
    // Mudar para tela do quiz
    changeScreen('quiz');
    
    // Carregar primeira pergunta
    loadQuestion();
    
    showNotification(`Modo ${mode.name} iniciado!`, "success");
}

// Selecionar perguntas
function selectQuestions() {
    let questions = [...gameState.questions];
    
    // Embaralhar se necessário
    if (CONFIG.shuffleQuestions) {
        questions = shuffleArray(questions);
    }
    
    // Selecionar quantidade baseada no modo
    const mode = gameModes[gameState.gameMode];
    
    if (mode.infinite) {
        // Modo infinito: usar todas as perguntas em ordem aleatória
        gameState.selectedQuestions = questions;
    } else {
        // Outros modos: usar número configurado de perguntas
        const count = Math.min(CONFIG.defaultQuestions, questions.length);
        gameState.selectedQuestions = questions.slice(0, count);
    }
}

// Embaralhar opções das perguntas
function shuffleQuestionOptions() {
    gameState.selectedQuestions.forEach(question => {
        const options = question.opcoes;
        const entries = Object.entries(options);
        
        // Embaralhar as opções
        const shuffled = shuffleArray(entries);
        
        // Criar novo objeto de opções
        const newOptions = {};
        const letters = ['A', 'B', 'C', 'D'];
        
        shuffled.forEach(([oldLetter, text], i) => {
            const newLetter = letters[i];
            newOptions[newLetter] = text;
            
            // Atualizar resposta correta se necessário
            if (oldLetter === question.correta) {
                question.correta = newLetter;
            }
        });
        
        // Atualizar opções da pergunta
        question.opcoes = newOptions;
    });
}

// Atualizar interface para o modo
function updateInterfaceForMode() {
    const mode = gameModes[gameState.gameMode];
    
    // Atualizar indicadores de modo
    elements.currentMode.textContent = mode.name.toUpperCase();
    elements.resultsMode.textContent = mode.name.toUpperCase();
    elements.pauseMode.textContent = mode.name;
    
    // Mostrar/ocultar elementos baseados no modo
    if (mode.hasTimer) {
        elements.timerContainer.style.display = 'flex';
        elements.timerCounter.textContent = `${gameState.timeLeft}s`;
    } else {
        elements.timerContainer.style.display = 'none';
    }
    
    if (mode.hasLives) {
        elements.livesContainer.style.display = 'flex';
        elements.livesCounter.textContent = gameState.lives;
    } else {
        elements.livesContainer.style.display = 'none';
    }
    
    // Atualizar texto do botão de pular
    if (mode.infinite) {
        elements.skipBtn.innerHTML = '<i class="fas fa-forward"></i> Pular';
    } else {
        elements.skipBtn.innerHTML = '<i class="fas fa-forward"></i> Pular (-1 ponto)';
    }
}

// Carregar pergunta
function loadQuestion() {
    const question = gameState.selectedQuestions[gameState.currentQuestionIndex];
    const mode = gameModes[gameState.gameMode];
    
    // Atualizar informações da pergunta
    elements.currentLevel.textContent = question.nivel;
    elements.questionCounter.textContent = `${gameState.currentQuestionIndex + 1}${mode.infinite ? '' : '/' + gameState.selectedQuestions.length}`;
    elements.scoreCounter.textContent = gameState.score;
    
    // Atualizar vidas e timer
    if (mode.hasLives) {
        elements.livesCounter.textContent = gameState.lives;
    }
    
    if (mode.hasTimer) {
        elements.timerCounter.textContent = `${gameState.timeLeft}s`;
        startTimer();
    }
    
    // Atualizar progresso
    let progress;
    if (mode.infinite) {
        progress = Math.min((gameState.currentQuestionIndex / 50) * 100, 100);
    } else {
        progress = ((gameState.currentQuestionIndex) / gameState.selectedQuestions.length) * 100;
    }
    
    elements.progressFill.style.width = `${progress}%`;
    elements.progressText.textContent = `${Math.round(progress)}%`;
    
    // Separar cenário da pergunta
    const fullText = question.pergunta;
    const scenarioMatch = fullText.match(/\[CENÁRIO\](.*?)(?=\n\n|\n[A-Z]|$)/s);
    
    if (scenarioMatch) {
        elements.scenario.textContent = scenarioMatch[1].trim();
        elements.questionText.textContent = fullText.replace(scenarioMatch[0], '').trim();
    } else {
        elements.scenario.textContent = "";
        elements.questionText.textContent = fullText;
    }
    
    // Atualizar opções
    elements.optionA.textContent = question.opcoes.A;
    elements.optionB.textContent = question.opcoes.B;
    elements.optionC.textContent = question.opcoes.C;
    elements.optionD.textContent = question.opcoes.D;
    
    // Resetar botões de opção
    elements.optionButtons.forEach(btn => {
        btn.classList.remove('selected', 'correct', 'wrong', 'option-shake');
        btn.disabled = false;
    });
    
    // Esconder feedback
    elements.feedbackContainer.style.display = 'none';
    
    // Rolar para o topo
    window.scrollTo(0, 0);
}

// Iniciar timer
function startTimer() {
    if (gameState.timerInterval) {
        clearInterval(gameState.timerInterval);
    }
    
    gameState.timerInterval = setInterval(() => {
        if (!gameState.isPaused) {
            gameState.timeLeft--;
            elements.timerCounter.textContent = `${gameState.timeLeft}s`;
            
            // Efeito visual quando o tempo está acabando
            if (gameState.timeLeft <= 10) {
                elements.timerCounter.classList.add('timer-warning');
                
                // Som de alerta nos últimos 5 segundos
                if (gameState.timeLeft <= 5 && gameState.timeLeft > 0) {
                    playSound('timer');
                }
            }
            
            // Tempo esgotado
            if (gameState.timeLeft <= 0) {
                clearInterval(gameState.timerInterval);
                timeUp();
            }
        }
    }, 1000);
}

// Tempo esgotado
function timeUp() {
    const mode = gameModes[gameState.gameMode];
    
    // Parar timer
    clearInterval(gameState.timerInterval);
    
    // Desabilitar todas as opções
    elements.optionButtons.forEach(btn => {
        btn.disabled = true;
        
        // Mostrar resposta correta
        const question = gameState.selectedQuestions[gameState.currentQuestionIndex];
        if (btn.dataset.option === question.correta) {
            btn.classList.add('correct');
        }
    });
    
    // Registrar resposta errada
    gameState.answeredQuestions.push({
        question: gameState.selectedQuestions[gameState.currentQuestionIndex],
        answer: null,
        correct: false,
        reason: 'timeout'
    });
    
    // Atualizar pontuação baseada no modo
    if (mode.hasLives) {
        gameState.lives--;
        if (gameState.lives <= 0) {
            gameOver();
            return;
        }
    }
    
    // Resetar streak
    gameState.streak = 0;
    
    // Mostrar feedback
    showFeedback(false, "Tempo esgotado!", "Você demorou muito para responder! No LoL, timing é tudo.");
}

// Selecionar opção
function selectOption(selectedOption) {
    if (gameState.isPaused) return;
    
    playSound('click');
    
    const question = gameState.selectedQuestions[gameState.currentQuestionIndex];
    const isCorrect = selectedOption === question.correta;
    const mode = gameModes[gameState.gameMode];
    
    // Parar timer se existir
    if (mode.hasTimer) {
        clearInterval(gameState.timerInterval);
        elements.timerCounter.classList.remove('timer-warning');
    }
    
    // Desabilitar todos os botões
    elements.optionButtons.forEach(btn => {
        btn.disabled = true;
        
        // Destacar resposta correta
        if (btn.dataset.option === question.correta) {
            btn.classList.add('correct');
        }
        
        // Destacar resposta selecionada (se errada)
        if (btn.dataset.option === selectedOption && !isCorrect) {
            btn.classList.add('wrong');
            btn.classList.add('option-shake');
        }
    });
    
    // Destacar botão selecionado
    const selectedBtn = document.querySelector(`.option-btn[data-option="${selectedOption}"]`);
    selectedBtn.classList.add('selected');
    
    // Atualizar pontuação
    if (isCorrect) {
        gameState.score++;
        gameState.streak++;
        if (gameState.streak > gameState.bestStreak) {
            gameState.bestStreak = gameState.streak;
        }
        playSound('correct');
    } else {
        if (mode.hasLives) {
            gameState.lives--;
            if (gameState.lives <= 0) {
                gameOver();
                return;
            }
        }
        gameState.streak = 0;
        playSound('wrong');
    }
    
    // Registrar resposta
    gameState.answeredQuestions.push({
        question: question,
        answer: selectedOption,
        correct: isCorrect
    });
    
    // Mostrar feedback após delay
    setTimeout(() => {
        showFeedback(isCorrect, 
            isCorrect ? "CORRETO!" : "ERRADO!", 
            question.explicacao);
    }, 500);
}

// Mostrar feedback
function showFeedback(isCorrect, title, explanation) {
    // Atualizar elementos de feedback
    elements.resultText.textContent = title;
    elements.resultText.className = isCorrect ? "correct" : "wrong";
    elements.feedbackText.textContent = explanation;
    
    // Mostrar container de feedback
    elements.feedbackContainer.style.display = 'block';
    
    // Rolar para o feedback
    elements.feedbackContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Próxima pergunta
function nextQuestion() {
    playSound('click');
    
    gameState.currentQuestionIndex++;
    const mode = gameModes[gameState.gameMode];
    
    // Verificar se acabou o jogo
    if (mode.infinite) {
        // Modo infinito: sempre continua
        if (gameState.currentQuestionIndex >= gameState.selectedQuestions.length) {
            // Se acabaram as perguntas, recomeça com novas aleatórias
            selectQuestions();
            if (CONFIG.shuffleOptions) {
                shuffleQuestionOptions();
            }
            gameState.currentQuestionIndex = 0;
        }
    } else {
        // Outros modos: verificar se acabaram as perguntas
        if (gameState.currentQuestionIndex >= gameState.selectedQuestions.length) {
            finishGame();
            return;
        }
    }
    
    // Resetar timer se necessário
    if (mode.hasTimer) {
        gameState.timeLeft = CONFIG.defaultTimer;
    }
    
    // Carregar próxima pergunta
    loadQuestion();
}

// Pular pergunta
function skipQuestion() {
    playSound('click');
    
    const mode = gameModes[gameState.gameMode];
    
    // Penalidade no modo não infinito
    if (!mode.infinite) {
        gameState.score = Math.max(0, gameState.score - 1);
        showNotification("Pergunta pulada! -1 ponto", "warning");
    }
    
    // Registrar como pulada
    gameState.answeredQuestions.push({
        question: gameState.selectedQuestions[gameState.currentQuestionIndex],
        answer: null,
        correct: false,
        reason: 'skipped'
    });
    
    // Próxima pergunta
    nextQuestion();
}

// Mostrar dica
function showHint() {
    playSound('click');
    
    const question = gameState.selectedQuestions[gameState.currentQuestionIndex];
    const hint = question.hint || "Analise cuidadosamente todas as opções antes de escolher.";
    
    elements.hintText.textContent = hint;
    elements.hintModal.classList.add('show');
}

// Pausar jogo
function pauseGame() {
    playSound('click');
    
    gameState.isPaused = true;
    
    // Parar timer
    if (gameState.timerInterval) {
        clearInterval(gameState.timerInterval);
    }
    
    // Parar música temporariamente
    if (!elements.bgMusic.paused) {
        elements.bgMusic.pause();
    }
    
    // Atualizar informações na tela de pausa
    const mode = gameModes[gameState.gameMode];
    
    elements.pauseMode.textContent = mode.name;
    elements.pauseQuestion.textContent = `${gameState.currentQuestionIndex + 1}${mode.infinite ? '' : '/' + gameState.selectedQuestions.length}`;
    elements.pauseScore.textContent = gameState.score;
    
    if (mode.hasTimer) {
        elements.pauseTime.textContent = `${gameState.timeLeft}s`;
    } else {
        elements.pauseTime.textContent = "N/A";
    }
    
    // Selecionar dica aleatória
    const randomHint = HINTS[Math.floor(Math.random() * HINTS.length)];
    elements.pauseTip.textContent = randomHint;
    
    // Mudar para tela de pausa
    changeScreen('pause');
}

// Continuar jogo
function resumeGame() {
    playSound('click');
    
    gameState.isPaused = false;
    
    // Retomar música se estava tocando
    if (gameState.musicEnabled && gameState.volumeBgMusic > 0) {
        playBackgroundMusic();
    }
    
    // Retomar timer se necessário
    const mode = gameModes[gameState.gameMode];
    if (mode.hasTimer && gameState.timeLeft > 0) {
        startTimer();
    }
    
    // Voltar para tela do quiz
    changeScreen('quiz');
}

// Reiniciar jogo
function restartGame() {
    playSound('click');
    
    // Confirmar reinício
    if (!confirm("Tem certeza que quer reiniciar? Todo o progresso será perdido.")) {
        return;
    }
    
    // Parar música
    stopBackgroundMusic();
    
    // Reiniciar jogo
    startGame();
}

// Sair para menu
function quitToMenu() {
    playSound('click');
    
    // Confirmar saída
    if (gameState.currentQuestionIndex > 0) {
        if (!confirm("Tem certeza que quer sair? Todo o progresso será perdido.")) {
            return;
        }
    }
    
    // Parar música
    stopBackgroundMusic();
    
    // Voltar para tela inicial
    changeScreen('start');
}

// Game over
function gameOver() {
    const mode = gameModes[gameState.gameMode];
    
    // Parar timer se existir
    if (gameState.timerInterval) {
        clearInterval(gameState.timerInterval);
    }
    
    // Parar música
    stopBackgroundMusic();
    
    // Definir tempo final
    gameState.endTime = Date.now();
    
    // Mostrar mensagem de game over
    if (mode.hasLives && gameState.lives <= 0) {
        showNotification("Game Over! Suas vidas acabaram.", "error");
    }
    
    // Finalizar jogo
    finishGame();
}

// Finalizar jogo
function finishGame() {
    gameState.endTime = Date.now();
    
    // Parar timer se existir
    if (gameState.timerInterval) {
        clearInterval(gameState.timerInterval);
    }
    
    // Parar música
    stopBackgroundMusic();
    
    // Calcular estatísticas
    const totalTime = gameState.endTime - gameState.startTime;
    const minutes = Math.floor(totalTime / 60000);
    const seconds = Math.floor((totalTime % 60000) / 1000);
    
    const totalQuestions = gameState.gameMode === 'infinite' ? 
        gameState.currentQuestionIndex : 
        gameState.selectedQuestions.length;
    
    const avgTime = totalQuestions > 0 ? Math.floor(totalTime / totalQuestions / 1000) : 0;
    
    const scorePercentage = totalQuestions > 0 ? (gameState.score / totalQuestions) * 100 : 0;
    
    // Atualizar elementos de resultado
    elements.finalScore.textContent = gameState.score;
    elements.totalQuestions.textContent = totalQuestions;
    elements.scorePercentage.textContent = `${scorePercentage.toFixed(1)}%`;
    
    // Atualizar círculo de pontuação
    const circumference = 2 * Math.PI * 90;
    const offset = circumference - (scorePercentage / 100) * circumference;
    elements.scoreCircle.style.strokeDashoffset = offset;
    
    elements.totalTime.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    elements.avgTime.textContent = `${avgTime}s`;
    elements.finalLives.textContent = gameState.lives;
    elements.streak.textContent = gameState.bestStreak;
    
    // Calcular ELO
    const eloData = calculateElo(scorePercentage);
    elements.eloTitle.textContent = eloData.name;
    elements.eloMessage.textContent = eloData.message;
    
    // Gerar histórico de respostas
    generateAnswersHistory();
    
    // Mudar para tela de resultados
    changeScreen('results');
    
    // Mostrar notificação
    showNotification(`Quiz finalizado! Pontuação: ${gameState.score}/${totalQuestions}`, "success");
}

// Novo jogo
function newGame() {
    playSound('click');
    startGame();
}

// Compartilhar resultados
function shareResults() {
    playSound('click');
    
    const mode = gameModes[gameState.gameMode];
    const totalQuestions = gameState.gameMode === 'infinite' ? 
        gameState.currentQuestionIndex : 
        gameState.selectedQuestions.length;
    
    const shareText = `🏆 League of Legends Quiz - ${mode.name}
    
Pontuação: ${gameState.score}/${totalQuestions}
Modo: ${mode.name}
ELO Teórico: ${document.getElementById('elo-title').textContent}
    
Teste seus conhecimentos em: [URL_DO_SITE]`;
    
    // Copiar para área de transferência
    navigator.clipboard.writeText(shareText).then(() => {
        showNotification("Resultados copiados para a área de transferência!", "success");
    }).catch(err => {
        showNotification("Erro ao copiar resultados.", "error");
    });
}

// Calcular ELO
function calculateElo(percentage) {
    if (percentage <= 25) {
        return {
            name: "FERRO / BRONZE",
            message: "Você está jogando no automático. Precisa parar de olhar para a vida dos inimigos e começar a olhar para o mapa e minions."
        };
    } else if (percentage <= 50) {
        return {
            name: "PRATA / OURO",
            message: "Você entende o básico, mas toma decisões ruins sob pressão ou por ganância (greed). Foque em consistência."
        };
    } else if (percentage <= 75) {
        return {
            name: "PLATINA / ESMERALDA",
            message: "Bom conhecimento mecânico e teórico. Seus erros são de refino e adaptação a cenários complexos."
        };
    } else if (percentage <= 95) {
        return {
            name: "DIAMANTE / MESTRE",
            message: "Excelente leitura de jogo. Você entende os conceitos invisíveis (tempo, pressão, troca)."
        };
    } else {
        return {
            name: "CHALLENGER / PRO",
            message: "Conhecimento absoluto. Você está apto a ser Coach ou Shotcaller de alto nível."
        };
    }
}

// Gerar histórico de respostas
function generateAnswersHistory() {
    const historyContainer = elements.answersHistory;
    historyContainer.innerHTML = "";
    
    gameState.answeredQuestions.forEach((answer, index) => {
        const item = document.createElement('div');
        item.className = 'answer-item';
        
        const icon = document.createElement('div');
        icon.className = `answer-icon ${answer.correct ? 'correct' : 'wrong'}`;
        icon.innerHTML = answer.correct ? '<i class="fas fa-check"></i>' : '<i class="fas fa-times"></i>';
        
        const text = document.createElement('div');
        text.className = 'answer-text';
        
        let answerText;
        if (answer.reason === 'timeout') {
            answerText = `Pergunta ${index + 1}: Tempo esgotado`;
        } else if (answer.reason === 'skipped') {
            answerText = `Pergunta ${index + 1}: Pulada`;
        } else {
            answerText = `Pergunta ${index + 1}: ${answer.correct ? 'Correta' : 'Errada'} (${answer.answer})`;
        }
        
        text.textContent = answerText;
        
        item.appendChild(icon);
        item.appendChild(text);
        historyContainer.appendChild(item);
    });
}

// Mudar tela
function changeScreen(screenName) {
    // Esconder todas as telas
    elements.startScreen.classList.remove('active');
    elements.quizScreen.classList.remove('active');
    elements.pauseScreen.classList.remove('active');
    elements.resultsScreen.classList.remove('active');
    
    // Mostrar tela selecionada
    if (screenName === 'start') {
        elements.startScreen.classList.add('active');
    } else if (screenName === 'quiz') {
        elements.quizScreen.classList.add('active');
    } else if (screenName === 'pause') {
        elements.pauseScreen.classList.add('active');
    } else if (screenName === 'results') {
        elements.resultsScreen.classList.add('active');
    }
    
    gameState.screen = screenName;
}

// Mostrar notificação
function showNotification(message, type = "info") {
    // Configurar ícone e cor baseada no tipo
    let icon, color;
    switch(type) {
        case 'success':
            icon = 'fas fa-check-circle';
            color = '#4CAF50';
            break;
        case 'error':
            icon = 'fas fa-exclamation-circle';
            color = '#f44336';
            break;
        case 'warning':
            icon = 'fas fa-exclamation-triangle';
            color = '#ff9800';
            break;
        default:
            icon = 'fas fa-info-circle';
            color = '#2196F3';
    }
    
    elements.notificationIcon.className = icon;
    elements.notification.style.borderLeftColor = color;
    elements.notificationText.textContent = message;
    elements.notification.classList.add('show');
    
    // Esconder após 3 segundos
    setTimeout(() => {
        elements.notification.classList.remove('show');
    }, 3000);
}

// Funções utilitárias
function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

// Inicializar quando a página carregar
window.addEventListener('DOMContentLoaded', init);

// Salvar configurações ao fechar a página
window.addEventListener('beforeunload', saveSettings);