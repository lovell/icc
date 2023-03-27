// Copyright 2015 Lovell Fuller and others.
// SPDX-License-Identifier: Apache-2.0

/// <reference types="node" />

type Version = '2.0' | '2.1' | '2.4' | '4.0' | '4.2' | '4.3' | '4.4';
type Intent = 'Perceptual' | 'Relative' | 'Saturation' | 'Absolute';

type DeviceClass = 'Scanner' | 'Monitor' | 'Printer' | 'Link' | 'Abstract' | 'Space' | 'Named color';
type Platform = 'Apple' | 'Adobe' | 'Microsoft' | 'Sun Microsystems' | 'Silicon Graphics' | 'Taligent';
type Whitepoint = [number, number, number];

export interface IccProfile {
    version: Version;
    intent: Intent;

    cmm?: string;
    colorSpace?: string;
    connectionSpace?: string;
    copyright?: string;
    creator?: string;
    description?: string;
    deviceClass?: DeviceClass;
    deviceModelDescription?: string;
    manufacturer?: string;
    model?: string;
    platform?: Platform;
    viewingConditionsDescription?: string;
    whitepoint?: Whitepoint;
}

export function parse(buffer: Buffer): IccProfile;
