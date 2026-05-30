from pathlib import Path

BACKEND_ROOT = Path(__file__).resolve().parents[2]

DEFAULT_ITEM_DEFINITIONS = (
    {
        "name": "Chicken",
        "tamil_name": "தோலுடன்",
        "unit_type": "WEIGHT",
        "base_unit": "KG",
        "sort_order": 10,
        "category": "Chicken",
        "image_path": BACKEND_ROOT / "assets/chicken-with-skin.jpeg",
    },
    {
        "name": "Chicken without skin",
        "tamil_name": "உறித்தது",
        "unit_type": "WEIGHT",
        "base_unit": "KG",
        "sort_order": 20,
        "category": "Chicken",
        "image_path": BACKEND_ROOT / "assets/chicken-without-skin.jpeg",
    },
    {
        "name": "Duck",
        "tamil_name": "வாத்து",
        "unit_type": "COUNT",
        "base_unit": "UNIT",
        "sort_order": 40,
        "category": "Duck",
        "image_path": BACKEND_ROOT / "assets/duck.jpeg",
    },
    {
        "name": "Country Chicken",
        "tamil_name": "நாட்டுக்கோழி",
        "unit_type": "WEIGHT",
        "base_unit": "KG",
        "sort_order": 30,
        "category": "Chicken",
        "image_path": BACKEND_ROOT / "assets/country-chicken.jpeg",
    },
    {
        "name": "Live Country Chicken",
        "tamil_name": "உயிருடன் நாட்டுக்கோழி",
        "unit_type": "WEIGHT",
        "base_unit": "KG",
        "sort_order": 50,
        "category": "Live",
        "image_path": BACKEND_ROOT / "assets/live-country-chicken.jpg",
    },
    {
        "name": "Live Chicken",
        "tamil_name": "உயிருடன் கோழி",
        "unit_type": "WEIGHT",
        "base_unit": "KG",
        "sort_order": 60,
        "category": "Live",
        "image_path": BACKEND_ROOT / "assets/live-chicken.jpeg",
    },
    {
        "name": "Chicken Cleaning",
        "tamil_name": "கோழி சுத்தம்",
        "unit_type": "WEIGHT",
        "base_unit": "KG",
        "sort_order": 70,
        "category": "Service",
        "image_path": BACKEND_ROOT / "assets/chicken-cleaning.jpeg",
    },
)

DEFAULT_ITEM_IMAGE_PATHS = {
    item_definition["name"]: item_definition["image_path"]
    for item_definition in DEFAULT_ITEM_DEFINITIONS
}
