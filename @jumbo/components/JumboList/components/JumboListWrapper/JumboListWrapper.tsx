import React from 'react';
import { Div } from '@jumbo/shared';
import { JumboListWrapperProps } from '@jumbo/types/JumboListWrapperProps';

const JumboListWrapper: React.FC<JumboListWrapperProps> = ({ 
  component, 
  children, 
  sx 
}) => {
  const WrapperComponent = component ?? Div;
  
  return (
    <WrapperComponent sx={{ position: "relative", ...sx }}>
      {children}
    </WrapperComponent>
  );
};

export default JumboListWrapper;