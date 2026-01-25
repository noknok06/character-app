// モックデータとモックAPI（開発モードでのみ使用）

const MOCK_DATA = {
    parts: [
        { PartID: 'part_001', PartType: 'appearance', Name: '黒髪ロング', Description: '艶やかな黒い長髪', CreatedAt: '2024-01-01T00:00:00Z', UpdatedAt: '2024-01-01T00:00:00Z' },
        { PartID: 'part_002', PartType: 'appearance', Name: '金髪ショート', Description: '活発な印象の短い金髪', CreatedAt: '2024-01-01T00:00:00Z', UpdatedAt: '2024-01-01T00:00:00Z' },
        { PartID: 'part_003', PartType: 'appearance', Name: '赤毛ミディアム', Description: '情熱的な赤毛', CreatedAt: '2024-01-01T00:00:00Z', UpdatedAt: '2024-01-01T00:00:00Z' },
        { PartID: 'part_004', PartType: 'personality', Name: '明るい', Description: '常にポジティブで元気', CreatedAt: '2024-01-01T00:00:00Z', UpdatedAt: '2024-01-01T00:00:00Z' },
        { PartID: 'part_005', PartType: 'personality', Name: 'クール', Description: '冷静で落ち着いている', CreatedAt: '2024-01-01T00:00:00Z', UpdatedAt: '2024-01-01T00:00:00Z' },
        { PartID: 'part_006', PartType: 'personality', Name: '優しい', Description: '思いやりがある', CreatedAt: '2024-01-01T00:00:00Z', UpdatedAt: '2024-01-01T00:00:00Z' },
        { PartID: 'part_007', PartType: 'behavior', Name: '冒険好き', Description: '新しいことに挑戦する', CreatedAt: '2024-01-01T00:00:00Z', UpdatedAt: '2024-01-01T00:00:00Z' },
        { PartID: 'part_008', PartType: 'behavior', Name: '慎重派', Description: 'リスクを避ける傾向', CreatedAt: '2024-01-01T00:00:00Z', UpdatedAt: '2024-01-01T00:00:00Z' },
        { PartID: 'part_009', PartType: 'age', Name: '10代', Description: '若々しいエネルギー', CreatedAt: '2024-01-01T00:00:00Z', UpdatedAt: '2024-01-01T00:00:00Z' },
        { PartID: 'part_010', PartType: 'age', Name: '20代', Description: '成熟した大人', CreatedAt: '2024-01-01T00:00:00Z', UpdatedAt: '2024-01-01T00:00:00Z' },
        { PartID: 'part_011', PartType: 'restriction', Name: '暴力禁止', Description: '物理的な攻撃は避ける', CreatedAt: '2024-01-01T00:00:00Z', UpdatedAt: '2024-01-01T00:00:00Z' },
        { PartID: 'part_012', PartType: 'restriction', Name: '嘘をつかない', Description: '常に正直', CreatedAt: '2024-01-01T00:00:00Z', UpdatedAt: '2024-01-01T00:00:00Z' },
        { PartID: 'part_013', PartType: 'other', Name: '魔法使い', Description: '魔法を使える設定', CreatedAt: '2024-01-01T00:00:00Z', UpdatedAt: '2024-01-01T00:00:00Z' },
        { PartID: 'part_014', PartType: 'other', Name: '剣士', Description: '剣の達人', CreatedAt: '2024-01-01T00:00:00Z', UpdatedAt: '2024-01-01T00:00:00Z' }
    ],
    characters: [
        {
            CharacterID: 'char_001',
            CharacterName: '勇者アレックス',
            AppearancePartIDs: ['part_002'],
            PersonalityPartIDs: ['part_004'],
            AgePartIDs: ['part_009'],
            BehaviorPartIDs: ['part_007'],
            RestrictionPartIDs: ['part_011'],
            OtherPartIDs: ['part_014'],
            IsFavorite: false,
            CreatedAt: '2024-01-15T10:00:00Z',
            UpdatedAt: '2024-01-15T10:00:00Z'
        },
        {
            CharacterID: 'char_002',
            CharacterName: '魔法使いミラ',
            AppearancePartIDs: ['part_001'],
            PersonalityPartIDs: ['part_005', 'part_006'],
            AgePartIDs: ['part_010'],
            BehaviorPartIDs: ['part_008'],
            RestrictionPartIDs: ['part_012'],
            OtherPartIDs: ['part_013'],
            IsFavorite: false,
            CreatedAt: '2024-01-16T14:30:00Z',
            UpdatedAt: '2024-01-16T14:30:00Z'
        },
        {
            CharacterID: 'char_003',
            CharacterName: '戦士レオン',
            AppearancePartIDs: ['part_003'],
            PersonalityPartIDs: ['part_004'],
            AgePartIDs: ['part_010'],
            BehaviorPartIDs: ['part_007'],
            RestrictionPartIDs: [],
            OtherPartIDs: ['part_014'],
            IsFavorite: false,
            CreatedAt: '2024-01-17T09:15:00Z',
            UpdatedAt: '2024-01-17T09:15:00Z'
        }
    ],
    favorites: [
        {
            CharacterID: 'fav_001',
            CharacterName: 'テスト勇者 - 保存版',
            AppearancePartIDs: ['part_002'],
            PersonalityPartIDs: ['part_004'],
            AgePartIDs: ['part_009'],
            BehaviorPartIDs: ['part_007'],
            RestrictionPartIDs: ['part_011'],
            OtherPartIDs: ['part_014'],
            IsFavorite: true,
            FavoriteNote: '初期バージョンのテストキャラクター',
            CreatedAt: '2024-01-10T12:00:00Z',
            UpdatedAt: '2024-01-10T12:00:00Z'
        },
        {
            CharacterID: 'fav_002',
            CharacterName: '優しい魔法使い - Ver2',
            AppearancePartIDs: ['part_001'],
            PersonalityPartIDs: ['part_006'],
            AgePartIDs: ['part_010'],
            BehaviorPartIDs: ['part_008'],
            RestrictionPartIDs: ['part_012'],
            OtherPartIDs: ['part_013'],
            IsFavorite: true,
            FavoriteNote: '非戦闘系キャラクターのテンプレート',
            CreatedAt: '2024-01-12T16:45:00Z',
            UpdatedAt: '2024-01-12T16:45:00Z'
        }
    ]
};

// モックAPIクラス
class MockAPI {
    constructor() {
        this.parts = [...MOCK_DATA.parts];
        this.characters = [...MOCK_DATA.characters];
        this.favorites = [...MOCK_DATA.favorites];
    }
    
    async delay() {
        await new Promise(resolve => setTimeout(resolve, CONFIG.MOCK_DELAY)); // CONFIG.DEV.MOCK_DELAY → CONFIG.MOCK_DELAY
    }
    
    async fetch(url, options = {}) {
        console.log(`[MOCK API] ${options.method || 'GET'} ${url}`);
        await this.delay();
        
        const method = options.method || 'GET';
        const urlObj = new URL(url, 'http://localhost');
        const path = urlObj.pathname;
        
        // パーツAPI
        if (path.includes('/parts')) {
            return this.handlePartsAPI(path, method, options);
        }
        
        // キャラクターAPI
        if (path.includes('/characters')) {
            return this.handleCharactersAPI(path, method, options, urlObj.searchParams);
        }
        
        return { ok: false, json: async () => ({ error: 'Not found' }) };
    }
    
    handlePartsAPI(path, method, options) {
        // GET /parts
        if (method === 'GET' && path === '/parts') {
            return { ok: true, json: async () => ({ parts: this.parts }) };
        }
        
        // POST /parts
        if (method === 'POST' && path === '/parts') {
            const body = JSON.parse(options.body);
            const newPart = {
                PartID: `part_${Date.now()}`,
                ...body,
                CreatedAt: new Date().toISOString(),
                UpdatedAt: new Date().toISOString()
            };
            this.parts.push(newPart);
            return { ok: true, json: async () => newPart };
        }
        
        // PUT /parts/{id}
        if (method === 'PUT' && path.startsWith('/parts/')) {
            const partId = path.split('/').pop();
            const body = JSON.parse(options.body);
            const index = this.parts.findIndex(p => p.PartID === partId);
            if (index !== -1) {
                this.parts[index] = {
                    ...this.parts[index],
                    ...body,
                    UpdatedAt: new Date().toISOString()
                };
                return { ok: true, json: async () => this.parts[index] };
            }
            return { ok: false, json: async () => ({ error: 'Part not found' }) };
        }
        
        // DELETE /parts/{id}
        if (method === 'DELETE' && path.startsWith('/parts/')) {
            const partId = path.split('/').pop();
            this.parts = this.parts.filter(p => p.PartID !== partId);
            return { ok: true, json: async () => ({ message: 'Deleted' }) };
        }
        
        return { ok: false, json: async () => ({ error: 'Method not supported' }) };
    }
    
    handleCharactersAPI(path, method, options, searchParams) {
        const isFavoriteQuery = searchParams.get('favorites') === 'true';
        
        // GET /characters
        if (method === 'GET' && path === '/characters') {
            const characters = isFavoriteQuery ? this.favorites : this.characters;
            return { ok: true, json: async () => ({ characters }) };
        }
        
        // POST /characters
        if (method === 'POST' && path === '/characters') {
            const body = JSON.parse(options.body);
            const newChar = {
                CharacterID: `char_${Date.now()}`,
                ...body,
                CreatedAt: new Date().toISOString(),
                UpdatedAt: new Date().toISOString()
            };
            
            if (body.IsFavorite) {
                this.favorites.push(newChar);
            } else {
                this.characters.push(newChar);
            }
            return { ok: true, json: async () => newChar };
        }
        
        // PUT /characters/{id}
        if (method === 'PUT' && path.startsWith('/characters/')) {
            const charId = path.split('/').pop();
            const body = JSON.parse(options.body);
            
            let index = this.characters.findIndex(c => c.CharacterID === charId);
            if (index !== -1) {
                this.characters[index] = {
                    ...this.characters[index],
                    ...body,
                    UpdatedAt: new Date().toISOString()
                };
                return { ok: true, json: async () => this.characters[index] };
            }
            
            index = this.favorites.findIndex(c => c.CharacterID === charId);
            if (index !== -1) {
                this.favorites[index] = {
                    ...this.favorites[index],
                    ...body,
                    UpdatedAt: new Date().toISOString()
                };
                return { ok: true, json: async () => this.favorites[index] };
            }
            
            return { ok: false, json: async () => ({ error: 'Character not found' }) };
        }
        
        // DELETE /characters/{id}
        if (method === 'DELETE' && path.startsWith('/characters/')) {
            const charId = path.split('/').pop();
            this.characters = this.characters.filter(c => c.CharacterID !== charId);
            this.favorites = this.favorites.filter(c => c.CharacterID !== charId);
            return { ok: true, json: async () => ({ message: 'Deleted' }) };
        }
        
        return { ok: false, json: async () => ({ error: 'Method not supported' }) };
    }
}

// グローバルモックAPIインスタンス
const mockAPI = new MockAPI();