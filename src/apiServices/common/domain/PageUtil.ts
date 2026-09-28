import { PageRequest } from './PageRequest';

export type PageArguments = {
  page?: number;
  size?: number;
  sorts?: Array<Array<string>>;
};

export const createApiPageRequest = (pageRequestArgs: PageArguments | Record<string, any>) => {
  const { page, size, sorts, ...filter } = pageRequestArgs;
  const pageRequest = new PageRequest();
  pageRequest.page = page;
  pageRequest.pageSize = size;
  pageRequest.sorts = sorts;
  pageRequest.filter = filter;
  return pageRequest;
};
