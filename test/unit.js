'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const icc = require('../index');

const fixture = filename => fs.readFileSync(path.join(__dirname, 'fixtures', filename));

describe('Parse valid ICC profiles', () => {
  it('sRGB v2', () => {
    const profile = icc.parse(fixture('sRGB_IEC61966-2-1_black_scaled.icc'));
    assert.deepStrictEqual(profile, {
      colorSpace: 'RGB',
      connectionSpace: 'XYZ',
      copyright: 'Copyright International Color Consortium',
      description: 'sRGB IEC61966-2-1 black scaled',
      deviceClass: 'Monitor',
      deviceModelDescription: 'IEC 61966-2-1 Default RGB Colour Space - sRGB',
      intent: 'Perceptual',
      version: '2.0',
      viewingConditionsDescription: 'Reference Viewing Condition in IEC 61966-2-1'
    });
  });

  it('sRGB v4', () => {
    const profile = icc.parse(fixture('sRGB_ICC_v4_Appearance.icc'));
    assert.deepStrictEqual(profile, {
      colorSpace: 'RGB',
      connectionSpace: 'Lab',
      copyright: 'COPYRIGHT(c) 2010-2016 Fuji Xerox Co., Ltd.',
      creator: 'FX',
      description: 'sRGB_ICC_v4_Appearance.icc',
      deviceClass: 'Monitor',
      intent: 'Perceptual',
      platform: 'Microsoft',
      version: '4.3'
    });
  });

  it('CMYK', () => {
    const profile = icc.parse(fixture('USWebCoatedSWOP.icc'));
    assert.deepStrictEqual(profile, {
      cmm: 'Adobe',
      colorSpace: 'CMYK',
      connectionSpace: 'Lab',
      copyright: 'Copyright 2000 Adobe Systems',
      creator: 'Adobe',
      description: 'U.S. Web Coated (SWOP) v2',
      deviceClass: 'Printer',
      intent: 'Perceptual',
      manufacturer: 'Adobe',
      platform: 'Apple',
      version: '2.1'
    });
  });

  it('XYZ', () => {
    const profile = icc.parse(fixture('D65_XYZ.icc'));
    assert.deepStrictEqual(profile, {
      cmm: 'none',
      colorSpace: 'RGB',
      connectionSpace: 'XYZ',
      copyright: 'Copyright Hewlett Packard',
      creator: 'none',
      description: 'D65 XYZ profile',
      deviceClass: 'Monitor',
      deviceModelDescription: 'IEC 61966-2-1 Default RGB Colour Space - sRGB',
      intent: 'Relative',
      manufacturer: 'none',
      model: 'none',
      version: '2.4',
      viewingConditionsDescription: 'Reference Viewing Condition in IEC 61966-2-1'
    });
  });

  it('Process \'mluc\' tags', () => {
    const profile = icc.parse(fixture('ILFORD_CANpro-4000_GPGFG_ProPlatin.icc'));
    assert.deepStrictEqual(profile, {
      colorSpace: 'RGB',
      connectionSpace: 'Lab',
      copyright: 'Copyright X-Rite, Inc.',
      creator: 'XRCM',
      description: 'ILFORD_CANpro-4000_GPGFG_ProPlatin.icc',
      deviceClass: 'Printer',
      intent: 'Perceptual',
      platform: 'Microsoft',
      version: '4.2'
    });
  });

  it('Probe v2', () => {
    const profile = icc.parse(fixture('Probev1_ICCv2.icc'));
    assert.deepStrictEqual(profile, {
      cmm: 'LINO',
      colorSpace: 'CMYK',
      connectionSpace: 'Lab',
      copyright: 'Copyright 2004 International Color Consortium.  All rights res',
      creator: 'ICC',
      description: 'Probev1_ICCv2.icc',
      deviceClass: 'Printer',
      intent: 'Perceptual',
      manufacturer: 'ICC',
      model: 'PAWG',
      platform: 'Microsoft',
      version: '2.0'
    });
  });

  it('Probe v4', () => {
    const profile = icc.parse(fixture('Probev1_ICCv4.icc'));
    assert.deepStrictEqual(profile, {
      cmm: 'LINO',
      colorSpace: 'CMYK',
      connectionSpace: 'Lab',
      copyright: 'Copyright 2004 International Color Consortium.  All rights reserved.\u0000',
      creator: 'ICC',
      description: 'Probev1_ICCv4.icc',
      deviceClass: 'Printer',
      intent: 'Perceptual',
      manufacturer: 'ICC',
      model: 'PAWG',
      platform: 'Microsoft',
      version: '4.0'
    });
  });
});

describe('Parse invalid ICC profiles', () => {
  it('Detects invalid length', () => {
    assert.throws(() => {
      icc.parse(Buffer.alloc(4));
    }, /Invalid ICC profile: length mismatch/);
  });

  it('Detects invalid signature', () => {
    assert.throws(() => {
      icc.parse(Buffer.from([0x00, 0x00, 0x00, 0x08, 0x00, 0x00, 0x00, 0x00]));
    }, /Invalid ICC profile: missing signature/);
  });
});
