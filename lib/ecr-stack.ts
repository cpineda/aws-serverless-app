import { Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import * as cdk from "aws-cdk-lib";
import * as ecr from 'aws-cdk-lib/aws-ecr';

export class EcrStack extends Stack {

  public readonly repositoryUri: string;

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // Create an Amazon ECR repository
    const repository = new ecr.Repository(this, 'Repository', {
      repositoryName: 'frontend-app',
    });

    this.repositoryUri = repository.repositoryUri;
    
    // Output the ECR repository URI
    new cdk.CfnOutput(this, 'RepositoryUri', {
        value: repository.repositoryUri,
        description: 'ECR repository URI'
    })
  }
}