// @types/passport augments Express.Request with `user?: Express.User`, where
// Express.User is an empty interface by default. That empty shape is not
// assignable to the `{ id, email, role }` this codebase's AuthRequest declares,
// so every `router.get(..., authenticate, handler)` stopped type-checking once
// passport was installed. Declaring Express.User with the JWT payload shape
// makes the two agree.
declare global {
  namespace Express {
    interface User {
      id: string;
      email: string;
      role: string;
    }
  }
}

export {};
