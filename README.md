# システム構成

[この資料](https://speakerdeck.com/youta1119/amplify-console-falsebirudotong-zhi-woslackdeshou-kequ-rutameniyatutakoto?slide=21)を参考にし

> EventBridge -> SNS -> Lambda -> Slack

の構成で動作するように実装した

# ディレクトリ構成

```
├── bin
│   └── amplify-build-status-notification.ts  # 起点になるファイル
├── cdk.json
├── cdk.out
├── jest.config.js
├── lambda
│   ├── package-lock.json
│   ├── package.json  # lambdaで利用する外部ライブラリはここに記載(aws-cdk/aws-lambda-nodejsが良しなにlambdaに紐づけてくれる)
│   └── slack-notification.ts  # snsのサブスクリプションに設定しているlambda
├── lib
│   ├── amplify-build-status-notification-stack.ts  # EventBridge,SNS,Lambdaなどを実装するstack
│   └── environment.ts  # dev,demo,staging,productionの各環境の設定情報
├── package-lock.json
├── package.json
├── test
│   └── amplify-build-status-notification.test.ts
└── tsconfig.json
```

# 環境情報追加〜デプロイまでの作業手順

1. slack の token を取得して SSM のストアパラメータに保存しておく
1. Amplify Console のすべてのアプリからアプリ固有の ID を取得する
   - https://xxx.yyy.amplifyapp.com (yyy の部分)
1. lib/environment.ts の EnvironmentVariablesSetting を修正
   - appIds に上で取得した ID を配列で記載
   - lambdaEnvironmentVariables に上で取得した ID に対応するサービス名を連想配列で記載
1. lambda/slack-notification.ts の修正
   - appIdToServiceName 内ロジックを修正して適切な prefix を追加
   - SLACK_CHANNEL を変更
   - SLACK_TOKEN_SSM_PARAM_NAME を変更
1. synth コマンドで cloudformation 生成
   ```
   # targetとprofileは適宜修正
   cdk synth -c target=dev --profile hoge
   ```
1. ローカルの stack とデプロイされた stack の比較
   ```
   # targetとprofileは適宜修正
   cdk diff -c target=dev --profile hoge
   ```
1. デプロイ
   ```
   # targetとprofileは適宜修正
   cdk deploy -c target=dev --profile hoge
   ```
1. 削除( !!=== 注意 ===!! )
   ```
   # targetとprofileは適宜修正
   cdk destroy -c target=dev --profile hoge
   ```

# 開発メモ

- 別 terminal で以下のコマンドを実行してビルドエラーを検知(ビルド失敗していると cdk 実行できない)
  > npm run watch
- 環境変数の利用に関しては[こちら](https://qiita.com/tetsuya-zama/items/4335f639650d6ec1e00c)を参考にした
- aws cdk の[document](https://docs.aws.amazon.com/cdk/api/latest/typescript/api/index.html)
