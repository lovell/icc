'use strict';

// http://www.color.org/profileheader.xalter

const versionMap = {
  0x02000000: '2.0',
  0x02100000: '2.1',
  0x02400000: '2.4',
  0x04000000: '4.0',
  0x04200000: '4.2'
};

const intentMap = {
  0: 'Perceptual',
  1: 'Relative',
  2: 'Saturation',
  3: 'Absolute'
};

const valueMap = {
  // Device
  'scnr': 'Scanner',
  'mntr': 'Monitor',
  'prtr': 'Printer',
  'link': 'Link',
  'abst': 'Abstract',
  'spac': 'Space',
  'nmcl': 'Named color',
  // Platform
  'appl': 'Apple',
  'adbe': 'Adobe',
  'msft': 'Microsoft',
  'sunw': 'Sun Microsystems',
  'sgi': 'Silicon Graphics',
  'tgnt': 'Taligent'
};

const tagMap = {
  'desc': 'description',
  'cprt': 'copyright',
  'dmdd': 'deviceModelDescription',
  'vued': 'viewingConditionsDescription',
  'wtpt': 'whitepoint',
  'gamt': 'gamut',
  'kTRC': 'greyToneReproductionCurve',
  'A2B0': 'A2B0',
  'A2B1': 'A2B1',
  'A2B2': 'A2B2',
  'B2A0': 'B2A0',
  'B2A1': 'B2A1',
  'B2A2': 'B2A2'
};

const getContentAtOffsetAsString = (buffer, offset) => {
  const value = buffer.slice(offset, offset + 4).toString().trim();
  return (value.toLowerCase() in valueMap) ? valueMap[value.toLowerCase()] : value;
};

const hasContentAtOffset = (buffer, offset) => buffer.readUInt32BE(offset) !== 0;

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
  let readInt = () => {
    if (tagType === 'mft1') {
      offset += 1;
      return buffer.readUInt8(offset - 1);
    } else {
      offset += 2;
      return buffer.readUInt16BE(offset - 2);
    }
  };

  let inputCount = tagType === 'mft1' ? 256 : readInt();
  let outputCount = tagType === 'mft1' ? 256 : readInt();

  for (let j = 0; j < data.inputChannels; j++) {
    let table = [];
    for (let i = 0; i < inputCount; i++) {
      table.push(readInt());
    }
    data.input.push(table);
  }

  const getClutRecursive = dim => {
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
    let table = [];
    for (let i = 0; i < outputCount; i++) {
      table.push(readInt());
    }
    data.output.push(table);
  }

  return data;
};

module.exports.parse = (buffer) => {
  // Verify expected length
  const size = buffer.readUInt32BE(0);
  if (size !== buffer.length) {
    throw new Error('Invalid ICC profile: length mismatch');
  }
  // Verify 'acsp' signature
  const signature = buffer.slice(36, 40).toString();
  if (signature !== 'acsp') {
    throw new Error('Invalid ICC profile: missing signature');
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
        throw new Error('Invalid ICC profile: Tag offset out of bounds');
      }
      const tagType = getContentAtOffsetAsString(buffer, tagOffset);
      if (tagType === 'desc') {
        const tagValueSize = buffer.readUInt32BE(tagOffset + 8);
        if (tagValueSize > tagSize) {
          throw new Error('Invalid ICC profile: Description tag value size out of bounds for ' + tagSignature);
        }
        profile[tagMap[tagSignature]] = buffer.slice(tagOffset + 12, tagOffset + tagValueSize + 11).toString();
      } else if (tagType === 'text') {
        profile[tagMap[tagSignature]] = buffer.slice(tagOffset + 8, tagOffset + tagSize - 7).toString();
      } else if (tagType === 'mft1') {
        profile[tagMap[tagSignature]] = parseMft(buffer, tagOffset, tagType);
      } else if (tagType === 'mft2') {
        profile[tagMap[tagSignature]] = parseMft(buffer, tagOffset, tagType);
      } else if (tagType === 'curv') {
        const entryCount = buffer.readUInt32BE(tagOffset + 8);
        const entries = [];
        if (12 + 2 * entryCount > tagSize) {
          throw new Error('Invalid ICC profile: Curve tag value size out of bounds for ' + tagSignature);
        }
        for (let i = 0; i < entryCount; i++) {
          entries.push(buffer.readUInt16BE(tagOffset + 12 + 2 * i));
        }
        profile[tagMap[tagSignature]] = entries;
      } else if (tagType === 'XYZ') {
        profile[tagMap[tagSignature]] = [
          buffer.readInt32BE(tagOffset + 8) / 65536,
          buffer.readInt32BE(tagOffset + 12) / 65536,
          buffer.readInt32BE(tagOffset + 16) / 65536
        ];
      }
    }
    tagHeaderOffset = tagHeaderOffset + 12;
  }
  return profile;
};
