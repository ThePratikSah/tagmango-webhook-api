#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { TagmangoWebhookApiStack } from "../lib/tagmango-webhook-api-stack";

const app = new cdk.App();
new TagmangoWebhookApiStack(app, "TagmangoWebhookApiStack", {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});
