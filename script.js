const API_KEY = "AIzaSyDOSIiJOR1Zj_rKFewO9oeDRsBCXBTtQSQ"; 
const URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${API_KEY}`;

let currentUser = { name: "", xp: 0, lvl: 1, quests: 0 };
let currentQuest = "";

// 1. AUTH LOGIC
window.handleLogin = function() {
    const name = document.getElementById('username-input').value.trim();
    const pass = document.getElementById('password-input').value.trim();
    if (!name || !pass) return;
    if (pass !== "admin123" && pass !== name) return alert("ACCESS_DENIED.");

    const allUsers = JSON.parse(localStorage.getItem('terminal_users') || "{}");
    currentUser = allUsers[name] || { name: name, xp: 0, lvl: 1, quests: 0 };
    allUsers[name] = currentUser;
    localStorage.setItem('terminal_users', JSON.stringify(allUsers));

    document.getElementById('auth-container').style.display = 'none';
    document.getElementById('main-interface').style.display = 'flex';
    updateUI();
};

function updateUI() {
    document.getElementById('user-display').innerText = currentUser.name;
    document.getElementById('lvl-val').innerText = currentUser.lvl;
    document.getElementById('xp-val').innerText = currentUser.xp;
    document.getElementById('quest-count').innerText = currentUser.quests;
    document.getElementById('xp-fill').style.width = currentUser.xp + "%";

    const allUsers = JSON.parse(localStorage.getItem('terminal_users') || "{}");
    const sorted = Object.values(allUsers).sort((a,b) => (b.lvl * 100 + b.xp) - (a.lvl * 100 + a.xp));
    document.getElementById('leaderboard-list').innerHTML = sorted.slice(0, 5).map(u => 
        `<li><span>${u.name}</span> <span>LVL ${u.lvl}</span></li>`).join('');
}

// 2. AI HANDLER
async function callAI(prompt) {
    const res = await fetch(URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error.message);
    return data.candidates[0].content.parts[0].text;
}

// DEBUGGER
document.getElementById('debug-btn').onclick = async () => {
    const code = document.getElementById('code-input').value;
    const resZone = document.getElementById('result-zone');
    const resText = document.getElementById('ai-response');
    if(!code) return;
    resZone.style.display = "flex";
    resText.innerText = "> INITIALIZING DEBUG SCAN...";
    try {
        resText.innerText = await callAI("Briefly analyze these bugs and show the fix for this code: " + code);
    } catch (e) { resText.innerText = "> ERR: " + e.message; }
};

// QUEST GENERATOR
document.getElementById('gen-btn').onclick = async () => {
    const qText = document.getElementById('quest-text');
    qText.innerText = "> DOWNLOADING MISSION...";
    try {
        currentQuest = await callAI("Randomly pick ONE language from (Python, JavaScript, HTML/CSS, Java, C++, C#, or Ruby) and give me a tiny coding challenge. Rules: ONE SENTENCE ONLY. NO BOLDING. NO INTRO.");
        qText.innerText = "> MISSION: " + currentQuest;
        document.getElementById('submit-btn').style.display = "block";
    } catch (e) { qText.innerText = "> ERR: GENERATION_FAILED."; }
};

// VERIFIER - WITH BUG FIX
document.getElementById('submit-btn').onclick = async () => {
    const code = document.getElementById('code-input').value;
    const resText = document.getElementById('ai-response');
    const qText = document.getElementById('quest-text');
    const submitBtn = document.getElementById('submit-btn');
    
    if (!currentQuest) return; // Prevents spamming empty submissions

    document.getElementById('result-zone').style.display = "flex";
    resText.innerText = "> VALIDATING SOLUTION...";
    
    try {
        const result = await callAI(`Mission: ${currentQuest}. Code: ${code}. Did they solve it? Answer ONLY with 'PASS' or 'FAIL' followed by one very short sentence.`);
        resText.innerText = result;

        if (result.toUpperCase().includes("PASS")) {
            // Update User Stats
            currentUser.xp += 35;
            currentUser.quests += 1;
            if (currentUser.xp >= 100) { currentUser.lvl++; currentUser.xp = 0; }
            
            // Save to LocalStorage
            const allUsers = JSON.parse(localStorage.getItem('terminal_users') || "{}");
            allUsers[currentUser.name] = currentUser;
            localStorage.setItem('terminal_users', JSON.stringify(allUsers));
            updateUI();

            // BUG FIX: Reset quest state so they can't submit again
            currentQuest = ""; 
            qText.innerText = "> MISSION_ACCOMPLISHED. REQUEST NEW DATA.";
            submitBtn.style.display = "none";
        }
    } catch (e) { resText.innerText = "> ERR: UPLINK_LOST."; }
};

// 3. MATRIX RAIN
const canvas = document.getElementById('binary-canvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth; canvas.height = window.innerHeight;
const drops = Array(Math.floor(canvas.width / 14)).fill(1);
function draw() {
    ctx.fillStyle = "rgba(0,0,0,0.1)"; ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle = "#00ff41"; ctx.font = "14px monospace";
    drops.forEach((y, i) => {
        ctx.fillText(Math.floor(Math.random()*2), i*14, y*14);
        if (y*14 > canvas.height && Math.random() > 0.975) drops[i] = 0;
        drops[i]++;
    });
}
setInterval(draw, 50);