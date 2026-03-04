// app.js - ПОЛНАЯ ВЕРСИЯ С УЛУЧШЕННЫМ ЛОГИРОВАНИЕМ

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

// ========== УДАЛЕНИЕ ПО ДАТЕ ==========
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
    contentEl.innerHTML = `<div style="text-align:center;padding:40px"><h2>Да начнутся испытания, ${state.user.first_name}!</h2></div>`;
    actionBar.style.display = 'none';
}

// ========== ТВОЙ ИНТЕРФЕЙС СОЗДАНИЯ ==========
function showWorkoutCreator() {
    let exercisesHtml = '';

    if (state.currentWorkout.exercises.length === 0) {
        exercisesHtml = '<p style="color:#b87333; padding:20px; text-align:center">❗ Ещё нет упражнений. Начни свой подвиг!</p>';
    } else {
        exercisesHtml = '<div style="margin-bottom:20px">';
        state.currentWorkout.exercises.forEach((ex, index) => {
            exercisesHtml += `
                <div style="background:#1a1510; border-left:4px solid #b87333; border-radius:8px; padding:12px; margin-bottom:8px; display:flex; justify-content:space-between">
                    <span style="color:#e6c87c">🏹 ${ex.name}</span>
                    <span>${ex.sets}×${ex.reps} × ${ex.weight}кг</span>
                    <button onclick="removeExercise(${index})" style="background:none; border:none; color:#8b1e1e; font-size:20px; cursor:pointer">✕</button>
                </div>
            `;
        });
        exercisesHtml += '</div>';
    }

    contentEl.innerHTML = `
        <h2 style="font-family: 'Cinzel', serif; color: #e6c87c; margin-bottom: 20px;">🏛️ СОЗДАНИЕ ПОДВИГА</h2>

        <div style="margin-bottom: 24px;">
            <label style="display: block; color: #e6c87c; margin-bottom: 8px;">📜 НАЗВАНИЕ ТРЕНИРОВКИ</label>
            <input type="text" id="workoutName" value="${state.currentWorkout.name}"
                   style="width:100%; padding:12px; background:#1a1510; border:2px solid #b87333; border-radius:8px; color:#e0d7c6; font-size:18px;">
        </div>

        ${exercisesHtml}

        <button id="addExerciseBtn" style="width:100%; padding:14px; background:#b87333; border:none; border-radius:8px; color:#0a0806; font-family:'Cinzel'; font-size:16px; font-weight:700; cursor:pointer; margin-top:16px;">
            + ДОБАВИТЬ УПРАЖНЕНИЕ
        </button>
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
            <div style="text-align:center; padding:40px">
                <h2 style="color:#e6c87c">📜 ХРОНИКИ ПУСТЫ</h2>
                <p style="margin:20px">Твои подвиги ещё не записаны в свитки...</p>
                <button onclick="showSection('workout')" style="padding:15px 30px; background:#b87333; border:none; border-radius:10px; color:#0a0806; font-family:'Cinzel'; cursor:pointer">
                    🏛️ СОЗДАТЬ ПЕРВЫЙ ПОДВИГ
                </button>
            </div>
        `;
        actionBar.style.display = 'none';
        return;
    }

    let html = '<div style="max-height:400px; overflow-y:auto">';

    [...state.history].reverse().forEach(w => {
        const date = new Date(w.date).toLocaleDateString('ru-RU');
        const time = new Date(w.date).toLocaleTimeString('ru-RU', {hour:'2-digit', minute:'2-digit'});

        html += `
            <div style="background:#1a1510; border-left:4px solid #b87333; border-radius:8px; padding:15px; margin-bottom:15px">
                <div style="display:flex; justify-content:space-between; margin-bottom:10px">
                    <span style="color:#e6c87c">🏛️ ${w.name}</span>
                    <span style="color:#b87333">${date} ${time}</span>
                </div>
                <div style="margin:10px 0; font-size:14px">
                    ${w.exercises.slice(0,3).map(ex => `<div>• ${ex.name} (${ex.sets}×${ex.reps} × ${ex.weight}кг)</div>`).join('')}
                    ${w.exercises.length > 3 ? `<div style="color:#b87333">... и ещё ${w.exercises.length-3}</div>` : ''}
                </div>
                <div style="display:flex; justify-content:space-between; margin-top:10px">
                    <span style="color:#b87333">${w.exercises.length} упражнений</span>
                    <button onclick="deleteWorkout('${w.date}', '${w.name}')" style="background:none; border:none; color:#8b1e1e; font-size:20px; cursor:pointer">🗑️</button>
                </div>
            </div>
        `;
    });

    html += '</div>';

    const total = state.history.reduce((a, w) => a + w.exercises.length, 0);
    const weight = Math.round(state.history.reduce((a, w) => a + w.exercises.reduce((s, ex) => s + ex.weight * ex.sets * ex.reps, 0), 0));

    contentEl.innerHTML = `
        <h2 style="font-family:'Cinzel'; color:#e6c87c; margin-bottom:20px">📜 ХРОНИКИ ГЕРОЯ</h2>
        <div style="display:flex; justify-content:space-around; background:#1a1510; border:1px solid #b87333; border-radius:10px; padding:15px; margin-bottom:20px">
            <div><span style="display:block; font-size:24px; color:#e6c87c">${state.history.length}</span><span>тренировок</span></div>
            <div><span style="display:block; font-size:24px; color:#e6c87c">${total}</span><span>упражнений</span></div>
            <div><span style="display:block; font-size:24px; color:#e6c87c">${weight}</span><span>кг</span></div>
        </div>
        ${html}
    `;
    actionBar.style.display = 'none';
}

// ========== ТРЕНЕР ==========
function showTrainer() {
    contentEl.innerHTML = `
        <div style="text-align:center; padding:20px">
            <h2 style="font-family:'Cinzel'; color:#e6c87c; margin-bottom:20px">🏋️ ПЕРСОНАЛЬНЫЙ ТРЕНЕР</h2>

            <div style="margin-bottom:30px">
                <h3 style="color:#e6c87c; margin-bottom:15px">Выбери фокус недели:</h3>

                <div style="display:grid; grid-template-columns:repeat(2,1fr); gap:10px; margin-bottom:10px">
                    <button class="focus-btn" data-focus="грудь">💪 ГРУДЬ</button>
                    <button class="focus-btn" data-focus="спина">🔱 СПИНА</button>
                </div>

                <div style="display:grid; grid-template-columns:repeat(2,1fr); gap:10px; margin-bottom:10px">
                    <button class="focus-btn" data-focus="ноги">🦵 НОГИ</button>
                    <button class="focus-btn" data-focus="руки">💪 РУКИ</button>
                </div>

                <div style="display:grid; grid-template-columns:1fr; gap:10px">
                    <button class="focus-btn" data-focus="все">⚖️ БАЛАНС</button>
                </div>
            </div>

            <div id="weeklyPlan" style="margin:20px 0; min-height:100px">
                <p style="color:#b87333; text-align:center">Выбери фокус и нажми кнопку</p>
            </div>

            <button id="generatePlanBtn" class="primary-btn">🎯 СГЕНЕРИРОВАТЬ ПЛАН</button>
        </div>
    `;

    // Стили для кнопок фокуса
    const style = document.createElement('style');
    style.textContent = `
        .focus-btn {
            background: #1a1510;
            border: 2px solid #b87333;
            color: #e0d7c6;
            padding: 12px;
            border-radius: 10px;
            font-family: 'Cinzel', serif;
            font-size: 14px;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.3s;
        }
        .focus-btn:hover {
            background: #b87333;
            color: #0a0806;
            transform: translateY(-2px);
        }
        .focus-btn.active {
            background: #b87333;
            color: #0a0806;
            border-color: #e6c87c;
        }
        .primary-btn {
            width: 100%;
            padding: 14px;
            background: #b87333;
            border: none;
            border-radius: 8px;
            color: #0a0806;
            font-family: 'Cinzel', serif;
            font-size: 16px;
            font-weight: 700;
            cursor: pointer;
            margin-top: 10px;
        }
    `;
    document.head.appendChild(style);

    document.querySelectorAll('.focus-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.focus-btn').forEach(b => {
                b.style.background = '#1a1510';
                b.style.color = '#e0d7c6';
                b.classList.remove('active');
            });
            this.style.background = '#b87333';
            this.style.color = '#0a0806';
            this.classList.add('active');
            state.currentFocus = this.dataset.focus;
        });
    });

    document.getElementById('generatePlanBtn').addEventListener('click', async () => {
        if (!state.currentFocus) {
            tg.showPopup({
                title: '⚠️ Внимание',
                message: 'Сначала выбери фокус недели!',
                buttons: [{ type: 'ok' }]
            });
            return;
        }

        document.getElementById('weeklyPlan').innerHTML = '<p style="color:#e6c87c; text-align:center">⚡ Генерирую план...</p>';

        // Очищаем URL от лишних символов
        const apiUrl = 'https://greek-training-bot-production-2cc5.up.railway.app/get_plan';
        console.log('📤 Отправка запроса на:', apiUrl);
        console.log('📤 Данные запроса:', { user_id: state.user.id, focus: state.currentFocus });

        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    user_id: state.user.id,
                    focus: state.currentFocus
                })
            });

            console.log('📥 Статус ответа:', response.status);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            console.log('📦 Данные от сервера:', result);

            if (result.success) {
                displayWeeklyPlan(result.plan);
            } else {
                throw new Error(result.error || 'Ошибка генерации плана');
            }
        } catch (error) {
            console.error('❌ Ошибка:', error);
            document.getElementById('weeklyPlan').innerHTML = `
                <div style="text-align:center; padding:20px; background:#1a1510; border-radius:10px">
                    <p style="color:#f44336">❌ Ошибка: ${error.message}</p>
                    <p style="color:#e0d7c6; margin-top:10px">Попробуй ещё раз</p>
                </div>
            `;
        }
    });

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
        <div style="text-align:center; padding:20px">
            <h2 style="color:#e6c87c">⚡ ПОДВИГ ДНЯ</h2>
            <div style="font-size:60px; margin:20px">🏛️</div>
            <h3 style="color:#e6c87c; font-size:28px">${t.name}</h3>
            <p style="margin:20px">${t.desc}</p>
            <button onclick="showSection('workout')" class="primary-btn">🏛️ ПРИНЯТЬ</button>
        </div>
    `;
    actionBar.style.display = 'none';
}

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

    if (window.currentEditMode === 'edit' && window.currentEditDay !== undefined && window.currentEditIndex !== undefined) {
        state.currentPlan[window.currentEditDay].exercises[window.currentEditIndex] = ex;
        displayWeeklyPlan(state.currentPlan);
    } else if (window.currentEditMode === 'add' && window.currentEditDay) {
        state.currentPlan[window.currentEditDay].exercises.push(ex);
        displayWeeklyPlan(state.currentPlan);
    } else {
        state.currentWorkout.exercises.push(ex);
        showWorkoutCreator();
    }

    modal.classList.remove('show');
    modalForm.reset();

    window.currentEditDay = null;
    window.currentEditIndex = null;
    window.currentEditMode = null;
};

cancelModalBtn.onclick = () => {
    modal.classList.remove('show');
    modalForm.reset();
    window.currentEditDay = null;
    window.currentEditIndex = null;
    window.currentEditMode = null;
};

modal.onclick = (e) => {
    if (e.target === modal) {
        modal.classList.remove('show');
        modalForm.reset();
        window.currentEditDay = null;
        window.currentEditIndex = null;
        window.currentEditMode = null;
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

// ========== ОТОБРАЖЕНИЕ ПЛАНА ==========
window.displayWeeklyPlan = function(plan) {
    console.log('📊 Отображаем план:', plan);
    state.currentPlan = plan;

    let html = '<div class="plan-container">';
    const days = ['понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота', 'воскресенье'];

    days.forEach(day => {
        if (plan[day]) {
            const dayIcons = {
                'понедельник': '🌙', 'вторник': '🔥', 'среда': '💧',
                'четверг': '🌪️', 'пятница': '⚡', 'суббота': '✨', 'воскресенье': '☀️'
            };

            html += `
                <div class="day-card ${plan[day].exercises.length === 0 ? 'rest-day' : ''}">
                    <div class="day-header">
                        <h3>${dayIcons[day] || '📅'} ${plan[day].name || day}</h3>
                        ${plan[day].exercises.length > 0 ?
                            '<span class="workout-badge">🏋️ ТРЕНИРОВКА</span>' :
                            '<span class="rest-badge">😴 ДЕНЬ ОТДЫХА</span>'}
                    </div>
            `;

            if (plan[day].exercises.length > 0) {
                html += `
                    <div class="workout-table-container">
                        <table class="workout-table">
                            <thead>
                                <tr>
                                    <th>🏋️ УПРАЖНЕНИЕ</th>
                                    <th>⚡ ИНТЕНСИВНОСТЬ</th>
                                    <th>🔄 ПОВТОРЕНИЯ</th>
                                    <th>⚖️ ВЕС (КГ)</th>
                                </tr>
                            </thead>
                            <tbody>
                `;

                plan[day].exercises.forEach((ex, idx) => {
                    let intensity = 'Средняя';
                    let intensityClass = 'medium-intensity';

                    if (ex.sets >= 5) {
                        intensity = 'Тяжёлая';
                        intensityClass = 'hard-intensity';
                    } else if (ex.sets <= 3) {
                        intensity = 'Лёгкая';
                        intensityClass = 'easy-intensity';
                    }

                    html += `
                        <tr>
                            <td class="exercise-name-cell">
                                <span class="exercise-name">${ex.name}</span>
                                <button class="edit-exercise-small" onclick="editExercise('${day}', ${idx})">✎</button>
                            </td>
                            <td class="intensity-cell ${intensityClass}">${intensity}</td>
                            <td class="reps-cell">${ex.sets} × ${ex.reps}</td>
                            <td class="weight-cell">
                                <span class="weight-value">${ex.weight}</span>
                                <button class="adjust-weight" onclick="adjustWeight('${day}', ${idx}, -2.5)">−</button>
                                <button class="adjust-weight" onclick="adjustWeight('${day}', ${idx}, 2.5)">+</button>
                            </td>
                        </tr>
                    `;
                });

                html += `
                            </tbody>
                        </table>
                    </div>

                    <div class="day-actions">
                        <button class="add-exercise-to-day" onclick="addExerciseToDay('${day}')">
                            ➕ ДОБАВИТЬ УПРАЖНЕНИЕ
                        </button>
                    </div>
                `;
            } else {
                html += `<div class="rest-message">Полный отдых. Восстанавливай силы!</div>`;
            }

            html += '</div>';
        }
    });

    html += '</div>';

    html += `
        <div class="plan-footer">
            <button onclick="usePlan()" class="save-plan-btn">💾 НАЧАТЬ ТРЕНИРОВКУ ПО ПЛАНУ</button>
            <button onclick="showTrainer()" class="reset-plan-btn">🔄 НОВЫЙ ПЛАН</button>
        </div>
    `;

    addTableStyles();
    document.getElementById('weeklyPlan').innerHTML = html;
};

// ========== СТИЛИ ДЛЯ ТАБЛИЦЫ ==========
function addTableStyles() {
    if (document.getElementById('table-styles')) return;

    const style = document.createElement('style');
    style.id = 'table-styles';
    style.textContent = `
        .plan-container { padding: 5px; }
        .day-card {
            background: linear-gradient(145deg, #1a1510, #0f0c08);
            border: 2px solid #b87333;
            border-radius: 15px;
            padding: 15px;
            margin-bottom: 20px;
        }
        .day-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 2px solid #b87333;
        }
        .day-header h3 {
            font-family: 'Cinzel', serif;
            color: #e6c87c;
            font-size: 18px;
            margin: 0;
        }
        .workout-badge {
            background: #b87333;
            color: #0a0806;
            padding: 5px 10px;
            border-radius: 20px;
            font-size: 12px;
        }
        .workout-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 14px;
        }
        .workout-table th {
            background: #b87333;
            color: #0a0806;
            padding: 12px 8px;
            font-family: 'Cinzel', serif;
            font-size: 12px;
            text-align: left;
        }
        .workout-table td {
            padding: 10px 8px;
            border-bottom: 1px solid #2a2520;
            color: #e0d7c6;
        }
        .exercise-name {
            color: #e6c87c;
            font-weight: bold;
        }
        .edit-exercise-small {
            background: none;
            border: 1px solid #b87333;
            border-radius: 4px;
            color: #b87333;
            cursor: pointer;
            margin-left: 8px;
        }
        .intensity-cell { font-weight: bold; }
        .easy-intensity { color: #4caf50; }
        .medium-intensity { color: #ff9800; }
        .hard-intensity { color: #f44336; }
        .weight-cell { display: flex; align-items: center; gap: 5px; }
        .weight-value { min-width: 40px; color: #b87333; font-weight: bold; }
        .adjust-weight {
            background: none;
            border: 1px solid #b87333;
            border-radius: 4px;
            color: #b87333;
            cursor: pointer;
            padding: 2px 8px;
        }
        .add-exercise-to-day {
            background: none;
            border: 2px dashed #b87333;
            border-radius: 8px;
            color: #b87333;
            padding: 10px;
            width: 100%;
            cursor: pointer;
        }
        .plan-footer {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
            margin-top: 20px;
        }
        .save-plan-btn {
            background: #2c4a3b;
            color: #e3f0da;
            border: 2px solid #7f9a6b;
            border-radius: 8px;
            padding: 12px;
            cursor: pointer;
        }
        .reset-plan-btn {
            background: #2a241e;
            color: #e0d7c6;
            border: 2px solid #b87333;
            border-radius: 8px;
            padding: 12px;
            cursor: pointer;
        }
    `;

    document.head.appendChild(style);
}

// ========== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ==========
window.adjustWeight = function(day, exerciseIdx, delta) {
    const exercise = state.currentPlan[day].exercises[exerciseIdx];
    exercise.weight = Math.max(0, Math.round((exercise.weight + delta) * 10) / 10);
    displayWeeklyPlan(state.currentPlan);
};

window.addExerciseToDay = function(day) {
    document.getElementById('exName').value = '';
    document.getElementById('exSets').value = 3;
    document.getElementById('exReps').value = 10;
    document.getElementById('exWeight').value = 0;
    modal.classList.add('show');
    window.currentEditDay = day;
    window.currentEditMode = 'add';
};

window.editExercise = function(day, exerciseIdx) {
    const exercise = state.currentPlan[day].exercises[exerciseIdx];
    document.getElementById('exName').value = exercise.name;
    document.getElementById('exSets').value = exercise.sets;
    document.getElementById('exReps').value = exercise.reps;
    document.getElementById('exWeight').value = exercise.weight;
    modal.classList.add('show');
    window.currentEditDay = day;
    window.currentEditIndex = exerciseIdx;
    window.currentEditMode = 'edit';
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