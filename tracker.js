// --- 1. 配置與變數 ---
const GAS_URL = "https://script.google.com/macros/s/AKfycbzhkXANOIVp2QH3JWa03PRq7KHKZ1d8GShwvGBYYbWfvAlXu5LoszgXeb0J4LmY79cnQw/exec";
let myIdentity = JSON.parse(localStorage.getItem('hellDogIdentity')) || { name: "無名地獄狗", breed: "遊蕩靈魂" };
let partners = []; // 雲端同步的夥伴資料
let records = JSON.parse(localStorage.getItem('hellRecords')) || []; // 本地日誌紀錄

// --- 2. 初始化 ---
document.addEventListener('DOMContentLoaded', () => {
    // 讀取本地暫存
    document.getElementById('draft-area').value = localStorage.getItem('hellDraft') || "";
    document.getElementById('author-name').value = localStorage.getItem('hellCodename') || myIdentity.name;
    
    autoSave(); //
    renderRecords(); //
    fetchCloudTasks(); // 初始撈取雲端資料
    setInterval(fetchCloudTasks, 10000); // 每 10 秒與雲端同步一次
});

// --- 3. 地獄打字機功能 ---
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
        localStorage.setItem('hellCodename', author);
        window.open(docUrl, '_blank');
    });
}

// --- 4. 雲端同步核心 ---
async function fetchCloudTasks() {
    const statusEl = document.getElementById('sync-status');
    try {
        const response = await fetch(`${GAS_URL}?mode=tasks`, { cache: 'no-store' });
        const data = await response.json();
        partners = data;
        renderProgressWall();
        if(statusEl) statusEl.textContent = "● 雲端同步中";
    } catch (e) {
        if(statusEl) statusEl.textContent = "○ 離線模式";
    }
}

async function syncMyProgress(myTasks) {
    const statusEl = document.getElementById('sync-status');
    if(statusEl) statusEl.textContent = "訊號狗搬運中...";
    try {
        await fetch(GAS_URL, {
            method: 'POST',
            mode: 'no-cors',
            body: JSON.stringify({
                type: 'sync_task',
                author: myIdentity.name,
                tasks: myTasks
            })
        });
        setTimeout(fetchCloudTasks, 1000);
    } catch (e) {
        alert("搬運失敗，沙堡磚塊掉在路上了。");
    }
}

// --- 5. 任務管理與限制 ---
function addNewPartner() {
    if (partners.some(p => p.name === myIdentity.name)) return alert("你已經在牆上了！");
    partners.push({ name: myIdentity.name, tasks: [] });
    syncMyProgress([]);
}

function addTask(e, dogName) {
    if (e.key === 'Enter' && e.target.value.trim() !== "") {
        if (dogName !== myIdentity.name) return alert("你不能幫別的狗勾加工作！");
        
        const taskName = e.target.value;
        let targetInput = prompt(`這塊零件有多重？`, 500);
        let target = parseInt(targetInput) || 500;
        
        if (target < 500) {
            alert("🛑 偷懶也不是這樣搞的。");
            target = 500;
        } else if (target > 900) {
            alert("🛑 訊號狗搬不動這麼多沙子！");
            target = 900;
        }

        const dog = partners.find(p => p.name === dogName);
        dog.tasks.push({ text: taskName, done: false, wordCount: 0, targetWords: target });
        e.target.value = "";
        syncMyProgress(dog.tasks);
    }
}

function toggleTask(dogName, tIdx) {
    if (dogName !== myIdentity.name) return;
    const dog = partners.find(p => p.name === dogName);
    const task = dog.tasks[tIdx];

    if (!task.done && task.wordCount < task.targetWords) {
        alert(`🛑 絕對不可以！沙子還不夠重（目前 ${task.wordCount}/${task.targetWords}），不准偷懶！`);
        return; 
    }
    task.done = !task.done;
    syncMyProgress(dog.tasks);
}

// --- 6. 渲染 UI ---
function renderProgressWall() {
    const grid = document.getElementById('partner-grid');
    if(!grid) return;
    
    grid.innerHTML = partners.map(p => {
        const cur = p.tasks.reduce((sum, t) => sum + (t.wordCount || 0), 0);
        const tar = p.tasks.reduce((sum, t) => sum + (t.targetWords || 0), 0);
        const prg = tar === 0 ? 0 : Math.round((cur / tar) * 100);

        return `
            <div class="partner-card">
                <div class="partner-name">${p.name} <span style="float:right; color:var(--accent-color)">${prg}%</span></div>
                <div class="ind-progress-container"><div class="ind-progress-bar" style="width:${Math.min(100, prg)}%"></div></div>
                <ul class="task-list">
                    ${p.tasks.map((t, i) => `
                        <li class="task-item">
                            <div class="check-box ${t.done ? 'done' : ''}" onclick="toggleTask('${p.name}', ${i})"></div>
                            <span class="task-text ${t.done ? 'done' : ''}" onclick="updateProgress('${p.name}', ${i})">
                                ${t.text} <small>(${t.wordCount}/${t.targetWords})</small>
                            </span>
                        </li>
                    `).join('')}
                </ul>
                ${p.name === myIdentity.name ? `<input type="text" class="input-mini" placeholder="+ Enter 新增任務" onkeypress="addTask(event, '${p.name}')">` : ""}
            </div>`;
    }).join('') + (partners.some(p => p.name === myIdentity.name) ? "" : `<div class="add-partner-card" onclick="addNewPartner()"><div class="plus-icon">+</div>加入進度牆</div>`);
}

function saveToLocalRecord(author, count) {
    records.unshift({ author, count, time: new Date().toLocaleTimeString() });
    records = records.slice(0, 5);
    localStorage.setItem('hellRecords', JSON.stringify(records));
    renderRecords();
}

function renderRecords() {
    const container = document.getElementById('bricks-container');
    if(container) {
        container.innerHTML = records.map(r => `<li class="task-item" style="border-bottom-style:dashed; color:#888"><span>[${r.time}] <b>${r.author}</b> 搬運了 ${r.count} 粒美沙</span></li>`).join('');
    }
}