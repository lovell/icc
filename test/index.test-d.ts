/*!
  Copyright 2015 Lovell Fuller and others.
  SPDX-License-Identifier: Apache-2.0
*/

import { parse, type IccProfile } from '../';

const buffer: Buffer = Buffer.alloc(0);

const iccProfile: IccProfile = parse(buffer);

const {
  version,
  intent,
  colorSpace,
  connectionSpace,
  copyright,
  description,
  deviceClass,
  deviceModelDescription,
  platform,
  whitepoint,
} = iccProfile;

console.log({
  version,
  intent,
  colorSpace,
  connectionSpace,
  copyright,
  description,
  deviceClass,
  deviceModelDescription,
  platform,
  whitepoint,
});
