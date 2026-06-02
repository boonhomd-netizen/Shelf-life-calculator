/**
 * Shelf Life Calculator - App Logic
 * คำนวณอายุการจัดเก็บสินค้าอัตโนมัติ
 */

(function () {
    'use strict';

    // ===========================
    // DOM Elements
    // ===========================
    const modeToggle = document.getElementById('modeToggle');
    const modeExpiry = document.getElementById('modeExpiry');
    const modeMfg = document.getElementById('modeMfg');
    const dateLabel = document.getElementById('dateLabel');
    const dateInput = document.getElementById('dateInput');
    const todayBtn = document.getElementById('todayBtn');
    const shelfLifeInput = document.getElementById('shelfLifeInput');
    const unitSelector = document.getElementById('unitSelector');
    const presetGrid = document.getElementById('presetGrid');
    const calcForm = document.getElementById('calcForm');
    const calculateBtn = document.getElementById('calculateBtn');
    const resultCard = document.getElementById('resultCard');
    const resetBtn = document.getElementById('resetBtn');
    const copyBtn = document.getElementById('copyBtn');
    const historyList = document.getElementById('historyList');
    const historyEmpty = document.getElementById('historyEmpty');
    const clearHistoryBtn = document.getElementById('clearHistoryBtn');
    const toast = document.getElementById('toast');
    const toastText = document.getElementById('toastText');

    // Result elements
    const resultMfgDate = document.getElementById('resultMfgDate');
    const resultExpDate = document.getElementById('resultExpDate');
    const timelineFill = document.getElementById('timelineFill');
    const timelineShelfLabel = document.getElementById('timelineShelfLabel');
    const detailMfgDate = document.getElementById('detailMfgDate');
    const detailExpDate = document.getElementById('detailExpDate');
    const detailShelfLife = document.getElementById('detailShelfLife');
    const detailRemainingDays = document.getElementById('detailRemainingDays');
    const remainingIcon = document.getElementById('remainingIcon');
    const progressPercent = document.getElementById('progressPercent');
    const progressBarFill = document.getElementById('progressBarFill');

    // ===========================
    // State
    // ===========================
    let currentMode = 'expiry'; // 'expiry' = know MFG, calc EXP | 'mfg' = know EXP, calc MFG
    let currentUnit = 'days';
    let selectedPreset = null;
    let history = [];
    let lastResult = null;

    // ===========================
    // Initialization
    // ===========================
    function init() {
        loadHistory();
        setTodayDate();
        bindEvents();
        renderHistory();
    }

    function setTodayDate() {
        const today = new Date();
        dateInput.value = formatDateForInput(today);
    }

    function formatDateForInput(date) {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }

    // ===========================
    // Event Binding
    // ===========================
    function bindEvents() {
        // Mode toggle
        modeExpiry.addEventListener('click', () => setMode('expiry'));
        modeMfg.addEventListener('click', () => setMode('mfg'));

        // Today button
        todayBtn.addEventListener('click', () => {
            dateInput.value = formatDateForInput(new Date());
            dateInput.focus();
        });

        // Unit selector
        unitSelector.addEventListener('click', (e) => {
            const btn = e.target.closest('.unit-btn');
            if (!btn) return;
            setUnit(btn.dataset.unit);
        });

        // Preset grid
        presetGrid.addEventListener('click', (e) => {
            const btn = e.target.closest('.preset-btn');
            if (!btn) return;
            selectPreset(btn);
        });

        // Form submit
        calcForm.addEventListener('submit', (e) => {
            e.preventDefault();
            calculate();
        });

        // Reset
        resetBtn.addEventListener('click', resetForm);

        // Copy
        copyBtn.addEventListener('click', copyResult);

        // Clear history
        clearHistoryBtn.addEventListener('click', clearHistory);

        // Keyboard shortcut: Enter to calculate
        shelfLifeInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                calculate();
            }
        });
    }

    // ===========================
    // Mode Switching
    // ===========================
    function setMode(mode) {
        currentMode = mode;

        // Update buttons
        modeExpiry.classList.toggle('active', mode === 'expiry');
        modeMfg.classList.toggle('active', mode === 'mfg');

        // Update date label
        if (mode === 'expiry') {
            dateLabel.innerHTML = '<span class="label-icon">📆</span> วันผลิต (Manufacturing Date)';
        } else {
            dateLabel.innerHTML = '<span class="label-icon">📆</span> วันหมดอายุ (Expiry Date)';
        }

        // Hide result when switching mode
        resultCard.classList.add('hidden');
        resultCard.classList.remove('show');
    }

    // ===========================
    // Unit Switching
    // ===========================
    function setUnit(unit) {
        currentUnit = unit;
        document.querySelectorAll('.unit-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.unit === unit);
        });

        // Clear preset selection when manually switching units
        clearPresetSelection();
    }

    // ===========================
    // Preset Selection
    // ===========================
    function selectPreset(btn) {
        const days = parseInt(btn.dataset.days);
        selectedPreset = days;

        // Update visual
        document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        // Set value and unit
        shelfLifeInput.value = days;
        setUnit('days');

        // Haptic feedback on mobile
        if (navigator.vibrate) {
            navigator.vibrate(10);
        }
    }

    function clearPresetSelection() {
        selectedPreset = null;
        document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
    }

    // ===========================
    // Calculation
    // ===========================
    function calculate() {
        const dateValue = dateInput.value;
        const shelfValue = parseInt(shelfLifeInput.value);

        if (!dateValue || isNaN(shelfValue) || shelfValue <= 0) {
            showToast('⚠️ กรุณากรอกข้อมูลให้ครบถ้วน');
            return;
        }

        const inputDate = new Date(dateValue + 'T00:00:00');
        const shelfDays = convertToDays(shelfValue, currentUnit);

        let mfgDate, expDate;

        if (currentMode === 'expiry') {
            // Know MFG, calculate EXP
            mfgDate = new Date(inputDate);
            expDate = new Date(inputDate);
            expDate.setDate(expDate.getDate() + shelfDays);
        } else {
            // Know EXP, calculate MFG
            expDate = new Date(inputDate);
            mfgDate = new Date(inputDate);
            mfgDate.setDate(mfgDate.getDate() - shelfDays);
        }

        lastResult = {
            mode: currentMode,
            mfgDate: mfgDate,
            expDate: expDate,
            shelfDays: shelfDays,
            shelfValue: shelfValue,
            shelfUnit: currentUnit
        };

        displayResult(lastResult);
        saveToHistory(lastResult);

        // Haptic feedback
        if (navigator.vibrate) {
            navigator.vibrate([10, 30, 10]);
        }
    }

    function convertToDays(value, unit) {
        switch (unit) {
            case 'months': return Math.round(value * 30.44); // average days per month
            case 'years': return Math.round(value * 365.25);
            default: return value;
        }
    }

    // ===========================
    // Display Result
    // ===========================
    function displayResult(result) {
        const { mfgDate, expDate, shelfDays } = result;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const mfgStr = formatDateThai(mfgDate);
        const expStr = formatDateThai(expDate);

        // Timeline
        resultMfgDate.textContent = formatDateShort(mfgDate);
        resultExpDate.textContent = formatDateShort(expDate);
        timelineShelfLabel.textContent = formatShelfLife(shelfDays);

        // Details
        detailMfgDate.textContent = mfgStr;
        detailExpDate.textContent = expStr;
        detailShelfLife.textContent = formatShelfLife(shelfDays);

        // Remaining days calculation
        const totalMs = expDate.getTime() - mfgDate.getTime();
        const elapsedMs = today.getTime() - mfgDate.getTime();
        const remainingMs = expDate.getTime() - today.getTime();
        const remainingDays = Math.ceil(remainingMs / (1000 * 60 * 60 * 24));
        const elapsedPercent = Math.min(100, Math.max(0, (elapsedMs / totalMs) * 100));
        const remainingPercent = Math.max(0, 100 - elapsedPercent);

        if (remainingDays > 0) {
            if (remainingDays <= 30) {
                detailRemainingDays.textContent = `เหลือ ${remainingDays} วัน ⚠️`;
                detailRemainingDays.style.color = 'var(--warning)';
                remainingIcon.textContent = '⚠️';
                progressBarFill.className = 'progress-bar-fill warning';
            } else {
                detailRemainingDays.textContent = `เหลือ ${remainingDays} วัน`;
                detailRemainingDays.style.color = 'var(--success)';
                remainingIcon.textContent = '✅';
                progressBarFill.className = 'progress-bar-fill good';
            }
        } else if (remainingDays === 0) {
            detailRemainingDays.textContent = 'หมดอายุวันนี้!';
            detailRemainingDays.style.color = 'var(--danger)';
            remainingIcon.textContent = '🚨';
            progressBarFill.className = 'progress-bar-fill expired';
        } else {
            detailRemainingDays.textContent = `หมดอายุแล้ว ${Math.abs(remainingDays)} วัน`;
            detailRemainingDays.style.color = 'var(--danger)';
            remainingIcon.textContent = '❌';
            progressBarFill.className = 'progress-bar-fill expired';
        }

        progressPercent.textContent = `${Math.round(remainingPercent)}%`;

        // Show result card
        resultCard.classList.remove('hidden');
        resultCard.classList.add('show');

        // Animate after a small delay
        requestAnimationFrame(() => {
            setTimeout(() => {
                timelineFill.style.width = `${elapsedPercent}%`;
                progressBarFill.style.width = `${remainingPercent}%`;
            }, 200);
        });

        // Scroll to result
        setTimeout(() => {
            resultCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 300);
    }

    // ===========================
    // Date Formatting
    // ===========================
    const thaiMonths = [
        'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
        'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
    ];

    const thaiMonthsFull = [
        'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
        'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
    ];

    function formatDateThai(date) {
        const d = date.getDate();
        const m = thaiMonthsFull[date.getMonth()];
        const y = date.getFullYear() + 543; // พ.ศ.
        return `${d} ${m} ${y}`;
    }

    function formatDateShort(date) {
        const d = date.getDate();
        const m = thaiMonths[date.getMonth()];
        const y = (date.getFullYear() + 543).toString().slice(-2);
        return `${d} ${m} ${y}`;
    }

    function formatDateISO(date) {
        return formatDateForInput(date);
    }

    function formatShelfLife(days) {
        if (days >= 365) {
            const years = (days / 365.25).toFixed(1);
            return `${years} ปี (${days} วัน)`;
        } else if (days >= 30) {
            const months = (days / 30.44).toFixed(1);
            return `${months} เดือน (${days} วัน)`;
        }
        return `${days} วัน`;
    }

    // ===========================
    // Reset
    // ===========================
    function resetForm() {
        resultCard.classList.add('hidden');
        resultCard.classList.remove('show');
        timelineFill.style.width = '0%';
        progressBarFill.style.width = '0%';
        shelfLifeInput.value = '';
        clearPresetSelection();
        setTodayDate();
        lastResult = null;

        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // ===========================
    // Copy Result
    // ===========================
    function copyResult() {
        if (!lastResult) return;

        const { mfgDate, expDate, shelfDays } = lastResult;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const remainingMs = expDate.getTime() - today.getTime();
        const remainingDays = Math.ceil(remainingMs / (1000 * 60 * 60 * 24));

        let status;
        if (remainingDays > 0) {
            status = `เหลือ ${remainingDays} วัน`;
        } else if (remainingDays === 0) {
            status = 'หมดอายุวันนี้';
        } else {
            status = `หมดอายุแล้ว ${Math.abs(remainingDays)} วัน`;
        }

        const text = [
            '📦 Shelf Life Calculator',
            '━━━━━━━━━━━━━━━━━━━━━',
            `🏭 วันผลิต: ${formatDateThai(mfgDate)}`,
            `📅 วันหมดอายุ: ${formatDateThai(expDate)}`,
            `⏳ อายุการจัดเก็บ: ${formatShelfLife(shelfDays)}`,
            `📊 สถานะ: ${status}`,
            '━━━━━━━━━━━━━━━━━━━━━'
        ].join('\n');

        navigator.clipboard.writeText(text).then(() => {
            showToast('✅ คัดลอกผลลัพธ์แล้ว!');
        }).catch(() => {
            // Fallback
            const textarea = document.createElement('textarea');
            textarea.value = text;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.select();
            try {
                document.execCommand('copy');
                showToast('✅ คัดลอกผลลัพธ์แล้ว!');
            } catch (err) {
                showToast('❌ ไม่สามารถคัดลอกได้');
            }
            document.body.removeChild(textarea);
        });
    }

    // ===========================
    // History Management
    // ===========================
    function saveToHistory(result) {
        const entry = {
            id: Date.now(),
            mode: result.mode,
            mfgDate: formatDateISO(result.mfgDate),
            expDate: formatDateISO(result.expDate),
            shelfDays: result.shelfDays,
            shelfValue: result.shelfValue,
            shelfUnit: result.shelfUnit,
            timestamp: new Date().toISOString()
        };

        history.unshift(entry);
        if (history.length > 20) {
            history = history.slice(0, 20);
        }

        localStorage.setItem('shelfLifeHistory', JSON.stringify(history));
        renderHistory();
    }

    function loadHistory() {
        try {
            const stored = localStorage.getItem('shelfLifeHistory');
            if (stored) {
                history = JSON.parse(stored);
            }
        } catch (e) {
            history = [];
        }
    }

    function clearHistory() {
        if (history.length === 0) return;
        history = [];
        localStorage.removeItem('shelfLifeHistory');
        renderHistory();
        showToast('🗑️ ลบประวัติทั้งหมดแล้ว');
    }

    function renderHistory() {
        if (history.length === 0) {
            historyEmpty.style.display = 'block';
            historyList.innerHTML = '';
            historyList.appendChild(historyEmpty);
            return;
        }

        historyEmpty.style.display = 'none';
        const fragment = document.createDocumentFragment();

        history.forEach((entry, index) => {
            const item = document.createElement('div');
            item.className = 'history-item';
            item.style.animationDelay = `${index * 0.05}s`;

            const mfg = new Date(entry.mfgDate + 'T00:00:00');
            const exp = new Date(entry.expDate + 'T00:00:00');
            const mfgStr = formatDateShort(mfg);
            const expStr = formatDateShort(exp);

            const timeAgo = getTimeAgo(new Date(entry.timestamp));
            const icon = entry.mode === 'expiry' ? '📅' : '🏭';

            item.innerHTML = `
                <span class="history-mode-icon">${icon}</span>
                <div class="history-info">
                    <div class="history-dates">${mfgStr} → ${expStr}</div>
                    <div class="history-shelf">${formatShelfLife(entry.shelfDays)}</div>
                </div>
                <span class="history-time">${timeAgo}</span>
            `;

            item.addEventListener('click', () => {
                // Re-populate form
                if (entry.mode === 'expiry') {
                    setMode('expiry');
                    dateInput.value = entry.mfgDate;
                } else {
                    setMode('mfg');
                    dateInput.value = entry.expDate;
                }
                shelfLifeInput.value = entry.shelfDays;
                setUnit('days');

                // Auto-calculate
                calculate();

                // Scroll to result
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });

            fragment.appendChild(item);
        });

        historyList.innerHTML = '';
        historyList.appendChild(fragment);
    }

    function getTimeAgo(date) {
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'เมื่อกี้';
        if (minutes < 60) return `${minutes} นาที`;
        if (hours < 24) return `${hours} ชม.`;
        if (days < 7) return `${days} วัน`;
        return formatDateShort(date);
    }

    // ===========================
    // Toast
    // ===========================
    function showToast(message) {
        toastText.textContent = message;
        toast.classList.add('show');

        setTimeout(() => {
            toast.classList.remove('show');
        }, 2500);
    }

    // ===========================
    // Start
    // ===========================
    init();
})();
