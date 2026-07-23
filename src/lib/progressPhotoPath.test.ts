import { buildProgressPhotoPath } from './progressPhotoPath';

describe('buildProgressPhotoPath', () => {
  it("place l'id utilisateur en premier segment de dossier", () => {
    expect(buildProgressPhotoPath('user-1', 'photo-1')).toBe('user-1/photo-1.jpg');
  });

  it('utilise toujours .jpg (format de sortie fixe après compression)', () => {
    expect(buildProgressPhotoPath('abc', 'def')).toMatch(/\.jpg$/);
  });
});
