import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { ApiService } from '@apiServices/ApiService'
import { createApiPageRequest } from '@apiServices/common/domain/PageUtil'
import customerPagedData from '@appAssets/utils/mokdata/customer_paged.json'
//import customerPagedData from '@appAssets/utils/mokdata/customer_paged_empty.json'

export interface Contact {
  id?: number
  firstName: string
  lastName: string
  companyName?: string
  jobTitle?: string
  department?: string
  email1?: string
  email2?: string
  phone1?: string
  phone2?: string
  website1?: string
  website2?: string
  dateOfBirth?: string | null
  addressList?: {
    addressId?: number
    city: string
    country: string
    countryCode: string
    lang: string
    other: string
    region: string
    state: string
    street: string
    zip: string
    stateCode: string
  }[]
  avatar?: string
  status?: string
  archived?: string | null
  tenantId?: number
}

export interface ContactPageResponse {
  pageSize: number
  pageNumber: number
  totalPages: number
  previous: boolean
  next: boolean
  totalCount: number
  content: Contact[]
  paginationContent: null
  pagingArea: boolean
  hasData: boolean
}

interface ContactState {
  contactPageObj: ContactPageResponse
  loading: boolean
  error: string | null
  searchResults: Contact[]
  searchLoading: boolean
}

const initialState: ContactState = {
  contactPageObj: {
    pageSize: 10,
    pageNumber: 1,
    totalPages: 0,
    previous: false,
    next: false,
    totalCount: 0,
    content: [],
    paginationContent: null,
    pagingArea: false,
    hasData: false
  },
  loading: false,
  error: null,
  searchResults: [],
  searchLoading: false,
}

const restApi: ApiService = ApiService.getInstance()

type PaginationParams = {
  page?: number;
  size?: number;
  sorts?: any[];
}

type FilterParams = {
  firstName?: string;
  lastName?: string;
}


type FetchContactsParams = {
  queryState?: any;
  filters?: FilterParams;
}

export const fetchContactsAsync = createAsyncThunk(
  'contact/fetchContacts',
  async (params?: FetchContactsParams) => {
    const defaultParams = params || {}
    console.log("fetchContactsAsync called with params:", params);
    const qs = {
      page: defaultParams.queryState?.page || 1,
      size: defaultParams.queryState?.size || 10,
      sorts: defaultParams.queryState?.sorts || [["CONTACT_ID", "ASC"]],
      keyword: defaultParams.filters?.firstName || '', // Assuming backend can handle empty string as no filter},
      //keyword: defaultParams.filters || {},
    }

    console.log("Fetching contacts with params: ", qs);

    try {
      const response = await restApi.contactService.findPage(createApiPageRequest(qs));
      console.log("API response:", response?.data);
      return response?.data?.data || [];
    } catch (error) {
      // Fallback to sample data for development
      console.warn("Using sample data - API call failed:", error);
      // return customerPagedData.data;
    }
  }
)

export const searchContactsAsync = createAsyncThunk(
  'contact/searchContacts',
  async (keyword: string) => {
    try {
      const qs = {
        page: 1,
        size: 20,
        sorts: [["CONTACT_ID", "ASC"]],
        keyword: keyword,
      }
      const response = await restApi.contactService.findPage(createApiPageRequest(qs))
      return (response?.data?.data?.content ?? []) as Contact[]
    } catch (error) {
      console.warn('searchContactsAsync: API failed, using mock data', error)
      const all = (customerPagedData.data?.content ?? []) as Contact[]
      const q = keyword.toLowerCase()
      return q
        ? all.filter(
            (c) =>
              c.firstName.toLowerCase().includes(q) ||
              c.lastName.toLowerCase().includes(q)
          )
        : all
    }
  }
)

export const createContactAsync = createAsyncThunk(
  'contact/createContact',
  async (data: any) => {
    const response = await restApi.contactService.createCustomer(data)

    if (response.errorMessage) {
      throw new Error(response.errorMessage)
    }

    return response.data
  }
)

export const updateContactAsync = createAsyncThunk(
  'contact/updateContact',
  async (data: any) => {
    const response = await restApi.contactService.updateCustomer(data)

    if (response.errorMessage) {
      throw new Error(response.errorMessage)
    }

    return response.data
  }
)

const contactSlice = createSlice({
  name: 'contact',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchContactsAsync.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchContactsAsync.fulfilled, (state, action) => {
        state.loading = false
        state.contactPageObj = action.payload
      })
      .addCase(fetchContactsAsync.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Failed to fetch contacts'
      })
      .addCase(searchContactsAsync.pending, (state) => {
        state.searchLoading = true
      })
      .addCase(searchContactsAsync.fulfilled, (state, action) => {
        state.searchLoading = false
        state.searchResults = action.payload
      })
      .addCase(searchContactsAsync.rejected, (state) => {
        state.searchLoading = false
        state.searchResults = []
      })
      .addCase(createContactAsync.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(createContactAsync.fulfilled, (state, action) => {
        state.loading = false
        const created = action.payload?.data
        if (created) {
          state.contactPageObj.content.push(created)
          state.contactPageObj.totalCount += 1
        }
      })
      .addCase(createContactAsync.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Failed to create contact'
      })
      .addCase(updateContactAsync.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(updateContactAsync.fulfilled, (state, action) => {
        state.loading = false
        const updated = action.payload?.data
        if (!updated?.id) return
        const index = state.contactPageObj.content.findIndex(
          (c: any) => c.id === updated.id
        )
        if (index !== -1) {
          state.contactPageObj.content[index] = updated
        }
      })
      .addCase(updateContactAsync.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Failed to update contact'
      })
  }
})

export const { clearError } = contactSlice.actions
export default contactSlice.reducer