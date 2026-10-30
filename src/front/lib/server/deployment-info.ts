import "server-only";

export type DeploymentInfo = {
  branch: string;
  revision: string;
};

export function getDeploymentInfo(environment: NodeJS.ProcessEnv = process.env): DeploymentInfo {
  return {
    branch: normalized(environment.JLPT_GIT_BRANCH),
    revision: normalized(environment.JLPT_GIT_REVISION),
  };
}

function normalized(value: string | undefined) {
  const result = value?.trim();
  return result ? result.slice(0, 160) : "unknown";
}
