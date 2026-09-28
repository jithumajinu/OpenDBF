import { ApiRestService } from "../../common/ApiRestService";
import { PageRequest } from "../../common/domain/PageRequest";
import AuthStorage from "../../../context/AuthStorage";

export class UserService extends ApiRestService {
  toHeaders() {
    let headers: Record<string, any> = {};
    headers["Authorization"] = AuthStorage.getAuthorization();
    return headers;
  }

  async findPage(pageRequest: PageRequest = new PageRequest()) {
    const pageReq: PageRequest = pageRequest;
    if (pageRequest.sorts && pageRequest.sorts.length > 0) {
      const sort = pageRequest.sorts[0];
      const sortField = sort[0];
      let sortDirection = "ASC";
      if (sort.length > 1) {
        // console.log('%c testxxxxxx:', 'color:yellow' )
        sortDirection = sort[1].toUpperCase();
      }
      if (!pageReq.filter) pageReq.filter = {};
      pageReq.filter.sortBy = `${sortField}_${sortDirection}`;
    }
    return this.getPage({
      apiName: "contact-page",
      baseURL: "http://localhost:8070/api",
      path: `/customer`,
      pageRequest: pageReq,
      // classRef: Contact,
      headers: this.toHeaders(),
    });
  }

  async createCustomer(obj: any) {
    return this.post({
      apiName: "contact-page",
      baseURL: "http://localhost:8070/api",
      path: `/customer`,
      body: obj,
      // classRef: Contact,
      headers: this.toHeaders(),
    });
  }

  async getCustomerById(id: number) {
    return this.getPage({
      apiName: "contact-page",
      baseURL: "http://localhost:8070/api",
      path: `/customer/${id}`,
      headers: this.toHeaders(),
    });
  }


}
