'use strict';

/**
 * 3D Bresenham Raycaster for spatial line-of-sight validation.
 * Traces rays through voxel bounds and handles block transparency profiles.
 */
class Raycaster {
  static TRANSPARENT_BLOCKS = new Set([
    'air', 'cave_air', 'void_air', 'glass', 'glass_pane',
    'water', 'short_grass', 'tall_grass', 'torch', 'wall_torch',
    'fern', 'large_fern', 'dandelion', 'poppy', 'blue_orchid',
    'allium', 'azure_bluet', 'red_tulip', 'orange_tulip', 'white_tulip',
    'pink_tulip', 'oxeye_daisy', 'cornflower', 'lily_of_the_valley',
    'wither_rose', 'sugar_cane', 'vine', 'ladder', 'iron_bars'
  ]);

  constructor(bot) {
    this.bot = bot;
  }

  hasLineOfSight(targetPos, originPos = null) {
    const origin = originPos || this.bot.entity.position.offset(0, this.bot.entity.height * 0.85, 0);
    const target = targetPos;

    let x0 = Math.floor(origin.x);
    let y0 = Math.floor(origin.y);
    let z0 = Math.floor(origin.z);

    const x1 = Math.floor(target.x);
    const y1 = Math.floor(target.y);
    const z1 = Math.floor(target.z);

    const dx = Math.abs(x1 - x0);
    const dy = Math.abs(y1 - y0);
    const dz = Math.abs(z1 - z0);

    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    const sz = z0 < z1 ? 1 : -1;

    let dm = Math.max(dx, dy, dz);
    let i = dm;
    let x = x0;
    let y = y0;
    let z = z0;

    let ex = dm / 2;
    let ey = dm / 2;
    let ez = dm / 2;

    while (i-- > 0) {
      if (x === x1 && y === y1 && z === z1) {
        return true;
      }

      ex -= dx;
      if (ex < 0) {
        x += sx;
        ex += dm;
      }

      ey -= dy;
      if (ey < 0) {
        y += sy;
        ey += dm;
      }

      ez -= dz;
      if (ez < 0) {
        z += sz;
        ez += dm;
      }

      const block = this.bot.blockAt({ x, y, z });
      if (block && !Raycaster.TRANSPARENT_BLOCKS.has(block.name)) {
        return false;
      }
    }

    return true;
  }
}

module.exports = Raycaster;
