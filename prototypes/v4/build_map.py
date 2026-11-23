"""Build browser data from the checked-in, editable map geometry."""
import json
from pathlib import Path
root = Path(__file__).resolve().parent
floors = [json.loads((root / name).read_text(encoding="utf-8"))
          for name in ["map-source.json", "upper-map-source.json"]]
assert floors[0]["stairs"] == floors[1]["stairs"] == [513, 585, 78, 207]
payload = json.dumps(floors, ensure_ascii=False, separators=(",", ":"))
(root / "dist" / "map-data.js").write_text(
    "globalThis.UMBRA_FLOORS = " + payload + ";\n"
    "globalThis.UMBRA_MAP = globalThis.UMBRA_FLOORS[0];\n", encoding="utf-8")
print("Built two connected floors; shared staircase at x=513 (+40 u).")
