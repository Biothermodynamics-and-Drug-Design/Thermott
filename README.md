# Thermott

## About
This is a web application for analysing differential scanning fluorimetry/thermal shift assay/Thermofluor experiment data. It comprises of two parts: frontend (Vue.js) and backend (Python FastAPI).

The web application is hosted at [thermott.com](https://thermott.com)

## Getting started

* Backend server requirements
    - [Poetry, package manager](https://python-poetry.org/)
    - [Python 3.9](https://www.python.org/)
```
# navigate to 'server' folder
# Run commands:
poetry install
poetry shell
uvicorn main:app --reload --port 5000
```


* Frontend client requirements
    - [Node 16](https://nodejs.org/en/)
    - [pnpm](https://pnpm.io/installation) (should also work with npm)
```
# navigate to 'client' folder
# Run commands:
pnpm install
pnpm vite dev
```

Going to `http://localhost:8080/` url should open the web app.
