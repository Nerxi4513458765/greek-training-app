// app.js - ПОЛНЫЙ КОД С КРАСИВЫМИ КНОПКАМИ

// ========== ИНИЦИАЛИЗАЦИЯ ==========
const tg = window.Telegram.WebApp;
tg.ready();
tg.expand();

// ========== СОСТОЯНИЕ ==========
const state = {
    currentSection: 'welcome',
    currentFocus: null,
    currentPlan: null,
    currentWorkout: {
        name: 'Тренировка',
        exercises: [],
        notes: ''
    },
    history: [],
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
        const saved = localStorage.getItem(`workouts_${state.user.id}`);
        if (saved) state.history = JSON.parse(saved);
    } catch (e) {}
}

function saveToStorage() {
    localStorage.setItem(`workouts_${state.user.id}`, JSON.stringify(state.history));
}

// ========== УДАЛЕНИЕ ==========
window.deleteWorkout = function(workoutDate, workoutName) {
    tg.showPopup({
        title: '⚠️ Удаление',
        message: `Точно удалить тренировку "${workoutName}"?`,
        buttons: [
            { id: 'delete', type: 'destructive', text: 'Удалить' },
            { id: 'cancel', type: 'cancel', text: 'Отмена' }
        ]
    }, (buttonId) => {
        if (buttonId === 'delete') {
            state.history = state.history.filter(w => w.date !== workoutDate);
            saveToStorage();
            tg.sendData(JSON.stringify({
                type: 'delete_workout_by_date',
                date: workoutDate
            }));
            showHistory();
        }
    });
};

// ========== НАВИГАЦИЯ ==========
function showSection(section) {
    state.currentSection = section;
    menuCards.forEach(c => c.classList.toggle('active', c.dataset.section === section));

    if (section === 'workout') showWorkoutCreator();
    else if (section === 'history') showHistory();
    else if (section === 'trainer') showTrainer();
    else if (section === 'today') showTodayTrial();
    else showWelcome();
}

// ========== ПРИВЕТСТВИЕ ==========
function showWelcome() {
    contentEl.innerHTML = `
        <div class="welcome-message">
            <h2 class="welcome-title">Да начнутся испытания, ${state.user.first_name}!</h2>
            <p class="welcome-text">Выбери раздел в меню</p>
            <div class="welcome-icon">🏛️</div>
        </div>
    `;
    actionBar.style.display = 'none';
}

// ========== ТОТ САМЫЙ ИНТЕРФЕЙС СОЗДАНИЯ ==========
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
                        <span>${ex.sets}×${ex.reps}</span>
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
            <label class="workout-label">📜 НАЗВАНИЕ ТРЕНИРОВКИ</label>
            <input type="text" id="workoutName" class="workout-name-input" value="${state.currentWorkout.name}">
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

    let html = '<div class="history-scroll">';

    [...state.history].reverse().forEach(w => {
        const date = new Date(w.date).toLocaleDateString('ru-RU');
        const time = new Date(w.date).toLocaleTimeString('ru-RU', {hour:'2-digit', minute:'2-digit'});

        html += `
            <div class="history-item">
                <div class="history-header">
                    <span class="history-name">🏛️ ${w.name}</span>
                    <span class="history-time">${date} ${time}</span>
                </div>
                <div class="history-exercises">
                    ${w.exercises.slice(0,3).map(ex =>
                        `<div class="history-ex-item">• ${ex.name} (${ex.sets}×${ex.reps} × ${ex.weight}кг)</div>`
                    ).join('')}
                    ${w.exercises.length > 3 ?
                        `<div class="history-ex-more">... и ещё ${w.exercises.length-3}</div>` : ''}
                </div>
                <div class="history-footer">
                    <span class="history-count">${w.exercises.length} упражнений</span>
                    <button class="history-delete" onclick="deleteWorkout('${w.date}', '${w.name}')">🗑️</button>
                </div>
            </div>
        `;
    });

    html += '</div>';

    const total = state.history.reduce((a, w) => a + w.exercises.length, 0);
    const weight = Math.round(state.history.reduce((a, w) => a + w.exercises.reduce((s, ex) => s + ex.weight * ex.sets * ex.reps, 0), 0));

    contentEl.innerHTML = `
        <h2 class="section-title">📜 ХРОНИКИ ГЕРОЯ</h2>
        <div class="stats-bar">
            <div class="stat-item">
                <span class="stat-value">${state.history.length}</span>
                <span class="stat-label">тренировок</span>
            </div>
            <div class="stat-item">
                <span class="stat-value">${total}</span>
                <span class="stat-label">упражнений</span>
            </div>
            <div class="stat-item">
                <span class="stat-value">${weight}</span>
                <span class="stat-label">кг</span>
            </div>
        </div>
        ${html}
    `;
    actionBar.style.display = 'none';
}

// ========== ПОДВИГ ДНЯ ==========
function showTodayTrial() {
    const trials = [
        { name: 'Марафон Геродота', desc: '5000 шагов или 30 мин бега', reward: '🏃 +50 выносливости' },
        { name: 'Завтрак титанов', desc: '100 отжиманий', reward: '💪 +30 силы' },
        { name: 'Камень Сизифа', desc: 'Приседания 4×15', reward: '🦵 +40 силы ног' }
    ];
    const t = trials[Math.floor(Math.random() * trials.length)];

    contentEl.innerHTML = `
        <div class="trial-container">
            <h2 class="trial-title">⚡ ПОДВИГ ДНЯ</h2>
            <div class="trial-icon">🏛️</div>
            <h3 class="trial-name">${t.name}</h3>
            <p class="trial-description">${t.desc}</p>
            <p class="trial-reward">${t.reward}</p>
            <button onclick="showSection('workout')" class="trial-btn">🏛️ ПРИНЯТЬ</button>
        </div>
    `;
    actionBar.style.display = 'none';
}

// ========== ТРЕНЕР ==========
function showTrainer() {
    contentEl.innerHTML = `
        <div class="trainer-container">
            <h2 class="section-title">🏋️ ПЕРСОНАЛЬНЫЙ ТРЕНЕР</h2>

            <div class="focus-section">
                <h3 class="focus-title">Выбери фокус недели:</h3>
                <div class="focus-grid">
                    <button class="focus-btn" data-focus="грудь">💪 ГРУДЬ</button>
                    <button class="focus-btn" data-focus="спина">🔱 СПИНА</button>
                    <button class="focus-btn" data-focus="ноги">🦵 НОГИ</button>
                    <button class="focus-btn" data-focus="плечи">🏔️ ПЛЕЧИ</button>
                    <button class="focus-btn" data-focus="руки">💪 РУКИ</button>
                    <button class="focus-btn" data-focus="все">⚖️ БАЛАНС</button>
                </div>
            </div>

            <div id="weeklyPlan" class="weekly-plan">
                <div class="plan-placeholder">
                    <p>Выбери фокус и нажми кнопку</p>
                </div>
            </div>

            <button id="generatePlanBtn" class="trainer-btn">🎯 СГЕНЕРИРОВАТЬ ПЛАН</button>
        </div>
    `;

    document.querySelectorAll('.focus-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.focus-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            state.currentFocus = this.dataset.focus;
        });
    });

    document.getElementById('generatePlanBtn').addEventListener('click', () => {
        if (!state.currentFocus) {
            tg.showPopup({
                title: '⚠️ Внимание',
                message: 'Сначала выбери фокус недели!',
                buttons: [{ type: 'ok' }]
            });
            return;
        }

        document.getElementById('weeklyPlan').innerHTML = '<div class="loading">⚡ Генерирую план...</div>';
        tg.sendData(JSON.stringify({ type: 'get_plan', focus: state.currentFocus }));
    });

    actionBar.style.display = 'none';
}

// ========== ОТОБРАЖЕНИЕ ПЛАНА ==========
window.displayWeeklyPlan = function(plan) {
    state.currentPlan = plan;

    let html = '<div class="plan-container">';
    const days = ['понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота', 'воскресенье'];

    days.forEach(day => {
        if (plan[day]) {
            html += `
                <div class="day-card ${plan[day].exercises.length === 0 ? 'rest-day' : ''}">
                    <div class="day-header">
                        <h3>${plan[day].name || day}</h3>
                        ${plan[day].exercises.length > 0 ?
                            '<button class="edit-day-btn" onclick="editDay(\'' + day + '\')">✎</button>' :
                            '<span class="rest-badge">😴 ОТДЫХ</span>'}
                    </div>
            `;

            if (plan[day].exercises.length > 0) {
                html += '<div class="day-exercises">';
                plan[day].exercises.forEach((ex, idx) => {
                    html += `
                        <div class="exercise-card">
                            <span class="exercise-name">${ex.name}</span>
                            <span class="exercise-details">${ex.sets}×${ex.reps}</span>
                            <span class="exercise-weight">${ex.weight} кг</span>
                            <button class="edit-exercise-btn" onclick="editExercise('${day}', ${idx})">✎</button>
                        </div>
                    `;
                });
                html += '</div>';
            }
            html += '</div>';
        }
    });

    html += '</div>';

    html += `
        <div class="plan-actions">
            <button onclick="usePlan()" class="save-plan-btn">💾 ИСПОЛЬЗОВАТЬ ПЛАН</button>
            <button onclick="resetPlan()" class="reset-plan-btn">🔄 НОВЫЙ ПЛАН</button>
        </div>
    `;

    document.getElementById('weeklyPlan').innerHTML = html;
};

// ========== РЕДАКТИРОВАНИЕ ==========
window.editExercise = function(day, exerciseIdx) {
    const exercise = state.currentPlan[day].exercises[exerciseIdx];

    document.getElementById('exName').value = exercise.name;
    document.getElementById('exSets').value = exercise.sets;
    document.getElementById('exReps').value = exercise.reps;
    document.getElementById('exWeight').value = exercise.weight;

    modal.classList.add('show');

    window.saveEditedExercise = function() {
        exercise.name = document.getElementById('exName').value;
        exercise.sets = parseInt(document.getElementById('exSets').value);
        exercise.reps = parseInt(document.getElementById('exReps').value);
        exercise.weight = parseInt(document.getElementById('exWeight').value);

        displayWeeklyPlan(state.currentPlan);
        modal.classList.remove('show');
    };
};

window.usePlan = function() {
    state.currentWorkout.exercises = [];
    const days = ['понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота', 'воскресенье'];

    days.forEach(day => {
        if (state.currentPlan[day]?.exercises) {
            state.currentWorkout.exercises.push(...state.currentPlan[day].exercises);
        }
    });

    state.currentWorkout.name = `План: ${state.currentFocus || 'баланс'}`;
    showSection('workout');
};

window.resetPlan = function() {
    document.querySelectorAll('.focus-btn').forEach(b => b.classList.remove('active'));
    state.currentFocus = null;
    state.currentPlan = null;
    showTrainer();
};

// ========== МОДАЛКА ==========
modalForm.onsubmit = (e) => {
    e.preventDefault();

    const ex = {
        name: document.getElementById('exName').value.trim(),
        sets: parseInt(document.getElementById('exSets').value) || 3,
        reps: parseInt(document.getElementById('exReps').value) || 10,
        weight: parseFloat(document.getElementById('exWeight').value) || 0
    };

    if (!ex.name) return;

    state.currentWorkout.exercises.push(ex);
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
    if (state.currentWorkout.exercises.length === 0) return;

    const workout = {
        id: Date.now().toString(),
        name: state.currentWorkout.name,
        date: new Date().toISOString(),
        exercises: [...state.currentWorkout.exercises],
        userId: state.user.id
    };

    state.history.push(workout);
    saveToStorage();
    tg.sendData(JSON.stringify({ type: 'new_workout', workout }));

    state.currentWorkout = { name: 'Тренировка', exercises: [], notes: '' };
    showSection('history');
};

// ========== МЕНЮ ==========
menuCards.forEach(card => {
    card.onclick = () => showSection(card.dataset.section);
});

// ========== СТАРТ ==========
loadFromStorage();
showWelcome();