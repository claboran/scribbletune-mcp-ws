module.exports = {
  displayName: 'scribbletune-midi-store',
  preset: '../../jest.preset.js',
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: '../../coverage/apps/scribbletune-midi-store',
  testTimeout: 60_000,
  // uuid v13+ ships ESM-only; transform it so Jest (CommonJS) can consume it
  transformIgnorePatterns: ['node_modules/(?!(uuid)/)'],
};
