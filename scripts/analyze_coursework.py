"""
AI-Powered Coursework Analysis System
Analyzes documents and images from coursework to extract project descriptions,
skills, and tags for portfolio inclusion.
Uses OpenAI GPT-4o.
"""

import os
import sys
import json
import base64
from typing import Dict, Any, Optional
from openai import OpenAI
try:
    import docx
    DOCX_AVAILABLE = True
except ImportError:
    DOCX_AVAILABLE = False

try:
    from pypdf import PdfReader
    PDF_AVAILABLE = True
except ImportError:
    PDF_AVAILABLE = False

class CourseworkAnalyzer:
    """Main class for AI-powered coursework analysis."""
    
    def __init__(self):
        """Initialize the analyzer with OpenAI client."""
        api_key = os.getenv("OPENAI_API_KEY")
        self.client = OpenAI(api_key=api_key)
    
    def _read_docx(self, file_path: str) -> str:
        """Extract text from a .docx file."""
        if not DOCX_AVAILABLE:
            print("python-docx not installed, skipping .docx file", file=sys.stderr)
            return ""
        try:
            doc = docx.Document(file_path)
            full_text = []
            for para in doc.paragraphs:
                full_text.append(para.text)
            return '\n'.join(full_text)
        except Exception as e:
            print(f"Error reading DOCX {file_path}: {e}", file=sys.stderr)
            return ""

    def _read_pdf(self, file_path: str) -> str:
        """Extract text from a .pdf file."""
        if not PDF_AVAILABLE:
            print("pypdf not installed, skipping .pdf file", file=sys.stderr)
            return ""
        try:
            reader = PdfReader(file_path)
            text = ""
            for page in reader.pages:
                text += page.extract_text() + "\n"
            return text
        except Exception as e:
            print(f"Error reading PDF {file_path}: {e}", file=sys.stderr)
            return ""

    def _encode_image(self, image_path: str) -> str:
        """Encode image to base64."""
        with open(image_path, "rb") as image_file:
            return base64.b64encode(image_file.read()).decode('utf-8')

    def _call_openai_with_retry(self, model: str, prompt: str, image_paths: Optional[list[str]] = None, max_retries: int = 3) -> str:
        """Call OpenAI API with retry logic."""
        
        content_parts = [{"type": "text", "text": prompt}]
        
        # Add images/files if provided
        loaded_files_count = 0
        if image_paths:
            print(f"Loading {len(image_paths)} files for analysis...", file=sys.stderr)
            for file_path in image_paths:
                try:
                    file_lower = file_path.lower()
                    
                    # Handle DOCX files
                    if file_lower.endswith('.docx'):
                        extracted_text = self._read_docx(file_path)
                        if extracted_text:
                            text_content = f"\n--- Content from {os.path.basename(file_path)} ---\n{extracted_text}\n--- End of {os.path.basename(file_path)} ---\n"
                            content_parts.append({"type": "text", "text": text_content})
                            loaded_files_count += 1
                        continue
                    
                    if file_lower.endswith('.doc'):
                        print(f"⚠️  Skipping {file_path}: Old .doc format not supported. Please convert to .docx or PDF.", file=sys.stderr)
                        continue

                    # Handle PDF files
                    if file_lower.endswith('.pdf'):
                        extracted_text = self._read_pdf(file_path)
                        if extracted_text:
                            text_content = f"\n--- Content from {os.path.basename(file_path)} ---\n{extracted_text}\n--- End of {os.path.basename(file_path)} ---\n"
                            content_parts.append({"type": "text", "text": text_content})
                            loaded_files_count += 1
                        continue

                    # Handle Text files
                    if file_lower.endswith('.txt'):
                        with open(file_path, "r", encoding="utf-8") as f:
                            text_content = f.read()
                        if text_content:
                            formatted_content = f"\n--- Content from Text Input ---\n{text_content}\n--- End of Text Input ---\n"
                            content_parts.append({"type": "text", "text": formatted_content})
                            loaded_files_count += 1
                        continue

                    # Handle Images
                    if file_lower.endswith(('.png', '.jpg', '.jpeg', '.webp')):
                        base64_image = self._encode_image(file_path)
                        mime_type = "image/jpeg"
                        if file_lower.endswith('.png'): mime_type = "image/png"
                        elif file_lower.endswith('.webp'): mime_type = "image/webp"
                        
                        content_parts.append({
                            "type": "image_url",
                            "image_url": {"url": f"data:{mime_type};base64,{base64_image}"}
                        })
                        loaded_files_count += 1
                        continue
                    
                except Exception as e:
                    print(f"Error processing file {file_path}: {e}", file=sys.stderr)
                    continue

            print(f"Successfully loaded {loaded_files_count} files.", file=sys.stderr)
            
            if loaded_files_count == 0 and image_paths:
                print("Warning: No valid files were loaded, but paths were provided.", file=sys.stderr)

        for attempt in range(max_retries):
            try:
                response = self.client.chat.completions.create(
                    model=model,
                    messages=[{"role": "user", "content": content_parts}]
                )
                return response.choices[0].message.content or ""
            except Exception as e:
                if attempt < max_retries - 1:
                    print(f"⚠️  OpenAI API temporary error (attempt {attempt + 1}/{max_retries}): {e}", file=sys.stderr)
                    continue
                else:
                    raise Exception(f"Failed to get response after {max_retries} attempts: {e}")
        
        return ""

    def analyze_files(self, file_paths: list[str]) -> Dict[str, Any]:
        """
        Analyze multiple files (images, documents, or text) to extract project details.
        
        Args:
            file_paths: List of paths to the files to analyze
            
        Returns:
            Dictionary with analyzed project details
        """
        prompt = f"""
        You are an expert portfolio curator and technical writer. 
        I am providing {len(file_paths)} inputs (documents, images, or text content) from my university coursework (George Mason University).
        
        Your task is to analyze ALL of this content (spread across these inputs) and generate a SINGLE comprehensive, professional project entry for my portfolio.
        
        CRITICAL: You must synthesize information from ALL provided files. Do not just look at the first one.
        
        Please extract or infer the following:
        1. A catchy, professional **Project Title**.
        2. A **Description** (2-3 paragraphs) that explains:
           - The Problem/Challenge addressed.
           - The Solution/Methodology (technologies, algorithms, frameworks used).
           - The Results/Impact (what was achieved, any metrics, or simply the successful outcome).
           - MAKE IT SOUND PROFESSIONAL and IMPRESSIVE, highlighting technical depth.
        3. A list of **Tags/Skills** (e.g., Python, AWS, SQL, Machine Learning, Research, etc.).
        4. A **Key Features** list (3-5 bullet points).
        
        Return the result strictly in valid JSON format with the following structure:
        {{
          "title": "Project Title",
          "description": "The full description text...",
          "tags": ["Tag1", "Tag2", ...],
          "key_features": ["Feature 1", "Feature 2", ...],
          "analysis_summary": "Analyzed {len(file_paths)} files to generate this project."
        }}
        """
        
        try:
            print(f"Analyzing with model: gpt-4o", file=sys.stderr)
            
            response_text = self._call_openai_with_retry(
                model='gpt-4o', 
                prompt=prompt,
                image_paths=file_paths
            )
            
            # Clean up response to get just the JSON
            if "```json" in response_text:
                response_text = response_text.split("```json")[1].split("```")[0]
            elif "```" in response_text:
                response_text = response_text.split("```")[1].split("```")[0]
            
            return json.loads(response_text.strip())
            
        except Exception as e:
            return {
                "error": str(e),
                "title": "Analysis Failed",
                "description": "Could not analyze the files.",
                "tags": [],
                "key_features": []
            }

def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No file paths provided"}))
        return

    # All arguments after the script name are file paths
    file_paths = sys.argv[1:]
    
    # Check if all files exist
    valid_paths = []
    for path in file_paths:
        if os.path.exists(path):
            valid_paths.append(path)
        else:
             # We'll just skip missing files but log a warning if needed
             pass

    if not valid_paths:
        print(json.dumps({"error": "No valid files found"}))
        return
        
    analyzer = CourseworkAnalyzer()
    result = analyzer.analyze_files(valid_paths)
    
    print(json.dumps(result, indent=2))

if __name__ == "__main__":
    main()
