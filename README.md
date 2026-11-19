# 🗓️ Minha Agenda — Desktop & Android

> Agenda e lista de tarefas minimalista para **Windows (Electron)** e **Android (Capacitor)**, com **sincronização em tempo real entre os dois** via Firebase: o que você cria no PC aparece no celular e vice-versa.

---

## 🎯 Sobre o Projeto
O **Minha-Agenda** nasceu da necessidade de ter uma ferramenta de produtividade leve, customizada e integrada ao ambiente de trabalho (Windows), focada em organização diária sem as distrações de aplicações web tradicionais. Agora ela também roda no **Android**, com o mesmo código de interface, e os dois lados ficam sincronizados.

---
## 📸 Demonstração Visual

<p align="center">
  <img src="docs/home.png" width="45%" alt="Tela Inicial - Minhas Tarefas" />
  <img src="docs/calendar.png" width="45%" alt="Visão de Calendário" />
</p>
<p align="center">
  <img src="docs/tray.png" width="45%" alt="Menu Tray da Bandeja do Sistema" />
  <img src="docs/reminder.png" width="45%" alt="Pop-up de Lembrete e Conclusão" />
</p>

## 🛠️ Stack Tecnológica
* **Core:** Node.js, JavaScript (ES6+)
* **Desktop:** Electron & `electron-builder`
* **Android:** Capacitor, com um plugin nativo em Java para alarmes e notificações
* **Sincronização:** Firebase Authentication (e-mail/senha) + Cloud Firestore com cache offline
* **Build web:** esbuild (empacota o SDK do Firebase em `sync.bundle.js`)
* **Interface & Estilização:** HTML5, CSS3 customizado (componentes modernos e design system próprio)
* **Automação (Opcional):** Integração com macros do AutoHotkey para atalhos globais de sistema

---

## ✨ Principais Funcionalidades
* **Sincronização PC ↔ Android:** cada tarefa é um documento no Firestore; alterações aparecem nos dois aparelhos em tempo real e funcionam **offline** (enviadas ao reconectar). Exclusões não "ressuscitam" tarefas em outro aparelho.
* **Lembretes nos dois sistemas:**
  * **PC:** pop-up *"Você concluiu esta tarefa?"* com beep, 20 min após o horário, repetindo a cada 20 min.
  * **Android:** alarmes exatos do sistema (funcionam com o app fechado e voltam após reiniciar o celular). A notificação aparece em destaque, como uma chamada, com os botões **Sim** e **Não**; tocar nela abre um pop-up Sim/Não, inclusive sobre a tela bloqueada.
* **Layout adaptado ao celular:** abas da semana, calendário e campos redimensionados para toque.
* **Interface Moderna (*Frameless*) no PC:** janela sem barra de título padrão, com ícone na bandeja do sistema.
* **Calendário e tarefas com horário:** até 10 tarefas por dia, ordenação automática por horário e reordenação por arrastar.
* **Persistência Local:** o progresso é salvo instantaneamente, mesmo sem conta.
* **Empacotamento Nativo:** instalador `.exe` para Windows e `.apk` para Android.

---

## ⚙️ Como Executar o Projeto Localmente

1. **Clone o repositório:**
   ```bash
   git clone https://github.com/GuMouzin/Minha-Agenda.git
   cd Minha-Agenda
   ```

2. **Instale as dependências:**
   ```bash
   npm install
   ```

3. **(Opcional) Configure a sincronização:** crie um projeto no Firebase e cole a configuração em `firebase-config.js`. O passo a passo está em [docs/SYNC_SETUP.md](docs/SYNC_SETUP.md). Sem isso o app funciona normalmente, só que sem sincronizar.

4. **Inicie o aplicativo em modo de desenvolvimento:**
   ```bash
   npm start
   ```

---

## 📦 Como Gerar os Instaladores

### Windows (`.exe`)
```bash
npm run build
```
O instalador sai em `dist/`.

### Android (`.apk`)
Requer o [Android Studio](https://developer.android.com/studio) (traz o SDK e o JDK).
```bash
npm run android:sync   # gera www/ e copia para o projeto android/
npm run android:open   # abre no Android Studio
```
No Android Studio, use **Run ▶** com o celular conectado (depuração USB) ou **Build → Build APK(s)**. O arquivo fica em `android/app/build/outputs/apk/debug/app-debug.apk`.

No celular, permita notificações e, em **Bateria**, deixe o app como **Sem restrições** para os lembretes nunca atrasarem. Em seguida toque em ☁ e entre com a mesma conta usada no PC.

---

## 📂 Estrutura do Projeto
```text
├── main.js              # Processo principal do Electron (janelas, bandeja, lembrete)
├── index.html           # Interface principal (usada no PC e no Android)
├── script.js            # Lógica de tarefas, calendário e integração com a sincronização
├── style.css            # Estilos (inclui o layout mobile)
├── reminder.html        # Pop-up de lembrete do desktop
├── mobile.js            # Agendamento de lembretes no Android (ponte para o plugin nativo)
├── src/sync.js          # Sincronização Firebase (empacotado em sync.bundle.js)
├── firebase-config.js   # Configuração do seu projeto Firebase
├── firestore.rules      # Regras de segurança do Firestore (cada usuário vê só seus dados)
├── scripts/build-web.js # Gera sync.bundle.js e a pasta www/ para o Capacitor
├── capacitor.config.json
├── android/             # Projeto Android (alarmes, notificações e pop-up em Java)
├── assets/              # Ícones
├── docs/                # Imagens e guia de configuração da sincronização
└── package.json         # Dependências, metadados e scripts de build
```

---
*Desenvolvido por **Gustavo Mouzin**.*
