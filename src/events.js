export const EVENTS = {
  V1: {
    // Dashboard events
    READY: 'ready',
    IS_REALTIME_ACTIVE: 'isRealTimeActive',
    OPEN_DRAWER: 'openDrawer',
    RECEIVED_HEADERS: 'receivedHeaders',
    RECEIVED_JWT_TOKEN: 'receivedJWTToken',
    RECEIVED_TOKEN: 'receivedToken',
    REFRESH_DASHBOARD: 'refreshDashboard',
    SELECTED_DASHBOARD_OBJECT: 'selectedDashboardObject',
    SELECTED_DEVICE_OBJECT: 'selectedDeviceObject',
    SELECTED_DEVICE_OBJECTS: 'selectedDeviceObjects',
    SELECTED_DEVICE: 'selectedDevice',
    SELECTED_DEVICES: 'selectedDevices',
    SELECTED_FILTERS: 'selectedFilters',
    SELECTED_DATE_RANGE: 'setDashboardDateRange',
    SET_DASHBOARD_DEVICE: 'setDashboardDevice',
    SET_DASHBOARD_DEVICES: 'setDashboardDevices',
    SET_DASHBOARD_LAYER: 'setDashboardLayer',
    SET_DASHBOARD_MULTIPLE_DEVICES: 'setDashboardMultipleDevices',
    SET_FULLSCREEN: 'setFullScreen',
    SET_REAL_TIME: 'setRealTime',
  },

  V2: {
    // Auth category
    AUTH: {
      TOKEN: 'v2:auth:token',
      JWT: 'v2:auth:jwt',
      HEADERS: 'v2:auth:headers',
      ALL: 'v2:auth:*',
    },

    // Dashboard category
    DASHBOARD: {
      SETTINGS: {
        DATERANGE: 'v2:dashboard:settings:daterange',
        FILTERS: 'v2:dashboard:settings:filters',
        RT: 'v2:dashboard:settings:rt',
        REFRESHED: 'v2:dashboard:settings:refreshed',
        FULLSCREEN: 'v2:dashboard:settings:fullscreen',
        LAYER: 'v2:dashboard:settings:layer',
      },
      DEVICES: {
        SELECTED: 'v2:dashboard:devices:selected',
        ALL_DEVICES: 'v2:dashboard:devices:self',
      },
      SELF: 'v2:dashboard:self',
      ALL: 'v2:dashboard:*',
    },

    WIDGET: {
      DATA: 'v2:widget:data',
      READY: 'v2:widget:ready',
      ERROR: 'v2:widget:error',
      ALL: 'v2:widget:*',
      OPEN_DRAWER: 'v2:widget:openDrawer',
    },
  },
};

const getAllEventValues = obj => {
  const values = [];

  const getDeepValues = node => {
    for (const key in node) {
      const value = node[key];

      if (typeof value === 'string') {
        values.push(value);
      } else if (typeof value === 'object' && value !== null) {
        getDeepValues(value);
      }
    }
  };

  getDeepValues(obj);
  return values;
};
export const plainEvents = getAllEventValues(EVENTS);
