+++ 
draft = false
date = 2021-05-22T21:29:58+01:00
title = "How to start an AWS CodePipeline using webhook filters with CDK"
description = "Webhook filters are not supported by CodePipeline normally, here's a workaround!"
slug = "codepipeline-webhook-filters"
authors = ["Max Körlinge"]
tags = ["hugo","aws","cdk","codepipelin", "webhook filter"]
categories = ["cdk"]
externalLink = ""
series = ["cdk"]
+++

# How to start an AWS CodePipeline using webhook filters with CDK

Did you ever, like me, want to start your AWS CodePipeline based on some git webhook filter? For me, I wanted to only start the pipeline if any file from a certain path in the repository had been updated. You could also use such functionality to avoid running a release pipeline if only documentation was updated, for example.

However, even though I found this functionality in the [CodeBuild](https://docs.aws.amazon.com/cdk/api/latest/docs/aws-codebuild-readme.html#githubsource-and-githubenterprisesource) module, I couldn't find out how to do this with CodePipeline, so I opened [an issue](https://github.com/aws/aws-cdk/issues/10265) on the AWS CDK repository to request this feature. But it turns out that this is a limit in CloudFormation, not CDK, and simply not possible right now!

Anyway, I came up with a quick workaround: create a CodeBuild project with the required webhook, and then use that project to start the pipeline. I wrote a construct in our infra repo to do this, and I recently decided to write a better, open-source, version of it.

You can find the source code [on github](https://github.com/fongie/webhook-filtered-pipeline) and you can find the package at [npm](https://www.npmjs.com/package/webhook-filtered-pipeline). Of course, contributions are welcome! Open an issue if there's a problem, or submit a PR directly.

You can use it like this:

```typescript
import { FilterGroup, EventAction, Project, BuildSpec } from '@aws-cdk/aws-codebuild';
import { Artifact } from '@aws-cdk/aws-codepipeline';
import { CodeBuildAction } from '@aws-cdk/aws-codepipeline-actions';
import { App, Construct, SecretValue, Stack, StackProps } from '@aws-cdk/core';
import { WebhookFilteredPipeline } from 'webhook-filtered-pipeline';

export class MyStack extends Stack {
  constructor(scope: Construct, id: string, props: StackProps = {}) {
    super(scope, id, props);

    const sourceOutput = new Artifact();
    const pipe = new WebhookFilteredPipeline(this, 'pipe', {
      githubSourceActionProps: {
        owner: 'fongie',
        repo: 'my-repo',
        output: sourceOutput,
        oauthToken: SecretValue.plainText('mytoken'),
        actionName: 'github',
      },
      webhookFilters: [
        FilterGroup.inEventOf(EventAction.PUSH).andBranchIs('mybranch').andFilePathIsNot('*.md'),
      ],
    });

    pipe.addStage({
      stageName: 'stage2',
      actions: [new CodeBuildAction({
        input: sourceOutput,
        actionName: 'build',
        project: new Project(this, 'proj', { buildSpec: BuildSpec.fromObject({}) }),
      })],
    });

    // ... add more stages
  }
}
```

Basically, you can use it as a normal pipeline, but it will only start according to the filters.

Now let's hope that the CloudFormation and CDK teams implement this functionality natively in CodePipeline so this is not needed, but until then, this works :)



