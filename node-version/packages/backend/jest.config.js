/** @type {import('jest').Config} */
export default {
  transform: {},
  moduleNameMapper: {
    '^(\.{1,2}/.*)\.js$': '$1'
  },
  testEnvironment: 'node',
  type: 'module'
};