"""Synthetic local adapter benchmark, with no accounts, network calls or .env loading.

Run from the repo root: .venv/bin/python -m scripts.benchmark_jpl
Results are descriptive, not Vercel/API latency or load guarantees.
"""
from concurrent.futures import ThreadPoolExecutor
from datetime import date
from pathlib import Path
from threading import Barrier
from time import perf_counter
import json
import platform
import subprocess
import sys

PROFILE = dict(birth_date='2000-01-01', birth_time='12:00:00',
               birth_time_known=True, timezone='Asia/Ulaanbaatar',
               latitude=47.9189, longitude=106.9176,
               time_fold=0, time_fold_confirmed=False)
DAY = date(2026, 10, 1)


def worker():
    started = perf_counter()
    from services.astrology import jpl
    imported = perf_counter() - started
    started = perf_counter()
    jpl.daily(PROFILE, DAY, PROFILE['timezone'])
    cold = perf_counter() - started
    warm = []
    for _ in range(3):
        started = perf_counter()
        jpl.daily(PROFILE, DAY, PROFILE['timezone'])
        warm.append(perf_counter() - started)
    jpl.close()
    barrier = Barrier(4)
    def calculate(index):
        profile = dict(PROFILE, birth_date=f'2000-01-{index+1:02d}')
        barrier.wait()
        started = perf_counter()
        jpl.daily(profile, DAY, profile['timezone'])
        return perf_counter() - started
    started = perf_counter()
    with ThreadPoolExecutor(max_workers=4) as pool:
        concurrent = list(pool.map(calculate, range(4)))
    concurrent_wall = perf_counter() - started
    jpl.close()
    return dict(import_seconds=imported, cold_daily_seconds=cold,
                warm_daily_seconds=warm,
                concurrent_cold_four_request_seconds=concurrent,
                concurrent_wall_seconds=concurrent_wall)


def main():
    if '--worker' in sys.argv:
        print(json.dumps(worker()))
        return
    runs = []
    for _ in range(3):
        started = perf_counter()
        output = subprocess.check_output(
            [sys.executable, '-m', 'scripts.benchmark_jpl', '--worker'], text=True)
        run = json.loads(output)
        run['worker_wall_seconds'] = perf_counter() - started
        runs.append(run)
    result = dict(
        measured_at='2026-10-01', python=platform.python_version(),
        environment='Local WSL; synthetic inputs; three fresh processes; four threads per process',
        frontend_deadline_seconds=30,
        exclusions=['HTTP/auth/database latency', 'Vercel cold start', 'multi-instance duplicate work'],
        runs=runs,
    )
    path = Path(__file__).resolve().parents[1] / 'docs/JPL_PERFORMANCE.json'
    path.write_text(json.dumps(result, indent=2) + '\n')
    print(json.dumps(result, indent=2))


if __name__ == '__main__':
    main()
