/**
 * Thrown when the config itself is wrong
 */
export class ProfileError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ProfileError';
  }
}
