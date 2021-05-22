+++ 
draft = true
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

Did you ever, like me, want to start your AWS CodePipeline based on some git webhook filter? For me, I wanted to only start the pipeline if any file from a certain path in the repository had been updated. You could also use such functionality to avoid running a release pipeline if only documentation was updated for example.

However, even though I found this functionality in the [CodeBuild]() module, I couldn't find out how to do this with CodePipeline, so I opened [an issue](https://github.com/aws/aws-cdk/issues/10265) on the AWS CDK repository to request this feature. But it turns out that this is a limit in CloudFormation, not CDK, and simply not possible right now!

Anyway, I came up with a quick workaround: put a CodeBuild project with the required webhook, and then use that project to start the pipeline. I created a construct in our infra repo to do this. It looks something like this:




