#!/bin/bash

python -m venv .venv
#!/bin/bash
'.venv\Scripts\activate' || '.\venv\Scripts\Activate.ps1' || 'source .venv/bin/activate'

pip install -r requirements.txt

echo "All python packages installed successfully."