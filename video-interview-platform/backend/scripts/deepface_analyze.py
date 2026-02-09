#!/usr/bin/env python3
"""
DeepFace emotion analysis script for Node.js backend.
Usage: python deepface_analyze.py <video_path>
Output: JSON to stdout with per-frame emotions, timestamps, and summary.
Samples 1 in every 5 frames.
"""

import sys
import json
import warnings
warnings.filterwarnings("ignore")

import os
os.environ["TF_CPP_MIN_LOG_LEVEL"] = "3"
os.environ["TF_ENABLE_ONEDNN_OPTS"] = "0"


def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No video path provided"}))
        sys.exit(1)

    video_path = sys.argv[1]

    try:
        import cv2
    except ImportError:
        print(json.dumps({"error": "opencv-python not installed. Run: pip install opencv-python"}))
        sys.exit(1)

    try:
        from deepface import DeepFace
    except ImportError:
        print(json.dumps({"error": "deepface not installed. Run: pip install deepface"}))
        sys.exit(1)

    try:
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            print(json.dumps({"error": f"Cannot open video: {video_path}"}))
            sys.exit(1)

        fps = cap.get(cv2.CAP_PROP_FPS)
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        
        # WebM files often report fps=0 or absurdly high values
        if not fps or fps <= 0 or fps > 240:
            # Estimate fps by counting frames and duration
            # For WebM, try to get duration from total_frames and msec position
            if total_frames > 0 and total_frames < 2**60:
                cap.set(cv2.CAP_PROP_POS_AVI_RATIO, 1)  # seek to end
                duration_ms = cap.get(cv2.CAP_PROP_POS_MSEC)
                cap.set(cv2.CAP_PROP_POS_AVI_RATIO, 0)  # seek back to start
                if duration_ms > 0:
                    fps = total_frames / (duration_ms / 1000.0)
                else:
                    fps = 30.0
            else:
                fps = 30.0
        
        # Sanitize total_frames (WebM can report negative/huge values)
        if total_frames <= 0 or total_frames > 2**60:
            total_frames = 0  # will be updated after reading
            count_frames = True
        else:
            count_frames = False

        sample_every = 5  # analyze 1 in every 5 frames

        emotions_timeline = []
        frame_idx = 0
        analyzed_count = 0
        faces_detected = 0

        # Accumulators for average scores
        emotion_keys = ["angry", "disgust", "fear", "happy", "sad", "surprise", "neutral"]
        score_sums = {e: 0.0 for e in emotion_keys}
        dominant_counts = {e: 0 for e in emotion_keys}
        # Track durations: consecutive frames with same dominant emotion
        duration_tracker = {e: 0.0 for e in emotion_keys}

        while True:
            ret, frame = cap.read()
            if not ret:
                break

            if frame_idx % sample_every == 0:
                analyzed_count += 1
                timestamp_sec = round(frame_idx / fps, 2)

                try:
                    results = DeepFace.analyze(
                        frame,
                        actions=["emotion"],
                        enforce_detection=False,
                        silent=True
                    )
                    # DeepFace returns a list; take first face
                    face_result = results[0] if isinstance(results, list) else results
                    emotion_scores = face_result.get("emotion", {})
                    dominant = face_result.get("dominant_emotion", "unknown")

                    # Round scores to 2 decimals
                    rounded_scores = {k: round(v, 2) for k, v in emotion_scores.items()}

                    emotions_timeline.append({
                        "frame": frame_idx,
                        "timestamp_sec": timestamp_sec,
                        "dominant_emotion": dominant,
                        "scores": rounded_scores
                    })

                    faces_detected += 1

                    # Accumulate for summary
                    for e in emotion_keys:
                        score_sums[e] += emotion_scores.get(e, 0.0)
                    if dominant in dominant_counts:
                        dominant_counts[dominant] += 1

                    # Duration tracking: each sampled frame represents (sample_every / fps) seconds
                    interval_sec = sample_every / fps
                    if dominant in duration_tracker:
                        duration_tracker[dominant] += interval_sec

                except Exception:
                    # No face detected or analysis failed - skip frame
                    emotions_timeline.append({
                        "frame": frame_idx,
                        "timestamp_sec": timestamp_sec,
                        "dominant_emotion": "no_face",
                        "scores": {}
                    })

            frame_idx += 1

        cap.release()

        # Update total_frames if we were counting
        if count_frames:
            total_frames = frame_idx

        # Build summary
        average_scores = {}
        if faces_detected > 0:
            average_scores = {e: round(score_sums[e] / faces_detected, 2) for e in emotion_keys}

        # Emotion distribution as percentages
        emotion_distribution = {}
        if faces_detected > 0:
            emotion_distribution = {
                e: round((dominant_counts[e] / faces_detected) * 100, 1)
                for e in emotion_keys if dominant_counts[e] > 0
            }

        # Round durations
        emotion_durations_sec = {
            e: round(duration_tracker[e], 2)
            for e in emotion_keys if duration_tracker[e] > 0
        }

        # Find the emotion shown for the longest time
        longest_emotion = None
        longest_duration = 0.0
        for e, dur in duration_tracker.items():
            if dur > longest_duration:
                longest_duration = dur
                longest_emotion = e

        # Overall dominant = highest average score
        dominant_overall = max(average_scores, key=average_scores.get) if average_scores else "unknown"

        video_duration_sec = round(total_frames / fps, 2) if fps > 0 else 0

        output = {
            "video_duration_sec": video_duration_sec,
            "fps": round(fps, 2),
            "total_frames": total_frames,
            "analyzed_frames": analyzed_count,
            "faces_detected": faces_detected,
            "emotions_timeline": emotions_timeline,
            "summary": {
                "dominant_emotion_overall": dominant_overall,
                "longest_emotion": {
                    "emotion": longest_emotion,
                    "duration_sec": round(longest_duration, 2)
                },
                "emotion_distribution_percent": emotion_distribution,
                "emotion_durations_sec": emotion_durations_sec,
                "average_scores": average_scores
            }
        }

        print(json.dumps(output, default=lambda x: float(x) if hasattr(x, 'item') else str(x)))

    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)


if __name__ == "__main__":
    main()
