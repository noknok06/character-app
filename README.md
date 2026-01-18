# キャラクター構想管理システム

サーバーレスアプリの練習台

AWSサーバーレスアーキテクチャで構築したキャラクター管理アプリケーション

## 概要

キャラクターの容姿、性格、行動などを「パーツ」として管理し、それらを組み合わせてキャラクターを作成できるシステムです。

## アーキテクチャ
```
フロントエンド (S3)
    ↓ HTTPS + Basic認証
API Gateway + Lambda Authorizer
    ↓
Lambda関数 (Python 3.12)
    ↓
DynamoDB
```

## 使用技術

- **フロントエンド**: HTML, CSS, JavaScript
- **API**: AWS API Gateway
- **認証**: Lambda Authorizer (Basic認証)
- **バックエンド**: AWS Lambda (Python 3.12)
- **データベース**: Amazon DynamoDB
- **ホスティング**: Amazon S3

## Lambda関数

### authHandler
- Basic認証を行うLambda Authorizer
- ファイル: `lambda/authHandler/lambda_function.py`

### partsHandler
- パーツのCRUD操作を行う関数
- ファイル: `lambda/partsHandler/lambda_function.py`
- 機能: パーツの作成、取得、更新、削除

### charactersHandler
- キャラクターのCRUD操作を行う関数
- ファイル: `lambda/charactersHandler/lambda_function.py`
- 機能: キャラクターの作成、取得、更新、削除

