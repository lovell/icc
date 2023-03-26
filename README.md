# icc

JavaScript module to parse International Color Consortium (ICC) profiles.

## Installation

	npm install icc

## Usage

```javascript
import { parse } from 'icc';
const profileData = fs.readFileSync('sRGB_IEC61966-2-1_black_scaled.icc');
const profile = parse(profileData);
console.dir(profile);
```
outputs:
```
{ version: '2.0',
  intent: 'Perceptual',
  deviceClass: 'Monitor',
  colorSpace: 'RGB',
  connectionSpace: 'XYZ',
  description: 'sRGB IEC61966-2-1 black scaled',
  deviceModelDescription: 'IEC 61966-2-1 Default RGB Colour Space - sRGB',
  viewingConditionsDescription: 'Reference Viewing Condition in IEC 61966-2-1',
  copyright: 'Copyright International Color Consortium'}
```

## API

### parse(data)

Parses `data`, a Buffer containing a raw ICC profile, returning an Object of key/value pairs.

## Licence

Copyright 2015 Lovell Fuller and others

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at
[http://www.apache.org/licenses/LICENSE-2.0](http://www.apache.org/licenses/LICENSE-2.0.html)

Unless required by applicable law or agreed to in writing,
software distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and limitations under the License.
