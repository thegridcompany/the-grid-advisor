export const useRouter = jest.fn(() => ({
  route: "/",
  pathname: "/",
  query: {},
  asPath: "/",
  push: jest.fn(),
  replace: jest.fn(),
  reload: jest.fn(),
  back: jest.fn(),
  prefetch: jest.fn().mockResolvedValue(undefined),
  beforePopState: jest.fn(),
  events: {
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn(),
  },
  isFallback: false,
}));

// You can add other router exports if your app uses them, for example:
// export const withRouter = (Component) => {
//   Component.defaultProps = {
//     ...Component.defaultProps,
//     router: useRouter(),
//   };
//   return Component;
// };
