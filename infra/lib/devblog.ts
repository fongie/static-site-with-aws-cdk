import { Dns } from './dns';
import { Construct } from 'constructs';
import { BlockPublicAccess, Bucket, BucketAccessControl, HttpMethods } from 'aws-cdk-lib/aws-s3';
import { RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib';
import { BucketDeployment, Source } from 'aws-cdk-lib/aws-s3-deployment';
import { CertificateValidation, DnsValidatedCertificate } from 'aws-cdk-lib/aws-certificatemanager';
import { AllowedMethods, Distribution, ViewerProtocolPolicy } from 'aws-cdk-lib/aws-cloudfront';
import { S3Origin } from 'aws-cdk-lib/aws-cloudfront-origins';
import { ARecord, RecordTarget } from 'aws-cdk-lib/aws-route53';
import { CloudFrontTarget } from 'aws-cdk-lib/aws-route53-targets';

export interface DevBlogProps extends StackProps {
  readonly dns: Dns;
}

export class DevBlog extends Stack {
  constructor(scope: Construct, id: string, props: DevBlogProps) {
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
      removalPolicy: RemovalPolicy.DESTROY,
      blockPublicAccess: BlockPublicAccess.BLOCK_ACLS,
      accessControl: BucketAccessControl.BUCKET_OWNER_FULL_CONTROL,
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
