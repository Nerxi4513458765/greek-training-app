// app.js - МИНИМАЛИСТИЧНЫЙ ИНТЕРФЕЙС С УДАЛЕНИЕМ ПО ДАТЕ

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

// ========== УДАЛЕНИЕ ПО ДАТЕ (ИСПРАВЛЕНО!) ==========
window.deleteWorkout = function(workoutDate, workoutName) {
    console.log('🗑️ Попытка удаления тренировки от', workoutDate);

    tg.showPopup({
        title: '⚠️ Удаление',
        message: `Точно удалить тренировку "${workoutName}"?`,
        buttons: [
            { id: 'delete', type: 'destructive', text: 'Удалить' },
            { id: 'cancel', type: 'cancel', text: 'Отмена' }
        ]
    }, (buttonId) => {
        if (buttonId === 'delete') {
            console.log('✅ Подтверждено удаление');

            // 1. Удаляем из локального хранилища
            const oldLength = state.history.length;
            state.history = state.history.filter(w => w.date !== workoutDate);
            saveToStorage();
            console.log(`📊 Локально: было ${oldLength}, стало ${state.history.length}`);

            // 2. Отправляем команду боту с ДАТОЙ
            tg.sendData(JSON.stringify({
                type: 'delete_workout_by_date',
                date: workoutDate
            }));
            console.log('📤 Отправлена команда удаления по дате');

            // 3. Обновляем отображение
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
    else if (section === 'oracle') showOracle();
    else if (section === 'today') showTodayTrial();
    else showWelcome();
}

// ========== ПРИВЕТСТВИЕ ==========
function showWelcome() {
    contentEl.innerHTML = `<div style="text-align:center;padding:40px"><h2>Да начнутся испытания, ${state.user.first_name}!</h2></div>`;
    actionBar.style.display = 'none';
}

// ========== ТОТ САМЫЙ ИНТЕРФЕЙС, КОТОРЫЙ ТЫ ХОЧЕШЬ ==========
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

// ========== ХРОНИКИ (С ПЕРЕДАЧЕЙ ДАТЫ В УДАЛЕНИЕ) ==========
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

// ========== ОРАКУЛ ==========
function showOracle() {
    const prophecies = [
        "«Река Стикс течёт через каждого, кто не боится пота»",
        "«Сила приходит от духа, закалённого испытаниями»",
        "«Геракл начинал с одного камня»"
    ];

    contentEl.innerHTML = `
        <div style="text-align:center; padding:20px">
            <h2 style="color:#e6c87c; margin-bottom:20px">🔮 ИЗРЕЧЕНИЕ ОРАКУЛА</h2>
            <div style="font-size:60px; margin:20px">🏺</div>
            <p style="font-size:24px; font-style:italic; color:#e6c87c; margin:30px">"${prophecies[Math.floor(Math.random() * prophecies.length)]}"</p>
            <p style="color:#b87333">— Пифия</p>
            <button onclick="showOracle()" style="margin-top:30px; padding:15px 30px; background:#b87333; border:none; border-radius:10px; color:#0a0806; font-family:'Cinzel'; cursor:pointer">🎲 НОВОЕ ПРОРОЧЕСТВО</button>
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
        <div style="text-align:center; padding:20px">
            <h2 style="color:#e6c87c">⚡ ПОДВИГ ДНЯ</h2>
            <div style="font-size:60px; margin:20px">🏛️</div>
            <h3 style="color:#e6c87c; font-size:28px">${t.name}</h3>
            <p style="margin:20px">${t.desc}</p>
            <button onclick="showSection('workout')" style="padding:15px 30px; background:#b87333; border:none; border-radius:10px; color:#0a0806; font-family:'Cinzel'; cursor:pointer">🏛️ ПРИНЯТЬ</button>
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
showWelcome()