import { isDataConflictError, shouldRetryMutation } from './dataConflict';

describe('isDataConflictError', () => {
  it('reconnaît une erreur Postgrest structurée (code présent)', () => {
    expect(isDataConflictError({ code: '23503', message: 'foreign key violation' })).toBe(true);
    expect(isDataConflictError({ code: 'PGRST116', message: 'no rows' })).toBe(true);
  });

  it("n'est pas un conflit de donnée pour une erreur réseau classique", () => {
    expect(isDataConflictError(new TypeError('Network request failed'))).toBe(false);
    expect(isDataConflictError(new Error('fetch failed'))).toBe(false);
  });

  it('gère les valeurs non-objet sans planter', () => {
    expect(isDataConflictError(null)).toBe(false);
    expect(isDataConflictError(undefined)).toBe(false);
    expect(isDataConflictError('erreur texte')).toBe(false);
  });
});

describe('shouldRetryMutation', () => {
  it('retente une coupure réseau (jusqu\'à 2 fois)', () => {
    const networkError = new Error('Network request failed');
    expect(shouldRetryMutation(0, networkError)).toBe(true);
    expect(shouldRetryMutation(1, networkError)).toBe(true);
    expect(shouldRetryMutation(2, networkError)).toBe(false);
  });

  it('ne retente jamais un vrai conflit de donnée', () => {
    const conflictError = { code: '23503', message: 'foreign key violation' };
    expect(shouldRetryMutation(0, conflictError)).toBe(false);
  });
});
