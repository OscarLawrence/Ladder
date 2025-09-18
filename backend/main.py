from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os
from models import LadderInput, LadderResult, TipsYield
from calculator import TipsLadderCalculator

app = FastAPI(title="TIPS Ladder Calculator", version="1.0.0")

# Enable CORS for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:8000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve static files (built frontend)
if os.path.exists("static"):
    app.mount("/static", StaticFiles(directory="static"), name="static")


@app.get("/")
def read_root():
    # Serve the frontend if static files exist, otherwise API info
    if os.path.exists("static/index.html"):
        return FileResponse("static/index.html")
    return {"message": "TIPS Ladder Calculator API", "version": "1.0.0"}

@app.get("/api")
def api_info():
    return {"message": "TIPS Ladder Calculator API", "version": "1.0.0"}


@app.post("/calculate-ladder", response_model=LadderResult)
def calculate_ladder(ladder_input: LadderInput):
    """Calculate TIPS bond ladder based on input parameters"""
    try:
        calculator = TipsLadderCalculator(ladder_input)
        result = calculator.calculate_ladder()
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/sample-yields")
def get_sample_yields():
    """Get sample TIPS yields for testing"""
    return [
        {"maturity_years": 0.5, "yield_rate": 0.015},
        {"maturity_years": 1.5, "yield_rate": 0.011},
        {"maturity_years": 2.5, "yield_rate": 0.011},
        {"maturity_years": 3.5, "yield_rate": 0.012},
        {"maturity_years": 4.5, "yield_rate": 0.012},
        {"maturity_years": 5.5, "yield_rate": 0.013},
        {"maturity_years": 6.5, "yield_rate": 0.015},
        {"maturity_years": 7.5, "yield_rate": 0.016},
        {"maturity_years": 8.5, "yield_rate": 0.017},
        {"maturity_years": 9.5, "yield_rate": 0.018},
        {"maturity_years": 10.5, "yield_rate": 0.018},
    ]