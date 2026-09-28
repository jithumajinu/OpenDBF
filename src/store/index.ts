import { configureStore } from '@reduxjs/toolkit'
import authReducer from './authSlice'
import contactReducer from './contactSlice'
import masterReducer from './masterSlice'
import caseReducer from './caseSlice'
import docketReducer from './docketSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    contact: contactReducer,
    master: masterReducer,
    case: caseReducer,
    docket: docketReducer,
  }
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch