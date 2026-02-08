#!/usr/bin/env python3
"""
Simple Whisper transcription script for Node.js backend.
Usage: python whisper_transcribe.py <video_path>
Output: JSON to stdout {"text": "transcribed text", "language": "en"}
"""

import sys
import json
import warnings
warnings.filterwarnings("ignore")

def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No video path provided"}))
        sys.exit(1)
    
    video_path = sys.argv[1]
    
    try:
        import whisper
    except ImportError:
        print(json.dumps({"error": "Whisper not installed. Run: pip install openai-whisper"}))
        sys.exit(1)
    
    try:
        # Load model (cached after first load)
        model = whisper.load_model("base")
        
        # Transcribe
        result = model.transcribe(video_path)
        
        # Output JSON to stdout
        output = {
            "text": result["text"].strip(),
            "language": result.get("language", "en")
        }
        print(json.dumps(output))
        
    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)

if __name__ == "__main__":
    main()
