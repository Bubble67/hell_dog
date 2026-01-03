// --- 1. 配置與初始化 ---
const GAS_URL = "https://script.google.com/macros/s/AKfycbw6xwfmAuHucUEGq9MXYcyykrRvaDaeJYikQ93KsIW7YgmN6tVaq4UOKp2G2zAuPdkX/exec";
let myName = localStorage.getItem('hellCodename') || "無名地獄狗";
let roleplayLogs = [];
let partners = [];
let lastDataString = "";

// 取得頁面元素
const playInput = document.getElementById('play-input');
const partnerGrid = document.getElementById('partner-grid');
const sendBtn = document.getElementById('send-btn');
const inputContainer = document.getElementById('input-container');

// 更新顯示狗名
function updateNameDisplay() {
    const dogEl = document.getElementById('current-dog');
    if (dogEl) dogEl.textContent = "當前靈魂：" + myName;
}

// 切換名字功能
function changeName() {
    const n = prompt("重塑靈魂代號：", myName);
    if (n && n.trim() !== "") { 
        myName = n.trim(); 
        localStorage.setItem('hellCodename', myName); 
        updateNameDisplay(); 
        location.reload(); 
    }
}

// --- 2. 任務系統 (用於 tracker.html) ---

function countWords() {
    const draftArea = document.getElementById('draft-area');
    if (!draftArea) return;
    const text = draftArea.value;
    const cleanText = text.replace(/\s/g, ''); 
    const charEl = document.getElementById('char-count');
    const totalEl = document.getElementById('total-count');
    if (charEl) charEl.textContent = cleanText.length;
    if (totalEl) totalEl.textContent = text.length;
    localStorage.setItem('hell_draft_temp', text);
}

async function fetchAllProgress() {
    if (!partnerGrid) return;
    try {
        const response = await fetch(`${GAS_URL}?mode=tasks`);
        const data = await response.json();
        partners = data.map((item, index) => ({ id: index, name: item.name, tasks: item.tasks }));
        renderPartners();
    } catch (e) { console.error("同步進度失敗", e); }
}

async function syncMyProgress() {
    const myData = partners.find(p => p.name === myName);
    if (!myData) return;
    try {
        await fetch(GAS_URL, {
            method: 'POST',
            body: JSON.stringify({ type: 'sync_task', author: myName, tasks: myData.tasks })
        });
    } catch (e) { console.error("同步至雲端失敗", e); }
}

function renderPartners() {
    if (!partnerGrid) return;
    const addButtonHTML = `<button class="add-partner-btn" onclick="addNewPartner()"><span style="font-size: 2em;">+</span><span>加入進度牆</span></button>`;
    partnerGrid.innerHTML = partners.map(p => {
        let currentWords = 0, goalWords = 0;
        p.tasks.forEach(t => { currentWords += (t.wordCount || 0); goalWords += (t.targetWords || 500); });
        const progress = goalWords === 0 ? 0 : Math.min(100, Math.round((currentWords / goalWords) * 100));
        const isMe = p.name === myName;
        return `
            <div class="partner-card" style="${isMe ? 'border-color: var(--accent-color)' : ''}">
                <div class="partner-header"><span class="partner-name">${p.name}</span><b>${progress}%</b></div>
                <div class="ind-progress-container"><div class="ind-progress-bar" style="width: ${progress}%"></div></div>
                <ul class="task-list">
                    ${p.tasks.map((t, idx) => `
                        <li class="task-item">
                            <div class="check-box ${t.done ? 'done' : ''}" onclick="toggleTask('${p.name}', ${idx})"></div>
                            <span class="task-text ${t.done ? 'done' : ''}" onclick="updateTaskWordCount('${p.name}', ${idx})">${t.text} (${t.wordCount}/${t.targetWords})</span>
                        </li>
                    `).join('')}
                </ul>
                ${isMe ? `<input type="text" class="input-mini" placeholder="+ 新增任務" onkeypress="handleTaskAdd(event)">` : ''}
            </div>
        `;
    }).join('') + addButtonHTML;
}

function handleTaskAdd(e) {
    if (e.key === 'Enter' && e.target.value.trim() !== "") {
        const p = partners.find(p => p.name === myName);
        if (!p) return alert("請先加入進度牆");
        const target = prompt("設定目標字數：", 500);
        p.tasks.push({ text: e.target.value, done: false, wordCount: 0, targetWords: parseInt(target) || 500 });
        e.target.value = "";
        renderAndSync();
    }
}

function toggleTask(ownerName, idx) {
    if (ownerName !== myName) return;
    const p = partners.find(p => p.name === myName);
    p.tasks[idx].done = !p.tasks[idx].done;
    renderAndSync();
}

function updateTaskWordCount(ownerName, idx) {
    if (ownerName !== myName) return;
    const p = partners.find(p => p.name === myName);
    const task = p.tasks[idx];
    const newCount = prompt(`「${task.text}」目前搬運量：`, task.wordCount);
    if (newCount !== null) {
        task.wordCount = parseInt(newCount) || 0;
        task.done = (task.wordCount >= task.targetWords);
        renderAndSync();
    }
}

function addNewPartner() {
    if (partners.some(p => p.name === myName)) return alert("你已在牆上。");
    partners.push({ name: myName, tasks: [] });
    renderAndSync();
}

function renderAndSync() { renderPartners(); syncMyProgress(); }

// --- 3. 角噗舞台 (用於 interaction.html) ---

function setStageStatus(isOpen) {
    if (!playInput) return;
    playInput.disabled = !isOpen;
    if (sendBtn) sendBtn.disabled = !isOpen;
    // 鎖定視覺處理
    const container = document.getElementById('input-container');
    if (container) {
        isOpen ? container.classList.remove('is-locked') : container.classList.add('is-locked');
    }
}

async function renderLogs(forceUpdate = false) {
    const display = document.getElementById('log-display');
    if (!display) return;
    try {
        const response = await fetch(GAS_URL);
        const data = await response.json();
        if (!forceUpdate && JSON.stringify(data) === lastDataString) return;
        lastDataString = JSON.stringify(data);
        roleplayLogs = data;

        // 檢查舞台狀態：如果最後一則是「汪汪。」，則關閉舞台
        if (roleplayLogs.length > 0) {
            const lastMsg = roleplayLogs[roleplayLogs.length - 1];
            setStageStatus(lastMsg.text !== "汪汪。");
        } else {
            setStageStatus(false); // 初始沒訊息時預設關閉，需按「汪！」開啟
        }

        display.innerHTML = roleplayLogs.map(log => {
            if (log.text === "汪！" || log.text === "汪汪。") {
                return `<div class="brick-signal">── ${log.author}：${log.text} ──</div>`;
            }
            return `
                <div class="speech-brick ${log.author === myName ? 'is-me' : ''}">
                    <div class="author-tag">${log.author}</div>
                    <div class="brick-text">${log.text}</div>
                </div>`;
        }).join('');
        display.scrollTop = display.scrollHeight;
    } catch (e) { console.error("對話載入失敗", e); }
}

async function handleSend() {
    const text = playInput.value.trim();
    if (!text || playInput.disabled) return;
    playInput.disabled = true;
    try {
        await fetch(GAS_URL, { method: 'POST', body: JSON.stringify({ author: myName, text: text }) });
        playInput.value = "";
        renderLogs(true);
    } catch (e) { alert("通訊失敗"); playInput.disabled = false; }
}

async function insertSignal(signal) {
    try {
        await fetch(GAS_URL, { method: 'POST', body: JSON.stringify({ author: myName, text: signal }) });
        renderLogs(true);
    } catch (e) { alert("訊號中斷"); }
}

// 【重點修正】打包與跳轉邏輯
function castToStone() {
    if (roleplayLogs.length === 0) return alert("這塊碑，是無字天書嗎？");
    const docUrl = document.getElementById('doc-url').value;
    const action = confirm("🔥 留下紀錄就好，把舞台讓給其他狗狗吧？\n(確定：複製文字並前往文件 / 取消：繼續建設)");

    if (action) {
        let content = roleplayLogs.map(log => {
            if (log.text === "汪！" || log.text === "汪汪。") return `\n── ${log.author}：${log.text} ──\n`;
            return `【${log.author}】: ${log.text}`;
        }).join('\n');

        const formattedText = `【地獄狗角噗紀錄】\n時間：${new Date().toLocaleString()}\n--------------------------\n${content}\n--------------------------`;

        navigator.clipboard.writeText(formattedText).then(() => {
            window.open(docUrl, '_blank');
            // 注意：這裡不主動清空伺服器日誌，僅供複製，如需清空需手動處理或透過 GAS
        });
    }
}

// 手動抹除功能 (開發測試用)
function clearStageManually() {
    if (confirm("確定要粉碎目前的舞台嗎？這會清除雲端所有紀錄。")) {
        fetch(GAS_URL, { method: 'POST', body: JSON.stringify({ type: 'clear' }) })
        .then(() => renderLogs(true));
    }
}

// 手機端換行助手
function insertNewLine() {
    const start = playInput.selectionStart;
    playInput.value = playInput.value.substring(0, start) + "\n" + playInput.value.substring(playInput.selectionEnd);
    playInput.selectionStart = playInput.selectionEnd = start + 1;
    playInput.focus();
}

// --- 4. 初始化啟動器 ---

updateNameDisplay();

if (partnerGrid) { 
    fetchAllProgress();
    setInterval(fetchAllProgress, 10000);
    const savedDraft = localStorage.getItem('hell_draft_temp');
    const draftArea = document.getElementById('draft-area');
    if (savedDraft && draftArea) {
        draftArea.value = savedDraft;
        countWords();
    }
}

if (playInput) { 
    renderLogs(true);
    setInterval(() => renderLogs(false), 5000);
    playInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey && window.innerWidth > 768) {
            e.preventDefault();
            handleSend();
        }
    });
}