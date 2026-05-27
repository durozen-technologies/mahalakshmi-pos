import uvicorn

from app.main import app as fastapi_app

app = fastapi_app


def main() -> None:
    uvicorn.run("main:app", host="0.0.0.0", port=8001, reload=True)


if __name__ == "__main__":
    main()
