// --- 1. 全域配置 ---
const GAS_URL = "https://script.google.com/macros/s/AKfycbw6xwfmAuHucUEGq9MXYcyykrRvaDaeJYikQ93KsIW7YgmN6tVaq4UOKp2G2zAuPdkX/exec";
let myName = localStorage.getItem('hellCodename') || "無名地獄狗";
let roleplayLogs = [];
let lastDataString = "";

// --- 2. 頁面偵測與初始化 ---
document.addEventListener('DOMContentLoaded', () => {
    updateNameDisplay();

    // 偵測進度牆頁面 (tracker.html)
    if (document.getElementById('partner-grid')) {
        initTrackerPage();
    }

    // 偵測角噗頁面 (interaction.html)
    if (document.getElementById('play-input')) {
        initInteractionPage();
    }

    // 偵測測驗頁面 (quiz.html)
    if (document.getElementById('question-container')) {
        initQuizPage();
    }
});

// --- 3. 趣味狗狗測驗 ---
function initQuizPage() {
    // 題目資料庫
    const questions = [
        {
            text: "1. 你剛死掉，醒來發現自己變成狗。你的第一反應是？",
            options: [
                { text: "A. 啊？我還有想做的事沒有做！", type: "shiba" },
                { text: "B. 太好了，終於不用當人了！", type: "golden" },
                { text: "C. 誰把我變成狗的？出來打我啊！", type: "husky" },
                { text: "D. 低頭舔了舔毛，接受現實。", type: "dachshund" }
            ]
        },
        {
            text: "2. 你走進「地獄狗狗公園」，第一眼看到的景象是？",
            options: [
                { text: "A. 狗群圍著噴水池開詩會", type: "dachshund" },
                { text: "B. 地獄管理員在賣狗骨頭咖啡", type: "golden" },
                { text: "C. 火焰樹上掛滿咬壞的筆電", type: "husky" },
                { text: "D. 有隻狗在對月長嚎：「給我Wi-Fi！」", type: "shiba" }
            ]
        },
        {
            text: "3. 一位戴著墨鏡的哈士奇問你：「你的罪是什麼？」你回答……",
            options: [
                { text: "A. 抄襲", type: "dachshund" },
                { text: "B. 通姦", type: "golden" },
                { text: "C. 火鍋加芋頭", type: "husky" },
                { text: "D. 我只是太誠實地活著", type: "shiba" }
            ]
        },
        {
            text: "4. 爪子打字不方便，你決定怎麼創作？",
            options: [
                { text: "A. 用鼻子點螢幕", type: "golden" },
                { text: "B. 向發明狗求助", type: "shiba" },
                { text: "C. 直接吠出詩", type: "husky" },
                { text: "D. 咬筆在地上寫", type: "dachshund" }
            ]
        }
    ];

    // 結果資料庫
    const results = {
        shiba: {
            name: "柴犬",
            desc: "地獄的完美主義者。在世時總想控制一切，下地獄後仍然焦慮地排隊整理狗狗公園的垃圾桶。",
            crime: "過度批評、情緒潔癖、為了正確犧牲快樂",
            style: "句構精準、充滿結構強迫與節奏潔癖",
            hell: "每天重新打掃「自己寫過的字」"
        },
        golden: {
            name: "黃金獵犬",
            desc: "地獄的取悅狂信徒。對每個靈魂都搖尾巴，連惡魔也會被牠的笑容融化。可惜沒人要求牠微笑，但牠依然笑著。",
            crime: "討好型人格、偽善、無止盡的善意過勞",
            style: "暖心、療癒、卻總缺少一點真誠的憤怒",
            hell: "被迫每天稱讚 999 隻狗，不許重複詞彙"
        },
        husky: {
            name: "哈士奇",
            desc: "地獄的瘋狂詩人。靈感過多、理智過少。在地獄裡最愛對月嚎叫、再把月亮寫成自由詩。",
            crime: "反社會創作、過度浪漫、拖稿三千年",
            style: "破碎、詩意、極端跳tone",
            hell: "所有作品都會被自己下一秒推翻"
        },
        dachshund: {
            name: "臘腸犬",
            desc: "地獄的固執守舊派。腳短但志氣長。覺得自己寫的文體才是真正的文學。對新事物會皺鼻子，卻又偷偷在半夜學年輕狗的語氣。",
            crime: "傲慢、守舊、嘴硬心軟",
            style: "考究、慢工出細活、字字如骨頭",
            hell: "永遠卡在第一章，不願刪字"
        }
    };

    let currentQuestion = 0;
    let scores = { shiba: 0, golden: 0, husky: 0, dachshund: 0 };

    function initQuiz() {
        showQuestion(0);
    }

    function showQuestion(index) {
        const container = document.getElementById('question-container');
        container.innerHTML = ''; 
        
        const progress = ((index) / questions.length) * 100;
        document.getElementById('progress').style.width = progress + '%';

        const q = questions[index];
        
        const qDiv = document.createElement('div');
        qDiv.className = 'question-box active';
        
        const title = document.createElement('div');
        title.className = 'question-text';
        title.textContent = q.text;
        qDiv.appendChild(title);

        const optsDiv = document.createElement('div');
        optsDiv.className = 'options';

        q.options.forEach(opt => {
            const btn = document.createElement('button');
            btn.className = 'option-btn';
            btn.textContent = opt.text;
            btn.onclick = () => nextQuestion(opt.type);
            optsDiv.appendChild(btn);
        });

        qDiv.appendChild(optsDiv);
        container.appendChild(qDiv);
    }

    function nextQuestion(type) {
        scores[type]++;
        currentQuestion++;

        if (currentQuestion < questions.length) {
            showQuestion(currentQuestion);
        } else {
            showResult();
        }
    }

    function showResult() {
        document.getElementById('quiz-area').style.display = 'none';
        document.getElementById('result-area').style.display = 'block';

        let maxScore = 0;
        let finalType = 'shiba';

        for (let type in scores) {
            if (scores[type] > maxScore) {
                maxScore = scores[type];
                finalType = type;
            }
        }

        const res = results[finalType];
        document.getElementById('res-name').textContent = "你的狗勾是 — " + res.name;
        document.getElementById('res-desc').textContent = res.desc;
        document.getElementById('res-crime').textContent = res.crime;
        document.getElementById('res-style').textContent = res.style;
        document.getElementById('res-hell').textContent = res.hell;
    }

    initQuiz();
    showQuestion(0); 
}

// --- 4. 進度牆 ---
function initTrackerPage() {
    fetchAllProgress();
    setInterval(fetchAllProgress, 10000);
    // 讀取暫存草稿...
}

// --- 5. 角噗 ---
function initInteractionPage() {
    renderLogs(true);
    setInterval(() => renderLogs(false), 5000);
    // 監聽 Enter 送出...
}

function changeName() {
    const n = prompt("重塑靈魂代號：", myName);
    if (n && n.trim() !== "") { 
        myName = n.trim(); 
        localStorage.setItem('hellCodename', myName); 
        updateNameDisplay(); 
        location.reload(); 
    }
}

// --- 6. 進度追蹤系統 ---

let partners = JSON.parse(localStorage.getItem('sandcastlePartners')) || [
    { id: 1, name: "小黑/麻糬", tasks: [{ text: "拾取沙粒投入", done: true, wordCount: 500, targetWords: 500 }] }
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
        alert("🔥本零件已完成！搬入沙堡組裝。");
        saveToLocalRecord(author, count);
        window.open(docUrl, '_blank');
    });
}

function addNewPartner() {
    const name = prompt("報上你的狗名！：");
    if (!name) return;
    partners.push({ id: Date.now(), name, tasks: [] });
    saveAndRender();
}

function addTask(e, pId) {
    if (e.key === 'Enter' && e.target.value.trim() !== "") {
        const taskName = e.target.value;
        let targetInput = prompt(`這塊沙堡零件有多重？`, 500);
        
        if (targetInput !== null) {
            let target = parseInt(targetInput) || 500;
            
            // 強制範圍限制
            if (target < 500) {
                alert("太少了吧……這什麼豆腐渣工程！！");
                target = 500;
            } else if (target > 900) {
                alert("這麼重的沙子，狗狗搬不動啦！");
                target = 900;
            }

            const p = partners.find(p => p.id === pId);
            p.tasks.push({ text: taskName, done: false, wordCount: 0, targetWords: target });
            e.target.value = "";
            saveAndRender();
        }
    }
}

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
        alert(`🛑休想蒙混過關！`);
        return; 
    }

    task.done = !task.done;
    saveAndRender();
}

function deleteTask(pId, tIdx) {
    if (confirm("半途而廢！但你下定決心就好。")) {
        partners.find(p => p.id === pId).tasks.splice(tIdx, 1);
        saveAndRender();
    }
}

function removePartner(pId) {
    if (confirm("真的要跟沙堡說掰掰嗎？")) {
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
            <span>[${r.time}] <b>${r.author}</b> 搬運了 ${r.count} 粒上好美沙</span>
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

// --- 7. 角噗舞台 (用於 interaction.html) ---

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

// --- 8. 初始化啟動器 ---

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