#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { AuthenticationStack } from "../lib/authentication-stack";
import { GraphqlApiStack } from "../lib/graphql-api-stack";
import { DatabaseStack } from "../lib/database-stack";
import { FrontendStack } from "../lib/frontend-stack";
import { PipelineStack } from "../lib/pipeline-stack";

const app = new cdk.App();

const authenticationStack = new AuthenticationStack(app, "AuthenticationStack");
new GraphqlApiStack(app, "GraphqlApiStack", {
  userpool: authenticationStack.userPool,
});
new DatabaseStack(app, "DatabaseStack");
new FrontendStack(app, "FrontendStack");
new PipelineStack(app, "PipelineStack");
