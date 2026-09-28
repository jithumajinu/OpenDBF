import { ApiRestService } from "../../common/ApiRestService";
import { PageRequest } from "../../common/domain/PageRequest";
import AuthStorage from "../../../context/AuthStorage";

export class DashBoardService extends ApiRestService {
  toHeaders() {
    let headers: Record<string, any> = {};
    headers["Authorization"] = AuthStorage.getAuthorization();
    return headers;
  }

  async getDashBoard(obj: any) {
    return this.post({
      apiName: "sms-page-create",
      baseURL: "http://localhost:8070/api",
      path: `/dashboard/count`,
      body: obj,
      headers: this.toHeaders(),
    });
  }

  async findSmsPage(pageRequest: PageRequest = new PageRequest()) {
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
      pageReq.filter.sortItem = `${sortField}_${sortDirection}`;
    }
    return this.getPage({
      apiName: "dashboard-sms-page",
      baseURL: "http://localhost:8070/api",
      path: `/templates/sms/date-selected`,
      pageRequest: pageReq,
      // classRef: Contact,
      headers: this.toHeaders(),
    });
  }
  async findEmailPage(pageRequest: PageRequest = new PageRequest()) {
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
      pageReq.filter.sortItem = `${sortField}_${sortDirection}`;
    }

    //console.log("%c pageReq:", "color:yellow", pageReq);
    return this.getPage({
      apiName: "dashboard-sms-page",
      baseURL: "http://localhost:8070/api",
      path: `/templates/email/date-selected`,
      pageRequest: pageReq,
      // classRef: Contact,
      headers: this.toHeaders(),
    });
  }

  async getSmsInfoByCustomerById(id: number) {
    return this.getPage({
      apiName: "contact-page",
      baseURL: "http://localhost:8070/api",
      path: `/sms/info/${id}`,
      headers: this.toHeaders(),
    });
  }
}
