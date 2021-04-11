+++ 
draft = false
date = 2021-04-02T19:29:58+01:00
title = "Building a static blog with Hugo and deploying it with AWS CDK"
description = "How I created this blog! Or: quickly creating a static website and deploying it to AWS using CDK"
slug = "static-site-with-cdk"
authors = ["Max Körlinge"]
tags = ["hugo","aws","cdk","website"]
categories = ["cdk"]
externalLink = ""
series = ["cdk"]
+++

# Building a static blog with Hugo and deploying it using AWS CDK

Welcome! I thought it would be fitting for my first post on this blog to be about how I built it. My goal was to quickly set up a clean and simply blog with good support for syntax highlighting and easy post creation, as I would primarily use it for developer blogs. I also wanted to use AWS as my hosting. Let's get started.

## What we will build

We will build a static website - a blog - using the website generator [Hugo](https://gohugo.io/). Then, we will deploy this to [AWS](https://aws.amazon.com/) by using the infrastructure-as-code tool [CDK](https://aws.amazon.com/cdk/). We will end up with one git repository which contains both the source code for the website as well as the source code for the infrastructure.

## Building the website

First, install Hugo. I use Homebrew.

```shell
brew install hugo
```

Then, create the new site.

```shell
hugo new site my-site
cd my-site && git init
```

Choose a [theme](https://themes.gohugo.io/). For this blog, I chose [Hugo Coder](https://themes.gohugo.io/hugo-coder/). Themes may work differently if you choose a different one. In that case, you will need to read its documentation for details.

Install the theme to the site. Hugo suggests you add it as a git submodule, to easily be able to update it later.

```shell
git submodule add https://github.com/luizdepra/hugo-coder.git themes/hugo-coder
```

Configure your theme. For us using hugo-coder, I found that the easiest way was to copy the [config from their example site](https://github.com/luizdepra/hugo-coder/blob/master/exampleSite/config.toml) and replace my `config.toml` contents with it and then take it from there.

To see what you are building, Hugo supports hot reload. Go to `my-site` and run

```shell
hugo server -D # D means show drafts, which we probably want to do in development
```

then go to `http://localhost:1313/` in your browser. If you are using the hugo-coder theme, you should see it now. However, if you go to one of the links like `Projects` for example, you will end up with a `404 - page not found` error. This is because we haven't created the content yet.

To create a new blog post, simply run

```shell
hugo new posts/my-post.md
```

This creates a new page template in the `content/posts` directory. The header of the file contains metadata that will be used by your theme to for example write the titel of your post in the list of posts. Different themes do different things here. Note the `draft = true` option. This needs to be set to `false` before this post shows up on your site in production.

Write the start of your first post below the header using Markdown. Markdown is perfect for developers, as it is just like writing your GitHub documentation like READMEs, wikis, and so on (you do write a lot of documentation, don't you?). You will end up with something like this:

```markdown
+++
draft = true
date = 2021-03-06T19:29:58+01:00
title = "Building a static blog with Hugo and deploying it using AWS CDK"
description = "How I created this blog! Or: quickly creating a static website and deploying it to AWS using CDK"
slug = "static-site-with-cdk"
authors = ["Max Körlinge]
tags = ["hugo","aws","cdk","website"]
categories = ["cdk"]
externalLink = ""
series = ["cdk"]
+++

# Building a static blog with Hugo and deploying it using AWS CDK

Welcome! I thought it would be fitting for my first post on this blog to be about how I built it. My goal was to quickly set up a clean and simply blog with good support for syntax highlighting and easy post creation, as I would primarily use it for developer blogs. I also wanted to use AWS as my hosting Let's get started.
```

Looks familiar? Yeah, it is this post.

Next, you need to do something about the links that are not working like in our case Projects, About, etc. After some digging, I found that you need to create a file which corresponds to the `url` located in the `config.toml` file. For us using hugo-coder, if we look in the sample config we just copied from the example site, it has entries like this for the navbar pages:

```toml
[[languages.en.menu.main]]
name = "Projects"
weight = 3
url = "projects/"

[[languages.en.menu.main]]
name = "Contact me"
weight = 5
url = "contact/"
```

To make the contact page, then, you need to do this:

```shell
hugo new contact.md
```

This will create a new file in `content/contact.md`. The contents of that file will be shown when you click on "Contact me" in the navbar. Do the same for the other urls if you wish, or remove some, or create your own. Remember that you also need to set `draft = false` in those files to get them to show up in production later, or you will end up troubleshooting this for hours and feel silly afterwards (which I have definately __NOT__ done).

If you haven't already, you should reload your site at `http://localhost:1313/` and see how it's going.

Once you are satisfied enough, you can build the static site by running

```shell
hugo
```

Your static site is now built in `public/` ready to be deployed to some hosting. Take a break - you've earned it - and let's proceed to deployment next.

## Deploying to AWS using CDK

### AWS

I will not go too deeply into what AWS or CDK are here. You can read about that on their websites or in many other locations. Let's stay short and to the point in this post. AWS Free Tier gives you enough to complete this tutorial and hosting a static site for free. Note, however, that it is possible to incur costs by using AWS if you go above the limits of the free tier.

First, you need an AWS account if you don't have one already. Go to [AWS](https://aws.amazon.com/) and sign up. They require you to fill in quite a lot of details here including card information, which can seem scary, but as mentioned above it will be fine as long as you don't start any other resources. If you are nervous about it, you can go to "My Billing Dashboard", "Billing Preferences", and then check the "Receive Free Tier Usage Alerts" button (which is, sneakily, not checked by default) and you will receive an alert when you are close to having to pay.

While you're in the AWS console, you might as well go and create an access key to use later for CDK. Go to the service _IAM_. There should be a quick link to _My access key_. Create a new one and download it.

### Installing CDK

Now we need to install AWS CDK which is somewhat of a process when doing it from scratch. Rather than repeating all of it, I will direct you to [AWS CDK's Getting Started article](https://docs.aws.amazon.com/cdk/latest/guide/getting_started.html). You might want to skip the _Your background_ and _Key concepts_ part for now, installation instructions come after that. Use the access key you created in the previous step. Make sure to complete bootstrapping.

Now that you have the CDK client installed it is time for the fun part: setting up some infrastructure - with code!

### Deploying using CDK

Let's create a directory for our infrastructure and initialize the CDK app there. We will be using TypeScript which is the language that CDK itself is written in, but CDK supports multiple languages like Python, Java, and so on.

```shell
mkdir infra && cd infra
cdk init app --language typescript
```

This creates a bunch of files for you. We will keep it simple this time and remove files for writing tests. I know, I know, tests are good, but we will not get into it here. At some point I will write a blog post that includes CDK tests.

```shell
rm -rf test jest.* *.md
```

You can also go into `package.json` and remove all `jest` and `test` related entries. Or you can just leave it and not run `yarn test`.

Navigating your new `infra` folder, you will see some `.json` files. These are config files for CDK, TypeScript, and NPM. We probably won't have to touch these in this tutorial.

Next, you have a `bin` and a `lib` folder. The `bin` folder contains a file which serves as the executable when running `cdk` commands like `deploy`. If you check out contents of `cdk.josn`, in the `app` key, you will find the command which is run by CDK when you `cdk something` in this project. As you can see, it points to the file in the `bin` folder.

Open `bin/infra.ts`. It looks like this (as of my CDK version which is 1.91.0):

```typescript
#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { InfraStack } from '../lib/infra-stack';

const app = new cdk.App();
new InfraStack(app, 'InfraStack');
```

As you can see, it just creates a new CDK `App` (all CDK deployments have to haev an `App` as their root) and then creates a new `InfraStack` and passing the app as a parameter.

Passing the app as a parameter to new classes - _constructs_ in CDK language - is something you will see often, and it has to do with some CDK magic called `scope`. You can google some more information on it if you wish, but for now, it it sufficient to say that this means that `InfraStack` will be deployed within the app.

Now, open `lib/infra-stack.ts`. It looks like this:

```typescript
import * as cdk from '@aws-cdk/core';

export class InfraStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // The code that defines your stack goes here
  }
}
```

As you might guess, here is where you are supposed to input code which creates the infrastructure you want. This class extends `Stack`. CDK is built on [CloudFormation](https://aws.amazon.com/cloudformation/) and compiles into a CloudFormation template on deploy. A `Stack` in CloudFormatio - and CDK - terms is a unit of infrastructure deployed together. We will deploy all the resources we need in this tutorial in one stack.

It is not entirely clear to me why CDK has decided it is best practice to separate `App` creation to the `bin` folder and keep source code for the actual infrastructure in `lib`, but that is the default and we will stick to it here. You could just put everything into the same file though if you want, it is just TypeScript - not magic.

Next, let's just check that everything is working so far.

```shell
cdk synth # in /infra/
```

This command compiles your code into a CloudFormation template. You should see something like this output in your terminal:

```yaml
Resources:
  CDKMetadata:
    Type: AWS::CDK::Metadata
      Properties:
        Modules: aws-cdk=1.92.0,@aws-cdk/cloud-assembly-schema=1.92.0,@aws-cdk/core=1.92.0,@aws-cdk/cx-api=1.92.0,@aws-cdk/region-info=1.92.0,jsii-runtime=node.js/v12.19.0
          Metadata:
            aws:cdk:path: InfraStack/CDKMetadata/Default
              Condition: CDKMetadataAvailable
              Conditions:

# ... etc
```

If you get an error here, you need to fix it before proceeding.

Now, let's identify what AWS resources we need. We are trying to deploy a static website. For that, we are going to use a simple S3 bucket as our storage. Something like in [this tutorial on AWS](https://docs.aws.amazon.com/AmazonS3/latest/userguide/HostingWebsiteOnS3Setup.html).

Because we are going to use S3, we need to first install the S3 module from CDK. CDK doesn't ship a new project with all AWS services enabled - actually, none are. Generally, each time you wish to deploy an AWS service, you need to install the corresponding CDK module first.

```shell
yarn add @aws-cdk/aws-s3
```

Now let's _finally_ write some code to create a new S3 bucket. Edit `lib/infra-stack.ts` like this:

```typescript
import { Bucket } from '@aws-cdk/aws-s3';
import * as cdk from '@aws-cdk/core';

export class InfraStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    new Bucket(this, 'bucket');
  }
}
```

Easy! If you step into your `infra` folder and run `cdk synth` now you will see that the template contains some reference to an S3 bucket. If you deployed this, you would deploy a CloudFormation stack to your AWS account which contains one default S3 bucket.

Let's wait with deploying though until we have something more specific to our usecase - deploying a static website. From now on, the code examples will contain the constructor method only - add imports as needed.

The S3 bucket we just wrote will be private. We need to configure it for static website hosting.

CDK constructs are often configured with properties in the constructor. You can often google the module name to find the API doc, like [this one for s3](https://docs.aws.amazon.com/cdk/api/latest/docs/aws-s3-readme.html). Checking the source code can also be a good source for finding out how it works. Anyway, let's configure this bucket.

```typescript
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const bucket = new Bucket(this, 'bucket', {
      websiteIndexDocument: 'index.html',
      websiteErrorDocument: '404.html',
      publicReadAccess: true,
      autoDeleteObjects: true,
      removalPolicy: RemovalPolicy.DESTROY
    });
  }
```

Reading the CDK S3 documentation, it says that by setting `websiteIndexDocument` you will enable static website hosting for the bucket. This property also points to the index point of your website. Go back to your Hugo site, build it: `hugo`, and check the `public` folder for what your index is called. For us using hugo-coder, it will be `index.html`.

AWS also lets us define an error page. If your template outputs this, put that in there too.

Next, we need to grant `publicReadAccess` to make the website viewable by the public. Make sure you do not have any sensitive information in this S3 bucket as this makes _all_ objects in this bucket readable and downloadable by anyone.

I have also set some removal policies. By default, buckets and objects are retained even when you delete the stack. By experience, when I delete a stack, I want the bucket and the contents deleted as well. I am using git to store and version the source anyway. If you want, you can choose a different policy.

Lastly, I ran into some CORS difficulties when setting this up. If you do too (your browser won't display the site when it is deployed), you can allow CORS methods by changing your bucket configuration like this:

```typescript
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
```

Now you have a bucket correctly set up for website hosting. However, you need to upload your site to S3. There are several ways to do this. You could deploy the S3 bucket and then manually upload the site. You could upload it using AWS cli. You could build a continuous delivery pipeline using CDK which automatically builds and uploads the site. We, however, will use the simplest CDK-native way to do this, which is to use the construct called `BucketDeployment` from the `aws-s3-deployment` [module](https://docs.aws.amazon.com/cdk/api/latest/docs/aws-s3-deployment-readme.html). This module is experimental so there is some risk that the API will change, you can check out the documentation if something doesn't work as expected.

```shell
yarn add @aws-cdk/aws-s3-deployment
```

This construct is a higher-level construct which means it doesn't just map to a specific AWS service like `aws-s3`, but it combines a mix or services to create some complete functionality. In this case, this construct will bundle your static site as a zip and deploy it to S3 using some magic in between - you can see the details in the docs. Other higher-level constructs include things like deploying an container cluster with a load balancer in front using just a few lines. Anyway, the deployment construct is easy to set up.

```typescript
    new BucketDeployment(this, 'deploy', {
      sources: [Source.asset('../site/public')],
      destinationBucket: bucket,
      retainOnDelete: false
    });
```

We simply point the source to where our site is located, and tell the construct to which bucket to deploy it to.

Let's check out the result. Step into your `infra` folder:

```shell
cdk synth && cdk deploy
```

Next, log into your AWS console, find your S3 bucket, go to `Properties` and scroll to the bottom. You should see a _Bucket website endpoint_. Click that. If you see your site all deployed and ready, congrats! You made it!

The complete source code for this website including the infrastructure can be found on [GitHub](https://github.com/fongie/static-site-with-aws-cdk). As the repository will continue to be developed as this site develops, the state of the code may change as time goes by.
