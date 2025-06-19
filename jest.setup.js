// Jest setup file
jest.setTimeout(10000); // 10 seconds timeout for async tests

// Mock blessed
jest.mock('blessed', () => ({
  screen: jest.fn(() => ({
    render: jest.fn(),
    destroy: jest.fn(),
    key: jest.fn(),
    on: jest.fn(),
  })),
  box: jest.fn(() => ({
    focus: jest.fn(),
    setContent: jest.fn(),
    on: jest.fn(),
    key: jest.fn(),
  })),
  list: jest.fn(() => ({
    focus: jest.fn(),
    setItems: jest.fn(),
    on: jest.fn(),
    key: jest.fn(),
  })),
  textbox: jest.fn(() => ({
    getValue: jest.fn(),
    setValue: jest.fn(),
    focus: jest.fn(),
    on: jest.fn(),
    key: jest.fn(),
  })),
  form: jest.fn(() => ({
    on: jest.fn(),
    key: jest.fn(),
    destroy: jest.fn(),
  })),
  button: jest.fn(() => ({
    on: jest.fn(),
  })),
  text: jest.fn(() => ({})),
  textarea: jest.fn(() => ({
    getValue: jest.fn(),
  })),
  prompt: jest.fn(() => ({
    input: jest.fn(),
  })),
  question: jest.fn(() => ({
    ask: jest.fn(),
  })),
}));