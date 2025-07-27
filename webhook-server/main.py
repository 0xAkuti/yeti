import logging
import sys
import uvicorn
from webhook_server import create_app

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)

# Create the FastAPI application
app = create_app()

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=3001)
