'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const icc = require('../index');

const fixture = filename => fs.readFileSync(path.join(__dirname, 'fixtures', filename));

describe('Parse valid ICC profiles', () => {
  it('sRGB', () => {
    const profile = icc.parse(fixture('sRGB_IEC61966-2-1_black_scaled.icc'));
    assert.deepEqual(profile, {
      version: '2.0',
      intent: 'Perceptual',
      deviceClass: 'Monitor',
      colorSpace: 'RGB',
      connectionSpace: 'XYZ',
      description: 'sRGB IEC61966-2-1 black scaled',
      deviceModelDescription: 'IEC 61966-2-1 Default RGB Colour Space - sRGB',
      viewingConditionsDescription: 'Reference Viewing Condition in IEC 61966-2-1',
      copyright: 'Copyright International Color Consortium'
    });
  });

  it('CMYK', () => {
    const profile = icc.parse(fixture('USWebCoatedSWOP.icc'));
    assert.deepEqual(profile, {
      version: '2.1',
      intent: 'Perceptual',
      cmm: 'Adobe',
      deviceClass: 'Printer',
      colorSpace: 'CMYK',
      connectionSpace: 'Lab',
      platform: 'Apple',
      manufacturer: 'Adobe',
      creator: 'Adobe',
      description: 'U.S. Web Coated (SWOP) v2',
      copyright: 'Copyright 2000 Adobe Systems'
    });
  });

  it('XYZ', () => {
    const profile = icc.parse(fixture('D65_XYZ.icc'));
    assert.deepEqual(profile, {
      version: '2.4',
      intent: 'Relative',
      cmm: 'none',
      deviceClass: 'Monitor',
      colorSpace: 'RGB',
      connectionSpace: 'XYZ',
      manufacturer: 'none',
      model: 'none',
      creator: 'none',
      description: 'D65 XYZ profile',
      deviceModelDescription: 'IEC 61966-2-1 Default RGB Colour Space - sRGB',
      viewingConditionsDescription: 'Reference Viewing Condition in IEC 61966-2-1',
      copyright: 'Copyright Hewlett Packard'
    });
  });

  it('Process \'mluc\' tags', () => {
    const profile = icc.parse(fixture('ILFORD_CANpro-4000_GPGFG_ProPlatin.icc'));
    assert.deepEqual(profile, {
      version: '4.2',
      intent: 'Perceptual',
      deviceClass: 'Printer',
      colorSpace: 'RGB',
      connectionSpace: 'Lab',
      creator: 'XRCM',
      platform: 'Microsoft',
      description: 'ILFORD_CANpro-4000_GPGFG_ProPlatin.icc',
      copyright: 'Copyright X-Rite, Inc.'
    });
  });
});

describe('Parse invalid ICC profiles', () => {
  it('Throws Error', () => {
    assert.throws(() => {
      icc.parse(fs.readFileSync(__filename));
    });
  });
});
