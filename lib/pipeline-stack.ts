import * as cdk from "aws-cdk-lib";
import * as codepipeline from "aws-cdk-lib/aws-codepipeline";
import * as codepipeline_actions from "aws-cdk-lib/aws-codepipeline-actions";
import * as codedeploy from "aws-cdk-lib/aws-codedeploy";

export class PipelineStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const sourceArtifact = new codepipeline.Artifact();
    const cloudAssemblyArtifact = new codepipeline.Artifact();

    // Create a Codepipeline to deploy the application
    const pipeline = new codepipeline.Pipeline(this, "Pipeline", {
      pipelineName: "aws-serverless-pipeline",
      restartExecutionOnUpdate: true,
    });

    // Create a CodeDeploy application
    const application = new codedeploy.ServerApplication(this, "Application", {
      applicationName: "aws-serverless-application",
    });
  }
}
