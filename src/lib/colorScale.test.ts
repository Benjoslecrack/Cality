import { lerpColor } from './colorScale';

describe('lerpColor', () => {
  it('renvoie la couleur de départ à t=0', () => {
    expect(lerpColor('#7A1749', '#FF2E92', 0)).toBe('#7a1749');
  });

  it('renvoie la couleur d’arrivée à t=1', () => {
    expect(lerpColor('#7A1749', '#FF2E92', 1)).toBe('#ff2e92');
  });

  it('interpole à mi-chemin', () => {
    expect(lerpColor('#000000', '#FFFFFF', 0.5)).toBe('#808080');
  });

  it('clampe les valeurs de t hors de [0, 1]', () => {
    expect(lerpColor('#7A1749', '#FF2E92', -5)).toBe('#7a1749');
    expect(lerpColor('#7A1749', '#FF2E92', 5)).toBe('#ff2e92');
  });
});
