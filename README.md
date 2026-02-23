# 🎯 Jawad's Portfolio & AI Resume System

A modern Next.js portfolio website with integrated AI-powered resume tailoring capabilities.

## Features

### 📱 Portfolio Website
- Responsive, modern design
- Dynamic content management
- Admin panel for easy updates
- Project gallery with images
- Contact and social links

### 🤖 AI Resume Tailoring
- Automatically tailors resumes to job descriptions
- Uses Claude AI for intelligent content selection
- Generates professional LaTeX/PDF output
- ATS-optimized with keyword matching
- Built-in cover letter generation

## 🚀 Quick Start

### Portfolio Website
```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Visit **http://localhost:3000**

### Admin Panel
- URL: **http://localhost:3000/admin**
- Password: `jawad2026`

### AI Resume Setup
```bash
# Install Python dependencies
pip install -r requirements.txt

# Set your Anthropic API key
export ANTHROPIC_API_KEY='your-key-here'
```

## 📖 Documentation

For complete documentation, see **[DOCUMENTATION.md](./DOCUMENTATION.md)**

### Specific Guides
- **[START_HERE.md](./START_HERE.md)** - Quick setup guide
- **[ADMIN_GUIDE.md](./ADMIN_GUIDE.md)** - Admin panel usage
- **[HOW_IT_WORKS.md](./HOW_IT_WORKS.md)** - Technical details
- **[QUICK_START_GUIDE.md](./QUICK_START_GUIDE.md)** - Step-by-step tutorial

## 🎨 Usage

### Portfolio Customization
1. Go to `/admin` and edit content directly
2. Or edit `src/data/portfolio.json`
3. Changes reflect immediately

### Resume Tailoring

**Via Admin Panel:**
1. Go to `/admin` → Resume tab
2. Paste job description
3. Click "Tailor Resume with AI"
4. Download PDF

**Via Command Line:**
```bash
python tailor_my_resume.py job_description.txt
```

## 📁 Project Structure

```
Jawads Portfolio/
├── src/
│   ├── app/              # Next.js pages
│   ├── components/       # React components
│   ├── data/            # Portfolio content
│   └── lib/             # Utilities
├── public/              # Static assets
├── resume_data.json     # Resume database
├── resume_tailor.py     # AI engine
└── tailor_my_resume.py  # CLI tool
```

## 🛠️ Tech Stack

- **Frontend**: Next.js, React, TypeScript, Tailwind CSS
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **AI**: Anthropic Claude API
- **PDF**: XeLaTeX
- **Backend**: Next.js API Routes

## 📞 Support

See **[DOCUMENTATION.md](./DOCUMENTATION.md)** for:
- Complete setup guide
- Troubleshooting
- Best practices
- Advanced features

## 🎯 License

Personal portfolio project. Feel free to fork and customize!

---

**Built with ❤️ by Jawad Iskandar**
