import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import axios from '@/lib/services/config';

const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        try {
          const axiosInstance = axios.create({
            withCredentials: true,
            headers: {
              'Content-Type': 'application/json',
              Accept: 'application/json',
            },
          });

          await axiosInstance.get('/sanctum/csrf-cookie');
          const { data } = await axiosInstance.post('/login', credentials, {
            validateStatus: (status) => status < 500,
          });

          if (!data?.authUser?.user?.id) {
            throw new Error('Invalid login credentials');
          }

          return {
            id: data.authUser.user.id,
            name: data.authUser.user.name,
            email: data.authUser.user.email,
            email_verified_at: data.authUser.user.email_verified_at,
            permissions: data?.authUser?.permissions || [],
            token: data.token,
            organization_id: data.authOrganization?.organization?.id,
            organization_name: data.authOrganization?.organization?.name,
          };
        } catch (error) {
          console.error('Login failed:', error.response?.data || error.message);
          return null;
        }
      },
    }),
  ],

callbacks: {
  async jwt({ token, user }) {
    if (user) {
      token.accessToken = user.token;
      token.organization_id = user.organization_id;
      token.organization_name = user.organization_name;
      token.permissions = user.permissions;

      token.id = user.id;
      token.name = user.name;
      token.email = user.email;
      token.email_verified_at = user.email_verified_at;
    }
    return token;
  },

  async session({ session, token }) {
    session.user = {
      id: token.id,
      name: token.name,
      email: token.email,
      email_verified_at: token.email_verified_at | null,
    };
    session.accessToken = token.accessToken;
    session.organization_id = token.organization_id;
    session.organization_name = token.organization_name;
    session.permissions = token.permissions;

    return session;
  },
},

  session: { strategy: 'jwt', maxAge: 24 * 60 * 60 },
  pages: { signIn: '/login' },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV !== 'production',
};

const handler = NextAuth(authOptions);

// Only export handlers, no other constants
export { handler as GET, handler as POST };
