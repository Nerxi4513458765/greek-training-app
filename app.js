// app.js - Полная версия с удалением тренировок

// ========== ИНИЦИАЛИЗАЦИЯ TELEGRAM ==========
const tg = window.Telegram.WebApp;
tg.ready();
tg.expand();

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
            message: 'Не удалось отправить данные боту',
            buttons: [{ type: 'ok' }]
        });
        return false;
    }
}

// ========== ФУНКЦИЯ ДЛЯ УДАЛЕНИЯ ТРЕНИРОВКИ ==========
function deleteWorkout(workoutId) {
    // Показываем подтверждение
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

            // Отправляем команду боту на удаление
            try {
                tg.sendData(JSON.stringify({
                    type: 'delete_workout',
                    workout_id: workoutId
                }));
                console.log(`🗑️ Отправлена команда удаления тренировки ${workoutId}`);
            } catch (error) {
                console.error('❌ Ошибка отправки команды удаления:', error);
            }

            // Показываем сообщение
            tg.showPopup({
                title: '✅ Удалено',
                message: 'Тренировка удалена из хроник',
                buttons: [{ type: 'ok' }]
            });

            // Обновляем отображение
            showHistory();
        }
    });
}

// ========== ОТОБРАЖЕНИЕ РАЗДЕЛОВ ==========
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
            <h2>Да начнутся испытания, ${state.user.first_name}!</h2>
            <p>Выбери раздел в меню выше, о смертный...</p>
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

    document.querySelectorAll('.remove-exercise').forEach(btn => {
        btn.onclick = (e) => {
            e.stopPropagation();
            const index = parseInt(e.target.dataset.index);
            state.currentWorkout.exercises.splice(index, 1);
            showWorkoutCreator();
        };
    });

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

    const saveTemplateBtn = document.getElementById('saveTemplateBtn');
    if (saveTemplateBtn) {
        saveTemplateBtn.onclick = () => {
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
        };
    }
}

// ========== ИСТОРИЯ ТРЕНИРОВОК С КНОПКАМИ УДАЛЕНИЯ ==========
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

    // Группируем по датам (новые сверху)
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
                        <button class="history-delete" onclick="deleteWorkout('${workout.id}')" title="Удалить">
                            🗑️
                        </button>
                    </div>
                </div>
            `;
        });
    });

    historyHtml += '</div>';

    // Статистика
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

    const workoutRecord = {
        id: Date.now().toString(),
        name: state.currentWorkout.name || 'Тренировка',
        date: new Date().toISOString(),
        exercises: JSON.parse(JSON.stringify(state.currentWorkout.exercises)),
        userId: state.user.id,
        notes: state.currentWorkout.notes || ''
    };

    console.log('💾 Сохраняем тренировку:', workoutRecord);

    state.history.push(workoutRecord);
    saveToStorage();
    sendWorkoutToBot(workoutRecord);

    state.currentWorkout = {
        name: 'Тренировка',
        exercises: [],
        notes: ''
    };

    showSection('history');
};

// ========== ОБРАБОТЧИКИ МЕНЮ ==========
menuCards.forEach(card => {
    card.onclick = () => {
        const section = card.dataset.section;
        showSection(section);
    };
});

// ========== ИНИЦИАЛИЗАЦИЯ ==========
loadFromStorage();
showWelcome();

// Делаем функцию удаления глобальной для доступа из HTML
window.deleteWorkout = deleteWorkout;

// Приветственное сообщение
setTimeout(() => {
    tg.showPopup({
        title: '🏛️ Добро пожаловать в Чертог!',
        message: `Привет, ${state.user.first_name}! Тренируйся как герой, становись легендой.`,
        buttons: [{ type: 'ok' }]
    });
}, 500);
