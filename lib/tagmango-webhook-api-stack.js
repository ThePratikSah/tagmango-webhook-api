"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TagmangoWebhookApiStack = void 0;
const path = require("path");
const cdk = require("aws-cdk-lib");
const sqs = require("aws-cdk-lib/aws-sqs");
const sns = require("aws-cdk-lib/aws-sns");
const lambda = require("aws-cdk-lib/aws-lambda");
const apigateway = require("aws-cdk-lib/aws-apigateway");
const subscriptions = require("aws-cdk-lib/aws-sns-subscriptions");
const lambdaEventSources = require("aws-cdk-lib/aws-lambda-event-sources");
const dotenv = require("dotenv");
dotenv.config();
class TagmangoWebhookApiStack extends cdk.Stack {
    constructor(scope, id, props) {
        super(scope, id, props);
        const webhookQueue = new sqs.Queue(this, "WebhookQueue", {
            queueName: "webhook-processing-queue",
            visibilityTimeout: cdk.Duration.seconds(300),
        });
        const webhookTopic = new sns.Topic(this, "WebhookTopic", {
            topicName: "webhook-topic",
        });
        webhookTopic.addSubscription(new subscriptions.SqsSubscription(webhookQueue));
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
                    assumedBy: new cdk.aws_iam.ServicePrincipal("apigateway.amazonaws.com"),
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
                    "integration.request.header.Content-Type": "'application/x-www-form-urlencoded'",
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
            memorySize: 128,
        });
        const sqsEventSource = new lambdaEventSources.SqsEventSource(webhookQueue, {
            batchSize: 1,
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
exports.TagmangoWebhookApiStack = TagmangoWebhookApiStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGFnbWFuZ28td2ViaG9vay1hcGktc3RhY2suanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJ0YWdtYW5nby13ZWJob29rLWFwaS1zdGFjay50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSw2QkFBNkI7QUFDN0IsbUNBQW1DO0FBQ25DLDJDQUEyQztBQUMzQywyQ0FBMkM7QUFDM0MsaURBQWlEO0FBQ2pELHlEQUF5RDtBQUN6RCxtRUFBbUU7QUFDbkUsMkVBQTJFO0FBRTNFLGlDQUFpQztBQUNqQyxNQUFNLENBQUMsTUFBTSxFQUFFLENBQUM7QUFFaEIsTUFBYSx1QkFBd0IsU0FBUSxHQUFHLENBQUMsS0FBSztJQUNwRCxZQUFZLEtBQWdCLEVBQUUsRUFBVSxFQUFFLEtBQXNCO1FBQzlELEtBQUssQ0FBQyxLQUFLLEVBQUUsRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBRXhCLE1BQU0sWUFBWSxHQUFHLElBQUksR0FBRyxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsY0FBYyxFQUFFO1lBQ3ZELFNBQVMsRUFBRSwwQkFBMEI7WUFDckMsaUJBQWlCLEVBQUUsR0FBRyxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDO1NBQzdDLENBQUMsQ0FBQztRQUVILE1BQU0sWUFBWSxHQUFHLElBQUksR0FBRyxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsY0FBYyxFQUFFO1lBQ3ZELFNBQVMsRUFBRSxlQUFlO1NBQzNCLENBQUMsQ0FBQztRQUVILFlBQVksQ0FBQyxlQUFlLENBQzFCLElBQUksYUFBYSxDQUFDLGVBQWUsQ0FBQyxZQUFZLENBQUMsQ0FDaEQsQ0FBQztRQUVGLE1BQU0sR0FBRyxHQUFHLElBQUksVUFBVSxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsb0JBQW9CLEVBQUU7WUFDN0QsV0FBVyxFQUFFLHNCQUFzQjtZQUNuQyxXQUFXLEVBQUUsa0RBQWtEO1NBQ2hFLENBQUMsQ0FBQztRQUVILE1BQU0sa0JBQWtCLEdBQUcs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QUFLLEVBQUUsWUFBWSxDQUFDLFFBQVE7U0FDN0IsQ0FBQyxDQUFDO1FBQ0gsSUFBSSxHQUFHLENBQUMsU0FBUyxDQUFDLElBQUksRUFBRSxhQUFhLEVBQUU7WUFDckMsS0FBSyxFQUFFLFlBQVksQ0FBQyxRQUFRO1NBQzdCLENBQUMsQ0FBQztJQUNMLENBQUM7Q0FDRjtBQXBHRCwwREFvR0MiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBwYXRoIGZyb20gXCJwYXRoXCI7XG5pbXBvcnQgKiBhcyBjZGsgZnJvbSBcImF3cy1jZGstbGliXCI7XG5pbXBvcnQgKiBhcyBzcXMgZnJvbSBcImF3cy1jZGstbGliL2F3cy1zcXNcIjtcbmltcG9ydCAqIGFzIHNucyBmcm9tIFwiYXdzLWNkay1saWIvYXdzLXNuc1wiO1xuaW1wb3J0ICogYXMgbGFtYmRhIGZyb20gXCJhd3MtY2RrLWxpYi9hd3MtbGFtYmRhXCI7XG5pbXBvcnQgKiBhcyBhcGlnYXRld2F5IGZyb20gXCJhd3MtY2RrLWxpYi9hd3MtYXBpZ2F0ZXdheVwiO1xuaW1wb3J0ICogYXMgc3Vic2NyaXB0aW9ucyBmcm9tIFwiYXdzLWNkay1saWIvYXdzLXNucy1zdWJzY3JpcHRpb25zXCI7XG5pbXBvcnQgKiBhcyBsYW1iZGFFdmVudFNvdXJjZXMgZnJvbSBcImF3cy1jZGstbGliL2F3cy1sYW1iZGEtZXZlbnQtc291cmNlc1wiO1xuaW1wb3J0IHsgQ29uc3RydWN0IH0gZnJvbSBcImNvbnN0cnVjdHNcIjtcbmltcG9ydCAqIGFzIGRvdGVudiBmcm9tIFwiZG90ZW52XCI7XG5kb3RlbnYuY29uZmlnKCk7XG5cbmV4cG9ydCBjbGFzcyBUYWdtYW5nb1dlYmhvb2tBcGlTdGFjayBleHRlbmRzIGNkay5TdGFjayB7XG4gIGNvbnN0cnVjdG9yKHNjb3BlOiBDb25zdHJ1Y3QsIGlkOiBzdHJpbmcsIHByb3BzPzogY2RrLlN0YWNrUHJvcHMpIHtcbiAgICBzdXBlcihzY29wZSwgaWQsIHByb3BzKTtcblxuICAgIGNvbnN0IHdlYmhvb2tRdWV1ZSA9IG5ldyBzcXMuUXVldWUodGhpcywgXCJXZWJob29rUXVldWVcIiwge1xuICAgICAgcXVldWVOYW1lOiBcIndlYmhvb2stcHJvY2Vzc2luZy1xdWV1ZVwiLFxuICAgICAgdmlzaWJpbGl0eVRpbWVvdXQ6IGNkay5EdXJhdGlvbi5zZWNvbmRzKDMwMCksXG4gICAgfSk7XG5cbiAgICBjb25zdCB3ZWJob29rVG9waWMgPSBuZXcgc25zLlRvcGljKHRoaXMsIFwiV2ViaG9va1RvcGljXCIsIHtcbiAgICAgIHRvcGljTmFtZTogXCJ3ZWJob29rLXRvcGljXCIsXG4gICAgfSk7XG5cbiAgICB3ZWJob29rVG9waWMuYWRkU3Vic2NyaXB0aW9uKFxuICAgICAgbmV3IHN1YnNjcmlwdGlvbnMuU3FzU3Vic2NyaXB0aW9uKHdlYmhvb2tRdWV1ZSlcbiAgICApO1xuXG4gICAgY29uc3QgYXBpID0gbmV3IGFwaWdhdGV3YXkuUmVzdEFwaSh0aGlzLCBcIlRhZ21hbmdvV2ViaG9va0FwaVwiLCB7XG4gICAgICByZXN0QXBpTmFtZTogXCJUYWdtYW5nbyBXZWJob29rIEFQSVwiLFxuICAgICAgZGVzY3JpcHRpb246IFwiQVBJIGZvciByZWNlaXZpbmcgd2ViaG9vayBwYXlsb2FkcyBmcm9tIFRhZ21hbmdvXCIsXG4gICAgfSk7XG5cbiAgICBjb25zdCB3ZWJob29rSW50ZWdyYXRpb24gPSBuZXcgYXBpZ2F0ZXdheS5Bd3NJbnRlZ3JhdGlvbih7XG4gICAgICBzZXJ2aWNlOiBcInNuc1wiLFxuICAgICAgYWN0aW9uOiBcIlB1Ymxpc2hcIixcbiAgICAgIGludGVncmF0aW9uSHR0cE1ldGhvZDogXCJQT1NUXCIsXG4gICAgICBvcHRpb25zOiB7XG4gICAgICAgIGNyZWRlbnRpYWxzUm9sZTogbmV3IGNkay5hd3NfaWFtLlJvbGUodGhpcywgXCJBcGlHYXRld2F5VG9TTlNSb2xlXCIsIHtcbiAgICAgICAgICBhc3N1bWVkQnk6IG5ldyBjZGsuYXdzX2lhbS5TZXJ2aWNlUHJpbmNpcGFsKFxuICAgICAgICAgICAgXCJhcGlnYXRld2F5LmFtYXpvbmF3cy5jb21cIlxuICAgICAgICAgICksXG4gICAgICAgICAgaW5saW5lUG9saWNpZXM6IHtcbiAgICAgICAgICAgIEFsbG93U05TUHVibGlzaDogbmV3IGNkay5hd3NfaWFtLlBvbGljeURvY3VtZW50KHtcbiAgICAgICAgICAgICAgc3RhdGVtZW50czogW1xuICAgICAgICAgICAgICAgIG5ldyBjZGsuYXdzX2lhbS5Qb2xpY3lTdGF0ZW1lbnQoe1xuICAgICAgICAgICAgICAgICAgYWN0aW9uczogW1wic25zOlB1Ymxpc2hcIl0sXG4gICAgICAgICAgICAgICAgICByZXNvdXJjZXM6IFt3ZWJob29rVG9waWMudG9waWNBcm5dLFxuICAgICAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgfSksXG4gICAgICAgICAgfSxcbiAgICAgICAgfSksXG4gICAgICAgIHJlcXVlc3RQYXJhbWV0ZXJzOiB7XG4gICAgICAgICAgXCJpbnRlZ3JhdGlvbi5yZXF1ZXN0LmhlYWRlci5Db250ZW50LVR5cGVcIjpcbiAgICAgICAgICAgIFwiJ2FwcGxpY2F0aW9uL3gtd3d3LWZvcm0tdXJsZW5jb2RlZCdcIixcbiAgICAgICAgfSxcbiAgICAgICAgcmVxdWVzdFRlbXBsYXRlczoge1xuICAgICAgICAgIFwiYXBwbGljYXRpb24vanNvblwiOiBgQWN0aW9uPVB1Ymxpc2gmVG9waWNBcm49JHV0aWwudXJsRW5jb2RlKCcke3dlYmhvb2tUb3BpYy50b3BpY0Fybn0nKSZNZXNzYWdlPSR1dGlsLnVybEVuY29kZSgkaW5wdXQuYm9keSlgLFxuICAgICAgICB9LFxuICAgICAgICBpbnRlZ3JhdGlvblJlc3BvbnNlczogW1xuICAgICAgICAgIHtcbiAgICAgICAgICAgIHN0YXR1c0NvZGU6IFwiMjAwXCIsXG4gICAgICAgICAgICByZXNwb25zZVRlbXBsYXRlczoge1xuICAgICAgICAgICAgICBcImFwcGxpY2F0aW9uL2pzb25cIjogJ3tcIm1lc3NhZ2VcIjogXCJNZXNzYWdlIHNlbnQgdG8gU05TXCJ9JyxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgfSxcbiAgICAgICAgXSxcbiAgICAgIH0sXG4gICAgfSk7XG5cbiAgICBjb25zdCB3ZWJob29rUmVzb3VyY2UgPSBhcGkucm9vdC5hZGRSZXNvdXJjZShcIndlYmhvb2tcIik7XG4gICAgd2ViaG9va1Jlc291cmNlLmFkZE1ldGhvZChcIlBPU1RcIiwgd2ViaG9va0ludGVncmF0aW9uLCB7XG4gICAgICBtZXRob2RSZXNwb25zZXM6IFtcbiAgICAgICAge1xuICAgICAgICAgIHN0YXR1c0NvZGU6IFwiMjAwXCIsXG4gICAgICAgICAgcmVzcG9uc2VNb2RlbHM6IHtcbiAgICAgICAgICAgIFwiYXBwbGljYXRpb24vanNvblwiOiBhcGlnYXRld2F5Lk1vZGVsLkVNUFRZX01PREVMLFxuICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICBdLFxuICAgIH0pO1xuXG4gICAgY29uc3Qgc3FzQ29uc3VtZXJMYW1iZGEgPSBuZXcgbGFtYmRhLkZ1bmN0aW9uKHRoaXMsIFwiU1FTQ29uc3VtZXJMYW1iZGFcIiwge1xuICAgICAgcnVudGltZTogbGFtYmRhLlJ1bnRpbWUuTk9ERUpTXzIwX1gsXG4gICAgICBoYW5kbGVyOiBcImluZGV4LmhhbmRsZXJcIixcbiAgICAgIGNvZGU6IGxhbWJkYS5Db2RlLmZyb21Bc3NldChwYXRoLmpvaW4oX19kaXJuYW1lLCBcImxhbWJkYS9zcXMtY29uc3VtZXJcIikpLFxuICAgICAgZW52aXJvbm1lbnQ6IHtcbiAgICAgICAgR09PR0xFX0NSRURFTlRJQUxTOiBwcm9jZXNzLmVudi5HT09HTEVfQ1JFREVOVElBTFMgfHwgXCJcIixcbiAgICAgICAgU1BSRUFEU0hFRVRfSUQ6IHByb2Nlc3MuZW52LlNQUkVBRFNIRUVUX0lEIHx8IFwiXCIsXG4gICAgICB9LFxuICAgICAgdGltZW91dDogY2RrLkR1cmF0aW9uLnNlY29uZHMoMzApLFxuICAgICAgbWVtb3J5U2l6ZTogMTI4LFxuICAgIH0pO1xuXG4gICAgY29uc3Qgc3FzRXZlbnRTb3VyY2UgPSBuZXcgbGFtYmRhRXZlbnRTb3VyY2VzLlNxc0V2ZW50U291cmNlKHdlYmhvb2tRdWV1ZSwge1xuICAgICAgYmF0Y2hTaXplOiAxLFxuICAgICAgbWF4QmF0Y2hpbmdXaW5kb3c6IGNkay5EdXJhdGlvbi5zZWNvbmRzKDYwKSxcbiAgICB9KTtcbiAgICBzcXNDb25zdW1lckxhbWJkYS5hZGRFdmVudFNvdXJjZShzcXNFdmVudFNvdXJjZSk7XG5cbiAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCBcIldlYmhvb2tBcGlFbmRwb2ludFwiLCB7XG4gICAgICB2YWx1ZTogYXBpLnVybCArIFwid2ViaG9va1wiLFxuICAgIH0pO1xuICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsIFwiU05TVG9waWNBcm5cIiwge1xuICAgICAgdmFsdWU6IHdlYmhvb2tUb3BpYy50b3BpY0FybixcbiAgICB9KTtcbiAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCBcIlNRU1F1ZXVlVXJsXCIsIHtcbiAgICAgIHZhbHVlOiB3ZWJob29rUXVldWUucXVldWVVcmwsXG4gICAgfSk7XG4gIH1cbn1cbiJdfQ==