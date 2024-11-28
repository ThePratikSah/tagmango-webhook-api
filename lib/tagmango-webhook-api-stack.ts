import * as path from "path";
import * as cdk from "aws-cdk-lib";
import * as sqs from "aws-cdk-lib/aws-sqs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
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

    const webhookReceiverLambda = new lambda.Function(
      this,
      "WebhookReceiverLambda",
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        handler: "index.handler",
        code: lambda.Code.fromAsset(
          path.join(__dirname, "lambda/webhook-receiver")
        ),
        environment: {
          QUEUE_URL: webhookQueue.queueUrl,
        },
      }
    );

    webhookQueue.grantSendMessages(webhookReceiverLambda);

    const api = new apigateway.RestApi(this, "TagmangoWebhookApi", {
      restApiName: "Tagmango Webhook API",
      description: "API for receiving webhook payloads from Tagmango",
    });

    const webhookIntegration = new apigateway.LambdaIntegration(
      webhookReceiverLambda
    );

    const webhookResource = api.root.addResource("webhook");
    webhookResource.addMethod("POST", webhookIntegration);

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
    new cdk.CfnOutput(this, "SQSQueueUrl", {
      value: webhookQueue.queueUrl,
    });
  }
}
