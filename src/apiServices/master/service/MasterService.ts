import { ApiRestService } from "../../common/ApiRestService";
import { PageRequest } from "../../common/domain/PageRequest";


export class MasterService extends ApiRestService {

  async getMasterList(pageRequest: PageRequest = new PageRequest(), masterKey: string) {
    const pageReq: PageRequest = pageRequest;
    if (pageRequest.sorts && pageRequest.sorts.length > 0) {
      const sort = pageRequest.sorts[0];
      const sortField = sort[0];
      let sortDirection = "ASC";
      if (sort.length > 1) {
        sortDirection = sort[1].toUpperCase();
      }
      if (!pageReq.filter) pageReq.filter = {};
      pageReq.filter.sortBy = `${sortField}_${sortDirection}`;
    }
    return this.get({
      apiName: "master-page",
      baseURL: "http://localhost:8070/api",
      path: `/core/master/${masterKey}`,
      pageRequest: pageReq,
      headers: this.toHeaders(),  // TODO important enable this when backend is ready to accept auth headers, currently using mock data so no need for auth headers
    });
  }

  async findPage(pageRequest: PageRequest = new PageRequest(), masterKey: string) {
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
      apiName: "master-page",
      baseURL: "http://localhost:8070/api",
      path: `/core/master/${masterKey}`,
      pageRequest: pageReq,
      // classRef: Contact,
      //headers: {},
      headers: this.toHeaders(),  // TODO important enable this when backend is ready to accept auth headers, currently using mock data so no need for auth headers
    });
  }

  async createMaster(obj: any, masterKey: string) {
    return this.post({
      apiName: "master-page",
      baseURL: "http://localhost:8070/api",
      path: `/core/master/${masterKey}`,
      body: obj,
      // classRef: Contact,
      headers: this.toHeaders(),
    });
  }

  async getMasterById(id: number, masterKey: string) {
    return this.getPage({
      apiName: "master-page",
      baseURL: "http://localhost:8070/api",
      path: `/core/master/${masterKey}/${id}`,
      headers: this.toHeaders(),
    });
  }


  async getAllMaster(masterKey: string) {
    return this.getPage({
      apiName: "master-page",
      baseURL: "http://localhost:8070/api",
      path: `/core/master/${masterKey}/all`,
      headers: this.toHeaders(),
    });
  }

  async updateMaster(obj: any, masterKey: string, itemId: any) {
    const _body = obj;
    return this.put({
      apiName: "master-page",
      baseURL: "http://localhost:8070/api",
      path: `/core/master/${masterKey}/${itemId}`,
      body: _body,
      // classRef: Contact,
      headers: this.toHeaders(),
    });
  }

  async deleteMasterByIds(selectedId: any, masterKey: string) {
    const _body = {
      ids: [selectedId],
    };
    return this.delete({
      apiName: "master-page",
      baseURL: "http://localhost:8070/api",
      path: `/core/master/${masterKey}/${selectedId}`,
      body: _body,
      headers: this.toHeaders(),
    });
  }

}
