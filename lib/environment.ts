export enum Environments {
  DEV = "dev",
  DEMO = "demo",
  STAGING = "staging",
  PRODUCTION = "production",
}

export interface EnvironmentVariables {
  appIds: { [key: string]: any };
  lambdaEnvironmentVariables: { [key: string]: any };
}

// appIdsに対象のamplifyのsubdomain名を追加
// lambdaEnvironmentVariablesにsubdomainに対するサービス名を追加
const EnvironmentVariablesSetting: { [key: string]: EnvironmentVariables } = {
  [Environments.DEV]: {
    appIds: ["hoge1", "hoge2"],
    lambdaEnvironmentVariables: {
      SERVICE1: "hoge1",
      SERVICE2: "hoge2",
    },
  },
};

export function variablesOf(env: Environments): EnvironmentVariables {
  return EnvironmentVariablesSetting[env];
}
