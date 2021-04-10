#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { DevBlog } from '../lib/devblog';
import { Dns } from '../lib/dns';

const env = {
    account: '299737276853',
    region: 'eu-west-1'
}
const app = new cdk.App();

const dns = new Dns(app, 'dns', { env });
new DevBlog(app, 'dev-blog', { env, dns:  dns.se_maxk });

