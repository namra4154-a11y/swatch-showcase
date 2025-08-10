# Swatch Showcase

A modern web application for showcasing and managing fabric swatches with advanced filtering, search, and export capabilities.

## Features

- **Product Catalog**: Browse and search through fabric swatches with advanced filtering
- **Product Details**: View detailed information about each fabric swatch
- **Add Products**: Upload new fabric swatches with images
- **Export Functionality**: Export product data in XLSX format with optional image embedding
- **Modern UI**: Built with React, TypeScript, and Shadcn UI components

## Installation

1. Clone the repository
2. Install dependencies:

   ```bash
   npm install
   ```

3. **For XLSX Export Functionality**: Install additional dependencies:

   ```bash
   npm install xlsx file-saver
   ```

4. Set up your Supabase configuration in `src/integrations/supabase/client.ts`

5. Run the development server:
   ```bash
   npm run dev
   ```

## Export Features

### XLSX Export

- **Standard XLSX**: Export all product data in Excel format
- **XLSX with Images**: Export product data with embedded images (requires xlsx dependency)

### CSV Export

- Basic CSV export functionality (legacy)

## Dependencies

### Core Dependencies

- React 18
- TypeScript
- Tailwind CSS
- Shadcn UI Components

### Export Dependencies (Optional)

- `xlsx`: For Excel file generation
- `file-saver`: For file download handling

## Usage

1. **Browse Products**: Navigate to `/products` to view the product catalog
2. **Add Products**: Use `/add-product` to upload new fabric swatches
3. **Export Data**: Visit `/export` to download product data in various formats

## Notes

- The XLSX export with images feature requires the `xlsx` package to be installed
- Image embedding in Excel files is a complex process and may require additional configuration
- For production use, consider implementing proper error handling and user feedback
