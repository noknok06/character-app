import json
import base64

# ★★★ app.jsと同じユーザー名とパスワードを設定 ★★★
USERNAME = '***'  # app.jsと同じ値
PASSWORD = '***'  # app.jsと同じ値

def lambda_handler(event, context):
    """
    Basic認証を行うLambda Authorizer
    """
    print(f"Event: {json.dumps(event)}")
    
    # authorizationToken フィールドから取得（TOKEN型Authorizerの場合）
    auth_header = event.get('authorizationToken', '')
    
    print(f"Authorization header: {auth_header}")
    
    if not auth_header or not auth_header.startswith('Basic '):
        print("No valid Authorization header")
        return generate_policy('user', 'Deny', event['methodArn'])
    
    # Base64デコード
    try:
        encoded_credentials = auth_header.replace('Basic ', '')
        decoded_credentials = base64.b64decode(encoded_credentials).decode('utf-8')
        username, password = decoded_credentials.split(':', 1)
        
        print(f"Decoded username: {username}")
        # パスワードはログに出力しない（セキュリティのため）
        
    except Exception as e:
        print(f"Error decoding credentials: {str(e)}")
        return generate_policy('user', 'Deny', event['methodArn'])
    
    # 認証チェック
    if username == USERNAME and password == PASSWORD:
        print("Authentication successful")
        return generate_policy(username, 'Allow', event['methodArn'])
    else:
        print(f"Authentication failed - username match: {username == USERNAME}")
        return generate_policy('user', 'Deny', event['methodArn'])

def generate_policy(principal_id, effect, resource):
    """
    IAMポリシーを生成
    """
    # リソースARNをワイルドカードに変更して全APIメソッドを許可
    resource_parts = resource.split('/')
    if len(resource_parts) >= 2:
        # arn:aws:execute-api:region:account:api-id/stage/*/* の形式にする
        base_arn = '/'.join(resource_parts[:2])
        wildcard_resource = f"{base_arn}/*/*"
    else:
        wildcard_resource = resource
    
    print(f"Generating {effect} policy for resource: {wildcard_resource}")
    
    auth_response = {
        'principalId': principal_id
    }
    
    if effect and resource:
        policy_document = {
            'Version': '2012-10-17',
            'Statement': [{
                'Action': 'execute-api:Invoke',
                'Effect': effect,
                'Resource': wildcard_resource
            }]
        }
        auth_response['policyDocument'] = policy_document
    
    return auth_response