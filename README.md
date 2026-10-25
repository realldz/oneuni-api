# @realldz/oneuni-api

Internal TypeScript client for OneUni student portals. Not published to any registry;
install it directly from this repository.

## Install

Private repository: clone it, then install the packed tarball.

```bash
git clone https://github.com/realldz/oneuni-api.git
cd oneuni-api
bun pm pack       # dist/ is committed, so no build is required
```

In the consuming project:

```bash
bun add file:../oneuni-api/realldz-oneuni-api-<version>.tgz
```

Run `bun install && bun run build` in this repository only when you change the source (then commit
`dist/`). Node.js projects can also use
`npm install git+https://github.com/realldz/oneuni-api.git` with git credentials configured.

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
