import { ApiRestService } from "../../common/ApiRestService";
import { PageRequest } from "../../common/domain/PageRequest";

export class DocketService extends ApiRestService {

  async findPage(pageRequest: PageRequest = new PageRequest()) {
    const pageReq: PageRequest = pageRequest;
    if (pageRequest.sorts && pageRequest.sorts.length > 0) {
      const sort = pageRequest.sorts[0];
      const sortField = sort[0];
      const sortDirection = sort.length > 1 ? sort[1].toUpperCase() : "ASC";
      if (!pageReq.filter) pageReq.filter = {};
      pageReq.filter.sortBy = `${sortField}_${sortDirection}`;
    }
    return this.getPage({
      apiName: "docket-page",
      baseURL: "http://localhost:8070/api",
      path: `/docket`,
      pageRequest: pageReq,
      headers: this.toHeaders(),
    });
  }

  async updateBookmark(docketId: number, bookmark: boolean) {
    return this.put({
      apiName: "docket-bookmark",
      baseURL: "http://localhost:8070/api",
      path: `/docket/${docketId}/bookmark`,
      body: { bookmark },
      headers: this.toHeaders(),
    });
  }
}
