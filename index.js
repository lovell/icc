'use strict';

// http://www.color.org/profileheader.xalter

var versionMap = {
  0x02000000: '2.0',
  0x02100000: '2.1',
  0x02400000: '2.4',
  0x04000000: '4.0',
  0x04200000: '4.2'
};

var intentMap = {
  0: 'Perceptual',
  1: 'Relative',
  2: 'Saturation',
  3: 'Absolute'
};

var valueMap = {
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
  'sgi' : 'Silicon Graphics',
  'tgnt': 'Taligent'
};

var tagMap = {
  'desc': 'description',
  'cprt': 'copyright',
  'dmdd': 'deviceModelDescription',
  'vued': 'viewingConditionsDescription'
};

var getContentAtOffsetAsString = function(buffer, offset) {
  var value = buffer.slice(offset, offset + 4).toString().trim();
  return (value.toLowerCase() in valueMap) ? valueMap[value.toLowerCase()] : value;
};

var hasContentAtOffset = function(buffer, offset) {
  return (buffer.readUInt32BE(offset) !== 0);
};

module.exports.parse = function(buffer) {
  // Verify expected length
  var size = buffer.readUInt32BE(0);
  if (size !== buffer.length) {
    throw new Error('Invalid ICC profile: length mismatch');
  }
  // Verify 'acsp' signature
  var signature = buffer.slice(36, 40).toString();
  if (signature !== 'acsp') {
    throw new Error('Invalid ICC profile: missing signature');
  }
  // Integer attributes
  var profile = {
    version: versionMap[buffer.readUInt32BE(8)],
    intent: intentMap[buffer.readUInt32BE(64)]
  };
  // Four-byte string attributes
  [
    [ 4, 'cmm'],
    [12, 'deviceClass'],
    [16, 'colorSpace'],
    [20, 'connectionSpace'],
    [40, 'platform'],
    [48, 'manufacturer'],
    [52, 'model'],
    [80, 'creator']
  ].forEach(function(attr) {
    if (hasContentAtOffset(buffer, attr[0])) {
      profile[attr[1]] = getContentAtOffsetAsString(buffer, attr[0]);
    }
  });
  // Tags
  var tagCount = buffer.readUInt32BE(128);
  var tagHeaderOffset = 132;
  for (var i = 0; i < tagCount; i++) {
    var tagSignature = getContentAtOffsetAsString(buffer, tagHeaderOffset);
    if (tagSignature in tagMap) {
      var tagOffset = buffer.readUInt32BE(tagHeaderOffset + 4);
      var tagSize = buffer.readUInt32BE(tagHeaderOffset + 8);
      if (tagOffset > buffer.length) {
        throw new Error('Invalid ICC profile: Tag offset out of bounds');
      }
      var tagType = getContentAtOffsetAsString(buffer, tagOffset);
      // desc
      if (tagType === 'desc') {
        var tagValueSize = buffer.readUInt32BE(tagOffset + 8);
        if (tagValueSize > tagSize) {
          throw new Error('Invalid ICC profile: Description tag value size out of bounds for ' + tagSignature);
        }
        profile[tagMap[tagSignature]] = buffer.slice(tagOffset + 12, tagOffset + tagValueSize + 11).toString();
      }
      // text
      if (tagType === 'text') {
        profile[tagMap[tagSignature]] = buffer.slice(tagOffset + 8, tagOffset + tagSize - 7).toString();
      }
    }
    tagHeaderOffset = tagHeaderOffset + 12;
  }
  return profile;
};
