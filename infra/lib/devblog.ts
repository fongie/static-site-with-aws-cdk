import { CertificateValidation, DnsValidatedCertificate } from '@aws-cdk/aws-certificatemanager';
import { AllowedMethods, Distribution, ViewerProtocolPolicy } from '@aws-cdk/aws-cloudfront';
import { S3Origin } from '@aws-cdk/aws-cloudfront-origins';
import { ARecord, RecordTarget } from '@aws-cdk/aws-route53';
import { CloudFrontTarget } from '@aws-cdk/aws-route53-targets';
import { Bucket, HttpMethods } from '@aws-cdk/aws-s3';
import { BucketDeployment, Source } from '@aws-cdk/aws-s3-deployment';
import * as cdk from '@aws-cdk/core';
import { RemovalPolicy } from '@aws-cdk/core';
import { Dns } from './dns';

export interface DevBlogProps extends cdk.StackProps {
  readonly dns: Dns;
}

export class DevBlog extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props: DevBlogProps) {
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

    const seMaxkCert = new DnsValidatedCertificate(this, 'se-maxk-cert', {
      domainName: 'maxk.se',
      hostedZone: props.dns.se_maxk,
      region: 'us-east-1',
      validation: CertificateValidation.fromDns(props.dns.se_maxk)
    });

    var dist = new Distribution(this, 'devblog-dist', {
      defaultBehavior: {
        origin: new S3Origin(bucket),
        allowedMethods: AllowedMethods.ALLOW_ALL,
        viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      },
      domainNames: ['maxk.se'],
      certificate: seMaxkCert,
    });

    new ARecord(this, 'cf-dist-a-record', {
      zone: props.dns.se_maxk,
      target: RecordTarget.fromAlias(new CloudFrontTarget(dist)),
    });
  }
}
