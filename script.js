// --- 1. 全域配置 ---
const GAS_URL = "https://script.google.com/macros/s/AKfycbw6xwfmAuHucUEGq9MXYcyykrRvaDaeJYikQ93KsIW7YgmN6tVaq4UOKp2G2zAuPdkX/exec";
let myName = localStorage.getItem('hellCodename') || "無名地獄狗";
let roleplayLogs = [];
let partners = [];
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
            text: "3. 一位戴著墨鏡的哈士奇問你：「你的罪是什麼？」你回答...",
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

// --- 2. 進度追蹤系統 ---

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