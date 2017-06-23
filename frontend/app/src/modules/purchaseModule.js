import config from './../utilities/configValues';
import { browserHistory } from 'react-router';
import reducerMerge from './../utilities/reducerMerge';
import { requestStates } from '../sagas/requestSaga';
import { fetchClientAction } from './clientModule';

export const PURCHASE_SESSIONS = requestStates('purchase_sessions', 'purchase_sessions');
export const GET_PURCHASES = requestStates('get_purchases', 'purchase_sessions');

export default (state = [], action = {}) => {
  switch (action.type) {
    case GET_PURCHASES.SUCCESS: {
      return reducerMerge(state, action.response);
    }
    default:
      return state;
  }
};

const successFunction = (action, payload) => {
  browserHistory.push(`/purchases/${payload.payload.clientId}`);
  return { type: action.states.SUCCESS, action, payload };
};

export function purchase(data) {
  return {
    type: PURCHASE_SESSIONS.REQUEST,
    states: PURCHASE_SESSIONS,
    url: config.apiBase + 'purchase/purchase',
    successFunction,
    subsequentAction: () => fetchClientAction(data.clientId),
    containerName: 'purchaseForm',
    params: {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }
  };
}

export function getPurchases(id) {
  return {
    type: GET_PURCHASES.REQUEST,
    states: GET_PURCHASES,
    url: `${config.apiBase}purchaselist/fetchpurchases/${id}`,
    params: {
      method: 'GET',
      credentials: 'include'
    }
  };
}
