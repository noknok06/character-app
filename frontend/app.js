// ========================================
// グローバル変数
// ========================================
let authHeader = '';
let allParts = [];
let allCharacters = [];
let allFavorites = [];
let currentFilter = 'all';
let currentScreen = 'parts';
let editingPartId = null;
let editingCharacterId = null;
let savingFavoriteFromId = null;
let selectedCharacterId = null;
let isEditingMode = false;

// ========================================
// API呼び出し（開発/本番モード自動切り替え）
// ========================================
async function apiFetch(url, options = {}) {
    if (CONFIG.DEV_MODE) {
        // 開発モード: モックAPIを使用
        return await mockAPI.fetch(url, options);
    } else {
        // 本番モード: 実APIを使用
        const fullUrl = `${CONFIG.API_BASE_URL}${url}`;
        return await fetch(fullUrl, {
            ...options,
            headers: {
                ...options.headers,
                'Authorization': authHeader
            }
        });
    }
}

// ========================================
// 初期化
// ========================================
document.addEventListener('DOMContentLoaded', () => {
    // 開発モードの場合、バナーを表示
    if (CONFIG.DEV_MODE) {
        document.getElementById('devBanner').classList.add('active');
        console.log('🔧 開発モードで起動しました');
        
        // ログインスキップの場合
        if (CONFIG.SKIP_LOGIN) {
            document.getElementById('loginScreen').style.display = 'none';
            document.getElementById('app').style.display = 'block';
            initApp();
            return;
        }
    }
    
    // 通常のログインフロー
    setupLoginForm();
});

// ========================================
// ログインフォーム設定
// ========================================
function setupLoginForm() {
    document.getElementById('loginForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const user = document.getElementById('loginUser').value;
        const pass = document.getElementById('loginPass').value;
        authHeader = 'Basic ' + btoa(user + ':' + pass);
        
        try {
            const res = await apiFetch('/parts');
            if (res.ok) {
                document.getElementById('loginScreen').style.display = 'none';
                document.getElementById('app').style.display = 'block';
                initApp();
            } else {
                document.getElementById('loginError').textContent = 'ユーザー名またはパスワードが正しくありません';
                authHeader = '';
            }
        } catch {
            document.getElementById('loginError').textContent = '接続エラーが発生しました';
            authHeader = '';
        }
    });
}

// ========================================
// アプリケーション初期化
// ========================================
async function initApp() {
    await Promise.all([loadParts(), loadCharacters(), loadFavorites()]);
    renderParts();
    renderCharacters();
    renderFavorites();
    setupEvents();
}

// ========================================
// イベントリスナー設定
// ========================================
function setupEvents() {
    // タブ切り替え
    document.querySelectorAll('.nav-item').forEach(n => {
        n.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            const targetScreen = this.dataset.screen;
            document.querySelectorAll('.nav-item').forEach(x => x.classList.remove('active'));
            document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
            this.classList.add('active');
            document.getElementById(targetScreen + 'Screen').classList.add('active');
            currentScreen = targetScreen;
        });
    });
    
    // パーツ種別フィルター
    document.querySelectorAll('#partFilters .chip').forEach(c => c.addEventListener('click', () => {
        document.querySelectorAll('#partFilters .chip').forEach(x => x.classList.remove('active'));
        c.classList.add('active');
        currentFilter = c.dataset.type;
        renderParts();
    }));
    
    // 検索
    document.getElementById('partsSearch').addEventListener('input', renderParts);
    document.getElementById('charsSearch').addEventListener('input', renderCharacters);
    document.getElementById('favoritesSearch').addEventListener('input', renderFavorites);
    
    // スピードダイヤル
    setupSpeedDial();
    
    // オーバーレイ
    document.getElementById('overlay').addEventListener('click', closeAllSheets);
    
    // フォーム送信（Enterキー対応のため残す）
    document.getElementById('partForm').addEventListener('submit', (e) => {
        e.preventDefault();
        handlePartSubmit();
    });
    document.getElementById('charForm').addEventListener('submit', (e) => {
        e.preventDefault();
        handleCharSubmit();
    });
    document.getElementById('favoriteForm').addEventListener('submit', handleFavoriteSubmit);
}

// ========================================
// スピードダイヤル関連
// ========================================
function setupSpeedDial() {
    const speedDial = document.getElementById('speedDial');
    const fabBtn = document.getElementById('fabBtn');
    const overlay = document.getElementById('speedDialOverlay');
    const fabSave = document.getElementById('fabSave');
    const fabCancel = document.getElementById('fabCancel');
    
    // メインFABクリック
    fabBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        
        if (isEditingMode) {
            // 編集モード時はスピードダイヤルを展開
            toggleSpeedDial();
        } else {
            // 通常モード時は新規作成
            if (currentScreen === 'parts') {
                openPartSheet();
            } else if (currentScreen === 'chars' || currentScreen === 'favorites') {
                openCharSheet();
            }
        }
    });
    
    // オーバーレイクリック
    overlay.addEventListener('click', () => {
        closeSpeedDial();
    });
    
    // 保存ボタン
    fabSave.addEventListener('click', () => {
        closeSpeedDial();
        if (editingPartId) {
            handlePartSubmit();
        } else if (editingCharacterId) {
            handleCharSubmit();
        }
    });
    
    // キャンセルボタン
    fabCancel.addEventListener('click', () => {
        closeSpeedDial();
        cancelEditing();
    });
}

function toggleSpeedDial() {
    const speedDial = document.getElementById('speedDial');
    const overlay = document.getElementById('speedDialOverlay');
    
    const isActive = speedDial.classList.toggle('active');
    
    if (isActive) {
        overlay.classList.add('active');
    } else {
        overlay.classList.remove('active');
    }
}

function closeSpeedDial() {
    const speedDial = document.getElementById('speedDial');
    const overlay = document.getElementById('speedDialOverlay');
    
    speedDial.classList.remove('active');
    overlay.classList.remove('active');
}

function enterEditingMode() {
    isEditingMode = true;
    const fabBtn = document.getElementById('fabBtn');
    const fabSave = document.getElementById('fabSave');
    const fabCancel = document.getElementById('fabCancel');
    const speedDial = document.getElementById('speedDial');
    const overlay = document.getElementById('speedDialOverlay');
    
    // FABを編集モードに変更
    fabBtn.classList.add('editing');
    fabBtn.querySelector('i').className = 'fas fa-edit';
    
    // 保存・キャンセルボタンを表示
    fabSave.style.display = 'flex';
    fabCancel.style.display = 'flex';
    
    // スピードダイヤルを自動展開
    speedDial.classList.add('active');
    overlay.classList.add('active');
    
    // フォーム内の保存ボタンを非表示
    document.querySelectorAll('.form-submit-btn').forEach(btn => {
        btn.style.display = 'none';
    });
}

function exitEditingMode() {
    isEditingMode = false;
    const fabBtn = document.getElementById('fabBtn');
    const fabSave = document.getElementById('fabSave');
    const fabCancel = document.getElementById('fabCancel');
    const speedDial = document.getElementById('speedDial');
    const overlay = document.getElementById('speedDialOverlay');
    
    // FABを通常モードに戻す
    fabBtn.classList.remove('editing');
    fabBtn.querySelector('i').className = 'fas fa-plus';
    
    // 保存・キャンセルボタンを非表示
    fabSave.style.display = 'none';
    fabCancel.style.display = 'none';
    
    // スピードダイヤルを閉じる
    speedDial.classList.remove('active');
    overlay.classList.remove('active');
    
    // フォーム内の保存ボタンを再表示
    document.querySelectorAll('.form-submit-btn').forEach(btn => {
        btn.style.display = 'block';
    });
}

function cancelEditing() {
    closeAllSheets();
    exitEditingMode();
    editingPartId = null;
    editingCharacterId = null;
}

// ========================================
// データ読み込み
// ========================================
async function loadParts() {
    try {
        const res = await apiFetch('/parts');
        const data = await res.json();
        allParts = data.parts || [];
    } catch (e) {
        console.error('パーツの読み込みエラー:', e);
    }
}

async function loadCharacters() {
    try {
        const res = await apiFetch('/characters');
        const data = await res.json();
        allCharacters = (data.characters || []).map(c => ({ 
            ...c, 
            parts: attachPartsToCharacter(c) 
        }));
    } catch (e) {
        console.error('キャラクターの読み込みエラー:', e);
    }
}

async function loadFavorites() {
    try {
        const res = await apiFetch('/characters?favorites=true');
        const data = await res.json();
        allFavorites = (data.characters || []).map(c => ({ 
            ...c, 
            parts: attachPartsToCharacter(c) 
        }));
    } catch (e) {
        console.error('お気に入りの読み込みエラー:', e);
    }
}

// ========================================
// パーツ情報取得ヘルパー
// ========================================
function getPartInfo(partId) {
    return allParts.find(p => p.PartID === partId);
}

function attachPartsToCharacter(character) {
    const parts = {};
    
    // 容姿（複数対応）
    if (character.AppearancePartIDs?.length) {
        parts.Appearances = character.AppearancePartIDs.map(id => getPartInfo(id)).filter(Boolean);
    }
    
    // 性格（複数対応）
    if (character.PersonalityPartIDs?.length) {
        parts.Personalities = character.PersonalityPartIDs.map(id => getPartInfo(id)).filter(Boolean);
    }
    
    // 年代（複数対応）
    if (character.AgePartIDs?.length) {
        parts.Ages = character.AgePartIDs.map(id => getPartInfo(id)).filter(Boolean);
    }
    
    // 行動
    if (character.BehaviorPartIDs?.length) {
        parts.Behaviors = character.BehaviorPartIDs.map(id => getPartInfo(id)).filter(Boolean);
    }
    
    // 制限
    if (character.RestrictionPartIDs?.length) {
        parts.Restrictions = character.RestrictionPartIDs.map(id => getPartInfo(id)).filter(Boolean);
    }
    
    // その他
    if (character.OtherPartIDs?.length) {
        parts.Others = character.OtherPartIDs.map(id => getPartInfo(id)).filter(Boolean);
    }
    
    return parts;
}

// ========================================
// レンダリング関数
// ========================================
function renderParts() {
    const search = document.getElementById('partsSearch').value.toLowerCase();
    let filtered = allParts;
    
    // 種別フィルター
    if (currentFilter !== 'all') {
        filtered = filtered.filter(p => p.PartType === currentFilter);
    }
    
    // 検索フィルター
    if (search) {
        filtered = filtered.filter(p => 
            p.Name.toLowerCase().includes(search) || 
            (p.Description || '').toLowerCase().includes(search)
        );
    }
    
    const container = document.getElementById('partsList');
    
    if (filtered.length === 0) {
        container.innerHTML = '<div class="empty-state"><i class="fas fa-puzzle-piece"></i><p>パーツがありません</p></div>';
        return;
    }
    
    container.innerHTML = filtered.map(p => `
        <div class="card">
            <div class="card-header">
                <span class="card-title">${esc(p.Name)}</span>
                <span class="card-badge badge-${p.PartType}">${typeLabel(p.PartType)}</span>
            </div>
            ${p.Description ? `<p class="card-desc">${esc(p.Description)}</p>` : ''}
            <div class="card-actions">
                <button class="card-btn btn-edit" onclick="editPart('${p.PartID}')"><i class="fas fa-edit"></i> 編集</button>
                <button class="card-btn btn-delete" onclick="deletePart('${p.PartID}')"><i class="fas fa-trash"></i> 削除</button>
            </div>
        </div>
    `).join('');
}

function renderCharacters() {
    const search = document.getElementById('charsSearch').value.toLowerCase();
    let filtered = allCharacters;
    
    // 検索フィルター
    if (search) {
        filtered = filtered.filter(c => c.CharacterName.toLowerCase().includes(search));
    }
    
    const container = document.getElementById('charsList');
    
    if (filtered.length === 0) {
        container.innerHTML = '<div class="empty-state"><i class="fas fa-users"></i><p>キャラクターがありません</p></div>';
        return;
    }
    
    container.innerHTML = filtered.map(c => {
        const parts = c.parts || {};
        let tags = '';
        
        if (parts.Appearances?.length) {
            parts.Appearances.forEach(a => tags += `<span class="char-tag">${esc(a.Name)}</span>`);
        }
        if (parts.Personalities?.length) {
            parts.Personalities.forEach(per => tags += `<span class="char-tag">${esc(per.Name)}</span>`);
        }
        if (parts.Ages?.length) {
            parts.Ages.forEach(a => tags += `<span class="char-tag">${esc(a.Name)}</span>`);
        }
        
        return `
            <div class="card">
                <div class="card-header"><span class="card-title">${esc(c.CharacterName)}</span></div>
                <div class="char-parts">${tags}</div>
                <div class="card-actions">
                    <button class="card-btn btn-detail" onclick="showDetail('${c.CharacterID}')"><i class="fas fa-eye"></i></button>
                    <button class="card-btn btn-copy" onclick="copyChar('${c.CharacterID}')"><i class="fas fa-copy"></i></button>
                    <button class="card-btn btn-favorite" onclick="openFavoriteSheet('${c.CharacterID}')"><i class="fas fa-star"></i> 保存</button>
                    <button class="card-btn btn-edit" onclick="editChar('${c.CharacterID}')"><i class="fas fa-edit"></i></button>
                    <button class="card-btn btn-delete" onclick="deleteChar('${c.CharacterID}')"><i class="fas fa-trash"></i></button>
                </div>
            </div>
        `;
    }).join('');
}

function renderFavorites() {
    const search = document.getElementById('favoritesSearch').value.toLowerCase();
    let filtered = allFavorites;
    
    // 検索フィルター
    if (search) {
        filtered = filtered.filter(c => 
            c.CharacterName.toLowerCase().includes(search) || 
            (c.FavoriteNote || '').toLowerCase().includes(search)
        );
    }
    
    const container = document.getElementById('favoritesList');
    
    if (filtered.length === 0) {
        container.innerHTML = '<div class="empty-state"><i class="fas fa-star"></i><p>保存されたキャラクターがありません</p><p style="margin-top:8px;font-size:13px;">キャラクター画面から「保存」ボタンで保存できます</p></div>';
        return;
    }
    
    container.innerHTML = filtered.map(c => {
        const parts = c.parts || {};
        let tags = '';
        
        if (parts.Appearances?.length) {
            parts.Appearances.forEach(a => tags += `<span class="char-tag">${esc(a.Name)}</span>`);
        }
        if (parts.Personalities?.length) {
            parts.Personalities.forEach(per => tags += `<span class="char-tag">${esc(per.Name)}</span>`);
        }
        if (parts.Ages?.length) {
            parts.Ages.forEach(a => tags += `<span class="char-tag">${esc(a.Name)}</span>`);
        }
        
        const date = new Date(c.CreatedAt).toLocaleString('ja-JP', { 
            year: 'numeric', 
            month: '2-digit', 
            day: '2-digit', 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        
        return `
            <div class="card favorite">
                <div class="card-header">
                    <span class="card-title">${esc(c.CharacterName)}<span class="favorite-badge"><i class="fas fa-star"></i> 保存済み</span></span>
                </div>
                <div class="char-parts">${tags}</div>
                ${c.FavoriteNote ? `<p class="card-note"><i class="fas fa-sticky-note"></i> ${esc(c.FavoriteNote)}</p>` : ''}
                <p style="font-size:12px;color:var(--text-secondary);margin-top:8px;">保存日時: ${date}</p>
                <div class="card-actions">
                    <button class="card-btn btn-detail" onclick="showDetail('${c.CharacterID}')"><i class="fas fa-eye"></i></button>
                    <button class="card-btn btn-copy" onclick="copyChar('${c.CharacterID}')"><i class="fas fa-copy"></i></button>
                    <button class="card-btn btn-apply" onclick="applyFavorite('${c.CharacterID}')"><i class="fas fa-download"></i> 適用</button>
                    <button class="card-btn btn-delete" onclick="deleteFavorite('${c.CharacterID}')"><i class="fas fa-trash"></i></button>
                </div>
            </div>
        `;
    }).join('');
}

// ========================================
// モーダル/シート操作
// ========================================
function openPartSheet(id = null) {
    editingPartId = id;
    document.getElementById('partForm').reset();
    document.getElementById('partSheetTitle').textContent = id ? 'パーツ編集' : 'パーツ作成';
    
    if (id) {
        const p = allParts.find(x => x.PartID === id);
        if (p) {
            document.getElementById('partType').value = p.PartType;
            document.getElementById('partName').value = p.Name;
            document.getElementById('partDesc').value = p.Description || '';
        }
        // 編集モードに入る
        enterEditingMode();
    }
    
    openSheet('partSheet');
}

function clearPartDesc() {
    document.getElementById('partDesc').value = '';
    toast('説明欄をクリアしました');
}

function openCharSheet(id = null) {
    editingCharacterId = id;
    document.getElementById('charForm').reset();
    document.getElementById('charSheetTitle').textContent = id ? 'キャラクター編集' : 'キャラクター作成';
    
    // パーツ選択肢を生成
    populateCharSelects();
    
    // 編集モードの場合、データを復元
    if (id) {
        setTimeout(() => {
            const c = allCharacters.find(x => x.CharacterID === id);
            if (c) {
                document.getElementById('charName').value = c.CharacterName;
                
                const partTypes = [
                    { ids: c.AppearancePartIDs || [], selector: '#charAppearance' },
                    { ids: c.PersonalityPartIDs || [], selector: '#charPersonality' },
                    { ids: c.AgePartIDs || [], selector: '#charAge' },
                    { ids: c.BehaviorPartIDs || [], selector: '#charBehaviors' },
                    { ids: c.RestrictionPartIDs || [], selector: '#charRestrictions' },
                    { ids: c.OtherPartIDs || [], selector: '#charOthers' }
                ];
                
                partTypes.forEach(({ ids, selector }) => {
                    ids.forEach(partId => {
                        const cb = document.querySelector(`${selector} input[type="checkbox"][value="${partId}"]`);
                        if (cb) cb.checked = true;
                    });
                });
            }
        }, 100);
        
        // 編集モードに入る
        enterEditingMode();
    }
    
    openSheet('charSheet');
}

function openFavoriteSheet(characterId) {
    savingFavoriteFromId = characterId;
    document.getElementById('favoriteForm').reset();
    
    const c = allCharacters.find(x => x.CharacterID === characterId);
    if (c) {
        document.getElementById('favoriteName').value = c.CharacterName + ' - コピー';
    }
    
    openSheet('favoriteSheet');
}

function populateCharSelects() {
    const configs = [
        { id: 'charAppearance', type: 'appearance', searchId: 'searchAppearance' },
        { id: 'charPersonality', type: 'personality', searchId: 'searchPersonality' },
        { id: 'charAge', type: 'age', searchId: 'searchAge' },
        { id: 'charBehaviors', type: 'behavior', searchId: 'searchBehaviors' },
        { id: 'charRestrictions', type: 'restriction', searchId: 'searchRestrictions' },
        { id: 'charOthers', type: 'other', searchId: 'searchOthers' }
    ];
    
    configs.forEach(({ id, type, searchId }) => {
        const div = document.getElementById(id);
        const parts = allParts.filter(p => p.PartType === type);
        
        if (parts.length === 0) {
            div.innerHTML = '<p style="color:var(--text-secondary);font-size:13px;grid-column:1/-1;">パーツがありません</p>';
        } else {
            renderCheckboxList(div, parts);
            
            // 検索機能を追加
            const searchInput = document.getElementById(searchId);
            if (searchInput) {
                // 既存のイベントリスナーを削除
                const newSearchInput = searchInput.cloneNode(true);
                searchInput.parentNode.replaceChild(newSearchInput, searchInput);
                
                newSearchInput.addEventListener('input', (e) => {
                    filterCheckboxList(div, parts, e.target.value);
                });
            }
        }
    });
}

function renderCheckboxList(container, parts) {
    container.innerHTML = parts.map(p => `
        <label class="checkbox-item" data-name="${esc(p.Name).toLowerCase()}" data-desc="${esc(p.Description || '').toLowerCase()}">
            <input type="checkbox" value="${p.PartID}">
            ${esc(p.Name)}
        </label>
    `).join('');
}

function filterCheckboxList(container, parts, searchTerm) {
    const search = searchTerm.toLowerCase();
    const items = container.querySelectorAll('.checkbox-item');
    
    let visibleCount = 0;
    items.forEach(item => {
        const name = item.dataset.name || '';
        const desc = item.dataset.desc || '';
        
        if (search === '' || name.includes(search) || desc.includes(search)) {
            item.style.display = 'flex';
            visibleCount++;
        } else {
            item.style.display = 'none';
        }
    });
    
    // 検索結果が0件の場合のメッセージ
    let noResultMsg = container.querySelector('.no-result-message');
    if (visibleCount === 0) {
        if (!noResultMsg) {
            noResultMsg = document.createElement('p');
            noResultMsg.className = 'no-result-message';
            noResultMsg.style.cssText = 'color:var(--text-secondary);font-size:13px;grid-column:1/-1;text-align:center;padding:20px;';
            noResultMsg.textContent = '該当するパーツが見つかりません';
            container.appendChild(noResultMsg);
        }
    } else if (noResultMsg) {
        noResultMsg.remove();
    }
}

function openSheet(id) {
    document.getElementById('overlay').classList.add('active');
    document.getElementById(id).classList.add('active');
}

function closeSheet(id) {
    document.getElementById('overlay').classList.remove('active');
    document.getElementById(id).classList.remove('active');
    
    // シートを閉じたら編集モードを終了
    exitEditingMode();
}

function closeAllSheets() {
    document.getElementById('overlay').classList.remove('active');
    document.querySelectorAll('.bottom-sheet').forEach(s => s.classList.remove('active'));
    
    // すべてのシートを閉じたら編集モードを終了
    exitEditingMode();
}

// ========================================
// フォーム送信ハンドラ
// ========================================
async function handlePartSubmit() {
    const data = {
        PartType: document.getElementById('partType').value,
        Name: document.getElementById('partName').value,
        Description: document.getElementById('partDesc').value
    };
    
    try {
        const url = editingPartId ? `/parts/${editingPartId}` : '/parts';
        const method = editingPartId ? 'PUT' : 'POST';
        
        await apiFetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        await Promise.all([loadParts(), loadCharacters(), loadFavorites()]);
        renderParts();
        renderCharacters();
        renderFavorites();
        closeAllSheets();
        toast(editingPartId ? '更新しました' : '作成しました');
        
        editingPartId = null;
    } catch (e) {
        console.error('エラー:', e);
        toast('エラーが発生しました');
    }
}

async function handleCharSubmit() {
    const data = {
        CharacterName: document.getElementById('charName').value,
        AppearancePartIDs: [...document.querySelectorAll('#charAppearance input:checked')].map(c => c.value),
        PersonalityPartIDs: [...document.querySelectorAll('#charPersonality input:checked')].map(c => c.value),
        AgePartIDs: [...document.querySelectorAll('#charAge input:checked')].map(c => c.value),
        BehaviorPartIDs: [...document.querySelectorAll('#charBehaviors input:checked')].map(c => c.value),
        RestrictionPartIDs: [...document.querySelectorAll('#charRestrictions input:checked')].map(c => c.value),
        OtherPartIDs: [...document.querySelectorAll('#charOthers input:checked')].map(c => c.value)
    };
    
    try {
        const url = editingCharacterId ? `/characters/${editingCharacterId}` : '/characters';
        const method = editingCharacterId ? 'PUT' : 'POST';
        
        await apiFetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        await loadCharacters();
        renderCharacters();
        closeAllSheets();
        toast(editingCharacterId ? '更新しました' : '作成しました');
        
        editingCharacterId = null;
    } catch (e) {
        console.error('エラー:', e);
        toast('エラーが発生しました');
    }
}

async function handleFavoriteSubmit(e) {
    e.preventDefault();
    
    if (!savingFavoriteFromId) return;
    
    const original = allCharacters.find(c => c.CharacterID === savingFavoriteFromId);
    if (!original) return;
    
    const favName = document.getElementById('favoriteName').value || original.CharacterName;
    const favNote = document.getElementById('favoriteNote').value;
    
    const data = {
        CharacterName: favName,
        AppearancePartIDs: original.AppearancePartIDs || [],
        PersonalityPartIDs: original.PersonalityPartIDs || [],
        AgePartIDs: original.AgePartIDs || [],
        BehaviorPartIDs: original.BehaviorPartIDs || [],
        RestrictionPartIDs: original.RestrictionPartIDs || [],
        OtherPartIDs: original.OtherPartIDs || [],
        IsFavorite: true,
        FavoriteNote: favNote
    };
    
    try {
        await apiFetch('/characters', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        await loadFavorites();
        renderFavorites();
        closeAllSheets();
        toast('お気に入りに保存しました');
    } catch (e) {
        console.error('エラー:', e);
        toast('エラーが発生しました');
    }
}

// ========================================
// CRUD操作
// ========================================
function editPart(id) {
    openPartSheet(id);
}

function editChar(id) {
    openCharSheet(id);
}

async function deletePart(id) {
    if (!confirm('削除しますか？')) return;
    
    try {
        await apiFetch(`/parts/${id}`, { method: 'DELETE' });
        await Promise.all([loadParts(), loadCharacters(), loadFavorites()]);
        renderParts();
        renderCharacters();
        renderFavorites();
        toast('削除しました');
    } catch (e) {
        console.error('エラー:', e);
        toast('エラーが発生しました');
    }
}

async function deleteChar(id) {
    if (!confirm('削除しますか？')) return;
    
    try {
        await apiFetch(`/characters/${id}`, { method: 'DELETE' });
        await loadCharacters();
        renderCharacters();
        toast('削除しました');
    } catch (e) {
        console.error('エラー:', e);
        toast('エラーが発生しました');
    }
}

async function deleteFavorite(id) {
    if (!confirm('このお気に入りを削除しますか？')) return;
    
    try {
        await apiFetch(`/characters/${id}`, { method: 'DELETE' });
        await loadFavorites();
        renderFavorites();
        toast('削除しました');
    } catch (e) {
        console.error('エラー:', e);
        toast('エラーが発生しました');
    }
}

async function applyFavorite(favoriteId) {
    if (!confirm('このお気に入りの設定を新しいキャラクターとして作成しますか？')) return;
    
    const fav = allFavorites.find(f => f.CharacterID === favoriteId);
    if (!fav) return;
    
    const data = {
        CharacterName: fav.CharacterName.replace(' - コピー', '').replace('（保存）', '') + ' - 復元',
        AppearancePartIDs: fav.AppearancePartIDs || [],
        PersonalityPartIDs: fav.PersonalityPartIDs || [],
        AgePartIDs: fav.AgePartIDs || [],
        BehaviorPartIDs: fav.BehaviorPartIDs || [],
        RestrictionPartIDs: fav.RestrictionPartIDs || [],
        OtherPartIDs: fav.OtherPartIDs || [],
        IsFavorite: false
    };
    
    try {
        await apiFetch('/characters', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        await loadCharacters();
        renderCharacters();
        toast('キャラクターを復元しました');
        
        // キャラクター画面に切り替え
        document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
        document.querySelector('.nav-item[data-screen="chars"]').classList.add('active');
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        document.getElementById('charsScreen').classList.add('active');
        currentScreen = 'chars';
    } catch (e) {
        console.error('エラー:', e);
        toast('エラーが発生しました');
    }
}

// ========================================
// 詳細表示・コピー機能
// ========================================
function showDetail(id) {
    const c = [...allCharacters, ...allFavorites].find(x => x.CharacterID === id);
    if (!c) return;
    
    document.getElementById('detailTitle').textContent = c.CharacterName;
    document.getElementById('detailText').value = genCharText(c);
    openSheet('detailSheet');
}

function copyChar(id) {
    const c = [...allCharacters, ...allFavorites].find(x => x.CharacterID === id);
    if (!c) return;
    
    const text = genCharText(c);
    
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text)
            .then(() => toast('コピーしました'))
            .catch(() => fallbackCopy(text));
    } else {
        fallbackCopy(text);
    }
}

function copyDetail() {
    const text = document.getElementById('detailText').value;
    
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text)
            .then(() => toast('コピーしました'))
            .catch(() => fallbackCopy(text));
    } else {
        fallbackCopy(text);
    }
}

function fallbackCopy(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    textarea.style.top = '0';
    textarea.style.left = '0';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    
    try {
        document.execCommand('copy');
        toast('コピーしました');
    } catch (err) {
        console.error('コピーに失敗しました:', err);
        toast('コピーに失敗しました');
    }
    
    document.body.removeChild(textarea);
}

function genCharText(c) {
    const p = c.parts || {};
    let t = `# ${c.CharacterName}\n\n`;
    
    if (p.Appearances?.length) {
        t += `## 容姿\n${p.Appearances.map(a => 
            `- ${a.Name}${a.Description ? ' - ' + a.Description : ''}`
        ).join('\n')}\n\n`;
    }
    
    if (p.Personalities?.length) {
        t += `## 性格\n${p.Personalities.map(per => 
            `- ${per.Name}${per.Description ? ' - ' + per.Description : ''}`
        ).join('\n')}\n\n`;
    }
    
    if (p.Ages?.length) {
        t += `## 年代\n${p.Ages.map(a => 
            `- ${a.Name}${a.Description ? ' - ' + a.Description : ''}`
        ).join('\n')}\n\n`;
    }
    
    if (p.Behaviors?.length) {
        t += `## 行動\n${p.Behaviors.map(b => 
            `- ${b.Name}${b.Description ? ' - ' + b.Description : ''}`
        ).join('\n')}\n\n`;
    }
    
    if (p.Restrictions?.length) {
        t += `## 制限\n${p.Restrictions.map(r => 
            `- ${r.Name}${r.Description ? ' - ' + r.Description : ''}`
        ).join('\n')}\n\n`;
    }
    
    if (p.Others?.length) {
        t += `## その他\n${p.Others.map(o => 
            `- ${o.Name}${o.Description ? ' - ' + o.Description : ''}`
        ).join('\n')}\n\n`;
    }
    
    return t.trim();
}

// ========================================
// ユーティリティ関数
// ========================================
function typeLabel(t) {
    const labels = {
        appearance: '容姿',
        personality: '性格',
        behavior: '行動',
        age: '年代',
        restriction: '制限',
        other: 'その他'
    };
    return labels[t] || t;
}

function esc(s) {
    if (!s) return '';
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
}

function toast(msg) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 2000);
}

// ========================================
// グローバルスコープに配置（HTMLから呼ばれる関数）
// ========================================
window.editPart = editPart;
window.deletePart = deletePart;
window.editChar = editChar;
window.deleteChar = deleteChar;
window.deleteFavorite = deleteFavorite;
window.showDetail = showDetail;
window.copyChar = copyChar;
window.copyDetail = copyDetail;
window.openFavoriteSheet = openFavoriteSheet;
window.applyFavorite = applyFavorite;
window.closeSheet = closeSheet;
window.clearPartDesc = clearPartDesc;