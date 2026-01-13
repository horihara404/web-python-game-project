// --- CONFIGURATION ---
const WEBHOOK_URL = "https://script.google.com/macros/s/AKfycbwugYm0SHorNoV9j59Mj2sU6V99tzKPpEDScnAi_KT-lc0lpIn44BvPo7_uqBCRnD62Tw/exec"; // <--- ใส่ URL ตรงนี้
let pyodide;
let currentLevelIndex = 0;
let attemptCount = 0;
let playerName = "";

// 1. เริ่มต้นระบบ (Initialize)
async function init() {
    try {
        pyodide = await loadPyodide();
        document.getElementById('system-status').innerText = "✅ ระบบพร้อมใช้งาน!";
        document.getElementById('system-status').style.color = "#4caf50";
    } catch (err) {
        document.getElementById('system-status').innerText = "❌ โหลด Python ไม่สำเร็จ: " + err;
    }
}

// 2. ฟังก์ชันเริ่มเกม (Switch Page)
document.getElementById('btn-start').addEventListener('click', () => {
    const nameInput = document.getElementById('player-name').value;
    if (!nameInput.trim()) { alert("กรุณากรอกชื่อก่อนเริ่มครับ"); return; }
    if (!pyodide) { alert("รอระบบ Python สักครู่ครับ..."); return; }

    playerName = nameInput;
    document.getElementById('display-name').innerText = playerName;
    
    // สลับหน้า
    document.getElementById('page-welcome').classList.add('hidden');
    document.getElementById('page-game').classList.remove('hidden');
    
    loadLevel(currentLevelIndex);
});

// 3. ฟังก์ชันโหลดโจทย์ (และล้างค่าเก่า)
function loadLevel(index) {
    if (index >= gameLevels.length) {
        alert("ยินดีด้วย! คุณผ่านครบทุกด่านแล้ว");
        return;
    }
    
    const level = gameLevels[index];
    
    // UI Update
    document.getElementById('q-title').innerText = level.title;
    document.getElementById('q-desc').innerText = level.desc;
    document.getElementById('target-output').innerText = level.expected;
    
    // Reset Code & Console
    document.getElementById('python-editor').value = ""; // ล้างโค้ด
    const consoleBox = document.getElementById('console-output');
    consoleBox.innerText = "> รอการรันโค้ด...";
    consoleBox.style.color = "#d4d4d4";
    
    document.getElementById('btn-next').disabled = true;
    attemptCount = 0; // รีเซ็ตจำนวนครั้ง
    updateProgressBar();
}

// 4. ระบบตรวจคำตอบอัจฉริยะ (Validation Logic)
async function validateCode(userCode, level) {
    let logs = [];
    let isPassed = true;

    // 4.1 ตรวจคำห้ามใช้ (Hardcode)
    if (level.forbidden) {
        level.forbidden.forEach(word => {
            if (userCode.replace(/\s/g, "").includes(word.replace(/\s/g, ""))) {
                logs.push(`❌ ห้ามพิมพ์คำตอบตรงๆ (${word})`);
                isPassed = false;
            }
        });
    }

    // 4.2 ตรวจ Pattern บังคับ
    if (level.mustContain) {
        const missing = level.mustContain.filter(item => !userCode.includes(item));
        if (missing.length > 0) {
            logs.push(`❌ ต้องใช้คำสั่ง/เครื่องหมาย: ${missing.join(", ")}`);
            isPassed = false;
        }
    }

    // 4.3 ตรวจค่าตัวแปรใน Memory
    try {
        const pyGlobals = pyodide.globals.toJs();
        if (level.mustHaveVar) {
            if (!pyGlobals.has(level.mustHaveVar)) {
                logs.push(`❌ ไม่พบตัวแปรชื่อ '${level.mustHaveVar}'`);
                isPassed = false;
            } 
            // สามารถเพิ่มการตรวจค่าตัวแปรลึกๆ ได้ที่นี่
        }
    } catch (e) { isPassed = false; }

    return { isPassed, logs };
}

// 5. ปุ่ม Run (Main Execution)
document.getElementById('btn-run').addEventListener('click', async () => {
    attemptCount++;
    const userCode = document.getElementById('python-editor').value;
    const level = gameLevels[currentLevelIndex];
    const consoleBox = document.getElementById('console-output');

    try {
        // Redirect stdout
        pyodide.runPython(`import sys, io; sys.stdout = io.StringIO()`);
        await pyodide.runPythonAsync(userCode);
        const output = pyodide.runPython("sys.stdout.getvalue()").trim();

        // Validate
        const validation = await validateCode(userCode, level);

        if (output === level.expected && validation.isPassed) {
            consoleBox.innerText = `> ${output}\n✅ ถูกต้อง! เก่งมาก`;
            consoleBox.style.color = "#4caf50";
            document.getElementById('btn-next').disabled = false;
            submitToExcel(userCode, "SUCCESS", attemptCount);
        } else {
            const errorMsg = validation.logs.length > 0 ? validation.logs.join("\n") : "ผลลัพธ์ยังไม่ตรง";
            consoleBox.innerText = `> ${output}\n⚠️ ${errorMsg}`;
            consoleBox.style.color = "#f44336";
            submitToExcel(userCode, "FAILED: " + errorMsg, attemptCount);
        }
    } catch (err) {
        consoleBox.innerText = `> Error: ${err.message}`;
        consoleBox.style.color = "#f44336";
        submitToExcel(userCode, "SYNTAX_ERROR", attemptCount);
    }
});

// 6. ปุ่ม Next
document.getElementById('btn-next').addEventListener('click', () => {
    currentLevelIndex++;
    loadLevel(currentLevelIndex);
});

// 7. ส่งข้อมูลไป Excel
function submitToExcel(code, status, attempts) {
    const payload = {
        playerName: playerName,
        questionId: gameLevels[currentLevelIndex].id,
        submittedCode: code,
        status: status,
        attempts: attempts
    };

    fetch(WEBHOOK_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify(payload)
    }).catch(e => console.error("Log Error:", e));
}

function updateProgressBar() {
    const pct = ((currentLevelIndex) / gameLevels.length) * 100;
    document.getElementById('progress-bar').style.width = pct + "%";
}

// เริ่มระบบ
init();