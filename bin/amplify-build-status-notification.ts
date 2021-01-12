#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { AmplifyBuildStatusNotificationStack } from '../lib/amplify-build-status-notification-stack';
import * as environment from '../lib/environment';

const app = new cdk.App();

const target: environment.Environments = app.node.tryGetContext('target') as environment.Environments;

if (!target || !environment.variablesOf(target)) throw new Error('Invalid target environment');

new AmplifyBuildStatusNotificationStack(app, `hoge-${target}`, target);
