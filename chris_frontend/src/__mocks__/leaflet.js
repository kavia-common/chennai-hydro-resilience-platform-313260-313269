export default {
  map: jest.fn(),
  tileLayer: jest.fn(),
  marker: jest.fn(),
  icon: jest.fn(),
  Icon: {
    Default: {
      prototype: {
        _getIconUrl: jest.fn(),
      },
    },
  },
};
