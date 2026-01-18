import json
import boto3
from datetime import datetime
from decimal import Decimal
import uuid

# DynamoDBクライアント初期化
dynamodb = boto3.resource('dynamodb')
characters_table = dynamodb.Table('Characters')
parts_table = dynamodb.Table('Parts')

class DecimalEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, Decimal):
            return float(obj)
        return super(DecimalEncoder, self).default(obj)

def lambda_handler(event, context):
    """
    キャラクターのCRUD操作を行うLambda関数
    """
    print(f"Event: {json.dumps(event)}")
    
    http_method = event.get('httpMethod')
    path_parameters = event.get('pathParameters') or {}
    
    try:
        # GET /characters - キャラクター一覧取得
        if http_method == 'GET' and not path_parameters:
            return get_characters()
        
        # GET /characters/{characterId} - 特定キャラクター取得
        elif http_method == 'GET' and path_parameters:
            character_id = path_parameters.get('characterId')
            return get_character(character_id)
        
        # POST /characters - キャラクター新規作成
        elif http_method == 'POST':
            body = json.loads(event.get('body', '{}'))
            return create_character(body)
        
        # PUT /characters/{characterId} - キャラクター更新
        elif http_method == 'PUT':
            character_id = path_parameters.get('characterId')
            body = json.loads(event.get('body', '{}'))
            return update_character(character_id, body)
        
        # DELETE /characters/{characterId} - キャラクター削除
        elif http_method == 'DELETE':
            character_id = path_parameters.get('characterId')
            return delete_character(character_id)
        
        else:
            return response(400, {'error': 'Unsupported method'})
    
    except Exception as e:
        print(f"Error: {str(e)}")
        return response(500, {'error': str(e)})

def get_characters():
    """キャラクター一覧取得（パーツ情報も含む）"""
    result = characters_table.scan()
    characters = result.get('Items', [])
    
    # 各キャラクターのパーツ情報を取得
    for character in characters:
        character['parts'] = get_character_parts(character)
    
    return response(200, {
        'characters': characters,
        'count': len(characters)
    })

def get_character(character_id):
    """特定キャラクター取得"""
    result = characters_table.get_item(Key={'CharacterID': character_id})
    
    if 'Item' not in result:
        return response(404, {'error': 'Character not found'})
    
    character = result['Item']
    character['parts'] = get_character_parts(character)
    
    return response(200, character)

def get_character_parts(character):
    """キャラクターに紐づくパーツ情報を取得"""
    parts = {}
    
    # 単一選択パーツ
    for field in ['AppearancePartID', 'PersonalityPartID', 'AgePartID']:
        if field in character and character[field]:
            part = get_part_info(character[field])
            parts[field.replace('PartID', '')] = part
    
    # 複数選択パーツ
    for field in ['BehaviorPartIDs', 'RestrictionPartIDs', 'OtherPartIDs']:
        if field in character and character[field]:
            parts_list = []
            for part_id in character[field]:
                part = get_part_info(part_id)
                if part:
                    parts_list.append(part)
            parts[field.replace('PartIDs', 's')] = parts_list
    
    return parts

def get_part_info(part_id):
    """パーツIDから情報を取得"""
    try:
        result = parts_table.get_item(Key={'PartID': part_id})
        return result.get('Item')
    except:
        return None

def create_character(data):
    """キャラクター新規作成"""
    # 必須項目チェック
    if 'CharacterName' not in data:
        return response(400, {'error': 'CharacterName is required'})
    
    # 新規キャラクター作成
    character_id = f"char_{uuid.uuid4().hex[:8]}"
    now = datetime.utcnow().isoformat() + 'Z'
    
    item = {
        'CharacterID': character_id,
        'CharacterName': data['CharacterName'],
        'AppearancePartID': data.get('AppearancePartID', ''),
        'PersonalityPartID': data.get('PersonalityPartID', ''),
        'AgePartID': data.get('AgePartID', ''),
        'BehaviorPartIDs': data.get('BehaviorPartIDs', []),
        'RestrictionPartIDs': data.get('RestrictionPartIDs', []),
        'OtherPartIDs': data.get('OtherPartIDs', []),
        'CreatedAt': now,
        'UpdatedAt': now
    }
    
    characters_table.put_item(Item=item)
    
    # パーツ情報を含めて返す
    item['parts'] = get_character_parts(item)
    
    return response(201, item)

def update_character(character_id, data):
    """キャラクター更新"""
    # キャラクター存在チェック
    result = characters_table.get_item(Key={'CharacterID': character_id})
    if 'Item' not in result:
        return response(404, {'error': 'Character not found'})
    
    # 更新可能フィールド
    update_expression = []
    expression_values = {}
    
    now = datetime.utcnow().isoformat() + 'Z'
    
    if 'CharacterName' in data:
        update_expression.append('CharacterName = :name')
        expression_values[':name'] = data['CharacterName']
    
    if 'AppearancePartID' in data:
        update_expression.append('AppearancePartID = :appearance')
        expression_values[':appearance'] = data['AppearancePartID']
    
    if 'PersonalityPartID' in data:
        update_expression.append('PersonalityPartID = :personality')
        expression_values[':personality'] = data['PersonalityPartID']
    
    if 'AgePartID' in data:
        update_expression.append('AgePartID = :age')
        expression_values[':age'] = data['AgePartID']
    
    if 'BehaviorPartIDs' in data:
        update_expression.append('BehaviorPartIDs = :behaviors')
        expression_values[':behaviors'] = data['BehaviorPartIDs']
    
    if 'RestrictionPartIDs' in data:
        update_expression.append('RestrictionPartIDs = :restrictions')
        expression_values[':restrictions'] = data['RestrictionPartIDs']
    
    if 'OtherPartIDs' in data:
        update_expression.append('OtherPartIDs = :others')
        expression_values[':others'] = data['OtherPartIDs']
    
    update_expression.append('UpdatedAt = :updated')
    expression_values[':updated'] = now
    
    # 更新実行
    response_data = characters_table.update_item(
        Key={'CharacterID': character_id},
        UpdateExpression='SET ' + ', '.join(update_expression),
        ExpressionAttributeValues=expression_values,
        ReturnValues='ALL_NEW'
    )
    
    character = response_data['Attributes']
    character['parts'] = get_character_parts(character)
    
    return response(200, character)

def delete_character(character_id):
    """キャラクター削除"""
    # キャラクター存在チェック
    result = characters_table.get_item(Key={'CharacterID': character_id})
    if 'Item' not in result:
        return response(404, {'error': 'Character not found'})
    
    characters_table.delete_item(Key={'CharacterID': character_id})
    
    return response(200, {'message': 'Character deleted successfully'})

def response(status_code, body):
    """HTTPレスポンス生成"""
    return {
        'statusCode': status_code,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'
        },
        'body': json.dumps(body, cls=DecimalEncoder, ensure_ascii=False)
    }