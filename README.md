# @realldz/oneuni-api

Internal TypeScript client for OneUni student portals. Not published to any registry;
install it directly from this repository.

## Install

Private repository: clone it, then install the packed tarball.

```bash
git clone https://github.com/realldz/oneuni-api.git
cd oneuni-api
bun install
bun run build     # dist/ is committed; rebuild after source changes
bun pm pack       # realldz-oneuni-api-<version>.tgz
```

In the consuming project:

```bash
bun add file:../oneuni-api/realldz-oneuni-api-<version>.tgz
```

Node.js projects can also use `npm install git+https://github.com/realldz/oneuni-api.git`
with git credentials configured. `dist/` is committed, so Node.js consumers need no build step;
Bun resolves `src/index.ts` directly through the `bun` export condition.

## Usage

```ts
import { OneUniClient } from '@realldz/oneuni-api';

const client = new OneUniClient({
  baseUrl: 'https://example.edu.vn',
  schoolCode: 'CODE',
  clientSecret: process.env.CLIENT_SECRET,
});

const auth = await client.login('student-id', 'password');
const grades = auth ? await client.getGrades(auth.token) : null;
```

Options: `baseUrl`, `schoolCode`, `clientSecret`, `clientId`, `refreshClientId`,
`authBaseUrl`, `allowInsecureTls`, `timeoutMs`, `logger`, `errorMessage`.

Environment fallbacks: `SCHOOL_API_BASEURL`, `SCHOOL_CODE`, `CLIENT_SECRET`,
`ALLOW_INSECURE_TLS`, `ONEUNI_*` variants.

## Development

```bash
bun install
bun run typecheck
bun test
bun run build
```

## License

MIT
