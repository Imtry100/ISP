"""
Interview Evaluation Demo
=========================
Tests the LLM evaluation with sample transcript
"""

import json
import os
from openai import OpenAI
from dotenv import load_dotenv

# Load environment variables
load_dotenv(dotenv_path=r"D:\IS Project\video-interview-platform\backend\.env")

OUTPUT_FOLDER = r"D:\IS Project\After_video\evaluations"
os.makedirs(OUTPUT_FOLDER, exist_ok=True)

# OpenRouter Client
client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=os.getenv("OPENROUTER_API_KEY"),
)

def evaluate_answer(question, answer_transcript):
    """Send to LLM for evaluation"""
    print("\n🤖 Evaluating answer with AI...")
    
    evaluation_prompt = f"""You are an expert interview evaluator and hiring manager. You must evaluate the candidate's answer honestly and critically.

INTERVIEW QUESTION:
"{question}"

CANDIDATE'S ANSWER (transcribed from video):
"{answer_transcript}"

Evaluate this answer and provide your assessment in the following JSON format ONLY (no other text):

{{
    "mark": <number from 1-10>,
    "mark_justification": "<brief explanation of the score>",
    "content_analysis": {{
        "relevance": "<how relevant was the answer to the question>",
        "completeness": "<did they fully address the question>",
        "clarity": "<how clear and structured was the response>",
        "examples": "<did they provide specific examples or stories>"
    }},
    "expected_emotions": {{
        "should_show": ["<list of emotions that should be present like confidence, enthusiasm, sincerity>"],
        "red_flags": ["<only include if there are serious concerns like dishonesty, aggression, extreme nervousness - leave empty if none>"]
    }},
    "areas_to_probe": [
        "<aspect that needs clarification or more detail>",
        "<discrepancy or gap that should be explored>",
        "<topic where candidate seemed evasive or unclear>"
    ],
    "improvement_suggestions": "<what could have made this answer better>",
    "overall_impression": "<brief professional assessment>"
}}

Be honest and critical. A perfect 10 should be rare. Most good answers are 6-8.
Red flags should only be noted for serious concerns, not minor issues.
Areas to probe should focus on gaps, discrepancies, or things that need clarification.
"""

    try:
        response = client.chat.completions.create(
            model="nvidia/nemotron-nano-9b-v2:free",
            messages=[
                {"role": "system", "content": "You are a strict but fair interview evaluator. Output ONLY valid JSON."},
                {"role": "user", "content": evaluation_prompt}
            ]
        )
        
        result_text = response.choices[0].message.content
        
        # Try to parse JSON
        try:
            # Clean up the response if needed
            if "```json" in result_text:
                result_text = result_text.split("```json")[1].split("```")[0]
            elif "```" in result_text:
                result_text = result_text.split("```")[1].split("```")[0]
            
            evaluation = json.loads(result_text.strip())
            print("   ✅ Evaluation complete")
            return evaluation
        except json.JSONDecodeError as e:
            print(f"   ⚠️ JSON parse error, returning raw response")
            return {"raw_response": result_text, "parse_error": str(e)}
            
    except Exception as e:
        print(f"   ❌ Evaluation error: {e}")
        return {"error": str(e)}


def print_evaluation_summary(evaluation):
    """Print a nice summary of the evaluation"""
    print("\n" + "="*60)
    print("📋 EVALUATION SUMMARY")
    print("="*60)
    
    if "error" in evaluation:
        print(f"❌ Error: {evaluation['error']}")
        return
    
    if "raw_response" in evaluation:
        print(f"⚠️ Raw response: {evaluation['raw_response'][:500]}...")
        return
    
    print(f"\n🎯 MARK: {evaluation.get('mark', 'N/A')}/10")
    print(f"   Justification: {evaluation.get('mark_justification', 'N/A')}")
    
    content = evaluation.get('content_analysis', {})
    print(f"\n📊 CONTENT ANALYSIS:")
    print(f"   Relevance: {content.get('relevance', 'N/A')}")
    print(f"   Completeness: {content.get('completeness', 'N/A')}")
    print(f"   Clarity: {content.get('clarity', 'N/A')}")
    print(f"   Examples: {content.get('examples', 'N/A')}")
    
    print(f"\n😀 EXPECTED EMOTIONS:")
    emotions = evaluation.get('expected_emotions', {})
    should_show = emotions.get('should_show', [])
    if isinstance(should_show, list):
        print(f"   Should show: {', '.join(should_show)}")
    else:
        print(f"   Should show: {should_show}")
    red_flags = emotions.get('red_flags', [])
    if isinstance(red_flags, list) and red_flags:
        print(f"   ⚠️ Red flags: {', '.join(red_flags)}")
    else:
        print(f"   Red flags: None")
    
    print(f"\n🔍 AREAS TO PROBE (for follow-up):")
    for i, area in enumerate(evaluation.get('areas_to_probe', []), 1):
        print(f"   {i}. {area}")
    
    print(f"\n💡 IMPROVEMENT: {evaluation.get('improvement_suggestions', 'N/A')}")
    print(f"\n📝 OVERALL: {evaluation.get('overall_impression', 'N/A')}")
    print("="*60)


# Sample test
if __name__ == "__main__":
    print("\n" + "="*60)
    print("🎬 INTERVIEW EVALUATION DEMO")
    print("="*60)
    
    # Sample question and answer
    test_question = "Tell me about yourself and what motivates you."
    
    test_answer = """
    Hi, my name is Satyam. I'm a final year B.Tech student in Computer Science. 
    I've been really passionate about software development since I was in high school. 
    I started with simple Python projects and gradually moved to web development and machine learning.
    
    What motivates me is the ability to solve real-world problems through technology. 
    I recently worked on a project that helped automate attendance tracking using face recognition,
    and seeing it actually work in our college was incredibly satisfying.
    
    I'm looking for opportunities where I can apply my skills in a challenging environment
    and continue to learn and grow as a developer.
    """
    
    print(f"\n📝 QUESTION: {test_question}")
    print(f"\n🎤 ANSWER: {test_answer[:200]}...")
    
    # Evaluate
    evaluation = evaluate_answer(test_question, test_answer)
    
    # Print summary
    print_evaluation_summary(evaluation)
    
    # Save to file
    result = {
        "question": test_question,
        "answer": test_answer,
        "evaluation": evaluation
    }
    
    output_file = os.path.join(OUTPUT_FOLDER, "demo_evaluation.json")
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(result, f, indent=2, ensure_ascii=False)
    
    print(f"\n💾 Saved to: {output_file}")
