const { ipcRenderer } = require('electron');

// --- BOTÃO FECHAR (minimizar para bandeja) ---
const btnFechar = document.getElementById('btn-fechar');
if (btnFechar) {
    btnFechar.addEventListener('click', () => {
        ipcRenderer.send('hide-window');
    });
}

// --- CONSTANTES DE DATA ---
const MESES = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
const DIAS_SEMANA_COMPLETO = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];

function normalizeDate(d) {
    const nd = new Date(d);
    nd.setHours(0, 0, 0, 0);
    return nd;
}

function formatDateKey(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

function generateId() {
    return 't_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
}

function escapeHtml(str) {
    const div = document.createElement('div');
    div.innerText = str;
    return div.innerHTML;
}

// --- ESTADO ---
let tasksData = JSON.parse(localStorage.getItem('myTasksByDate')) || {};
let activeDate = normalizeDate(new Date());
let calendarViewDate = new Date(activeDate.getFullYear(), activeDate.getMonth(), 1);
let calendarOpen = false;
let draggedId = null;

function getTasksForDate(dateKey) {
    if (!tasksData[dateKey]) tasksData[dateKey] = [];
    return tasksData[dateKey];
}

function saveTasks() {
    localStorage.setItem('myTasksByDate', JSON.stringify(tasksData));
}

// --- ELEMENTOS ---
const dayRadios = document.querySelectorAll('.cir-tabs__r');
const currentDayTitle = document.getElementById('current-day-title');
const taskInput = document.getElementById('task-input');
const taskTimeInput = document.getElementById('task-time-input');
const timeContainer = document.getElementById('time-container');
const addTaskBtn = document.getElementById('add-task-btn');
const taskList = document.getElementById('task-list');

const btnCalendario = document.getElementById('btn-calendario');
const calendarOverlay = document.getElementById('calendar-overlay');
const calMonthYear = document.getElementById('cal-month-year');
const calGrid = document.getElementById('calendar-grid');
const calPrev = document.getElementById('cal-prev');
const calNext = document.getElementById('cal-next');
const calTodayBtn = document.getElementById('cal-today-btn');

// --- INTERAÇÃO DA CAIXA DE HORÁRIO (CLIQUE E MÁSCARA 24H) ---
if (timeContainer && taskTimeInput) {
    timeContainer.addEventListener('click', () => {
        taskTimeInput.focus();
    });

    taskTimeInput.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length > 4) value = value.slice(0, 4);

        if (value.length >= 2) {
            let hours = parseInt(value.slice(0, 2), 10);
            if (hours > 23) value = '23' + value.slice(2);
            value = value.slice(0, 2) + ':' + value.slice(2);
        }

        if (value.length >= 5) {
            let minutes = parseInt(value.slice(3, 5), 10);
            if (minutes > 59) value = value.slice(0, 3) + '59';
        }

        e.target.value = value;
    });
}

// --- CALENDÁRIO ---
function openCalendar() {
    calendarViewDate = new Date(activeDate.getFullYear(), activeDate.getMonth(), 1);
    renderCalendar();
    calendarOverlay.classList.remove('hidden');
    calendarOpen = true;
}

function closeCalendar() {
    calendarOverlay.classList.add('hidden');
    calendarOpen = false;
}

function renderCalendar() {
    const year = calendarViewDate.getFullYear();
    const month = calendarViewDate.getMonth();
    calMonthYear.innerText = `${MESES[month]} ${year}`;
    calGrid.innerHTML = '';

    const firstDay = new Date(year, month, 1);
    const startWeekday = firstDay.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const todayKey = formatDateKey(normalizeDate(new Date()));
    const activeKey = formatDateKey(activeDate);

    for (let i = 0; i < startWeekday; i++) {
        const empty = document.createElement('div');
        empty.className = 'cal-day empty';
        calGrid.appendChild(empty);
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const cellDate = new Date(year, month, day);
        const key = formatDateKey(cellDate);
        const cell = document.createElement('div');
        cell.className = 'cal-day';
        cell.innerText = day;
        if (key === todayKey) cell.classList.add('today');
        if (key === activeKey) cell.classList.add('selected');
        if (tasksData[key] && tasksData[key].length > 0) cell.classList.add('has-tasks');
        cell.addEventListener('click', () => {
            activeDate = normalizeDate(cellDate);
            closeCalendar();
            updateInterface();
            saveAndRender();
        });
        calGrid.appendChild(cell);
    }
}

if (btnCalendario) {
    btnCalendario.addEventListener('click', (e) => {
        e.stopPropagation();
        if (calendarOpen) closeCalendar(); else openCalendar();
    });
}

if (calPrev) {
    calPrev.addEventListener('click', () => {
        calendarViewDate = new Date(calendarViewDate.getFullYear(), calendarViewDate.getMonth() - 1, 1);
        renderCalendar();
    });
}

if (calNext) {
    calNext.addEventListener('click', () => {
        calendarViewDate = new Date(calendarViewDate.getFullYear(), calendarViewDate.getMonth() + 1, 1);
        renderCalendar();
    });
}

if (calTodayBtn) {
    calTodayBtn.addEventListener('click', () => {
        activeDate = normalizeDate(new Date());
        calendarViewDate = new Date(activeDate.getFullYear(), activeDate.getMonth(), 1);
        renderCalendar();
        closeCalendar();
        updateInterface();
        saveAndRender();
    });
}

document.addEventListener('click', (e) => {
    if (calendarOpen && !calendarOverlay.contains(e.target) && e.target !== btnCalendario) {
        closeCalendar();
    }
});

// --- ABAS DE DIA DA SEMANA ---
function getDateForWeekdayIndex(idx) {
    const today = new Date();
    const todayIdx = today.getDay();
    const diff = idx - todayIdx;
    const d = new Date(today);
    d.setDate(d.getDate() + diff);
    return normalizeDate(d);
}

dayRadios.forEach(radio => {
    radio.addEventListener('change', (e) => {
        if (e.target.checked) {
            const idx = parseInt(e.target.getAttribute('data-day-index'), 10);
            activeDate = getDateForWeekdayIndex(idx);
            updateInterface();
            saveAndRender();
        }
    });
});

// --- INTERFACE ---
function updateInterface() {
    const weekdayIdx = activeDate.getDay();
    currentDayTitle.innerText = `${DIAS_SEMANA_COMPLETO[weekdayIdx]} — ${activeDate.getDate()} de ${MESES[activeDate.getMonth()]}`;

    const todayKey = formatDateKey(normalizeDate(new Date()));
    const activeKey = formatDateKey(activeDate);
    taskInput.placeholder = (activeKey === todayKey)
        ? "O que você precisa fazer hoje?"
        : `Adicionar tarefa para ${DIAS_SEMANA_COMPLETO[weekdayIdx]}...`;

    dayRadios.forEach(radio => {
        const idx = parseInt(radio.getAttribute('data-day-index'), 10);
        const d = getDateForWeekdayIndex(idx);
        radio.checked = (formatDateKey(d) === activeKey);
    });
}

// --- RENDERIZAÇÃO DAS TAREFAS ---
function saveAndRender() {
    saveTasks();
    taskList.innerHTML = '';

    const key = formatDateKey(activeDate);
    const tasks = getTasksForDate(key);

    const sorted = tasks
        .map((t, i) => ({ task: t, origIndex: i }))
        .sort((a, b) => {
            if (a.task.time && b.task.time) return a.task.time.localeCompare(b.task.time);
            if (a.task.time && !b.task.time) return -1;
            if (!a.task.time && b.task.time) return 1;
            return a.origIndex - b.origIndex;
        })
        .map(x => x.task);

    sorted.forEach(task => {
        const li = document.createElement('li');
        li.className = `task-item ${task.done ? 'completed' : ''}`;
        li.dataset.id = task.id;
        li.innerHTML = `
            <span class="drag-handle" title="Arraste para reordenar">⋮⋮</span>
            <div class="checkbox-wrapper-12">
              <div class="cbx">
                <input type="checkbox" id="cbx-${task.id}" ${task.done ? 'checked' : ''}>
                <label for="cbx-${task.id}"></label>
                <svg fill="none" viewBox="0 0 15 14" height="14" width="15">
                  <path d="M2 8.36364L6.23077 12L13 2"></path>
                </svg>
              </div>
            </div>
            <span class="task-text">${escapeHtml(task.text)}</span>
            <span class="task-time-badge">${task.time ? task.time : '+ horário'}</span>
            <button class="delete-btn">✖</button>
        `;

        li.querySelector('input[type="checkbox"]').addEventListener('change', () => toggleTask(task.id));
        li.querySelector('.delete-btn').addEventListener('click', () => deleteTask(task.id));
        li.querySelector('.task-time-badge').addEventListener('click', (e) => editTaskTime(task.id, e.currentTarget));

        if (task.time) {
            const handle = li.querySelector('.drag-handle');
            handle.style.opacity = '0.3';
            handle.style.cursor = 'default';
            handle.title = 'Tarefas com horário se organizam automaticamente';
        } else {
            setupDragAndDrop(li, task.id);
        }

        taskList.appendChild(li);
    });
}

// --- EDIÇÃO DE HORÁRIO INLINE ---
function editTaskTime(id, badgeEl) {
    const key = formatDateKey(activeDate);
    const list = getTasksForDate(key);
    const task = list.find(t => t.id === id);
    if (!task) return;

    const input = document.createElement('input');
    input.type = 'text';
    input.maxLength = 5;
    input.className = 'task-time-edit';
    input.value = task.time || '';
    badgeEl.replaceWith(input);
    input.focus();

    input.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length > 4) value = value.slice(0, 4);
        if (value.length >= 2) {
            let hours = parseInt(value.slice(0, 2), 10);
            if (hours > 23) value = '23' + value.slice(2);
            value = value.slice(0, 2) + ':' + value.slice(2);
        }
        if (value.length >= 5) {
            let minutes = parseInt(value.slice(3, 5), 10);
            if (minutes > 59) value = value.slice(0, 3) + '59';
        }
        e.target.value = value;
    });

    let committed = false;
    const commit = () => {
        if (committed) return;
        committed = true;
        task.time = input.value.trim() || null;
        task.nextCheckTime = null; // Reseta o ciclo se alterar o horário manualmente
        saveAndRender();
        if (calendarOpen) renderCalendar();
    };

    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') commit();
    });
    input.addEventListener('blur', commit);
}

// --- DRAG AND DROP ---
function setupDragAndDrop(li, id) {
    const handle = li.querySelector('.drag-handle');

    handle.addEventListener('mousedown', () => { li.draggable = true; });
    handle.addEventListener('touchstart', () => { li.draggable = true; }, { passive: true });
    li.addEventListener('mouseup', () => { li.draggable = false; });

    li.addEventListener('dragstart', () => {
        draggedId = id;
        li.classList.add('dragging');
    });

    li.addEventListener('dragend', () => {
        li.draggable = false;
        li.classList.remove('dragging');
        document.querySelectorAll('.task-item.drag-over').forEach(el => el.classList.remove('drag-over'));
    });

    li.addEventListener('dragover', (e) => {
        e.preventDefault();
        li.classList.add('drag-over');
    });

    li.addEventListener('dragleave', () => {
        li.classList.remove('drag-over');
    });

    li.addEventListener('drop', (e) => {
        e.preventDefault();
        li.classList.remove('drag-over');
        if (!draggedId || draggedId === id) return;

        const key = formatDateKey(activeDate);
        const list = getTasksForDate(key);
        const fromIdx = list.findIndex(t => t.id === draggedId);
        const toIdx = list.findIndex(t => t.id === id);
        if (fromIdx === -1 || toIdx === -1) return;

        const [moved] = list.splice(fromIdx, 1);
        list.splice(toIdx, 0, moved);
        draggedId = null;
        saveAndRender();
    });
}

// --- ADICIONAR / MARCAR / EXCLUIR TAREFAS ---
function addTask() {
    const text = taskInput.value.trim();
    if (text === '') return;

    const key = formatDateKey(activeDate);
    const list = getTasksForDate(key);
    if (list.length >= 10) {
        alert('Limite de 10 tarefas atingido para este dia!');
        return;
    }

    list.push({
        id: generateId(),
        text: text,
        done: false,
        time: taskTimeInput.value.trim() || null,
        nextCheckTime: null
    });

    taskInput.value = '';
    taskTimeInput.value = '';
    saveAndRender();
    if (calendarOpen) renderCalendar();
}

if (addTaskBtn) addTaskBtn.addEventListener('click', addTask);
if (taskInput) taskInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') addTask(); });
if (taskTimeInput) taskTimeInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') addTask(); });

function toggleTask(id) {
    const key = formatDateKey(activeDate);
    const list = getTasksForDate(key);
    const task = list.find(t => t.id === id);
    if (task) {
        task.done = !task.done;
        if (task.done) task.nextCheckTime = null; // Para de checar se foi feita
    }
    saveAndRender();
}

function deleteTask(id) {
    const key = formatDateKey(activeDate);
    const list = getTasksForDate(key);
    const idx = list.findIndex(t => t.id === id);
    if (idx > -1) list.splice(idx, 1);
    saveAndRender();
    if (calendarOpen) renderCalendar();
}

// Ouve o comando vindo da janela pop-up se o usuário clicar em "Sim"
ipcRenderer.on('complete-task-action', (event, taskId) => {
    const key = formatDateKey(activeDate);
    const list = getTasksForDate(key);
    const task = list.find(t => t.id === taskId);
    if (task && !task.done) {
        task.done = true;
        task.nextCheckTime = null;
        saveAndRender();
    }
});

// --- SISTEMA DE CHECAGEM E TOLERÂNCIA DE 20 MINUTOS ---
function playBeep() {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const beep = (freq, delay) => {
            setTimeout(() => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sine';
                osc.frequency.value = freq;
                gain.gain.setValueAtTime(0.001, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.3, ctx.currentTime + 0.02);
                gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start();
                osc.stop(ctx.currentTime + 0.5);
            }, delay);
        };
        beep(880, 0);
        beep(1046, 300);
    } catch (err) {
        console.error('Erro ao tocar alarme:', err);
    }
}

function checkAlarms() {
    const now = new Date();
    const key = formatDateKey(normalizeDate(now));
    const currentMinutesTotal = now.getHours() * 60 + now.getMinutes();
    const list = tasksData[key];
    if (!list) return;

    let updated = false;
    list.forEach(task => {
        if (!task.time || task.done) return;

        const [h, m] = task.time.split(':').map(Number);
        const taskMinutesTotal = h * 60 + m;

        // Define o horário do primeiro aviso (+20 minutos do horário estipulado)
        const triggerMinutes = taskMinutesTotal + 20;

        if (!task.nextCheckTime) {
            // Se o horário atual já passou de (horário da tarefa + 20 min)
            if (currentMinutesTotal >= triggerMinutes) {
                playBeep();
                ipcRenderer.send('trigger-reminder', { text: task.text, id: task.id });
                // Agenda o próximo aviso para daqui a 20 minutos caso responda "Não" ou ignore
                task.nextCheckTime = currentMinutesTotal + 20;
                updated = true;
            }
        } else {
            // Se já foi disparado antes, verifica se deu o ciclo de +20 min novamente
            if (currentMinutesTotal >= task.nextCheckTime) {
                playBeep();
                ipcRenderer.send('trigger-reminder', { text: task.text, id: task.id });
                task.nextCheckTime = currentMinutesTotal + 20;
                updated = true;
            }
        }
    });

    if (updated) {
        saveTasks();
    }
}

setInterval(checkAlarms, 15000);

// --- INICIALIZAÇÃO ---
updateInterface();
saveAndRender();
checkAlarms();