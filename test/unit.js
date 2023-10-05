// Copyright 2015 Lovell Fuller and others.
// SPDX-License-Identifier: Apache-2.0

'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const icc = require('../index');

const fixture = filename => fs.readFileSync(path.join(__dirname, 'fixtures', filename));

const getProfileData = (profile) => {
  const clutFields = ['gamut', 'A2B0', 'A2B1', 'A2B2', 'B2A0', 'B2A1', 'B2A2'];
  return Object.fromEntries(Object.entries(profile).filter((e) => clutFields.indexOf(e[0]) === -1));
};

describe('Parse valid ICC profiles', () => {
  it('sRGB v2', () => {
    const profile = icc.parse(fixture('sRGB_IEC61966-2-1_black_scaled.icc'));
    const profileData = getProfileData(profile);
    assert.deepStrictEqual(profileData, {
      colorSpace: 'RGB',
      connectionSpace: 'XYZ',
      copyright: 'Copyright International Color Consortium',
      description: 'sRGB IEC61966-2-1 black scaled',
      deviceClass: 'Monitor',
      deviceModelDescription: 'IEC 61966-2-1 Default RGB Colour Space - sRGB',
      intent: 'Perceptual',
      version: '2.0',
      viewingConditionsDescription: 'Reference Viewing Condition in IEC 61966-2-1',
      whitepoint: [0.964202880859375, 1, 0.8249053955078125]
    });
  });

  it('sRGB v4', () => {
    const profile = icc.parse(fixture('sRGB_ICC_v4_Appearance.icc'));
    const profileData = getProfileData(profile);
    assert.deepStrictEqual(profileData, {
      colorSpace: 'RGB',
      connectionSpace: 'Lab',
      copyright: 'COPYRIGHT(c) 2010-2016 Fuji Xerox Co., Ltd.',
      creator: 'FX',
      description: 'sRGB_ICC_v4_Appearance.icc',
      deviceClass: 'Monitor',
      intent: 'Perceptual',
      platform: 'Microsoft',
      version: '4.3',
      whitepoint: [0.964202880859375, 1, 0.8249053955078125]
    });
  });

  it('CMYK', () => {
    const profile = icc.parse(fixture('USWebCoatedSWOP.icc'));
    const profileData = getProfileData(profile);
    assert.deepStrictEqual(profileData, {
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
      version: '2.1',
      whitepoint: [0.708404541015625, 0.7359466552734375, 0.571044921875]
    });
  });

  it('XYZ', () => {
    const profile = icc.parse(fixture('D65_XYZ.icc'));
    const profileData = getProfileData(profile);
    assert.deepStrictEqual(profileData, {
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
      viewingConditionsDescription: 'Reference Viewing Condition in IEC 61966-2-1',
      whitepoint: [0.964202880859375, 1, 0.8249053955078125]
    });
  });

  it('Process \'mluc\' tags', () => {
    const profile = icc.parse(fixture('ILFORD_CANpro-4000_GPGFG_ProPlatin.icc'));
    const profileData = getProfileData(profile);
    assert.deepStrictEqual(profileData, {
      colorSpace: 'RGB',
      connectionSpace: 'Lab',
      copyright: 'Copyright X-Rite, Inc.',
      creator: 'XRCM',
      description: 'ILFORD_CANpro-4000_GPGFG_ProPlatin.icc',
      deviceClass: 'Printer',
      intent: 'Perceptual',
      platform: 'Microsoft',
      version: '4.2',
      whitepoint: [0.954559326171875, 0.989593505859375, 0.8075714111328125]
    });
  });

  it('Probe v2', () => {
    const profile = icc.parse(fixture('Probev1_ICCv2.icc'));
    const profileData = getProfileData(profile);
    assert.deepStrictEqual(profileData, {
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
      version: '2.0',
      whitepoint: [0.75, 0.5, 0.25]
    });
  });

  it('Probe v4', () => {
    const profile = icc.parse(fixture('Probev1_ICCv4.icc'));
    const profileData = getProfileData(profile);
    assert.deepStrictEqual(profileData, {
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
      version: '4.0',
      whitepoint: [0.75, 0.5, 0.25]
    });
  });
});

describe('Parses CLUT tables and transforms', () => {
  it('B2A transforms', () => {
    const profile = icc.parse(fixture('Probev1_ICCv2.icc'));
    const B2A0Min = profile.B2A0.transform([0, 0, 0]);
    assert.deepStrictEqual(B2A0Min, [1, 0, 0, 0]);
    const B2A0Max = profile.B2A0.transform([1, 0, 0]);
    assert.deepStrictEqual(B2A0Max, [0, 0, 0, 0]);
    const B2A1Min = profile.B2A1.transform([0, 0, 0]);
    assert.deepStrictEqual(B2A1Min, [0, 1, 0, 0]);
    const B2A1Max = profile.B2A1.transform([1, 0, 0]);
    assert.deepStrictEqual(B2A1Max, [0, 0, 0, 0]);
    const B2A2Min = profile.B2A2.transform([0, 0, 0]);
    assert.deepStrictEqual(B2A2Min, [0, 0, 1, 0]);
    const B2A2Max = profile.B2A2.transform([1, 0, 0]);
    assert.deepStrictEqual(B2A2Max, [0, 0, 0, 0]);
  });

  it('A2B transforms', () => {
    const profile = icc.parse(fixture('Probev1_ICCv2.icc'));
    const A2B0Min = profile.A2B0.transform([1, 1, 1, 1]);
    assert.deepStrictEqual(A2B0Min[0] >= 0.7 && A2B0Min[0] <= 1, true);
    const A2B0Max = profile.A2B0.transform([0, 0, 0, 0]);
    assert.deepStrictEqual(A2B0Max[0] >= 0.7 && A2B0Max[0] <= 1, true);
    const A2B1Min = profile.A2B1.transform([1, 1, 1, 1]);
    assert.deepStrictEqual(A2B1Min[0] >= 0.3 && A2B1Min[0] <= 0.7, true);
    const A2B1Max = profile.A2B1.transform([0, 0, 0, 0]);
    assert.deepStrictEqual(A2B1Max[0] >= 0.3 && A2B1Max[0] <= 0.7, true);
    const A2B2Min = profile.A2B2.transform([1, 1, 1, 1]);
    assert.deepStrictEqual(A2B2Min[0] >= 0 && A2B2Min[0] <= 0.3, true);
    const A2B2Max = profile.A2B2.transform([0, 0, 0, 0]);
    assert.deepStrictEqual(A2B2Max[0] >= 0 && A2B2Max[0] <= 0.3, true);
  });

  it('Detect invalid transform input', () => {
    assert.throws(() => {
      const profile = icc.parse(fixture('Probev1_ICCv2.icc'));
      profile.B2A0.transform([0, 0, 0, 0]);
    }, /Wrong number of inputs/);
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
