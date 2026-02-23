# Company Logos Folder

## 📁 Company Logos Installed

Your portfolio now includes professional company logos!

### ✅ Current Logos:
- **apple-logo.svg** - Official Apple logo (SVG format)
- **handshake-logo.svg** - Handshake logo (SVG format)

### 📋 Logo Specifications:
- **Format:** SVG (scalable, perfect quality at any size)
- **Size:** Optimized for web display
- **Type:** Vector graphics (crisp on all screens)
- **Color:** Matches company branding

---

## 🎨 Add More Company Logos

### Method 1: Upload via Admin Panel
1. Go to: `http://localhost:3000/admin`
2. Click "Experience" tab
3. Find your company
4. Click "Upload" button next to "Company Logo"
5. Select logo file from computer
6. Save changes!

### Method 2: Add Files Manually
1. Place logo file in this folder: `/public/companies/`
2. Name it: `company-name-logo.svg` or `.png`
3. In admin panel, enter path: `/companies/company-name-logo.svg`
4. Save changes!

---

## 📐 Recommended Specifications

### Best Formats:
- **SVG** (best) - Scales perfectly, small file size
- **PNG** (good) - Transparent background supported
- **WebP** (good) - Modern format, great compression
- **JPG** (okay) - Use only if no transparency needed

### Size Guidelines:
- **Dimensions:** Square (1:1 ratio) - 200x200px to 512x512px
- **File size:** Under 500KB (ideally under 100KB)
- **Background:** Transparent or white
- **Style:** Official company logo

### Naming Convention:
```
apple-logo.svg
google-logo.png
microsoft-logo.svg
amazon-logo.png
meta-logo.svg
```

---

## 🔗 Using External Logo URLs

You can also use external URLs instead of local files:

### Clearbit Logo API (Free):
```
https://logo.clearbit.com/apple.com
https://logo.clearbit.com/google.com
https://logo.clearbit.com/microsoft.com
```

### Company CDNs:
Use direct URLs from company websites or CDNs

Just paste the URL in the admin panel's "Company Logo" field!

---

## 💡 Tips for Great Logos

✅ **Do:**
- Use official company logos
- Keep square aspect ratio
- Use high resolution (minimum 200x200px)
- Prefer SVG for perfect scaling
- Use transparent backgrounds (PNG/SVG)
- Test on both light and dark backgrounds

❌ **Don't:**
- Use low-resolution images
- Use rectangular logos (will be cropped)
- Use unofficial or modified logos
- Use large file sizes (> 1MB)
- Use logos with too much text

---

## 🎯 Your Current Setup

### Handshake AI:
- **File:** `/companies/handshake-logo.svg`
- **Type:** SVG vector
- **Status:** ✅ Installed

### Apple:
- **File:** `/companies/apple-logo.svg`
- **Type:** SVG vector
- **Status:** ✅ Installed

**Both logos are now displaying in your experience section!**

---

## 📱 Where Logos Appear

Company logos display in your Experience section:
- **Size:** 64x64 pixels
- **Style:** Rounded corners, white background, border
- **Position:** Top-left of each experience card
- **Effect:** Hover shadow for depth
- **Fallback:** Company initial in colored circle if logo fails

---

## 🚀 View Your Logos

Visit: `http://localhost:3000/#experience`

Your logos are now live! 🎉
