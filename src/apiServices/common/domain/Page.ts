import { PageRequest, PagingSize } from './PageRequest';

/**
 * Page Content Holder. To follow the Spring PageImpl structure.
 * Ref: https://docs.spring.io/spring-data/commons/docs/current/api/org/springframework/data/domain/PageImpl.html
 */
export class Page<T> {
  /**
   * Returns the page content as Array.
   */
  content: Array<T> = [];
  /**
   * Returns the total amount of elements to calculate the number of total pages.
   */
  totalElements: number = 0;
  /**
   * Returns the size of the page in the Page Request.
   */
  size: number = 0;
  /**
   * Returns the current page in the Page Request.
   */
  page: number = 0;
  /**
   * Returns the enum size of the page in the Page Request.
   */
  pagingSize: PagingSize | undefined = undefined;

  hasContent(): boolean {
    return Array.isArray(this.content) && this.content.length > 0;
  }

  get numberOfElements(): number {
    return this.hasContent() ? this.content.length : 0;
  }

  get totalPages(): number {
    if (this.size > 0 && this.totalElements > 0) {
      return Math.ceil(this.totalElements / this.size);
    }
    return 0;
  }

  /**
   * Returns the Page Request that has been used to request the current Slice.
   */
  pageRequest: PageRequest | undefined = undefined;
}
