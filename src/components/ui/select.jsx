import React, { useState } from 'react';

const SelectContext = React.createContext();

const Select = ({ children, onValueChange, defaultValue }) => {
  const [value, setValue] = useState(defaultValue || '');
  const [open, setOpen] = useState(false);

  const handleValueChange = (newValue) => {
    setValue(newValue);
    onValueChange(newValue);
    setOpen(false);
  };

  return (
    <SelectContext.Provider value={{ value, open, setOpen, handleValueChange }}>
      <div className="relative">
        {children}
      </div>
    </SelectContext.Provider>
  );
};

const SelectTrigger = ({ children, className = '', ...props }) => {
  const { open, setOpen } = React.useContext(SelectContext);
  return (
    <button
      type="button"
      onClick={() => setOpen(!open)}
      className={`flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      {...props}
    >
      {children}
      <svg className="h-4 w-4 opacity-50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M7 9l5 5 5-5" />
      </svg>
    </button>
  );
};

const SelectValue = ({ placeholder }) => {
  const { value } = React.useContext(SelectContext);
  return <span>{value || placeholder}</span>;
};

const SelectContent = ({ children }) => {
  const { open } = React.useContext(SelectContext);
  if (!open) return null;
  return (
    <div className="absolute top-full z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md">
      {children}
    </div>
  );
};

const SelectItem = ({ children, value }) => {
  const { handleValueChange } = React.useContext(SelectContext);
  return (
    <div
      className="relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
      onClick={() => handleValueChange(value)}
    >
      {children}
    </div>
  );
};

export { Select, SelectContent, SelectItem, SelectTrigger, SelectValue };
