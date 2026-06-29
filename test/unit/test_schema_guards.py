from sqlalchemy import create_engine, inspect, text

from app.db.schema_guards import _ensure_inventory_vehicle_number_column


def test_inventory_vehicle_number_guard_adds_missing_column() -> None:
    engine = create_engine("sqlite:///:memory:", future=True)
    with engine.begin() as conn:
        conn.execute(
            text(
                """
                CREATE TABLE inventory_movements (
                    id CHAR(32) PRIMARY KEY
                )
                """
            )
        )

        _ensure_inventory_vehicle_number_column(conn)

        columns = {column["name"]: column["type"] for column in inspect(conn).get_columns("inventory_movements")}
        assert "vehicle_number" in columns
        assert getattr(columns["vehicle_number"], "length", None) == 120

    engine.dispose()
