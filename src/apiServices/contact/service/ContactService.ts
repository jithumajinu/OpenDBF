import { ApiRestService } from "../../common/ApiRestService";
import { PageRequest } from "../../common/domain/PageRequest";


export class ContactService extends ApiRestService {

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
    // http://localhost:8080/customer_paged.json
    return this.getPage({
      apiName: "contact-page",
      baseURL: "http://localhost:8070/api",
      path: `/contact`,
      pageRequest: pageReq,
      // classRef: Contact,
      //headers: {},
      headers: this.toHeaders(),  // TODO important enable this when backend is ready to accept auth headers, currently using mock data so no need for auth headers
    });
    // return this.getPage({
    //   apiName: "contact-page",
    //   baseURL: "http://localhost:8070/api",
    //   path: `/contact`,
    //   pageRequest: pageReq,
    //   // classRef: Contact,
    //   headers: this.toHeaders(),
    // });
  }

  async createCustomer(obj: any) {
    return this.post({
      apiName: "contact-page",
      baseURL: "http://localhost:8070/api",
      path: `/contact`,
      body: obj,
      // classRef: Contact,
      headers: this.toHeaders(),
    });
  }

  async getCustomerById(id: number) {
    return this.getPage({
      apiName: "contact-page",
      baseURL: "http://localhost:8070/api",
      path: `/contact/${id}`,
      headers: this.toHeaders(),
    });
  }

  async getAllGroups() {
    return this.getPage({
      apiName: "contact-page",
      baseURL: "http://localhost:8070/api",
      path: `/group/all`,
      headers: this.toHeaders(),
    });
  }

  async getAllCustomers() {
    return this.getPage({
      apiName: "contact-page",
      baseURL: "http://localhost:8070/api",
      path: `/contact/all`,
      headers: this.toHeaders(),
    });
  }

  async updateCustomer(obj: any) {
    const _body = obj;
    console.log("Updating customer with data:", _body);
    return this.put({
      apiName: "contact-page",
      baseURL: "http://localhost:8070/api",
      path: `/contact/${_body?.id}`,
      body: _body,
      // classRef: Contact,
      headers: this.toHeaders(),
    });
  }

  // async emailFileUpload(file: File, onUploadProgress: any) {
  //   return this.fileUpload({
  //     apiName: "fileupload",
  //     baseURL: "http://localhost:8070/api",
  //     path: `/upload`,
  //     file: file,
  //     headers: this.toHeaders(),
  //   });
  // }

  async deleteByIds(selectedIds: any) {
    const _body = {
      ids: selectedIds,
    };
    return this.post({
      apiName: "sms-page-update",
      baseURL: "http://localhost:8070/api",
      path: `/customer/delete-selected`,
      body: _body,
      headers: this.toHeaders(),
    });
  }

  async exportCustomer() {
    return this.get({
      apiName: "exportCustomer",
      baseURL: "http://localhost:8070/api",
      path: `/export/customer`,
      headers: this.toHeaders(),
    });
  }
}
