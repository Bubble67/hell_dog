// --- 1. 配置與初始化 (只宣告一次) ---
const GAS_URL = "https://script.google.com/macros/s/AKfycbw6xwfmAuHucUEGq9MXYcyykrRvaDaeJYikQ93KsIW7YgmN6tVaq4UOKp2G2zAuPdkX/exec";
let myName = localStorage.getItem('hellCodename') || "無名地獄狗";
let roleplayLogs = [];
let partners = [];
let lastDataString = "";

// 偵測目前在哪一頁
const playInput = document.getElementById('play-input'); // 角噗
const partnerGrid = document.getElementById('partner-grid'); // 任務追蹤
const sendBtn = document.getElementById('send-btn');
const packBtn = document.getElementById('pack-btn');
const inputContainer = document.getElementById('input-container');

function updateNameDisplay() {
    const dogEl = document.getElementById('current-dog');
    if (dogEl) dogEl.textContent = "當前靈魂：" + myName;
    
    // 如果在任務頁面，同步更新輸入框名稱
    const authorInput = document.getElementById('author-name');
    if (authorInput) authorInput.value = myName;
}

// --- 2. 任務系統 ---

// 【新增】地獄打字機統計邏輯
function countWords() {
    const draftArea = document.getElementById('draft-area');
    if (!draftArea) return;

    const text = draftArea.value;
    const cleanText = text.replace(/\s/g, ''); // 排除所有空格後的字數
    
    // 更新介面上的計數器
    const charEl = document.getElementById('char-count');
    const totalEl = document.getElementById('total-count');
    
    if (charEl) charEl.textContent = cleanText.length;
    if (totalEl) totalEl.textContent = text.length;

    // 自動保存草稿到本地快取，防止重新整理後消失
    localStorage.setItem('hell_draft_temp', text);
}

async function fetchAllProgress() {
    if (!partnerGrid) return;
    try {
        const response = await fetch(`${GAS_URL}?mode=tasks`);
        const data = await response.json();
        partners = data.map((item, index) => ({
            id: index,
            name: item.name,
            tasks: item.tasks
        }));
        renderPartners();
    } catch (e) { console.error("試圖握住沙粒，卻從指縫流走了……", e); }
}

async function syncMyProgress() {
    const myData = partners.find(p => p.name === myName);
    if (!myData) return;
    try {
        await fetch(GAS_URL, {
            method: 'POST',
            body: JSON.stringify({ type: 'sync_task', author: myName, tasks: myData.tasks })
        });
        console.log("靈魂已，禁錮於此。");
    } catch (e) { console.error("地獄狗，你需要再次嘗試!", e); }
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
                            <span class="task-text" onclick="updateTaskWordCount('${p.name}', ${idx})">${t.text} (${t.wordCount}/${t.targetWords})</span>
                        </li>
                    `).join('')}
                </ul>
                ${isMe ? `<input type="text" class="input-mini" placeholder="+ 新增任務" onkeypress="addTask(event)">` : ''}
            </div>
        `;
    }).join('') + addButtonHTML;
}

function toggleTask(ownerName, idx) {
    if (ownerName !== myName) return alert("壞!地獄狗!不可以亂碰！");
    const p = partners.find(p => p.name === myName);
    const task = p.tasks[idx];
    if (!task.done && task.wordCount < task.targetWords) {
        alert("休想蒙混過關！");
        return; 
    }
    task.done = !task.done; 
    renderAndSync();
}

function updateTaskWordCount(ownerName, idx) {
    if (ownerName !== myName) return alert("別干涉不屬於你的靈魂。");
    const p = partners.find(p => p.name === myName);
    const task = p.tasks[idx];
    const newCount = prompt(`乖地獄狗「${task.text}」再次搬運上好美沙：`, task.wordCount);
    if (newCount !== null) {
        task.wordCount = parseInt(newCount) || 0;
        task.done = (task.wordCount >= task.targetWords);
        renderAndSync();
    }
}

function addTask(e) {
    if (e.key === 'Enter' && e.target.value.trim() !== "") {
        const p = partners.find(p => p.name === myName);
        if (!p) return alert("新來的報上名啊！");
        const target = prompt("設定目標字數：", 500);
        p.tasks.push({ text: e.target.value, done: false, wordCount: 0, targetWords: parseInt(target) || 500 });
        e.target.value = "";
        renderAndSync();
    }
}

function addNewPartner() {
    if (partners.some(p => p.name === myName)) return alert("你的靈魂已被禁錮於此。");
    partners.push({ name: myName, tasks: [] });
    renderAndSync();
}

function renderAndSync() { renderPartners(); syncMyProgress(); }

// --- 3. 角噗舞台 ---

function setStageStatus(isOpen) {
    if (!playInput) return;
    playInput.disabled = !isOpen;
    if (sendBtn) sendBtn.disabled = !isOpen;
    if (inputContainer) isOpen ? inputContainer.classList.remove('is-locked') : inputContainer.classList.add('is-locked');
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
        if (roleplayLogs.length > 0) {
            setStageStatus(roleplayLogs[roleplayLogs.length - 1].text !== "汪汪。");
        }
        display.innerHTML = roleplayLogs.map(log => {
            if (log.text === "汪！" || log.text === "汪汪。") return `<div class="brick-signal">── ${log.author}：${log.text} ──</div>`;
            return `<div class="speech-brick ${log.author === myName ? 'is-me' : ''}"><div class="author-tag">${log.author}</div><div class="brick-text">${log.text}</div></div>`;
        }).join('');
        display.scrollTop = display.scrollHeight;
    } catch (e) { console.error("對話同步失敗", e); }
}

async function handleSend() {
    if (!playInput || playInput.disabled) return;
    const text = playInput.value.trim();
    if (!text) return;
    playInput.disabled = true;
    try {
        await fetch(GAS_URL, { method: 'POST', body: JSON.stringify({ author: myName, text: text }) });
        playInput.value = "";
        renderLogs(true);
    } catch (e) { alert("發送失敗"); playInput.disabled = false; }
}

async function insertSignal(signal) {
    if (!playInput) return;
    try {
        await fetch(GAS_URL, { method: 'POST', body: JSON.stringify({ author: myName, text: signal }) });
        renderLogs(true);
    } catch (e) { alert("通訊中斷"); }
}

// --- 4. 初始化啟動器 ---

updateNameDisplay();

// 根據所在頁面啟動對應循環
if (partnerGrid) { 
    fetchAllProgress();
    setInterval(fetchAllProgress, 10000);

    // 【新增】草稿恢復邏輯：載入時檢查是否有未完成的靈魂重量
    const savedDraft = localStorage.getItem('hell_draft_temp');
    const draftArea = document.getElementById('draft-area');
    if (savedDraft && draftArea) {
        draftArea.value = savedDraft;
        countWords(); // 立即重新計算
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

// 通用功能
function changeName() {
    const n = prompt("重塑靈魂代號：", myName);
    if (n) { myName = n; localStorage.setItem('hellCodename', n); updateNameDisplay(); location.reload(); }
}