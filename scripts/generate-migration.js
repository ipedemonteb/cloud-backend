const { spawnSync } = require('child_process');

const name = process.argv[2];
if (!name) {
  console.error('Usage: npm run migrations:generate <MigrationName>');
  process.exit(1);
}

const result = spawnSync(
  'npm',
  ['run', 'typeorm', '--', 'migration:generate', `src/migrations/${name}`],
  { stdio: 'inherit', shell: true },
);

process.exit(result.status ?? 1);
