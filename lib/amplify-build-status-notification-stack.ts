import { App, Duration, Stack, StackProps } from "@aws-cdk/core";
import { Runtime } from "@aws-cdk/aws-lambda";
import {
  Effect,
  PolicyDocument,
  PolicyStatement,
  Role,
  ServicePrincipal,
} from "@aws-cdk/aws-iam";
import { NodejsFunction } from "@aws-cdk/aws-lambda-nodejs";
import { Topic } from "@aws-cdk/aws-sns";
import { LambdaSubscription } from "@aws-cdk/aws-sns-subscriptions";
import {
  EventField,
  EventPattern,
  Rule,
  RuleTargetInput,
} from "@aws-cdk/aws-events";
import { SnsTopic } from "@aws-cdk/aws-events-targets";
import * as environment from "./environment";

const STACK_NAME = "AmplifyBuildStatusNotification";
const SERVICE_NAME = "amplify-build-status-notification";

export class AmplifyBuildStatusNotificationStack extends Stack {
  constructor(
    scope: App,
    id: string,
    target: environment.Environments,
    props?: StackProps
  ) {
    super(scope, id, props);

    // 環境情報
    const environmentVariables = environment.variablesOf(target);

    // lambdaに付与するrole
    const lambdaPolicyStatementToLogs = new PolicyStatement({
      effect: Effect.ALLOW,
      resources: ["arn:aws:logs:*:*:/aws/lambda/*"],
      actions: [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents",
      ],
    });
    const lambdaPolicyStatementToSsm = new PolicyStatement({
      effect: Effect.ALLOW,
      resources: ["arn:aws:ssm:*:*:parameter/*"],
      actions: ["ssm:GetParameter"],
    });
    const lambdaPolicy = new PolicyDocument({
      statements: [lambdaPolicyStatementToSsm, lambdaPolicyStatementToLogs],
    });
    const lambdaRole = new Role(
      this,
      `iamrole-lambda-${target}-${SERVICE_NAME}`,
      {
        roleName: `iamrole-lambda-${target}-${SERVICE_NAME}`,
        assumedBy: new ServicePrincipal("lambda.amazonaws.com"),
        inlinePolicies: {
          [`iampolicy-lambda-${target}-${SERVICE_NAME}`]: lambdaPolicy,
        },
      }
    );

    // lambda
    const lambdaSlackNotification = new NodejsFunction(
      this,
      `LambdaFunc${STACK_NAME}`,
      {
        functionName: `lambdafunc-${target}-${SERVICE_NAME}`,
        runtime: Runtime.NODEJS_12_X,
        entry: "lambda/slack-notification.ts",
        role: lambdaRole,
        handler: "handler",
        timeout: Duration.seconds(10),
        memorySize: 256,
        environment: environmentVariables.lambdaEnvironmentVariables,
      }
    );

    // sns
    const snsTopic = new Topic(this, `SnsTopic${STACK_NAME}`, {
      displayName: `sns-topic-${target}-${SERVICE_NAME}`,
    });

    // topicにサブスクリプションを追加してlambdaを紐付け
    snsTopic.addSubscription(new LambdaSubscription(lambdaSlackNotification));

    // eventbridge
    const eventPattern: EventPattern = {
      detail: {
        appId: environmentVariables.appIds,
        jobStatus: ["SUCCEED", "FAILED", "STARTED"],
      },
      detailType: ["Amplify Deployment Status Change"],
      source: ["aws.amplify"],
    };

    const rule = new Rule(this, `EventBridgeRule${STACK_NAME}`, {
      ruleName: `eventbridge-rule-${target}-${SERVICE_NAME}`,
      description: "amplify buildイベントを取得しsnsに流すeventbridge",
      eventPattern: eventPattern,
      enabled: true,
    });
    rule.addTarget(
      new SnsTopic(snsTopic, {
        message: RuleTargetInput.fromObject({
          appId: EventField.fromPath("$.detail.appId"),
          branch: EventField.fromPath("$.detail.branchName"),
          jobId: EventField.fromPath("$.detail.jobId"),
          region: EventField.fromPath("$.region"),
          status: EventField.fromPath("$.detail.jobStatus"),
        }),
      })
    );
  }
}
