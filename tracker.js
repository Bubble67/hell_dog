// --- 1. 配置與變數 ---
const GAS_URL = "https://script.google.com/macros/s/AKfycbywdOnwMDAEG5PkNZgkQlNXaF8BGPVn3ZdRWueepOek4gqVKGLQJqC-Q1XM4sOyL3hCJw/exec"; 
let myIdentity = JSON.parse(localStorage.getItem('hellDogIdentity')) || { name: "無名地獄狗", breed: "遊蕩靈魂" };
let partners = []; // 存放置雲端撈回的所有狗勾進度

// --- 2. 初始化 ---
document.addEventListener('DOMContentLoaded', () => {
    // 讀取本地暫存草稿
    const savedDraft = localStorage.getItem('hellDraftTemp');
    if (savedDraft) {
        document.getElementById('draft-area').value = savedDraft;
        countWords();
    }
    
    // 初始撈取雲端資料
    fetchCloudTasks();
    // 每 20 秒與雲端同步一次
    setInterval(fetchCloudTasks, 20000);
});

// --- 3. 字數計算功能 ---
function countWords() {
    const draftArea = document.getElementById('draft-area');
    const text = draftArea.value;
    
    // 暫存至本地防止斷電丟失
    localStorage.setItem('hellDraftTemp', text);
    
    // 計算不含空格與換行的字數
    const cleanCount = text.replace(/\s/g, '').length;
    document.getElementById('char-count').textContent = cleanCount;
    document.getElementById('total-count').textContent = text.length;
}

// --- 4. 雲端通訊功能 ---

// 從 GAS 撈取所有人的進度
async function fetchCloudTasks() {
    const statusEl = document.getElementById('sync-status');
    try {
        const response = await fetch(`${GAS_URL}?mode=tasks`, { cache: 'no-store' });
        const data = await response.json();
        partners = data;
        renderProgressWall();
        statusEl.textContent = "● 雲端同步中";
    } catch (e) {
        console.error("無法連線至沙堡地基", e);
        statusEl.textContent = "○ 離線模式";
    }
}

// 將自己的進度推送到雲端
async function syncMyProgress(myTasks) {
    const statusEl = document.getElementById('sync-status');
    statusEl.textContent = "訊號狗搬運中...";
    try {
        await fetch(GAS_URL, {
            method: 'POST',
            mode: 'no-cors', // 繞過 CORS 攔截
            body: JSON.stringify({
                type: 'sync_task',
                author: myIdentity.name,
                tasks: myTasks
            })
        });
        // 成功後稍微延遲重抓
        setTimeout(fetchCloudTasks, 1000);
    } catch (e) {
        alert("搬運失敗，沙堡磚塊掉在路上了。");
    }
}

// --- 5. 互動功能 ---

function addNewPartner() {
    // 建立新進度卡片，預設使用目前代號
    const myData = partners.find(p => p.name === myIdentity.name);
    if (myData) return alert("你已經在牆上了！");
    
    partners.push({ name: myIdentity.name, tasks: [] });
    syncMyProgress([]);
}

function addTask(e, dogName) {
    if (e.key === 'Enter' && e.target.value.trim() !== "") {
        if (dogName !== myIdentity.name) return alert("你不能幫別的狗勾加工作！");
        
        let targetInput = prompt(`這塊沙堡零件有多重？(建議 500-900)`, 500);
        let target = parseInt(targetInput) || 500;
        
        // 強制地獄規範
        target = Math.max(500, Math.min(900, target));

        const dog = partners.find(p => p.name === dogName);
        dog.tasks.push({ 
            text: e.target.value, 
            done: false, 
            wordCount: 0, 
            targetWords: target 
        });
        
        e.target.value = "";
        syncMyProgress(dog.tasks);
    }
}

function updateProgress(dogName, tIdx) {
    if (dogName !== myIdentity.name) return alert("這不是你的靈魂重量...");
    
    const dog = partners.find(p => p.name === dogName);
    const task = dog.tasks[tIdx];
    const n = prompt(`更新「${task.text}」目前進度：`, task.wordCount);
    
    if (n !== null) {
        task.wordCount = parseInt(n) || 0;
        task.done = task.wordCount >= task.targetWords; // 字數達標自動打勾
        syncMyProgress(dog.tasks);
    }
}

// --- 6. 渲染 UI ---
function renderProgressWall() {
    const grid = document.getElementById('partner-grid');
    
    const cardsHTML = partners.map(p => {
        const cur = p.tasks.reduce((sum, t) => sum + t.wordCount, 0);
        const tar = p.tasks.reduce((sum, t) => sum + t.targetWords, 0);
        const progress = tar === 0 ? 0 : Math.round((cur / tar) * 100);

        return `
            <div class="partner-card">
                <div class="partner-header">
                    <span class="partner-name">${p.name}</span>
                    <span style="color:var(--accent-color)">${progress}%</span>
                </div>
                <div class="ind-progress-container">
                    <div class="ind-progress-bar" style="width:${Math.min(100, progress)}%"></div>
                </div>
                <ul class="task-list">
                    ${p.tasks.map((t, i) => `
                        <li class="task-item">
                            <div class="check-box ${t.done ? 'done' : ''}"></div>
                            <span class="task-text ${t.done ? 'done' : ''}" onclick="updateProgress('${p.name}', ${i})">
                                ${t.text} <small style="opacity:0.5">(${t.wordCount}/${t.targetWords})</small>
                            </span>
                        </li>
                    `).join('')}
                </ul>
                ${p.name === myIdentity.name ? 
                    `<input type="text" class="input-mini" placeholder="+ 敲 Enter 新增進度" onkeypress="addTask(event, '${p.name}')">` : 
                    `<p style="font-size:0.7em; color:#444; margin-top:10px;">(觀摩其他靈魂的掙扎)</p>`
                }
            </div>
        `;
    }).join('');

    const addBtnHTML = partners.some(p => p.name === myIdentity.name) ? "" : `
        <div class="add-partner-btn" onclick="addNewPartner()" style="border: 2px dashed #444; padding: 20px; border-radius: 12px; cursor: pointer;">
            <div>+ 加入進度牆</div>
            <small>以 ${myIdentity.name} 的身分參與</small>
        </div>
    `;

    grid.innerHTML = cardsHTML + addBtnHTML;
}