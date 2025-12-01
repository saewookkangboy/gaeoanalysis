import 'next-auth';

declare module 'next-auth' {
  interface User {
    id: string;
    email: string;
    provider?: string;
  }

  interface Session {
    user: {
      id: string;
      email: string;
      provider?: string;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string;
    provider?: string;
  }
}

