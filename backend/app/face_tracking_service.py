
import cv2

from app.models import EyeContactMetrics, FrameGazeSample


def is_eye_looking_center(iris_x: float, inner_x: float, outer_x: float) -> bool:
    """
    Checks whether iris horizontal position is within the center zone
    between the inner and outer eye corners.
    Ideal center zone is between 0.38 and 0.62.
    """
    min_x = min(inner_x, outer_x)
    max_x = max(inner_x, outer_x)
    width = max_x - min_x
    if width <= 0.001:
        return False
    ratio = (iris_x - min_x) / width
    return 0.36 <= ratio <= 0.64


def analyze_video_frames_mediapipe(video_path: str, sample_fps: float = 1.0) -> EyeContactMetrics:
    """
    Extracts frames at ~1 FPS and analyzes eye contact/engagement using MediaPipe Face Mesh or OpenCV fallback.
    """
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        return EyeContactMetrics(
            eye_contact_percentage=0.0,
            total_frames_analyzed=0,
            looking_at_camera_frames=0,
            timeline_sampled=[],
            disclaimer="Could not open video file for face engagement analysis."
        )

    fps = cap.get(cv2.CAP_PROP_FPS)
    if fps <= 0:
        fps = 30.0
    frame_step = max(1, int(round(fps / sample_fps)))
    
    # Try importing MediaPipe solutions
    mp_face_mesh = None
    face_mesh_processor = None
    try:
        import mediapipe as mp  # type: ignore[import-untyped]
        if hasattr(mp, "solutions") and hasattr(mp.solutions, "face_mesh"):
            mp_face_mesh = mp.solutions.face_mesh
            face_mesh_processor = mp_face_mesh.FaceMesh(
                max_num_faces=1,
                refine_landmarks=True,
                min_detection_confidence=0.5,
                min_tracking_confidence=0.5
            )
    except Exception as e:
        print(f"[Face Tracking] MediaPipe solutions init note: {e}")

    # Fallback OpenCV Haar Cascade classifiers if face_mesh is unavailable
    face_cascade = None
    eye_cascade = None
    if face_mesh_processor is None:
        try:
            cv2_data = getattr(cv2, "data", None)
            haarcascades_path = cv2_data.haarcascades if cv2_data else ""
            face_cascade = cv2.CascadeClassifier(haarcascades_path + "haarcascade_frontalface_default.xml")
            eye_cascade = cv2.CascadeClassifier(haarcascades_path + "haarcascade_eye.xml")
        except Exception:
            pass

    timeline: list[FrameGazeSample] = []
    frame_idx = 0
    total_analyzed = 0
    looking_count = 0

    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break

        if frame_idx % frame_step == 0:
            timestamp = round(frame_idx / fps, 2)
            total_analyzed += 1
            looking = False

            h, w, _ = frame.shape
            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

            if face_mesh_processor is not None:
                try:
                    results = face_mesh_processor.process(rgb_frame)
                    if results.multi_face_landmarks:
                        landmarks = results.multi_face_landmarks[0].landmark
                        
                        # Left eye: outer 33, inner 133, iris 468
                        # Right eye: inner 362, outer 263, iris 473
                        # Nose: 1, Left cheek: 234, Right cheek: 454
                        if len(landmarks) > 473:
                            left_outer = landmarks[33].x
                            left_inner = landmarks[133].x
                            left_iris = landmarks[468].x

                            right_inner = landmarks[362].x
                            right_outer = landmarks[263].x
                            right_iris = landmarks[473].x

                            left_centered = is_eye_looking_center(left_iris, left_inner, left_outer)
                            right_centered = is_eye_looking_center(right_iris, right_inner, right_outer)

                            # Face orientation symmetry
                            nose_x = landmarks[1].x
                            face_left = landmarks[234].x
                            face_right = landmarks[454].x
                            face_width = abs(face_right - face_left)
                            
                            face_centered = True
                            if face_width > 0.05:
                                sym_ratio = (nose_x - min(face_left, face_right)) / face_width
                                face_centered = 0.35 <= sym_ratio <= 0.65

                            if (left_centered or right_centered) and face_centered:
                                looking = True
                        else:
                            # Face landmarks without iris refinement: check face orientation symmetry
                            nose_x = landmarks[1].x
                            face_left = landmarks[234].x
                            face_right = landmarks[454].x
                            face_width = abs(face_right - face_left)
                            if face_width > 0.05:
                                sym_ratio = (nose_x - min(face_left, face_right)) / face_width
                                if 0.38 <= sym_ratio <= 0.62:
                                    looking = True
                except Exception as ex:
                    print(f"[Face Tracking] Error processing frame {frame_idx}: {ex}")

            elif face_cascade is not None and not face_cascade.empty():
                # OpenCV Haar detection fallback
                gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
                faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=4, minSize=(60, 60))
                if len(faces) > 0:
                    (fx, fy, fw, fh) = faces[0]
                    # Check if face is roughly centered in frame
                    face_center_x = fx + (fw / 2.0)
                    frame_center_x = w / 2.0
                    offset = abs(face_center_x - frame_center_x) / w
                    
                    # Detect eyes within face region
                    roi_gray = gray[fy:fy + int(fh * 0.6), fx:fx + fw]
                    eyes = eye_cascade.detectMultiScale(roi_gray, scaleFactor=1.1, minNeighbors=3, minSize=(15, 15)) if eye_cascade else []
                    
                    if offset < 0.25 and len(eyes) >= 1:
                        looking = True

            if looking:
                looking_count += 1

            timeline.append(FrameGazeSample(
                timestamp_sec=timestamp,
                looking_at_camera=looking,
                confidence=1.0
            ))

        frame_idx += 1

    cap.release()
    if face_mesh_processor is not None:
        try:
            face_mesh_processor.close()
        except Exception:
            pass

    pct = round((looking_count / total_analyzed) * 100.0, 1) if total_analyzed > 0 else 0.0

    return EyeContactMetrics(
        eye_contact_percentage=pct,
        total_frames_analyzed=total_analyzed,
        looking_at_camera_frames=looking_count,
        timeline_sampled=timeline,
        disclaimer="Eye contact is measured via facial landmark alignment as an engagement proxy metric."
    )
