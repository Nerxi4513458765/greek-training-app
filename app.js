// app.js - Полная логика Mini App

// Инициализация Telegram Web App
const tg = window.Telegram.WebApp;

// Сообщаем Telegram, что приложение готово
tg.ready();

// Разворачиваем на весь экран
tg.expand();

// Настраиваем цвета под тему Telegram (если пользователь сменил тему)
document.body.style.setProperty('--tg-theme-bg-color', tg.themeParams.bg_color || '#0a0806');
document.body.style.setProperty('--tg-theme-text-color', tg.themeParams.text_color || '#e0d7c6');
document.body.style.setProperty('--tg-theme-button-color', tg.themeParams.button_color || '#b87333');
document.body.style.setProperty('--tg-theme-button-text-color', tg.themeParams.button_text_color || '#0a0806');

// ========== СОСТОЯНИЕ ПРИЛОЖЕНИЯ ==========
const state = {
    currentSection: 'welcome',
    currentWorkout: [],      // Текущая тренировка (упражнения)
    history: [],             // История тренировок
    user: tg.initDataUnsafe?.user || { id: 0, first_name: 'Герой' }
};

// ========== ЭЛЕМЕНТЫ DOM ==========
const contentEl = document.getElementById('content');
const menuCards = document.querySelectorAll('.menu-card');
const actionBar = document.getElementById('actionBar');
const saveBtn = document.getElementById('saveWorkoutBtn');
const modal = document.getElementById('exerciseModal');
const modalForm = document.getElementById('exerciseForm');
const cancelModalBtn = document.getElementById('cancelModal');

// ========== ЗАГРУЗКА СОХРАНЁННЫХ ДАННЫХ ==========
function loadHistory() {
    try {
        const saved = localStorage.getItem(`workouts_${state.user.id}`);
        if (saved) {
            state.history = JSON.parse(saved);
        }
    } catch (e) {
        console.error('Ошибка загрузки истории:', e);
    }
}

// ========== СОХРАНЕНИЕ ИСТОРИИ ==========
function saveHistory() {
    try {
        localStorage.setItem(`workouts_${state.user.id}`, JSON.stringify(state.history));
    } catch (e) {
        console.error('Ошибка сохранения истории:', e);
    }
}

// ========== ОТОБРАЖЕНИЕ РАЗДЕЛОВ ==========
function showSection(section) {
    state.currentSection = section;

    // Подсвечиваем активную карточку
    menuCards.forEach(card => {
        const cardSection = card.dataset.section;
        if (cardSection === section) {
            card.classList.add('active');
        } else {
            card.classList.remove('active');
        }
    });

    // Показываем соответствующий контент
    switch(section) {
        case 'today':
            showTodayTrial();
            break;
        case 'workout':
            showWorkoutCreator();
            break;
        case 'history':
            showHistory();
            break;
        case 'oracle':
            showOracle();
            break;
        default:
            showWelcome();
    }
}

// ========== ПРИВЕТСТВИЕ ==========
function showWelcome() {
    contentEl.innerHTML = `
        <div class="welcome-message">
            <h2>Да начнутся испытания, ${state.user.first_name}!</h2>
            <p>Выбери раздел в меню выше, о смертный...</p>
            <div style="margin-top: 30px; font-size: 60px; opacity: 0.5;">🏛️</div>
        </div>
    `;
    actionBar.style.display = 'none';
}

// ========== ПОДВИГ ДНЯ ==========
function showTodayTrial() {
    const trials = [
        {
            name: 'Марафон Геродота',
            description: '5000 шагов или 30 минут бега',
            reward: '🏃‍♂️ +50 выносливости'
        },
        {
            name: 'Завтрак титанов',
            description: '100 отжиманий (можно разбить на подходы)',
            reward: '💪 +30 силы'
        },
        {
            name: 'Камень Сизифа',
            description: 'Приседания с весом 4×15',
            reward: '🦵 +40 силы ног'
        }
    ];

    const randomTrial = trials[Math.floor(Math.random() * trials.length)];

    contentEl.innerHTML = `
        <div class="welcome-message">
            <h2>⚡ СЕГОДНЯШНЕЕ ИСПЫТАНИЕ</h2>
            <div style="font-size: 80px; margin: 20px 0;">🏛️</div>
            <h3 style="color: var(--gold); font-size: 32px;">${randomTrial.name}</h3>
            <p style="font-size: 20px; margin: 20px;">${randomTrial.description}</p>
            <p style="color: var(--bronze);">Награда: ${randomTrial.reward}</p>
        </div>
    `;
    actionBar.style.display = 'none';
}

// ========== СОЗДАТЕЛЬ ТРЕНИРОВОК ==========
function showWorkoutCreator() {
    let exercisesHtml = '';

    if (state.currentWorkout.length === 0) {
        exercisesHtml = '<p style="text-align: center; color: var(--bronze);">⚡ Ещё нет упражнений. Начни свой подвиг!</p>';
    } else {
        exercisesHtml = '<div class="exercises-list">';
        state.currentWorkout.forEach((ex, index) => {
            exercisesHtml += `
                <div class="exercise-item">
                    <span class="exercise-name">🏹 ${ex.name}</span>
                    <div class="exercise-details">
                        <span>${ex.sets}×${ex.reps}</span>
                        <span>${ex.weight} кг</span>
                    </div>
                    <button class="remove-exercise" data-index="${index}" style="background: none; border: none; color: var(--blood); font-size: 24px; cursor: pointer;">✕</button>
                </div>
            `;
        });
        exercisesHtml += '</div>';
    }

    contentEl.innerHTML = `
        <h2 style="font-family: 'Cinzel'; color: var(--gold); margin-bottom: 20px;">🏛️ СОЗДАНИЕ ПОДВИГА</h2>
        ${exercisesHtml}
        <button id="addExerciseBtn" style="width: 100%; padding: 15px; background: var(--bronze); border: none; border-radius: 10px; color: var(--primary-dark); font-family: 'Cinzel'; font-size: 18px; font-weight: 700; cursor: pointer; margin-top: 10px;">
            + ДОБАВИТЬ УПРАЖНЕНИЕ
        </button>
    `;

    // Показываем кнопку сохранения, если есть упражнения
    if (state.currentWorkout.length > 0) {
        actionBar.style.display = 'block';
    } else {
        actionBar.style.display = 'none';
    }

    // Добавляем обработчик для кнопки добавления
    document.getElementById('addExerciseBtn').onclick = () => {
        modal.classList.add('show');
    };

    // Добавляем обработчики для удаления
    document.querySelectorAll('.remove-exercise').forEach(btn => {
        btn.onclick = (e) => {
            const index = e.target.dataset.index;
            state.currentWorkout.splice(index, 1);
            showWorkoutCreator();
        };
    });
}

// ========== ИСТОРИЯ ТРЕНИРОВОК ==========
function showHistory() {
    if (state.history.length === 0) {
        contentEl.innerHTML = `
            <div class="welcome-message">
                <h2>📜 ХРОНИКИ ПУСТЫ</h2>
                <p>Твои подвиги ещё не записаны в свитки...</p>
                <p style="margin-top: 30px;">Создай первую тренировку в разделе "Чертог"</p>
            </div>
        `;
        actionBar.style.display = 'none';
        return;
    }

    let historyHtml = '<div style="max-height: 400px; overflow-y: auto;">';

    // Показываем последние 10 тренировок (свежие сверху)
    [...state.history].reverse().slice(0, 10).forEach((workout, idx) => {
        const date = new Date(workout.date);
        const formattedDate = date.toLocaleDateString('ru-RU', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        historyHtml += `
            <div class="exercise-item" style="flex-direction: column; align-items: stretch; margin-bottom: 15px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                    <span style="color: var(--gold);">📅 ${formattedDate}</span>
                    <span style="color: var(--bronze);">${workout.exercises.length} упр.</span>
                </div>
                <div style="font-size: 14px;">
                    ${workout.exercises.map(ex => `🏹 ${ex.name} (${ex.sets}×${ex.reps} × ${ex.weight}кг)`).join('<br>')}
                </div>
            </div>
        `;
    });

    historyHtml += '</div>';

    contentEl.innerHTML = `
        <h2 style="font-family: 'Cinzel'; color: var(--gold); margin-bottom: 20px;">📜 ПОСЛЕДНИЕ ХРОНИКИ</h2>
        ${historyHtml}
    `;
    actionBar.style.display = 'none';
}

// ========== ОРАКУЛ ==========
function showOracle() {
    const prophecies = [
        "«Сила приходит не от мышц, а от духа, закалённого испытаниями»",
        "«Тень героя длиннее его тела, если герой много тренируется»",
        "«Ахиллес был уязвим лишь в пятку. Найди свою пятку и укрепи её»",
        "«Геракл начинал с одного камня. Ты начинаешь с одного подхода»",
        "«Река Стикс течёт через каждого, кто не боится пота»",
        "«Олимп не покоряется за один день. Нужны годы тренировок»",
        "«Прометей принёс огонь. Ты принесёшь новые рекорды»"
    ];

    const randomProphecy = prophecies[Math.floor(Math.random() * prophecies.length)];

    contentEl.innerHTML = `
        <div class="welcome-message">
            <h2>🔮 ИЗРЕЧЕНИЕ ОРАКУЛА</h2>
            <div style="font-size: 60px; margin: 30px;">🏺</div>
            <p style="font-size: 24px; font-style: italic; color: var(--gold); margin: 30px 0;">
                "${randomProphecy}"
            </p>
            <p style="color: var(--bronze);">— Пифия, жрица Аполлона</p>
            <button id="newOracleBtn" style="margin-top: 30px; padding: 15px 30px; background: var(--bronze); border: none; border-radius: 10px; color: var(--primary-dark); font-family: 'Cinzel'; cursor: pointer;">
                🎲 Новое пророчество
            </button>
        </div>
    `;

    document.getElementById('newOracleBtn').onclick = showOracle;
    actionBar.style.display = 'none';
}

// ========== ОБРАБОТЧИК ФОРМЫ ДОБАВЛЕНИЯ УПРАЖНЕНИЯ ==========
modalForm.onsubmit = (e) => {
    e.preventDefault();

    const exercise = {
        name: document.getElementById('exName').value,
        sets: parseInt(document.getElementById('exSets').value),
        reps: parseInt(document.getElementById('exReps').value),
        weight: parseFloat(document.getElementById('exWeight').value)
    };

    state.currentWorkout.push(exercise);
    modal.classList.remove('show');
    modalForm.reset();
    showWorkoutCreator();
};

cancelModalBtn.onclick = () => {
    modal.classList.remove('show');
    modalForm.reset();
};

// Закрытие модалки по клику вне её
modal.onclick = (e) => {
    if (e.target === modal) {
        modal.classList.remove('show');
        modalForm.reset();
    }
};

// ========== СОХРАНЕНИЕ ТРЕНИРОВКИ ==========
saveBtn.onclick = () => {
    if (state.currentWorkout.length === 0) {
        tg.showPopup({
            title: 'Ошибка',
            message: 'Добавь хотя бы одно упражнение!',
            buttons: [{ type: 'ok' }]
        });
        return;
    }

    // Создаём запись о тренировке
    const workoutRecord = {
        date: new Date().toISOString(),
        exercises: [...state.currentWorkout],
        userId: state.user.id
    };

    // Добавляем в историю
    state.history.push(workoutRecord);
    saveHistory();

    // Отправляем данные боту
    tg.sendData(JSON.stringify({
        type: 'new_workout',
        workout: workoutRecord
    }));

    // Очищаем текущую тренировку
    state.currentWorkout = [];

    // Показываем сообщение об успехе
    tg.showPopup({
        title: 'Сохранено!',
        message: 'Тренировка записана в хроники.',
        buttons: [{ type: 'ok' }]
    });

    // Переходим на историю
    showSection('history');
};

// ========== ОБРАБОТЧИКИ МЕНЮ ==========
menuCards.forEach(card => {
    card.onclick = () => {
        const section = card.dataset.section;
        showSection(section);
    };
});

// ========== ИНИЦИАЛИЗАЦИЯ ПРИ ЗАГРУЗКЕ ==========
loadHistory();
showWelcome();

// Показываем приветственное сообщение от Telegram
tg.showPopup({
    title: 'Добро пожаловать в Чертог!',
    message: `Привет, ${state.user.first_name}! Тренируйся как герой, становись легендой.`,
    buttons: [{ type: 'ok' }]
});