import * as rp from "request-promise";
import { SSM } from "aws-sdk";

const SLACK_CHANNEL = "#hoge-channel";
const SLACK_TOKEN_SSM_PARAM_NAME = "hoge/slack_token";

function appIdToServiceName(appId: string): string {
  switch (appId) {
    case process.env.SERVICE1:
      return "[SERVICE1]";
    case process.env.SERVICE2:
      return "[SERVICE2]";
    default:
      return "";
  }
}

export async function handler(event: any) {
  const ssm = new SSM();
  var response = await ssm
    .getParameter({
      Name: SLACK_TOKEN_SSM_PARAM_NAME,
      WithDecryption: true,
    })
    .promise();
  let slackToken: string = "Unkown";
  if (response.Parameter != null && response.Parameter.Value != null) {
    slackToken = response.Parameter.Value;
  }

  for (const record of event.Records) {
    if (!record.Sns || !record.Sns.Message) {
      return;
    }

    const snsMessage = JSON.parse(record.Sns.Message);
    if (!snsMessage) {
      return;
    }

    const message = `${appIdToServiceName(snsMessage.appId)} ${
      snsMessage.branch
    } : ${snsMessage.status}`;
    const options = {
      uri: "https://slack.com/api/chat.postMessage",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${slackToken}`,
      },
      method: "POST",
      json: true,
      body: {
        channel: SLACK_CHANNEL,
        icon_url:
          "https://cdn-ssl-devio-img.classmethod.jp/wp-content/uploads/2018/06/amplify-320x320.jpeg",
        username: "amplify build notifier",
        text: message,
      },
    };

    try {
      const response = await rp.post(options);
      console.log(response);
    } catch (err) {
      console.error(`ERROR: ${err.message}`);
      return;
    }
  }
}
