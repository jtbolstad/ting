import { spawnSync } from 'child_process';

export async function setup() {
  for (const db of ['test-auth.db', 'test-items.db']) {
    const result = spawnSync(
      'pnpm',
      ['exec', 'prisma', 'db', 'push', '--accept-data-loss'],
      {
        env: { ...process.env, DATABASE_URL: `file:./${db}` },
        stdio: 'pipe',
        shell: true,
      }
    );
    if (result.status !== 0) {
      throw new Error(
        `Failed to push schema to ${db}:\n${result.stderr?.toString()}`
      );
    }
  }
}
