"""Sends a local Python script or open-blend command to the live Blender MCP socket (127.0.0.1:9876)."""
import json
import os
import socket
import sys

def send_code(code: str, port: int = 9876):
    s = socket.create_connection(("127.0.0.1", port), timeout=30)
    s.sendall(json.dumps({"type": "execute_code", "params": {"code": code}}).encode("utf-8"))
    chunks = []
    s.settimeout(20)
    while True:
        try:
            data = s.recv(65536)
            if not data:
                break
            chunks.append(data)
            try:
                return json.loads(b"".join(chunks).decode("utf-8"))
            except json.JSONDecodeError:
                continue
        except socket.timeout:
            break
    s.close()
    return {"raw": b"".join(chunks).decode("utf-8", errors="replace")}


if __name__ == "__main__":
    arg = sys.argv[1] if len(sys.argv) > 1 else ""
    if arg.endswith(".blend"):
        abs_blend = os.path.abspath(arg).replace("\\", "/")
        code = f"""
import bpy
bpy.ops.wm.open_mainfile(filepath={abs_blend!r})
for win in bpy.context.window_manager.windows:
    scr = win.screen
    if scr:
        for area in scr.areas:
            if area.type == 'VIEW_3D':
                for sp in area.spaces:
                    if sp.type == 'VIEW_3D':
                        sp.shading.type = 'MATERIAL'
                        sp.region_3d.view_perspective = 'CAMERA'
print('OPENED_LIVE_BLEND:', {abs_blend!r})
"""
        print(json.dumps(send_code(code), indent=2))
    elif arg and os.path.exists(arg):
        with open(arg, "r", encoding="utf-8") as f:
            script_text = f.read()
        print(json.dumps(send_code(script_text), indent=2))
    else:
        print("Usage: python send_blender.py <scene.blend | script.py>")
