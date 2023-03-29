import * as cdk from 'aws-cdk-lib';
import * as ecr from 'aws-cdk-lib/aws-ecr';

export class EcrStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create an Amazon ECR repository
    const repository = new ecr.Repository(this, 'Repository', {
      repositoryName: 'frontend-app',
    });

    // Output the ECR repository URI
    new cdk.CfnOutput(this, 'RepositoryUri', {
        value: repository.repositoryUri,
        description: 'ECR repository URI'
    })
  }
}