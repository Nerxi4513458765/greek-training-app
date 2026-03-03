// app.js - ПОЛНАЯ ВЕРСИЯ С ПРАВИЛЬНЫМ УДАЛЕНИЕМ

// ========== ИНИЦИАЛИЗАЦИЯ ==========
const tg = window.Telegram.WebApp;
tg.ready();
tg.expand();

// ========== СОСТОЯНИЕ ==========
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

// ========== DOM ЭЛЕМЕНТЫ ==========
const contentEl = document.getElementById('content');
const menuCards = document.querySelectorAll('.menu-card');
const actionBar = document.getElementById('actionBar');
const saveBtn = document.getElementById('saveWorkoutBtn');
const modal = document.getElementById('exerciseModal');
const modalForm = document.getElementById('exerciseForm');
const cancelModalBtn = document.getElementById('cancelModal');

// ========== ХРАНИЛИЩЕ ==========
function loadFromStorage() {
    try {
        const savedHistory = localStorage.getItem(`workouts_${state.user.id}`);
        if (savedHistory) {
            state.history = JSON.parse(savedHistory);
            console.log(`📚 Загружено ${state.history.length} тренировок`);
        }
    } catch (e) {
        console.error('❌ Ошибка загрузки:', e);
    }
}

function saveToStorage() {
    localStorage.setItem(`workouts_${state.user.id}`, JSON.stringify(state.history));
}

// ========== ОТПРАВКА БОТУ ==========
function sendToBot(data) {
    try {
        tg.sendData(JSON.stringify(data));
        console.log('📤 Отправлено боту:', data);
        return true;
    } catch (error) {
        console.error('❌ Ошибка отправки:', error);
        return false;
    }
}

// ========== УДАЛЕНИЕ ТРЕНИРОВКИ ==========
window.deleteWorkout = function(workoutId) {
    console.log('🗑️ Попытка удаления тренировки с ID:', workoutId);

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

            // 1. Удаляем из локального хранилища
            const oldLength = state.history.length;
            state.history = state.history.filter(w => w.id !== workoutId);
            saveToStorage();
            console.log(`📊 Локальное хранилище: было ${oldLength}, стало ${state.history.length}`);

            // 2. Отправляем команду боту
            const success = sendToBot({
                type: 'delete_workout',
                workout_id: workoutId
            });

            if (success) {
                tg.showPopup({
                    title: '✅ Удалено',
                    message: 'Тренировка удалена из хроник',
                    buttons: [{ type: 'ok' }]
                });
            }

            // 3. Обновляем отображение
            showHistory();
        }
    });
};

// ========== НАВИГАЦИЯ ==========
function showSection(section) {
    state.currentSection = section;
    menuCards.forEach(c => c.classList.toggle('active', c.dataset.section === section));

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
            <p class="welcome-text">Выбери раздел в меню выше</p>
            <div class="welcome-icon">🏛️</div>
        </div>
    `;
    actionBar.style.display = 'none';
}

// ========== ПОДВИГ ДНЯ ==========
function showTodayTrial() {
    const trials = [
        { name: 'Марафон Геродота', desc: '5000 шагов или 30 мин бега' },
        { name: 'Завтрак титанов', desc: '100 отжиманий' }
    ];
    const t = trials[Math.floor(Math.random() * trials.length)];

    contentEl.innerHTML = `
        <div class="trial-container">
            <h2 class="trial-title">⚡ ПОДВИГ ДНЯ</h2>
            <div class="trial-icon">🏛️</div>
            <h3 class="trial-name">${t.name}</h3>
            <p class="trial-description">${t.desc}</p>
            <button class="trial-btn" onclick="showSection('workout')">🏛️ ПРИНЯТЬ</button>
        </div>
    `;
    actionBar.style.display = 'none';
}

// ========== СОЗДАТЕЛЬ ТРЕНИРОВОК ==========
function showWorkoutCreator() {
    let exercisesHtml = '';

    if (state.currentWorkout.exercises.length === 0) {
        exercisesHtml = '<p class="empty-message">❗ Ещё нет упражнений. Начни свой подвиг!</p>';
    } else {
        exercisesHtml = '<div class="exercises-list">';
        state.currentWorkout.exercises.forEach((ex, index) => {
            exercisesHtml += `
                <div class="exercise-item">
                    <span class="exercise-name">🏹 ${ex.name}</span>
                    <div class="exercise-details">
                        <span class="exercise-sets">${ex.sets}×${ex.reps}</span>
                        <span class="exercise-weight">${ex.weight} кг</span>
                    </div>
                    <button class="remove-exercise" onclick="removeExercise(${index})">✕</button>
                </div>
            `;
        });
        exercisesHtml += '</div>';
    }

    contentEl.innerHTML = `
        <h2 class="section-title">🏛️ СОЗДАНИЕ ПОДВИГА</h2>

        <div class="workout-name-section">
            <label for="workoutName" class="workout-label">📜 НАЗВАНИЕ ТРЕНИРОВКИ</label>
            <input type="text" id="workoutName" class="workout-name-input"
                   value="${state.currentWorkout.name}">
        </div>

        ${exercisesHtml}

        <button id="addExerciseBtn" class="add-btn">+ ДОБАВИТЬ УПРАЖНЕНИЕ</button>
    `;

    document.getElementById('workoutName').oninput = (e) => {
        state.currentWorkout.name = e.target.value || 'Тренировка';
    };

    document.getElementById('addExerciseBtn').onclick = () => {
        modal.classList.add('show');
    };

    actionBar.style.display = state.currentWorkout.exercises.length > 0 ? 'block' : 'none';
}

window.removeExercise = function(index) {
    state.currentWorkout.exercises.splice(index, 1);
    showWorkoutCreator();
};

// ========== ХРОНИКИ ==========
function showHistory() {
    if (state.history.length === 0) {
        contentEl.innerHTML = `
            <div class="empty-history">
                <h2 class="empty-title">📜 ХРОНИКИ ПУСТЫ</h2>
                <p class="empty-text">Твои подвиги ещё не записаны в свитки...</p>
                <button onclick="showSection('workout')" class="empty-btn">
                    🏛️ СОЗДАТЬ ПЕРВЫЙ ПОДВИГ
                </button>
            </div>
        `;
        actionBar.style.display = 'none';
        return;
    }

    // Группировка по датам
    const grouped = {};
    [...state.history].reverse().forEach(workout => {
        const date = new Date(workout.date).toLocaleDateString('ru-RU');
        if (!grouped[date]) grouped[date] = [];
        grouped[date].push(workout);
    });

    let html = '<div class="history-scroll">';

    Object.keys(grouped).forEach(date => {
        html += `<h3 class="history-date-header">📅 ${date}</h3>`;

        grouped[date].forEach(workout => {
            const time = new Date(workout.date).toLocaleTimeString('ru-RU', {
                hour: '2-digit',
                minute: '2-digit'
            });

            html += `
                <div class="history-item" data-id="${workout.id}">
                    <div class="history-header">
                        <span class="history-name">🏛️ ${workout.name}</span>
                        <span class="history-time">${time}</span>
                    </div>
                    <div class="history-exercises">
                        ${workout.exercises.slice(0,3).map(ex =>
                            `<div class="history-ex-item">• ${ex.name} (${ex.sets}×${ex.reps} × ${ex.weight}кг)</div>`
                        ).join('')}
                        ${workout.exercises.length > 3 ?
                            `<div class="history-ex-more">... и ещё ${workout.exercises.length-3}</div>` : ''}
                    </div>
                    <div class="history-footer">
                        <span class="history-count">${workout.exercises.length} упражнений</span>
                        <button class="history-delete" onclick="deleteWorkout('${workout.id}')">🗑️</button>
                    </div>
                </div>
            `;
        });
    });

    html += '</div>';

    // Статистика
    const totalEx = state.history.reduce((a, w) => a + w.exercises.length, 0);
    const totalWeight = Math.round(state.history.reduce((a, w) =>
        a + w.exercises.reduce((s, ex) => s + ex.weight * ex.sets * ex.reps, 0), 0));

    contentEl.innerHTML = `
        <h2 class="section-title">📜 ХРОНИКИ ГЕРОЯ</h2>

        <div class="stats-bar">
            <div class="stat-item"><span class="stat-value">${state.history.length}</span><span class="stat-label">тренировок</span></div>
            <div class="stat-item"><span class="stat-value">${totalEx}</span><span class="stat-label">упражнений</span></div>
            <div class="stat-item"><span class="stat-value">${totalWeight}</span><span class="stat-label">кг</span></div>
        </div>

        ${html}
    `;

    actionBar.style.display = 'none';
}

// ========== ОРАКУЛ ==========
function showOracle() {
    const prophecies = [
        "«Река Стикс течёт через каждого, кто не боится пота»",
        "«Сила приходит от духа, закалённого испытаниями»",
        "«Геракл начинал с одного камня»"
    ];

    contentEl.innerHTML = `
        <div class="oracle-container">
            <h2 class="oracle-title">🔮 ИЗРЕЧЕНИЕ ОРАКУЛА</h2>
            <div class="oracle-icon">🏺</div>
            <p class="oracle-text">"${prophecies[Math.floor(Math.random() * prophecies.length)]}"</p>
            <p class="oracle-author">— Пифия</p>
            <button class="oracle-btn" onclick="showOracle()">🎲 НОВОЕ ПРОРОЧЕСТВО</button>
        </div>
    `;
    actionBar.style.display = 'none';
}

// ========== МОДАЛКА ==========
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

    // Создаём временный ID для локального хранения
    const tempId = Date.now().toString();

    const workout = {
        id: tempId,
        name: state.currentWorkout.name || 'Тренировка',
        date: new Date().toISOString(),
        exercises: [...state.currentWorkout.exercises],
        userId: state.user.id
    };

    // Сохраняем локально
    state.history.push(workout);
    saveToStorage();

    // Отправляем боту
    sendToBot({
        type: 'new_workout',
        workout: {
            name: workout.name,
            exercises: workout.exercises,
            date: workout.date,
            client_id: tempId  // отправляем временный ID
        }
    });

    // Очищаем форму
    state.currentWorkout = { name: 'Тренировка', exercises: [], notes: '' };

    // Показываем подтверждение
    tg.showPopup({
        title: '✅ Сохранено',
        message: 'Тренировка отправлена боту',
        buttons: [{ type: 'ok' }]
    });

    showSection('history');
};

// ========== МЕНЮ ==========
menuCards.forEach(card => {
    card.onclick = () => showSection(card.dataset.section);
});

// ========== СТАРТ ==========
loadFromStorage();
showWelcome();