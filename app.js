// app.js - ПОЛНАЯ РАБОЧАЯ ВЕРСИЯ С СИММЕТРИЧНЫМИ КНОПКАМИ

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

// ========== ТРЕНЕР (СИММЕТРИЧНЫЕ КНОПКИ) ==========
function showTrainer() {
    contentEl.innerHTML = `
        <div style="text-align:center; padding:20px">
            <h2 style="font-family:'Cinzel'; color:#e6c87c; margin-bottom:20px">🏋️ ПЕРСОНАЛЬНЫЙ ТРЕНЕР</h2>

            <div style="margin-bottom:30px">
                <h3 style="color:#e6c87c; margin-bottom:15px">Выбери фокус недели:</h3>

                <!-- Первый ряд: 2 кнопки -->
                <div style="display:grid; grid-template-columns:repeat(2,1fr); gap:10px; margin-bottom:10px">
                    <button class="focus-btn" data-focus="грудь" style="background:#1a1510; border:2px solid #b87333; color:#e0d7c6; padding:12px; border-radius:10px; font-family:'Cinzel'; font-size:14px; font-weight:bold; cursor:pointer; transition:all 0.3s">💪 ГРУДЬ</button>
                    <button class="focus-btn" data-focus="спина" style="background:#1a1510; border:2px solid #b87333; color:#e0d7c6; padding:12px; border-radius:10px; font-family:'Cinzel'; font-size:14px; font-weight:bold; cursor:pointer; transition:all 0.3s">🔱 СПИНА</button>
                </div>

                <!-- Второй ряд: 2 кнопки -->
                <div style="display:grid; grid-template-columns:repeat(2,1fr); gap:10px; margin-bottom:10px">
                    <button class="focus-btn" data-focus="ноги" style="background:#1a1510; border:2px solid #b87333; color:#e0d7c6; padding:12px; border-radius:10px; font-family:'Cinzel'; font-size:14px; font-weight:bold; cursor:pointer; transition:all 0.3s">🦵 НОГИ</button>
                    <button class="focus-btn" data-focus="руки" style="background:#1a1510; border:2px solid #b87333; color:#e0d7c6; padding:12px; border-radius:10px; font-family:'Cinzel'; font-size:14px; font-weight:bold; cursor:pointer; transition:all 0.3s">💪 РУКИ</button>
                </div>

                <!-- Третий ряд: 1 кнопка во всю ширину -->
                <div style="display:grid; grid-template-columns:1fr; gap:10px">
                    <button class="focus-btn" data-focus="все" style="background:#1a1510; border:2px solid #b87333; color:#e0d7c6; padding:12px; border-radius:10px; font-family:'Cinzel'; font-size:14px; font-weight:bold; cursor:pointer; transition:all 0.3s">⚖️ БАЛАНС</button>
                </div>
            </div>

            <div id="weeklyPlan" style="margin:20px 0; min-height:100px">
                <p style="color:#b87333; text-align:center">Выбери фокус и нажми кнопку</p>
            </div>

            <button id="generatePlanBtn" style="width:100%; padding:14px; background:#b87333; border:none; border-radius:8px; color:#0a0806; font-family:'Cinzel'; font-size:16px; font-weight:700; cursor:pointer; margin-top:10px">
                🎯 СТЕНЕРИРОВАТЬ ПЛАН
            </button>
        </div>
    `;

    // Добавляем стили для активной кнопки
    const style = document.createElement('style');
    style.textContent = `
        .focus-btn:hover {
            background: #b87333 !important;
            color: #0a0806 !important;
            transform: translateY(-2px);
        }
        .focus-btn.active {
            background: #b87333 !important;
            color: #0a0806 !important;
            border-color: #e6c87c !important;
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

    document.getElementById('generatePlanBtn').addEventListener('click', () => {
        if (!state.currentFocus) {
            tg.showPopup({
                title: '⚠️ Внимание',
                message: 'Сначала выбери фокус недели!',
                buttons: [{ type: 'ok' }]
            });
            return;
        }

        document.getElementById('weeklyPlan').innerHTML = '<p style="color:#e6c87c; text-align:center">⚡ Генерирую план...</p>';
        tg.sendData(JSON.stringify({ type: 'get_plan', focus: state.currentFocus }));
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
            <button onclick="showSection('workout')" style="padding:15px 30px; background:#b87333; border:none; border-radius:10px; color:#0a0806; font-family:'Cinzel'; cursor:pointer">
                🏛️ ПРИНЯТЬ
            </button>
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

// ========== ОТОБРАЖЕНИЕ ПЛАНА ==========
window.displayWeeklyPlan = function(plan) {
    state.currentPlan = plan;

    let html = '<div style="max-height:400px; overflow-y:auto">';
    const days = ['понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота', 'воскресенье'];

    days.forEach(day => {
        if (plan[day]) {
            html += `
                <div style="background:#1a1510; border-left:4px solid #b87333; border-radius:8px; padding:15px; margin-bottom:15px">
                    <h3 style="color:#e6c87c; margin-bottom:10px">${plan[day].name || day}</h3>
            `;

            if (plan[day].exercises.length > 0) {
                plan[day].exercises.forEach(ex => {
                    html += `
                        <div style="display:flex; justify-content:space-between; margin:5px 0">
                            <span>${ex.name}</span>
                            <span>${ex.sets}×${ex.reps} × ${ex.weight}кг</span>
                        </div>
                    `;
                });
            } else {
                html += '<p style="color:#b87333">😴 Отдых</p>';
            }

            html += '</div>';
        }
    });

    html += '</div>';

    html += `
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-top:20px">
            <button onclick="usePlan()" style="padding:12px; background:#2c4a3b; color:#e3f0da; border:none; border-radius:8px; cursor:pointer">💾 ИСПОЛЬЗОВАТЬ</button>
            <button onclick="showTrainer()" style="padding:12px; background:#2a241e; color:#e0d7c6; border:none; border-radius:8px; cursor:pointer">🔄 НОВЫЙ ПЛАН</button>
        </div>
    `;

    document.getElementById('weeklyPlan').innerHTML = html;
};

// ========== ИСПОЛЬЗОВАТЬ ПЛАН ==========
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