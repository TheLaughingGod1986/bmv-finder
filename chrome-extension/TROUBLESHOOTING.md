# Chrome Extension Troubleshooting Guide

## Common Issues and Solutions

### 1. Extension Button Not Appearing

**Symptoms:**
- No "🏠 Capture Property" button visible on property pages
- Console shows "Chrome extension APIs not available"

**Solutions:**
1. **Check Extension Installation:**
   - Go to `chrome://extensions/`
   - Ensure "Property Intelligence Platform - Property Capture" is installed and enabled
   - Toggle the extension off and on again

2. **Check Permissions:**
   - Click "Details" on the extension
   - Ensure it has permission for the websites you're testing on
   - Add specific sites if needed

3. **Clear Browser Cache:**
   - Hard refresh the page: `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (Mac)
   - Clear browser cache and cookies for the site

4. **Check Console Errors:**
   - Open Developer Tools (F12)
   - Look for JavaScript errors in the Console tab
   - Check for any blocked content or CORS issues

### 2. Authentication Issues

**Symptoms:**
- Button appears but shows "Authentication required" message
- Cannot capture properties even when signed in

**Solutions:**
1. **Sign In to Extension:**
   - Click the extension icon in the toolbar
   - Click "Sign In" button
   - Complete authentication process

2. **Check Account Status:**
   - Ensure you have a valid Property Intelligence Platform account
   - Verify your subscription tier allows property capture

3. **Clear Extension Storage:**
   - Go to `chrome://extensions/`
   - Find the extension and click "Details"
   - Click "Clear Data" to reset authentication

### 3. Property Data Not Capturing Correctly

**Symptoms:**
- Button works but captured data is incomplete or incorrect
- Missing price, address, or other property details

**Solutions:**
1. **Test on Supported Sites:**
   - Rightmove.co.uk
   - Zoopla.co.uk
   - OnTheMarket.com
   - PrimeLocation.com

2. **Use Test Page:**
   - Open `chrome-extension/test-extension.html` in your browser
   - Click "Test Extraction" to see what data is being captured
   - Check console for detailed extraction results

3. **Check Page Structure:**
   - Ensure you're on a property listing page, not a search results page
   - Property pages typically have URLs like `/properties/` or `/for-sale/`

### 4. Extension Communication Errors

**Symptoms:**
- "Extension communication error" message
- Button shows error state

**Solutions:**
1. **Restart Extension:**
   - Go to `chrome://extensions/`
   - Toggle the extension off and on
   - Refresh the property page

2. **Check Background Script:**
   - Open Developer Tools
   - Go to "Application" tab
   - Check "Service Workers" for any errors

3. **Update Extension:**
   - Ensure you have the latest version of the extension
   - Reinstall if necessary

### 5. Development Server Issues

**Symptoms:**
- Extension works but properties aren't saved to the platform
- API errors in console

**Solutions:**
1. **Check Development Server:**
   - Ensure `npm run dev` is running
   - Check that `http://localhost:3000` is accessible
   - Verify API endpoints are working

2. **Check Environment Variables:**
   - Ensure `.env.local` has correct Supabase credentials
   - Verify API URLs are correct

3. **Clear Next.js Cache:**
   ```bash
   rm -rf .next
   npm run dev
   ```

## Testing the Extension

### Step-by-Step Test Process

1. **Load Test Page:**
   ```
   file:///path/to/chrome-extension/test-extension.html
   ```

2. **Check Extension Button:**
   - Should appear in top-right corner
   - Should show "🏠 Capture Property" text

3. **Test Extraction:**
   - Click "🔍 Test Extraction" button
   - Check console for property data output

4. **Test Authentication:**
   - Click "🏠 Capture Property" button
   - Should prompt for authentication if not signed in

5. **Test Real Sites:**
   - Go to a property on Rightmove or Zoopla
   - Test the capture functionality

### Debug Information

**Console Logs to Look For:**
- `Property Intelligence Platform: Content script loaded`
- `Property Intelligence Platform: Test Results:`
- `✅ Chrome extension button found!`
- `❌ Chrome extension button not found`

**Common Error Messages:**
- `Chrome storage API not available` - Extension not properly loaded
- `Authentication required` - Need to sign in
- `Extension communication error` - Background script issue
- `Invalid property data` - Page structure not recognized

## Getting Help

If you're still experiencing issues:

1. **Check the Console:**
   - Open Developer Tools (F12)
   - Look for error messages and warnings
   - Copy any relevant error messages

2. **Test on Different Sites:**
   - Try Rightmove, Zoopla, OnTheMarket
   - Use the test page for basic functionality

3. **Check Extension Status:**
   - Go to `chrome://extensions/`
   - Look for any error messages or warnings
   - Check if the extension is enabled

4. **Restart Everything:**
   - Restart the development server
   - Restart the Chrome extension
   - Restart the browser

## Extension Features

### Supported Websites
- Rightmove.co.uk
- Zoopla.co.uk
- OnTheMarket.com
- PrimeLocation.com

### Captured Data
- Property title and address
- Price information
- Number of bedrooms and bathrooms
- Property type and tenure
- Property images
- Agent information
- Original listing URL

### Authentication Requirements
- Must be signed in to Property Intelligence Platform
- Valid account with appropriate subscription tier
- Extension must be properly authenticated 