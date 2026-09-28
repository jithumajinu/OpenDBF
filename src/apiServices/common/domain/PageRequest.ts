export type PagingSize = "SIZE_10" | "SIZE_30" | "SIZE_50" | "SIZE_100" | "SIZE_200";

/**
 * Page Request object.
 * Ref: https://docs.spring.io/spring-data/commons/docs/current/api/org/springframework/data/domain/PageRequest.html
 * The main difference is that the Page Number for this object starts from 1 (instead of 0)
 */
export class PageRequest {
  /**
   * Returns the page to be returned.
   */
  page: number = 0;
  /**
   * Returns the number of items to be returned.
   */
  pageSize: number = 0;

  sorts?: string[][];
  filter?: Record<string, any>;

  static of(page: number, pageSize: number) {
    let pageRequest = new PageRequest();
    pageRequest.page = page;
    pageRequest.pageSize = pageSize;
    return pageRequest;
  }

  /**
   * Returns the offset to be taken according to the underlying page and page size.
   */
  get offset(): number {
    if (this.page > 0 && this.pageSize > 0) {
      return (this.page - 1) * this.pageSize;
    }
    return 0;
  }

  get pagingSize(): PagingSize {
    if (this.pageSize) {
      if (this.pageSize <= 10) return "SIZE_10";
      if (this.pageSize <= 30) return "SIZE_30";
      if (this.pageSize <= 50) return "SIZE_50";
      if (this.pageSize <= 100) return "SIZE_100";
      if (this.pageSize <= 200) return "SIZE_200";
      return "SIZE_100";
    }
    return "SIZE_10";
  }

  toApiPageRequestArgs(qs?: Record<string, any>) {
    return {
      page: this.page,
      pagingSize: this.pagingSize,
      ...this.filter,
      ...qs,
    };
  }
}
