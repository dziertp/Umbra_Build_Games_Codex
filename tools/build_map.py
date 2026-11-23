"""Genera src/data/map-data.js a partir de las fuentes editables de tools/maps/."""
import json
from pathlib import Path

tools = Path(__file__).resolve().parent
root = tools.parent
floors = [json.loads((tools / "maps" / name).read_text(encoding="utf-8"))
          for name in ["mansion-1f.json", "mansion-2f.json"]]
assert floors[0]["stairs"] == floors[1]["stairs"], "La escalera debe coincidir en ambos pisos"
payload = json.dumps(floors, ensure_ascii=False, separators=(",", ":"))
(root / "src" / "data" / "map-data.js").write_text(
    "// Generado por tools/build_map.py. No editar a mano.\n"
    "globalThis.UMBRA_FLOORS = " + payload + ";\n"
    "globalThis.UMBRA_MAP = globalThis.UMBRA_FLOORS[0];\n", encoding="utf-8")
print("Mansión: 2 pisos generados en src/data/map-data.js; escalera en", floors[0]["stairs"])
