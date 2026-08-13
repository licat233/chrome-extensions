# ARMOR Form Extractor

A Chrome extension designed for the ARMOR website to extract and copy inquiry form data with one click.

![ARMOR Brand](armor-icon.svg)

## Features

- One-click extraction of all form field data from the current page
- Copy as **Plain Text**, **JSON**, or **Markdown**
- Screenshot-style image copy to clipboard
- Inline editing of extracted values before copying
- Auto-matched Font Awesome icons for each field type
- Smooth entrance animations powered by Animate.css
- ARMOR brand visual identity: ice-blue palette and blue-to-green gradient

## Installation

### Method 1: Load Unpacked Extension (Recommended for Development)

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable **Developer mode** in the top-right corner
3. Click **Load unpacked** and select this project folder
4. The extension icon will appear in your Chrome toolbar

### Method 2: Install from .crx Package

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable **Developer mode**
3. Drag and drop the `chrome-ext-extract-form.crx` file into the extensions page

> **Note:** Chrome 79+ may auto-disable extensions installed this way. Use Method 3 for a permanent installation.

### Method 3: macOS Configuration Profile (Permanent)

For macOS users who want the extension to stay enabled permanently:

1. Double-click the `armor-extension.mobileconfig` file in this repository
2. Follow the prompts to install the configuration profile in **System Settings > Privacy & Security > Profiles**
3. Restart Chrome
4. Verify the policy is active at `chrome://policy/`

> This method uses a macOS configuration profile to whitelist the extension via Chrome enterprise policy, preventing Chrome from disabling it.

## Usage

1. Navigate to a page with a form on the ARMOR website
2. Click the extension icon in the Chrome toolbar
3. The popup displays all detected form fields with icons
4. Choose your preferred export format from the dropdown
5. Click **Copy All** to copy to clipboard, or **Screenshot** to copy as an image
6. Click any field value to edit it inline before copying

## Project Structure

```
chrome-ext-extract-form/
├── manifest.json              # Extension manifest
├── popup.html                 # Popup UI markup
├── popup.css                  # ARMOR brand styled CSS
├── popup.js                   # Popup logic and field extraction
├── content.js                 # Content script for page scanning
├── armor-icon.svg             # ARMOR brand logo
├── css/
│   ├── all.min.css            # Font Awesome 6 Free
│   └── animate.min.css        # Animate.css
├── webfonts/                  # Font Awesome webfonts
│   ├── fa-brands-400.woff2
│   ├── fa-regular-400.woff2
│   └── fa-solid-900.woff2
├── chrome-ext-extract-form.crx  # Packaged extension
├── chrome-ext-extract-form.pem  # Extension signing key
└── armor-extension.mobileconfig # macOS installation profile
```

## Brand Identity

This extension follows the **ARMOR Brand Visual Strategy**:

- **Primary Color:** Ice Blue `#A5D8FF`
- **Gradient:** Blue to Green `linear-gradient(150deg, #55A7E9, #95E05B)`
- **Keywords:** Minimalist, Seamless, Precision, Guardian, Radiant

## License

Private — for ARMOR (华芒光电) internal use.
