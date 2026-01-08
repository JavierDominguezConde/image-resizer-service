import type { Config } from 'jest';

export default {
  testEnvironment: 'node',
  testRunner: 'jest-circus/runner',
  preset: 'ts-jest',
  transform: {},
  extensionsToTreatAsEsm: ['.ts'],
  coverageProvider: 'v8',
  coverageDirectory: './coverage',
  collectCoverageFrom: ['app/**/*.ts'],
  coverageReporters: ['json', 'lcov', 'cobertura', 'text'],
  coveragePathIgnorePatterns: [
    'index.ts',
    'bootstrap.ts',
    'types.ts',
    'app/.*/infra',
    'app/.*/config',
    'app/.*/const',
    'app/.*/model',
    'app/.*/schemas'
  ],
  clearMocks: true,
  randomize: true
} as Config;
