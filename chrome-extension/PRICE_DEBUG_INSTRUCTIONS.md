# 🔍 Price Extraction Debug Instructions

## The Problem
The Chrome extension is not extracting the correct price from Rightmove/Zoopla property pages.

## How to Debug

### Step 1: Reload the Extension
1. Go to `chrome://extensions/` in your browser
2. Find the BMV Finder extension
3. Click the refresh/reload button (🔄)
4. Or toggle it off and on

### Step 2: Test on a Property Page
1. Go to a Rightmove or Zoopla property page
2. Open browser console (F12 → Console tab)
3. Copy and paste the contents of `debug-price-extraction.js` into the console
4. Press Enter to run the debug script

### Step 3: Check the Results
The debug script will show:
- Which selectors found elements
- Which elements contain price information
- What price patterns were found in the page text
- The largest reasonable price found

### Step 4: Test the Extension
1. Click the "🔍 Test Extraction" button (gold button) on the property page
2. Check what price it extracts
3. Compare with the actual price on the page

### Step 5: Report Back
Tell me:
1. What price is shown on the property page
2. What price the extension extracts
3. What the debug script found (copy the console output)

## Quick Test
If you want to quickly test without the debug script:
1. Reload the extension
2. Go to a property page
3. Click the "🔍 Test Extraction" button
4. Check the alert popup for the extracted price

## Common Issues
- Extension not reloaded (most common)
- Page not fully loaded when extension runs
- Rightmove/Zoopla changed their HTML structure
- Price is in a different format than expected 