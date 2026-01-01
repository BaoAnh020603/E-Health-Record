# Medical Records Mobile App

A React Native mobile application built with Expo for managing medical records, connecting to a Supabase backend.

## Features

### Authentication
- **CCCD-based Registration**: Register using Vietnamese Citizen ID (CCCD)
- **Secure Login**: Login with CCCD and password
- **Profile Management**: Update personal information and BHYT details

### Medical Records Management
- **Create Records**: Add new medical examination records
- **View Records**: Browse and search through medical history
- **Record Details**: View comprehensive information about each medical visit
- **File Attachments**: Upload and manage medical documents, test results, and images

### Sharing & QR Code
- **Share Tokens**: Create secure sharing tokens for medical records
- **QR Code Generation**: Generate QR codes for easy sharing with healthcare providers
- **QR Code Scanner**: Scan QR codes to access shared medical records
- **Access Control**: Manage sharing permissions and expiration times

### User Interface
- **Modern Design**: Clean, intuitive interface optimized for mobile
- **Vietnamese Language**: Full Vietnamese language support
- **Dark/Light Theme**: Responsive design with proper color schemes
- **Navigation**: Bottom tab navigation with stack navigation for details

## Tech Stack

- **Framework**: React Native with Expo
- **Navigation**: React Navigation v6
- **Backend**: Supabase (PostgreSQL, Authentication, Storage)
- **UI Components**: React Native Paper, Expo Vector Icons
- **Camera**: Expo Camera, Expo Barcode Scanner
- **File Handling**: Expo Image Picker, Expo Document Picker, Expo File System

## Installation

1. **Prerequisites**:
   ```bash
   npm install -g @expo/cli
   ```

2. **Install Dependencies**:
   ```bash
   cd MobileApp
   npm install
   ```

3. **Start Development Server**:
   ```bash
   npm start
   ```

4. **Run on Device**:
   - Install Expo Go app on your mobile device
   - Scan the QR code from the terminal
   - Or use `npm run android` / `npm run ios` for simulators

## Configuration

The app is pre-configured to connect to your Supabase backend:
- **Supabase URL**: `https://aadydqifnwrcbjtxanje.supabase.co`
- **Anon Key**: Configured in `lib/supabase.ts`

## Project Structure

```
MobileApp/
├── lib/
│   └── supabase.ts          # Supabase client configuration
├── services/
│   ├── auth.ts              # Authentication services
│   ├── medicalRecords.ts    # Medical records CRUD operations
│   ├── shareToken.ts        # Sharing and QR code services
│   └── fileUpload.ts        # File upload and management
├── navigation/
│   └── AppNavigator.tsx     # Navigation configuration
├── screens/
│   ├── auth/
│   │   ├── LoginScreen.tsx
│   │   └── RegisterScreen.tsx
│   └── main/
│       ├── HomeScreen.tsx
│       ├── MedicalRecordsScreen.tsx
│       ├── RecordDetailScreen.tsx
│       ├── CreateRecordScreen.tsx
│       ├── ProfileScreen.tsx
│       ├── ShareScreen.tsx
│       └── QRScannerScreen.tsx
└── App.tsx                  # Main app component
```

## Key Features Implementation

### Authentication Flow
- CCCD-based registration with profile creation
- Secure login with session management
- Automatic navigation based on authentication state

### Medical Records
- Full CRUD operations for medical records
- Search and filter functionality
- File attachment support with cloud storage
- Offline-ready data structure

### Sharing System
- Secure token-based sharing
- QR code generation and scanning
- Time-limited access control
- Access logging and management

### Mobile-Optimized Features
- Camera integration for document scanning
- File picker for medical documents
- Responsive design for various screen sizes
- Native navigation patterns

## Backend Integration

The app integrates with your existing Supabase backend:
- **Database**: Uses the same PostgreSQL schema
- **Authentication**: Supabase Auth with custom CCCD logic
- **Storage**: Supabase Storage for medical documents
- **Edge Functions**: Integrates with sharing and validation functions

## Security Features

- **Row Level Security**: All data access is user-scoped
- **Secure File Storage**: Medical documents stored with proper access controls
- **Token-based Sharing**: Time-limited, revocable sharing tokens
- **Input Validation**: Comprehensive client-side and server-side validation

## Development

### Adding New Features
1. Create service functions in `services/`
2. Add screens in `screens/`
3. Update navigation in `navigation/AppNavigator.tsx`
4. Test on both iOS and Android

### Debugging
- Use Expo DevTools for debugging
- Check network requests in Flipper or browser dev tools
- Use React Native Debugger for advanced debugging

## Deployment

### Development Build
```bash
expo build:android
expo build:ios
```

### Production Build
```bash
expo build:android --type app-bundle
expo build:ios --type archive
```

## Contributing

1. Follow React Native and Expo best practices
2. Maintain TypeScript strict mode
3. Add proper error handling and loading states
4. Test on both platforms before committing
5. Keep Vietnamese language consistency

## Support

For issues related to:
- **Backend**: Check Supabase dashboard and logs
- **Mobile App**: Use Expo CLI debugging tools
- **Authentication**: Verify Supabase Auth configuration
- **File Upload**: Check Supabase Storage permissions