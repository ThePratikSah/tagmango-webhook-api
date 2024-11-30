import * as path from "path";
import * as cdk from "aws-cdk-lib";
import * as sqs from "aws-cdk-lib/aws-sqs";
import * as sns from "aws-cdk-lib/aws-sns";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as subscriptions from "aws-cdk-lib/aws-sns-subscriptions";
import * as lambdaEventSources from "aws-cdk-lib/aws-lambda-event-sources";
import { Construct } from "constructs";
import * as dotenv from "dotenv";
dotenv.config();

export class TagmangoWebhookApiStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const webhookQueue = new sqs.Queue(this, "WebhookQueue", {
      queueName: "webhook-processing-queue",
      visibilityTimeout: cdk.Duration.seconds(300),
    });

    const webhookTopic = new sns.Topic(this, "WebhookTopic", {
      topicName: "webhook-topic",
    });

    webhookTopic.addSubscription(
      new subscriptions.SqsSubscription(webhookQueue)
    );

    const api = new apigateway.RestApi(this, "TagmangoWebhookApi", {
      restApiName: "Tagmango Webhook API",
      description: "API for receiving webhook payloads from Tagmango",
    });

    const webhookIntegration = new apigateway.AwsIntegration({
      service: "sns",
      action: "Publish",
      integrationHttpMethod: "POST",
      options: {
        credentialsRole: new cdk.aws_iam.Role(this, "ApiGatewayToSNSRole", {
          assumedBy: new cdk.aws_iam.ServicePrincipal(
            "apigateway.amazonaws.com"
          ),
          inlinePolicies: {
            AllowSNSPublish: new cdk.aws_iam.PolicyDocument({
              statements: [
                new cdk.aws_iam.PolicyStatement({
                  actions: ["sns:Publish"],
                  resources: [webhookTopic.topicArn],
                }),
              ],
            }),
          },
        }),
        requestParameters: {
          "integration.request.header.Content-Type":
            "'application/x-www-form-urlencoded'",
        },
        requestTemplates: {
          "application/json": `Action=Publish&TopicArn=$util.urlEncode('${webhookTopic.topicArn}')&Message=$util.urlEncode($input.body)`,
        },
        integrationResponses: [
          {
            statusCode: "200",
            responseTemplates: {
              "application/json": '{"message": "Message sent to SNS"}',
            },
          },
        ],
      },
    });

    const webhookResource = api.root.addResource("webhook");
    webhookResource.addMethod("POST", webhookIntegration, {
      methodResponses: [
        {
          statusCode: "200",
          responseModels: {
            "application/json": apigateway.Model.EMPTY_MODEL,
          },
        },
      ],
    });

    const sqsConsumerLambda = new lambda.Function(this, "SQSConsumerLambda", {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "index.handler",
      code: lambda.Code.fromAsset(path.join(__dirname, "lambda/sqs-consumer")),
      environment: {
        GOOGLE_CREDENTIALS: process.env.GOOGLE_CREDENTIALS || "",
        SPREADSHEET_ID: process.env.SPREADSHEET_ID || "",
      },
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
    });

    const sqsEventSource = new lambdaEventSources.SqsEventSource(webhookQueue, {
      batchSize: 10,
      maxBatchingWindow: cdk.Duration.seconds(60),
    });
    sqsConsumerLambda.addEventSource(sqsEventSource);

    new cdk.CfnOutput(this, "WebhookApiEndpoint", {
      value: api.url + "webhook",
    });
    new cdk.CfnOutput(this, "SNSTopicArn", {
      value: webhookTopic.topicArn,
    });
    new cdk.CfnOutput(this, "SQSQueueUrl", {
      value: webhookQueue.queueUrl,
    });
  }
}
