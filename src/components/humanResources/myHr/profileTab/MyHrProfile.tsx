interface AuthUser {
  user: {
    id: string;
    name: string;
    email: string;
    is_admin: boolean;
    email_verified_at?: any;
    organization_roles?: Array<{ name: string }>;
  };
  permissions?: string[];
  [key: string]: any;
}
interface MyHrProfileProps {
  isLoading?: boolean;
}

const MyHrProfile = ({ isLoading = false }) => {
  //   useEffect(() => {
  //     console.log('profile: ', profile);
  //   }, [profile]);

  if (isLoading) {
    return <div>Loading profile...</div>;
  }

  return <div>MyHrProfile</div>;
};

export default MyHrProfile;
