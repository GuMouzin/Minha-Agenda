// Android (Capacitor): lembretes como alarmes exatos do sistema, então disparam mesmo com o app
// fechado. Ao tocar na notificação abre um pop-up nativo (Sim/Não) em vez do app.
// No Electron este arquivo não faz nada.
(function () {
  const cap = window.Capacitor;
  if (!cap || !cap.isNativePlatform || !cap.isNativePlatform()) return;
  const P = cap.Plugins || {};
  const LN = P.LocalNotifications; // só para pedir permissão (e fallback)
  const R = P.Reminders;           // plugin nativo (ReminderPlugin.java)
  if (!LN && !R) return;

  const DELAY_MIN = 20;    // primeiro aviso: 20 min depois do horário (igual ao desktop)
  const REPEATS = 5;       // repete a cada 20 min, até 5 avisos
  const HORIZON_DAYS = 7;  // agenda a próxima semana
  const MAX_SCHEDULED = 100;

  let permitted = null;
  let timer = null;
  const queue = []; // ids concluídos pelo pop-up, aplicados pelo script.js

  const hash = (s) => {
    let h = 0;
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
    return Math.abs(h) % 2000000000;
  };

  async function ensurePermission() {
    if (permitted !== null) return permitted;
    try {
      let p = await LN.checkPermissions();
      if (p.display !== 'granted') p = await LN.requestPermissions();
      permitted = p.display === 'granted';
    } catch (e) { permitted = false; }
    return permitted;
  }

  // Lista de { at, taskId, text, time, id } dos próximos avisos, em ordem.
  function upcoming(tasksData) {
    const now = Date.now();
    const limit = now + HORIZON_DAYS * 86400000;
    const list = [];
    Object.keys(tasksData).forEach((dateKey) => {
      const [y, m, d] = dateKey.split('-').map(Number);
      (tasksData[dateKey] || []).forEach((t) => {
        if (t.done || !t.time || !y || queue.includes(t.id)) return;
        const [hh, mm] = t.time.split(':').map(Number);
        const base = new Date(y, m - 1, d, hh, mm).getTime();
        for (let i = 0; i < REPEATS; i++) {
          const at = base + DELAY_MIN * (i + 1) * 60000;
          if (at <= now || at > limit) continue;
          list.push({ at, taskId: t.id, text: t.text, time: t.time, id: hash(t.id + ':' + i) });
        }
      });
    });
    list.sort((a, b) => a.at - b.at);
    return list.slice(0, MAX_SCHEDULED);
  }

  async function run(tasksData) {
    if (!(await ensurePermission())) return;
    const list = upcoming(tasksData);
    if (R) {
      try { await R.schedule({ items: list }); } catch (e) { console.error(e); }
      return;
    }
    // Fallback (sem plugin nativo): notificações do LocalNotifications
    try {
      const pending = await LN.getPending();
      if (pending.notifications.length) await LN.cancel({ notifications: pending.notifications });
      if (list.length) {
        await LN.schedule({
          notifications: list.map((x) => ({
            id: x.id,
            title: '⏰ ' + x.text,
            body: '🕐 ' + x.time + ' — Você concluiu esta tarefa?',
            schedule: { at: new Date(x.at), allowWhileIdle: true },
          })),
        });
      }
    } catch (e) { console.error(e); }
  }

  // Busca as conclusões feitas no pop-up (app fechado ou em segundo plano).
  async function pull() {
    if (!R) return;
    try {
      const r = await R.takeCompleted();
      (r.ids || []).forEach((id) => { if (!queue.includes(id)) queue.push(id); });
      if (queue.length && api.onComplete) api.onComplete();
    } catch (e) {}
  }

  if (R) {
    R.addListener('taskDone', pull);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) pull(); });
    pull();
  }

  const api = {
    onComplete: null,
    takePending: () => queue.splice(0, queue.length),
    // debounce: várias sincronizações seguidas disparam um único reagendamento
    reschedule(tasksData) {
      clearTimeout(timer);
      timer = setTimeout(() => run(tasksData), 500);
    },
  };
  window.AgendaMobile = api;
})();
