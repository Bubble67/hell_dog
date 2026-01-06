// --- 1. 配置與變數 ---
const GAS_URL = "https://script.google.com/macros/s/AKfycbywdOnwMDAEG5PkNZgkQlNXaF8BGPVn3ZdRWueepOek4gqVKGLQJqC-Q1XM4sOyL3hCJw/exec"; 
// 這裡很重要：確保讀取到的身分跟你在測驗頁面設定的一樣
let myIdentity = JSON.parse(localStorage.getItem('hellDogIdentity')) || { name: "無名地獄狗", breed: "遊蕩靈魂" };
let partners = []; 
let records = JSON.parse(localStorage.getItem('hellRecords')) || []; 

// --- 2. 初始化 ---
document.addEventListener('DOMContentLoaded', () => {
    // 同步代號
    const authorInput = document.getElementById('author-name');
    if (authorInput) {
        authorInput.value = localStorage.getItem('hellCodename') || myIdentity.name;
    }
    
    autoSave(); 
    renderRecords(); 
    fetchCloudTasks(); // 從雲端抓取目前的進度牆
    setInterval(fetchCloudTasks, 15000); // 縮短同步時間，讓你更快看到結果
});

// --- 3. 打字機與日誌 (保持測試專用程式的功能) ---
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

// --- 4. 雲端同步邏輯 ---

async function fetchCloudTasks() {
    const statusEl = document.getElementById('sync-status');
    try {
        const response = await fetch(`${GAS_URL}?mode=tasks`, { cache: 'no-store' });
        const data = await response.json();
        partners = data; // 更新全域的進度資料
        renderProgressWall(); // 重新畫出牆面
        if(statusEl) statusEl.textContent = "● 沙堡地基同步中";
    } catch (e) {
        if(statusEl) statusEl.textContent = "○ 訊號微弱 (離線模式)";
    }
}

async function syncMyProgress(myTasks) {
    const statusEl = document.getElementById('sync-status');
    if(statusEl) statusEl.textContent = "🚧 正在搬運磚塊至雲端...";
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
        setTimeout(fetchCloudTasks, 1000); // 發送後 1 秒強制刷一遍畫面
    } catch (e) {
        alert("搬運失敗！");
    }
}

// --- 5. 任務管理：解決「找不到位置」的關鍵 ---

function addNewPartner() {
    // 檢查是否已經存在（避免重複加入）
    const exists = partners.some(p => p.name === myIdentity.name);
    if (exists) {
        alert("你已經在工地裡了！請找屬於你的那張卡片。");
        return;
    }
    
    // 初始化空任務並同步
    const initialTasks = [];
    partners.push({ name: myIdentity.name, tasks: initialTasks });
    syncMyProgress(initialTasks);
}

function addTask(e, dogName) {
    if (e.key === 'Enter' && e.target.value.trim() !== "") {
        // 安全檢查：只能改自己的
        if (dogName !== myIdentity.name) return alert("別人的狗命，不要亂動！");
        
        const taskName = e.target.value;
        let target = parseInt(prompt(`設定「${taskName}」的重量 (500-900)：`, 500)) || 500;
        
        // 強制地獄規範
        target = Math.max(500, Math.min(900, target));

        const dog = partners.find(p => p.name === dogName);
        dog.tasks.push({ text: taskName, done: false, wordCount: 0, targetWords: target });
        
        e.target.value = "";
        syncMyProgress(dog.tasks);
    }
}

function updateProgress(dogName, tIdx) {
    if (dogName !== myIdentity.name) return alert("這不是你的靈魂重量...");
    
    const dog = partners.find(p => p.name === dogName);
    const task = dog.tasks[tIdx];
    const n = prompt(`更新「${task.text}」目前的搬運進度：`, task.wordCount);
    
    if (n !== null) {
        task.wordCount = parseInt(n) || 0;
        task.done = task.wordCount >= task.targetWords; // 達標自動打勾
        syncMyProgress(dog.tasks);
    }
}

// 禁止手動勾選
function toggleTask(dogName, tIdx) {
    if (dogName !== myIdentity.name) return;
    const dog = partners.find(p => p.name === dogName);
    const task = dog.tasks[tIdx];

    if (!task.done && task.wordCount < task.targetWords) {
        alert(`🛑 絕對不可以偷懶！目前才搬了 ${task.wordCount}/${task.targetWords}。`);
        return; 
    }
    task.done = !task.done;
    syncMyProgress(dog.tasks);
}