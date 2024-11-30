#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cdk = require("aws-cdk-lib");
const tagmango_webhook_api_stack_1 = require("../lib/tagmango-webhook-api-stack");
const app = new cdk.App();
new tagmango_webhook_api_stack_1.TagmangoWebhookApiStack(app, "TagmangoWebhookApiStack", {
    env: {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: process.env.CDK_DEFAULT_REGION,
    },
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGFnbWFuZ28td2ViaG9vay1hcGkuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJ0YWdtYW5nby13ZWJob29rLWFwaS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFDQSxtQ0FBbUM7QUFDbkMsa0ZBQTRFO0FBRTVFLE1BQU0sR0FBRyxHQUFHLElBQUksR0FBRyxDQUFDLEdBQUcsRUFBRSxDQUFDO0FBQzFCLElBQUksb0RBQXVCLENBQUMsR0FBRyxFQUFFLHlCQUF5QixFQUFFO0lBQzFELEdBQUcsRUFBRTtRQUNILE9BQU8sRUFBRSxPQUFPLENBQUMsR0FBRyxDQUFDLG1CQUFtQjtRQUN4QyxNQUFNLEVBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxrQkFBa0I7S0FDdkM7Q0FDRixDQUFDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIjIS91c3IvYmluL2VudiBub2RlXG5pbXBvcnQgKiBhcyBjZGsgZnJvbSBcImF3cy1jZGstbGliXCI7XG5pbXBvcnQgeyBUYWdtYW5nb1dlYmhvb2tBcGlTdGFjayB9IGZyb20gXCIuLi9saWIvdGFnbWFuZ28td2ViaG9vay1hcGktc3RhY2tcIjtcblxuY29uc3QgYXBwID0gbmV3IGNkay5BcHAoKTtcbm5ldyBUYWdtYW5nb1dlYmhvb2tBcGlTdGFjayhhcHAsIFwiVGFnbWFuZ29XZWJob29rQXBpU3RhY2tcIiwge1xuICBlbnY6IHtcbiAgICBhY2NvdW50OiBwcm9jZXNzLmVudi5DREtfREVGQVVMVF9BQ0NPVU5ULFxuICAgIHJlZ2lvbjogcHJvY2Vzcy5lbnYuQ0RLX0RFRkFVTFRfUkVHSU9OLFxuICB9LFxufSk7XG4iXX0=