# StackPharmacy Blender Marketing Ads

Automated 3D product & cinematic marketing pipelines built for Blender 5.2 (EEVEE Next) + Pillow + FFmpeg.

## Projects

- **`ad1_bill_scanner/`** — 9s staggered pop-up vertical Reels ad (`1080x1920`), Instagram Feed poster (`1080x1350`), and Web Banner (`1920x1080`) featuring AI Invoice Scanner + synced synthesized beat & UI SFX (`generate_audio.py`, `render_reels.py`).
- **`ad2_cinematic_ad/`** — 6-scene cinematic CapCut storyboard (`Scene_1_Hook` -> `Scene_2_Counter` -> `Scene_2B_BillsZoom` -> `Scene_3_PhoneReveal` -> `Scene_3B_Notification` -> `Scene_4_LogoSting` in `16:9` & `9:16`) + 23s Master Cut (`generate_assets.py`, `generate_audio_ad2.py`, `render_pipeline.py`, `compose_master_cut.py`).
- **`ad3_card_cascade/`** — 8.0s seamless 30fps vertical 3D stacked card cascade Reel (`1080x1920`) inspired by the editorial fanned deck motion reference (`generate_cards.py`, `generate_audio_ad3.py`, `build_and_render.py`).

## Regenerate Videos & Audio

```powershell
# Ad #1 Reels (with audio)
python marketing_ads\ad1_bill_scanner\generate_textures.py
python marketing_ads\ad1_bill_scanner\render_reels.py

# Ad #2 All 6 Scenes + Sound + Master Cut
python marketing_ads\ad2_cinematic_ad\generate_assets.py
python marketing_ads\ad2_cinematic_ad\generate_audio_ad2.py
& "F:\Program Files\Blender Foundation\Blender 5.2\blender.exe" --background --python marketing_ads\ad2_cinematic_ad\render_pipeline.py -- all
python marketing_ads\ad2_cinematic_ad\compose_master_cut.py

# Ad #3 3D Stacked Card Cascade Reel (8s 30fps Loop)
python marketing_ads\ad3_card_cascade\generate_cards.py
python marketing_ads\ad3_card_cascade\generate_audio_ad3.py
& "F:\Program Files\Blender Foundation\Blender 5.2\blender.exe" --background --python marketing_ads\ad3_card_cascade\build_and_render.py -- render
```
