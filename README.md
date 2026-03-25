# Nepali News Ad Blocker

A small **Chrome / Edge** extension (Manifest V3) that hides ads on major Nepali news and related sites using safe cosmetic rules—without the broad `*ad*` selectors that break menus.

## Download

- **ZIP:** On the GitHub repo page, **Code → Download ZIP**, then extract.
- **Git:** `git clone` the repo URL shown under the green **Code** button.

## Install (Chrome or Edge)

1. Open **`chrome://extensions`** (Chrome) or **`edge://extensions`** (Edge).
2. Turn on **Developer mode** (toggle in the corner).
3. Click **Load unpacked**.
4. Choose the project folder that contains **`manifest.json`** (not a parent folder).

You should see **Nepali News Ad Blocker** in the list. Visit a supported news site and reload the page if needed.

## Update

After `git pull` or re-downloading: go to **Extensions**, click **Reload** on this extension.

## Notes

- This extension **hides elements** on the allowlisted domains only. For stronger blocking (e.g. image requests), pair with [uBlock Origin](https://github.com/gorhill/uBlock) and optionally [nepali-adblock-list](https://github.com/dallae/nepali-adblock-list).
