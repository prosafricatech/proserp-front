import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import humanResourcesServices from '../../humanResourcesServices';

const MyHrImprestAccounts = () => {
  const { data } = useQuery({
    queryKey: ['showMyHrImprestAccounts'],
    queryFn: async () => await humanResourcesServices.myHrImprestAccounts(),
  });

  useEffect(() => {
    console.log('data: ', data);
  }, [data]);

  return <div>MyHrImprestAccounts</div>;
};

export default MyHrImprestAccounts;
