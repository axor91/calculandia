export type HealthStatus =
  | { status: "ok"; version: string; httpStatus: 200 }
  | { status: "unhealthy"; version: null; httpStatus: 503 };

export const buildIdPattern = /^[0-9a-f]{40}(?:-dirty)?$/;

export function getHealthStatus(buildId: string | null): HealthStatus {
  const normalizedBuildId = buildId?.trim() || null;

  if (!normalizedBuildId || !buildIdPattern.test(normalizedBuildId)) {
    return { status: "unhealthy", version: null, httpStatus: 503 };
  }

  return {
    status: "ok",
    version: normalizedBuildId,
    httpStatus: 200,
  };
}
