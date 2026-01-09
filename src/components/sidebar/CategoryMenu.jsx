import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { LayoutGrid } from 'lucide-react';

const CategoryMenu = ({ categories, selectedCategory, onSelectCategory, title }) => {
  return (
    <div className="bg-card rounded-xl shadow-lg p-6 border border-border/50">
      <h3 className="text-xl font-bold mb-5 flex items-center text-foreground">
        <LayoutGrid className="h-6 w-6 mr-2 text-primary" />
        {title}
      </h3>
      <div className="flex flex-col space-y-1.5">
        {categories.map(([key, label], index) => (
          <motion.div
            key={key}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Button
              variant={selectedCategory === key ? "secondary" : "ghost"}
              onClick={() => onSelectCategory(key)}
              className={`w-full justify-start px-4 py-2.5 text-base rounded-lg transition-all duration-200 ${selectedCategory === key ? 'text-primary font-semibold' : 'text-muted-foreground hover:text-foreground'}`}
            >
              {label}
            </Button>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default CategoryMenu;
