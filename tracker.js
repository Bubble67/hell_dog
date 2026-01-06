let partners = JSON.parse(localStorage.getItem('sandcastlePartners')) || [
    { id: 1, name: "建設隊長麻糬", tasks: [{ text: "初始化地獄地基", done: true, wordCount: 500, targetWords: 500 }] }
];
let records = JSON.parse(localStorage.getItem('hellRecords')) || [];

function autoSave() {
    const text = document.getElementById('draft-area').value;
    localStorage.setItem('hellDraft', text);
    const cleanText = text.replace(/\s/g, '');
    document.getElementById('char-count').textContent = cleanText.length;
    document.getElementById('total-count').textContent = text.length;
}

function castToStone() {
    const text = document.getElementById('draft-area').value;
    const author = document.getElementById('author-name').value || "無名寫字狗";
    const docUrl = document.getElementById('doc-select').value;
    const count = document.getElementById('char-count').textContent;

    if (!text.trim()) return alert("這是無字天書嗎……");

    const formatted = `【狗狗沙堡零件搬運】\n寫字狗代號：${author}\n時間：${new Date().toLocaleString()}\n字數：${count}\n--------------------------\n${text}\n--------------------------`;

    navigator.clipboard.writeText(formatted).then(() => {
        alert("🔥 磚塊已鑄造！前往文件貼上。");
        saveToLocalRecord(author, count);
        window.open(docUrl, '_blank');
    });
}

function addNewPartner() {
    const name = prompt("報上你的狗名：");
    if (!name) return;
    partners.push({ id: Date.now(), name, tasks: [] });
    saveAndRender();
}

// 【修復】新增任務：強制規範字數在 500-900 之間
function addTask(e, pId) {
    if (e.key === 'Enter' && e.target.value.trim() !== "") {
        const taskName = e.target.value;
        let targetInput = prompt(`設定「${taskName}」的目標重量（建議 500-900）：`, 500);
        
        if (targetInput !== null) {
            let target = parseInt(targetInput) || 500;
            
            // 強制範圍限制
            if (target < 500) {
                alert("🛑 太輕了！地獄管理員要求最少 500 字，已自動為你修正。");
                target = 500;
            } else if (target > 900) {
                alert("🛑 貪多嚼不爛！上限為 900 字，已自動為你修正。");
                target = 900;
            }

            const p = partners.find(p => p.id === pId);
            p.tasks.push({ text: taskName, done: false, wordCount: 0, targetWords: target });
            e.target.value = "";
            saveAndRender();
        }
    }
}

// 更新進度：若達標自動勾選，未達標自動取消完成狀態
function updateProgress(pId, tIdx) {
    const p = partners.find(p => p.id === pId);
    const task = p.tasks[tIdx];
    const n = prompt(`更新「${task.text}」目前搬運了多少沙子 (目標 ${task.targetWords})：`, task.wordCount);
    if (n !== null) {
        task.wordCount = parseInt(n) || 0;
        task.done = task.wordCount >= task.targetWords;
        saveAndRender();
    }
}

// 【修復】絕對禁止：字數未達標前禁止手動勾選完成
function toggleTask(pId, tIdx) {
    const p = partners.find(p => p.id === pId);
    const task = p.tasks[tIdx];

    // 如果試圖將未完成任務勾選為完成
    if (!task.done && task.wordCount < task.targetWords) {
        alert(`🛑 絕對不可以！沙子還不夠重（目前 ${task.wordCount}/${task.targetWords}），不准偷懶！`);
        return; 
    }

    task.done = !task.done;
    saveAndRender();
}

function deleteTask(pId, tIdx) {
    if (confirm("要拆掉這塊磚嗎？")) {
        partners.find(p => p.id === pId).tasks.splice(tIdx, 1);
        saveAndRender();
    }
}

function removePartner(pId) {
    if (confirm("確定要從工地撤離嗎？")) {
        partners = partners.filter(p => p.id !== pId);
        saveAndRender();
    }
}

function saveAndRender() {
    localStorage.setItem('sandcastlePartners', JSON.stringify(partners));
    const grid = document.getElementById('partner-grid');
    
    let cardsHTML = partners.map(p => {
        const cur = p.tasks.reduce((sum, t) => sum + (t.wordCount || 0), 0);
        const tar = p.tasks.reduce((sum, t) => sum + (t.targetWords || 0), 0);
        const progress = tar === 0 ? 0 : Math.round((cur / tar) * 100);

        return `
            <div class="partner-card">
                <div class="partner-header">
                    <span class="partner-name">${p.name}</span>
                    <span style="color:var(--accent-color)">${progress}%</span>
                </div>
                <div class="ind-progress-container"><div class="ind-progress-bar" style="width:${progress}%"></div></div>
                <ul class="task-list">
                    ${p.tasks.map((t, i) => `
                        <li class="task-item">
                            <div class="check-box ${t.done ? 'done' : ''}" onclick="toggleTask(${p.id}, ${i})"></div>
                            <span class="task-text ${t.done ? 'done' : ''}" onclick="updateProgress(${p.id}, ${i})">
                                ${t.text} <small style="opacity:0.5">(${t.wordCount}/${t.targetWords})</small>
                            </span>
                            <span style="opacity:0.2; cursor:pointer" onclick="deleteTask(${p.id}, ${i})">×</span>
                        </li>
                    `).join('')}
                </ul>
                <input type="text" class="input-mini" placeholder="+ 敲 Enter 新增任務" onkeypress="addTask(event, ${p.id})">
                <div style="text-align:right; margin-top:15px;">
                    <button onclick="removePartner(${p.id})" style="background:none; border:none; color:#444; font-size:0.7em; cursor:pointer;">撤離進度牆</button>
                </div>
            </div>
        `;
    }).join('');

    const addCardHTML = `
        <div class="add-partner-card" onclick="addNewPartner()">
            <div class="plus-icon">+</div>
            <div style="font-weight:bold;">如果你也掉進地獄的話</div>
        </div>
    `;
    grid.innerHTML = cardsHTML + addCardHTML;
}

function saveToLocalRecord(author, count) {
    records.unshift({ author, count, time: new Date().toLocaleTimeString() });
    records = records.slice(0, 5);
    localStorage.setItem('hellRecords', JSON.stringify(records));
    renderRecords();
}

function renderRecords() {
    const container = document.getElementById('bricks-container');
    container.innerHTML = records.map(r => `
        <li class="task-item" style="border-bottom-style:dashed; color:#888">
            <span>[${r.time}] <b>${r.author}</b> 搬運了 ${r.count} 粒美沙</span>
        </li>
    `).join('');
}

window.onload = () => {
    const draft = localStorage.getItem('hellDraft') || "";
    document.getElementById('draft-area').value = draft;
    document.getElementById('author-name').value = localStorage.getItem('hellCodename') || "";
    document.getElementById('author-name').oninput = (e) => localStorage.setItem('hellCodename', e.target.value);
    autoSave();
    renderRecords();
    saveAndRender();
};