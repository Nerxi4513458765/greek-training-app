// app.js - Полностью исправленная версия

// ========== ИНИЦИАЛИЗАЦИЯ TELEGRAM ==========
const tg = window.Telegram.WebApp;
tg.ready();
tg.expand();

// Настраиваем цвета под тему Telegram
document.body.style.setProperty('--tg-theme-bg-color', tg.themeParams.bg_color || '#0a0806');
document.body.style.setProperty('--tg-theme-text-color', tg.themeParams.text_color || '#e0d7c6');
document.body.style.setProperty('--tg-theme-button-color', tg.themeParams.button_color || '#b87333');
document.body.style.setProperty('--tg-theme-button-text-color', tg.themeParams.button_text_color || '#0a0806');

// ========== СОСТОЯНИЕ ПРИЛОЖЕНИЯ ==========
const state = {
    currentSection: 'welcome',
    currentWorkout: {
        name: 'Тренировка',
        exercises: [],
        notes: ''
    },
    history: [],
    templates: [],
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
function loadFromStorage() {
    try {
        const savedHistory = localStorage.getItem(`workouts_${state.user.id}`);
        if (savedHistory) {
            state.history = JSON.parse(savedHistory);
            console.log(`📚 Загружено ${state.history.length} тренировок`);
        }

        const savedTemplates = localStorage.getItem(`templates_${state.user.id}`);
        if (savedTemplates) {
            state.templates = JSON.parse(savedTemplates);
            console.log(`📋 Загружено ${state.templates.length} шаблонов`);
        }
    } catch (e) {
        console.error('❌ Ошибка загрузки:', e);
    }
}

// ========== СОХРАНЕНИЕ В ЛОКАЛЬНОЕ ХРАНИЛИЩЕ ==========
function saveToStorage() {
    try {
        localStorage.setItem(`workouts_${state.user.id}`, JSON.stringify(state.history));
        localStorage.setItem(`templates_${state.user.id}`, JSON.stringify(state.templates));
        console.log('💾 Данные сохранены');
    } catch (e) {
        console.error('❌ Ошибка сохранения:', e);
    }
}

// ========== ОТПРАВКА ДАННЫХ БОТУ ==========
function sendWorkoutToBot(workoutData) {
    try {
        const dataToSend = {
            type: 'new_workout',
            workout: workoutData
        };

        const jsonString = JSON.stringify(dataToSend);
        console.log('📤 Отправка боту:', jsonString);

        tg.sendData(jsonString);
        return true;
    } catch (error) {
        console.error('❌ Ошибка отправки:', error);
        return false;
    }
}

// ========== УДАЛЕНИЕ ТРЕНИРОВКИ ==========
function deleteWorkout(workoutId) {
    console.log('🗑️ Попытка удаления тренировки:', workoutId);

    tg.showPopup({
        title: '⚠️ Удаление',
        message: 'Точно удалить эту тренировку?',
        buttons: [
            { id: 'delete', type: 'destructive', text: 'Удалить' },
            { id: 'cancel', type: 'cancel', text: 'Отмена' }
        ]
    }, (buttonId) => {
        if (buttonId === 'delete') {
            console.log('✅ Подтверждено удаление');

            // Удаляем из локального хранилища
            state.history = state.history.filter(w => w.id !== workoutId);
            saveToStorage();

            // Отправляем команду боту
            try {
                tg.sendData(JSON.stringify({
                    type: 'delete_workout',
                    workout_id: workoutId
                }));
                console.log('✅ Команда удаления отправлена');

                tg.showPopup({
                    title: '✅ Удалено',
                    message: 'Тренировка удалена из хроник',
                    buttons: [{ type: 'ok' }]
                });

                showHistory();
            } catch (error) {
                console.error('❌ Ошибка отправки:', error);
            }
        }
    });
}

// ========== ОТОБРАЖЕНИЕ РАЗДЕЛОВ ==========
function showSection(section) {
    state.currentSection = section;

    menuCards.forEach(card => {
        const cardSection = card.dataset.section;
        card.classList.toggle('active', cardSection === section);
    });

    switch(section) {
        case 'today': showTodayTrial(); break;
        case 'workout': showWorkoutCreator(); break;
        case 'history': showHistory(); break;
        case 'oracle': showOracle(); break;
        default: showWelcome();
    }
}

// ========== ПРИВЕТСТВИЕ ==========
function showWelcome() {
    contentEl.innerHTML = `
        <div class="welcome-message">
            <h2 class="welcome-title">Да начнутся испытания, ${state.user.first_name}!</h2>
            <p class="welcome-text">Выбери раздел в меню выше, о смертный...</p>
            <div class="welcome-icon">🏛️</div>
        </div>
    `;
    actionBar.style.display = 'none';
}

// ========== ПОДВИГ ДНЯ ==========
function showTodayTrial() {
    const trials = [
        { name: 'Марафон Геродота', description: '5000 шагов или 30 минут бега', reward: '🏃‍♂️ +50 выносливости' },
        { name: 'Завтрак титанов', description: '100 отжиманий', reward: '💪 +30 силы' },
        { name: 'Камень Сизифа', description: 'Приседания с весом 4×15', reward: '🦵 +40 силы ног' },
        { name: 'Лук Одиссея', description: 'Тяга верхнего блока 3×12', reward: '🏹 +35 силы спины' },
        { name: 'Копьё Ахиллеса', description: 'Жим лёжа 5×5', reward: '🛡️ +50 силы груди' }
    ];

    const trial = trials[Math.floor(Math.random() * trials.length)];

    contentEl.innerHTML = `
        <div class="trial-container">
            <h2 class="trial-title">⚡ СЕГОДНЯШНЕЕ ИСПЫТАНИЕ</h2>
            <div class="trial-icon">🏛️</div>
            <h3 class="trial-name">${trial.name}</h3>
            <p class="trial-description">${trial.description}</p>
            <p class="trial-reward">${trial.reward}</p>
            <button class="trial-btn" onclick="acceptTrial('${trial.name}')">🏛️ ПРИНЯТЬ ИСПЫТАНИЕ</button>
        </div>
    `;
    actionBar.style.display = 'none';
}

// Принять испытание
window.acceptTrial = function(trialName) {
    showSection('workout');
};

// ========== СОЗДАТЕЛЬ ТРЕНИРОВОК ==========
function showWorkoutCreator() {
    let exercisesHtml = state.currentWorkout.exercises.length === 0
        ? '<p class="empty-message">⚡ Ещё нет упражнений. Начни свой подвиг!</p>'
        : state.currentWorkout.exercises.map((ex, i) => `
            <div class="exercise-item">
                <span class="exercise-name">🏹 ${ex.name}</span>
                <div class="exercise-details">
                    <span class="exercise-sets">${ex.sets}×${ex.reps}</span>
                    <span class="exercise-weight">${ex.weight} кг</span>
                </div>
                <button class="remove-exercise" onclick="removeExercise(${i})">✕</button>
            </div>
        `).join('');

    contentEl.innerHTML = `
        <h2 class="section-title">🏛️ СОЗДАНИЕ ПОДВИГА</h2>

        <div class="workout-name-section">
            <label for="workoutName" class="workout-label">📜 НАЗВАНИЕ ТРЕНИРОВКИ</label>
            <input type="text" id="workoutName" class="workout-name-input"
                   value="${state.currentWorkout.name}">
        </div>

        <div class="exercises-list">${exercisesHtml}</div>

        <button class="add-btn" onclick="showModal()">+ ДОБАВИТЬ УПРАЖНЕНИЕ</button>
    `;

    document.getElementById('workoutName').oninput = (e) => {
        state.currentWorkout.name = e.target.value || 'Тренировка';
    };

    actionBar.style.display = state.currentWorkout.exercises.length > 0 ? 'block' : 'none';
}

// Удалить упражнение
window.removeExercise = function(index) {
    state.currentWorkout.exercises.splice(index, 1);
    showWorkoutCreator();
};

// Показать модальное окно
window.showModal = function() {
    modal.classList.add('show');
};

// ========== ХРОНИКИ ==========
function showHistory() {
    if (state.history.length === 0) {
        contentEl.innerHTML = `
            <div class="empty-history">
                <h2 class="empty-title">📜 ХРОНИКИ ПУСТЫ</h2>
                <p class="empty-text">Твои подвиги ещё не записаны в свитки...</p>
                <button class="empty-btn" onclick="showSection('workout')">
                    🏛️ СОЗДАТЬ ПЕРВЫЙ ПОДВИГ
                </button>
            </div>
        `;
        actionBar.style.display = 'none';
        return;
    }

    // Группировка по датам
    const grouped = {};
    [...state.history].reverse().forEach(w => {
        const date = new Date(w.date).toLocaleDateString('ru-RU');
        if (!grouped[date]) grouped[date] = [];
        grouped[date].push(w);
    });

    const historyHtml = Object.entries(grouped).map(([date, workouts]) => `
        <h3 class="history-date-header">📅 ${date}</h3>
        ${workouts.map(w => `
            <div class="history-item">
                <div class="history-header">
                    <span class="history-name">🏛️ ${w.name}</span>
                    <span class="history-time">${new Date(w.date).toLocaleTimeString('ru-RU', {hour: '2-digit', minute:'2-digit'})}</span>
                </div>
                <div class="history-exercises">
                    ${w.exercises.slice(0,3).map(ex =>
                        `<div class="history-ex-item">• ${ex.name} (${ex.sets}×${ex.reps} × ${ex.weight}кг)</div>`
                    ).join('')}
                    ${w.exercises.length > 3 ? `<div class="history-ex-more">... и ещё ${w.exercises.length-3}</div>` : ''}
                </div>
                <div class="history-footer">
                    <span class="history-count">${w.exercises.length} упражнений</span>
                    <button class="history-delete" onclick="deleteWorkout('${w.id}')">🗑️</button>
                </div>
            </div>
        `).join('')}
    `).join('');

    const totalExercises = state.history.reduce((a, w) => a + w.exercises.length, 0);
    const totalWeight = Math.round(state.history.reduce((a, w) => a + w.exercises.reduce((s, ex) => s + ex.weight * ex.sets * ex.reps, 0), 0));

    contentEl.innerHTML = `
        <h2 class="section-title">📜 ХРОНИКИ ГЕРОЯ</h2>
        <div class="stats-bar">
            <div class="stat-item"><span class="stat-value">${state.history.length}</span><span class="stat-label">тренировок</span></div>
            <div class="stat-item"><span class="stat-value">${totalExercises}</span><span class="stat-label">упражнений</span></div>
            <div class="stat-item"><span class="stat-value">${totalWeight}</span><span class="stat-label">кг</span></div>
        </div>
        <div class="history-scroll">${historyHtml}</div>
    `;
    actionBar.style.display = 'none';
}

// ========== ОРАКУЛ ==========
function showOracle() {
    const prophecies = [
        "«Сила приходит не от мышц, а от духа, закалённого испытаниями»",
        "«Тень героя длиннее его тела, если герой много тренируется»",
        "«Ахиллес был уязвим лишь в пятку. Найди свою пятку и укрепи её»",
        "«Геракл начинал с одного камня. Ты начинаешь с одного подхода»"
    ];

    contentEl.innerHTML = `
        <div class="oracle-container">
            <h2 class="oracle-title">🔮 ИЗРЕЧЕНИЕ ОРАКУЛА</h2>
            <div class="oracle-icon">🏺</div>
            <p class="oracle-text">"${prophecies[Math.floor(Math.random() * prophecies.length)]}"</p>
            <p class="oracle-author">— Пифия, жрица Аполлона</p>
            <button class="oracle-btn" onclick="showOracle()">🎲 НОВОЕ ПРОРОЧЕСТВО</button>
        </div>
    `;
    actionBar.style.display = 'none';
}

// ========== МОДАЛЬНОЕ ОКНО ==========
modalForm.onsubmit = (e) => {
    e.preventDefault();

    const exercise = {
        name: document.getElementById('exName').value.trim(),
        sets: parseInt(document.getElementById('exSets').value) || 3,
        reps: parseInt(document.getElementById('exReps').value) || 10,
        weight: parseFloat(document.getElementById('exWeight').value) || 0
    };

    if (!exercise.name) {
        tg.showPopup({ title: 'Ошибка', message: 'Введите название упражнения!', buttons: [{ type: 'ok' }] });
        return;
    }

    state.currentWorkout.exercises.push(exercise);
    modal.classList.remove('show');
    modalForm.reset();
    showWorkoutCreator();
};

cancelModalBtn.onclick = () => {
    modal.classList.remove('show');
    modalForm.reset();
};

modal.onclick = (e) => {
    if (e.target === modal) {
        modal.classList.remove('show');
        modalForm.reset();
    }
};

// ========== СОХРАНЕНИЕ ==========
saveBtn.onclick = () => {
    if (state.currentWorkout.exercises.length === 0) {
        tg.showPopup({ title: 'Ошибка', message: 'Добавь хотя бы одно упражнение!', buttons: [{ type: 'ok' }] });
        return;
    }

    const workout = {
        id: Date.now().toString(),
        name: state.currentWorkout.name,
        date: new Date().toISOString(),
        exercises: [...state.currentWorkout.exercises],
        userId: state.user.id
    };

    state.history.push(workout);
    saveToStorage();
    sendWorkoutToBot(workout);

    state.currentWorkout = { name: 'Тренировка', exercises: [], notes: '' };
    showSection('history');
};

// ========== МЕНЮ ==========
menuCards.forEach(card => {
    card.onclick = () => showSection(card.dataset.section);
});

// ========== ИНИЦИАЛИЗАЦИЯ ==========
loadFromStorage();
showWelcome();
