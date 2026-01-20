import json
import boto3
from datetime import datetime
from decimal import Decimal
import uuid

# DynamoDBクライアント初期化
dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('Parts')

# DecimalをJSONシリアライズ可能にする
class DecimalEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, Decimal):
            return float(obj)
        return super(DecimalEncoder, self).default(obj)

def lambda_handler(event, context):
    """
    パーツのCRUD操作を行うLambda関数
    """
    print(f"Event: {json.dumps(event)}")
    
    http_method = event.get('httpMethod')
    path_parameters = event.get('pathParameters') or {}
    query_parameters = event.get('queryStringParameters') or {}
    
    try:
        # GET /parts?type={type} - パーツ一覧取得
        if http_method == 'GET' and not path_parameters:
            return get_parts(query_parameters)
        
        # GET /parts/{partId} - 特定パーツ取得
        elif http_method == 'GET' and path_parameters:
            part_id = path_parameters.get('partId')
            return get_part(part_id)
        
        # POST /parts - パーツ新規作成
        elif http_method == 'POST':
            body = json.loads(event.get('body', '{}'))
            return create_part(body)
        
        # PUT /parts/{partId} - パーツ更新
        elif http_method == 'PUT':
            part_id = path_parameters.get('partId')
            body = json.loads(event.get('body', '{}'))
            return update_part(part_id, body)
        
        # DELETE /parts/{partId} - パーツ削除
        elif http_method == 'DELETE':
            part_id = path_parameters.get('partId')
            return delete_part(part_id)
        
        else:
            return response(400, {'error': 'Unsupported method'})
    
    except Exception as e:
        print(f"Error: {str(e)}")
        return response(500, {'error': str(e)})

def get_parts(query_params):
    """パーツ一覧取得（種別でフィルタ可能）"""
    part_type = query_params.get('type')
    
    if part_type:
        # 種別でフィルタ（GSI使用）
        result = table.query(
            IndexName='PartType-index',
            KeyConditionExpression='PartType = :type',
            ExpressionAttributeValues={':type': part_type}
        )
    else:
        # 全件取得
        result = table.scan()
    
    return response(200, {
        'parts': result.get('Items', []),
        'count': len(result.get('Items', []))
    })

def get_part(part_id):
    """特定パーツ取得"""
    result = table.get_item(Key={'PartID': part_id})
    
    if 'Item' not in result:
        return response(404, {'error': 'Part not found'})
    
    return response(200, result['Item'])

def create_part(data):
    """パーツ新規作成"""
    # 必須項目チェック
    required_fields = ['PartType', 'Name']
    for field in required_fields:
        if field not in data:
            return response(400, {'error': f'{field} is required'})
    
    # 新規パーツ作成
    part_id = f"part_{uuid.uuid4().hex[:8]}"
    now = datetime.utcnow().isoformat() + 'Z'
    
    item = {
        'PartID': part_id,
        'PartType': data['PartType'],
        'Name': data['Name'],
        'Description': data.get('Description', ''),
        'CreatedAt': now,
        'UpdatedAt': now
    }
    
    table.put_item(Item=item)
    
    return response(201, item)

def update_part(part_id, data):
    """パーツ更新"""
    # パーツ存在チェック
    result = table.get_item(Key={'PartID': part_id})
    if 'Item' not in result:
        return response(404, {'error': 'Part not found'})
    
    # 更新可能フィールド
    update_expression = []
    expression_values = {}
    expression_names = {}
    
    now = datetime.utcnow().isoformat() + 'Z'
    
    # ★★★ PartTypeの更新を追加 ★★★
    if 'PartType' in data:
        update_expression.append('PartType = :type')
        expression_values[':type'] = data['PartType']
    
    if 'Name' in data:
        update_expression.append('#name = :name')
        expression_names['#name'] = 'Name'
        expression_values[':name'] = data['Name']
    
    if 'Description' in data:
        update_expression.append('Description = :desc')
        expression_values[':desc'] = data['Description']
    
    update_expression.append('UpdatedAt = :updated')
    expression_values[':updated'] = now
    
    # 更新実行
    update_params = {
        'Key': {'PartID': part_id},
        'UpdateExpression': 'SET ' + ', '.join(update_expression),
        'ExpressionAttributeValues': expression_values,
        'ReturnValues': 'ALL_NEW'
    }
    
    # ExpressionAttributeNamesは必要な場合のみ追加
    if expression_names:
        update_params['ExpressionAttributeNames'] = expression_names
    
    response_data = table.update_item(**update_params)
    
    return response(200, response_data['Attributes'])
    
def delete_part(part_id):
    """パーツ削除"""
    # パーツ存在チェック
    result = table.get_item(Key={'PartID': part_id})
    if 'Item' not in result:
        return response(404, {'error': 'Part not found'})
    
    table.delete_item(Key={'PartID': part_id})
    
    return response(200, {'message': 'Part deleted successfully'})

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