// app.js - Полноценное Mini App с названиями тренировок

// ========== ИНИЦИАЛИЗАЦИЯ TELEGRAM ==========
const tg = window.Telegram.WebApp;

// Сообщаем Telegram, что приложение готово
tg.ready();

// Разворачиваем на весь экран
tg.expand();

// Настраиваем цвета под тему Telegram
document.body.style.setProperty('--tg-theme-bg-color', tg.themeParams.bg_color || '#0a0806');
document.body.style.setProperty('--tg-theme-text-color', tg.themeParams.text_color || '#e0d7c6');
document.body.style.setProperty('--tg-theme-button-color', tg.themeParams.button_color || '#b87333');
document.body.style.setProperty('--tg-theme-button-text-color', tg.themeParams.button_text_color || '#0a0806');

console.log('✅ Telegram Web App инициализирован');
console.log('👤 Пользователь:', tg.initDataUnsafe?.user);

// ========== СОСТОЯНИЕ ПРИЛОЖЕНИЯ ==========
const state = {
    currentSection: 'welcome',
    currentWorkout: {
        name: 'Тренировка',
        exercises: [],
        notes: ''
    },
    history: [],        // История тренировок
    templates: [],       // Шаблоны тренировок
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
        // Загружаем историю тренировок
        const savedHistory = localStorage.getItem(`workouts_${state.user.id}`);
        if (savedHistory) {
            state.history = JSON.parse(savedHistory);
            console.log(`📚 Загружено ${state.history.length} тренировок`);
        }

        // Загружаем шаблоны
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

        tg.showPopup({
            title: '✅ Отправлено',
            message: `Тренировка "${workoutData.name}" отправлена боту!`,
            buttons: [{ type: 'ok' }]
        });

        return true;
    } catch (error) {
        console.error('❌ Ошибка отправки:', error);
        tg.showPopup({
            title: '❌ Ошибка',
            message: 'Не удалось отправить данные боту. Проверь подключение.',
            buttons: [{ type: 'ok' }]
        });
        return false;
    }
}

// ========== ОТОБРАЖЕНИЕ РАЗДЕЛОВ ==========
function showSection(section) {
    state.currentSection = section;

    // Подсвечиваем активную карточку меню
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
        {
            name: 'Марафон Геродота',
            description: '5000 шагов или 30 минут бега',
            reward: '🏃‍♂️ +50 выносливости',
            exercises: [
                { name: 'Бег', sets: 1, reps: 5000, weight: 0 }
            ]
        },
        {
            name: 'Завтрак титанов',
            description: '100 отжиманий',
            reward: '💪 +30 силы',
            exercises: [
                { name: 'Отжимания', sets: 5, reps: 20, weight: 0 }
            ]
        },
        {
            name: 'Камень Сизифа',
            description: 'Приседания с весом 4×15',
            reward: '🦵 +40 силы ног',
            exercises: [
                { name: 'Приседания со штангой', sets: 4, reps: 15, weight: 50 }
            ]
        },
        {
            name: 'Лук Одиссея',
            description: 'Тяга верхнего блока 3×12',
            reward: '🏹 +35 силы спины',
            exercises: [
                { name: 'Тяга верхнего блока', sets: 3, reps: 12, weight: 40 }
            ]
        },
        {
            name: 'Копьё Ахиллеса',
            description: 'Жим лёжа 5×5',
            reward: '🛡️ +50 силы груди',
            exercises: [
                { name: 'Жим штанги лёжа', sets: 5, reps: 5, weight: 60 }
            ]
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
        state.currentWorkout = {
            name: randomTrial.name,
            exercises: [...randomTrial.exercises],
            notes: 'Подвиг дня'
        };
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
                    <button class="remove-exercise" data-index="${index}" title="Удалить">✕</button>
                </div>
            `;
        });
        exercisesHtml += '</div>';
    }

    // Формируем HTML для шаблонов
    let templatesHtml = '';
    if (state.templates.length > 0) {
        templatesHtml = '<div class="templates-section">';
        templatesHtml += '<h3 class="templates-title">📋 БЫСТРЫЙ СТАРТ</h3>';
        templatesHtml += '<div class="templates-grid">';
        state.templates.forEach((template, index) => {
            templatesHtml += `
                <button class="template-btn" data-template-index="${index}">
                    ${template.name}
                </button>
            `;
        });
        templatesHtml += '</div></div>';
    }

    contentEl.innerHTML = `
        <h2 class="section-title">🏛️ СОЗДАНИЕ ПОДВИГА</h2>

        <div class="workout-name-section">
            <label for="workoutName" class="workout-label">📜 НАЗВАНИЕ ТРЕНИРОВКИ</label>
            <input type="text" id="workoutName" class="workout-name-input"
                   value="${state.currentWorkout.name}"
                   placeholder="Например: День Геракла">
        </div>

        ${exercisesHtml}

        <button id="addExerciseBtn" class="add-btn">+ ДОБАВИТЬ УПРАЖНЕНИЕ</button>

        ${templatesHtml}

        ${state.currentWorkout.exercises.length >= 3 ? `
            <button id="saveTemplateBtn" class="template-save-btn">📋 СОХРАНИТЬ КАК ШАБЛОН</button>
        ` : ''}
    `;

    // Обновляем название при вводе
    const nameInput = document.getElementById('workoutName');
    if (nameInput) {
        nameInput.oninput = (e) => {
            state.currentWorkout.name = e.target.value || 'Тренировка';
        };
    }

    // Показываем кнопку сохранения, если есть упражнения
    actionBar.style.display = state.currentWorkout.exercises.length > 0 ? 'block' : 'none';

    // Добавляем обработчик для кнопки добавления упражнения
    document.getElementById('addExerciseBtn').onclick = () => {
        modal.classList.add('show');
    };

    // Добавляем обработчики для удаления упражнений
    document.querySelectorAll('.remove-exercise').forEach(btn => {
        btn.onclick = (e) => {
            e.stopPropagation();
            const index = parseInt(e.target.dataset.index);
            state.currentWorkout.exercises.splice(index, 1);
            showWorkoutCreator();
        };
    });

    // Добавляем обработчики для шаблонов
    document.querySelectorAll('.template-btn').forEach(btn => {
        btn.onclick = (e) => {
            const templateIndex = e.target.dataset.templateIndex;
            const template = state.templates[templateIndex];
            if (template) {
                state.currentWorkout.exercises = JSON.parse(JSON.stringify(template.exercises));
                showWorkoutCreator();

                tg.showPopup({
                    title: '✅ Шаблон загружен',
                    message: `Тренировка "${template.name}" готова!`,
                    buttons: [{ type: 'ok' }]
                });
            }
        };
    });

    // Добавляем обработчик для сохранения шаблона
    const saveTemplateBtn = document.getElementById('saveTemplateBtn');
    if (saveTemplateBtn) {
        saveTemplateBtn.onclick = () => {
            tg.showPopup({
                title: '💾 Сохранить шаблон',
                message: 'Введите название для шаблона:',
                buttons: [
                    { id: 'save', type: 'default', text: 'Сохранить' },
                    { id: 'cancel', type: 'cancel', text: 'Отмена' }
                ]
            }, (btnId) => {
                if (btnId === 'save') {
                    const templateName = prompt('Название шаблона:', state.currentWorkout.name);
                    if (templateName && templateName.trim()) {
                        state.templates.push({
                            name: templateName.trim(),
                            exercises: JSON.parse(JSON.stringify(state.currentWorkout.exercises))
                        });
                        saveToStorage();

                        tg.showPopup({
                            title: '✅ Готово',
                            message: `Шаблон "${templateName}" сохранён!`,
                            buttons: [{ type: 'ok' }]
                        });

                        showWorkoutCreator();
                    }
                }
            });
        };
    }
}

// ========== ИСТОРИЯ ТРЕНИРОВОК ==========
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

    // Группируем тренировки по датам (новые сверху)
    const grouped = {};
    [...state.history].reverse().forEach(workout => {
        const date = new Date(workout.date).toLocaleDateString('ru-RU', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
        if (!grouped[date]) grouped[date] = [];
        grouped[date].push(workout);
    });

    // Отображаем тренировки по датам
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
                        <button class="history-delete" data-id="${workout.id}" title="Удалить">✕</button>
                    </div>
                </div>
            `;
        });
    });

    historyHtml += '</div>';

    // Добавляем статистику
    const totalExercises = state.history.reduce((acc, w) => acc + w.exercises.length, 0);
    const totalWeight = state.history.reduce((acc, w) => {
        return acc + w.exercises.reduce((sum, ex) => sum + (ex.weight * ex.sets * ex.reps), 0);
    }, 0);

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
                <span class="stat-value">${Math.round(totalWeight)}</span>
                <span class="stat-label">кг всего</span>
            </div>
        </div>

        ${historyHtml}
    `;

    // Добавляем обработчики удаления
    document.querySelectorAll('.history-delete').forEach(btn => {
        btn.onclick = (e) => {
            e.stopPropagation();
            const id = e.target.dataset.id;

            tg.showPopup({
                title: '⚠️ Удаление',
                message: 'Точно удалить эту тренировку?',
                buttons: [
                    { id: 'yes', type: 'destructive', text: 'Удалить' },
                    { id: 'no', type: 'cancel', text: 'Отмена' }
                ]
            }, (btnId) => {
                if (btnId === 'yes') {
                    state.history = state.history.filter(w => w.id !== id);
                    saveToStorage();
                    showHistory();
                }
            });
        };
    });

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
        "«Прометей принёс огонь. Ты принесёшь новые рекорды»",
        "«Спартанец не спрашивает сколько, он спрашивает где»",
        "«Даже Зевс когда-то был младенцем. Начни с малого»",
        "«Тысячи павших героев завидуют твоему упорству»",
        "«Каждый подход приближает тебя к Олимпу»",
        "«Пот героя — вода для реки Стикс»"
    ];

    const randomProphecy = prophecies[Math.floor(Math.random() * prophecies.length)];

    contentEl.innerHTML = `
        <div class="oracle-container">
            <h2 class="oracle-title">🔮 ИЗРЕЧЕНИЕ ОРАКУЛА</h2>
            <div class="oracle-icon">🏺</div>
            <p class="oracle-text">"${randomProphecy}"</p>
            <p class="oracle-author">— Пифия, жрица Аполлона</p>
            <button id="newOracleBtn" class="oracle-btn">🎲 НОВОЕ ПРОРОЧЕСТВО</button>
        </div>
    `;

    document.getElementById('newOracleBtn').onclick = showOracle;
    actionBar.style.display = 'none';
}

// ========== ОБРАБОТЧИК ФОРМЫ ДОБАВЛЕНИЯ УПРАЖНЕНИЯ ==========
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

// Закрытие модалки по клику вне её
modal.onclick = (e) => {
    if (e.target === modal) {
        modal.classList.remove('show');
        modalForm.reset();
    }
};

// ========== СОХРАНЕНИЕ ТРЕНИРОВКИ ==========
saveBtn.onclick = () => {
    if (state.currentWorkout.exercises.length === 0) {
        tg.showPopup({
            title: 'Ошибка',
            message: 'Добавь хотя бы одно упражнение!',
            buttons: [{ type: 'ok' }]
        });
        return;
    }

    // Создаём запись о тренировке
    const workoutRecord = {
        id: Date.now().toString(),
        name: state.currentWorkout.name || 'Тренировка',
        date: new Date().toISOString(),
        exercises: JSON.parse(JSON.stringify(state.currentWorkout.exercises)),
        userId: state.user.id,
        notes: state.currentWorkout.notes || ''
    };

    console.log('💾 Сохраняем тренировку:', workoutRecord);

    // Сохраняем локально
    state.history.push(workoutRecord);
    saveToStorage();

    // Отправляем боту
    sendWorkoutToBot(workoutRecord);

    // Очищаем текущую тренировку
    state.currentWorkout = {
        name: 'Тренировка',
        exercises: [],
        notes: ''
    };

    // Переходим в историю
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
loadFromStorage();
showWelcome();

// Показываем приветственное сообщение
setTimeout(() => {
    tg.showPopup({
        title: '🏛️ Добро пожаловать в Чертог!',
        message: `Привет, ${state.user.first_name}! Тренируйся как герой, становись легендой.`,
        buttons: [{ type: 'ok' }]
    });
}, 500);

// ========== ДОБАВЛЯЕМ СТИЛИ ==========
const style = document.createElement('style');
style.textContent = `
    /* Общие стили */
    .welcome-message { text-align: center; padding: 40px 20px; }
    .welcome-title { font-family: 'Cinzel'; color: var(--gold); font-size: 24px; margin-bottom: 20px; }
    .welcome-text { color: var(--old-paper); opacity: 0.8; margin-bottom: 30px; }
    .welcome-icon { font-size: 80px; opacity: 0.5; }

    /* Стили для раздела тренировки */
    .workout-name-section { margin-bottom: 25px; }
    .workout-label { display: block; color: var(--gold); margin-bottom: 8px; font-size: 14px; letter-spacing: 1px; }
    .workout-name-input {
        width: 100%;
        padding: 12px;
        background: #1a1510;
        border: 2px solid var(--bronze);
        border-radius: 10px;
        color: var(--old-paper);
        font-size: 16px;
        font-family: 'Cinzel';
    }
    .workout-name-input:focus { outline: none; border-color: var(--gold); box-shadow: 0 0 15px var(--bronze); }

    /* Стили для упражнений */
    .exercises-list { margin-bottom: 20px; }
    .exercise-item {
        background: linear-gradient(90deg, #2a241e, #1a1510);
        border-left: 6px solid var(--bronze);
        border-radius: 10px;
        padding: 15px;
        margin-bottom: 10px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        box-shadow: 0 3px 10px black;
    }
    .exercise-name { font-family: 'Cinzel'; color: var(--gold); font-size: 16px; }
    .exercise-details { display: flex; gap: 10px; }
    .exercise-sets, .exercise-weight {
        background: #0a0806;
        padding: 4px 10px;
        border-radius: 20px;
        border: 1px solid var(--bronze);
        font-size: 14px;
    }
    .remove-exercise {
        background: none;
        border: none;
        color: #8b1e1e;
        font-size: 24px;
        cursor: pointer;
        transition: all 0.3s;
    }
    .remove-exercise:hover { color: #b22e2e; transform: scale(1.2); }

    /* Стили для шаблонов */
    .templates-section { margin-top: 25px; padding-top: 20px; border-top: 1px solid var(--marble-gray); }
    .templates-title { color: var(--gold); margin-bottom: 15px; font-size: 18px; }
    .templates-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
    .template-btn {
        padding: 12px;
        background: #2a241e;
        border: 1px solid var(--bronze);
        border-radius: 8px;
        color: var(--old-paper);
        font-family: 'Cinzel';
        cursor: pointer;
        transition: all 0.3s;
    }
    .template-btn:hover { background: #3a342e; border-color: var(--gold); transform: translateY(-2px); }
    .template-save-btn {
        width: 100%;
        padding: 12px;
        margin-top: 15px;
        background: #2c4a3b;
        border: 1px solid #7f9a6b;
        border-radius: 8px;
        color: #e3f0da;
        font-family: 'Cinzel';
        cursor: pointer;
        transition: all 0.3s;
    }
    .template-save-btn:hover { background: #3a5e4b; transform: translateY(-2px); }

    /* Стили для истории */
    .history-scroll { max-height: 400px; overflow-y: auto; padding-right: 5px; }
    .history-date-header {
        color: var(--gold);
        margin: 20px 0 10px;
        font-size: 18px;
        border-bottom: 1px dashed var(--bronze);
        padding-bottom: 5px;
    }
    .history-item {
        background: #1a1510;
        border: 1px solid var(--marble-gray);
        border-radius: 10px;
        padding: 15px;
        margin-bottom: 15px;
    }
    .history-header { display: flex; justify-content: space-between; margin-bottom: 10px; }
    .history-name { color: var(--gold); font-weight: bold; }
    .history-time { color: var(--bronze); font-size: 14px; }
    .history-exercises { margin: 10px 0; font-size: 14px; }
    .history-ex-item { color: var(--old-paper); opacity: 0.9; margin: 3px 0; }
    .history-ex-more { color: var(--bronze); font-style: italic; margin-top: 5px; }
    .history-footer { display: flex; justify-content: space-between; align-items: center; margin-top: 10px; }
    .history-count { color: var(--bronze); font-size: 12px; }
    .history-delete {
        background: none;
        border: none;
        color: #8b1e1e;
        font-size: 20px;
        cursor: pointer;
        padding: 5px 10px;
    }
    .history-delete:hover { color: #b22e2e; }

    /* Статистика */
    .stats-bar {
        display: flex;
        justify-content: space-around;
        background: #1a1510;
        border: 1px solid var(--bronze);
        border-radius: 10px;
        padding: 15px;
        margin-bottom: 20px;
    }
    .stat-item { text-align: center; }
    .stat-value {
        display: block;
        font-size: 24px;
        font-weight: bold;
        color: var(--gold);
        font-family: 'Cinzel';
    }
    .stat-label { font-size: 12px; color: var(--old-paper); opacity: 0.7; }

    /* Пустая история */
    .empty-history { text-align: center; padding: 40px 20px; }
    .empty-title { color: var(--gold); margin-bottom: 15px; }
    .empty-text { color: var(--old-paper); margin-bottom: 25px; }
    .empty-btn {
        padding: 15px 30px;
        background: var(--bronze);
        border: none;
        border-radius: 10px;
        color: var(--primary-dark);
        font-family: 'Cinzel';
        cursor: pointer;
    }

    /* Испытание дня */
    .trial-container { text-align: center; padding: 20px; }
    .trial-title { color: var(--gold); margin-bottom: 20px; }
    .trial-icon { font-size: 80px; margin: 20px; }
    .trial-name { color: var(--gold); font-size: 28px; margin: 15px; }
    .trial-description { font-size: 18px; margin: 15px; }
    .trial-reward { color: var(--bronze); font-size: 20px; margin: 15px; }
    .trial-btn {
        padding: 15px 30px;
        background: var(--bronze);
        border: none;
        border-radius: 10px;
        color: var(--primary-dark);
        font-family: 'Cinzel';
        cursor: pointer;
        margin-top: 20px;
    }

    /* Оракул */
    .oracle-container { text-align: center; padding: 20px; }
    .oracle-title { color: var(--gold); margin-bottom: 20px; }
    .oracle-icon { font-size: 80px; margin: 20px; }
    .oracle-text {
        font-size: 24px;
        font-style: italic;
        color: var(--gold);
        margin: 30px;
        line-height: 1.6;
    }
    .oracle-author { color: var(--bronze); margin-bottom: 30px; }
    .oracle-btn {
        padding: 15px 30px;
        background: var(--bronze);
        border: none;
        border-radius: 10px;
        color: var(--primary-dark);
        font-family: 'Cinzel';
        cursor: pointer;
    }

    /* Кнопка добавления */
    .add-btn {
        width: 100%;
        padding: 15px;
        background: var(--bronze);
        border: none;
        border-radius: 10px;
        color: var(--primary-dark);
        font-family: 'Cinzel';
        font-size: 18px;
        font-weight: 700;
        cursor: pointer;
        margin-top: 10px;
        transition: all 0.3s;
    }
    .add-btn:hover { background: #c98343; transform: translateY(-2px); }

    /* Пустое сообщение */
    .empty-message { text-align: center; color: var(--bronze); padding: 30px; }
`;
document.head.appendChild(style);