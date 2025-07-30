// Game State
var gameState = {
    money: 0,
    totalClicks: 0,
    totalEarned: 0,
    filmsCount: 0,
    filmCost: 1000000,
    baseClickPower: 1500,
    bubbles_popped: [0, 0, 0], // Wave 1, 2, 3
    current_promo: "",
    name: "",
    managers: {},
    filmography: [],
    achievements: [] // Unlocked achievement IDs
};

let bubblesActive = false;
let currentBubbleWave = 0;
let passiveIncomeInterval;

// Achievements Configuration
const ACHIEVEMENTS = [
    {
        id: "first_click",
        title: "ПЕРВЫЙ ШЛЕП",
        description: "Нажал на кнопку впервые. ТАК ШЛЕПАТЬ МОЖЕТ ТОЛЬКО РЕЖИССЕР-ШЛЕПАЛЬЩИК!",
        icon: "👆",
        checkCondition: () => gameState.totalClicks >= 1
    },
    {
        id: "hundred_clicks",
        title: "КЛИКЕР-ПРОФИ",
        description: "100 кликов! Пальцы как у пианиста, только для шлепков!",
        icon: "💪",
        checkCondition: () => gameState.totalClicks >= 100
    },
    {
        id: "first_film",
        title: "ДЕБЮТАНТ",
        description: "Снял первый фильм! Шлеп-шлеп, и готов шедевр!",
        icon: "🎬",
        checkCondition: () => gameState.filmsCount >= 1
    },
    {
        id: "millionaire",
        title: "ШЛЕП-МИЛЛИОНЕР",
        description: "Заработал миллион! Деньги липнут к рукам как шлепки!",
        icon: "💰",
        checkCondition: () => gameState.money >= 1000000
    },
    {
        id: "bubble_master",
        title: "МАСТЕР ПУЗЫРЕЙ",
        description: "Лопнул первый пузырь! Пап-пап-пап!",
        icon: "🎈",
        checkCondition: () => gameState.bubbles_popped.reduce((a, b) => a + b, 0) >= 1
    },
    {
        id: "manager_boss",
        title: "НАЧАЛЬНИК МЕНЕДЖЕРОВ",
        description: "Нанял первого менеджера! Теперь другие шлепают за тебя!",
        icon: "👔",
        checkCondition: () => Object.values(gameState.managers).some(m => m.hired)
    },
    {
        id: "upgrade_fan",
        title: "ЛЮБИТЕЛЬ АПГРЕЙДОВ",
        description: "Купил первое улучшение! Шлепаешь как профи!",
        icon: "⚡",
        checkCondition: () => UPGRADES.some(u => u.level > 0)
    },
    {
        id: "film_producer",
        title: "КИНОПРОДЮСЕР",
        description: "Снял 10 фильмов! Шлеп-империя растет!",
        icon: "🎭",
        checkCondition: () => gameState.filmsCount >= 10
    },
    {
        id: "bubble_destroyer",
        title: "ИСТРЕБИТЕЛЬ ПУЗЫРЕЙ",
        description: "Лопнул 15 пузырей! Пузыри боятся твоих шлепков!",
        icon: "💥",
        checkCondition: () => gameState.bubbles_popped.reduce((a, b) => a + b, 0) >= 15
    },
    {
        id: "big_money",
        title: "БОЛЬШИЕ ДЕНЬГИ",
        description: "Заработал 10 миллионов! Шлепки превратились в золото!",
        icon: "💎",
        checkCondition: () => gameState.money >= 10000000
    },
    {
        id: "click_machine",
        title: "МАШИНА ДЛЯ КЛИКОВ",
        description: "1000 кликов! Палец работает как автомат!",
        icon: "🤖",
        checkCondition: () => gameState.totalClicks >= 1000
    },
    {
        id: "cinema_empire",
        title: "КИНОИМПЕРИЯ",
        description: "Снял 50 фильмов! У тебя настоящая шлеп-империя!",
        icon: "🏰",
        checkCondition: () => gameState.filmsCount >= 50
    }
];

// Film Names
const FILM_NAMES = [
    "Пираты Московского моря",
    "Бегущий по тротуару 2025",
    "Титаник 2: Электро-Богалу",
    "Звездные войны: Месть сисадмина",
    "Матрица: Перезагрузка Windows",
    "Властелин WiFi",
    "Гарри Поттер и Философский камень препотствий",
    "Терминатор: Восстание принтеров",
    "Индиана Джонс и потерянный пароль",
];

// Film explanations for profit/loss
const PROFIT_EXPLANATIONS = [
    "фильм вышел в прокат по всему миру!",
    "фильм получил премию 'Оскар'!",
    "фильм стал хитом на стриминговых платформах!",
    "фильм собрал рекордную кассу в первые выходные!",
    "фильм получил отличные отзывы критиков!",
    "фильм стал культовым среди зрителей!",
    "фильм продали в 50 стран!",
    "фильм номинировали на 'Золотой глобус'!",
    "фильм стал самым популярным в этом году!"
];

const LOSS_EXPLANATIONS = [
    "рекламная кампания провалилась!",
    "фильм получил плохие отзывы!",
    "главный актер попал в скандал!",
    "конкуренты выпустили блокбастер в то же время!",
    "техническая проблема на премьере!",
    "цензура запретила показ в некоторых регионах!",
    "пиратские копии появились раньше релиза!",
    "неудачная дата выхода совпала с праздниками!",
    "бюджет превысил ожидания из-за пересъемок!"
];

// Upgrades Configuration
const UPGRADES = [
    {
        id: "camera",
        name: "📹 Камера",
        basePrice: 15000,
        basePower: 400,
        level: 0,
        priceMultiplier: 1.35,
    },
    {
        id: "lighting",
        name: "💡 Освещение",
        basePrice: 35000,
        basePower: 800,
        level: 0,
        priceMultiplier: 1.4,
    },
    {
        id: "actors",
        name: "🎭 Актеры",
        basePrice: 120000,
        basePower: 2200,
        level: 0,
        priceMultiplier: 1.5,
    },
    {
        id: "script",
        name: "📝 Сценарий",
        basePrice: 80000,
        basePower: 1600,
        level: 0,
        priceMultiplier: 1.38,
    },
    {
        id: "lightingEquipment",
        name: "💡 Световое оборудование",
        basePrice: 200000,
        basePower: 3000,
        level: 0,
        priceMultiplier: 1.6,
    },
    {
        id: "advertising",
        name: "📢 Реклама",
        basePrice: 450000,
        basePower: 5500,
        level: 0,
        priceMultiplier: 1.7,
    },
];

// Managers Configuration
const MANAGERS = [
    {
        id: "assistant",
        name: "🎬 Помощник режиссера",
        basePrice: 500000,
        baseIncome: 1000,
        level: 0,
        hired: false,
        priceMultiplier: 1.8,
    },
    {
        id: "producer",
        name: "🎯 Продюсер",
        basePrice: 2000000,
        baseIncome: 4000,
        level: 0,
        hired: false,
        priceMultiplier: 2.0,
    },
    {
        id: "distributor",
        name: "📦 Дистрибьютор",
        basePrice: 8000000,
        baseIncome: 15000,
        level: 0,
        hired: false,
        priceMultiplier: 2.2,
    },
    {
        id: "studio",
        name: "🏢 Студия",
        basePrice: 30000000,
        baseIncome: 50000,
        level: 0,
        hired: false,
        priceMultiplier: 2.5,
    },
];

// Leaderboard Data
let leaderboardData = [];

// Utility Functions
function formatNumber(num) {
    if (num >= 1000000000) {
        return (num / 1000000000).toFixed(1) + " Млрд";
    } else if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + " М";
    } else if (num >= 1000) {
        return (num / 1000).toFixed(1) + " К";
    }
    return Math.floor(num).toString();
}

function getUpgradePrice(upgrade) {
    return Math.floor(
        upgrade.basePrice *
            Math.pow(upgrade.priceMultiplier, upgrade.level),
    );
}

function getUpgradePower(upgrade) {
    return upgrade.basePower * upgrade.level;
}

function getTotalUpgradePower() {
    return UPGRADES.reduce(
        (total, upgrade) => total + getUpgradePower(upgrade),
        0,
    );
}

function getCurrentClickPower() {
    const basePower = gameState.baseClickPower;
    const upgradePower = getTotalUpgradePower();
    return basePower + upgradePower;
}

function getManagerPrice(manager) {
    if (!manager.hired) {
        return manager.basePrice;
    }
    return Math.floor(
        manager.basePrice *
            Math.pow(manager.priceMultiplier, manager.level),
    );
}

function getManagerIncome(manager) {
    if (!manager.hired) return 0;
    return Math.floor(
        manager.baseIncome * (1 + manager.level * 0.5),
    );
}

function getTotalPassiveIncome() {
    return MANAGERS.reduce(
        (total, manager) => total + getManagerIncome(manager),
        0,
    );
}

function startPassiveIncome() {
    if (passiveIncomeInterval) {
        clearInterval(passiveIncomeInterval);
    }

    const hasHiredManagers = MANAGERS.some(
        (manager) => manager.hired,
    );
    if (hasHiredManagers) {
        passiveIncomeInterval = setInterval(() => {
            const income = getTotalPassiveIncome();
            if (income > 0) {
                gameState.money += income;
                gameState.totalEarned += income;
                updateDisplay();
            }
        }, 1000);
    }
}

// Update Functions
function updateDisplay() {
    document.getElementById("moneyDisplay").textContent =
        `Бюджет: ${formatNumber(gameState.money)}`;
    document.getElementById("filmCost").textContent =
        `Стоимость: ${formatNumber(gameState.filmCost)}`;
    document.getElementById("filmButton").disabled =
        gameState.money < gameState.filmCost;

    // Update passive income display
    const passiveDisplay = document.getElementById(
        "passiveIncomeDisplay",
    );
    const totalPassiveIncome = getTotalPassiveIncome();
    if (totalPassiveIncome > 0) {
        passiveDisplay.textContent = `Пассивный доход: +${formatNumber(totalPassiveIncome)}/сек`;
        passiveDisplay.style.display = "block";
    } else {
        passiveDisplay.style.display = "none";
    }

    // Update stats
    document.getElementById("clickPowerStat").textContent =
        formatNumber(getCurrentClickPower());
    document.getElementById("filmsCountStat").textContent =
        gameState.filmsCount;
    document.getElementById("totalClicksStat").textContent =
        gameState.totalClicks;
    document.getElementById("totalEarnedStat").textContent =
        formatNumber(gameState.totalEarned);
}

function updateUpgrades() {
    const grid = document.getElementById("upgradesGrid");
    grid.innerHTML = "";

    UPGRADES.forEach((upgrade) => {
        const price = getUpgradePrice(upgrade);
        const power = upgrade.basePower;
        const canAfford = gameState.money >= price;

        const upgradeEl = document.createElement("div");
        upgradeEl.className = `upgrade-card ${canAfford ? "" : "disabled"}`;
        upgradeEl.innerHTML = `
                    <div class="upgrade-name">${upgrade.name}</div>
                    <div class="upgrade-level">Уровень: ${upgrade.level}</div>
                    <div class="upgrade-price">${formatNumber(price)}</div>
                    <div class="upgrade-effect">+${formatNumber(power)} за клик</div>
                `;

        if (canAfford) {
            upgradeEl.addEventListener("click", () =>
                buyUpgrade(upgrade),
            );
        }

        grid.appendChild(upgradeEl);
    });
}

function updateManagers() {
    const grid = document.getElementById("managersGrid");
    grid.innerHTML = "";

    MANAGERS.forEach((manager) => {
        const price = getManagerPrice(manager);
        const income = manager.hired
            ? getManagerIncome(manager)
            : manager.baseIncome;
        const canAfford = gameState.money >= price;

        const managerEl = document.createElement("div");
        managerEl.className = `manager-card ${canAfford ? "" : "disabled"}`;

        let statusText = manager.hired
            ? `Уровень: ${manager.level}`
            : "Не нанят";

        managerEl.innerHTML = `
                    <div class="manager-name">${manager.name}</div>
                    <div class="manager-level">${statusText}</div>
                    <div class="manager-price">${formatNumber(price)}</div>
                    <div class="manager-effect">+${formatNumber(income)}/сек</div>
                `;

        if (canAfford) {
            managerEl.addEventListener("click", () =>
                buyManager(manager),
            );
        }

        grid.appendChild(managerEl);
    });
}

// Game Actions
function handleClick() {
    const clickPower = getCurrentClickPower();
    gameState.money += clickPower;
    gameState.totalClicks++;
    gameState.totalEarned += clickPower;

    showClickEffect(clickPower);
    updateDisplay();
    updateUpgrades();
    updateManagers();
    saveGameState();
}

function showClickEffect(amount) {
    const button = document.getElementById("clickButton");
    const effect = document.createElement("div");
    effect.className = "click-effect";
    effect.textContent = `+${formatNumber(amount)}`;

    // Random position around button
    const rect = button.getBoundingClientRect();
    effect.style.left =
        rect.left +
        rect.width / 2 +
        (Math.random() - 0.5) * 100 +
        "px";
    effect.style.top =
        rect.top +
        rect.height / 2 +
        (Math.random() - 0.5) * 100 +
        "px";
    effect.style.position = "fixed";

    document.body.appendChild(effect);

    setTimeout(() => {
        effect.remove();
    }, 1000);
}

function makeFilm() {
    if (gameState.money < gameState.filmCost) return;

    const currentFilmCost = gameState.filmCost;
    gameState.money -= currentFilmCost;
    gameState.filmsCount++;

    // Random film outcome (-60% to +80%)
    const outcomePercent = Math.random() * 140 - 60;
    const profit = Math.floor(
        currentFilmCost * (outcomePercent / 100),
    );
    gameState.money += profit;

    // Choose film name and explanation
    const filmName = FILM_NAMES[Math.floor(Math.random() * FILM_NAMES.length)];
    let explanation;

    if (profit > 0) {
        explanation = PROFIT_EXPLANATIONS[Math.floor(Math.random() * PROFIT_EXPLANATIONS.length)];
    } else {
        explanation = LOSS_EXPLANATIONS[Math.floor(Math.random() * LOSS_EXPLANATIONS.length)];
    }

    // Save film to database
    saveFilmToDatabase(filmName, currentFilmCost, profit);

    // Show film result modal
    showFilmResultModal(filmName, profit, explanation);

    // Exponential cost increase
    let multiplier = 2.2 + gameState.filmsCount * 0.15;
    if (gameState.filmsCount > 5) multiplier += 0.5;
    if (gameState.filmsCount > 10) multiplier += 0.8;
    if (gameState.filmsCount > 15) multiplier += 1.2;

    gameState.filmCost = Math.floor(
        gameState.filmCost * multiplier,
    );

    // Check for bubbles
    if (shouldShowBubbles()) {
        setTimeout(() => startBubbleWave(), 2000);
    }

    updateDisplay();
    updateManagers();
    saveGameState();
}

function buyUpgrade(upgrade) {
    const price = getUpgradePrice(upgrade);
    if (gameState.money < price) return;

    gameState.money -= price;
    upgrade.level++;

    updateDisplay();
    updateUpgrades();
    updateManagers();
    saveGameState();
}

function buyManager(manager) {
    const price = getManagerPrice(manager);
    if (gameState.money < price) return;

    gameState.money -= price;

    if (!manager.hired) {
        manager.hired = true;
        manager.level = 1;
        startPassiveIncome();
    } else {
        manager.level++;
    }

    updateDisplay();
    updateManagers();
    saveGameState();
}

// Film Result Modal Functions
function showFilmResultModal(filmName, profit, explanation) {
    const modal = document.getElementById("filmResultModal");
    const titleEl = document.getElementById("filmResultTitle");
    const budgetEl = document.getElementById("filmResultBudget");
    const explanationEl = document.getElementById("filmResultExplanation");

    titleEl.textContent = filmName;

    if (profit > 0) {
        budgetEl.textContent = `+${formatNumber(profit)} Киношлепов`;
        budgetEl.className = "film-budget profit";
        explanationEl.textContent = `Вы получили +${formatNumber(profit)} Киношлепов - ${explanation}`;
    } else {
        budgetEl.textContent = `${formatNumber(profit)} Киношлепов`;
        budgetEl.className = "film-budget loss";
        explanationEl.textContent = `Вы потеряли ${formatNumber(Math.abs(profit))} Киношлепов - ${explanation}`;
    }

    modal.classList.add("show");
}

// Bubble Functions
function shouldShowBubbles() {
    if (bubblesActive) return false;

    if (
        gameState.filmsCount === 1 &&
        gameState.bubbles_popped[0] === 0
    ) {
        currentBubbleWave = 0;
        return true;
    }
    if (
        gameState.filmsCount === 3 &&
        gameState.bubbles_popped[1] === 0
    ) {
        currentBubbleWave = 1;
        return true;
    }
    if (
        gameState.filmsCount === 5 &&
        gameState.bubbles_popped[2] === 0
    ) {
        currentBubbleWave = 2;
        return true;
    }
    return false;
}

function createBubble() {
    const bubble = document.createElement("div");
    bubble.className = "bubble";
    bubble.style.left =
        Math.random() * (window.innerWidth - 60) + "px";
    bubble.style.bottom = "-60px";

    // Add random horizontal movement
    const randomX = (Math.random() - 0.5) * 100;
    bubble.style.setProperty("--random-x", randomX + "px");

    bubble.addEventListener("click", function (event) {
        popBubble(bubble, event);
    });

    document.body.appendChild(bubble);

    // Remove bubble after animation
    setTimeout(() => {
        if (bubble.parentNode) {
            bubble.remove();
        }
    }, 12000);
}

function popBubble(bubble, event) {
    if (bubble.classList.contains("bubble-pop")) return;

    // Get exact position where bubble was clicked
    const rect = bubble.getBoundingClientRect();
    const clickX = event ? event.clientX : rect.left + rect.width/2;
    const clickY = event ? event.clientY : rect.top + rect.height/2;

    bubble.classList.add("bubble-pop");
    gameState.bubbles_popped[currentBubbleWave]++;

    // Show discount effect at click position
    showDiscountEffect(clickX, clickY);

    setTimeout(() => {
        bubble.remove();
    }, 300);

    // Check if all bubbles are popped or if this is the last bubble
    checkBubbleWaveComplete();
}

function showDiscountEffect(x, y) {
    const effect = document.createElement("div");
    effect.className = "discount-effect";
    effect.textContent = "-1%";
    effect.style.position = "fixed";
    effect.style.left = x + "px";
    effect.style.top = y + "px";
    effect.style.pointerEvents = "none";
    effect.style.zIndex = "9999";
    effect.style.color = "#ffde59";
    effect.style.fontWeight = "900";
    effect.style.fontSize = "20px";
    effect.style.textShadow = "0 0 10px rgba(255, 222, 89, 0.8)";
    effect.style.animation = "floatUp 1s ease-out forwards";

    document.body.appendChild(effect);

    setTimeout(() => {
        effect.remove();
    }, 1000);
}

function startBubbleWave() {
    bubblesActive = true;
    let bubblesCreated = 0;
    const maxBubbles = 5;

    const bubbleInterval = setInterval(() => {
        if (bubblesCreated < maxBubbles) {
            createBubble();
            bubblesCreated++;
        } else {
            clearInterval(bubbleInterval);

            // Check if wave completed after 10 seconds
            setTimeout(() => {
                checkBubbleWaveComplete();
            }, 10000);
        }
    }, 1000);
}

function checkBubbleWaveComplete() {
    const poppedInCurrentWave =
        gameState.bubbles_popped[currentBubbleWave];
    const allBubblesPopped = poppedInCurrentWave === 5;
    const activeBubbles = document.querySelectorAll(
        ".bubble:not(.bubble-pop)",
    ).length;

    if (allBubblesPopped || activeBubbles === 0) {
        bubblesActive = false;
        showPromoModal();
    }
}

function showPromoModal() {
    const modal = document.getElementById("bubblePromoModal");
    const textEl = document.getElementById("promoModalText");
    const codeEl = document.getElementById("promoModalCode");

    let totalPopped = 0;
    let waveText = "";

    if (currentBubbleWave === 0) {
        totalPopped = gameState.bubbles_popped[0];
        waveText = `Вы лопнули ${totalPopped} пузырьков, за это вы получаете промокод на скидку ${totalPopped}%! Покупайте мерч на сайте или в наших социальных сетях!`;
    } else if (currentBubbleWave === 1) {
        totalPopped =
            gameState.bubbles_popped[0] +
            gameState.bubbles_popped[1];
        waveText = `Вы лопнули ${totalPopped} пузырьков, за это вы получаете промокод на скидку ${totalPopped}%! Покупайте мерч на сайте или в наших социальных сетях!`;
    } else if (currentBubbleWave === 2) {
        totalPopped =
            gameState.bubbles_popped[0] +
            gameState.bubbles_popped[1] +
            gameState.bubbles_popped[2];
        waveText = `Вы лопнули ${totalPopped} пузырьков, за это вы получаете промокод на скидку ${totalPopped}%! Покупайте мерч на сайте или в наших социальных сетях!`;
    }

    const promoCode = `CENTERCLIK${totalPopped}`;
    gameState.current_promo = promoCode;

    textEl.innerHTML = waveText;
    codeEl.textContent = promoCode;

    modal.classList.add("show");
    updatePromoDisplay();
    saveGameState();
}

function updatePromoDisplay() {
    const promoSection = document.getElementById("promoSection");
    const promoCode = document.getElementById("promoCode");

    if (gameState.current_promo) {
        promoSection.style.display = "block";
        promoCode.textContent = gameState.current_promo;
    } else {
        promoSection.style.display = "none";
    }
}

// Tab System
function initTabs() {
    const tabs = document.querySelectorAll(".tab");
    const tabContents = document.querySelectorAll(".tab-content");

    tabs.forEach((tab) => {
        tab.addEventListener("click", () => {
            const targetTab = tab.dataset.tab;

            tabs.forEach((t) => t.classList.remove("active"));
            tabContents.forEach((tc) => tc.classList.remove("active"));

            tab.classList.add("active");
            const targetContent = document.getElementById(targetTab + "Tab");
            if (targetContent) {
                targetContent.classList.add("active");
            }

            // Update specific tabs when opened
            if (targetTab === "achievements") {
                updateAchievementDisplay();
            } else if (targetTab === "leaderboard") {
                updateLeaderboard();
            } else if (targetTab === "filmography") {
                updateFilmography();
            }
        });
    });
}

// Leaderboard System
function updateLeaderboard() {
    fetch('/api/leaderboard')
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            const leaderboardTab = document.getElementById('leaderboardTab');
            if (!leaderboardTab) return;

            let leaderboardHTML = `
                <div class="section">
                    <div class="section-title">👑 Топ 5 игроков</div>
                    <div class="leaderboard-list">
            `;

            if (data.leaderboard.length === 0) {
                leaderboardHTML += `
                    <div class="leaderboard-empty">
                        Рейтинг пока пуст. Зарегистрируйтесь и станьте первым!
                    </div>
                `;
            } else {
                data.leaderboard.forEach(player => {
                    const rankEmoji = player.rank === 1 ? '🥇' : player.rank === 2 ? '🥈' : player.rank === 3 ? '🥉' : '🏅';
                    leaderboardHTML += `
                        <div class="leaderboard-item">
                            <div class="leaderboard-rank">${rankEmoji}<br>${player.rank}</div>
                            <div class="leaderboard-name">${player.name}</div>
                            <div class="leaderboard-money">${formatNumber(player.money)}</div>
                            <div class="leaderboard-films">${player.films_count} фильмов</div>
                        </div>
                    `;
                });
            }

            leaderboardHTML += `
                    </div>
                </div>
            `;

            leaderboardTab.innerHTML = leaderboardHTML;
        }
    })
    .catch(error => {
        console.error('Leaderboard load error:', error);
        // Show error message in leaderboard
        const leaderboardTab = document.getElementById('leaderboardTab');
        if (leaderboardTab) {
            leaderboardTab.innerHTML = `
                <div class="section">
                    <div class="section-title">👑 Топ 5 игроков</div>
                    <div class="leaderboard-empty">
                        Ошибка загрузки рейтинга. Попробуйте позже.
                    </div>
                </div>
            `;
        }
    });
}

// Reset game state function
function resetGameState() {
    gameState = {
        money: 0,
        totalClicks: 0,
        totalEarned: 0,
        filmsCount: 0,
        filmCost: 1000000,
        baseClickPower: 1500,
        bubbles_popped: [0, 0, 0],
        current_promo: "",
        name: "",
        managers: {},
        filmography: [],
        achievements: []
    };

    // Reset upgrades
    UPGRADES.forEach(upgrade => {
        upgrade.level = 0;
    });

    // Reset managers
    MANAGERS.forEach(manager => {
        manager.level = 0;
        manager.hired = false;
    });

    // Clear passive income
    if (passiveIncomeInterval) {
        clearInterval(passiveIncomeInterval);
        passiveIncomeInterval = null;
    }
}

// Save/Load System (Server-based)
function saveGameState() {
    const saveData = {
        ...gameState,
        upgrades: UPGRADES.reduce((obj, upgrade) => {
            obj[upgrade.id] = upgrade.level;
            return obj;
        }, {}),
        managers: MANAGERS.reduce((obj, manager) => {
            obj[manager.id] = {
                level: manager.level,
                hired: manager.hired,
            };
            return obj;
        }, {}),
    };

    fetch('/api/save_game', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(saveData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            console.log('Game saved successfully');
        } else {
            console.error('Save failed:', data.error);
        }
    })
    .catch(error => {
        console.error('Save error:', error);
    });
}

function loadGameState() {
    fetch('/api/load_game')
    .then(response => response.json())
    .then(data => {
        if (data.success && data.data) {
            const saveData = data.data;
            gameState.money = saveData.money || 0;
            gameState.totalClicks = saveData.totalClicks || 0;
            gameState.totalEarned = saveData.totalEarned || 0;
            gameState.filmsCount = saveData.filmsCount || 0;
            gameState.filmCost = saveData.filmCost || 1000000;
            gameState.bubbles_popped = saveData.bubbles_popped || [0, 0, 0];
            gameState.current_promo = saveData.current_promo || "";
            gameState.name = saveData.name || "";

            // Load upgrades
            if (saveData.upgrades) {
                UPGRADES.forEach((upgrade) => {
                    upgrade.level = saveData.upgrades[upgrade.id] || 0;
                });
            }

            // Load managers
            if (saveData.managers) {
                MANAGERS.forEach((manager) => {
                    const managerData = saveData.managers[manager.id];
                    if (managerData) {
                        manager.level = managerData.level || 0;
                        manager.hired = managerData.hired || false;
                    }
                });
            }

            // Start passive income if any managers are hired
            if (MANAGERS.some((manager) => manager.hired)) {
                startPassiveIncome();
            }

            // Update displays after loading
            updateDisplay();
            updateUpgrades();
            updateManagers();
            updatePromoDisplay();
        } else {
            console.log('No saved game found, starting fresh');
        }
    })
    .catch(error => {
        console.error('Load error:', error);
    });
}

// Countdown Timer Functions
function updateCountdown() {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Calculate next first day of month at 12:00
    let nextGiveaway = new Date(currentYear, currentMonth + 1, 1, 12, 0, 0);

    // If it's already past 12:00 on the 1st of current month, use next month
    if (now.getDate() === 1 && now.getHours() >= 12) {
        nextGiveaway = new Date(currentYear, currentMonth + 1, 1, 12, 0, 0);
    } else if (now.getDate() > 1 || (now.getDate() === 1 && now.getHours() >= 12)) {
        nextGiveaway = new Date(currentYear, currentMonth + 1, 1, 12, 0, 0);
    } else {
        nextGiveaway = new Date(currentYear, currentMonth, 1, 12, 0, 0);
    }

    const timeDiff = nextGiveaway - now;

    if (timeDiff > 0) {
        const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);

        const countdownEl = document.getElementById("countdownDisplay");
        if (countdownEl) {
            countdownEl.innerHTML = `
                <div class="countdown-unit">
                    <div class="countdown-number">${days}</div>
                    <div class="countdown-label">дней</div>
                </div>
                <div class="countdown-separator">:</div>
                <div class="countdown-unit">
                    <div class="countdown-number">${hours.toString().padStart(2, '0')}</div>
                    <div class="countdown-label">часов</div>
                </div>
                <div class="countdown-separator">:</div>
                <div class="countdown-unit">
                    <div class="countdown-number">${minutes.toString().padStart(2, '0')}</div>
                    <div class="countdown-label">минут</div>
                </div>
            `;
        }
    }
}

// Initialize game
document.addEventListener("DOMContentLoaded", function () {
    // Check if user is already logged in
    checkExistingLogin();

    // Set up registration modal
    setupRegistrationModal();

    // Initialize tabs
    initTabs();

    // Set up click button
    document.getElementById("clickButton").addEventListener("click", handleClick);

    // Set up film button  
    document.getElementById("filmButton").addEventListener("click", makeFilm);

    // Set up modal close buttons
    document.getElementById("continueFilmButton").addEventListener("click", () => {
        document.getElementById("filmResultModal").classList.remove("show");
    });

    document.getElementById("continueGameButton").addEventListener("click", () => {
        document.getElementById("bubblePromoModal").classList.remove("show");
    });

    // Load saved game data
    loadGameState();

    // Update displays
    updateDisplay();
    updateUpgrades();
    updateManagers();
    updatePromoDisplay();

    // Load achievements
    loadAchievements();

    // Start countdown timer
    updateCountdown();
    setInterval(updateCountdown, 1000);

    // Save every 30 seconds
    setInterval(saveGameState, 30000);

    // Check achievements every 5 seconds
    setInterval(checkAchievements, 5000);

    // Update leaderboard every 30 seconds
    setInterval(() => {
        const leaderboardTab = document.getElementById('leaderboardTab');
        if (leaderboardTab && leaderboardTab.classList.contains('active')) {
            updateLeaderboard();
        }
    }, 30000);
});

// Registration System
function setupRegistrationModal() {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const showRegisterButton = document.getElementById('showRegisterButton');
    const showLoginButton = document.getElementById('showLoginButton');

    // Switch between forms
    showRegisterButton.addEventListener('click', () => {
        loginForm.style.display = 'none';
        registerForm.style.display = 'block';
    });

    showLoginButton.addEventListener('click', () => {
        registerForm.style.display = 'none';
        loginForm.style.display = 'block';
    });

    // Login functionality
    const loginButton = document.getElementById('loginButton');
    const loginNameInput = document.getElementById('loginName');
    const loginPasswordInput = document.getElementById('loginPassword');
    const loginError = document.getElementById('loginError');

    loginButton.addEventListener('click', async () => {
        const name = loginNameInput.value.trim();
        const password = loginPasswordInput.value.trim();

        if (!name || !password) {
            showLoginError('Введите никнейм и пароль');
            return;
        }

        loginButton.disabled = true;
        loginButton.textContent = 'ВХОД...';

        try {
            const response = await fetch('/api/login_player', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name: name, password: password })
            });

            const data = await response.json();

            if (data.success) {
                // Reset game state for new user
                resetGameState();
                gameState.name = name;
                document.getElementById('registrationModal').classList.remove('show');

                // Load fresh data for this user
                setTimeout(() => {
                    loadGameState();
                    startGame();
                }, 100);
            } else {
                showLoginError(data.error || 'Неверный логин или пароль');
            }
        } catch (error) {
            console.error('Login error:', error);
            showLoginError('Ошибка подключения к серверу. Проверьте интернет и попробуйте еще раз.');
        } finally {
            loginButton.disabled = false;
            loginButton.textContent = 'ВОЙТИ';
        }
    });

    // Registration functionality
    const registerButton = document.getElementById('registerButton');
    const playerNameInput = document.getElementById('playerName');
    const playerPasswordInput = document.getElementById('playerPassword');
    const nameError = document.getElementById('nameError');

    registerButton.addEventListener('click', async () => {
        const name = playerNameInput.value.trim();
        const password = playerPasswordInput.value.trim();

        if (!name) {
            showNameError('Пожалуйста, введите никнейм');
            return;
        }

        if (name.length < 3) {
            showNameError('Никнейм должен содержать минимум 3 символа');
            return;
        }

        if (!password) {
            showNameError('Пожалуйста, введите пароль');
            return;
        }

        if (password.length < 4) {
            showNameError('Пароль должен содержать минимум 4 символа');
            return;
        }

        registerButton.disabled = true;
        registerButton.textContent = 'РЕГИСТРАЦИЯ...';

        try {
            const response = await fetch('/api/register_player', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name: name, password: password })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (data.success) {
                // Reset game state for new user
                resetGameState();
                gameState.name = name;
                document.getElementById('registrationModal').classList.remove('show');
                startGame();
            } else {
                showNameError(data.error || 'Ошибка регистрации');
            }
        } catch (error) {
            console.error('Registration error:', error);
            showNameError('Ошибка подключения к серверу. Проверьте интернет и попробуйте еще раз.');
        } finally {
            registerButton.disabled = false;
            registerButton.textContent = 'РЕГИСТРАЦИЯ';
        }
    });

    // Enter key support
    loginPasswordInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            loginButton.click();
        }
    });

    playerPasswordInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            registerButton.click();
        }
    });

    function showLoginError(message) {
        loginError.textContent = message;
        loginError.style.display = 'block';
        setTimeout(() => {
            loginError.style.display = 'none';
        }, 3000);
    }

    function showNameError(message) {
        nameError.textContent = message;
        nameError.style.display = 'block';
        setTimeout(() => {
            nameError.style.display = 'none';
        }, 3000);  
    }
}

function startGame() {
    // Game is now initialized and ready to play
    console.log('Game started with player:', gameState.name || 'Anonymous');

    // Show rules modal for new players
    setTimeout(() => {
        showRulesModal();
    }, 500);
}

function showRulesModal() {
    const modal = document.getElementById('rulesModal');
    if (modal) {
        modal.classList.add('show');

        // Add event listener for the start game button (remove existing listener first)
        const startGameButton = document.getElementById('startGameButton');
        if (startGameButton) {
            // Remove any existing event listeners
            startGameButton.replaceWith(startGameButton.cloneNode(true));
            const newStartGameButton = document.getElementById('startGameButton');
            newStartGameButton.addEventListener('click', () => {
                closeRulesModal();
            });
        }
    }
}

function closeRulesModal() {
    const modal = document.getElementById('rulesModal');
    if (modal) {
        modal.classList.remove('show');
    }
}

// Achievement System
function checkAchievements() {
    ACHIEVEMENTS.forEach(achievement => {
        if (!gameState.achievements.includes(achievement.id) && achievement.checkCondition()) {
            unlockAchievement(achievement.id);
        }
    });
}

function unlockAchievement(achievementId) {
    fetch('/api/unlock_achievement', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ achievement_id: achievementId })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success && data.new_achievement) {
            gameState.achievements.push(achievementId);
            updateAchievementDisplay();
            showAchievementNotification(achievementId);
        }
    })
    .catch(error => {
        console.error('Achievement unlock error:', error);
    });
}

function loadAchievements() {
    fetch('/api/get_achievements')
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            gameState.achievements = data.unlocked || [];
            updateAchievementDisplay();
        }
    })
    .catch(error => {
        console.error('Achievement load error:', error);
    });
}

let currentAchievementPage = 0;
const achievementsPerPage = 4;

function updateAchievementDisplay() {
    const achievementsTab = document.getElementById('achievementsTab');
    if (!achievementsTab) return;

    const totalPages = Math.ceil(ACHIEVEMENTS.length / achievementsPerPage);
    const startIndex = currentAchievementPage * achievementsPerPage;
    const endIndex = Math.min(startIndex + achievementsPerPage, ACHIEVEMENTS.length);

    let achievementsHTML = `
        <div class="section">
            <div class="section-title">🏆 Достижения (${gameState.achievements.length}/${ACHIEVEMENTS.length})</div>
            <div class="achievements-pagination">
                <button class="pagination-btn ${currentAchievementPage === 0 ? 'disabled' : ''}" onclick="changeAchievementPage(-1)">⬅️</button>
                <span class="pagination-info">Страница ${currentAchievementPage + 1} из ${totalPages}</span>
                <button class="pagination-btn ${currentAchievementPage === totalPages - 1 ? 'disabled' : ''}" onclick="changeAchievementPage(1)">➡️</button>
            </div>
            <div class="achievements-grid" id="achievementsGrid">
    `;

    for (let i = startIndex; i < endIndex; i++) {
        const achievement = ACHIEVEMENTS[i];
        const isUnlocked = gameState.achievements.includes(achievement.id);

        achievementsHTML += `
            <div class="achievement-card ${isUnlocked ? 'unlocked' : 'locked'}">
                <div class="achievement-icon">${achievement.icon}</div>
                <div class="achievement-content">
                    <div class="achievement-title">${achievement.title}</div>
                    <div class="achievement-description">${achievement.description}</div>
                    ${isUnlocked ? '<div class="achievement-status">✅ Получено</div>' : '<div class="achievement-status">🔒 Заблокировано</div>'}
                </div>
            </div>
        `;
    }

    achievementsHTML += `
            </div>
        </div>
    `;

    achievementsTab.innerHTML = achievementsHTML;
}

function changeAchievementPage(direction) {
    const totalPages = Math.ceil(ACHIEVEMENTS.length / achievementsPerPage);
    const newPage = currentAchievementPage + direction;

    if (newPage >= 0 && newPage < totalPages) {
        currentAchievementPage = newPage;
        updateAchievementDisplay();
    }
}

function showAchievementNotification(achievementId) {
    const achievement = ACHIEVEMENTS.find(a => a.id === achievementId);
    if (!achievement) return;

    const notification = document.createElement('div');
    notification.className = 'achievement-notification';
    notification.innerHTML = `
        <div class="achievement-notification-content">
            <div class="achievement-notification-icon">${achievement.icon}</div>
            <div class="achievement-notification-text">
                <div class="achievement-notification-title">Достижение получено!</div>
                <div class="achievement-notification-name">${achievement.title}</div>
            </div>
        </div>
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.classList.add('show');
    }, 100);

    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// Auto-login check
function checkExistingLogin() {
    fetch('/api/check_login')
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        if (data.success && data.logged_in) {
            resetGameState();
            gameState.name = data.username;
            document.getElementById('registrationModal').classList.remove('show');  
            setTimeout(() => {
                loadGameState();
                startGame();
            }, 100);
        }
    })
    .catch(error => {
        console.error('Login check error:', error);
        // Show registration modal on error
        const modal = document.getElementById('registrationModal');
        if (modal) {
            modal.classList.add('show');
        }
    });
}

// Save film to database
function saveFilmToDatabase(name, cost, profit) {
    fetch('/api/save_film', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            name: name,
            cost: cost,
            profit: profit
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            console.log('Film saved successfully');
            updateFilmography();
        } else {
            console.error('Film save failed:', data.error);
        }
    })
    .catch(error => {
        console.error('Film save error:', error);
    });
}

// Update filmography display
function updateFilmography() {
    fetch('/api/get_films')
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            const filmographyTab = document.getElementById('filmographyTab');
            if (!filmographyTab) return;

            let filmographyHTML = `
                <div class="section">
                    <div class="section-title">🎥 Фильмография</div>
                    <div class="filmography-list">
            `;

            if (!data.films || data.films.length === 0) {
                filmographyHTML += `
                    <div class="filmography-empty">
                        Вы еще не сняли ни одного фильма. Начните создавать свою киноимперию!
                    </div>
                `;
            } else {
                data.films.forEach(film => {
                    const profitClass = film.profit >= 0 ? 'profit' : 'loss';
                    const profitText = film.profit >= 0 ? `+${formatNumber(film.profit)}` : formatNumber(film.profit);

                    filmographyHTML += `
                        <div class="filmography-item">
                            <div class="film-name">${film.name}</div>
                            <div class="film-details">
                                <div class="film-cost">Бюджет: ${formatNumber(film.cost)}</div>
                                <div class="film-profit ${profitClass}">${profitText} киношлепов</div>
                            </div>
                        </div>
                    `;
                });
            }

            filmographyHTML += `
                    </div>
                </div>
            `;

            filmographyTab.innerHTML = filmographyHTML;
        } else {
            console.error('Filmography API error:', data.error);
            const filmographyTab = document.getElementById('filmographyTab');
            if (filmographyTab) {
                filmographyTab.innerHTML = `
                    <div class="section">
                        <div class="section-title">🎥 Фильмография</div>
                        <div class="filmography-empty">
                            Ошибка загрузки фильмографии. Попробуйте позже.
                        </div>
                    </div>
                `;
            }
        }
    })
    .catch(error => {
        console.error('Filmography load error:', error);
        const filmographyTab = document.getElementById('filmographyTab');
        if (filmographyTab) {
            filmographyTab.innerHTML = `
                <div class="section">
                    <div class="section-title">🎥 Фильмография</div>
                    <div class="filmography-empty">
                        Ошибка подключения к серверу. Попробуйте позже.
                    </div>
                </div>
            `;
        }
    });
}

// Make changeAchievementPage globally accessible
window.changeAchievementPage = changeAchievementPage;