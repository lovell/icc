// Copyright 2015 Lovell Fuller and others.
// SPDX-License-Identifier: Apache-2.0

'use strict';

// http://www.color.org/profileheader.xalter

const versionMap = {
  0x02000000: '2.0',
  0x02100000: '2.1',
  0x02400000: '2.4',
  0x04000000: '4.0',
  0x04200000: '4.2',
  0x04300000: '4.3',
  0x04400000: '4.4'
};

const intentMap = {
  0: 'Perceptual',
  1: 'Relative',
  2: 'Saturation',
  3: 'Absolute'
};

const valueMap = {
  // Device
  scnr: 'Scanner',
  mntr: 'Monitor',
  prtr: 'Printer',
  link: 'Link',
  abst: 'Abstract',
  spac: 'Space',
  nmcl: 'Named color',
  // Platform
  appl: 'Apple',
  adbe: 'Adobe',
  msft: 'Microsoft',
  sunw: 'Sun Microsystems',
  sgi: 'Silicon Graphics',
  tgnt: 'Taligent'
};

const tagMap = {
  desc: 'description',
  cprt: 'copyright',
  dmdd: 'deviceModelDescription',
  vued: 'viewingConditionsDescription',
  wtpt: 'whitepoint',
  gamt: 'gamut',
  A2B0: 'A2B0',
  A2B1: 'A2B1',
  A2B2: 'A2B2',
  B2A0: 'B2A0',
  B2A1: 'B2A1',
  B2A2: 'B2A2'
};

const getContentAtOffsetAsString = (buffer, offset) => {
  const value = buffer.slice(offset, offset + 4).toString().trim();
  return (value.toLowerCase() in valueMap) ? valueMap[value.toLowerCase()] : value;
};

const hasContentAtOffset = (buffer, offset) => buffer.readUInt32BE(offset) !== 0;

const readStringUTF16BE = (buffer, start, end) => {
  const data = buffer.slice(start, end);
  let value = '';
  for (let i = 0; i < data.length; i += 2) {
    value += String.fromCharCode((data[i] * 256) + data[i + 1]);
  }
  return value;
};

const invalid = (reason) => new Error(`Invalid ICC profile: ${reason}`);

const parseMft = (buffer, tagOffset, tagType) => {
  const data = {
    inputChannels: buffer.readUInt8(tagOffset + 8),
    outputChannels: buffer.readUInt8(tagOffset + 9),
    clutGridPoints: buffer.readUInt8(tagOffset + 10),
    matrix: [[
      buffer.readInt32BE(tagOffset + 12) / 65536,
      buffer.readInt32BE(tagOffset + 16) / 65536,
      buffer.readInt32BE(tagOffset + 20) / 65536
    ], [
      buffer.readInt32BE(tagOffset + 24) / 65536,
      buffer.readInt32BE(tagOffset + 28) / 65536,
      buffer.readInt32BE(tagOffset + 32) / 65536
    ], [
      buffer.readInt32BE(tagOffset + 36) / 65536,
      buffer.readInt32BE(tagOffset + 40) / 65536,
      buffer.readInt32BE(tagOffset + 44) / 65536
    ]],
    input: [],
    output: []
  };

  let offset = tagOffset + 48;

  const readInt = () => {
    if (tagType === 'mft1') {
      offset += 1;

      return buffer.readUInt8(offset - 1);
    } else {
      offset += 2;

      return buffer.readUInt16BE(offset - 2);
    }
  };

  const inputCount = tagType === 'mft1' ? 256 : readInt();
  const outputCount = tagType === 'mft1' ? 256 : readInt();

  for (let j = 0; j < data.inputChannels; j++) {
    const table = [];

    for (let i = 0; i < inputCount; i++) {
      table.push(readInt());
    }

    data.input.push(table);
  }

  const getClutRecursive = (dim) => {
    const values = [];

    if (dim === 0) {
      for (let i = 0; i < data.outputChannels; i++) {
        values.push(readInt());
      }
    } else {
      for (let i = 0; i < data.clutGridPoints; i++) {
        values.push(getClutRecursive(dim - 1));
      }
    }

    return values;
  };

  data.clut = getClutRecursive(data.inputChannels);

  for (let j = 0; j < data.outputChannels; j++) {
    const table = [];

    for (let i = 0; i < outputCount; i++) {
      table.push(readInt());
    }

    data.output.push(table);
  }

  data.transform = (color) => {
    if (!color || data.inputChannels !== color.length) {
      throw invalid('Wrong number of inputs');
    } else {
      const factor = tagType === 'mft1' ? 255 : 65535;
      const inputColor = color.map((v, i) => data.input[i][Math.floor(v * (data.input[i].length - 1))]);
      const inputColorForClut = inputColor.map((v) => Math.floor(v / factor * (data.clutGridPoints - 1)));
      const clutValue = inputColorForClut.reduce((clut, v) => clut[v], data.clut);
      const clutValueForOutput = clutValue.map((v, i) => Math.floor(v / factor * (data.output[i].length - 1)));
      const outputValue = clutValueForOutput.map((v, i) => data.output[i][v]);
      const outputColor = outputValue.map((v) => v / factor);
      return outputColor;
    }
  };

  return data;
};

module.exports.parse = (buffer) => {
  // Verify expected length
  const size = buffer.readUInt32BE(0);
  if (size !== buffer.length) {
    throw invalid('length mismatch');
  }
  // Verify 'acsp' signature
  const signature = buffer.slice(36, 40).toString();
  if (signature !== 'acsp') {
    throw invalid('missing signature');
  }
  // Integer attributes
  const profile = {
    version: versionMap[buffer.readUInt32BE(8)],
    intent: intentMap[buffer.readUInt32BE(64)]
  };
  // Four-byte string attributes
  [
    [4, 'cmm'],
    [12, 'deviceClass'],
    [16, 'colorSpace'],
    [20, 'connectionSpace'],
    [40, 'platform'],
    [48, 'manufacturer'],
    [52, 'model'],
    [80, 'creator']
  ].forEach(attr => {
    if (hasContentAtOffset(buffer, attr[0])) {
      profile[attr[1]] = getContentAtOffsetAsString(buffer, attr[0]);
    }
  });
  // Tags
  const tagCount = buffer.readUInt32BE(128);
  let tagHeaderOffset = 132;
  for (let i = 0; i < tagCount; i++) {
    const tagSignature = getContentAtOffsetAsString(buffer, tagHeaderOffset);
    if (tagSignature in tagMap) {
      const tagOffset = buffer.readUInt32BE(tagHeaderOffset + 4);
      const tagSize = buffer.readUInt32BE(tagHeaderOffset + 8);
      if (tagOffset > buffer.length) {
        throw invalid('tag offset out of bounds');
      }
      const tagType = getContentAtOffsetAsString(buffer, tagOffset);
      // desc
      if (tagType === 'desc') {
        const tagValueSize = buffer.readUInt32BE(tagOffset + 8);
        if (tagValueSize > tagSize) {
          throw invalid(`description tag value size out of bounds for ${tagSignature}`);
        }
        profile[tagMap[tagSignature]] = buffer.slice(tagOffset + 12, tagOffset + tagValueSize + 11).toString();
      }
      // text
      if (tagType === 'text') {
        profile[tagMap[tagSignature]] = buffer.slice(tagOffset + 8, tagOffset + tagSize - 7).toString();
      }
      if (tagType === 'mluc' && tagSignature in tagMap) {
        // 4 bytes signature, 4 bytes reserved (must be 0), 4 bytes number of names, 4 bytes name record size (must be 12)
        const numberOfNames = buffer.readUInt32BE(tagOffset + 8);
        const nameRecordSize = buffer.readUInt32BE(tagOffset + 12);
        if (nameRecordSize !== 12) {
          throw invalid(`mluc name record size must be 12 for tag ${tagSignature}`);
        }
        if (numberOfNames > 0) {
          // Entry: 2 bytes language code, 2 bytes country code, 4 bytes length, 4 bytes offset from start of tag
          // const languageCode = buffer.slice(tagOffset + 16, tagOffset + 18).toString();
          // const countryCode = buffer.slice(tagOffset + 18, tagOffset + 20).toString();
          const nameLength = buffer.readUInt32BE(tagOffset + 20);
          const nameOffset = buffer.readUInt32BE(tagOffset + 24);
          const nameStart = tagOffset + nameOffset;
          const nameStop = nameStart + nameLength;
          profile[tagMap[tagSignature]] = readStringUTF16BE(buffer, nameStart, nameStop);
        }
      }
      if (tagType === 'XYZ') {
        profile[tagMap[tagSignature]] = [
          buffer.readInt32BE(tagOffset + 8) / 65536,
          buffer.readInt32BE(tagOffset + 12) / 65536,
          buffer.readInt32BE(tagOffset + 16) / 65536
        ];
      }
      if (tagType === 'mft1' || tagType === 'mft2') {
        profile[tagMap[tagSignature]] = parseMft(buffer, tagOffset, tagType);
      }
    }
    tagHeaderOffset = tagHeaderOffset + 12;
  }
  return profile;
};
