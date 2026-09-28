import { createContext } from 'react';
import { t_table } from './types';

export interface TableContextType {
  table?: t_table<any>;
  filters?: Record<string, any>;
}

export const TableContext = createContext<TableContextType>({
  table: undefined,
  filters: undefined,
});
