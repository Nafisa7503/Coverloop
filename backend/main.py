
import os
from datetime import date
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, ConfigDict, field_validator
from supabase import create_client

load_dotenv()

supabase = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global supabase

    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_KEY")

    if not url or not key:
        raise RuntimeError("Missing Supabase environment variables")

    supabase = create_client(url, key)
    yield


app = FastAPI(title="CoverLoop API", lifespan=lifespan)

frontend_url = os.getenv("FRONTEND_URL", "").rstrip("/")

allowed_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

if frontend_url:
    allowed_origins.append(frontend_url)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)


class CoverageRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    shift_id: int = Field(ge=1, le=10000)
    employee_name: str = Field(min_length=1, max_length=80)
    role: str = Field(min_length=1, max_length=60)
    shift_date: date

    @field_validator("employee_name", "role")
    @classmethod
    def validate_text(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("This field cannot be blank")
        return value


@app.get("/")
def home():
    return {"message": "CoverLoop backend is running"}


@app.get("/requests")
def get_requests():
    try:
        result = (
            supabase.table("coverage_requests")
            .select("*")
            .order("created_at", desc=True)
            .limit(100)
            .execute()
        )
        return result.data

    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Could not retrieve coverage requests",
        )


@app.post("/requests", status_code=201)
def create_request(request: CoverageRequest):
    try:
        data = request.model_dump(mode="json")
        data["status"] = "Pending"

        result = (
            supabase.table("coverage_requests")
            .insert(data)
            .execute()
        )

        return result.data[0]

    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Could not save coverage request",
        )
