/** @type {import('ts-jest').JestConfigWithTsJest} */
const fs = require("fs");

const isDist = fs.existsSync("./dist");

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  roots: [isDist ? "<rootDir>/dist/tests" : "<rootDir>/src/tests"],
  moduleFileExtensions: ['ts', 'js', 'json'],
  transform: {
    '^.+\\.ts$': ['ts-jest'],
  },
  clearMocks: true,
  verbose: true,
  testPathIgnorePatterns: [
    "/node_modules/",        
    "<rootDir>/dist/node_modules/",
    "<rootDir>/src/node_modules/",
    "<rootDir>/dist/tests/prepare-tests",
  ],
};
