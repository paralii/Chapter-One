import { configureStore } from "@reduxjs/toolkit";
import { combineReducers } from "redux";
import storage from "redux-persist/lib/storage"; 
import { persistStore, persistReducer } from "redux-persist";
import authReducer from "./authSlice";
import adminReducer from "./adminSlice";
import alertReducer from "./alertSlice";

const persistConfig = {
  key: "root",
  storage,
  whitelist: ["auth", "admin"],
};

const rootReducer = combineReducers({
  admin: adminReducer,
  auth: authReducer,
  alert: alertReducer,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ["persist/PERSIST", "persist/REHYDRATE"],
      },
    }),
});

export const persistor = persistStore(store);
export default store;
