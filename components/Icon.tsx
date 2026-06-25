
import React from 'react';

interface IconProps {
  svg: string;
  className?: string;
}

const Icon: React.FC<IconProps> = ({ svg, className = 'w-5 h-5' }) => {
  return <span className={className} dangerouslySetInnerHTML={{ __html: svg }} />;
};

export default Icon;
