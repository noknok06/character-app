// ★★★ ここを自分のAPI URLに書き換える ★★★
const API_BASE_URL = 'https://5moouwqlbi.execute-api.ap-northeast-1.amazonaws.com/prod';

// 認証情報（ログイン後に設定される）
let authHeader = '';

// グローバル変数
let allParts = [];
let allCharacters = [];
let currentPartType = 'all';
let editingPartId = null;
let editingCharacterId = null;

// 初期化
document.addEventListener('DOMContentLoaded', () => {
    setupLoginForm();
});

// ログインフォームの設定
function setupLoginForm() {
    const loginForm = document.getElementById('login-form');
    const loginError = document.getElementById('login-error');
    
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const username = document.getElementById('login-username').value;
        const password = document.getElementById('login-password').value;
        
        loginError.textContent = '';
        
        // 認証ヘッダーを生成
        authHeader = 'Basic ' + btoa(username + ':' + password);
        
        // APIで認証確認
        try {
            const response = await fetch(`${API_BASE_URL}/parts`, {
                headers: {
                    'Authorization': authHeader
                }
            });
            
            if (response.ok) {
                // ログイン成功
                document.getElementById('login-screen').style.display = 'none';
                document.getElementById('app-container').style.display = 'block';
                initializeApp();
            } else {
                // ログイン失敗
                loginError.textContent = 'ユーザー名またはパスワードが正しくありません';
                authHeader = '';
            }
        } catch (error) {
            loginError.textContent = '接続エラーが発生しました';
            authHeader = '';
        }
    });
}

async function initializeApp() {
    setupEventListeners();
    await loadParts();
    await loadCharacters();
    renderParts();
    renderCharacters();
}

async function initializeApp() {
    setupEventListeners();
    await loadParts();
    await loadCharacters();
    renderParts();
    renderCharacters();
}

// イベントリスナー設定
function setupEventListeners() {
    // タブ切り替え
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tabName = btn.dataset.tab;
            switchTab(tabName);
        });
    });

    // パーツ種別タブ
    document.querySelectorAll('.part-type-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.part-type-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentPartType = btn.dataset.type;
            renderParts();
        });
    });

    // パーツ作成ボタン
    document.getElementById('add-part-btn').addEventListener('click', () => {
        openPartModal();
    });

    // キャラクター作成ボタン
    document.getElementById('add-character-btn').addEventListener('click', () => {
        openCharacterModal();
    });

    // モーダルクローズ
    document.querySelectorAll('.close-btn, .cancel-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            closeAllModals();
        });
    });

    // フォーム送信
    document.getElementById('part-form').addEventListener('submit', handlePartSubmit);
    document.getElementById('character-form').addEventListener('submit', handleCharacterSubmit);
}

// タブ切り替え
function switchTab(tabName) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    document.getElementById(`${tabName}-section`).classList.add('active');
}

// API呼び出し: パーツ一覧取得
async function loadParts() {
    try {
        const response = await fetch(`${API_BASE_URL}/parts`, {
            headers: {
                'Authorization': authHeader
            }
        });
        const data = await response.json();
        allParts = data.parts || [];
    } catch (error) {
        console.error('パーツの読み込みエラー:', error);
        alert('パーツの読み込みに失敗しました');
    }
}

// API呼び出し: キャラクター一覧取得
async function loadCharacters() {
    try {
        const response = await fetch(`${API_BASE_URL}/characters`, {
            headers: {
                'Authorization': authHeader
            }
        });
        const data = await response.json();
        allCharacters = data.characters || [];
    } catch (error) {
        console.error('キャラクターの読み込みエラー:', error);
        alert('キャラクターの読み込みに失敗しました');
    }
}

// パーツ一覧表示
function renderParts() {
    const container = document.getElementById('parts-list');
    const filteredParts = currentPartType === 'all' 
        ? allParts 
        : allParts.filter(p => p.PartType === currentPartType);

    if (filteredParts.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>パーツがありません</p><p>「+ 新規パーツ作成」ボタンから作成してください</p></div>';
        return;
    }

    container.innerHTML = filteredParts.map(part => `
        <div class="part-card">
            <div class="part-card-header">
                <div>
                    <span class="part-type-badge type-${part.PartType}">${getPartTypeLabel(part.PartType)}</span>
                    <h3>${escapeHtml(part.Name)}</h3>
                </div>
            </div>
            <p>${escapeHtml(part.Description || '')}</p>
            <div class="card-actions">
                <button class="btn-edit" onclick="editPart('${part.PartID}')">編集</button>
                <button class="btn-danger" onclick="deletePart('${part.PartID}')">削除</button>
            </div>
        </div>
    `).join('');
}

// キャラクター一覧表示
function renderCharacters() {
    const container = document.getElementById('characters-list');

    if (allCharacters.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>キャラクターがありません</p><p>「+ 新規キャラクター作成」ボタンから作成してください</p></div>';
        return;
    }

    container.innerHTML = allCharacters.map(char => `
        <div class="character-card">
            <div class="character-card-header">
                <h3>${escapeHtml(char.CharacterName)}</h3>
            </div>
            ${renderCharacterParts(char)}
            <div class="card-actions">
                <button class="btn-detail" onclick="showCharacterDetail('${char.CharacterID}')">詳細</button>
                <button class="btn-copy" onclick="copyCharacterText('${char.CharacterID}')">コピー</button>
                <button class="btn-edit" onclick="editCharacter('${char.CharacterID}')">編集</button>
                <button class="btn-danger" onclick="deleteCharacter('${char.CharacterID}')">削除</button>
            </div>
        </div>
    `).join('');
}

// キャラクターのパーツ情報表示
function renderCharacterParts(char) {
    const parts = char.parts || {};
    let html = '<div class="character-parts">';

    if (parts.Appearance) {
        html += `<div class="character-parts-item"><strong>容姿:</strong> <span>${escapeHtml(parts.Appearance.Name)}</span></div>`;
    }
    if (parts.Personality) {
        html += `<div class="character-parts-item"><strong>性格:</strong> <span>${escapeHtml(parts.Personality.Name)}</span></div>`;
    }
    if (parts.Age) {
        html += `<div class="character-parts-item"><strong>年代:</strong> <span>${escapeHtml(parts.Age.Name)}</span></div>`;
    }
    if (parts.Behaviors && parts.Behaviors.length > 0) {
        html += `<div class="character-parts-item"><strong>行動:</strong><div class="character-parts-list">`;
        parts.Behaviors.forEach(b => {
            html += `<span class="character-parts-tag">${escapeHtml(b.Name)}</span>`;
        });
        html += `</div></div>`;
    }
    if (parts.Restrictions && parts.Restrictions.length > 0) {
        html += `<div class="character-parts-item"><strong>制限:</strong><div class="character-parts-list">`;
        parts.Restrictions.forEach(r => {
            html += `<span class="character-parts-tag">${escapeHtml(r.Name)}</span>`;
        });
        html += `</div></div>`;
    }
    if (parts.Others && parts.Others.length > 0) {
        html += `<div class="character-parts-item"><strong>その他:</strong><div class="character-parts-list">`;
        parts.Others.forEach(o => {
            html += `<span class="character-parts-tag">${escapeHtml(o.Name)}</span>`;
        });
        html += `</div></div>`;
    }

    html += '</div>';
    return html;
}

// パーツモーダルを開く
function openPartModal(partId = null) {
    const modal = document.getElementById('part-modal');
    const form = document.getElementById('part-form');
    const title = document.getElementById('part-modal-title');

    form.reset();
    editingPartId = partId;

    if (partId) {
        title.textContent = 'パーツ編集';
        const part = allParts.find(p => p.PartID === partId);
        if (part) {
            document.getElementById('part-type').value = part.PartType;
            document.getElementById('part-name').value = part.Name;
            document.getElementById('part-description').value = part.Description || '';
        }
    } else {
        title.textContent = 'パーツ作成';
    }

    modal.classList.add('active');
}

// キャラクターモーダルを開く
async function openCharacterModal(characterId = null) {
    const modal = document.getElementById('character-modal');
    const form = document.getElementById('character-form');
    const title = document.getElementById('character-modal-title');

    form.reset();
    editingCharacterId = characterId;

    // パーツ選択肢を設定
    populatePartSelects();

    if (characterId) {
        title.textContent = 'キャラクター編集';
        const char = allCharacters.find(c => c.CharacterID === characterId);
        if (char) {
            document.getElementById('character-name').value = char.CharacterName;
            document.getElementById('character-appearance').value = char.AppearancePartID || '';
            document.getElementById('character-personality').value = char.PersonalityPartID || '';
            document.getElementById('character-age').value = char.AgePartID || '';
            
            // 複数選択のチェックボックス
            (char.BehaviorPartIDs || []).forEach(id => {
                const checkbox = document.querySelector(`#character-behaviors input[value="${id}"]`);
                if (checkbox) checkbox.checked = true;
            });
            (char.RestrictionPartIDs || []).forEach(id => {
                const checkbox = document.querySelector(`#character-restrictions input[value="${id}"]`);
                if (checkbox) checkbox.checked = true;
            });
            (char.OtherPartIDs || []).forEach(id => {
                const checkbox = document.querySelector(`#character-others input[value="${id}"]`);
                if (checkbox) checkbox.checked = true;
            });
        }
    } else {
        title.textContent = 'キャラクター作成';
    }

    modal.classList.add('active');
}

// パーツ選択肢を設定
function populatePartSelects() {
    // 単一選択
    const appearanceSelect = document.getElementById('character-appearance');
    const personalitySelect = document.getElementById('character-personality');
    const ageSelect = document.getElementById('character-age');

    appearanceSelect.innerHTML = '<option value="">選択してください</option>';
    personalitySelect.innerHTML = '<option value="">選択してください</option>';
    ageSelect.innerHTML = '<option value="">選択してください</option>';

    allParts.forEach(part => {
        const option = `<option value="${part.PartID}">${escapeHtml(part.Name)}</option>`;
        if (part.PartType === 'appearance') appearanceSelect.innerHTML += option;
        if (part.PartType === 'personality') personalitySelect.innerHTML += option;
        if (part.PartType === 'age') ageSelect.innerHTML += option;
    });

    // 複数選択
    populateMultiSelect('character-behaviors', 'behavior');
    populateMultiSelect('character-restrictions', 'restriction');
    populateMultiSelect('character-others', 'other');
}

// 複数選択チェックボックスを生成
function populateMultiSelect(containerId, partType) {
    const container = document.getElementById(containerId);
    const parts = allParts.filter(p => p.PartType === partType);

    if (parts.length === 0) {
        container.innerHTML = '<p style="color: #6c757d; font-size: 13px;">このタイプのパーツがまだありません</p>';
        return;
    }

    container.innerHTML = parts.map(part => `
        <label>
            <input type="checkbox" value="${part.PartID}">
            ${escapeHtml(part.Name)}
        </label>
    `).join('');
}

// モーダルを閉じる
function closeAllModals() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.classList.remove('active');
    });
    editingPartId = null;
    editingCharacterId = null;
}

// パーツフォーム送信
async function handlePartSubmit(e) {
    e.preventDefault();

    const data = {
        PartType: document.getElementById('part-type').value,
        Name: document.getElementById('part-name').value,
        Description: document.getElementById('part-description').value
    };

    try {
        let response;
        if (editingPartId) {
            // 更新
            response = await fetch(`${API_BASE_URL}/parts/${editingPartId}`, {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': authHeader
                },
                body: JSON.stringify(data)
            });
        } else {
            // 新規作成
            response = await fetch(`${API_BASE_URL}/parts`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': authHeader
                },
                body: JSON.stringify(data)
            });
        }

        if (response.ok) {
            await loadParts();
            renderParts();
            closeAllModals();
            alert(editingPartId ? 'パーツを更新しました' : 'パーツを作成しました');
        } else {
            alert('エラーが発生しました');
        }
    } catch (error) {
        console.error('エラー:', error);
        alert('エラーが発生しました');
    }
}

// キャラクターフォーム送信
async function handleCharacterSubmit(e) {
    e.preventDefault();

    const data = {
        CharacterName: document.getElementById('character-name').value,
        AppearancePartID: document.getElementById('character-appearance').value,
        PersonalityPartID: document.getElementById('character-personality').value,
        AgePartID: document.getElementById('character-age').value,
        BehaviorPartIDs: getSelectedCheckboxes('character-behaviors'),
        RestrictionPartIDs: getSelectedCheckboxes('character-restrictions'),
        OtherPartIDs: getSelectedCheckboxes('character-others')
    };

    try {
        let response;
        if (editingCharacterId) {
            // 更新
            response = await fetch(`${API_BASE_URL}/characters/${editingCharacterId}`, {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': authHeader
                },
                body: JSON.stringify(data)
            });
        } else {
            // 新規作成
            response = await fetch(`${API_BASE_URL}/characters`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': authHeader
                },
                body: JSON.stringify(data)
            });
        }

        if (response.ok) {
            await loadCharacters();
            renderCharacters();
            closeAllModals();
            alert(editingCharacterId ? 'キャラクターを更新しました' : 'キャラクターを作成しました');
        } else {
            alert('エラーが発生しました');
        }
    } catch (error) {
        console.error('エラー:', error);
        alert('エラーが発生しました');
    }
}

// チェックボックスで選択された値を取得
function getSelectedCheckboxes(containerId) {
    const checkboxes = document.querySelectorAll(`#${containerId} input[type="checkbox"]:checked`);
    return Array.from(checkboxes).map(cb => cb.value);
}

// パーツ編集
function editPart(partId) {
    openPartModal(partId);
}

// パーツ削除
async function deletePart(partId) {
    if (!confirm('このパーツを削除してもよろしいですか?')) return;

    try {
        const response = await fetch(`${API_BASE_URL}/parts/${partId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': authHeader
            }
        });

        if (response.ok) {
            await loadParts();
            renderParts();
            alert('パーツを削除しました');
        } else {
            alert('削除に失敗しました');
        }
    } catch (error) {
        console.error('エラー:', error);
        alert('エラーが発生しました');
    }
}

// キャラクター編集
function editCharacter(characterId) {
    openCharacterModal(characterId);
}

// キャラクター削除
async function deleteCharacter(characterId) {
    if (!confirm('このキャラクターを削除してもよろしいですか?')) return;

    try {
        const response = await fetch(`${API_BASE_URL}/characters/${characterId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': authHeader
            }
        });

        if (response.ok) {
            await loadCharacters();
            renderCharacters();
            alert('キャラクターを削除しました');
        } else {
            alert('削除に失敗しました');
        }
    } catch (error) {
        console.error('エラー:', error);
        alert('エラーが発生しました');
    }
}

// ユーティリティ関数
function getPartTypeLabel(type) {
    const labels = {
        appearance: '容姿',
        personality: '性格',
        behavior: '行動',
        age: '年代',
        restriction: '制限',
        other: 'その他'
    };
    return labels[type] || type;
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
// キャラクター詳細をテキスト形式で生成
function generateCharacterText(character) {
    const parts = character.parts || {};
    let text = '';
    
    text += '='.repeat(50) + '\n';
    text += `キャラクター名: ${character.CharacterName}\n`;
    text += '='.repeat(50) + '\n\n';
    
    // 容姿
    if (parts.Appearance) {
        text += '【容姿】\n';
        text += `  ${parts.Appearance.Name}\n`;
        if (parts.Appearance.Description) {
            text += `  ${parts.Appearance.Description}\n`;
        }
        text += '\n';
    }
    
    // 性格
    if (parts.Personality) {
        text += '【性格】\n';
        text += `  ${parts.Personality.Name}\n`;
        if (parts.Personality.Description) {
            text += `  ${parts.Personality.Description}\n`;
        }
        text += '\n';
    }
    
    // 年代
    if (parts.Age) {
        text += '【年代】\n';
        text += `  ${parts.Age.Name}\n`;
        if (parts.Age.Description) {
            text += `  ${parts.Age.Description}\n`;
        }
        text += '\n';
    }
    
    // 行動
    if (parts.Behaviors && parts.Behaviors.length > 0) {
        text += '【行動】\n';
        parts.Behaviors.forEach(behavior => {
            text += `  • ${behavior.Name}\n`;
            if (behavior.Description) {
                text += `    ${behavior.Description}\n`;
            }
        });
        text += '\n';
    }
    
    // 制限
    if (parts.Restrictions && parts.Restrictions.length > 0) {
        text += '【制限】\n';
        parts.Restrictions.forEach(restriction => {
            text += `  • ${restriction.Name}\n`;
            if (restriction.Description) {
                text += `    ${restriction.Description}\n`;
            }
        });
        text += '\n';
    }
    
    // その他
    if (parts.Others && parts.Others.length > 0) {
        text += '【その他】\n';
        parts.Others.forEach(other => {
            text += `  • ${other.Name}\n`;
            if (other.Description) {
                text += `    ${other.Description}\n`;
            }
        });
        text += '\n';
    }
    
    text += '='.repeat(50);
    
    return text;
}

// キャラクター詳細モーダルを表示
function showCharacterDetail(characterId) {
    const character = allCharacters.find(c => c.CharacterID === characterId);
    if (!character) return;
    
    const modal = document.getElementById('character-detail-modal');
    const title = document.getElementById('character-detail-title');
    const textarea = document.getElementById('character-detail-text');
    
    title.textContent = `${character.CharacterName} の詳細`;
    textarea.value = generateCharacterText(character);
    
    modal.classList.add('active');
}

// キャラクター情報をクリップボードにコピー
function copyCharacterText(characterId) {
    const character = allCharacters.find(c => c.CharacterID === characterId);
    if (!character) return;
    
    const text = generateCharacterText(character);
    
    // 一時的なテキストエリアを作成してコピー（確実な方法）
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    
    try {
        document.execCommand('copy');
        alert('キャラクター情報をコピーしました！');
    } catch (err) {
        console.error('コピーに失敗しました:', err);
        alert('コピーに失敗しました');
    }
    
    document.body.removeChild(textarea);
}

// 詳細モーダルからのコピー
document.addEventListener('DOMContentLoaded', () => {
    // 既存のsetupLoginForm()の後に追加される
    
    // コピーボタンのイベントリスナー
    const copyBtn = document.getElementById('copy-character-btn');
    if (copyBtn) {
        copyBtn.addEventListener('click', () => {
            const textarea = document.getElementById('character-detail-text');
            navigator.clipboard.writeText(textarea.value).then(() => {
                alert('テキストをコピーしました！');
            }).catch(err => {
                console.error('コピーに失敗しました:', err);
                alert('コピーに失敗しました');
            });
        });
    }
});
// 詳細モーダルのボタン設定
function setupDetailModalButtons() {
    // コピーボタンのイベントリスナー
    const copyBtn = document.getElementById('copy-character-btn');
    if (copyBtn) {
        copyBtn.addEventListener('click', () => {
            const textarea = document.getElementById('character-detail-text');
            if (textarea && textarea.value) {
                // テキストエリアを選択してコピー
                textarea.select();
                textarea.setSelectionRange(0, 99999); // モバイル対応
                
                try {
                    document.execCommand('copy');
                    alert('テキストをコピーしました！');
                } catch (err) {
                    console.error('コピーに失敗しました:', err);
                    alert('コピーに失敗しました');
                }
                
                // 選択を解除
                window.getSelection().removeAllRanges();
            }
        });
    }
    
    // モーダルのクローズボタン
    document.querySelectorAll('#character-detail-modal .close-btn, #character-detail-modal .cancel-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.getElementById('character-detail-modal').classList.remove('active');
        });
    });
}