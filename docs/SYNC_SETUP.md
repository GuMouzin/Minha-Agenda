# Sincronização PC ↔ Android (Firebase)

Cada aparelho entra com o mesmo e-mail/senha; as tarefas ficam no Firestore (gratuito para uso pessoal)
e são espelhadas em tempo real. Funciona offline: o que você altera sem internet é enviado ao reconectar.

## 1. Criar o projeto Firebase (uma vez)
1. https://console.firebase.google.com → **Adicionar projeto**.
2. **Build → Authentication → Começar → E-mail/senha → Ativar**.
3. **Build → Firestore Database → Criar banco** (modo produção, região mais próxima).
4. Aba **Regras** do Firestore: cole o conteúdo de `firestore.rules` e publique.
5. **Configurações do projeto → Seus apps → `</>` (Web)** → registre o app e copie o objeto `firebaseConfig`.
6. Cole `apiKey`, `authDomain`, `projectId` e `appId` em `firebase-config.js`.

(A apiKey do Firebase Web não é segredo; quem protege os dados são as regras do passo 4.)

## 2. Desktop (Electron)
```
npm install
npm start
```
Clique em ☁ → crie a conta (ou entre). Suas tarefas locais atuais sobem para a nuvem no primeiro login.

## 3. Android
Requisitos: Android Studio (traz SDK e JDK).
```
npm run android:sync     # gera www/ e copia para android/
npm run android:open     # abre no Android Studio → Run ▶ (celular com depuração USB) ou Build APK
```
No app, toque em ☁ e entre com a mesma conta.

## Lembretes
- Desktop: pop-up + beep, 20 min após o horário, repetindo a cada 20 min (como antes).
- Android: notificações agendadas no mesmo ritmo (20 min após o horário, até 5 avisos), reagendadas
  a cada mudança. Concluir a tarefa em qualquer aparelho cancela os avisos no celular assim que sincronizar.
  Permita notificações e "alarmes e lembretes" para o app nas configurações do Android.
