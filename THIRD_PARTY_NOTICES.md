# Third-party notices

The root [`LICENSE`](LICENSE) (MIT, The Sips authors) covers Sips' own source code. The agent
skills below were vendored or adapted from other projects. They stay under their upstream
licenses and copyright, all MIT, and are not relicensed by this repository.

| Directory | Upstream | License | Copyright |
|---|---|---|---|
| [`.agents/skills/playwright-best-practices/`](.agents/skills/playwright-best-practices/) | [currents-dev/playwright-best-practices-skill](https://github.com/currents-dev/playwright-best-practices-skill) | MIT ([LICENSE.md](.agents/skills/playwright-best-practices/LICENSE.md)) | © 2026 Currents Software Inc. |
| [`.agents/skills/karpathy-coding-discipline/`](.agents/skills/karpathy-coding-discipline/) | Adapted for Sips from [multica-ai/andrej-karpathy-skills](https://github.com/multica-ai/andrej-karpathy-skills) (formerly `forrestchang/andrej-karpathy-skills`) | MIT, as declared in the upstream README | The upstream project's authors |

The other skills in `.agents/skills/` (`cross-model-review`, `publish-post`, `sips-design-loop`,
`sips-onboarding`) are Sips' own and fall under the root `LICENSE`.

## Fonts

The share-image routes (`lib/og.tsx`) draw text with static font files in
[`assets/fonts/`](assets/fonts/), downloaded from Google Fonts. Each is licensed under the
[SIL Open Font License 1.1](https://openfontlicense.org) by its authors: Caveat (The Caveat
Project Authors), Instrument Serif (The Instrument Serif Project Authors), IBM Plex Mono (IBM
Corp.) and Plus Jakarta Sans (The Plus Jakarta Sans Project Authors). The site itself loads the
same families through `next/font/google`. The license text and each family's copyright notice
ship with the files in [`assets/fonts/OFL.txt`](assets/fonts/OFL.txt).

## MIT License text

The upstream projects above are distributed under the MIT License, whose terms are:

> Permission is hereby granted, free of charge, to any person obtaining a copy of this software
> and associated documentation files (the "Software"), to deal in the Software without
> restriction, including without limitation the rights to use, copy, modify, merge, publish,
> distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the
> Software is furnished to do so, subject to the following conditions:
>
> The above copyright notice and this permission notice shall be included in all copies or
> substantial portions of the Software.
>
> THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING
> BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
> NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
> DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
> OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
