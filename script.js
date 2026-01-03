// --- 1. 配置與初始化 ---
const GAS_URL = "https://script.google.com/macros/s/AKfycbw6xwfmAuHucUEGq9MXYcyykrRvaDaeJYikQ93KsIW7YgmN6tVaq4UOKp2G2zAuPdkX/exec";
let myName = localStorage.getItem('hellCodename') || "無名地獄狗";
let partners = [];

// --- 1. 從伺服器抓取全體進度 ---
async function fetchAllProgress() {
    try {
        const response = await fetch(`${GAS_URL}?mode=tasks`);
        const data = await response.json();
        // 將 GAS 資料轉換為前端格式
        partners = data.map((item, index) => ({
            id: index,
            name: item.name,
            tasks: item.tasks
        }));
        renderPartners();
    } catch (e) { console.error("抓取進度失敗", e); }
}

// --- 2. 推送我的進度到伺服器 ---
async function syncMyProgress() {
    const myData = partners.find(p => p.name === myName);
    if (!myData) return;

    try {
        await fetch(GAS_URL, {
            method: 'POST',
            body: JSON.stringify({
                type: 'sync_task',
                author: myName,
                tasks: myData.tasks
            })
        });
        console.log("進度已同步至沙堡總部");
    } catch (e) { console.error("同步失敗", e); }
}

// 修改原本的任務操作函式，加入同步邏輯
function toggleTask(partnerId, taskIdx) {
    const p = partners.find(p => p.id === partnerId);
    if (p.name !== myName) return alert("你不能幫別的狗狗勾選任務！");
    
    p.tasks[taskIdx].done = !p.tasks[taskIdx].done;
    renderAndSync();
}

function renderAndSync() {
    renderPartners();
    syncMyProgress();
}

// 點擊「如果你也掉進地獄」改為「加入進度牆」
function addNewPartner() {
    if (partners.some(p => p.name === myName)) return alert("你的靈魂被禁錮於此！");
    partners.push({ id: Date.now(), name: myName, tasks: [] });
    renderAndSync();
}

// 啟動：每 10 秒自動刷新全體進度
setInterval(fetchAllProgress, 10000);
fetchAllProgress();

// 控制舞台開關介面
function setStageStatus(isOpen) {
    if (!playInput) return;
    playInput.disabled = !isOpen;
    sendBtn.disabled = !isOpen;
    
    if (isOpen) {
        inputContainer.classList.remove('is-locked');
        playInput.placeholder = "🎭 舞台演出中，盡情交流吧！";
        packBtn.classList.remove('ready');
        packBtn.disabled = true;
    } else {
        inputContainer.classList.add('is-locked');
        playInput.placeholder = "🛑 劇場已謝幕。請打包紀錄或點擊「汪！」開場。";
        packBtn.classList.add('ready');
        packBtn.disabled = false;
    }
}

// --- 2. API 互動 ---

async function renderLogs(forceUpdate = false) {
    try {
        const response = await fetch(GAS_URL);
        const data = await response.json();
        const currentDataString = JSON.stringify(data);
        
        if (!forceUpdate && currentDataString === lastDataString) return;
        lastDataString = currentDataString;
        roleplayLogs = data;

        // 邏輯判斷：最後一則訊息決定狀態
        if (roleplayLogs.length > 0) {
            const lastMsg = roleplayLogs[roleplayLogs.length - 1].text;
            setStageStatus(lastMsg !== "汪汪。");
        } else {
            setStageStatus(false); 
        }

        const display = document.getElementById('log-display');
        if (!display) return;
        display.innerHTML = roleplayLogs.map((log) => {
            if (log.text === "汪！" || log.text === "汪汪。") {
                return `<div class="brick-signal">── ${log.author}：${log.text} ──</div>`;
            }
            return `
                <div class="speech-brick ${log.author === myName ? 'is-me' : ''}">
                    <div class="author-tag">${log.author}</div>
                    <div class="brick-text">${log.text}</div>
                </div>
            `;
        }).join('');
        display.scrollTop = display.scrollHeight;
    } catch (e) { console.error("同步失敗", e); }
}

async function handleSend() {
    const text = playInput.value.trim();
    if (!text || playInput.disabled) return;
    
    playInput.disabled = true;
    const originalText = text;
    playInput.value = "刻碑中……";

    try {
        await fetch(GAS_URL, { method: 'POST', body: JSON.stringify({ author: myName, text: originalText }) });
        playInput.value = "";
        renderLogs(true);
    } catch (e) { 
        alert("發送失敗"); 
        playInput.disabled = false; 
        playInput.value = originalText;
    }
}

async function insertSignal(signal) {
    const originalPlaceholder = playInput.placeholder;
    try {
    
        playInput.placeholder = `訊號狗努力中……`;
        
        const response = await fetch(GAS_URL, {
            method: 'POST',
            body: JSON.stringify({ author: myName, text: signal })
        });

        if (response.ok) {
            playInput.placeholder = originalPlaceholder;
            renderLogs(true); 
        }
    } catch (e) {
        console.error("信號發送失敗:", e);
        alert("地獄通訊中斷。");
        playInput.placeholder = originalPlaceholder;
    }
}

// --- 3. 手機端調整 ---

playInput.addEventListener('keydown', (e) => {

    if (e.key === 'Enter' && !e.shiftKey && window.innerWidth > 768) {
        if (!playInput.disabled) {
            e.preventDefault(); 
            handleSend();
        }
    }
});

async function castToStone() {
    // 1. 檢查是否有紀錄
    if (roleplayLogs.length === 0) return alert("舞台上空無一物。");

    const startIdx = roleplayLogs.findLastIndex(l => l.text === "汪！");
    const endIdx = roleplayLogs.findLastIndex(l => l.text === "汪汪。");

    if (startIdx === -1 || endIdx === -1 || startIdx >= endIdx) {
        return alert("找不到完整的『汪！』到『汪汪。』區間。");
    }

    // 2. 擷取對話
    const logs = roleplayLogs.slice(startIdx + 1, endIdx);
    const content = logs.map(l => `【${l.author}】: ${l.text}`).join('\n');
    const formattedText = `【地獄狗角噗紀錄】\n${new Date().toLocaleString()}\n----------------\n${content}\n----------------`;

    try {
        // 3. 嘗試複製到剪貼簿 (注意：這在 local file 環境可能會失敗)
        await navigator.clipboard.writeText(formattedText);
        
        // 4. 確認是否清空
        if (confirm("紀錄已複製！現在要清空舞台並前往沙堡嗎？")) {
            const docUrlEl = document.getElementById('doc-url');
            
            // 【優化】先開啟新分頁，避免被瀏覽器攔截
            if (docUrlEl) {
                window.open(docUrlEl.value, '_blank');
            }

            // 【優化】發送清空指令到 GAS
            await fetch(GAS_URL, { 
                method: 'POST', 
                body: JSON.stringify({ action: 'clear' }) 
            });

            // 5. 確保資料清空後再重整
            location.reload();
        }
    } catch (err) {
        console.error("打包過程出錯:", err);
        alert("打包失敗。原因可能是：\n1. 瀏覽器攔截了剪貼簿（請在 GitHub Pages HTTPS 下測試）\n2. 網路通訊中斷");
    }
}

async function clearStageManually() {
    if (!confirm("🔥 確定要徹底抹除舞台上的所有痕跡嗎？（不可復原）")) return;
    await fetch(GAS_URL, { method: 'POST', body: JSON.stringify({ action: 'clear' }) });
    location.reload();
}

function changeName() {
    const n = prompt("重塑靈魂代號：", myName);
    if (n) { myName = n; localStorage.setItem('hellCodename', n); updateNameDisplay(); renderLogs(true); }
}

function insertNewLine() {
    const s = playInput.selectionStart;
    playInput.value = playInput.value.substring(0, s) + "\n" + playInput.value.substring(playInput.selectionEnd);
    playInput.selectionStart = playInput.selectionEnd = s + 1;
    playInput.focus();
}

function scrollToChatTop() {
    const display = document.getElementById('log-display');
    if (display) display.scrollTo({ top: 0, behavior: 'smooth' });
}

// --- 4. 啟動循環 ---
setInterval(() => renderLogs(false), 5000);
updateNameDisplay();
renderLogs(true);