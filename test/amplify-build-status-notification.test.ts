import { expect as expectCDK, matchTemplate, MatchStyle } from '@aws-cdk/assert';
import * as cdk from '@aws-cdk/core';
import * as AmplifyBuildStatusNotification from '../lib/amplify-build-status-notification-stack';
import * as environment from '../lib/environment';

test('Empty Stack', () => {
    const app = new cdk.App();
    // WHEN
    const target: environment.Environments = 'test' as environment.Environments;
    const stack = new AmplifyBuildStatusNotification.AmplifyBuildStatusNotificationStack(app, 'MyTestStack', target);
    // THEN
    expectCDK(stack).to(matchTemplate({
      "Resources": {}
    }, MatchStyle.EXACT))
});
