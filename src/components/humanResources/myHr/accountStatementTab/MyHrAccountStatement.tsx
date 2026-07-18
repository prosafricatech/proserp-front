import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import humanResourcesServices from '../../humanResourcesServices';

const MyHrAccountStatement = () => {
  const { data } = useQuery({
    queryKey: ['showMyHrAccountStatement'],
    queryFn: async () => await humanResourcesServices.myHrAccountStatement(),
  });

  useEffect(() => {
    console.log('data: ', data);
  }, [data]);

  return <div>MyHrAccountStatement</div>;
};

export default MyHrAccountStatement;
