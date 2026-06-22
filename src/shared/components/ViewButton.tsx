import React from 'react';
import { Link } from 'react-router-dom';
import { Eye } from '@phosphor-icons/react';
import { Button } from './Button';

type ViewButtonProps = {
  to: string;
  label?: string;
};

export const ViewButton: React.FC<ViewButtonProps> = ({ to, label = 'Abrir' }) => (
  <Link to={to}>
    <Button variant="outline" size="sm">
      <Eye className="mr-1 h-4 w-4" />
      {label}
    </Button>
  </Link>
);
