# BMV Finder Mobile App

A React Native mobile application for property investment analysis and market insights, built with Expo and TypeScript.

## 🚀 Features

### Core Features
- **Property Search**: Advanced search with filters and radius-based queries
- **HPI Analysis**: Detailed House Price Index analysis with historical data
- **Predictions**: AI-powered property value predictions with confidence scores
- **Market Insights**: Real-time market trends and hot areas
- **Saved Properties**: Save and manage favorite properties
- **User Account**: Profile management and activity tracking

### Technical Features
- **Cross-platform**: iOS and Android support
- **Offline Support**: Cached data and offline functionality
- **Push Notifications**: Real-time alerts for market changes
- **Location Services**: GPS-based property discovery
- **Social Sharing**: Share properties and analyses
- **Dark Mode**: User preference for dark/light themes

## 📱 Screenshots

### Home Screen
- Featured properties with HPI growth indicators
- Quick search functionality
- Market insights overview
- Quick action buttons

### Search Screen
- Advanced filtering options
- Property listings with detailed information
- HPI analysis integration
- Save and share functionality

### Predictions Screen
- AI-powered property value predictions
- Confidence scoring
- Market trend analysis
- Saved predictions management

### Account Screen
- User profile management
- Activity statistics
- Settings and preferences
- Support and legal information

## 🛠 Tech Stack

- **Framework**: React Native with Expo
- **Language**: TypeScript
- **Navigation**: React Navigation v6
- **Icons**: Expo Vector Icons (Ionicons)
- **State Management**: React Hooks
- **Styling**: StyleSheet API
- **Build Tool**: Expo CLI

## 📋 Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Expo CLI
- iOS Simulator (for iOS development)
- Android Studio (for Android development)

## 🚀 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd mobile-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Start the development server**
   ```bash
   npm start
   # or
   yarn start
   ```

4. **Run on device/simulator**
   ```bash
   # iOS
   npm run ios
   
   # Android
   npm run android
   
   # Web (for testing)
   npm run web
   ```

## 📁 Project Structure

```
mobile-app/
├── App.tsx                 # Main app component with navigation
├── package.json           # Dependencies and scripts
├── app.json              # Expo configuration
├── src/
│   ├── screens/          # Screen components
│   │   ├── HomeScreen.tsx
│   │   ├── SearchScreen.tsx
│   │   ├── PredictionsScreen.tsx
│   │   ├── AccountScreen.tsx
│   │   ├── PropertyDetailScreen.tsx
│   │   └── HpiAnalysisScreen.tsx
│   ├── components/       # Reusable components
│   ├── services/         # API services
│   ├── utils/           # Utility functions
│   ├── types/           # TypeScript type definitions
│   └── constants/       # App constants
├── assets/              # Images, fonts, etc.
└── docs/               # Documentation
```

## 🎨 Design System

### Color Palette
- **Primary Blue**: #3A7CA5 (Main brand color)
- **Primary Green**: #5DA271 (Success/positive actions)
- **Accent Gold**: #D4AF37 (Highlights and premium features)
- **Neutral Beige**: #F5F5DC (Background)
- **Neutral Grey**: #E5E5E5 (Borders and dividers)

### Typography
- **Headings**: Bold, 18-28px
- **Body Text**: Regular, 14-16px
- **Captions**: Light, 12-14px

### Components
- **Cards**: Rounded corners, subtle shadows
- **Buttons**: Consistent padding, rounded corners
- **Inputs**: Clean borders, clear focus states
- **Icons**: Ionicons for consistency

## 🔧 Configuration

### Environment Variables
Create a `.env` file in the root directory:

```env
API_BASE_URL=https://your-api-domain.com
GOOGLE_MAPS_API_KEY=your-google-maps-api-key
SENTRY_DSN=your-sentry-dsn
```

### Expo Configuration
Update `app.json` with your app details:

```json
{
  "expo": {
    "name": "BMV Finder",
    "slug": "bmv-finder-mobile",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#3A7CA5"
    },
    "ios": {
      "bundleIdentifier": "com.bmvfinder.mobile"
    },
    "android": {
      "package": "com.bmvfinder.mobile"
    }
  }
}
```

## 📱 Building for Production

### iOS Build
```bash
# Build for iOS
expo build:ios

# Or use EAS Build
eas build --platform ios
```

### Android Build
```bash
# Build for Android
expo build:android

# Or use EAS Build
eas build --platform android
```

### Publishing Updates
```bash
# Publish to Expo
expo publish

# Or use EAS Update
eas update
```

## 🔌 API Integration

### Base Configuration
The app integrates with the BMV Finder API for:
- Property search and filtering
- HPI data retrieval
- User authentication
- Analytics tracking

### API Endpoints
- `GET /api/properties` - Property search
- `GET /api/hpi/{postcode}` - HPI analysis
- `POST /api/predictions` - Generate predictions
- `GET /api/analytics/business` - Business metrics

## 🧪 Testing

### Unit Tests
```bash
npm test
```

### E2E Tests
```bash
npm run test:e2e
```

### Manual Testing Checklist
- [ ] Property search functionality
- [ ] HPI analysis accuracy
- [ ] Prediction generation
- [ ] User account management
- [ ] Offline functionality
- [ ] Push notifications
- [ ] Social sharing
- [ ] Dark mode toggle

## 🚀 Deployment

### App Store (iOS)
1. Build the app using EAS Build
2. Upload to App Store Connect
3. Submit for review

### Google Play Store (Android)
1. Build the app using EAS Build
2. Upload to Google Play Console
3. Submit for review

### Over-the-Air Updates
```bash
eas update --branch production --message "Bug fixes and improvements"
```

## 📊 Analytics

The app includes analytics tracking for:
- User engagement metrics
- Feature usage statistics
- Performance monitoring
- Error tracking

### Key Metrics
- Daily/Monthly Active Users
- Property search volume
- Prediction accuracy
- User retention rates

## 🔒 Security

### Data Protection
- Secure API communication (HTTPS)
- Local data encryption
- User authentication
- Privacy compliance (GDPR)

### Best Practices
- Input validation
- Secure storage
- Regular security updates
- Penetration testing

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

### Code Style
- Use TypeScript for type safety
- Follow React Native best practices
- Use functional components with hooks
- Maintain consistent naming conventions

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

### Documentation
- [Expo Documentation](https://docs.expo.dev/)
- [React Native Documentation](https://reactnative.dev/)
- [API Documentation](https://api.bmvfinder.com/docs)

### Community
- [GitHub Issues](https://github.com/bmvfinder/mobile-app/issues)
- [Discord Community](https://discord.gg/bmvfinder)
- [Email Support](mailto:support@bmvfinder.com)

## 🔄 Changelog

### v1.0.0 (Current)
- Initial release
- Core property search functionality
- HPI analysis features
- User account management
- Cross-platform support

### Upcoming Features
- Advanced filtering options
- Real-time notifications
- Offline mode improvements
- Social features
- Advanced analytics dashboard

## 📈 Performance

### Optimization Tips
- Use React.memo for expensive components
- Implement lazy loading for images
- Optimize bundle size
- Use performance monitoring tools

### Benchmarks
- App launch time: < 3 seconds
- Search response time: < 2 seconds
- Smooth 60fps animations
- < 100MB app size

---

**Built with ❤️ by the BMV Finder team** 