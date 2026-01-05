// --- 1. 配置與變數 ---
const GAS_URL = "https://script.google.com/macros/s/AKfycbw6xwfmAuHucUEGq9MXYcyykrRvaDaeJYikQ93KsIW7YgmN6tVaq4UOKp2G2zAuPdkX/exec";
// 預設身分補足 breed，避免顯示 undefined
let myIdentity = JSON.parse(localStorage.getItem('hellDogIdentity')) || { name: "無名地獄狗", breed: "遊蕩靈魂" };
let lastDataString = "";

// --- 2. 初始化 ---
document.addEventListener('DOMContentLoaded', () => {
    updateIdentityDisplay();
    renderLogs();
    setInterval(renderLogs, 5000); 

    const playInput = document.getElementById('play-input');
    if (playInput) {
        playInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey && window.innerWidth > 768) {
                e.preventDefault();
                handleSend();
            }
        });
    }
});

// --- 3. 核心功能函式 ---

function updateIdentityDisplay() {
    const display = document.getElementById('current-dog');
    if (display) {
        // 確保 breed 存在
        const breedText = myIdentity.breed || "遊蕩靈魂";
        display.textContent = `當前靈魂：${myIdentity.name} (${breedText})`;
    }
}

async function renderLogs() {
    const display = document.getElementById('log-display');
    if (!display) return;
    try {
        const response = await fetch(GAS_URL);
        const data = await response.json();
        
        if (JSON.stringify(data) === lastDataString) return;
        lastDataString = JSON.stringify(data);

        display.innerHTML = data.map(log => {
            if (log.text === "汪！" || log.text === "汪汪。") {
                return `<div class="brick-signal">── ${log.author}：${log.text} ──</div>`;
            }
            return `
                <div class="speech-brick ${log.author === myIdentity.name ? 'is-me' : ''}">
                    <div class="author-tag">${log.author}</div>
                    <div class="brick-text">${log.text}</div>
                </div>`;
        }).join('');
        
        display.scrollTop = display.scrollHeight;
    } catch (e) {
        console.error("對話載入失敗", e);
    }
}

function scrollToTop() {
    const display = document.getElementById('log-display');
    if (display) {
        display.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

async function handleSend() {
    const input = document.getElementById('play-input');
    const text = input.value.trim();
    if (!text) return;

    // 「訊號狗努力中」狀態提示
    const originalPlaceholder = input.placeholder;
    input.placeholder = "訊號狗努力中……";
    input.disabled = true;

    try {
        await fetch(GAS_URL, {
            method: 'POST',
            body: JSON.stringify({ author: myIdentity.name, text: text })
        });
        input.value = "";
        renderLogs();
    } finally {
        input.disabled = false;
        input.placeholder = "在此刻下此碑...";
        input.focus();
    }
}

async function insertSignal(signal) {
    const input = document.getElementById('play-input');
    const originalPlaceholder = input.placeholder;
    
    input.placeholder = "訊號狗努力中……";
    try {
        await fetch(GAS_URL, {
            method: 'POST',
            body: JSON.stringify({ author: myIdentity.name, text: signal })
        });
        renderLogs();
    } catch (e) {
        alert("訊號傳遞失敗。");
    } finally {
        input.placeholder = originalPlaceholder;
    }
}

function packLogs() {
    const logs = JSON.parse(lastDataString || "[]");
    if (logs.length === 0) return alert("舞台上空無一物，無法打包。");

    const content = logs.map(log => {
        if (log.text === "汪！" || log.text === "汪汪。") return `\n── ${log.author}：${log.text} ──\n`;
        return `【${log.author}】: ${log.text}`;
    }).join('\n');

    const formattedText = `【地獄狗角噗紀錄】\n時間：${new Date().toLocaleString()}\n--------------------------\n${content}\n--------------------------`;

    navigator.clipboard.writeText(formattedText).then(() => {
        alert("📦 紀錄已複製到剪貼簿！");
        window.open('https://docs.google.com/document/d/1yhbMQtBR006boJ9OLa7XT-6o31LG0nrIUd3-y6ogrek/edit?tab=t.xpmp99ar9j6c', '_blank');
    });
}

function clearStageManually() {
    if (confirm("確定要粉碎目前的舞台嗎？這會清除雲端所有紀錄。")) {
        fetch(GAS_URL, { method: 'POST', body: JSON.stringify({ type: 'clear' }) })
            .then(() => {
                lastDataString = ""; // 重設緩存
                renderLogs();
            });
    }
}

function changeName() {
    const newName = prompt("重新輸入你的地獄代號：", myIdentity.name);
    if (newName) {
        myIdentity.name = newName;
        localStorage.setItem('hellDogIdentity', JSON.stringify(myIdentity));
        updateIdentityDisplay();
    }
}

function insertNewLine() {
    const input = document.getElementById('play-input');
    const start = input.selectionStart;
    input.value = input.value.substring(0, start) + "\n" + input.value.substring(input.selectionEnd);
    input.selectionStart = input.selectionEnd = start + 1;
    input.focus();
}