import { PropsWithChildren } from 'react';
import { t_table } from './types';
import { TableContext } from './Context';
import PaginationWithIcon from "./PaginationWithIcon";

interface IProps<T> {
    table: t_table<T>;
}

const TableFC = <T,>({ children, table }: PropsWithChildren<IProps<T>>) => {
    return (
        <TableContext.Provider value={{ table: table }}>
            <div className="relative overflow-x-auto sm:rounded-lg">
                <table className="w-full table-auto text-sm text-left text-gray-500 dark:text-gray-400">
                    {children}
                </table>
                {/* <nav id='vd-pagination' aria-label="Table pagination">
                    <PaginationWithIcon />
                </nav> */}
            </div>
        </TableContext.Provider>
    );
};

export default TableFC;
