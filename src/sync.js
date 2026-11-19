// Sincronização via Firebase (Auth + Firestore). Empacotado com esbuild em sync.bundle.js
// e exposto como window.AgendaSync. Funciona igual no Electron e no Android (Capacitor).
//
// Modelo: uma tarefa = um documento em users/{uid}/tasks/{id}
//   { dateKey, text, done, time, order, updatedAt, deleted }
// Exclusões viram "tombstones" (deleted: true) para que um aparelho offline
// não ressuscite tarefas apagadas em outro.
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import {
  initializeFirestore,
  persistentLocalCache,
  collection,
  doc,
  setDoc,
  onSnapshot,
  writeBatch,
} from 'firebase/firestore';

const cfg = window.FIREBASE_CONFIG || {};
const configured = !!cfg.apiKey && !String(cfg.apiKey).startsWith('COLE_');

let auth = null;
let db = null;
let uid = null;
let unsubscribe = null;
let handlers = { getData: () => ({}), applyRemote: () => {}, onStatus: () => {} };

// id -> assinatura da última versão conhecida no servidor (ou enviada por nós)
let known = new Map();
let firstSnapshot = true;

const sig = (dateKey, t, order) =>
  JSON.stringify([dateKey, t.text, !!t.done, t.time || null, order]);

function flatten(data) {
  const out = [];
  Object.keys(data).forEach((dateKey) => {
    (data[dateKey] || []).forEach((t, order) => out.push({ dateKey, t, order }));
  });
  return out;
}

function tasksCol() {
  return collection(db, 'users', uid, 'tasks');
}

function status(state, detail) {
  handlers.onStatus({ state, detail, email: auth && auth.currentUser ? auth.currentUser.email : null });
}

// Envia ao Firestore apenas o que mudou desde a última sincronização.
function push(data) {
  if (!db || !uid) return;
  const batch = writeBatch(db);
  let n = 0;
  const present = new Set();

  flatten(data).forEach(({ dateKey, t, order }) => {
    present.add(t.id);
    const s = sig(dateKey, t, order);
    if (known.get(t.id) === s) return;
    known.set(t.id, s);
    batch.set(doc(tasksCol(), t.id), {
      dateKey,
      text: t.text,
      done: !!t.done,
      time: t.time || null,
      order,
      deleted: false,
      updatedAt: Date.now(),
    });
    n++;
  });

  // Removidas localmente -> tombstone
  [...known.keys()].forEach((id) => {
    if (present.has(id) || known.get(id) === 'deleted') return;
    known.set(id, 'deleted');
    batch.set(doc(tasksCol(), id), { deleted: true, updatedAt: Date.now() }, { merge: true });
    n++;
  });

  if (n > 0) {
    batch.commit().catch((e) => status('error', e.message));
  }
}

function startListening() {
  firstSnapshot = true;
  known = new Map();
  unsubscribe = onSnapshot(
    tasksCol(),
    (snap) => {
      const remote = new Map();
      snap.forEach((d) => remote.set(d.id, d.data()));

      const local = handlers.getData();
      const localById = new Map();
      flatten(local).forEach(({ t }) => localById.set(t.id, t));

      const rebuilt = {};
      const push_ = (dateKey, order, task) => {
        (rebuilt[dateKey] = rebuilt[dateKey] || []).push({ order, task });
      };

      remote.forEach((r, id) => {
        if (r.deleted) {
          known.set(id, 'deleted');
          return;
        }
        const prev = localById.get(id);
        const task = {
          id,
          text: r.text,
          done: !!r.done,
          time: r.time || null,
          // nextCheckTime é local de cada aparelho (controle dos lembretes)
          nextCheckTime: prev ? prev.nextCheckTime || null : null,
        };
        known.set(id, sig(r.dateKey, task, r.order));
        push_(r.dateKey, r.order, task);
      });

      // Primeira sincronização: tarefas que só existem neste aparelho entram na nuvem.
      let adoptLocal = false;
      if (firstSnapshot) {
        flatten(local).forEach(({ dateKey, t, order }) => {
          if (!remote.has(t.id)) {
            push_(dateKey, 1000 + order, t);
            adoptLocal = true;
          }
        });
        firstSnapshot = false;
      }

      const data = {};
      Object.keys(rebuilt).forEach((dateKey) => {
        data[dateKey] = rebuilt[dateKey].sort((a, b) => a.order - b.order).map((x) => x.task);
      });

      handlers.applyRemote(data);
      if (adoptLocal) push(data);
      status(snap.metadata.fromCache && snap.metadata.hasPendingWrites ? 'pending' : 'online');
    },
    (err) => status('error', err.message)
  );
}

function init(h) {
  handlers = Object.assign(handlers, h);
  if (!configured) {
    status('unconfigured');
    return;
  }
  const app = initializeApp(cfg);
  auth = getAuth(app);
  db = initializeFirestore(app, { localCache: persistentLocalCache() });

  onAuthStateChanged(auth, (user) => {
    if (unsubscribe) {
      unsubscribe();
      unsubscribe = null;
    }
    uid = user ? user.uid : null;
    if (user) {
      status('connecting');
      startListening();
    } else {
      status('signedout');
    }
  });
}

window.AgendaSync = {
  configured,
  init,
  push,
  signIn: (email, pass) => signInWithEmailAndPassword(auth, email, pass),
  signUp: (email, pass) => createUserWithEmailAndPassword(auth, email, pass),
  signOut: () => signOut(auth),
};
