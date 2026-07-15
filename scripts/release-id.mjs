export function assertCleanReleaseId(buildId, expectedSha) {
  if (!/^[0-9a-f]{40}$/.test(buildId)) {
    throw new Error(
      "Production BUILD_ID must be an exact 40-character Git SHA",
    );
  }
  if (buildId !== expectedSha) {
    throw new Error("Production BUILD_ID does not match the expected Git SHA");
  }
}
