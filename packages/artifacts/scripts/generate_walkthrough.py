import math
from datetime import datetime
from pathlib import Path

import cv2
import numpy as np

WIDTH = 1280
HEIGHT = 720
FPS = 1
BACKGROUND_COLOR = (241, 245, 249)  # slate-100
TITLE_COLOR = (20, 108, 148)  # primary
TEXT_COLOR = (51, 65, 85)  # slate-700

ROOT_DIR = Path(__file__).resolve().parents[3]
ARTIFACT_DIR = ROOT_DIR / 'artifact'
ARTIFACT_DIR.mkdir(parents=True, exist_ok=True)

TIMESTAMP = datetime.now().strftime('%Y-%m-%d')
OUTPUT_PATH = ARTIFACT_DIR / f'CollegeAttend_Staging_{TIMESTAMP}.mp4'

SLIDES = [
    {
        'title': 'CollegeAttend Staging Walkthrough',
        'bullets': [
            'Production-ready attendance PWA for SCEE & SCIT.',
            'Mobile-first flows, offline capture, WhatsApp notifications.',
            'This silent recording walks through the deployed staging stack.'
        ],
        'duration': 100
    },
    {
        'title': 'Access & Tenants',
        'bullets': [
            'Landing page: Smart Attendance for SCEE & SCIT — Reliable, Offline-Ready, Parent-Connected.',
            'Tenant selector persists between public and authenticated areas.',
            'Login at /app/login with seeded faculty/admin accounts from the README.'
        ],
        'duration': 100
    },
    {
        'title': 'Faculty Attendance',
        'bullets': [
            'Roster loads from Prisma/Postgres with risk-level predictions.',
            'Offline capture stores records in IndexedDB via Dexie.',
            'Notify Parents modal prepares absence & predicted-risk WhatsApp messages with CSV export.'
        ],
        'duration': 100
    },
    {
        'title': 'Sync & Admin Insights',
        'bullets': [
            'Sync Monitor reveals pending, failed, and synced queue counts.',
            'Manual sync posts to /attendance/bulk; background sync via service worker when supported.',
            'Admin Reports expose CSV exports and audit-ready aggregates.'
        ],
        'duration': 100
    },
    {
        'title': 'Student Dashboard & Privacy',
        'bullets': [
            'Student dashboard shows personal analytics, timetable cache, and sync status.',
            'Privacy & Help routes document consent, RBAC, and support steps.',
            'PWA manifest + service worker enable install on Android & Chromium desktops.'
        ],
        'duration': 100
    },
    {
        'title': 'Deployment & Testing',
        'bullets': [
            'Docker Compose spins Postgres, Express API, and the static Vite build.',
            'GitHub Actions run unit tests, Playwright e2e smoke, and Docker builds.',
            'Reference artefacts: quotation PDFs, OpenAPI spec, ML pipeline scaffold.'
        ],
        'duration': 100
    }
]


def render_slide_frame(title: str, bullets: list[str]) -> np.ndarray:
    frame = np.full((HEIGHT, WIDTH, 3), BACKGROUND_COLOR, dtype=np.uint8)

    cv2.putText(
        frame,
        title,
        (80, 120),
        cv2.FONT_HERSHEY_SIMPLEX,
        1.1,
        TITLE_COLOR,
        3,
        cv2.LINE_AA
    )

    y = 200
    line_spacing = 40
    for bullet in bullets:
        wrapped_lines = wrap_text(bullet, 70)
        cv2.circle(frame, (90, y - 12), 6, TITLE_COLOR, -1)
        for idx, line in enumerate(wrapped_lines):
            cv2.putText(
                frame,
                line,
                (120, y + idx * line_spacing),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.8,
                TEXT_COLOR,
                2,
                cv2.LINE_AA
            )
        y += line_spacing * max(1, len(wrapped_lines)) + 10

    footer = f'Generated {TIMESTAMP} · CollegeAttend staging bundle · Silent narration'
    cv2.putText(
        frame,
        footer,
        (80, HEIGHT - 60),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.6,
        (100, 116, 139),
        2,
        cv2.LINE_AA
    )
    return frame


def wrap_text(text: str, max_chars: int) -> list[str]:
    words = text.split()
    lines: list[str] = []
    current = []
    count = 0
    for word in words:
        projected = count + len(word) + (1 if current else 0)
        if projected > max_chars:
            lines.append(' '.join(current))
            current = [word]
            count = len(word)
        else:
            current.append(word)
            count = projected
    if current:
        lines.append(' '.join(current))
    return lines


def main() -> None:
    total_frames = sum(slide['duration'] for slide in SLIDES)
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    writer = cv2.VideoWriter(str(OUTPUT_PATH), fourcc, FPS, (WIDTH, HEIGHT))

    frame_counter = 0
    for slide in SLIDES:
        frame = render_slide_frame(slide['title'], slide['bullets'])
        for _ in range(slide['duration']):
            writer.write(frame)
            frame_counter += 1

    writer.release()
    print(f'Generated walkthrough video at {OUTPUT_PATH} ({math.floor(frame_counter / FPS)} seconds)')


if __name__ == '__main__':
    main()

