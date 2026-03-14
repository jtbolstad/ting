:\Users\jt\workspace\projects\ting\packages\server [main +13 ~0 -0 !]> pnpm run db:seed

> @ting/server@1.0.0 db:seed C:\Users\jt\workspace\projects\ting\packages\server
> tsx prisma/seed.ts

node:internal/modules/cjs/loader:1410
  const err = new Error(message);
              ^

Error: Cannot find module 'C:\Users\jt\workspace\projects\ting\node_modules\.pnpm\bcrypt@5.1.1\node_modules\bcrypt\lib\binding\napi-v3\bcrypt_lib.node'
Require stack:
- C:\Users\jt\workspace\projects\ting\node_modules\.pnpm\bcrypt@5.1.1\node_modules\bcrypt\bcrypt.js
- C:\Users\jt\workspace\projects\ting\packages\server\prisma\seed.ts
    at node:internal/modules/cjs/loader:1410:15
    at nextResolveSimple (C:\Users\jt\workspace\projects\ting\node_modules\.pnpm\tsx@4.21.0\node_modules\tsx\dist\register-D46fvsV_.cjs:4:1004)
    at C:\Users\jt\workspace\projects\ting\node_modules\.pnpm\tsx@4.21.0\node_modules\tsx\dist\register-D46fvsV_.cjs:3:2630
    at C:\Users\jt\workspace\projects\ting\node_modules\.pnpm\tsx@4.21.0\node_modules\tsx\dist\register-D46fvsV_.cjs:3:1542
    at resolveTsPaths (C:\Users\jt\workspace\projects\ting\node_modules\.pnpm\tsx@4.21.0\node_modules\tsx\dist\register-D46fvsV_.cjs:4:760)
    at C:\Users\jt\workspace\projects\ting\node_modules\.pnpm\tsx@4.21.0\node_modules\tsx\dist\register-D46fvsV_.cjs:4:1102
    at m._resolveFilename (file:///C:/Users/jt/workspace/projects/ting/node_modules/.pnpm/tsx@4.21.0/node_modules/tsx/dist/register-B7jrtLTO.mjs:1:789)
    at defaultResolveImpl (node:internal/modules/cjs/loader:1061:19)
    at resolveForCJSWithHooks (node:internal/modules/cjs/loader:1066:22)
    at Function._load (node:internal/modules/cjs/loader:1215:37) {
  code: 'MODULE_NOT_FOUND',
  requireStack: [
    'C:\\Users\\jt\\workspace\\projects\\ting\\node_modules\\.pnpm\\bcrypt@5.1.1\\node_modules\\bcrypt\\bcrypt.js',
    'C:\\Users\\jt\\workspace\\projects\\ting\\packages\\server\\prisma\\seed.ts'
  ]
}

Node.js v23.5.0
 ELIFECYCLE  Command failed with exit code 1.
