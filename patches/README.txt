This change belongs on TheLaughingGod1986/orbit-with-ben (Orbit with Ben
YouTube production), not in BMV Finder. This agent can only open a PR here.

On a machine with write access to orbit-with-ben:

  cd /path/to/orbit-with-ben
  git checkout -b cursor/fix-video-playback-lag-7d2c
  git am /path/to/orbit-with-ben-cfr-playback-lag.patch

Then, with the mp4 masters present:

  python3 04_Audio/tools/fix_published_playback_lag.py --apply
  python3 00_Brand/Channel-Setup/audits/_replace_media_in_place.py --dry-run
  python3 00_Brand/Channel-Setup/audits/_replace_media_in_place.py

Studio Replace keeps the original YouTube video ids (views, comments, URL).
Do not run _replace_shorts_v02_youtube.py for this — that uploads new ids.
