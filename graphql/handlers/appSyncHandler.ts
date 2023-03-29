import { Handler } from "aws-cdk-lib/aws-lambda";

export const handler: Handler = async (event: any) => {
    console.log(event);
    
    // TODO implement
    const response = {
      statusCode: 200,
      body: JSON.stringify('Hello from Lambda!'),
    };
    return response;
}
