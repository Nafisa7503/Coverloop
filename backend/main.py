
import os
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Header, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from supabase import create_client

from fastapi import Header
import secrets

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

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "X-Demo-Access"],
    expose_headers=["X-Demo-Access"],
)

def require_demo_access(
    x_demo_access: str = Header(default="")
):
    expected = os.getenv("DEMO_ACCESS_CODE", "")

    if not expected or not secrets.compare_digest(
        x_demo_access, expected
    ):
        raise HTTPException(
            status_code=401,
            detail="Access denied"
        )
class CoverageRequest(BaseModel):
    shift_id: int
    employee_name: str = Field(min_length=1, max_length=100)
    role: str = Field(min_length=1, max_length=100)
    shift_date: str = Field(min_length=1, max_length=50)

@app.get("/")
def home():
    return {"message": "CoverLoop backend is running"}

@app.get("/requests")
def get_requests(
    _: None = Depends(require_demo_access)
):
    try:
        result = (
            supabase.table("coverage_requests")
            .select("*")
            .order("created_at", desc=True)
            .execute()
        )
        return result.data
    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Could not retrieve coverage requests"
        )

@app.post("/requests", status_code=201)
@app.post("/requests", status_code=201)
def create_request(
    request: CoverageRequest,
    _: None = Depends(require_demo_access)
):
    
    try:
        result = (
            supabase.table("coverage_requests")
            .insert({
                "shift_id": request.shift_id,
                "employee_name": request.employee_name,
                "role": request.role,
                "shift_date": request.shift_date,
                "status": "Pending"
            })
            .execute()
        )
        return result.data[0]
    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Could not save coverage request"
        )
