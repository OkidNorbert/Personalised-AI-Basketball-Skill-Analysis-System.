"""
Team Analysis Pipeline - Wraps template components for team video analysis.

This module uses the existing template components (PlayerTracker, BallTracker, etc.)
to analyze multi-player basketball footage for team-level insights.
"""
import os
import sys
from typing import Dict, Any, List

# Add parent directory for template imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


async def run_team_analysis(video_path: str) -> Dict[str, Any]:
    """
    Run team analysis pipeline on a video.
    
    Uses existing template components:
    - PlayerTracker (YOLO + ByteTrack)
    - BallTracker (YOLO)
    - BallAquisitionDetector
    - TeamAssigner
    - PassAndInterceptionDetector
    - SpeedAndDistanceCalculator
    - TacticalViewConverter
    
    Args:
        video_path: Path to the video file
        
    Returns:
        Dictionary containing analysis results
    """
    # Import template components
    from utils import read_video
    from trackers import PlayerTracker, BallTracker
    from team_assigner import TeamAssigner
    from court_keypoint_detector import CourtKeypointDetector
    from ball_aquisition_detector import BallAquisitionDetector
    from pass_and_interception_detector import PassAndInterceptionDetector
    from tactical_view_converter import TacticalViewConverter
    from speed_and_distance_calculator import SpeedAndDistanceCalculator
    from configs import (
        PLAYER_DETECTOR_PATH,
        BALL_DETECTOR_PATH,
        COURT_KEYPOINT_DETECTOR_PATH,
    )
    
    # Read video frames
    video_frames = read_video(video_path)
    total_frames = len(video_frames)
    
    if total_frames == 0:
        return {
            "error": "Could not read video frames",
            "total_frames": 0,
        }
    
    # Initialize trackers
    player_tracker = PlayerTracker(PLAYER_DETECTOR_PATH)
    ball_tracker = BallTracker(BALL_DETECTOR_PATH)
    court_keypoint_detector = CourtKeypointDetector(COURT_KEYPOINT_DETECTOR_PATH)
    
    # Run detection (no stub caching for API use)
    player_tracks = player_tracker.get_object_tracks(video_frames, read_from_stub=False)
    ball_tracks = ball_tracker.get_object_tracks(video_frames, read_from_stub=False)
    court_keypoints = court_keypoint_detector.get_court_keypoints(video_frames, read_from_stub=False)
    
    # Clean ball tracks
    ball_tracks = ball_tracker.remove_wrong_detections(ball_tracks)
    ball_tracks = ball_tracker.interpolate_ball_positions(ball_tracks)
    
    # Team assignment
    team_assigner = TeamAssigner()
    player_assignment = team_assigner.get_player_teams_across_frames(
        video_frames, player_tracks, read_from_stub=False
    )
    
    # Ball possession
    ball_aquisition_detector = BallAquisitionDetector()
    ball_possession = ball_aquisition_detector.detect_ball_possession(player_tracks, ball_tracks)
    
    # Pass and interception detection
    pass_detector = PassAndInterceptionDetector()
    passes = pass_detector.detect_passes(ball_possession, player_assignment)
    interceptions = pass_detector.detect_interceptions(ball_possession, player_assignment)
    
    # Tactical view and speed calculations
    tactical_converter = TacticalViewConverter(
        court_image_path="./images/basketball_court.png"
    )
    court_keypoints = tactical_converter.validate_keypoints(court_keypoints)
    tactical_positions = tactical_converter.transform_players_to_tactical_view(
        court_keypoints, player_tracks
    )
    
    speed_calculator = SpeedAndDistanceCalculator(
        tactical_converter.width,
        tactical_converter.height,
        tactical_converter.actual_width_in_meters,
        tactical_converter.actual_height_in_meters
    )
    distances = speed_calculator.calculate_distance(tactical_positions)
    speeds = speed_calculator.calculate_speed(distances)
    
    # Calculate team possession percentages
    team_1_possession = 0
    team_2_possession = 0
    
    for frame_idx, (possession, assignment) in enumerate(zip(ball_possession, player_assignment)):
        if possession != -1 and possession in assignment:
            team = assignment[possession].get("team", 0)
            if team == 1:
                team_1_possession += 1
            elif team == 2:
                team_2_possession += 1
    
    total_possession = team_1_possession + team_2_possession
    team_1_pct = (team_1_possession / total_possession * 100) if total_possession > 0 else 50
    team_2_pct = (team_2_possession / total_possession * 100) if total_possession > 0 else 50
    
    # Count unique players
    unique_players = set()
    for frame_tracks in player_tracks:
        unique_players.update(frame_tracks.keys())
    
    # Build events list
    events = []
    for p in passes:
        events.append({
            "event_type": "pass",
            "frame": p.get("frame", 0),
            "timestamp_seconds": p.get("frame", 0) / 30,  # Assume 30fps
            "player_id": p.get("from_player"),
            "details": {"to_player": p.get("to_player")}
        })
    
    for i in interceptions:
        events.append({
            "event_type": "interception",
            "frame": i.get("frame", 0),
            "timestamp_seconds": i.get("frame", 0) / 30,
            "player_id": i.get("player"),
            "details": {}
        })
    
    # Get video duration
    fps = 30  # Default assumption
    try:
        import cv2
        cap = cv2.VideoCapture(video_path)
        fps = cap.get(cv2.CAP_PROP_FPS) or 30
        cap.release()
    except:
        pass
    
    duration_seconds = total_frames / fps
    
    return {
        "total_frames": total_frames,
        "duration_seconds": duration_seconds,
        "players_detected": len(unique_players),
        "team_1_possession_percent": round(team_1_pct, 1),
        "team_2_possession_percent": round(team_2_pct, 1),
        "total_passes": len(passes),
        "total_interceptions": len(interceptions),
        "events": events,
    }
