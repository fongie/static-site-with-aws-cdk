+++ 
draft = true
date = 2021-03-06T19:29:58+01:00
title = "Building a static blog with Hugo and deploying it using AWS CDK"
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

We will build a static website - a blog - using the website generator [Hugo](https://gohugo.io/). Then, we will deploy this to [AWS]() by using the infrastructure-as-code tool [CDK](). We will end up with one git repository which contains both the source code for the website as well as the source code for the infrastructure.

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

This will create a new file in `content/contact.md`. The contents of that file will be shown when you click on "Contact me" in the navbar. Do the same for the other urls if you wish, or remove some, or create your own.

If you haven't already, you should reload your site at `http://localhost:1313/` and see how it's going.

Once you are satisfied enough, you can build the static site by running

```shell
hugo
```

Your static site is now built in `public/` ready to be deployed to some hosting. Take a break - you've earned it - and let's proceed to deployment next.


