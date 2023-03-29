import * as cdk from "aws-cdk-lib";
import * as codepipeline from "aws-cdk-lib/aws-codepipeline";
import * as codepipeline_actions from "aws-cdk-lib/aws-codepipeline-actions";
import * as codedeploy from "aws-cdk-lib/aws-codedeploy";
import * as codebuild from "aws-cdk-lib/aws-codebuild";
import { AuthenticationStack } from "./authentication-stack";
import { StackProps } from "aws-cdk-lib";
import { DatabaseStack } from "./database-stack";
import { EcrStack } from "./ecr-stack";
import { FrontendStack } from "./frontend-stack";
import { GraphqlApiStack } from "./graphql-api-stack";

export class PipelineStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: StackProps) {
    super(scope, id, props);

    console.log("👀 Creating pipeline stack");
    

    // Create ECR stack first to then push docker image
    const ecrStack = new EcrStack(this, "EcrStack");

    // Create a Codepipeline to deploy the application
    const pipeline = new codepipeline.Pipeline(this, "Pipeline", {
      pipelineName: "aws-serverless-pipeline",
      restartExecutionOnUpdate: true,
    });

    // Create a CodeBuild project for building the application
    const buildProject = new codebuild.PipelineProject(this, "BuildProject", {
      projectName: "aws-serverless-build-project",
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_5_0,
      },
      buildSpec: codebuild.BuildSpec.fromObject({
        version: "0.2",
        phases: {
          install: {
            runtimeVersion: 14,
          },
          commands: ["yarn install"],
        },
        pre_build: {
          commands: [
            "echo 'Running pre-build script'",
            "$(aws ecr get-login --region $AWS_DEFAULT_REGION --no-include-email)",
            `REPOSITORY_URI=${ecrStack.repositoryUri}`,
            "COMMIT_HASH=$(echo $CODEBUILD_RESOLVED_SOURCE_VERSION | cut -c 1-7)",
            "IMAGE_TAG=${COMMIT_HASH:-latest}",
          ],
        },
        build: {
          commands: [
            "echo 'Running build script'",
            "yarn build",
            "npx cdk synth",
            "docker build -t $REPOSITORY_URI:latest .",
            "docker tag $REPOSITORY_URI:latest $REPOSITORY_URI:$IMAGE_TAG",
          ],
        },
        post_build: {
          commands: [
            "echo 'Running post-build script'",
            "docker push $REPOSITORY_URI:latest",
            "docker push $REPOSITORY_URI:$IMAGE_TAG",
            "echo 'Completed post-build script'",
          ],
        },
      }),
    });

    // Create a GitHub source action
    const sourceOutput = new codepipeline.Artifact();
    const sourceAction = new codepipeline_actions.GitHubSourceAction({
      actionName: "GitHub",
      owner: "cpineda",
      repo: "aws-serverless-app",
      oauthToken: cdk.SecretValue.secretsManager("github-token"),
      output: sourceOutput,
      branch: "main",
      trigger: codepipeline_actions.GitHubTrigger.WEBHOOK,
    });

    // Create a CodeBuild build action
    const buildOutput = new codepipeline.Artifact();
    const buildAction = new codepipeline_actions.CodeBuildAction({
      actionName: "CodeBuild_Build",
      project: buildProject,
      input: sourceOutput,
      outputs: [buildOutput],
      environmentVariables: {
        AWS_DEFAULT_REGION: {
          value: this.region,
        },
        AWS_ACCOUNT_ID: {
          value: this.account,
        },
        ECR_REPOSITORY_URI: {
          value: ecrStack.repositoryUri,
        },
      },
    });

    // Add the source and build stages to the pipeline
    pipeline.addStage({
      stageName: "Source",
      actions: [sourceAction],
    });

    // Add the build stage to the pipeline
    pipeline.addStage({
      stageName: "Build",
      actions: [buildAction],
    });

    // Add deployment stages for each stack
    const authenticationStack = new AuthenticationStack(
      this,
      "AuthenticationStack"
    );
    const graphqlApiStack = new GraphqlApiStack(this, "GraphqlApiStack", {
      userpool: authenticationStack.userPool,
    });
    const databaseStack = new DatabaseStack(this, "DatabaseStack");
    const frontendStack = new FrontendStack(this, "FrontendStack");

    const authenticationDeployAction =
      new codepipeline_actions.CloudFormationCreateUpdateStackAction({
        actionName: "AuthenticationStack_Deploy",
        stackName: authenticationStack.stackName || "authentication-stack",
        templatePath: buildOutput.atPath(
          `${authenticationStack.stackName}.template.json`
        ),

        adminPermissions: true,
      });

    const graphQLDeployAction =
      new codepipeline_actions.CloudFormationCreateUpdateStackAction({
        actionName: "GraphqlApiStack_Deploy",
        stackName: graphqlApiStack.stackName || "graphql-api-stack",
        templatePath: buildOutput.atPath(
          `${graphqlApiStack.stackName}.template.json`
        ),
        adminPermissions: true,
      });

    const databaseDeployAction =
      new codepipeline_actions.CloudFormationCreateUpdateStackAction({
        actionName: "DatabaseStack_Deploy",
        stackName: databaseStack.stackName || "database-stack",
        templatePath: buildOutput.atPath(
          `${databaseStack.stackName}.template.json`
        ),
        adminPermissions: true,
      });

    const frontendDeployAction =
      new codepipeline_actions.CloudFormationCreateUpdateStackAction({
        actionName: "FrontendStack_Deploy",
        stackName: frontendStack.stackName || "frontend-stack",
        templatePath: buildOutput.atPath(
          `${frontendStack.stackName}.template.json`
        ),
        adminPermissions: true,
      });

    const ecrDeployAction =
      new codepipeline_actions.CloudFormationCreateUpdateStackAction({
        actionName: "ECR_Deploy",
        stackName: ecrStack.stackName || "ecr-stack",
        templatePath: buildOutput.atPath(`${ecrStack.stackName}.template.json`),
        adminPermissions: true,
      });

    // Add the deploy stages to the pipeline
    pipeline.addStage({
      stageName: "AuthenticationStack_Deploy",
      actions: [authenticationDeployAction],
    });

    pipeline.addStage({
      stageName: "GraphqlApiStack_Deploy",
      actions: [graphQLDeployAction],
    });

    pipeline.addStage({
      stageName: "DatabaseStack_Deploy",
      actions: [databaseDeployAction],
    });

    pipeline.addStage({
      stageName: "FrontendStack_Deploy",
      actions: [frontendDeployAction],
    });

    pipeline.addStage({
      stageName: "ECR_Deploy",
      actions: [ecrDeployAction],
    });

    // Output pipeline arn
    new cdk.CfnOutput(this, "PipelineArn", {
      value: pipeline.pipelineArn,
      description: "PipelineArn",
    })
  }
}
