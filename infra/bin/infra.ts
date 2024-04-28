#!/usr/bin/env node
import 'source-map-support/register';
import { DevBlog } from '../lib/devblog';
import { Dns } from '../lib/dns';
import { App } from 'aws-cdk-lib';

const env = {
    account: '299737276853',
    region: 'eu-west-1'
}
const app = new App();

const dns = new Dns(app, 'dns', { env });
new DevBlog(app, 'dev-blog', { env, dns });

