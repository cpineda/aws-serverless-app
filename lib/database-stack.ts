import { Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";

export class DatabaseStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const table = new dynamodb.Table(this, "Table", {
      partitionKey: {
        name: "PK",
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: "SK",
        type: dynamodb.AttributeType.STRING,
      },
      tableName: "Accounts",
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
    });
  }
}
