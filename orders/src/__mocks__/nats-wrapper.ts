// Fake implementation for unit test
export const natsWrapper = {
  client: {
    publish: jest
      .fn()
      .mockImplementation(
        (subject: string, data: string, callback: () => void) => {
          callback();
        }
      ),
  },
};

// jest.fn = return new function
// jest.fn().mockImplementation = return new function with mockImplementation
