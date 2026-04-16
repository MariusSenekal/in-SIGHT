# in-SIGHT - QR Code Record Manager

A simple Nuxt 3 application for managing cleaning records with QR code functionality.

## Features

- 📋 View 3 cleaning records
- 🔍 Click on any record to see details
- 📱 Generate QR codes for each record
- 🖨️ Print QR codes
- ✅ Scan QR codes to instantly view record information

## How It Works

1. **Home Page**: Displays 3 cleaning records in an attractive card layout
2. **Record Detail Page**: Shows full record details with a QR code
3. **Scan Page**: When you scan a QR code, it takes you to this page showing the record name and details

## Getting Started

### Install Dependencies

```bash
npm install
```

### Run Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

### Build for Production

```bash
npm run build
npm run preview
```

## Docker

### Build and run locally

```bash
docker build -t insight:latest --build-arg NUXT_APP_BASE_URL=/login/ .
docker run --rm -p 3007:3000 insight:latest
```

Then open: http://localhost:3007/login/

## Simple server deploy (OCI)

This repository includes a one-command deploy script that:

- Uploads project files over SSH
- Builds a Docker image on the server
- Replaces only the `insight` container
- Configures Nginx for `in-sight.app` and `/login`
- Issues or renews a Let's Encrypt certificate for HTTPS
- Reloads Nginx safely

### Run deployment

```bash
chmod +x deploy.sh
./deploy.sh
```

After deployment, the app is available at:

https://in-sight.app/login/

## Usage

1. Open the application in your browser
2. Click on any of the 3 records to view details
3. A QR code will be displayed on the record detail page
4. Click "Print QR Code" to print it
5. Scan the QR code with any device
6. The scanned QR code will show the record name and details

## Technology Stack

- **Nuxt 3**: Vue.js framework
- **Vue 3**: Progressive JavaScript framework
- **qrcode.vue**: QR code generation library
- **TypeScript**: Type-safe JavaScript

## Customization

To add more records, edit the `composables/useRecords.ts` file and add new record objects to the `records` array.

## License

MIT
