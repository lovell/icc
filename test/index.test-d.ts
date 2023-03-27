// Copyright 2015 Lovell Fuller and others.
// SPDX-License-Identifier: Apache-2.0

import { parse, IccProfile } from '../';

const buffer: Buffer = Buffer.alloc(0);

const iccProfile: IccProfile = parse(buffer);

const { version, intent } = iccProfile;
