// app.js - ПОЛНАЯ ВЕРСИЯ С ОТПРАВКОЙ ПЛАНА В TELEGRAM

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

// ========== ТРЕНЕР (НОВАЯ ВЕРСИЯ) ==========
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

            <div id="planStatus" style="margin:20px 0; min-height:60px">
                <p style="color:#b87333; text-align:center">Выбери фокус и нажми кнопку</p>
            </div>

            <button id="generatePlanBtn" class="primary-btn">🎯 СГЕНЕРИРОВАТЬ ПЛАН</button>

            <div id="editSection" style="margin-top:30px; display:none">
                <h3 style="color:#e6c87c; margin-bottom:15px; font-size:18px">✏️ РЕДАКТИРОВАНИЕ</h3>
                <button id="loadPlanBtn" class="secondary-btn" style="margin-bottom:10px">📥 ЗАГРУЗИТЬ ПЛАН</button>
                <button id="editPlanBtn" class="secondary-btn">📝 ОТКРЫТЬ РЕДАКТОР</button>
            </div>
        </div>
    `;

    // Стили для кнопок
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
            transition: all 0.3s;
        }
        .primary-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(184,115,51,0.4);
        }
        .secondary-btn {
            width: 100%;
            padding: 12px;
            background: #2a241e;
            border: 2px solid #b87333;
            border-radius: 8px;
            color: #e0d7c6;
            font-family: 'Cinzel', serif;
            font-size: 14px;
            cursor: pointer;
            transition: all 0.3s;
        }
        .secondary-btn:hover {
            background: #3a342e;
            border-color: #e6c87c;
            transform: translateY(-2px);
        }
    `;
    document.head.appendChild(style);

    // Обработчики кнопок фокуса
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

    // Генерация плана
    document.getElementById('generatePlanBtn').addEventListener('click', async () => {
        if (!state.currentFocus) {
            tg.showPopup({
                title: '⚠️ Внимание',
                message: 'Сначала выбери фокус недели!',
                buttons: [{ type: 'ok' }]
            });
            return;
        }

        document.getElementById('planStatus').innerHTML = '<p style="color:#e6c87c; text-align:center">⚡ Генерирую план...</p>';

        let userId = state.user.id;
        if (userId === 0) userId = 12345;

        try {
            const response = await fetch('https://greek-training-bot-production-2cc5.up.railway.app/get_plan', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: userId,
                    focus: state.currentFocus
                })
            });

            const result = await response.json();

            if (result.success) {
                document.getElementById('planStatus').innerHTML = `
                    <div style="text-align:center; padding:15px; background:#1a1510; border-radius:10px; border-left:4px solid #4caf50">
                        <p style="color:#4caf50; font-weight:bold">✅ План отправлен!</p>
                        <p style="color:#e0d7c6; font-size:12px; margin-top:5px">Проверь сообщение от бота в Telegram</p>
                    </div>
                `;
                document.getElementById('editSection').style.display = 'block';
            } else {
                throw new Error(result.error || 'Ошибка генерации');
            }
        } catch (error) {
            document.getElementById('planStatus').innerHTML = `
                <div style="text-align:center; padding:15px; background:#1a1510; border-radius:10px; border-left:4px solid #f44336">
                    <p style="color:#f44336">❌ Ошибка: ${error.message}</p>
                </div>
            `;
        }
    });

    // Загрузка плана
    document.getElementById('loadPlanBtn').addEventListener('click', async () => {
        document.getElementById('planStatus').innerHTML = '<p style="color:#e6c87c; text-align:center">⚡ Загружаю план...</p>';

        try {
            const response = await fetch('https://greek-training-bot-production-2cc5.up.railway.app/get_user_plan', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: state.user.id })
            });

            const result = await response.json();

            if (result.success) {
                state.currentPlan = result.plan;
                state.currentFocus = result.focus;

                document.getElementById('planStatus').innerHTML = `
                    <div style="text-align:center; padding:15px; background:#1a1510; border-radius:10px; border-left:4px solid #4caf50">
                        <p style="color:#4caf50; font-weight:bold">✅ План загружен!</p>
                        <p style="color:#e0d7c6; margin-top:5px">Фокус: ${result.focus}</p>
                    </div>
                `;
            } else {
                throw new Error(result.error || 'План не найден');
            }
        } catch (error) {
            document.getElementById('planStatus').innerHTML = `
                <div style="text-align:center; padding:15px; background:#1a1510; border-radius:10px; border-left:4px solid #f44336">
                    <p style="color:#f44336">❌ Ошибка: ${error.message}</p>
                </div>
            `;
        }
    });

    // Редактирование плана
    document.getElementById('editPlanBtn').addEventListener('click', () => {
        if (!state.currentPlan) {
            tg.showPopup({
                title: '⚠️ Нет плана',
                message: 'Сначала загрузи или сгенерируй план',
                buttons: [{ type: 'ok' }]
            });
            return;
        }

        // Здесь будет открываться редактор (доделаем позже)
        tg.showPopup({
            title: '✏️ Редактор',
            message: 'Редактор планов появится в следующем обновлении',
            buttons: [{ type: 'ok' }]
        });
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