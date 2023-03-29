import { CfnOutput, Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import * as cdk from "aws-cdk-lib";
import * as cognito from "aws-cdk-lib/aws-cognito";

export class AuthenticationStack extends Stack {

  public readonly userPool: cognito.UserPool;
  public readonly userPoolClient: cognito.UserPoolClient;

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);    

    // Create a Cognito User Pool
    const userPool = new cognito.UserPool(this, "UserPool", {
      userPoolName: "aws-serverlessapp-userpool",
      selfSignUpEnabled: true,
      signInAliases: {
        email: true,
        username: false,
        phone: false,
      },
      autoVerify: {
        email: true,
      },
      standardAttributes: {
        email: {
          required: true,
          mutable: true,
        },
      },
      passwordPolicy: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: false,
      },
    });

    // Create a Cognito Identity Pool
    const userPoolClient = userPool.addClient("UserPoolClient", {
      userPoolClientName: "aws-serverlessapp-userpool-client",
      authFlows: {
        userPassword: true,
      },
      refreshTokenValidity: cdk.Duration.days(1),
      accessTokenValidity: cdk.Duration.hours(1),
      idTokenValidity: cdk.Duration.hours(1),
    });

    // Create a Cognito Identity Pool
    const identityPool = new cognito.CfnIdentityPool(this, "IdentityPool", {
      identityPoolName: "aws-serverlessapp-identitypool",
      allowUnauthenticatedIdentities: false,
      cognitoIdentityProviders: [
        {
          clientId: userPoolClient.userPoolClientId,
          providerName: userPool.userPoolProviderUrl,
        },
      ],
    });

    this.userPool = userPool
    this.userPoolClient = userPoolClient

    new CfnOutput(this, "UserPoolId", {
      value: userPool.userPoolId,
      description: "User Pool Id",
    })

    new CfnOutput(this, "UserPoolClientId", {
      value: userPoolClient.userPoolClientId,
      description: "User Pool Client Id",
    })
  }
}
