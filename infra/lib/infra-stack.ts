import { Bucket, HttpMethods } from '@aws-cdk/aws-s3';
import { BucketDeployment, Source } from '@aws-cdk/aws-s3-deployment';
import * as cdk from '@aws-cdk/core';
import { RemovalPolicy } from '@aws-cdk/core';

export class InfraStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const bucket = new Bucket(this, 'bucket', {
      bucketName: 'maxk.se',
      websiteIndexDocument: 'index.html',
      websiteErrorDocument: '404.html',
      cors: [{
        allowedMethods: [HttpMethods.GET, HttpMethods.HEAD],
        allowedOrigins: ['*'],
        allowedHeaders: ['*']
      }],
      publicReadAccess: true,
      autoDeleteObjects: true,
      removalPolicy: RemovalPolicy.DESTROY
    });


    new BucketDeployment(this, 'deploy', {
      sources: [Source.asset('../site/public')],
      destinationBucket: bucket,
      retainOnDelete: false
    });
  }
}
