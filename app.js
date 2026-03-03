// app.js - РАБОЧАЯ ВЕРСИЯ (только добавлено удаление)

// ========== ИНИЦИАЛИЗАЦИЯ TELEGRAM ==========
const tg = window.Telegram.WebApp;
tg.ready();
tg.expand();

// Настраиваем цвета
document.body.style.setProperty('--tg-theme-bg-color', tg.themeParams.bg_color || '#0a0806');
document.body.style.setProperty('--tg-theme-text-color', tg.themeParams.text_color || '#e0d7c6');
document.body.style.setProperty('--tg-theme-button-color', tg.themeParams.button_color || '#b87333');
document.body.style.setProperty('--tg-theme-button-text-color', tg.themeParams.button_text_color || '#0a0806');

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

// ========== ЗАГРУЗКА ==========
function loadFromStorage() {
    try {
        const savedHistory = localStorage.getItem(`workouts_${state.user.id}`);
        if (savedHistory) {
            state.history = JSON.parse(savedHistory);
        }
        const savedTemplates = localStorage.getItem(`templates_${state.user.id}`);
        if (savedTemplates) {
            state.templates = JSON.parse(savedTemplates);
        }
    } catch (e) {
        console.error('Ошибка загрузки:', e);
    }
}

function saveToStorage() {
    localStorage.setItem(`workouts_${state.user.id}`, JSON.stringify(state.history));
    localStorage.setItem(`templates_${state.user.id}`, JSON.stringify(state.templates));
}

// ========== УДАЛЕНИЕ (НОВАЯ ФУНКЦИЯ) ==========
function deleteWorkout(workoutId) {
    console.log('🗑️ Удаление тренировки:', workoutId);

    tg.showPopup({
        title: '⚠️ Удаление',
        message: 'Точно удалить эту тренировку?',
        buttons: [
            { id: 'delete', type: 'destructive', text: 'Удалить' },
            { id: 'cancel', type: 'cancel', text: 'Отмена' }
        ]
    }, (buttonId) => {
        if (buttonId === 'delete') {
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
            } catch (error) {
                console.error('❌ Ошибка отправки:', error);
            }

            // Показываем сообщение
            tg.showPopup({
                title: '✅ Удалено',
                message: 'Тренировка удалена',
                buttons: [{ type: 'ok' }]
            });

            // Обновляем отображение
            showHistory();
        }
    });
}

// ========== НАВИГАЦИЯ ==========
function showSection(section) {
    state.currentSection = section;

    menuCards.forEach(card => {
        const cardSection = card.dataset.section;
        if (cardSection === section) {
            card.classList.add('active');
        } else {
            card.classList.remove('active');
        }
    });

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
        {
            name: 'Марафон Геродота',
            description: '5000 шагов или 30 минут бега',
            reward: '🏃‍♂️ +50 выносливости'
        },
        {
            name: 'Завтрак титанов',
            description: '100 отжиманий',
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
        <div class="trial-container">
            <h2 class="trial-title">⚡ СЕГОДНЯШНЕЕ ИСПЫТАНИЕ</h2>
            <div class="trial-icon">🏛️</div>
            <h3 class="trial-name">${randomTrial.name}</h3>
            <p class="trial-description">${randomTrial.description}</p>
            <p class="trial-reward">${randomTrial.reward}</p>
            <button id="acceptTrialBtn" class="trial-btn">🏛️ ПРИНЯТЬ ИСПЫТАНИЕ</button>
        </div>
    `;

    document.getElementById('acceptTrialBtn').onclick = () => {
        showSection('workout');
    };

    actionBar.style.display = 'none';
}

// ========== СОЗДАТЕЛЬ ТРЕНИРОВОК ==========
function showWorkoutCreator() {
    let exercisesHtml = '';

    if (state.currentWorkout.exercises.length === 0) {
        exercisesHtml = '<p class="empty-message">⚡ Ещё нет упражнений. Начни свой подвиг!</p>';
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
                    <button class="remove-exercise" onclick="removeExercise(${index})" title="Удалить">✕</button>
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

    const nameInput = document.getElementById('workoutName');
    if (nameInput) {
        nameInput.oninput = (e) => {
            state.currentWorkout.name = e.target.value || 'Тренировка';
        };
    }

    actionBar.style.display = state.currentWorkout.exercises.length > 0 ? 'block' : 'none';

    document.getElementById('addExerciseBtn').onclick = () => {
        modal.classList.add('show');
    };
}

// ========== УДАЛЕНИЕ УПРАЖНЕНИЯ ==========
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

    let historyHtml = '<div class="history-scroll">';

    // Группировка по датам
    const grouped = {};
    [...state.history].reverse().forEach(workout => {
        const date = new Date(workout.date).toLocaleDateString('ru-RU');
        if (!grouped[date]) grouped[date] = [];
        grouped[date].push(workout);
    });

    Object.keys(grouped).forEach(date => {
        historyHtml += `<h3 class="history-date-header">📅 ${date}</h3>`;

        grouped[date].forEach(workout => {
            const time = new Date(workout.date).toLocaleTimeString('ru-RU', {
                hour: '2-digit',
                minute: '2-digit'
            });

            let exercisesPreview = '';
            workout.exercises.slice(0, 3).forEach(ex => {
                exercisesPreview += `
                    <div class="history-ex-item">
                        • ${ex.name} (${ex.sets}×${ex.reps} × ${ex.weight}кг)
                    </div>
                `;
            });

            if (workout.exercises.length > 3) {
                exercisesPreview += `
                    <div class="history-ex-more">
                        ... и ещё ${workout.exercises.length - 3}
                    </div>
                `;
            }

            historyHtml += `
                <div class="history-item" data-id="${workout.id}">
                    <div class="history-header">
                        <span class="history-name">🏛️ ${workout.name}</span>
                        <span class="history-time">${time}</span>
                    </div>
                    <div class="history-exercises">
                        ${exercisesPreview}
                    </div>
                    <div class="history-footer">
                        <span class="history-count">${workout.exercises.length} упражнений</span>
                        <button class="history-delete" onclick="deleteWorkout('${workout.id}')" title="Удалить">🗑️</button>
                    </div>
                </div>
            `;
        });
    });

    historyHtml += '</div>';

    // Статистика
    const totalExercises = state.history.reduce((acc, w) => acc + w.exercises.length, 0);
    const totalWeight = Math.round(state.history.reduce((acc, w) => {
        return acc + w.exercises.reduce((sum, ex) => sum + (ex.weight * ex.sets * ex.reps), 0);
    }, 0));

    contentEl.innerHTML = `
        <h2 class="section-title">📜 ХРОНИКИ ГЕРОЯ</h2>

        <div class="stats-bar">
            <div class="stat-item">
                <span class="stat-value">${state.history.length}</span>
                <span class="stat-label">тренировок</span>
            </div>
            <div class="stat-item">
                <span class="stat-value">${totalExercises}</span>
                <span class="stat-label">упражнений</span>
            </div>
            <div class="stat-item">
                <span class="stat-value">${totalWeight}</span>
                <span class="stat-label">кг</span>
            </div>
        </div>

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
        "«Река Стикс течёт через каждого, кто не боится пота»"
    ];

    const randomProphecy = prophecies[Math.floor(Math.random() * prophecies.length)];

    contentEl.innerHTML = `
        <div class="oracle-container">
            <h2 class="oracle-title">🔮 ИЗРЕЧЕНИЕ ОРАКУЛА</h2>
            <div class="oracle-icon">🏺</div>
            <p class="oracle-text">"${randomProphecy}"</p>
            <p class="oracle-author">— Пифия</p>
            <button id="newOracleBtn" class="oracle-btn">🎲 НОВОЕ ПРОРОЧЕСТВО</button>
        </div>
    `;

    document.getElementById('newOracleBtn').onclick = showOracle;
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
        tg.showPopup({
            title: 'Ошибка',
            message: 'Введите название упражнения!',
            buttons: [{ type: 'ok' }]
        });
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
        tg.showPopup({
            title: 'Ошибка',
            message: 'Добавь хотя бы одно упражнение!',
            buttons: [{ type: 'ok' }]
        });
        return;
    }

    const workoutRecord = {
        id: Date.now().toString(),
        name: state.currentWorkout.name || 'Тренировка',
        date: new Date().toISOString(),
        exercises: JSON.parse(JSON.stringify(state.currentWorkout.exercises)),
        userId: state.user.id
    };

    state.history.push(workoutRecord);
    saveToStorage();

    try {
        tg.sendData(JSON.stringify({
            type: 'new_workout',
            workout: workoutRecord
        }));
    } catch (error) {
        console.error('Ошибка отправки:', error);
    }

    state.currentWorkout = {
        name: 'Тренировка',
        exercises: [],
        notes: ''
    };

    showSection('history');
};

// ========== МЕНЮ ==========
menuCards.forEach(card => {
    card.onclick = () => {
        const section = card.dataset.section;
        showSection(section);
    };
});

// ========== ИНИЦИАЛИЗАЦИЯ ==========
loadFromStorage();
showWelcome();

// Делаем функции глобальными
window.deleteWorkout = deleteWorkout;
window.removeExercise = removeExercise;