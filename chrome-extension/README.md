# BMV Finder Chrome Extension

A powerful Chrome extension that allows property investors to capture property data from real estate websites and build personalized watchlists.

## Features

- **One-Click Property Capture**: Capture property details from Rightmove, Zoopla, OnTheMarket, and PrimeLocation
- **Personal Watchlist**: Build and manage your own property watchlist
- **User Authentication**: Secure login with your BMV Finder account
- **Tier-Based Access**: Different features based on your subscription level
- **Cross-Platform Sync**: Access your watchlist from web, mobile, or desktop
- **Property Status Tracking**: Track properties as active, archived, sold, or withdrawn

## Supported Websites

- Rightmove.co.uk
- Zoopla.co.uk
- OnTheMarket.com
- PrimeLocation.com

## Installation

### For Development

1. Clone or download this extension folder
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the `chrome-extension` folder
5. The extension should now appear in your extensions list

### For Production

1. Visit the Chrome Web Store (link to be added)
2. Click "Add to Chrome"
3. Confirm the installation

## Usage

### First Time Setup

1. **Install the Extension**: Follow the installation instructions above
2. **Sign In**: Click the extension icon and sign in with your BMV Finder account
3. **Verify Membership**: The extension will check your subscription tier and enable appropriate features

### Capturing Properties

1. **Navigate to a Property**: Go to any property listing on a supported website
2. **Click the Capture Button**: Look for the floating "Capture Property" button in the top-right corner
3. **Confirm Capture**: The button will show a success message when the property is captured
4. **View in Watchlist**: Access your captured properties in your BMV Finder watchlist

### Managing Your Watchlist

1. **View Properties**: Visit `https://your-domain.com/watchlist` to see all captured properties
2. **Filter and Search**: Use the search and filter options to find specific properties
3. **Update Status**: Change property status (active, archived, sold, withdrawn)
4. **Delete Properties**: Remove properties you no longer need

## Subscription Tiers

### Free Tier
- Install and use the extension
- Basic property analysis features
- Cannot capture or save properties
- Cannot access watchlist

### Mid-Tier
- Capture up to 50 properties
- Full watchlist access
- Property status tracking
- Basic analytics

### Premium
- Unlimited property captures
- Advanced analytics
- Data export capabilities
- Priority support

## Technical Details

### Architecture

- **Manifest V3**: Uses the latest Chrome extension manifest format
- **Content Scripts**: Inject capture functionality into property websites
- **Background Service Worker**: Handles authentication and token management
- **Popup Interface**: User-friendly popup for extension management

### Data Capture

The extension captures the following property data:
- Property title and description
- Price
- Address and postcode
- Number of bedrooms and bathrooms
- Property type and tenure
- Agent information
- Property images
- Original listing URL
- Capture timestamp

### Security

- **Token-based Authentication**: Secure JWT tokens for user authentication
- **Data Encryption**: All data is encrypted in transit and at rest
- **Privacy Protection**: User data is never shared with third parties
- **Rate Limiting**: Built-in protection against abuse

## Development

### Project Structure

```
chrome-extension/
├── manifest.json          # Extension configuration
├── popup.html            # Extension popup interface
├── popup.css             # Popup styles
├── popup.js              # Popup functionality
├── content.js            # Content script for property capture
├── background.js         # Background service worker
├── content.css           # Content script styles
├── icons/                # Extension icons
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── README.md             # This file
```

### Building for Production

1. **Update Version**: Update the version in `manifest.json`
2. **Test Thoroughly**: Test on all supported websites
3. **Package Extension**: Zip the extension folder
4. **Submit to Chrome Web Store**: Follow Chrome Web Store submission guidelines

### API Endpoints

The extension communicates with the following backend endpoints:

- `POST /api/auth/verify` - Verify user authentication
- `GET /api/user/membership` - Check user subscription tier
- `POST /api/watchlist/add` - Add property to watchlist
- `GET /api/watchlist/count` - Get watchlist count

## Troubleshooting

### Common Issues

**Extension not appearing on property pages**
- Ensure you're on a supported website
- Check that the extension is enabled
- Refresh the page and try again

**Capture button not working**
- Verify you're on a property listing page
- Check your internet connection
- Ensure you're signed in to your BMV Finder account

**Authentication issues**
- Sign out and sign back in
- Clear browser cache and cookies
- Check your subscription status

**Data not syncing**
- Check your internet connection
- Verify your account is active
- Try refreshing the page

### Debug Mode

To enable debug mode:
1. Open Chrome DevTools
2. Go to the Console tab
3. Look for extension-related messages
4. Check the Network tab for API calls

## Legal and Compliance

### Terms of Service
- The extension is for personal use only
- Users must comply with third-party website terms
- Bulk scraping is prohibited
- Users are responsible for legal compliance

### Privacy
- User data is encrypted and secure
- No personal information is shared
- Users can delete their data at any time
- GDPR compliant

### Third-Party Compliance
- Respects website rate limits
- Manual capture only (no automation)
- Follows robots.txt guidelines
- User-initiated actions only

## Support

### Getting Help

1. **Documentation**: Check this README and the main website documentation
2. **FAQ**: Visit the support section on the main website
3. **Contact**: Email support@your-domain.com for technical issues
4. **Community**: Join our user community for tips and discussions

### Reporting Issues

When reporting issues, please include:
- Chrome version
- Extension version
- Website URL where the issue occurred
- Steps to reproduce the problem
- Screenshots if applicable

## Contributing

We welcome contributions! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This extension is proprietary software. All rights reserved.

## Changelog

### Version 1.0.0
- Initial release
- Basic property capture functionality
- User authentication
- Watchlist management
- Support for major UK property websites

---

For more information, visit [BMV Finder](https://your-domain.com) or contact us at support@your-domain.com 