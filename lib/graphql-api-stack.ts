import { Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import * as cdk from "aws-cdk-lib";
import * as appsync from "aws-cdk-lib/aws-appsync";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as events from "aws-cdk-lib/aws-events";
import * as cognito from "aws-cdk-lib/aws-cognito";
import { UserPool } from "aws-cdk-lib/aws-cognito";

interface ApiStackProps extends StackProps {
  userpool: UserPool
}

export class GraphqlApiStack extends Stack {
  constructor(scope: Construct, id: string, props?: ApiStackProps) {
    super(scope, id, props);

    if(!props || !props.userpool)
      return

    // Create an AppSync API
    const api = new appsync.GraphqlApi(this, "graphql-api", {
      name: "graphql-api",
      schema: appsync.SchemaFile.fromAsset("graphql/schema.graphql"),
      authorizationConfig: {
        defaultAuthorization: {
          authorizationType: appsync.AuthorizationType.USER_POOL,
          userPoolConfig: {
            userPool: cognito.UserPool.fromUserPoolId(
              this,
              "user-pool",
              props?.userpool.userPoolId
            ),
          },
        },
      },
      logConfig: {
        fieldLogLevel: appsync.FieldLogLevel.ALL,
      },
      xrayEnabled: true,
    });

    // Create a Lambda function
    const lambdaFunction = new lambda.Function(this, "lambda-function", {
      runtime: lambda.Runtime.NODEJS_14_X,
      code: lambda.Code.fromAsset("lambda"),
      handler: "index.handler",
    });

    // Create an EventBridge event bus
    const eventBus = new events.EventBus(this, "event-bus", {
      eventBusName: "event-bus",
    });

    // Grant permissions to the Lambda function to read from the EventBridge event bus
    eventBus.grantPutEventsTo(lambdaFunction);

    // Connect Lambda function as a data source for the API
    const lambdaDataSource = api.addLambdaDataSource(
      "lambda-data-source",
      lambdaFunction
    );

    // Create a GraphQL resolver for the Query
    lambdaDataSource.createResolver("queryResolver", {
      typeName: "Query",
      fieldName: "myQuery",
    });

    // Create a GraphQL resolver for the Mutation
    lambdaDataSource.createResolver("muttionResolver", {
      typeName: "Mutation",
      fieldName: "myMutation",
    });

    // Create a GraphQL resolver for the Subscription
    lambdaDataSource.createResolver("subscriptionResolver", {
      typeName: "Subscription",
      fieldName: "mySubscription",
    });

    // Output the API URL
    new cdk.CfnOutput(this, "GraphQL API URL", {
      value: api.graphqlUrl,
    });
  }
}
