import { CfnOutput, Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import * as cdk from "aws-cdk-lib";
import * as eks from "aws-cdk-lib/aws-eks";

export class FrontendStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // Create EKS cluster
    const eksCluster = new eks.Cluster(this, "EksCluster", {
      version: eks.KubernetesVersion.V1_21,
      clusterName: "eks-frontend",
    });

    // Add a fargate managed node group to the cluster
    eksCluster.addFargateProfile("fargate-profile", {
      selectors: [
        {
          namespace: "default",
        },
      ],
    });

    // Export the EKS cluster name as an output
    new CfnOutput(this, "EksClusterName", { value: eksCluster.clusterName });
  }
}
