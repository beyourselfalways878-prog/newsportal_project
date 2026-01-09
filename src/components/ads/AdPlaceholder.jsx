import React from 'react';
import { Megaphone } from 'lucide-react';

const AdPlaceholder = ({ type }) => {
  let text, dimensions;
  let heightClass = 'h-24';

  switch (type) {
    case 'header':
      text = 'Header Banner Ad';
      dimensions = '728x90';
      heightClass = 'h-[90px]';
      break;
    case 'inContent':
      text = 'In-Content Ad';
      dimensions = 'Responsive';
      heightClass = 'h-[250px]';
      break;
    case 'inContentLarge':
      text = 'Large In-Content Ad';
      dimensions = 'Responsive (e.g. 580x400)';
      heightClass = 'h-[200px] md:h-[300px]';
      break;
    case 'sidebarLarge':
      text = 'Sidebar Ad';
      dimensions = '300x250';
      heightClass = 'h-[250px]';
      break;
    case 'sidebarSmall':
      text = 'Tall Sidebar Ad';
      dimensions = '300x600';
      heightClass = 'h-[250px] md:h-[400px]';
      break;
    default:
      text = 'Advertisement';
      dimensions = 'Responsive';
      heightClass = 'h-32';
  }

  return (
    <div className={`ad-placeholder rounded-lg p-4 my-6 flex flex-col items-center justify-center border-2 border-border/50 ${heightClass} bg-muted/20 hover:bg-muted/30 transition-colors`}>
      <Megaphone className="h-8 w-8 text-muted-foreground mb-2" />
      <span className="text-sm font-medium text-muted-foreground text-center">{text}</span>
      <span className="text-xs text-muted-foreground/70 text-center mt-0.5">{dimensions}</span>
    </div>
  );
};

export default AdPlaceholder;
